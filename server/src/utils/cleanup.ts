/**
 * Periodic cleanup tasks for database maintenance
 */

import { query } from '../db/database.js';

/**
 * Remove expired tokens from the blacklist
 * This should be run periodically to prevent the table from growing indefinitely
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    // Use CURRENT_TIMESTAMP which works in both SQLite and PostgreSQL
    const result = await query(
      "DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP"
    );
    const count = result.rowCount ?? 0;
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired tokens from blacklist`);
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}

/**
 * Start periodic cleanup tasks
 * Runs cleanup jobs at specified intervals
 */
export function startCleanupTasks(): void {
  // Run token cleanup every hour
  const ONE_HOUR = 60 * 60 * 1000;

  // Run immediately on startup
  cleanupExpiredTokens();

  // Then run every hour
  setInterval(() => {
    cleanupExpiredTokens();
  }, ONE_HOUR);

  console.log('✅ Cleanup tasks scheduled');
}
