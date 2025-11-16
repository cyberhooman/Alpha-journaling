import { CandlestickData } from 'lightweight-charts';

interface TradeInfo {
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  entryDate: string;
  exitDate?: string;
  side: 'LONG' | 'SHORT';
}

/**
 * Generate realistic candlestick data for a trade
 * Creates price movement around entry/exit points
 */
export function generateCandlestickData(trade: TradeInfo): CandlestickData[] {
  const entryTime = new Date(trade.entryDate).getTime() / 1000;
  const exitTime = trade.exitDate ? new Date(trade.exitDate).getTime() / 1000 : Date.now() / 1000;

  const duration = exitTime - entryTime;
  const numCandles = Math.min(Math.max(50, Math.floor(duration / 3600)), 200); // 50-200 candles
  const timeStep = duration / numCandles;

  const candles: CandlestickData[] = [];

  // Calculate price range
  const entryPrice = trade.entryPrice;
  const exitPrice = trade.exitPrice || entryPrice;
  const priceRange = Math.abs(exitPrice - entryPrice);
  const volatility = Math.max(priceRange * 0.3, entryPrice * 0.02); // At least 2% volatility

  let currentPrice = entryPrice;

  // Generate candles with realistic price movement
  for (let i = 0; i < numCandles; i++) {
    const time = entryTime + (i * timeStep);
    const progress = i / numCandles;

    // Trend toward exit price
    const targetPrice = entryPrice + (exitPrice - entryPrice) * progress;

    // Add some randomness
    const randomWalk = (Math.random() - 0.5) * volatility * 0.5;
    const trendPull = (targetPrice - currentPrice) * 0.1;

    currentPrice = currentPrice + randomWalk + trendPull;

    // Generate OHLC for this candle
    const candleVolatility = volatility * 0.15;
    const open = currentPrice + (Math.random() - 0.5) * candleVolatility * 0.5;
    const close = currentPrice + (Math.random() - 0.5) * candleVolatility * 0.5;

    const high = Math.max(open, close) + Math.random() * candleVolatility * 0.3;
    const low = Math.min(open, close) - Math.random() * candleVolatility * 0.3;

    candles.push({
      time: Math.floor(time) as any,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    currentPrice = close;
  }

  // Ensure entry price is exactly at first candle
  if (candles.length > 0) {
    candles[0].open = entryPrice;
  }

  // Ensure exit price is at last candle if trade is closed
  if (trade.exitPrice && candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    lastCandle.close = trade.exitPrice;
    lastCandle.high = Math.max(lastCandle.high, trade.exitPrice);
    lastCandle.low = Math.min(lastCandle.low, trade.exitPrice);
  }

  return candles;
}

/**
 * Format date for display in chart
 */
export function formatChartDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
