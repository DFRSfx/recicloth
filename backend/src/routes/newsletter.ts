import express from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import pool from '../config/database.js';
import emailService from '../emailService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { upload } from '../config/upload.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3Upload.js';

const router = express.Router();

// In-memory OTP store for newsletter subscription verification
const newsletterOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();
// Separate store for unsubscribe OTP (prefixed key prevents collisions)
const unsubscribeOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of newsletterOtpStore.entries()) {
    if (val.expiresAt < now) newsletterOtpStore.delete(key);
  }
  for (const [key, val] of unsubscribeOtpStore.entries()) {
    if (val.expiresAt < now) unsubscribeOtpStore.delete(key);
  }
}, 15 * 60 * 1000);

// ── POST /api/newsletter/send-otp ─────────────────────────────────────────────
// Send OTP for newsletter subscription verification
router.post('/send-otp', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, message: 'Email inválido' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if already subscribed and active
  const [existing]: any = await pool.query(
    'SELECT id, is_active FROM newsletter_subscribers WHERE email = ?',
    [normalizedEmail]
  );
  if (existing.length > 0 && existing[0].is_active) {
    res.status(409).json({ success: false, message: 'Este email já está subscrito.' });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  newsletterOtpStore.set(normalizedEmail, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });

  try {
    await emailService.sendNewsletterOtp(normalizedEmail, code);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send newsletter OTP:', err);
    res.status(500).json({ success: false, message: 'Erro ao enviar email de verificação.' });
  }
});

// ── POST /api/newsletter/subscribe ───────────────────────────────────────────
// Verify OTP and subscribe
router.post(
  '/subscribe',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Código inválido'),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, code, user_id } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const entry = newsletterOtpStore.get(normalizedEmail);
    if (!entry) {
      res.status(400).json({ success: false, message: 'Código expirado. Solicite um novo.' });
      return;
    }
    if (entry.expiresAt < Date.now()) {
      newsletterOtpStore.delete(normalizedEmail);
      res.status(400).json({ success: false, message: 'Código expirado. Solicite um novo.' });
      return;
    }
    entry.attempts += 1;
    if (entry.attempts > 5) {
      newsletterOtpStore.delete(normalizedEmail);
      res.status(429).json({ success: false, message: 'Demasiadas tentativas. Solicite um novo código.' });
      return;
    }
    if (entry.code !== code) {
      res.status(400).json({ success: false, message: 'Código incorreto.' });
      return;
    }

    newsletterOtpStore.delete(normalizedEmail);

    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    try {
      // Upsert — re-subscribe if previously unsubscribed
      const [existing]: any = await pool.query(
        'SELECT id FROM newsletter_subscribers WHERE email = ?',
        [normalizedEmail]
      );
      if (existing.length > 0) {
        await pool.execute(
          'UPDATE newsletter_subscribers SET is_active = TRUE, unsubscribed_at = NULL, user_id = COALESCE(?, user_id), unsubscribe_token = ? WHERE email = ?',
          [user_id || null, unsubscribeToken, normalizedEmail]
        );
      } else {
        await pool.execute(
          'INSERT INTO newsletter_subscribers (email, user_id, is_active, unsubscribe_token) VALUES (?, ?, TRUE, ?)',
          [normalizedEmail, user_id || null, unsubscribeToken]
        );
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Newsletter subscribe error:', err);
      res.status(500).json({ success: false, message: 'Erro ao registar subscrição.' });
    }
  }
);

// ── GET /api/newsletter/unsubscribe?token=xxx ─────────────────────────────────
// Unsubscribe via email link
router.get('/unsubscribe', async (req: any, res: any) => {
  const { token } = req.query;
  if (!token) {
    res.status(400).send('Token inválido.');
    return;
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT id, email FROM newsletter_subscribers WHERE unsubscribe_token = ? AND is_active = TRUE',
      [token]
    );
    if (rows.length === 0) {
      res.status(404).send('Subscrição não encontrada ou já cancelada.');
      return;
    }
    await pool.execute(
      "UPDATE newsletter_subscribers SET is_active = FALSE, unsubscribed_at = NOW() WHERE unsubscribe_token = ?",
      [token]
    );
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?unsubscribed=1`);
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).send('Erro ao processar pedido.');
  }
});

// ── POST /api/newsletter/unsubscribe/send-otp ─────────────────────────────────
// Send OTP to verify guest unsubscription
router.post('/unsubscribe/send-otp', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, message: 'Email inválido.' });
    return;
  }
  const normalizedEmail = email.toLowerCase().trim();
  const [rows]: any = await pool.query(
    'SELECT id FROM newsletter_subscribers WHERE email = ? AND is_active = TRUE',
    [normalizedEmail]
  );
  if (rows.length === 0) {
    res.status(404).json({ success: false, message: 'Este email não está subscrito.' });
    return;
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  unsubscribeOtpStore.set(normalizedEmail, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
  try {
    await emailService.sendNewsletterUnsubscribeOtp(normalizedEmail, code);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send unsubscribe OTP:', err);
    res.status(500).json({ success: false, message: 'Erro ao enviar email de verificação.' });
  }
});

// ── POST /api/newsletter/unsubscribe/verify ───────────────────────────────────
// Verify OTP and unsubscribe guest
router.post(
  '/unsubscribe/verify',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Código inválido'),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    const { email, code } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const entry = unsubscribeOtpStore.get(normalizedEmail);
    if (!entry || entry.expiresAt < Date.now()) {
      unsubscribeOtpStore.delete(normalizedEmail);
      res.status(400).json({ success: false, message: 'Código expirado. Solicite um novo.' });
      return;
    }
    entry.attempts += 1;
    if (entry.attempts > 5) {
      unsubscribeOtpStore.delete(normalizedEmail);
      res.status(429).json({ success: false, message: 'Demasiadas tentativas. Solicite um novo código.' });
      return;
    }
    if (entry.code !== code) {
      res.status(400).json({ success: false, message: 'Código incorreto.' });
      return;
    }
    unsubscribeOtpStore.delete(normalizedEmail);
    try {
      await pool.execute(
        "UPDATE newsletter_subscribers SET is_active = FALSE, unsubscribed_at = NOW() WHERE email = ?",
        [normalizedEmail]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Unsubscribe verify error:', err);
      res.status(500).json({ success: false, message: 'Erro ao cancelar subscrição.' });
    }
  }
);

// ── DELETE /api/newsletter/unsubscribe ────────────────────────────────────────
// Unsubscribe authenticated user
router.delete('/unsubscribe', authenticateToken, async (req: any, res: any) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id FROM newsletter_subscribers WHERE user_id = ? AND is_active = TRUE',
      [req.user.id]
    );
    if (rows.length === 0) {
      // Also try by email if user_id didn't match
      const [byEmail]: any = await pool.query(
        'SELECT id FROM newsletter_subscribers WHERE email = ? AND is_active = TRUE',
        [req.user.email]
      );
      if (byEmail.length === 0) {
        res.status(404).json({ success: false, message: 'Subscrição não encontrada.' });
        return;
      }
      await pool.execute(
        "UPDATE newsletter_subscribers SET is_active = FALSE, unsubscribed_at = NOW() WHERE email = ?",
        [req.user.email]
      );
    } else {
      await pool.execute(
        "UPDATE newsletter_subscribers SET is_active = FALSE, unsubscribed_at = NOW() WHERE user_id = ?",
        [req.user.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ success: false, message: 'Erro ao cancelar subscrição.' });
  }
});

// ── GET /api/newsletter/status ────────────────────────────────────────────────
// Check if authenticated user is subscribed
router.get('/status', authenticateToken, async (req: any, res: any) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT is_active FROM newsletter_subscribers WHERE user_id = ? OR email = ? LIMIT 1',
      [req.user.id, req.user.email]
    );
    res.json({ subscribed: rows.length > 0 && rows[0].is_active });
  } catch (err) {
    res.status(500).json({ subscribed: false });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── GET /api/newsletter/admin/subscribers ─────────────────────────────────────
router.get('/admin/subscribers', requireAdmin, async (_req: any, res: any) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT ns.id, ns.email, ns.is_active, ns.subscribed_at, ns.unsubscribed_at,
              u.name AS user_name
       FROM newsletter_subscribers ns
       LEFT JOIN users u ON ns.user_id = u.id
       ORDER BY ns.subscribed_at DESC`
    );
    res.json({ subscribers: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar subscritores.' });
  }
});

// ── GET /api/newsletter/admin/campaigns ───────────────────────────────────────
router.get('/admin/campaigns', requireAdmin, async (_req: any, res: any) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, subject, status, sent_at, sent_count, created_at, updated_at FROM newsletter_campaigns ORDER BY created_at DESC'
    );
    res.json({ campaigns: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar campanhas.' });
  }
});

// ── GET /api/newsletter/admin/campaigns/:id ───────────────────────────────────
router.get('/admin/campaigns/:id', requireAdmin, async (req: any, res: any) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM newsletter_campaigns WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Campanha não encontrada.' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar campanha.' });
  }
});

// ── POST /api/newsletter/admin/campaigns ──────────────────────────────────────
router.post(
  '/admin/campaigns',
  requireAdmin,
  [
    body('subject').trim().notEmpty().withMessage('Assunto obrigatório'),
    body('content_html').trim().notEmpty().withMessage('Conteúdo obrigatório'),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const { subject, content_html } = req.body;
      const [result]: any = await pool.execute(
        "INSERT INTO newsletter_campaigns (subject, content_html) VALUES (?, ?)",
        [subject.trim(), content_html.trim()]
      );
      res.status(201).json({ id: result.insertId, success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar campanha.' });
    }
  }
);

// ── PUT /api/newsletter/admin/campaigns/:id ───────────────────────────────────
router.put(
  '/admin/campaigns/:id',
  requireAdmin,
  [
    body('subject').trim().notEmpty().withMessage('Assunto obrigatório'),
    body('content_html').trim().notEmpty().withMessage('Conteúdo obrigatório'),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const [existing]: any = await pool.query(
        'SELECT id, status FROM newsletter_campaigns WHERE id = ?',
        [req.params.id]
      );
      if (existing.length === 0) {
        res.status(404).json({ error: 'Campanha não encontrada.' });
        return;
      }
      if (existing[0].status === 'sent') {
        res.status(400).json({ error: 'Não é possível editar uma campanha já enviada.' });
        return;
      }
      const { subject, content_html } = req.body;
      await pool.execute(
        "UPDATE newsletter_campaigns SET subject = ?, content_html = ?, updated_at = NOW() WHERE id = ?",
        [subject.trim(), content_html.trim(), req.params.id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar campanha.' });
    }
  }
);

// ── DELETE /api/newsletter/admin/campaigns/:id ────────────────────────────────
router.delete('/admin/campaigns/:id', requireAdmin, async (req: any, res: any) => {
  try {
    const [result]: any = await pool.execute(
      'DELETE FROM newsletter_campaigns WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Campanha não encontrada.' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao eliminar campanha.' });
  }
});

// ── POST /api/newsletter/admin/campaigns/:id/send ─────────────────────────────
router.post('/admin/campaigns/:id/send', requireAdmin, async (req: any, res: any) => {
  try {
    const [campaigns]: any = await pool.query(
      'SELECT * FROM newsletter_campaigns WHERE id = ?',
      [req.params.id]
    );
    if (campaigns.length === 0) {
      res.status(404).json({ error: 'Campanha não encontrada.' });
      return;
    }
    const campaign = campaigns[0];
    if (campaign.status === 'sent') {
      res.status(400).json({ error: 'Esta campanha já foi enviada.' });
      return;
    }

    const [subscribers]: any = await pool.query(
      'SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE is_active = TRUE'
    );

    if (subscribers.length === 0) {
      res.status(400).json({ error: 'Sem subscritores ativos.' });
      return;
    }

    // Mark as sent optimistically before starting (prevents duplicate sends if admin retries)
    await pool.execute(
      "UPDATE newsletter_campaigns SET status = 'sent', sent_at = NOW() WHERE id = ?",
      [campaign.id]
    );

    // Send all emails BEFORE responding — serverless functions are killed after res.json().
    // Batches of 5 in parallel with 300ms between batches to respect Resend rate limits.
    const BATCH_SIZE = 5;
    let sentCount = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((sub: any) =>
          emailService.sendNewsletterCampaign(
            sub.email,
            campaign.subject,
            campaign.content_html,
            sub.unsubscribe_token
          )
        )
      );
      sentCount += results.filter(r => r.status === 'fulfilled').length;
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          console.error(`❌ Failed to send newsletter to ${batch[idx].email}:`, r.reason);
        }
      });
      // Pause between batches (skip pause after the last batch)
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // Update final sent count
    await pool.execute(
      "UPDATE newsletter_campaigns SET sent_count = ? WHERE id = ?",
      [sentCount, campaign.id]
    );
    console.log(`✅ Newsletter campaign ${campaign.id} sent to ${sentCount}/${subscribers.length} subscribers`);

    // Respond only after everything is done
    res.json({ success: true, total: subscribers.length, sent: sentCount });
  } catch (err) {
    console.error('Send campaign error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao enviar campanha.' });
    }
  }
});

// ── POST /api/newsletter/admin/upload-image ───────────────────────────────────
// Upload image to S3 newsletters/ folder
router.post(
  '/admin/upload-image',
  requireAdmin,
  upload.single('image'),
  async (req: any, res: any) => {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      return;
    }
    try {
      const { default: sharp } = await import('sharp');
      const timestamp = Date.now();
      const filename = `newsletters/${timestamp}.webp`;

      const processed = await sharp(req.file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const path = await uploadToS3(processed, filename);
      const backendUrl = process.env.BACKEND_URL ||
        process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
        '';
      const url = `${backendUrl}/api/images/newsletters/${timestamp}.webp`;
      res.json({ success: true, url, path });
    } catch (err: any) {
      console.error('Newsletter image upload error:', err);
      res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
    }
  }
);

export default router;
