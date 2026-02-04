import { Request, Response, NextFunction, type RequestHandler } from 'express';
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
async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(token);
    const result = await query(
      'SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP',
      [tokenHash]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    // Fail open to prevent blocking all requests if DB is down
    return false;
  }
}

export const authenticateToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authRequest = req as AuthRequest;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Check if token is blacklisted
  if (await isTokenBlacklisted(token)) {
    return res.status(403).json({ error: 'Token has been revoked' });
  }

  try {
    const decoded = jwt.verify(token, getJWTSecret()) as {
      id: number;
      email: string;
    };
    authRequest.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Add token to blacklist (for logout)
export async function blacklistToken(token: string, userId: number, expiresAt: Date): Promise<void> {
  const tokenHash = hashToken(token);
  await query(
    'INSERT INTO token_blacklist (token_hash, user_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT (token_hash) DO NOTHING',
    [tokenHash, userId, expiresAt]
  );
}
