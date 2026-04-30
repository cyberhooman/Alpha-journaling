import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CurrencyDollar,
  Target,
  ChartLine,
  Trophy,
  Clock,
  ArrowUp,
  ArrowDown,
  TrendUp,
  TrendDown,
  ArrowRight,
  WarningCircle,
  Lightning,
} from '@phosphor-icons/react';
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.32, 0.72, 0, 1] },
  }),
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 overflow-hidden" style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
      <div className="h-3 w-20 rounded-md mb-4" style={{ background: 'rgb(var(--surface-2))' }} />
      <div className="h-8 w-28 rounded-md" style={{ background: 'rgb(var(--surface-2))' }} />
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgb(var(--surface-2))',
  border: '1px solid #303030',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  color: 'rgb(var(--text-primary))',
  fontSize: '12px',
};

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
      accountId: selectedAccountId === 'all' ? undefined : selectedAccountId,
    }),
  });

  useEffect(() => {
    if (!isLoading && !isFetching) { setShowSlowLoadHint(false); return; }
    const t = window.setTimeout(() => setShowSlowLoadHint(true), 8000);
    return () => window.clearTimeout(t);
  }, [isLoading, isFetching]);

  const overview = stats?.data.overview || {
    totalPnl: 0, winRate: 0, totalTrades: 0, profitFactor: 0,
    winningTrades: 0, losingTrades: 0, openTrades: 0, avgPnl: 0,
    avgWin: 0, avgLoss: 0, bestTrade: 0, worstTrade: 0, avgHoldingDays: 0,
  };

  const isProfitable = overview.totalPnl >= 0;

  const statCards = [
    {
      title: 'Total P&L',
      value: overview.totalPnl,
      prefix: '$',
      decimals: 2,
      icon: CurrencyDollar,
      accent: isProfitable ? '#34d399' : '#f87171',
      sub: isProfitable ? 'Profitable' : 'Drawdown',
    },
    {
      title: 'Win Rate',
      value: overview.winRate,
      suffix: '%',
      decimals: 1,
      icon: Target,
      accent: '#FF7522',
      sub: `${overview.winningTrades}W / ${overview.losingTrades}L`,
    },
    {
      title: 'Total Trades',
      value: overview.totalTrades,
      decimals: 0,
      icon: ChartLine,
      accent: '#60a5fa',
      sub: `${overview.openTrades} open`,
    },
    {
      title: 'Profit Factor',
      value: overview.profitFactor,
      decimals: 2,
      icon: Trophy,
      accent: '#a78bfa',
      sub: overview.profitFactor >= 1.5 ? 'Excellent' : overview.profitFactor >= 1 ? 'Positive' : 'Below target',
    },
    {
      title: 'Avg Hold Time',
      value: overview.avgHoldingDays || 0,
      suffix: 'd',
      decimals: 1,
      icon: Clock,
      accent: '#fb923c',
      sub: 'per trade',
    },
  ];

  const pnlChartData = stats?.data.pnlByDay.map((item) => ({
    date: format(parseISO(item.date), 'MMM dd'),
    pnl: Number(item.pnl),
  })) || [];

  const symbolsData = stats?.data.pnlBySymbol.slice(0, 6).map((item) => ({
    name: item.symbol,
    pnl: Number(item.total_pnl),
  })) || [];

  const selectedAccount = accounts?.data?.find((acc: any) => acc.id === Number(selectedAccountId));

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {dashboardError && (
        <div className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <div className="flex items-center gap-3">
            <WarningCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgb(var(--red))' }}>Failed to load dashboard</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-secondary))' }}>
                {(dashboardError as any)?.message || 'Request failed'}
              </p>
            </div>
          </div>
          <button onClick={() => refetchDashboard()} className="btn btn-secondary text-xs px-3 py-1.5">Retry</button>
        </div>
      )}

      {showSlowLoadHint && (isFetching || isLoading) && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-3"
          style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}>
          <Lightning weight="fill" className="w-4 h-4 flex-shrink-0" style={{ color: '#fb923c' }} />
          <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>Server is warming up — this may take a moment.</p>
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Overview</p>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
              {selectedAccountId === 'all' ? 'All Accounts' : (selectedAccount?.name || 'Dashboard')}
            </h1>
          </div>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="input w-auto text-sm"
            style={{ minWidth: 160 }}
          >
            <option value="all">All Accounts</option>
            {accounts?.data?.map((account: any) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="stat-card"
            >
              <div className="stat-card-inner">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${card.accent}18`, border: `1px solid ${card.accent}22` }}>
                  <card.icon weight="duotone" className="w-4 h-4" style={{ color: card.accent }} />
                </div>
                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'rgb(var(--text-muted))' }}>{card.title}</p>
                <p className="text-xl font-bold font-mono-nums leading-none" style={{ color: card.accent }}>
                  {card.prefix || ''}<CountingNumber value={card.value} decimals={card.decimals} duration={1200} />{card.suffix || ''}
                </p>
                <p className="text-[10px] mt-1.5" style={{ color: 'rgb(var(--text-muted))' }}>{card.sub}</p>
              </div>
            </motion.div>
          ))
        }
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="chart-card">
          <div className="flex items-center gap-2 mb-5">
            <TrendUp weight="duotone" className="w-4 h-4" style={{ color: '#FF7522' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>P&L over time</h3>
          </div>
          {pnlChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={pnlChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="#444" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#444" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: '#333' }} />
                <Line type="monotone" dataKey="pnl" stroke="#FF7522" strokeWidth={2.5}
                  dot={false} activeDot={{ r: 5, fill: '#FF7522', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2">
              <TrendUp className="w-10 h-10" style={{ color: '#252525' }} />
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>No data yet</p>
            </div>
          )}
        </motion.div>

        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="chart-card">
          <div className="flex items-center gap-2 mb-5">
            <Trophy weight="duotone" className="w-4 h-4" style={{ color: '#a78bfa' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Top symbols by P&L</h3>
          </div>
          {symbolsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={symbolsData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="#444" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#444" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]} fill="#FF7522" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2">
              <Trophy className="w-10 h-10" style={{ color: '#252525' }} />
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>No symbols yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="chart-card">
          <p className="text-[11px] uppercase tracking-wider mb-4 font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Trade breakdown</p>
          <div className="space-y-2">
            {[
              { label: 'Winning', value: overview.winningTrades, color: '#34d399' },
              { label: 'Losing', value: overview.losingTrades, color: '#f87171' },
              { label: 'Open', value: overview.openTrades, color: '#60a5fa' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-xl"
                style={{ background: `${item.color}0d` }}>
                <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{item.label}</span>
                <span className="text-sm font-bold font-mono-nums" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="chart-card">
          <p className="text-[11px] uppercase tracking-wider mb-4 font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Averages</p>
          <div className="space-y-2">
            {[
              { label: 'Avg P&L', value: `$${Math.abs(overview.avgPnl).toFixed(2)}`, color: overview.avgPnl >= 0 ? '#34d399' : '#f87171' },
              { label: 'Avg Win', value: `$${overview.avgWin.toFixed(2)}`, color: '#34d399' },
              { label: 'Avg Loss', value: `$${Math.abs(overview.avgLoss).toFixed(2)}`, color: '#f87171' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{item.label}</span>
                <span className="text-sm font-bold font-mono-nums" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible" className="chart-card">
          <p className="text-[11px] uppercase tracking-wider mb-4 font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Extremes</p>
          <div className="space-y-2">
            {[
              { label: 'Best trade', value: `$${overview.bestTrade.toFixed(2)}`, color: '#34d399', Icon: ArrowUp },
              { label: 'Worst trade', value: `$${Math.abs(overview.worstTrade).toFixed(2)}`, color: '#f87171', Icon: ArrowDown },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-xl"
                style={{ background: `${item.color}0d` }}>
                <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{item.label}</span>
                <span className="text-sm font-bold font-mono-nums" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent trades table */}
      <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible" className="chart-card">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Recent trades</p>
          <a href="/trades" className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: '#FF7522' }}>
            View all <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        {recentTrades?.data && recentTrades.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>P&L</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.data.map((trade: any) => (
                  <tr key={trade.id}>
                    <td className="font-semibold">{trade.symbol}</td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs font-medium w-fit"
                        style={{ color: trade.side === 'LONG' ? '#34d399' : '#f87171' }}>
                        {trade.side === 'LONG'
                          ? <TrendUp weight="bold" className="w-3 h-3" />
                          : <TrendDown weight="bold" className="w-3 h-3" />}
                        {trade.side}
                      </span>
                    </td>
                    <td className="font-mono-nums text-xs" style={{ color: '#666' }}>
                      {trade.entry_price ? `$${trade.entry_price}` : '—'}
                    </td>
                    <td className="font-mono-nums text-xs" style={{ color: '#666' }}>
                      {trade.exit_price ? `$${trade.exit_price}` : '—'}
                    </td>
                    <td className="font-mono-nums font-semibold text-sm"
                      style={{ color: (trade.pnl || 0) >= 0 ? '#34d399' : '#f87171' }}>
                      {trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        trade.status === 'OPEN' ? 'badge-orange' : 'badge-neutral'
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
          <div className="py-14 flex flex-col items-center gap-3">
            <ChartLine className="w-10 h-10" style={{ color: '#252525' }} />
            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>No trades recorded yet</p>
            <a href="/trades/new" className="btn btn-primary text-xs px-4 py-2">Add your first trade</a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
