import PasswordReset from './models/PasswordReset';

/**
 * Script para limpar tokens expirados e tentativas antigas
 * Deve ser executado periodicamente (cron job ou scheduled task)
 */
async function cleanup() {
  console.log('🧹 Starting cleanup of expired tokens and old attempts...');

  try {
    // Limpar tokens expirados
    await PasswordReset.cleanupExpiredTokens();
    console.log('✅ Expired tokens cleaned');

    // Limpar tentativas antigas
    await PasswordReset.cleanupOldAttempts();
    console.log('✅ Old attempts cleaned');

    console.log('✅ Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();
