import React from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from './Card';
import { UserMinus as UserX } from '@phosphor-icons/react';

const cancellationReasons = [
  { reason: 'Too expensive', percentage: 47.1, color: '#6366f1' },
  { reason: 'Switching to another product', percentage: 17.6, color: '#ff6b35' },
  { reason: 'Others', percentage: 14.8, color: '#e5e7eb' },
  { reason: 'Technical issue', percentage: 20.7, color: '#e5e7eb' }
];

const incomeData = [
  { month: 'Jan', revenues: 4500, incidents: 3200 },
  { month: 'Feb', revenues: 5200, incidents: 3800 },
  { month: 'Mar', revenues: 4800, incidents: 4200 },
  { month: 'Apr', revenues: 6200, incidents: 4500 },
  { month: 'May', revenues: 7100, incidents: 5200 },
  { month: 'Jun', revenues: 6800, incidents: 5800 }
];

export const CancellationInsights: React.FC = () => {
  return (
    <Card
      title="Cancellation Insights"
      subtitle="Gain insights into why customers cancel and reduce churn. Gain insights into why customers."
      icon={UserX}
      className="bg-gradient-to-br from-white to-pink-50/20"
    >
      <div className="space-y-6">
        {/* Total Cancellations */}
        <div>
          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-sm text-gray-600">Total cancellations</p>
            <p className="text-2xl font-bold text-gray-900">34</p>
            <p className="text-sm text-gray-400">/100</p>
          </div>

          {/* Horizontal Bar */}
          <div className="w-full h-8 bg-gray-100 rounded-full overflow-hidden flex mb-6">
            <div
              className="bg-indigo-500 h-full"
              style={{ width: `${cancellationReasons[0].percentage}%` }}
            />
            <div
              className="bg-orange-500 h-full"
              style={{ width: `${cancellationReasons[1].percentage}%` }}
            />
          </div>

          {/* Reasons List */}
          <div className="space-y-3">
            {cancellationReasons.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.reason}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Income Chart */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-900">Total income</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                <span className="text-xs text-gray-500">Revenues</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full" />
                <span className="text-xs text-gray-500">Incidents</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-indigo-50/50 to-transparent rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="revenues"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Revenue Badge */}
            <div className="flex justify-center mt-2">
              <div className="bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-full">
                $6.2k
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
