import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  Award,
  Zap,
  BarChart2,
} from 'lucide-react';
import { analyticsAPI, tradesAPI } from '../lib/api';
import { DashboardStats } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import CountingNumber from '../components/CountingNumber';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<{ data: DashboardStats }>({
    queryKey: ['dashboard'],
    queryFn: () => analyticsAPI.getDashboard(),
  });

  const { data: recentTrades } = useQuery({
    queryKey: ['recent-trades'],
    queryFn: () => tradesAPI.getAll({ limit: 5 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-terminal-border"></div>
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-500 absolute top-0"></div>
          <Zap className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />
        </div>
      </div>
    );
  }

  const overview = stats?.data.overview || {
    totalPnl: 0,
    winRate: 0,
    totalTrades: 0,
    profitFactor: 0,
    winningTrades: 0,
    losingTrades: 0,
    openTrades: 0,
    avgPnl: 0,
    avgWin: 0,
    avgLoss: 0,
    bestTrade: 0,
    worstTrade: 0,
  };

  const isProfitable = overview.totalPnl >= 0;

  const statCards = [
    {
      title: 'Total P&L',
      value: overview.totalPnl,
      prefix: '$',
      decimals: 2,
      icon: DollarSign,
      gradient: isProfitable
        ? 'from-green-900/50 via-green-800/30 to-terminal-surface'
        : 'from-red-900/50 via-red-800/30 to-terminal-surface',
      textColor: isProfitable ? 'neon-glow-green' : 'neon-glow-red',
      iconColor: isProfitable ? 'text-green-400' : 'text-red-400',
      borderGlow: isProfitable ? 'shadow-green-900/50' : 'shadow-red-900/50',
    },
    {
      title: 'Win Rate',
      value: overview.winRate,
      suffix: '%',
      decimals: 1,
      icon: Target,
      gradient: 'from-blue-900/50 via-blue-800/30 to-terminal-surface',
      textColor: 'neon-glow-blue',
      iconColor: 'text-blue-400',
      borderGlow: 'shadow-blue-900/50',
    },
    {
      title: 'Total Trades',
      value: overview.totalTrades,
      decimals: 0,
      icon: Activity,
      gradient: 'from-purple-900/50 via-purple-800/30 to-terminal-surface',
      textColor: 'text-purple-400',
      iconColor: 'text-purple-400',
      borderGlow: 'shadow-purple-900/50',
    },
    {
      title: 'Profit Factor',
      value: overview.profitFactor,
      decimals: 2,
      icon: Award,
      gradient: 'from-amber-900/50 via-amber-800/30 to-terminal-surface',
      textColor: 'text-amber-400',
      iconColor: 'text-amber-400',
      borderGlow: 'shadow-amber-900/50',
    },
  ];

  // Format PnL by day data
  const pnlChartData = stats?.data.pnlByDay.map((item) => ({
    date: format(parseISO(item.date), 'MMM dd'),
    pnl: Number(item.pnl),
  })) || [];

  // Top symbols data
  const symbolsData = stats?.data.pnlBySymbol.slice(0, 5).map((item) => ({
    name: item.symbol,
    pnl: Number(item.total_pnl),
    trades: Number(item.trades),
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - Terminal Style */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-transparent rounded-xl border border-terminal-border p-6 backdrop-blur-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <BarChart2 className="w-8 h-8 text-blue-400 animate-pulse-glow" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-terminal-text tracking-tight">DASHBOARD</h1>
              <p className="text-xs text-terminal-muted font-mono mt-1">REAL-TIME TRADING ANALYTICS</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* Stat Cards - Terminal Financial Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`stat-card animate-slide-in-up hover:${stat.borderGlow} bg-gradient-to-br ${stat.gradient}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative z-10">
              {/* Label */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-terminal-muted uppercase tracking-widest">
                  {stat.title}
                </p>
                <div className={`p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/5`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>

              {/* Value - Monospace */}
              <div className={`text-4xl sm:text-5xl font-bold ${stat.textColor} tracking-tight mono-number`}>
                <CountingNumber
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  duration={1500}
                />
              </div>

              {/* Decorative grid line */}
              <div className="mt-4 h-px bg-gradient-to-r from-white/10 via-white/20 to-transparent"></div>
            </div>

            {/* Corner accent */}
            <div className={`absolute top-0 right-0 w-20 h-20 ${stat.iconColor} opacity-5 blur-2xl rounded-full`}></div>
          </div>
        ))}
      </div>

      {/* Charts - Dark Terminal Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PnL Over Time */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-terminal-text flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              P&L CURVE
            </h3>
            <span className="text-xs font-mono text-terminal-muted bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              {pnlChartData.length} DAYS
            </span>
          </div>
          {pnlChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={pnlChartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={11}
                  fontFamily="DM Mono, monospace"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  fontFamily="DM Mono, monospace"
                  tick={{ fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151921',
                    border: '1px solid #1f2937',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorPnl)"
                  dot={{ fill: '#3b82f6', r: 3, strokeWidth: 2, stroke: '#1e40af' }}
                  activeDot={{ r: 5, fill: '#60a5fa', stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-terminal-muted">
              <TrendingUp className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-sm font-mono uppercase tracking-wider">No Chart Data</p>
              <p className="text-xs mt-1">Start adding trades to see your performance</p>
            </div>
          )}
        </div>

        {/* Top Symbols */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-terminal-text flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              TOP SYMBOLS
            </h3>
            <span className="text-xs font-mono text-terminal-muted bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              BY P&L
            </span>
          </div>
          {symbolsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={symbolsData}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.5}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.5} />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={11}
                  fontFamily="DM Mono, monospace"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  fontFamily="DM Mono, monospace"
                  tick={{ fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151921',
                    border: '1px solid #1f2937',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar
                  dataKey="pnl"
                  fill="url(#colorBar)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-terminal-muted">
              <Award className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-sm font-mono uppercase tracking-wider">No Symbol Data</p>
              <p className="text-xs mt-1">Trade more symbols to see rankings</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades - Terminal Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-terminal-text flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            RECENT TRADES
          </h3>
          <a
            href="/trades"
            className="text-xs font-mono text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors"
          >
            View All →
          </a>
        </div>
        {recentTrades?.data && recentTrades.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-terminal-border">
                  <th className="text-left py-3 px-4 text-xs font-bold text-terminal-muted uppercase tracking-wider">Symbol</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-terminal-muted uppercase tracking-wider">Side</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-terminal-muted uppercase tracking-wider">Entry</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-terminal-muted uppercase tracking-wider">Exit</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-terminal-muted uppercase tracking-wider">P&L</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.data.map((trade: any, idx: number) => (
                  <tr
                    key={trade.id}
                    className="border-b border-terminal-border/50 hover:bg-blue-500/5 transition-colors"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td className="py-3 px-4">
                      <a
                        href={`/trades/${trade.id}`}
                        className="font-mono text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {trade.symbol}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                        trade.side === 'LONG' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.side === 'LONG' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trade.side}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-terminal-text">
                      ${trade.entry_price ? Number(trade.entry_price).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-terminal-text">
                      ${trade.exit_price ? Number(trade.exit_price).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono text-sm font-bold ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-terminal-muted">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-10" />
            <p className="text-sm font-mono uppercase tracking-wider">No Recent Trades</p>
            <a href="/trades/new" className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block">
              Add your first trade
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
