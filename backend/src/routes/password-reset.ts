import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import emailService from '../emailService.js';
import { validatePasswordMiddleware } from '../middleware/passwordValidator.js';

const router = express.Router();

// Função auxiliar para obter IP do cliente
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    'unknown';
};

/**
 * POST /api/password-reset/forgot-password
 * Endpoint para solicitar redefinição de senha
 */
router.post('/forgot-password',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido')
  ],
  async (req: Request, res: Response) => {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Email inválido'
        });
      }

      const { email, language = 'pt' } = req.body;
      const clientIp = getClientIp(req);

      // Verificar rate limiting
      const rateLimitCheck = await PasswordReset.checkRateLimit(clientIp, email);

      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: rateLimitCheck.message
        });
      }

      // SEMPRE retornar mensagem neutra, independentemente se o email existe
      const neutralMessage = 'Se existir uma conta associada a este email, enviaremos um link para redefinir a sua palavra-passe.';

      // Buscar utilizador
      const user = await User.findByEmail(email);

      // Se o utilizador existir, criar token e enviar email
      if (user) {
        console.log(`🔍 User found:`, {
          id: user.id,
          email: email,
          name: user.name
        });

        // Gerar token de reset
        const { token, expiresAt } = await PasswordReset.createToken(user.id, 15);
        console.log(`🔍 Token generated:`, {
          tokenLength: token.length,
          expiresAt: expiresAt
        });

        // Enviar email (não aguardar para não revelar se o email existe)
        console.log(`📧 Starting email send to ${email} in language ${language}...`);
        emailService.sendPasswordResetEmail(email, token, user.name, language)
          .then((result) => {
            console.log('✅ Email sent successfully:', result);
          })
          .catch(err => {
            console.error('❌ Error sending reset email:', err);
          });

        console.log(`✅ Reset token created for ${email}, expires at ${expiresAt}`);
      } else {
        console.log(`⚠️ Reset attempt for non-existent email: ${email}`);
      }

      // Sempre retornar resposta neutra após um pequeno delay (prevenir timing attack)
      setTimeout(() => {
        res.status(200).json({
          success: true,
          message: neutralMessage
        });
      }, Math.random() * 100 + 50); // 50-150ms de delay aleatório

    } catch (error) {
      console.error('Error in forgot-password:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar pedido. Tente novamente mais tarde.'
      });
    }
  }
);

/**
 * GET /api/password-reset/validate-token/:token
 * Endpoint para validar se o token é válido
 */
router.get('/validate-token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 32) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Validar token
    const tokenData = await PasswordReset.validateToken(token);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Token válido
    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        email: tokenData.email,
        expiresAt: tokenData.expires_at
      }
    });

  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar token'
    });
  }
});

/**
 * POST /api/password-reset/reset-password
 * Endpoint para redefinir a senha
 */
router.post('/reset-password',
  [
    body('token')
      .isLength({ min: 32 })
      .withMessage('Token inválido'),
    body('newPassword')
      .notEmpty()
      .withMessage('Nova senha é obrigatória'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirmação de senha é obrigatória')
  ],
  validatePasswordMiddleware, // Valida senha forte
  async (req: Request, res: Response) => {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { token, newPassword, language = 'pt' } = req.body;

      // Validar token
      const tokenData = await PasswordReset.validateToken(token);

      if (!tokenData) {
        // Incrementar tentativa se o token existe (mas expirou ou foi usado)
        await PasswordReset.incrementAttempts(token).catch(() => { });

        return res.status(400).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }

      // Atualizar senha do utilizador
      await User.updatePassword(tokenData.user_id, newPassword);

      // Marcar token como usado
      await PasswordReset.markAsUsed(token);

      // Resetar rate limit
      const clientIp = getClientIp(req);
      await PasswordReset.resetRateLimit(clientIp, tokenData.email);

      // Enviar email de confirmação (não aguardar)
      emailService.sendPasswordChangedNotification(tokenData.email, tokenData.nome, language)
        .catch(err => {
          console.error('Error sending confirmation email:', err);
        });

      console.log(`✅ Password reset successfully for ${tokenData.email}`);

      res.status(200).json({
        success: true,
        message: 'A sua palavra-passe foi redefinida com sucesso'
      });

    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao redefinir senha. Tente novamente mais tarde.'
      });
    }
  }
);

export default router;
