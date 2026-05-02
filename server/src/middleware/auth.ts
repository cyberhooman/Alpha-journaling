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

// In-memory blacklist cache: tokenHash -> cache entry expiry (ms timestamp)
// Avoids a DB round-trip on every request while still being secure.
const blacklistCache = new Map<string, number>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Periodically evict expired cache entries to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [hash, expiry] of blacklistCache.entries()) {
    if (now > expiry) blacklistCache.delete(hash);
  }
}, CACHE_TTL_MS);

// Check if token is blacklisted (cache-first, then DB)
async function isTokenBlacklisted(token: string): Promise<boolean | null> {
  try {
    const tokenHash = hashToken(token);

    // Serve from cache when possible
    const cached = blacklistCache.get(tokenHash);
    if (cached !== undefined) {
      return Date.now() < cached; // true = still blacklisted
    }

    const result = await query(
      'SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP',
      [tokenHash]
    );
    const isBlacklisted = result.rows.length > 0;

    if (isBlacklisted) {
      blacklistCache.set(tokenHash, Date.now() + CACHE_TTL_MS);
    }

    return isBlacklisted;
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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as { id: number; email: string };

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted === null) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    req.user = { id: decoded.id, email: decoded.email };
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
