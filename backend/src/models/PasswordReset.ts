import pool from '../config/database';
import crypto from 'crypto';

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  attempts: number;
  is_used: boolean;
  created_at: Date;
}

export interface PasswordResetAttempt {
  id: number;
  ip_address: string;
  email: string;
  attempt_count: number;
  blocked_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TokenValidationResult {
  user_id: number;
  email: string;
  nome: string;
  expires_at: Date;
}

class PasswordResetModel {
  // Constantes
  private static readonly TOKEN_EXPIRY_MINUTES = 15;
  private static readonly MAX_ATTEMPTS_PER_TOKEN = 5;
  private static readonly MAX_REQUESTS_PER_HOUR = 3;
  private static readonly BLOCK_DURATION_MINUTES = 60;

  /**
   * Gera um token seguro de reset de senha
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Cria hash SHA256 do token
   */
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Cria um novo token de reset
   */
  static async createToken(userId: number, expiryMinutes = this.TOKEN_EXPIRY_MINUTES): Promise<{ token: string; expiresAt: Date }> {
    const token = this.generateSecureToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    // Invalidar tokens anteriores do mesmo usuário
    await pool.execute(
      'UPDATE password_reset_tokens SET is_used = 1 WHERE user_id = ? AND is_used = 0',
      [userId]
    );

    // Criar novo token
    await pool.execute(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );

    return { token, expiresAt };
  }

  /**
   * Valida um token de reset
   */
  static async validateToken(token: string): Promise<TokenValidationResult | null> {
    const tokenHash = this.hashToken(token);

    const [rows]: any = await pool.execute(
      `SELECT prt.*, u.email, u.name as nome 
       FROM password_reset_tokens prt
       INNER JOIN users u ON prt.user_id = u.id
       WHERE prt.token_hash = ? 
       AND prt.is_used = 0 
       AND prt.expires_at > NOW()
       AND prt.attempts < ?`,
      [tokenHash, this.MAX_ATTEMPTS_PER_TOKEN]
    );

    if (rows.length === 0) {
      return null;
    }

    const tokenData = rows[0];

    return {
      user_id: tokenData.user_id,
      email: tokenData.email,
      nome: tokenData.nome,
      expires_at: tokenData.expires_at
    };
  }

  /**
   * Marca um token como usado
   */
  static async markAsUsed(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await pool.execute(
      'UPDATE password_reset_tokens SET is_used = 1 WHERE token_hash = ?',
      [tokenHash]
    );
  }

  /**
   * Incrementa tentativas de uso do token
   */
  static async incrementAttempts(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await pool.execute(
      'UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE token_hash = ?',
      [tokenHash]
    );
  }

  /**
   * Verifica rate limiting por IP e email
   */
  static async checkRateLimit(ipAddress: string, email: string): Promise<{ allowed: boolean; message?: string }> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM password_reset_attempts WHERE ip_address = ? AND email = ?',
      [ipAddress, email]
    );

    if (rows.length === 0) {
      // Primeira tentativa - permitir
      await pool.execute(
        'INSERT INTO password_reset_attempts (ip_address, email, attempt_count) VALUES (?, ?, 1)',
        [ipAddress, email]
      );
      return { allowed: true };
    }

    const attempt = rows[0];

    // Verificar se está bloqueado
    if (attempt.blocked_until && new Date(attempt.blocked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(attempt.blocked_until).getTime() - new Date().getTime()) / 60000);
      return {
        allowed: false,
        message: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).`
      };
    }

    // Verificar se excedeu o limite por hora
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    if (new Date(attempt.updated_at) > oneHourAgo) {
      if (attempt.attempt_count >= this.MAX_REQUESTS_PER_HOUR) {
        // Bloquear por 1 hora
        const blockedUntil = new Date();
        blockedUntil.setMinutes(blockedUntil.getMinutes() + this.BLOCK_DURATION_MINUTES);

        await pool.execute(
          'UPDATE password_reset_attempts SET blocked_until = ? WHERE id = ?',
          [blockedUntil, attempt.id]
        );

        return {
          allowed: false,
          message: `Limite de tentativas excedido. Tente novamente em ${this.BLOCK_DURATION_MINUTES} minutos.`
        };
      }

      // Incrementar contador
      await pool.execute(
        'UPDATE password_reset_attempts SET attempt_count = attempt_count + 1 WHERE id = ?',
        [attempt.id]
      );
    } else {
      // Resetar contador (passou 1 hora)
      await pool.execute(
        'UPDATE password_reset_attempts SET attempt_count = 1, blocked_until = NULL WHERE id = ?',
        [attempt.id]
      );
    }

    return { allowed: true };
  }

  /**
   * Reseta o rate limit para um IP/email (usado após reset bem-sucedido)
   */
  static async resetRateLimit(ipAddress: string, email: string): Promise<void> {
    await pool.execute(
      'DELETE FROM password_reset_attempts WHERE ip_address = ? AND email = ?',
      [ipAddress, email]
    );
  }

  /**
   * Limpa tokens expirados (deve ser executado periodicamente)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    await pool.execute(
      "DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR (is_used = TRUE AND created_at < NOW() - INTERVAL '7 days')"
    );
  }

  /**
   * Limpa tentativas antigas (deve ser executado periodicamente)
   */
  static async cleanupOldAttempts(): Promise<void> {
    await pool.execute(
      "DELETE FROM password_reset_attempts WHERE updated_at < NOW() - INTERVAL '7 days'"
    );
  }
}

export default PasswordResetModel;
