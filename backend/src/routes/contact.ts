import express from 'express';
import emailService from '../emailService.js';

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }

  try {
    await emailService.sendContactMessage({ name, email, subject, message });
    res.json({ success: true });
  } catch (err: any) {
    console.error('❌ Contact email error:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
