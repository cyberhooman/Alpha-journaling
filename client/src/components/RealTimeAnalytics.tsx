import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';
import { Card } from './Card';
// import { Activity } from 'lucide-react';

const generateBarData = (value: number) => {
  return Array.from({ length: 30 }, (_, i) => ({
    value: Math.random() * value + value * 0.3,
    index: i
  }));
};

export const RealTimeAnalytics: React.FC = () => {
  const billingData = generateBarData(1228);
  const stockData = generateBarData(600);

  return (
    <Card
      title="Real time analytics"
      className="bg-gradient-to-br from-white to-orange-50/30"
    >
      <div className="space-y-6">
        {/* Billing Point */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Biling Point</p>
              <p className="text-2xl font-bold text-gray-900">1,228</p>
            </div>
            <p className="text-sm text-gray-400">/1928</p>
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={billingData}>
              <XAxis dataKey="index" hide />
              <Bar dataKey="value" fill="#ff6b35" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey={() => 800}
                fill="#ffcab0"
                radius={[4, 4, 0, 0]}
                opacity={0.3}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">600</p>
            </div>
            <p className="text-sm text-gray-400">/1928</p>
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={stockData}>
              <XAxis dataKey="index" hide />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey={() => 400}
                fill="#c7d2fe"
                radius={[4, 4, 0, 0]}
                opacity={0.3}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
