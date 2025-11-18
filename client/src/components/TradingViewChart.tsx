import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TradingViewChartProps {
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  entryDate: string;
  exitDate?: string;
  side: 'LONG' | 'SHORT';
  stopLoss?: number;
  takeProfit?: number;
}

export default function TradingViewChart({
  symbol,
  entryPrice,
  exitPrice,
  entryDate,
  exitDate,
  side,
  stopLoss,
  takeProfit,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const pnl = exitPrice ? ((exitPrice - entryPrice) / entryPrice) * 100 * (side === 'LONG' ? 1 : -1) : 0;
  const isProfit = pnl > 0;

  useEffect(() => {
    if (!containerRef.current) return;

    // Convert symbol to TradingView format
    let tvSymbol = symbol.toUpperCase();

    // Map common symbols to TradingView format
    const symbolMap: Record<string, string> = {
      'BTC': 'BTCUSDT',
      'ETH': 'ETHUSDT',
      'AAPL': 'AAPL',
      'TSLA': 'TSLA',
      'GOOGL': 'GOOGL',
      'MSFT': 'MSFT',
      'AMZN': 'AMZN',
      'NVDA': 'NVDA',
      'META': 'META',
    };

    if (symbolMap[tvSymbol]) {
      tvSymbol = symbolMap[tvSymbol];
    } else if (!tvSymbol.includes('USDT') && !tvSymbol.includes('USD') && !tvSymbol.match(/^[A-Z]{1,5}$/)) {
      // If it's a crypto symbol without pair, add USDT
      tvSymbol = tvSymbol + 'USDT';
    }

    // Determine exchange based on symbol
    const exchange = tvSymbol.includes('USDT') || tvSymbol.includes('BTC') ? 'BINANCE' : 'NASDAQ';

    // Create the script element
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `${exchange}:${tvSymbol}`,
      interval: '60',
      timezone: 'Asia/Jakarta',
      theme: 'light',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com',
      studies: ['Volume@tv-basicstudies'],
      show_popup_button: false,
      hide_side_toolbar: false,
      details: true,
      hotlist: false,
      calendar: false,
    });

    // Clear previous content
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Price Chart</h3>
          <span className="text-sm text-slate-500">{symbol}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      <div className="tradingview-widget-container relative" style={{ height: '500px', width: '100%' }}>
        <div
          ref={containerRef}
          className="tradingview-widget-container__widget"
          style={{ height: 'calc(100% - 32px)', width: '100%' }}
        />
        <div className="tradingview-widget-copyright">
          <a href={`https://www.tradingview.com/symbols/${symbol}/`} rel="noopener noreferrer" target="_blank">
            <span className="blue-text text-xs text-slate-400">Track {symbol} on TradingView</span>
          </a>
        </div>

        {/* Price Level Markers (MT5 Style - Right Side) */}
        <div className="absolute top-0 bottom-0 right-0 flex flex-col justify-center gap-3 pr-2" style={{ width: '180px' }}>
          {/* Entry Price Marker - Orange */}
          <div className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg border-2 border-white">
            <div className="w-3 h-3 rounded-full bg-white flex-shrink-0"></div>
            <div className="flex-1">
              <div className="text-[10px] font-medium opacity-90">Entry</div>
              <div className="text-sm font-bold">${entryPrice.toFixed(2)}</div>
            </div>
          </div>

          {/* Exit Price Marker - Blue */}
          {exitPrice && (
            <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg border-2 border-white">
              <div className="w-3 h-3 rounded-full bg-white flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-[10px] font-medium opacity-90">Exit</div>
                <div className="text-sm font-bold">${exitPrice.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Stop Loss Marker - Red */}
          {stopLoss && (
            <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg border-2 border-white">
              <div className="w-2.5 h-2.5 rounded-full bg-white flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-[10px] font-medium opacity-90">Stop Loss</div>
                <div className="text-sm font-bold">${stopLoss.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Take Profit Marker - Green */}
          {takeProfit && (
            <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg border-2 border-white">
              <div className="w-2.5 h-2.5 rounded-full bg-white flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-[10px] font-medium opacity-90">Take Profit</div>
                <div className="text-sm font-bold">${takeProfit.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trade Timeline */}
      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Trade Timeline</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              E
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500">Entry Position</div>
              <div className="text-sm font-semibold text-slate-900">
                ${entryPrice.toFixed(2)} · {new Date(entryDate).toLocaleDateString()} {new Date(entryDate).toLocaleTimeString()}
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${side === 'LONG' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {side}
            </div>
          </div>

          {exitPrice && exitDate && (
            <>
              <div className="ml-4 border-l-2 border-slate-300 h-4"></div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${isProfit ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center text-white text-xs font-bold`}>
                  X
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500">Exit Position</div>
                  <div className="text-sm font-semibold text-slate-900">
                    ${exitPrice.toFixed(2)} · {new Date(exitDate).toLocaleDateString()} {new Date(exitDate).toLocaleTimeString()}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isProfit ? '+' : ''}{pnl.toFixed(2)}%
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm border-t pt-4">
        <div>
          <p className="text-slate-500 text-xs sm:text-sm">Entry</p>
          <p className="font-semibold text-slate-900 text-sm sm:text-base">${entryPrice.toFixed(2)}</p>
        </div>
        {exitPrice && (
          <div>
            <p className="text-slate-500 text-xs sm:text-sm">Exit</p>
            <p className="font-semibold text-slate-900 text-sm sm:text-base">${exitPrice.toFixed(2)}</p>
          </div>
        )}
        {stopLoss && (
          <div>
            <p className="text-slate-500 text-xs sm:text-sm">Stop Loss</p>
            <p className="font-semibold text-red-600 text-sm sm:text-base">${stopLoss.toFixed(2)}</p>
          </div>
        )}
        {takeProfit && (
          <div>
            <p className="text-slate-500 text-xs sm:text-sm">Take Profit</p>
            <p className="font-semibold text-green-600 text-sm sm:text-base">${takeProfit.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
