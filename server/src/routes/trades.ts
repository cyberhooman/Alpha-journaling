import express from 'express';
import { z } from 'zod';
import { query } from '../db/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const createTradeSchema = z.object({
  symbol: z.string(),
  side: z.enum(['LONG', 'SHORT']),
  entryDate: z.string(),
  exitDate: z.string().optional(),
  entryPrice: z.number(),
  exitPrice: z.number().optional(),
  quantity: z.number(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  fees: z.number().default(0),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).default('OPEN'),
  strategy: z.string().optional(),
  setup: z.string().optional(),
  timeframe: z.string().optional(),
  marketType: z.enum(['STOCKS', 'FOREX', 'CRYPTO', 'FUTURES', 'OPTIONS']).optional(),
  notes: z.string().optional(),
  entryReasoning: z.string().optional(),
  exitReasoning: z.string().optional(),
  mistakes: z.string().optional(),
  lessonsLearned: z.string().optional(),
  emotionalState: z.string().optional(),
  confidenceLevel: z.number().min(1).max(10).optional(),
  broker: z.string().optional(),
  screenshotUrl: z.string().min(1).optional(),
  accountBalance: z.number().optional(),
  riskAmount: z.number().optional(),
  riskPercentage: z.number().optional(),
  rewardRiskRatio: z.number().optional(),
  tagIds: z.array(z.number()).optional(),
});

// Calculate PnL
function calculatePnL(
  side: string,
  entryPrice: number,
  exitPrice: number | null,
  quantity: number,
  fees: number
) {
  if (!exitPrice) return { pnl: null, pnlPercentage: null };

  let pnl: number;
  if (side === 'LONG') {
    pnl = (exitPrice - entryPrice) * quantity - fees;
  } else {
    pnl = (entryPrice - exitPrice) * quantity - fees;
  }

  const pnlPercentage = (pnl / (entryPrice * quantity)) * 100;

  return { pnl, pnlPercentage };
}

// Get all trades
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { status, symbol, startDate, endDate, limit = 100, offset = 0 } = req.query;

    // Simple query for SQLite - get trades first
    let queryText = `SELECT * FROM trades WHERE user_id = $1`;

    const params: any[] = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (symbol) {
      paramCount++;
      queryText += ` AND symbol LIKE $${paramCount}`;
      params.push(`%${symbol}%`);
    }

    if (startDate) {
      paramCount++;
      queryText += ` AND entry_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      queryText += ` AND entry_date <= $${paramCount}`;
      params.push(endDate);
    }

    queryText += ' ORDER BY entry_date DESC';

    paramCount++;
    queryText += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    queryText += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await query(queryText, params);

    // Get tags for each trade (simplified - not optimal but works)
    const trades = result.rows;
    for (const trade of trades) {
      const tagsResult = await query(
        `SELECT tt.* FROM trade_tags tt
         JOIN trade_tag_mappings ttm ON tt.id = ttm.tag_id
         WHERE ttm.trade_id = $1`,
        [trade.id]
      );
      trade.tags = tagsResult.rows || [];
    }

    res.json(trades);
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single trade
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const tradeId = req.params.id;

    const result = await query(
      `SELECT * FROM trades WHERE id = $1 AND user_id = $2`,
      [tradeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = result.rows[0];

    // Get tags for this trade
    const tagsResult = await query(
      `SELECT tt.* FROM trade_tags tt
       JOIN trade_tag_mappings ttm ON tt.id = ttm.tag_id
       WHERE ttm.trade_id = $1`,
      [trade.id]
    );
    trade.tags = tagsResult.rows || [];

    res.json(trade);
  } catch (error) {
    console.error('Get trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create trade
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const data = createTradeSchema.parse(req.body);

    const { pnl, pnlPercentage } = calculatePnL(
      data.side,
      data.entryPrice,
      data.exitPrice || null,
      data.quantity,
      data.fees
    );

    const result = await query(
      `INSERT INTO trades (
        user_id, symbol, side, entry_date, exit_date, entry_price, exit_price,
        quantity, stop_loss, take_profit, pnl, pnl_percentage, fees, status,
        strategy, setup, timeframe, market_type, notes, entry_reasoning,
        exit_reasoning, mistakes, lessons_learned, emotional_state,
        confidence_level, screenshot_url, broker, account_balance, risk_amount,
        risk_percentage, reward_risk_ratio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
      RETURNING *`,
      [
        userId, data.symbol, data.side, data.entryDate, data.exitDate || null,
        data.entryPrice, data.exitPrice || null, data.quantity, data.stopLoss || null,
        data.takeProfit || null, pnl, pnlPercentage, data.fees, data.status,
        data.strategy || null, data.setup || null, data.timeframe || null,
        data.marketType || null, data.notes || null, data.entryReasoning || null,
        data.exitReasoning || null, data.mistakes || null, data.lessonsLearned || null,
        data.emotionalState || null, data.confidenceLevel || null, data.screenshotUrl || null,
        data.broker || null, data.accountBalance || null, data.riskAmount || null,
        data.riskPercentage || null, data.rewardRiskRatio || null
      ]
    );

    const trade = result.rows[0];

    // Add tags if provided
    if (data.tagIds && data.tagIds.length > 0) {
      for (const tagId of data.tagIds) {
        await query(
          'INSERT INTO trade_tag_mappings (trade_id, tag_id) VALUES ($1, $2)',
          [trade.id, tagId]
        );
      }
    }

    res.status(201).json(trade);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update trade
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const tradeId = req.params.id;
    const data = createTradeSchema.partial().parse(req.body);

    // Check if trade exists and belongs to user
    const existing = await query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [tradeId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = existing.rows[0];

    // Calculate PnL if prices are being updated
    let pnl = trade.pnl;
    let pnlPercentage = trade.pnl_percentage;

    if (data.exitPrice !== undefined || data.entryPrice !== undefined || data.quantity !== undefined) {
      const calculated = calculatePnL(
        data.side || trade.side,
        data.entryPrice || trade.entry_price,
        data.exitPrice !== undefined ? data.exitPrice : trade.exit_price,
        data.quantity || trade.quantity,
        data.fees !== undefined ? data.fees : trade.fees
      );
      pnl = calculated.pnl;
      pnlPercentage = calculated.pnlPercentage;
    }

    const result = await query(
      `UPDATE trades SET
        symbol = COALESCE($1, symbol),
        side = COALESCE($2, side),
        entry_date = COALESCE($3, entry_date),
        exit_date = COALESCE($4, exit_date),
        entry_price = COALESCE($5, entry_price),
        exit_price = COALESCE($6, exit_price),
        quantity = COALESCE($7, quantity),
        stop_loss = COALESCE($8, stop_loss),
        take_profit = COALESCE($9, take_profit),
        pnl = COALESCE($10, pnl),
        pnl_percentage = COALESCE($11, pnl_percentage),
        fees = COALESCE($12, fees),
        status = COALESCE($13, status),
        strategy = COALESCE($14, strategy),
        setup = COALESCE($15, setup),
        timeframe = COALESCE($16, timeframe),
        market_type = COALESCE($17, market_type),
        notes = COALESCE($18, notes),
        entry_reasoning = COALESCE($19, entry_reasoning),
        exit_reasoning = COALESCE($20, exit_reasoning),
        mistakes = COALESCE($21, mistakes),
        lessons_learned = COALESCE($22, lessons_learned),
        emotional_state = COALESCE($23, emotional_state),
        confidence_level = COALESCE($24, confidence_level),
        screenshot_url = COALESCE($25, screenshot_url),
        broker = COALESCE($26, broker),
        account_balance = COALESCE($27, account_balance),
        risk_amount = COALESCE($28, risk_amount),
        risk_percentage = COALESCE($29, risk_percentage),
        reward_risk_ratio = COALESCE($30, reward_risk_ratio)
      WHERE id = $31 AND user_id = $32
      RETURNING *`,
      [
        data.symbol, data.side, data.entryDate, data.exitDate,
        data.entryPrice, data.exitPrice, data.quantity, data.stopLoss,
        data.takeProfit, pnl, pnlPercentage, data.fees, data.status,
        data.strategy, data.setup, data.timeframe, data.marketType,
        data.notes, data.entryReasoning, data.exitReasoning, data.mistakes,
        data.lessonsLearned, data.emotionalState, data.confidenceLevel,
        data.screenshotUrl, data.broker, data.accountBalance, data.riskAmount,
        data.riskPercentage, data.rewardRiskRatio, tradeId, userId
      ]
    );

    // Update tags if provided
    if (data.tagIds !== undefined) {
      await query('DELETE FROM trade_tag_mappings WHERE trade_id = $1', [tradeId]);

      if (data.tagIds.length > 0) {
        for (const tagId of data.tagIds) {
          await query(
            'INSERT INTO trade_tag_mappings (trade_id, tag_id) VALUES ($1, $2)',
            [tradeId, tagId]
          );
        }
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete trade
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const tradeId = req.params.id;

    const result = await query(
      'DELETE FROM trades WHERE id = $1 AND user_id = $2 RETURNING id',
      [tradeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
