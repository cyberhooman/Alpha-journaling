import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  Award,
  Sparkles,
  Clock,
} from 'lucide-react';
import { analyticsAPI, tradesAPI, accountsAPI } from '../lib/api';
import { DashboardStats } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import CountingNumber from '../components/CountingNumber';

export default function Dashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [showSlowLoadHint, setShowSlowLoadHint] = useState(false);

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  const {
    data: stats,
    isLoading,
    isFetching,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery<{ data: DashboardStats }>({
    queryKey: ['dashboard', selectedAccountId],
    queryFn: () => analyticsAPI.getDashboard(
      selectedAccountId === 'all' ? {} : { accountId: selectedAccountId }
    ),
  });

  const { data: recentTrades } = useQuery({
    queryKey: ['recent-trades', selectedAccountId],
    queryFn: () => tradesAPI.getAll({
      limit: 5,
      accountId: selectedAccountId === 'all' ? undefined : selectedAccountId
    }),
  });

  useEffect(() => {
    if (!isLoading && !isFetching) {
      setShowSlowLoadHint(false);
      return;
    }

    const t = window.setTimeout(() => setShowSlowLoadHint(true), 8000);
    return () => window.clearTimeout(t);
  }, [isLoading, isFetching]);

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
    avgHoldingDays: 0,
  };

  const isProfitable = overview.totalPnl >= 0;

  const statCards = [
    {
      title: 'Total P&L',
      value: overview.totalPnl,
      prefix: '$',
      decimals: 2,
      icon: DollarSign,
      color: isProfitable ? 'text-green-600' : 'text-red-600',
      bgGradient: isProfitable ? 'from-green-50 to-emerald-50' : 'from-red-50 to-rose-50',
      iconBg: isProfitable ? 'bg-green-100' : 'bg-red-100',
      glowColor: isProfitable ? 'shadow-green-200' : 'shadow-red-200',
    },
    {
      title: 'Win Rate',
      value: overview.winRate,
      suffix: '%',
      decimals: 1,
      icon: Target,
      color: 'text-primary-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-primary-100',
      glowColor: 'shadow-primary-200',
    },
    {
      title: 'Total Trades',
      value: overview.totalTrades,
      decimals: 0,
      icon: Activity,
      color: 'text-slate-600',
      bgGradient: 'from-slate-50 to-gray-50',
      iconBg: 'bg-slate-100',
      glowColor: 'shadow-slate-200',
    },
    {
      title: 'Profit Factor',
      value: overview.profitFactor,
      decimals: 2,
      icon: Award,
      color: 'text-purple-600',
      bgGradient: 'from-purple-50 to-violet-50',
      iconBg: 'bg-purple-100',
      glowColor: 'shadow-purple-200',
    },
    {
      title: 'Avg Hold Time',
      value: overview.avgHoldingDays || 0,
      suffix: ' days',
      decimals: 1,
      icon: Clock,
      color: 'text-amber-600',
      bgGradient: 'from-amber-50 to-orange-50',
      iconBg: 'bg-amber-100',
      glowColor: 'shadow-amber-200',
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

  const selectedAccount = accounts?.data?.find((acc: any) => acc.id === Number(selectedAccountId));

  return (
    <div className="space-y-4 sm:space-y-6">
      {(isLoading || isFetching) && showSlowLoadHint && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-amber-900">
              <p className="font-semibold">Still loading your dashboard…</p>
              <p className="text-sm text-amber-800">
                If you’re on a free hosting tier, the server may be waking up. If this keeps happening, we should check which API call is slow.
              </p>
            </div>
            <button
              onClick={() => refetchDashboard()}
              className="btn btn-secondary w-full sm:w-auto"
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {dashboardError && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-red-900">
              <p className="font-semibold">Dashboard failed to load.</p>
              <p className="text-sm text-red-800">
                {(dashboardError as any)?.message || 'Request failed'}{' '}
                {(dashboardError as any)?.code ? `(${(dashboardError as any).code})` : ''}
              </p>
            </div>
            <button
              onClick={() => refetchDashboard()}
              className="btn btn-secondary w-full sm:w-auto"
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Header with gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-800 dark:to-blue-800 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse-glow" />
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Dashboard</h1>
            </div>
            {/* Account Selector */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-2 bg-white/20 dark:bg-slate-700/80 backdrop-blur-sm border border-white/30 dark:border-slate-600 rounded-lg text-white font-medium hover:bg-white/30 dark:hover:bg-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="all" className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">All Accounts</option>
              {accounts?.data?.map((account: any) => (
                <option key={account.id} value={account.id} className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-primary-100 dark:text-slate-200 text-sm sm:text-lg">
            {selectedAccountId === 'all'
              ? "Welcome back! Here's your trading overview."
              : `Viewing stats for ${selectedAccount?.name || 'selected account'}`}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Enhanced Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`relative bg-gradient-to-br ${stat.bgGradient} rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:${stat.glowColor} overflow-hidden group`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {(isLoading || isFetching) && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-600"></div>
              </div>
            )}
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide">{stat.title}</p>
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${stat.iconBg} dark:bg-slate-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color} ${
                    stat.color.includes('green') ? 'dark:text-green-400' :
                    stat.color.includes('red') ? 'dark:text-red-400' :
                    stat.color.includes('primary') ? 'dark:text-primary-400' :
                    stat.color.includes('purple') ? 'dark:text-purple-400' :
                    'dark:text-slate-400'
                  } icon-glow`} />
                </div>
              </div>

              <div className={`text-3xl sm:text-5xl font-black ${stat.color} ${
                stat.color.includes('green') ? 'dark:text-green-400' :
                stat.color.includes('red') ? 'dark:text-red-400' :
                stat.color.includes('primary') ? 'dark:text-primary-400' :
                stat.color.includes('purple') ? 'dark:text-purple-400' :
                'dark:text-slate-300'
              } tracking-tight`}>
                <CountingNumber
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  duration={1500}
                />
              </div>
            </div>

            {/* Decorative corner element */}
            <div className="absolute -bottom-2 -right-2 w-16 h-16 sm:w-24 sm:h-24 bg-white/20 rounded-full blur-xl"></div>
          </div>
        ))}
      </div>

      {/* Charts with enhanced styling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* PnL Over Time */}
        <div className="chart-card">
          <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            P&L Over Time
          </h3>
          {pnlChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220} className="sm:h-[280px]">
              <LineChart data={pnlChartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="date" stroke="#64748b" className="dark:stroke-slate-400 sm:text-xs" fontSize={10} />
                <YAxis stroke="#64748b" className="dark:stroke-slate-400 sm:text-xs" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ fill: '#0ea5e9', r: 5 }}
                  activeDot={{ r: 7, fill: '#0369a1' }}
                  fill="url(#colorPnl)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium dark:text-slate-300">No chart data yet</p>
              <p className="text-sm dark:text-slate-400">Start adding trades to see your performance</p>
            </div>
          )}
        </div>

        {/* Top Symbols */}
        <div className="chart-card">
          <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            Top Symbols by P&L
          </h3>
          {symbolsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220} className="sm:h-[280px]">
              <BarChart data={symbolsData}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" stroke="#64748b" className="dark:stroke-slate-400 sm:text-xs" fontSize={10} />
                <YAxis stroke="#64748b" className="dark:stroke-slate-400 sm:text-xs" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="pnl" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <Award className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium dark:text-slate-300">No symbols traded yet</p>
              <p className="text-sm dark:text-slate-400">Your top performing symbols will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <div className="card">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            Performance
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Winning Trades</span>
              <span className="font-bold text-lg sm:text-xl text-green-600 dark:text-green-400">
                <CountingNumber value={overview.winningTrades} decimals={0} />
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Losing Trades</span>
              <span className="font-bold text-lg sm:text-xl text-red-600 dark:text-red-400">
                <CountingNumber value={overview.losingTrades} decimals={0} />
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Open Trades</span>
              <span className="font-bold text-lg sm:text-xl text-blue-600 dark:text-blue-400">
                <CountingNumber value={overview.openTrades} decimals={0} />
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            Average Trades
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Avg P&L</span>
              <span className={`font-bold text-lg sm:text-xl ${overview.avgPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                $<CountingNumber value={Math.abs(overview.avgPnl)} decimals={2} />
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Avg Win</span>
              <span className="font-bold text-lg sm:text-xl text-green-600 dark:text-green-400">
                $<CountingNumber value={overview.avgWin} decimals={2} />
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Avg Loss</span>
              <span className="font-bold text-lg sm:text-xl text-red-600 dark:text-red-400">
                $<CountingNumber value={Math.abs(overview.avgLoss)} decimals={2} />
              </span>
            </div>
          </div>
        </div>

        <div className="card sm:col-span-2 lg:col-span-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            Best/Worst
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Best Trade</span>
              <span className="font-bold text-lg sm:text-xl text-green-600 dark:text-green-400">
                $<CountingNumber value={overview.bestTrade} decimals={2} />
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Worst Trade</span>
              <span className="font-bold text-lg sm:text-xl text-red-600 dark:text-red-400">
                $<CountingNumber value={Math.abs(overview.worstTrade)} decimals={2} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            Recent Trades
          </h3>
          <a href="/trades" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs sm:text-sm font-semibold hover:underline">
            View all →
          </a>
        </div>

        {recentTrades?.data && recentTrades.data.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b-2 border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-200">Symbol</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-200">Side</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-200">Entry</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-200">Exit</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-200">P&L</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentTrades.data.map((trade: any) => (
                  <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-900 dark:text-white text-sm sm:text-base">{trade.symbol}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`inline-flex items-center gap-1 font-medium text-xs sm:text-sm ${trade.side === 'LONG' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {trade.side === 'LONG' ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      {trade.entry_price ? `$${trade.entry_price}` : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      {trade.exit_price ? `$${trade.exit_price}` : '-'}
                    </td>
                    <td className={`px-3 sm:px-4 py-2 sm:py-3 font-bold text-sm sm:text-base ${(trade.pnl || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                        trade.status === 'CLOSED' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200' :
                        trade.status === 'OPEN' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Activity className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium dark:text-slate-300">No trades yet</p>
            <p className="text-sm dark:text-slate-400 mb-4">Start by adding your first trade</p>
            <a href="/trades/new" className="btn btn-primary">
              Add Trade
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
