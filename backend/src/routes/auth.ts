import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import EmailVerification from '../models/EmailVerification.js';
import emailService from '../emailService.js';

// In-memory OTP store for guest email verification
const guestOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();
// Cleanup expired entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of guestOtpStore.entries()) {
    if (val.expiresAt < now) guestOtpStore.delete(key);
  }
}, 15 * 60 * 1000);

const router = express.Router();

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email válido é obrigatório'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password deve ter no mínimo 6 caracteres'),
    body('name').trim().notEmpty().withMessage('Nome é obrigatório')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const [existingUsers]: any = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        res.status(400).json({ error: 'Email já registado' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with email_verified = FALSE and pending status
      const [result]: any = await pool.query(
        'INSERT INTO users (email, password, name, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, name, 'customer', 'pending', false]
      );

      const userId = result.insertId;

      // Create verification token
      const { token: verificationToken, success } = await EmailVerification.createVerificationToken(userId, email);
      
      if (!success) {
        // Rollback - delete user if token creation fails
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.status(500).json({ error: 'Erro ao criar token de verificação' });
        return;
      }

      // Send verification email
      const emailSent = await EmailVerification.sendVerificationEmail(email, verificationToken, name, 'pt');
      
      if (!emailSent) {
        console.error('Failed to send verification email, but user created');
      }

      // NÃO retornar token - user precisa verificar email primeiro
      res.status(201).json({
        message: 'Conta criada! Por favor, verifique o seu email para ativar a conta.',
        email,
        requiresEmailVerification: true
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Erro ao criar utilizador' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email válido é obrigatório'),
    body('password').notEmpty().withMessage('Password é obrigatória')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Find user
      const [rows]: any = await pool.query(
        'SELECT id, email, password, name, role, status, email_verified, avatar_url FROM users WHERE email = ?',
        [email]
      );

      if (rows.length === 0) {
        res.status(401).json({ error: 'Email ou password incorretos' });
        return;
      }

      const user = rows[0];

      // Check if account is active or pending (pending is allowed if email is verified)
      if (user.status === 'suspended' || user.status === 'inactive') {
        res.status(401).json({ error: 'Conta suspensa ou inativa' });
        return;
      }

      // BLOQUEAR login se email NÃO está verificado (independente do status)
      if (!user.email_verified) {
        res.status(401).json({ 
          error: 'Por favor, verifique o seu email antes de fazer login',
          requiresEmailVerification: true,
          email: user.email
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Email ou password incorretos' });
        return;
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'default-secret';
      // @ts-ignore - JWT typing issue with expiresIn
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.email_verified
        },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        message: 'Login efetuado com sucesso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.email_verified,
          hasPassword: true,
          avatarUrl: user.avatar_url || null
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }
);

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const [rows]: any = await pool.query(
      'SELECT id, email, name, role, created_at, avatar_url, (password IS NOT NULL AND password != \'\') as has_password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Utilizador não encontrado' });
      return;
    }

    const { has_password, avatar_url, ...rest } = rows[0];
    res.json({ ...rest, hasPassword: !!has_password, avatarUrl: avatar_url || null });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao obter utilizador' });
  }
});

// Verify token (for frontend)
router.post('/verify', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Verify email with token
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token é obrigatório' });
      return;
    }

    const result = await EmailVerification.verifyEmailToken(token);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({ message: result.message });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Erro ao verificar email' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    const result = await EmailVerification.resendVerificationEmail(email);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({ message: result.message });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Erro ao reenviar email de verificação' });
  }
});

// POST /auth/guest-otp/send
router.post('/guest-otp/send', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, message: 'Invalid email' });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  guestOtpStore.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });

  try {
    await emailService.sendGuestOtp(email, code);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send guest OTP:', err);
    res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
});

// POST /auth/guest-otp/verify
router.post('/guest-otp/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ success: false, message: 'Email and code required' });
    return;
  }

  const key = email.toLowerCase();
  const entry = guestOtpStore.get(key);

  if (!entry) {
    res.status(400).json({ success: false, message: 'No verification pending for this email' });
    return;
  }

  if (Date.now() > entry.expiresAt) {
    guestOtpStore.delete(key);
    res.status(400).json({ success: false, message: 'Code expired' });
    return;
  }

  entry.attempts += 1;
  if (entry.attempts > 5) {
    guestOtpStore.delete(key);
    res.status(429).json({ success: false, message: 'Too many attempts' });
    return;
  }

  if (entry.code !== String(code)) {
    res.status(400).json({ success: false, message: 'Invalid code' });
    return;
  }

  guestOtpStore.delete(key);
  res.json({ success: true });
});

export default router;
