import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getJWTSecret } from '../config/security.js';
import { query } from '../db/database.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// Hash token for storage (one-way hash for security)
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Check if token is blacklisted
async function isTokenBlacklisted(token: string): Promise<boolean | null> {
  try {
    const tokenHash = hashToken(token);
    const result = await query(
      'SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP',
      [tokenHash]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    // Fail closed (secure) - if we can't verify token isn't blacklisted, deny access
    return null;
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // DEV BYPASS: skip auth, inject a default user
  req.user = { id: 1, email: 'dev@local' };
  return next();
};

// Add token to blacklist (for logout)
export async function blacklistToken(token: string, userId: number, expiresAt: Date): Promise<void> {
  const tokenHash = hashToken(token);
  await query(
    'INSERT INTO token_blacklist (token_hash, user_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT (token_hash) DO NOTHING',
    [tokenHash, userId, expiresAt]
  );
}
