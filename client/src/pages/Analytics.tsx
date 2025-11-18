import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../lib/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Analytics() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsAPI.getDashboard(),
  });

  const { data: performance } = useQuery({
    queryKey: ['performance'],
    queryFn: () => analyticsAPI.getPerformance(),
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const winRateByDayData = stats?.data.winRateByDay.map((item: any) => ({
    day: dayNames[Number(item.day_of_week)],
    winRate: (Number(item.wins) / Number(item.trades)) * 100,
    trades: Number(item.trades),
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
        <p className="text-slate-600 mt-1">Deep dive into your trading performance</p>
      </div>

      {/* Performance Metrics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-600">Expectancy</p>
            <p className="text-2xl font-bold text-primary-600">
              ${performance?.data.expectancy.toFixed(2) || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Max Win Streak</p>
            <p className="text-2xl font-bold text-green-600">
              {performance?.data.maxWinStreak || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Max Loss Streak</p>
            <p className="text-2xl font-bold text-red-600">
              {performance?.data.maxLossStreak || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Avg R:R Ratio</p>
            <p className="text-2xl font-bold text-purple-600">
              {performance?.data.avgRewardRiskRatio.toFixed(2) || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Performance */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance by Strategy</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats?.data.pnlByStrategy || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="strategy" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_pnl" fill="#0ea5e9" name="Total P&L" />
            <Bar dataKey="trades" fill="#10b981" name="Trades" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Setup Performance */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance by Setup</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats?.data.pnlBySetup || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="setup" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_pnl" fill="#8b5cf6" name="Total P&L" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Win Rate by Day */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Win Rate by Day of Week</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={winRateByDayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="winRate"
              stroke="#10b981"
              strokeWidth={2}
              name="Win Rate %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
