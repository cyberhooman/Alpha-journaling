import express from 'express';
import { z } from 'zod';
import { query, db } from '../db/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to validate base64 image strings
function isValidBase64Image(str: string): boolean {
  if (!str) return true; // Empty is valid (optional field)

  // Check if it's a data URL
  const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
  if (!dataUrlPattern.test(str)) {
    return false;
  }

  // Extract the base64 part
  const base64Data = str.split(',')[1];
  if (!base64Data) return false;

  // Validate base64 format
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Pattern.test(base64Data);
}

const createTradeSchema = z.object({
  accountId: z.number().int().positive().optional(),
  symbol: z.string().min(1),
  side: z.enum(['LONG', 'SHORT']),
  entryDate: z.string(),
  exitDate: z.string().optional(),
  entryPrice: z.number().finite().positive().optional(),
  exitPrice: z.number().finite().positive().optional(),
  quantity: z.number().finite().positive().optional(),
  stopLoss: z.number().finite().positive().optional(),
  takeProfit: z.number().finite().positive().optional(),
  fees: z.number().finite().nonnegative().default(0),
  pnl: z.number().finite().optional(),
  mfe: z.number().finite().optional(),
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
  confidenceLevel: z.number().int().min(1).max(10).optional(),
  broker: z.string().optional(),
  screenshotUrl: z.string().max(10485760).optional().refine(
    (val) => !val || isValidBase64Image(val),
    { message: 'Invalid image format. Must be a valid base64-encoded image.' }
  ),
  screenshotUrl2: z.string().max(10485760).optional().refine(
    (val) => !val || isValidBase64Image(val),
    { message: 'Invalid image format. Must be a valid base64-encoded image.' }
  ),
  accountBalance: z.number().finite().nonnegative().optional(),
  riskAmount: z.number().finite().nonnegative().optional(),
  riskPercentage: z.number().finite().nonnegative().max(100).optional(),
  rewardRiskRatio: z.number().finite().nonnegative().optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

// Calculate PnL
function calculatePnL(
  side: string,
  entryPrice: number,
  exitPrice: number | null,
  quantity: number,
  fees: number
) {
  if (!exitPrice) return { pnl: null };

  // Validate inputs to prevent calculation errors
  if (!entryPrice || entryPrice <= 0 || !quantity || quantity <= 0 || fees < 0) {
    return { pnl: null };
  }

  if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(quantity) || isNaN(fees)) {
    return { pnl: null };
  }

  let pnl: number;
  if (side === 'LONG') {
    pnl = (exitPrice - entryPrice) * quantity - fees;
  } else {
    pnl = (entryPrice - exitPrice) * quantity - fees;
  }

  return { pnl };
}

// Get all trades
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const startTime = Date.now();
    const userId = req.user!.id;
    const { status, symbol, startDate, endDate, accountId, limit = 100, offset = 0 } = req.query;

    // Simple query for SQLite - get trades first
    let queryText = `SELECT * FROM trades WHERE user_id = $1`;

    const params: any[] = [userId];
    let paramCount = 1;

    if (accountId) {
      paramCount++;
      queryText += ` AND account_id = $${paramCount}`;
      params.push(accountId);
    }

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
    const trades = result.rows;

    // Optimize: Get all tags for all trades in one query instead of N+1
    if (trades.length > 0) {
      const tradeIds = trades.map((t: any) => t.id);
      const placeholders = tradeIds.map((_, i) => `$${i + 1}`).join(',');

      const tagsResult = await query(
        `SELECT ttm.trade_id, tt.id, tt.name, tt.color
         FROM trade_tags tt
         JOIN trade_tag_mappings ttm ON tt.id = ttm.tag_id
         WHERE ttm.trade_id IN (${placeholders})`,
        tradeIds
      );

      // Group tags by trade_id
      const tagsByTradeId = new Map();
      tagsResult.rows.forEach((tag: any) => {
        if (!tagsByTradeId.has(tag.trade_id)) {
          tagsByTradeId.set(tag.trade_id, []);
        }
        tagsByTradeId.get(tag.trade_id).push(tag);
      });

      // Attach tags to trades
      trades.forEach((trade: any) => {
        trade.tags = tagsByTradeId.get(trade.id) || [];
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`📊 GET /trades completed in ${totalTime}ms (${trades.length} trades)`);
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

    const trade = result.rows[0] as any;

    // Get tags for this trade
    const tagsResult = await query(
      `SELECT tt.* FROM trade_tags tt
       JOIN trade_tag_mappings ttm ON tt.id = ttm.tag_id
       WHERE ttm.trade_id = $1`,
      [trade.id]
    );
    trade.tags = tagsResult.rows || [];
    trade.tag_ids = tagsResult.rows.map((t: any) => t.id);

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

    // Use manual PNL if provided, otherwise calculate it
    let pnl = data.pnl !== undefined ? data.pnl : null;
    let mfe = data.mfe !== undefined ? data.mfe : null;

    // Only calculate PnL if we have the required fields (entryPrice and quantity)
    if (pnl === null && data.entryPrice !== undefined && data.quantity !== undefined) {
      const calculated = calculatePnL(
        data.side,
        data.entryPrice,
        data.exitPrice || null,
        data.quantity,
        data.fees
      );
      pnl = calculated.pnl;
    }

    const result = await query(
      `INSERT INTO trades (
        user_id, account_id, symbol, side, entry_date, exit_date, entry_price, exit_price,
        quantity, stop_loss, take_profit, pnl, mfe, fees, status,
        strategy, setup, timeframe, market_type, notes, entry_reasoning,
        exit_reasoning, mistakes, lessons_learned, emotional_state,
        confidence_level, screenshot_url, screenshot_url_2, broker, account_balance, risk_amount,
        risk_percentage, reward_risk_ratio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
      RETURNING *`,
      [
        userId, data.accountId || null, data.symbol, data.side, data.entryDate, data.exitDate || null,
        data.entryPrice || null, data.exitPrice || null, data.quantity || null, data.stopLoss || null,
        data.takeProfit || null, pnl, mfe, data.fees, data.status,
        data.strategy || null, data.setup || null, data.timeframe || null,
        data.marketType || null, data.notes || null, data.entryReasoning || null,
        data.exitReasoning || null, data.mistakes || null, data.lessonsLearned || null,
        data.emotionalState || null, data.confidenceLevel || null, data.screenshotUrl || null,
        data.screenshotUrl2 || null, data.broker || null, data.accountBalance || null, data.riskAmount || null,
        data.riskPercentage || null, data.rewardRiskRatio || null
      ]
    );

    const trade = result.rows[0] as any;

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

    const trade = existing.rows[0] as any;

    // Use manual PNL if provided, otherwise calculate if prices are being updated
    let pnl = data.pnl !== undefined ? data.pnl : trade.pnl;
    let mfe = data.mfe !== undefined ? data.mfe : trade.mfe;

    // Only calculate PnL if manual values not provided AND prices are being updated
    if (data.pnl === undefined) {
      if (data.exitPrice !== undefined || data.entryPrice !== undefined || data.quantity !== undefined) {
        const calculated = calculatePnL(
          data.side || trade.side,
          data.entryPrice || trade.entry_price,
          data.exitPrice !== undefined ? data.exitPrice : trade.exit_price,
          data.quantity || trade.quantity,
          data.fees !== undefined ? data.fees : trade.fees
        );
        pnl = calculated.pnl;
      }
    }

    const result = await query(
      `UPDATE trades SET
        account_id = COALESCE($1, account_id),
        symbol = COALESCE($2, symbol),
        side = COALESCE($3, side),
        entry_date = COALESCE($4, entry_date),
        exit_date = COALESCE($5, exit_date),
        entry_price = COALESCE($6, entry_price),
        exit_price = COALESCE($7, exit_price),
        quantity = COALESCE($8, quantity),
        stop_loss = COALESCE($9, stop_loss),
        take_profit = COALESCE($10, take_profit),
        pnl = COALESCE($11, pnl),
        mfe = COALESCE($12, mfe),
        fees = COALESCE($13, fees),
        status = COALESCE($14, status),
        strategy = COALESCE($15, strategy),
        setup = COALESCE($16, setup),
        timeframe = COALESCE($17, timeframe),
        market_type = COALESCE($18, market_type),
        notes = COALESCE($19, notes),
        entry_reasoning = COALESCE($20, entry_reasoning),
        exit_reasoning = COALESCE($21, exit_reasoning),
        mistakes = COALESCE($22, mistakes),
        lessons_learned = COALESCE($23, lessons_learned),
        emotional_state = COALESCE($24, emotional_state),
        confidence_level = COALESCE($25, confidence_level),
        screenshot_url = COALESCE($26, screenshot_url),
        screenshot_url_2 = COALESCE($27, screenshot_url_2),
        broker = COALESCE($28, broker),
        account_balance = COALESCE($29, account_balance),
        risk_amount = COALESCE($30, risk_amount),
        risk_percentage = COALESCE($31, risk_percentage),
        reward_risk_ratio = COALESCE($32, reward_risk_ratio)
      WHERE id = $33 AND user_id = $34
      RETURNING *`,
      [
        data.accountId, data.symbol, data.side, data.entryDate, data.exitDate,
        data.entryPrice, data.exitPrice, data.quantity, data.stopLoss,
        data.takeProfit, pnl, mfe, data.fees, data.status,
        data.strategy, data.setup, data.timeframe, data.marketType,
        data.notes, data.entryReasoning, data.exitReasoning, data.mistakes,
        data.lessonsLearned, data.emotionalState, data.confidenceLevel,
        data.screenshotUrl, data.screenshotUrl2, data.broker, data.accountBalance, data.riskAmount,
        data.riskPercentage, data.rewardRiskRatio, tradeId, userId
      ]
    );

    // Update tags if provided (wrapped in transaction for atomicity)
    if (data.tagIds !== undefined) {
      const updateTags = db.transaction(() => {
        db.prepare('DELETE FROM trade_tag_mappings WHERE trade_id = ?').run(tradeId);

        if (data.tagIds && data.tagIds.length > 0) {
          const insertStmt = db.prepare('INSERT INTO trade_tag_mappings (trade_id, tag_id) VALUES (?, ?)');
          for (const tagId of data.tagIds) {
            insertStmt.run(tradeId, tagId);
          }
        }
      });
      updateTags();
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

// Export trades to CSV
router.get('/export/csv', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { accountId } = req.query;

    // Get all trades for the user
    let queryText = `
      SELECT
        t.*,
        ta.name as account_name,
        ta.broker as account_broker
      FROM trades t
      LEFT JOIN trading_accounts ta ON t.account_id = ta.id
      WHERE t.user_id = $1
      ORDER BY t.entry_date DESC
    `;

    const params: any[] = [userId];

    if (accountId) {
      queryText = `
        SELECT
          t.*,
          ta.name as account_name,
          ta.broker as account_broker
        FROM trades t
        LEFT JOIN trading_accounts ta ON t.account_id = ta.id
        WHERE t.user_id = $1 AND t.account_id = $2
        ORDER BY t.entry_date DESC
      `;
      params.push(accountId);
    }

    const result = await query(queryText, params);
    const trades = result.rows;

    // Get tags for each trade
    const tradesWithTags = await Promise.all(
      trades.map(async (trade: any) => {
        const tagsResult = await query(
          `SELECT tt.name, tt.color
           FROM trade_tags tt
           JOIN trade_tag_mappings ttm ON tt.id = ttm.tag_id
           WHERE ttm.trade_id = $1`,
          [trade.id]
        );
        const tags = tagsResult.rows.map((t: any) => t.name).join('; ');
        return { ...trade, tags };
      })
    );

    // Create CSV header
    const headers = [
      'ID',
      'Account',
      'Symbol',
      'Side',
      'Entry Date',
      'Exit Date',
      'Entry Price',
      'Exit Price',
      'Quantity',
      'Stop Loss',
      'Take Profit',
      'PnL',
      'MFE',
      'Fees',
      'Status',
      'Strategy',
      'Setup',
      'Timeframe',
      'Market Type',
      'Broker',
      'Account Balance',
      'Risk Amount',
      'Risk %',
      'R:R Ratio',
      'Confidence',
      'Tags',
      'Entry Reasoning',
      'Exit Reasoning',
      'Mistakes',
      'Lessons Learned',
      'Emotional State',
      'Notes',
    ];

    // Create CSV rows
    const csvRows = [
      headers.join(','),
      ...tradesWithTags.map((trade: any) => {
        const formatValue = (value: any) => {
          if (value === null || value === undefined) return '';
          // Escape quotes and wrap in quotes if contains comma or quotes
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        };

        return [
          formatValue(trade.id),
          formatValue(trade.account_name || 'Unknown'),
          formatValue(trade.symbol),
          formatValue(trade.side),
          formatValue(trade.entry_date),
          formatValue(trade.exit_date),
          formatValue(trade.entry_price),
          formatValue(trade.exit_price),
          formatValue(trade.quantity),
          formatValue(trade.stop_loss),
          formatValue(trade.take_profit),
          formatValue(trade.pnl),
          formatValue(trade.mfe),
          formatValue(trade.fees),
          formatValue(trade.status),
          formatValue(trade.strategy),
          formatValue(trade.setup),
          formatValue(trade.timeframe),
          formatValue(trade.market_type),
          formatValue(trade.broker),
          formatValue(trade.account_balance),
          formatValue(trade.risk_amount),
          formatValue(trade.risk_percentage),
          formatValue(trade.reward_risk_ratio),
          formatValue(trade.confidence_level),
          formatValue(trade.tags),
          formatValue(trade.entry_reasoning),
          formatValue(trade.exit_reasoning),
          formatValue(trade.mistakes),
          formatValue(trade.lessons_learned),
          formatValue(trade.emotional_state),
          formatValue(trade.notes),
        ].join(',');
      }),
    ];

    const csv = csvRows.join('\n');

    // Set headers for CSV download
    const filename = `trades_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
