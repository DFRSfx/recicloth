import pool from '../config/database.js';
import crypto from 'crypto';
import emailService from '../emailService.js';

interface EmailVerificationResult {
  success: boolean;
  message: string;
}

class EmailVerification {
  /**
   * Gerar token de verificação de email
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Criar token de verificação para novo utilizador
   */
  static async createVerificationToken(userId: number, email: string): Promise<{ token: string; success: boolean }> {
    try {
      const token = this.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      console.log('🔐 Criando token de verificação para user:', userId);
      console.log('📧 Email:', email);
      console.log('🎫 Token:', token);
      console.log('⏰ Expira em:', expiresAt);

      // Inserir token na tabela email_verification_tokens
      await pool.query(
        `INSERT INTO email_verification_tokens (user_id, token, expires_at, is_used) 
         VALUES (?, ?, ?, FALSE)`,
        [userId, token, expiresAt]
      );

      console.log('✅ Token salvo na tabela email_verification_tokens');

      return { token, success: true };
    } catch (error) {
      console.error('Error creating verification token:', error);
      return { token: '', success: false };
    }
  }

  /**
   * Enviar email de verificação
   */
  static async sendVerificationEmail(email: string, token: string, name: string, language: string = 'pt'): Promise<boolean> {
    try {
      await emailService.sendEmailVerification(email, token, name, language);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  /**
   * Verificar token de email
   */
  static async verifyEmailToken(token: string): Promise<EmailVerificationResult> {
    try {
      console.log('🔍 Verificando token:', token);

      // Fetch the token regardless of is_used — we inspect state manually below
      const [tokenRows]: any = await pool.query(
        `SELECT evt.*, u.email, u.email_verified
         FROM email_verification_tokens evt
         JOIN users u ON evt.user_id = u.id
         WHERE evt.token = ?`,
        [token]
      );

      console.log('📊 Resultados da busca:', tokenRows);

      if (tokenRows.length === 0) {
        return {
          success: false,
          message: 'Token inválido ou já utilizado'
        };
      }

      const tokenData = tokenRows[0];

      // Token already consumed — but if the email is verified the goal was reached
      if (tokenData.is_used) {
        if (tokenData.email_verified) {
          return {
            success: true,
            message: 'Email verificado com sucesso!'
          };
        }
        return {
          success: false,
          message: 'Token inválido ou já utilizado'
        };
      }

      // Email already verified via another path (e.g. Google OAuth) and token unused
      // → mark as used and return success so the user sees the correct screen
      if (tokenData.email_verified) {
        await pool.query(
          `UPDATE email_verification_tokens SET is_used = TRUE WHERE id = ?`,
          [tokenData.id]
        );
        console.log('✅ Email já verificado, token marcado como usado para user:', tokenData.user_id);
        return {
          success: true,
          message: 'Email verificado com sucesso!'
        };
      }

      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);

      if (now > expiresAt) {
        return {
          success: false,
          message: 'Token expirado. Por favor, solicite um novo email de verificação.'
        };
      }

      // Mark token as used FIRST — prevents a second concurrent request from also succeeding
      const [updateResult]: any = await pool.query(
        `UPDATE email_verification_tokens SET is_used = TRUE WHERE id = ? AND is_used = FALSE`,
        [tokenData.id]
      );

      if (updateResult.affectedRows === 0) {
        // Another concurrent request beat us to it
        return {
          success: true,
          message: 'Email verificado com sucesso!'
        };
      }

      // Now mark the user's email as verified
      await pool.query(
        `UPDATE users SET email_verified = TRUE, status = 'active' WHERE id = ?`,
        [tokenData.user_id]
      );

      console.log('✅ Email verificado com sucesso para user:', tokenData.user_id);

      return {
        success: true,
        message: 'Email verificado com sucesso!'
      };
    } catch (error) {
      console.error('Error verifying email token:', error);
      return {
        success: false,
        message: 'Erro ao verificar email'
      };
    }
  }

  /**
   * Reenviar email de verificação
   */
  static async resendVerificationEmail(email: string): Promise<EmailVerificationResult> {
    try {
      const [rows]: any = await pool.query(
        `SELECT id, email, name, email_verified 
         FROM users 
         WHERE email = ?`,
        [email]
      );

      if (rows.length === 0) {
        return {
          success: false,
          message: 'Utilizador não encontrado'
        };
      }

      const user = rows[0];

      if (user.email_verified) {
        return {
          success: false,
          message: 'Email já verificado'
        };
      }

      // Criar novo token
      const { token, success } = await this.createVerificationToken(user.id, user.email);
      
      if (!success) {
        return {
          success: false,
          message: 'Erro ao criar token de verificação'
        };
      }

      // Enviar email
      const emailSent = await this.sendVerificationEmail(user.email, token, user.name);

      if (!emailSent) {
        return {
          success: false,
          message: 'Erro ao enviar email'
        };
      }

      return {
        success: true,
        message: 'Email de verificação reenviado com sucesso'
      };
    } catch (error) {
      console.error('Error resending verification email:', error);
      return {
        success: false,
        message: 'Erro ao reenviar email de verificação'
      };
    }
  }
}

export default EmailVerification;
