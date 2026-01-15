import express from 'express';
import { query } from '../db/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, accountId } = req.query;

    let filters = '';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (accountId) {
      filters += ` AND account_id = $${paramIndex}`;
      params.push(accountId);
      paramIndex++;
    }

    if (startDate && endDate) {
      filters += ` AND entry_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    const dateFilter = filters; // Keep for backward compatibility

    // Overall statistics
    const statsResult = await query(
      `SELECT
        COUNT(*) as total_trades,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed_trades,
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_trades,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(AVG(pnl), 0) as avg_pnl,
        COALESCE(MAX(pnl), 0) as best_trade,
        COALESCE(MIN(pnl), 0) as worst_trade,
        COALESCE(AVG(CASE WHEN pnl > 0 THEN pnl ELSE NULL END), 0) as avg_win,
        COALESCE(AVG(CASE WHEN pnl < 0 THEN pnl ELSE NULL END), 0) as avg_loss,
        COALESCE(AVG(CASE
          WHEN status = 'CLOSED' AND exit_date IS NOT NULL
          THEN (julianday(exit_date) - julianday(entry_date))
          ELSE NULL
        END), 0) as avg_holding_days
      FROM trades
      WHERE user_id = $1 ${dateFilter}`,
      params
    );

    const stats = statsResult.rows[0] as any;

    const winRate = stats.closed_trades > 0
      ? (Number(stats.winning_trades) / Number(stats.closed_trades)) * 100
      : 0;

    const profitFactor = stats.avg_loss !== 0
      ? Math.abs(Number(stats.avg_win) / Number(stats.avg_loss))
      : 0;

    // Run all analytics queries in parallel for better performance
    const [
      pnlByDayResult,
      pnlBySymbolResult,
      pnlByStrategyResult,
      pnlBySetupResult,
      winRateByDayResult
    ] = await Promise.all([
      // PnL by day
      query(
        `SELECT
          DATE(entry_date) as date,
          SUM(pnl) as pnl,
          COUNT(*) as trades
        FROM trades
        WHERE user_id = $1 AND status = 'CLOSED' ${dateFilter}
        GROUP BY DATE(entry_date)
        ORDER BY date ASC`,
        params
      ),
      // PnL by symbol
      query(
        `SELECT
          symbol,
          COUNT(*) as trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) as avg_pnl,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losses
        FROM trades
        WHERE user_id = $1 AND status = 'CLOSED' ${dateFilter}
        GROUP BY symbol
        ORDER BY total_pnl DESC
        LIMIT 10`,
        params
      ),
      // PnL by strategy
      query(
        `SELECT
          strategy,
          COUNT(*) as trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) as avg_pnl,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins
        FROM trades
        WHERE user_id = $1 AND status = 'CLOSED' AND strategy IS NOT NULL ${dateFilter}
        GROUP BY strategy
        ORDER BY total_pnl DESC`,
        params
      ),
      // PnL by setup
      query(
        `SELECT
          setup,
          COUNT(*) as trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) as avg_pnl,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins
        FROM trades
        WHERE user_id = $1 AND status = 'CLOSED' AND setup IS NOT NULL ${dateFilter}
        GROUP BY setup
        ORDER BY total_pnl DESC`,
        params
      ),
      // Win rate by day of week
      query(
        `SELECT
          CAST(strftime('%w', entry_date) AS INTEGER) as day_of_week,
          COUNT(*) as trades,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
          SUM(pnl) as total_pnl
        FROM trades
        WHERE user_id = $1 AND status = 'CLOSED' ${dateFilter}
        GROUP BY day_of_week
        ORDER BY day_of_week`,
        params
      )
    ]);

    res.json({
      overview: {
        totalTrades: Number(stats.total_trades),
        closedTrades: Number(stats.closed_trades),
        openTrades: Number(stats.open_trades),
        winningTrades: Number(stats.winning_trades),
        losingTrades: Number(stats.losing_trades),
        winRate: Math.round(winRate * 100) / 100,
        totalPnl: Number(stats.total_pnl),
        avgPnl: Number(stats.avg_pnl),
        bestTrade: Number(stats.best_trade),
        worstTrade: Number(stats.worst_trade),
        avgWin: Number(stats.avg_win),
        avgLoss: Number(stats.avg_loss),
        profitFactor: Math.round(profitFactor * 100) / 100,
        avgHoldingDays: Math.round(Number(stats.avg_holding_days) * 10) / 10,
      },
      pnlByDay: pnlByDayResult.rows,
      pnlBySymbol: pnlBySymbolResult.rows,
      pnlByStrategy: pnlByStrategyResult.rows,
      pnlBySetup: pnlBySetupResult.rows,
      winRateByDay: winRateByDayResult.rows,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get calendar data
router.get('/calendar', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { year, month } = req.query;

    let dateFilter = '';
    const params: any[] = [userId];

    if (year && month) {
      dateFilter = `AND strftime('%Y', entry_date) = $2 AND strftime('%m', entry_date) = $3`;
      params.push(year, month);
    }

    const result = await query(
      `SELECT
        DATE(entry_date) as date,
        COUNT(*) as trades,
        SUM(pnl) as pnl,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losses
      FROM trades
      WHERE user_id = $1 ${dateFilter}
      GROUP BY DATE(entry_date)
      ORDER BY date`,
      params
    );

    // Get tags for each date
    const calendarData = result.rows;
    for (const dayData of calendarData) {
      const dayDataAny = dayData as any;
      const tagsResult = await query(
        `SELECT DISTINCT tt.id, tt.name, tt.color
         FROM trade_tags tt
         JOIN trade_tag_mappings ttm ON tt.id = ttm.tag_id
         JOIN trades t ON ttm.trade_id = t.id
         WHERE t.user_id = $1 AND DATE(t.entry_date) = $2`,
        [userId, dayDataAny.date]
      );
      dayDataAny.tags = tagsResult.rows || [];
    }

    res.json(calendarData);
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get performance metrics
router.get('/performance', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Expectancy calculation
    const expectancyResult = await query(
      `SELECT
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losses,
        AVG(CASE WHEN pnl > 0 THEN pnl ELSE NULL END) as avg_win,
        AVG(CASE WHEN pnl < 0 THEN pnl ELSE NULL END) as avg_loss,
        COUNT(*) as total_trades
      FROM trades
      WHERE user_id = $1 AND status = 'CLOSED'`,
      [userId]
    );

    const data = expectancyResult.rows[0] as any;
    const winRate = Number(data.total_trades) > 0
      ? Number(data.wins) / Number(data.total_trades)
      : 0;
    const lossRate = 1 - winRate;
    const avgWin = Number(data.avg_win) || 0;
    const avgLoss = Math.abs(Number(data.avg_loss)) || 0;
    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

    // Risk metrics
    const riskMetricsResult = await query(
      `SELECT
        AVG(risk_percentage) as avg_risk_percentage,
        AVG(reward_risk_ratio) as avg_reward_risk_ratio,
        MAX(pnl) as max_win,
        MIN(pnl) as max_loss
      FROM trades
      WHERE user_id = $1 AND status = 'CLOSED'`,
      [userId]
    );

    const riskMetrics = riskMetricsResult.rows[0] as any;

    // Consecutive wins/losses
    const tradesResult = await query(
      `SELECT pnl
       FROM trades
       WHERE user_id = $1 AND status = 'CLOSED'
       ORDER BY entry_date ASC`,
      [userId]
    );

    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let lastWasWin = false;

    tradesResult.rows.forEach((trade: any) => {
      const isWin = Number(trade.pnl) > 0;

      if (currentStreak === 0) {
        currentStreak = 1;
        lastWasWin = isWin;
      } else if (isWin === lastWasWin) {
        currentStreak++;
      } else {
        if (lastWasWin) {
          maxWinStreak = Math.max(maxWinStreak, currentStreak);
        } else {
          maxLossStreak = Math.max(maxLossStreak, currentStreak);
        }
        currentStreak = 1;
        lastWasWin = isWin;
      }
    });

    // Update final streak
    if (lastWasWin) {
      maxWinStreak = Math.max(maxWinStreak, currentStreak);
    } else {
      maxLossStreak = Math.max(maxLossStreak, currentStreak);
    }

    res.json({
      expectancy,
      winRate: Math.round(winRate * 10000) / 100,
      avgRiskPercentage: Number(riskMetrics.avg_risk_percentage) || 0,
      avgRewardRiskRatio: Number(riskMetrics.avg_reward_risk_ratio) || 0,
      maxWin: Number(riskMetrics.max_win) || 0,
      maxLoss: Number(riskMetrics.max_loss) || 0,
      maxWinStreak,
      maxLossStreak,
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
