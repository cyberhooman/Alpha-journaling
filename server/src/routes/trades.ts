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
  mae: z.number().finite().optional(),
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
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
      const placeholders = tradeIds.map((_id: number, i: number) => `$${i + 1}`).join(',');

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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const data = createTradeSchema.parse(req.body);

    // Use manual PNL if provided, otherwise calculate it
    let pnl = data.pnl !== undefined ? data.pnl : null;
    let mfe = data.mfe !== undefined ? data.mfe : null;
    let mae = data.mae !== undefined ? data.mae : null;

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
        quantity, stop_loss, take_profit, pnl, mfe, mae, fees, status,
        strategy, setup, timeframe, market_type, notes, entry_reasoning,
        exit_reasoning, mistakes, lessons_learned, emotional_state,
        confidence_level, screenshot_url, screenshot_url_2, broker, account_balance, risk_amount,
        risk_percentage, reward_risk_ratio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)
      RETURNING *`,
      [
        userId, data.accountId || null, data.symbol, data.side, data.entryDate, data.exitDate || null,
        data.entryPrice || null, data.exitPrice || null, data.quantity || null, data.stopLoss || null,
        data.takeProfit || null, pnl, mfe, mae, data.fees, data.status,
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
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

    const nextTrade = {
      accountId: data.accountId !== undefined ? data.accountId : trade.account_id,
      symbol: data.symbol !== undefined ? data.symbol : trade.symbol,
      side: data.side !== undefined ? data.side : trade.side,
      entryDate: data.entryDate !== undefined ? data.entryDate : trade.entry_date,
      exitDate: data.exitDate !== undefined ? data.exitDate : trade.exit_date,
      entryPrice: data.entryPrice !== undefined ? data.entryPrice : trade.entry_price,
      exitPrice: data.exitPrice !== undefined ? data.exitPrice : trade.exit_price,
      quantity: data.quantity !== undefined ? data.quantity : trade.quantity,
      stopLoss: data.stopLoss !== undefined ? data.stopLoss : trade.stop_loss,
      takeProfit: data.takeProfit !== undefined ? data.takeProfit : trade.take_profit,
      fees: data.fees !== undefined ? data.fees : trade.fees,
      status: data.status !== undefined ? data.status : trade.status,
      strategy: data.strategy !== undefined ? data.strategy : trade.strategy,
      setup: data.setup !== undefined ? data.setup : trade.setup,
      timeframe: data.timeframe !== undefined ? data.timeframe : trade.timeframe,
      marketType: data.marketType !== undefined ? data.marketType : trade.market_type,
      notes: data.notes !== undefined ? data.notes : trade.notes,
      entryReasoning: data.entryReasoning !== undefined ? data.entryReasoning : trade.entry_reasoning,
      exitReasoning: data.exitReasoning !== undefined ? data.exitReasoning : trade.exit_reasoning,
      mistakes: data.mistakes !== undefined ? data.mistakes : trade.mistakes,
      lessonsLearned: data.lessonsLearned !== undefined ? data.lessonsLearned : trade.lessons_learned,
      emotionalState: data.emotionalState !== undefined ? data.emotionalState : trade.emotional_state,
      confidenceLevel: data.confidenceLevel !== undefined ? data.confidenceLevel : trade.confidence_level,
      screenshotUrl: data.screenshotUrl !== undefined ? data.screenshotUrl : trade.screenshot_url,
      screenshotUrl2: data.screenshotUrl2 !== undefined ? data.screenshotUrl2 : trade.screenshot_url_2,
      broker: data.broker !== undefined ? data.broker : trade.broker,
      accountBalance: data.accountBalance !== undefined ? data.accountBalance : trade.account_balance,
      riskAmount: data.riskAmount !== undefined ? data.riskAmount : trade.risk_amount,
      riskPercentage: data.riskPercentage !== undefined ? data.riskPercentage : trade.risk_percentage,
      rewardRiskRatio: data.rewardRiskRatio !== undefined ? data.rewardRiskRatio : trade.reward_risk_ratio,
    };

    // Use manual PnL if provided, otherwise recalculate when a PnL input changed.
    let pnl = data.pnl !== undefined ? data.pnl : trade.pnl;
    const mfe = data.mfe !== undefined ? data.mfe : trade.mfe;
    const mae = data.mae !== undefined ? data.mae : trade.mae;

    if (
      data.pnl === undefined &&
      (
        data.side !== undefined ||
        data.entryPrice !== undefined ||
        data.exitPrice !== undefined ||
        data.quantity !== undefined ||
        data.fees !== undefined
      )
    ) {
      const calculated = calculatePnL(
        nextTrade.side,
        nextTrade.entryPrice,
        nextTrade.exitPrice,
        nextTrade.quantity,
        nextTrade.fees
      );
      pnl = calculated.pnl;
    }

    const result = await query(
      `UPDATE trades SET
        account_id = $1,
        symbol = $2,
        side = $3,
        entry_date = $4,
        exit_date = $5,
        entry_price = $6,
        exit_price = $7,
        quantity = $8,
        stop_loss = $9,
        take_profit = $10,
        pnl = $11,
        mfe = $12,
        mae = $13,
        fees = $14,
        status = $15,
        strategy = $16,
        setup = $17,
        timeframe = $18,
        market_type = $19,
        notes = $20,
        entry_reasoning = $21,
        exit_reasoning = $22,
        mistakes = $23,
        lessons_learned = $24,
        emotional_state = $25,
        confidence_level = $26,
        screenshot_url = $27,
        screenshot_url_2 = $28,
        broker = $29,
        account_balance = $30,
        risk_amount = $31,
        risk_percentage = $32,
        reward_risk_ratio = $33,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $34 AND user_id = $35
      RETURNING *`,
      [
        nextTrade.accountId, nextTrade.symbol, nextTrade.side, nextTrade.entryDate, nextTrade.exitDate,
        nextTrade.entryPrice, nextTrade.exitPrice, nextTrade.quantity, nextTrade.stopLoss,
        nextTrade.takeProfit, pnl, mfe, mae, nextTrade.fees, nextTrade.status,
        nextTrade.strategy, nextTrade.setup, nextTrade.timeframe, nextTrade.marketType,
        nextTrade.notes, nextTrade.entryReasoning, nextTrade.exitReasoning, nextTrade.mistakes,
        nextTrade.lessonsLearned, nextTrade.emotionalState, nextTrade.confidenceLevel,
        nextTrade.screenshotUrl, nextTrade.screenshotUrl2, nextTrade.broker, nextTrade.accountBalance, nextTrade.riskAmount,
        nextTrade.riskPercentage, nextTrade.rewardRiskRatio, tradeId, userId
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
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

    // Optimize: Get all tags for all trades in one query instead of N+1
    let tagsByTradeId = new Map<number, string>();
    if (trades.length > 0) {
      const tradeIds = trades.map((t: any) => t.id);
      const placeholders = tradeIds.map((_id: number, i: number) => `$${i + 1}`).join(',');

      const tagsResult = await query(
        `SELECT ttm.trade_id, tt.name
         FROM trade_tags tt
         JOIN trade_tag_mappings ttm ON tt.id = ttm.tag_id
         WHERE ttm.trade_id IN (${placeholders})`,
        tradeIds
      );

      // Group tags by trade_id
      tagsResult.rows.forEach((tag: any) => {
        if (!tagsByTradeId.has(tag.trade_id)) {
          tagsByTradeId.set(tag.trade_id, '');
        }
        const current = tagsByTradeId.get(tag.trade_id);
        tagsByTradeId.set(tag.trade_id, current ? `${current}; ${tag.name}` : tag.name);
      });
    }

    // Attach tags to trades
    const tradesWithTags = trades.map((trade: any) => ({
      ...trade,
      tags: tagsByTradeId.get(trade.id) || ''
    }));

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
      'MAE',
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
          formatValue(trade.mae),
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
