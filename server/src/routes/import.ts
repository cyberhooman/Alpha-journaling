import express from 'express';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { query } from '../db/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const csvTradeSchema = z.object({
  Symbol: z.string(),
  Side: z.enum(['LONG', 'SHORT', 'BUY', 'SELL']),
  'Entry Date': z.string(),
  'Exit Date': z.string().optional(),
  'Entry Price': z.string().transform(Number),
  'Exit Price': z.string().optional().transform(val => val ? Number(val) : undefined),
  Quantity: z.string().transform(Number),
  'Stop Loss': z.string().optional().transform(val => val ? Number(val) : undefined),
  'Take Profit': z.string().optional().transform(val => val ? Number(val) : undefined),
  'MFE': z.string().optional().transform(val => val ? Number(val) : undefined),
  'MAE': z.string().optional().transform(val => val ? Number(val) : undefined),
  Fees: z.string().optional().transform(val => val ? Number(val) : 0),
  Strategy: z.string().optional(),
  Notes: z.string().optional(),
});

// Import trades from CSV
router.post('/csv', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { csvData } = req.body;

    if (!csvData) {
      return res.status(400).json({ error: 'CSV data is required' });
    }

    // Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const imported = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      try {
        const record = csvTradeSchema.parse(records[i]);

        // Normalize side
        let side = record.Side;
        if (side === 'BUY') side = 'LONG';
        if (side === 'SELL') side = 'SHORT';

        // Calculate PnL
        let pnl = null;

        if (record['Exit Price']) {
          if (side === 'LONG') {
            pnl = (record['Exit Price'] - record['Entry Price']) * record.Quantity - record.Fees;
          } else {
            pnl = (record['Entry Price'] - record['Exit Price']) * record.Quantity - record.Fees;
          }
        }

        const status = record['Exit Date'] ? 'CLOSED' : 'OPEN';

        // Insert trade
        const result = await query(
          `INSERT INTO trades (
            user_id, symbol, side, entry_date, exit_date, entry_price, exit_price,
            quantity, stop_loss, take_profit, pnl, mfe, mae, fees, status,
            strategy, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING id`,
          [
            userId, record.Symbol, side, record['Entry Date'], record['Exit Date'] || null,
            record['Entry Price'], record['Exit Price'] || null, record.Quantity,
            record['Stop Loss'] || null, record['Take Profit'] || null, pnl,
            record['MFE'] || null, record['MAE'] || null, record.Fees, status, record.Strategy || null, record.Notes || null
          ]
        );

        imported.push({ row: i + 1, id: (result.rows[0] as any).id });
      } catch (error: any) {
        errors.push({
          row: i + 1,
          error: error.message || 'Invalid data format',
        });
      }
    }

    res.json({
      success: true,
      imported: imported.length,
      errors: errors.length,
      details: {
        imported,
        errors,
      },
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Failed to import CSV data' });
  }
});

// Get CSV template (requires authentication)
router.get('/csv/template', authenticateToken, (_req, res) => {
  const template = `Symbol,Side,Entry Date,Exit Date,Entry Price,Exit Price,Quantity,Stop Loss,Take Profit,MFE,MAE,Fees,Strategy,Notes
AAPL,LONG,2024-01-15T10:30:00Z,2024-01-15T14:30:00Z,150.50,152.75,10,149.00,153.00,5.00,3.50,2.50,Breakout,Good entry on volume spike
TSLA,SHORT,2024-01-16T09:00:00Z,,245.80,,5,250.00,240.00,,,1.25,Momentum,Shorting resistance level`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=trade_import_template.csv');
  res.send(template);
});

export default router;
