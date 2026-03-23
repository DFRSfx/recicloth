import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Track processed authorization codes to prevent duplicate usage
const processedCodes = new Map<string, number>();

// Clean up old codes every 5 minutes (codes expire after a few minutes anyway)
setInterval(() => {
  const now = Date.now();
  for (const [code, timestamp] of processedCodes.entries()) {
    if (now - timestamp > 5 * 60 * 1000) { // 5 minutes
      processedCodes.delete(code);
    }
  }
}, 5 * 60 * 1000);

// Google OAuth Login/Register
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ error: 'Credential é obrigatório' });
      return;
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }

    const { email, name, email_verified, sub: googleId, picture } = payload;

    // Check if email is verified by Google
    if (!email_verified) {
      res.status(400).json({ error: 'Email do Google não verificado' });
      return;
    }

    // Check if user exists
    const [existingUsers]: any = await pool.query(
      'SELECT id, email, name, role, status, email_verified, google_id, avatar_url FROM users WHERE email = ?',
      [email]
    );

    let userId: number;
    let userRole: string;
    let userName: string;
    let isEmailVerified: boolean;
    let userAvatarUrl: string | null;

    if (existingUsers.length > 0) {
      // User exists - update Google ID if not set
      const user = existingUsers[0];
      userId = user.id;
      userRole = user.role;
      userName = user.name;
      isEmailVerified = user.email_verified;
      userAvatarUrl = user.avatar_url || picture || null;

      // Check if account is suspended
      if (user.status === 'suspended' || user.status === 'inactive') {
        res.status(401).json({ error: 'Conta suspensa ou inativa' });
        return;
      }

      // Update Google ID and verify email if logging in with Google
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = ?, email_verified = TRUE, status = ? WHERE id = ?',
          [googleId, user.status === 'pending' ? 'active' : user.status, userId]
        );
        isEmailVerified = true;
      } else if (!user.email_verified) {
        // If email wasn't verified before, verify it now
        await pool.query(
          'UPDATE users SET email_verified = TRUE, status = ? WHERE id = ?',
          [user.status === 'pending' ? 'active' : user.status, userId]
        );
        isEmailVerified = true;
      }
    } else {
      // Create new user with Google account
      // Google-authenticated users are automatically verified and active
      try {
        const [result]: any = await pool.query(
          'INSERT INTO users (email, name, role, status, email_verified, google_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [email, name || 'User', 'customer', 'active', true, googleId, picture || null]
        );

        userId = result.insertId;
        userRole = 'customer';
        userName = name || 'User';
        isEmailVerified = true;
        userAvatarUrl = picture || null;
      } catch (insertError: any) {
        // If duplicate entry (race condition), try to fetch the user again
        if (insertError.code === 'ER_DUP_ENTRY') {
          const [retryUsers]: any = await pool.query(
            'SELECT id, email, name, role, status, email_verified, google_id, avatar_url FROM users WHERE email = ?',
            [email]
          );

          if (retryUsers.length > 0) {
            const user = retryUsers[0];
            userId = user.id;
            userRole = user.role;
            userName = user.name;
            isEmailVerified = user.email_verified;
            userAvatarUrl = user.avatar_url || picture || null;
          } else {
            throw insertError;
          }
        } else {
          throw insertError;
        }
      }
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const token = jwt.sign(
      {
        userId,
        email,
        role: userRole,
        emailVerified: isEmailVerified
      },
      jwtSecret,
      { expiresIn: 604800 } // 7 days in seconds
    );

    res.json({
      message: 'Login efetuado com sucesso',
      token,
      user: {
        id: userId,
        email,
        name: userName,
        role: userRole,
        emailVerified: isEmailVerified,
        hasPassword: false,
        avatarUrl: userAvatarUrl
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Erro ao autenticar com Google' });
  }
});

// Google OAuth with Authorization Code (for popup/redirect flow)
router.post('/callback', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Authorization code é obrigatório' });
      return;
    }

    // Validate redirect_uri
    if (!redirect_uri) {
      res.status(400).json({ error: 'redirect_uri é obrigatório' });
      return;
    }

    // Check if this code has already been processed
    if (processedCodes.has(code)) {
      console.log('⚠️  Authorization code already processed, rejecting duplicate request');
      res.status(400).json({ error: 'Authorization code já foi utilizado' });
      return;
    }

    // Mark code as being processed
    processedCodes.set(code, Date.now());

    console.log('🔐 Google OAuth callback - code:', code.substring(0, 20) + '...');
    console.log('🔐 Google OAuth callback - redirect_uri:', redirect_uri);

    // Exchange authorization code for tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri
    });

    if (!tokens.id_token) {
      res.status(400).json({ error: 'ID token não recebido' });
      return;
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }

    const { email, name, email_verified, sub: googleId, picture } = payload;

    // Check if email is verified by Google
    if (!email_verified) {
      res.status(400).json({ error: 'Email do Google não verificado' });
      return;
    }

    // Check if user exists
    const [existingUsers]: any = await pool.query(
      'SELECT id, email, name, role, status, email_verified, google_id, avatar_url FROM users WHERE email = ?',
      [email]
    );

    let userId: number;
    let userRole: string;
    let userName: string;
    let isEmailVerified: boolean;
    let userAvatarUrl: string | null;

    if (existingUsers.length > 0) {
      // User exists - update Google ID if not set
      const user = existingUsers[0];
      userId = user.id;
      userRole = user.role;
      userName = user.name;
      isEmailVerified = user.email_verified;
      userAvatarUrl = user.avatar_url || picture || null;

      // Check if account is suspended
      if (user.status === 'suspended' || user.status === 'inactive') {
        res.status(401).json({ error: 'Conta suspensa ou inativa' });
        return;
      }

      // Update Google ID and verify email if logging in with Google
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = ?, email_verified = TRUE, status = ? WHERE id = ?',
          [googleId, user.status === 'pending' ? 'active' : user.status, userId]
        );
        isEmailVerified = true;
      } else if (!user.email_verified) {
        // If email wasn't verified before, verify it now
        await pool.query(
          'UPDATE users SET email_verified = TRUE, status = ? WHERE id = ?',
          [user.status === 'pending' ? 'active' : user.status, userId]
        );
        isEmailVerified = true;
      }
    } else {
      // Create new user with Google account
      // Google-authenticated users are automatically verified and active
      try {
        const [result]: any = await pool.query(
          'INSERT INTO users (email, name, role, status, email_verified, google_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [email, name || 'User', 'customer', 'active', true, googleId, picture || null]
        );

        userId = result.insertId;
        userRole = 'customer';
        userName = name || 'User';
        isEmailVerified = true;
        userAvatarUrl = picture || null;
      } catch (insertError: any) {
        // If duplicate entry (race condition), try to fetch the user again
        if (insertError.code === 'ER_DUP_ENTRY') {
          const [retryUsers]: any = await pool.query(
            'SELECT id, email, name, role, status, email_verified, google_id, avatar_url FROM users WHERE email = ?',
            [email]
          );

          if (retryUsers.length > 0) {
            const user = retryUsers[0];
            userId = user.id;
            userRole = user.role;
            userName = user.name;
            isEmailVerified = user.email_verified;
            userAvatarUrl = user.avatar_url || picture || null;
          } else {
            throw insertError;
          }
        } else {
          throw insertError;
        }
      }
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const token = jwt.sign(
      {
        userId,
        email,
        role: userRole,
        emailVerified: isEmailVerified
      },
      jwtSecret,
      { expiresIn: 604800 } // 7 days in seconds
    );

    res.json({
      message: 'Login efetuado com sucesso',
      token,
      user: {
        id: userId,
        email,
        name: userName,
        role: userRole,
        emailVerified: isEmailVerified,
        hasPassword: false,
        avatarUrl: userAvatarUrl
      }
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ error: 'Erro ao autenticar com Google' });
  }
});

export default router;
