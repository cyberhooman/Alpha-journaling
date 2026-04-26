import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  account_type: z.enum(['LIVE', 'DEMO', 'PROP_FIRM', 'FUNDED']),
  broker: z.string().max(100).optional(),
  initial_balance: z.number().positive(),
  currency: z.string().max(10).default('USD'),
  notes: z.string().optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  account_type: z.enum(['LIVE', 'DEMO', 'PROP_FIRM', 'FUNDED']).optional(),
  broker: z.string().max(100).or(z.literal('')).optional().nullable(),
  initial_balance: z.number().positive().optional(),
  current_balance: z.number().positive().optional(),
  currency: z.string().max(10).optional(),
  is_active: z.union([z.boolean(), z.number()]).optional().transform(val => val === 1 || val === true),
  notes: z.string().or(z.literal('')).optional().nullable(),
});

// GET /api/accounts - Get all trading accounts for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const accounts = db.prepare(`
      SELECT * FROM trading_accounts
      WHERE user_id = ?
      ORDER BY is_active DESC, created_at DESC
    `).all(userId);

    res.json({ data: accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// GET /api/accounts/:id - Get single account
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const account = db.prepare(`
      SELECT * FROM trading_accounts
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, userId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// POST /api/accounts - Create new trading account
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const data = createAccountSchema.parse(req.body);

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = db.prepare(`
      INSERT INTO trading_accounts (
        user_id, name, account_type, broker, initial_balance,
        current_balance, currency, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      data.name,
      data.account_type,
      data.broker || null,
      data.initial_balance,
      data.initial_balance, // current_balance starts as initial_balance
      data.currency,
      data.notes || null
    );

    const account = db.prepare(`
      SELECT * FROM trading_accounts WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(account);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Whitelist of allowed field names to prevent SQL injection
const ALLOWED_ACCOUNT_FIELDS = new Set([
  'name',
  'account_type',
  'broker',
  'initial_balance',
  'current_balance',
  'currency',
  'is_active',
  'notes'
]);

// PUT /api/accounts/:id - Update account
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateAccountSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if account exists and belongs to user
    const existing = db.prepare(`
      SELECT * FROM trading_accounts WHERE id = ? AND user_id = ?
    `).get(req.params.id, userId);

    if (!existing) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.account_type !== undefined) {
      updates.push('account_type = ?');
      values.push(data.account_type);
    }
    if (data.broker !== undefined) {
      updates.push('broker = ?');
      values.push(data.broker);
    }
    if (data.initial_balance !== undefined) {
      updates.push('initial_balance = ?');
      values.push(data.initial_balance);
    }
    if (data.current_balance !== undefined) {
      updates.push('current_balance = ?');
      values.push(data.current_balance);
    }
    if (data.currency !== undefined) {
      updates.push('currency = ?');
      values.push(data.currency);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }

    if (updates.length > 0) {
      // Additional validation: ensure all field names in updates are whitelisted
      // This is redundant given the explicit if checks above, but provides defense in depth
      const fieldNames = updates.map(u => u.split(' = ')[0]);
      for (const fieldName of fieldNames) {
        if (!ALLOWED_ACCOUNT_FIELDS.has(fieldName)) {
          return res.status(400).json({ error: 'Invalid field name' });
        }
      }

      values.push(req.params.id);
      db.prepare(`
        UPDATE trading_accounts
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);
    }

    const updated = db.prepare(`
      SELECT * FROM trading_accounts WHERE id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const account = db.prepare(`
      SELECT * FROM trading_accounts WHERE id = ? AND user_id = ?
    `).get(req.params.id, userId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    db.prepare('DELETE FROM trading_accounts WHERE id = ?').run(req.params.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// GET /api/accounts/:id/stats - Get account statistics
router.get('/:id/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const account = db.prepare(`
      SELECT * FROM trading_accounts WHERE id = ? AND user_id = ?
    `).get(req.params.id, userId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_trades,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed_trades,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(AVG(CASE WHEN pnl > 0 THEN pnl END), 0) as avg_win,
        COALESCE(AVG(CASE WHEN pnl < 0 THEN pnl END), 0) as avg_loss
      FROM trades
      WHERE account_id = ? AND user_id = ?
    `).get(req.params.id, userId);

    res.json({
      account,
      stats
    });
  } catch (error) {
    console.error('Error fetching account stats:', error);
    res.status(500).json({ error: 'Failed to fetch account stats' });
  }
});

export default router;
