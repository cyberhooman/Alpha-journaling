import express from 'express';
import { z } from 'zod';
import { query } from '../db/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const createStrategySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.enum(['PRICE_ACTION', 'TECHNICAL', 'FUNDAMENTAL', 'SENTIMENT', 'PATTERN', 'INDICATOR', 'CUSTOM']).optional(),
  entry_rules: z.string().optional(),
  exit_rules: z.string().optional(),
  risk_management: z.string().optional(),
  timeframes: z.string().optional(),
  markets: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Get all strategies
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await query(
      'SELECT * FROM trading_strategies WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json(result.rows);
  } catch (error) {
    console.error('Get strategies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single strategy
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const strategyId = parseInt(req.params.id, 10);

    if (isNaN(strategyId)) {
      return res.status(400).json({ error: 'Invalid strategy ID' });
    }

    const result = await query(
      'SELECT * FROM trading_strategies WHERE id = $1 AND user_id = $2',
      [strategyId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get strategy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create strategy
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = createStrategySchema.parse(req.body);

    const result = await query(
      `INSERT INTO trading_strategies (
        user_id, name, description, category, entry_rules, exit_rules,
        risk_management, timeframes, markets, notes, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        userId,
        data.name,
        data.description || null,
        data.category || null,
        data.entry_rules || null,
        data.exit_rules || null,
        data.risk_management || null,
        data.timeframes || null,
        data.markets || null,
        data.notes || null,
        data.is_active ? 1 : 0,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create strategy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update strategy
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const strategyId = parseInt(req.params.id, 10);
    const data = createStrategySchema.partial().parse(req.body);

    if (isNaN(strategyId)) {
      return res.status(400).json({ error: 'Invalid strategy ID' });
    }

    const result = await query(
      `UPDATE trading_strategies
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           entry_rules = COALESCE($4, entry_rules),
           exit_rules = COALESCE($5, exit_rules),
           risk_management = COALESCE($6, risk_management),
           timeframes = COALESCE($7, timeframes),
           markets = COALESCE($8, markets),
           notes = COALESCE($9, notes),
           is_active = COALESCE($10, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [
        data.name,
        data.description,
        data.category,
        data.entry_rules,
        data.exit_rules,
        data.risk_management,
        data.timeframes,
        data.markets,
        data.notes,
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : null,
        strategyId,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update strategy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete strategy
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const strategyId = parseInt(req.params.id, 10);

    if (isNaN(strategyId)) {
      return res.status(400).json({ error: 'Invalid strategy ID' });
    }

    const result = await query(
      'DELETE FROM trading_strategies WHERE id = $1 AND user_id = $2 RETURNING id',
      [strategyId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json({ message: 'Strategy deleted successfully' });
  } catch (error) {
    console.error('Delete strategy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get strategy performance stats
router.get('/:id/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const strategyId = parseInt(req.params.id, 10);

    if (isNaN(strategyId)) {
      return res.status(400).json({ error: 'Invalid strategy ID' });
    }

    // First check if strategy exists
    const strategyCheck = await query(
      'SELECT id FROM trading_strategies WHERE id = $1 AND user_id = $2',
      [strategyId, userId]
    );

    if (strategyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    // Get strategy performance stats from trades
    const result = await query(
      `SELECT
        COUNT(*) as total_trades,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
        CAST(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS REAL) / NULLIF(COUNT(*), 0) as win_rate,
        AVG(CASE WHEN pnl > 0 THEN reward_risk_ratio END) as avg_rr
      FROM trades
      WHERE user_id = $1 AND strategy = (SELECT name FROM trading_strategies WHERE id = $2)
        AND status = 'CLOSED'`,
      [userId, strategyId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get strategy stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
