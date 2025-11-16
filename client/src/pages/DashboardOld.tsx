import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  Award,
} from 'lucide-react';
import { analyticsAPI, tradesAPI } from '../lib/api';
import { DashboardStats } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const overview = stats?.data.overview;

  const statCards = [
    {
      title: 'Total P&L',
      value: `$${overview?.totalPnl.toFixed(2) || 0}`,
      icon: DollarSign,
      color: (overview?.totalPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: (overview?.totalPnl || 0) >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: 'Win Rate',
      value: `${overview?.winRate.toFixed(1) || 0}%`,
      icon: Target,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Total Trades',
      value: overview?.totalTrades || 0,
      icon: Activity,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
    {
      title: 'Profit Factor',
      value: overview?.profitFactor.toFixed(2) || 0,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
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

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's your trading overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PnL Over Time */}
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">P&L Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={pnlChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Symbols */}
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Symbols by P&L</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={symbolsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pnl" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Winning Trades</span>
              <span className="font-semibold text-green-600">
                {overview?.winningTrades || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Losing Trades</span>
              <span className="font-semibold text-red-600">
                {overview?.losingTrades || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Open Trades</span>
              <span className="font-semibold text-blue-600">
                {overview?.openTrades || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Average Trades</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Avg P&L</span>
              <span className={`font-semibold ${(overview?.avgPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${overview?.avgPnl.toFixed(2) || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Avg Win</span>
              <span className="font-semibold text-green-600">
                ${overview?.avgWin.toFixed(2) || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Avg Loss</span>
              <span className="font-semibold text-red-600">
                ${Math.abs(overview?.avgLoss || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Best/Worst</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Best Trade</span>
              <span className="font-semibold text-green-600">
                ${overview?.bestTrade.toFixed(2) || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Worst Trade</span>
              <span className="font-semibold text-red-600">
                ${overview?.worstTrade.toFixed(2) || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Trades</h3>
          <a href="/trades" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Symbol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Side</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Entry</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Exit</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">P&L</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentTrades?.data.map((trade: any) => (
                <tr key={trade.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 ${trade.side === 'LONG' ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.side === 'LONG' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-3">${trade.entry_price}</td>
                  <td className="px-4 py-3">{trade.exit_price ? `$${trade.exit_price}` : '-'}</td>
                  <td className={`px-4 py-3 font-semibold ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trade.status === 'CLOSED' ? 'bg-slate-100 text-slate-700' :
                      trade.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
