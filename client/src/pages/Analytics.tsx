import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../lib/api';
import { motion } from 'framer-motion';
import { ChartBar, TrendUp, Lightning, ArrowUp, ArrowDown, Target } from '@phosphor-icons/react';
const TrendingUp = TrendUp;
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{ background: '#1e1e1e', border: '1px solid #282828' }}
        className="rounded-xl p-3 shadow-xl text-sm"
      >
        <p className="text-[#8c8c8c] mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-mono-nums font-semibold">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
  const winRateByDayData =
    stats?.data.winRateByDay.map((item: any) => ({
      day: dayNames[Number(item.day_of_week)],
      winRate: (Number(item.wins) / Number(item.trades)) * 100,
      trades: Number(item.trades),
    })) || [];

  const metrics = [
    {
      label: 'Expectancy',
      value: `$${(performance?.data.expectancy ?? 0).toFixed(2)}`,
      icon: Target,
      color: '#FF7522',
    },
    {
      label: 'Max Win Streak',
      value: performance?.data.maxWinStreak ?? 0,
      icon: ArrowUp,
      color: '#34d399',
    },
    {
      label: 'Max Loss Streak',
      value: performance?.data.maxLossStreak ?? 0,
      icon: ArrowDown,
      color: '#f87171',
    },
    {
      label: 'Avg R:R Ratio',
      value: (performance?.data.avgRewardRiskRatio ?? 0).toFixed(2),
      icon: Lightning,
      color: '#a78bfa',
    },
  ];

  const axisProps = {
    tick: { fill: '#555', fontSize: 11, fontFamily: 'Outfit, sans-serif' },
    axisLine: { stroke: '#282828' },
    tickLine: false,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <p className="text-xs uppercase tracking-widest font-semibold text-[#555] mb-1">
          Performance
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold">Advanced Analytics</h1>
        <p className="text-[#8c8c8c] mt-1 text-sm">Deep dive into your trading performance</p>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              custom={i + 1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="card p-5 flex flex-col gap-3"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${m.color}18` }}
              >
                <Icon size={18} weight="bold" style={{ color: m.color }} />
              </div>
              <div>
                <p className="text-xs text-[#555] uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-2xl font-bold font-mono-nums" style={{ color: m.color }}>
                  {m.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Strategy Performance */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#FF7522]/10 flex items-center justify-center">
            <ChartBar size={16} weight="bold" className="text-[#FF7522]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-[#555]">Breakdown</p>
            <h3 className="text-base font-semibold">Performance by Strategy</h3>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats?.data.pnlByStrategy || []} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#282828" vertical={false} />
            <XAxis dataKey="strategy" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#282828' }} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#8c8c8c', fontFamily: 'Outfit, sans-serif' }}
            />
            <Bar dataKey="total_pnl" fill="#FF7522" name="Total P&L" radius={[4, 4, 0, 0]} />
            <Bar dataKey="trades" fill="#34d399" name="Trades" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Setup Performance */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center">
            <ChartBar size={16} weight="bold" style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-[#555]">Breakdown</p>
            <h3 className="text-base font-semibold">Performance by Setup</h3>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats?.data.pnlBySetup || []} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#282828" vertical={false} />
            <XAxis dataKey="setup" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#282828' }} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#8c8c8c', fontFamily: 'Outfit, sans-serif' }}
            />
            <Bar dataKey="total_pnl" fill="#a78bfa" name="Total P&L" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Win Rate by Day */}
      <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#34d399]/10 flex items-center justify-center">
            <TrendingUp size={16} weight="bold" style={{ color: '#34d399' }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-[#555]">Patterns</p>
            <h3 className="text-base font-semibold">Win Rate by Day of Week</h3>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={winRateByDayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#282828" vertical={false} />
            <XAxis dataKey="day" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#282828' }} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#8c8c8c', fontFamily: 'Outfit, sans-serif' }}
            />
            <Line
              type="monotone"
              dataKey="winRate"
              stroke="#34d399"
              strokeWidth={2}
              name="Win Rate %"
              dot={{ fill: '#34d399', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#34d399' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
