import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { query } from '../db/database.js';
import { getJWTSecret } from '../config/security.js';
import { authenticateToken, blacklistToken, type AuthRequest } from '../middleware/auth.js';
import passport from '../config/passport.js';

const router = express.Router();

// Helper function to create a sample trade for new users
export async function createSampleTrade(userId: number) {
  try {
    const sampleTrade = {
      userId,
      symbol: 'AAPL',
      side: 'LONG',
      entryDate: '2024-10-15T09:30:00',
      exitDate: '2024-10-15T15:45:00',
      entryPrice: 178.50,
      exitPrice: 182.75,
      quantity: 100,
      stopLoss: 176.00,
      takeProfit: 183.00,
      fees: 2.50,
      status: 'CLOSED',
      strategy: 'Momentum Trading',
      setup: 'Bull Flag Breakout',
      timeframe: '5m',
      marketType: 'STOCKS',
      broker: 'Interactive Brokers',
      entryReasoning: '📝 SAMPLE TRADE - This is an example trade to show you how the journal works. Feel free to delete it and add your own trades!\\n\\nEntry Reasoning: Strong bullish momentum after breaking above the 50-day moving average. Volume spike confirmed the breakout with positive market sentiment.',
      exitReasoning: 'Target reached at resistance level. Took profit as planned at $182.75, which was 2.4x the risk.',
      notes: '✨ Welcome to your Trading Journal! This is a sample trade to help you get started. You can edit or delete it anytime.\\n\\nGreat execution on this trade. Entry was well-timed after confirmation candle.',
      confidenceLevel: 8,
      emotionalState: 'Calm and focused'
    };

    // Calculate P&L
    const pnl = (sampleTrade.exitPrice - sampleTrade.entryPrice) * sampleTrade.quantity - sampleTrade.fees;

    await query(
      `INSERT INTO trades (
        user_id, symbol, side, entry_date, exit_date, entry_price, exit_price,
        quantity, stop_loss, take_profit, fees, pnl, status,
        strategy, setup, timeframe, market_type, broker, entry_reasoning,
        exit_reasoning, notes, confidence_level, emotional_state
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [
        sampleTrade.userId, sampleTrade.symbol, sampleTrade.side, sampleTrade.entryDate,
        sampleTrade.exitDate, sampleTrade.entryPrice, sampleTrade.exitPrice, sampleTrade.quantity,
        sampleTrade.stopLoss, sampleTrade.takeProfit, sampleTrade.fees, pnl,
        sampleTrade.status, sampleTrade.strategy, sampleTrade.setup, sampleTrade.timeframe,
        sampleTrade.marketType, sampleTrade.broker, sampleTrade.entryReasoning,
        sampleTrade.exitReasoning, sampleTrade.notes, sampleTrade.confidenceLevel,
        sampleTrade.emotionalState
      ]
    );

    console.log(`✅ Created sample trade for user ${userId}`);
  } catch (error) {
    console.error('Error creating sample trade:', error);
    // Don't throw - we don't want to fail registration if sample trade creation fails
  }
}

const registerSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase().trim()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase().trim()),
  password: z.string(),
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name',
      [email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0] as any;

    // Create default user settings
    await query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [user.id]
    );

    // Create sample trade for new user
    await createSampleTrade(user.id);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0] as any;

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout - Blacklist the token
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || !req.user) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Decode token to get expiration
    const decoded = jwt.decode(token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    // Add token to blacklist
    await blacklistToken(token, req.user.id, expiresAt);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth - Initiate authentication
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

// Google OAuth - Callback handler
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`
  }),
  async (req: any, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=no_user`);
      }

      // Check if this is a new user (created in the last 5 seconds)
      const isNewUser = user.created_at &&
        (new Date().getTime() - new Date(user.created_at).getTime() < 5000);

      if (isNewUser) {
        await createSampleTrade(user.id);
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        getJWTSecret(),
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token in URL
      const userJson = JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePicture: user.profile_picture_url
      });

      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}&user=${encodeURIComponent(userJson)}`
      );
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_callback_failed`);
    }
  }
);

// Get current user info
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, auth_provider, profile_picture_url, email_verified FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0] as any;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        authProvider: user.auth_provider,
        profilePicture: user.profile_picture_url,
        emailVerified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SSO entry point — called by AlphaLabs redirect
// AlphaLabs mints a short-lived JWT (60s) and redirects here
router.get('/sso', async (req, res) => {
  const { token } = req.query as { token?: string };
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const alphalabsUrl = process.env.ALPHALABS_URL || 'https://app.alphalabs.live';

  if (!token) {
    return res.redirect(alphalabsUrl);
  }

  const sharedSecret = process.env.JWT_SHARED_SECRET;
  if (!sharedSecret) {
    console.error('[Journal SSO] JWT_SHARED_SECRET not configured');
    return res.redirect(`${alphalabsUrl}?message=journal_config_error`);
  }

  try {
    const payload = jwt.verify(token, sharedSecret) as {
      userId: string;
      email: string;
      displayName: string;
      picture: string | null;
    };

    const email = payload.email.toLowerCase().trim();

    // Find or create user by email (no password needed — SSO only)
    let existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);

    let userId: number;
    if (existingUser.rows.length > 0) {
      userId = (existingUser.rows[0] as any).id;
    } else {
      // Create journal user linked to AlphaLabs account
      const nameParts = (payload.displayName || email.split('@')[0]).split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // SSO users get a random unusable password hash
      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

      const created = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, auth_provider, profile_picture_url, email_verified)
         VALUES ($1, $2, $3, $4, 'alphalabs_sso', $5, true)
         RETURNING id`,
        [email, randomPassword, firstName, lastName, payload.picture]
      );
      userId = (created.rows[0] as any).id;

      // Create default settings and sample trade for new users
      await query('INSERT INTO user_settings (user_id) VALUES ($1)', [userId]);
      await createSampleTrade(userId);
    }

    // Issue a journal JWT (same as normal login)
    const journalToken = jwt.sign(
      { id: userId, email },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    // Get user info to pass to frontend
    const userResult = await query(
      'SELECT id, email, first_name, last_name, profile_picture_url FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0] as any;

    const userJson = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      profilePicture: user.profile_picture_url,
    }));

    // Reuse the existing AuthCallback page — same pattern as Google OAuth
    res.redirect(`${frontendUrl}/auth/callback?token=${journalToken}&user=${userJson}`);
  } catch (err) {
    console.error('[Journal SSO] Token verification failed:', err);
    res.redirect(`${alphalabsUrl}?message=journal_auth_failed`);
  }
});

export default router;
