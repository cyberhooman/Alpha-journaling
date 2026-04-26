import { useMemo, useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Bar } from 'recharts';
import { TrendUp, TrendDown } from '@phosphor-icons/react';
const TrendingUp = TrendUp;
const TrendingDown = TrendDown;
import { format } from 'date-fns';

interface TradeChartProps {
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  entryDate: string;
  exitDate?: string;
  side: 'LONG' | 'SHORT';
  stopLoss?: number;
  takeProfit?: number;
}

// Custom Candlestick Shape Component
const Candlestick = (props: any) => {
  const { x, y, width, height, payload } = props;

  if (!payload || payload.open === undefined) return null;

  const { open, close, high, low } = payload;
  const isGreen = close > open;
  const color = isGreen ? '#10b981' : '#ef4444';

  const candleWidth = width * 0.6;
  const xCenter = x + width / 2;

  // Calculate positions
  const yHigh = y - ((high - close) / (high - low)) * height;
  const yLow = y + ((close - low) / (high - low)) * height;
  const yOpen = y - ((open - close) / (high - low)) * height;
  const yClose = y;

  const candleY = Math.min(yOpen, yClose);
  const candleHeight = Math.abs(yOpen - yClose) || 2;

  return (
    <g>
      {/* Wick (high-low line) */}
      <line
        x1={xCenter}
        y1={yHigh}
        x2={xCenter}
        y2={yLow}
        stroke={color}
        strokeWidth={2}
      />
      {/* Candle body */}
      <rect
        x={xCenter - candleWidth / 2}
        y={candleY}
        width={candleWidth}
        height={candleHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

export default function TradeChart({
  symbol,
  entryPrice,
  exitPrice,
  entryDate,
  exitDate,
  side,
  stopLoss,
  takeProfit,
}: TradeChartProps) {
  const [livePrice, setLivePrice] = useState<number | null>(null);

  // Generate realistic OHLC candlestick data
  const chartData = useMemo(() => {
    const data = [];
    const start = new Date(entryDate);
    const end = exitDate ? new Date(exitDate) : new Date();
    const duration = end.getTime() - start.getTime();

    // Create hourly candles
    const numCandles = Math.min(100, Math.max(20, Math.floor(duration / (1000 * 60 * 60))));
    const timeStep = duration / numCandles;

    const priceChange = exitPrice ? exitPrice - entryPrice : 0;
    let currentPrice = entryPrice;

    for (let i = 0; i < numCandles; i++) {
      const progress = i / numCandles;
      const time = new Date(start.getTime() + (i * timeStep));

      // Calculate trend toward exit price
      const targetPrice = entryPrice + (priceChange * progress);
      const trendPull = (targetPrice - currentPrice) * 0.3;

      // Add volatility
      const volatility = Math.abs(entryPrice * 0.015);
      const randomWalk = (Math.random() - 0.5) * volatility;

      currentPrice = currentPrice + trendPull + randomWalk;

      // Generate OHLC for this candle
      const open = currentPrice + (Math.random() - 0.5) * volatility * 0.3;
      const close = currentPrice + (Math.random() - 0.5) * volatility * 0.3;
      const high = Math.max(open, close) + Math.random() * volatility * 0.4;
      const low = Math.min(open, close) - Math.random() * volatility * 0.4;

      data.push({
        time: format(time, 'MM/dd HH:mm'),
        timestamp: time.getTime(),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        isEntry: i === 0,
        isExit: exitPrice && i === numCandles - 1,
        // For the bar chart, we need a value
        value: close,
      });

      currentPrice = close;
    }

    // Ensure first candle starts at entry
    if (data.length > 0) {
      data[0].open = entryPrice;
      data[0].low = Math.min(data[0].low, entryPrice);
      data[0].high = Math.max(data[0].high, entryPrice);
    }

    // Ensure last candle ends at exit
    if (exitPrice && data.length > 0) {
      const lastCandle = data[data.length - 1];
      lastCandle.close = exitPrice;
      lastCandle.low = Math.min(lastCandle.low, exitPrice);
      lastCandle.high = Math.max(lastCandle.high, exitPrice);
    }

    return data;
  }, [entryDate, exitDate, entryPrice, exitPrice]);

  // Simulate real-time price updates for open trades
  useEffect(() => {
    if (!exitPrice && chartData.length > 0) {
      const lastCandle = chartData[chartData.length - 1];
      const basePrice = lastCandle.close;

      const interval = setInterval(() => {
        const volatility = basePrice * 0.001;
        const change = (Math.random() - 0.5) * volatility;
        setLivePrice(basePrice + change);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [exitPrice, chartData]);

  const pnl = exitPrice ? ((exitPrice - entryPrice) / entryPrice) * 100 * (side === 'LONG' ? 1 : -1) : 0;
  const isProfit = pnl > 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Price Chart</h3>
          <span className="text-sm text-slate-500">{symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          {side === 'LONG' ? (
            <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">LONG</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-lg">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">SHORT</span>
            </div>
          )}
          {exitPrice && (
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isProfit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {isProfit ? '+' : ''}{pnl.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      <div className="relative" style={{ width: '100%', height: '450px' }}>
        {/* Live Price Indicator */}
        {livePrice && (
          <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            LIVE: ${livePrice.toFixed(2)}
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={70}
              interval={Math.floor(chartData.length / 8)}
            />

            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              width={70}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="text-xs text-gray-600 mb-2">{data.time}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-green-600">O: ${data.open?.toFixed(2)}</p>
                        <p className="text-blue-600">H: ${data.high?.toFixed(2)}</p>
                        <p className="text-orange-600">L: ${data.low?.toFixed(2)}</p>
                        <p className="text-purple-600">C: ${data.close?.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Candlesticks as bars with custom shape */}
            <Bar dataKey="value" shape={<Candlestick />} />

            {/* Entry price line */}
            <ReferenceLine
              y={entryPrice}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Entry: $${entryPrice.toFixed(2)}`,
                position: 'right',
                fill: '#3b82f6',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />

            {/* Exit price line */}
            {exitPrice && (
              <ReferenceLine
                y={exitPrice}
                stroke={isProfit ? '#10b981' : '#ef4444'}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Exit: $${exitPrice.toFixed(2)}`,
                  position: 'right',
                  fill: isProfit ? '#10b981' : '#ef4444',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              />
            )}

            {/* Stop loss line */}
            {stopLoss && (
              <ReferenceLine
                y={stopLoss}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Stop Loss: $${stopLoss.toFixed(2)}`,
                  position: 'left',
                  fill: '#ef4444',
                  fontSize: 11
                }}
              />
            )}

            {/* Take profit line */}
            {takeProfit && (
              <ReferenceLine
                y={takeProfit}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Take Profit: $${takeProfit.toFixed(2)}`,
                  position: 'left',
                  fill: '#10b981',
                  fontSize: 11
                }}
              />
            )}

            {/* Current price line (for live trades) */}
            {livePrice && (
              <ReferenceLine
                y={livePrice}
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="2 2"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Entry</p>
          <p className="font-semibold text-slate-900">${entryPrice.toFixed(2)}</p>
        </div>
        {exitPrice && (
          <div>
            <p className="text-slate-500">Exit</p>
            <p className="font-semibold text-slate-900">${exitPrice.toFixed(2)}</p>
          </div>
        )}
        {stopLoss && (
          <div>
            <p className="text-slate-500">Stop Loss</p>
            <p className="font-semibold text-red-600">${stopLoss.toFixed(2)}</p>
          </div>
        )}
        {takeProfit && (
          <div>
            <p className="text-slate-500">Take Profit</p>
            <p className="font-semibold text-green-600">${takeProfit.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
