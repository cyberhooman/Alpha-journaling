import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from './Card';
import { DollarSign, ChevronDown } from 'lucide-react';

const data = [
  { name: 'Recovered', value: 70 },
  { name: 'Failed', value: 30 }
];

const COLORS = ['#ff6b35', '#6366f1'];

export const PaymentRecovery: React.FC = () => {
  return (
    <Card
      title="Payment Recovery"
      subtitle="Get help with failed charges and recover revenue. Track, analyze, and improve your subscription business."
      icon={DollarSign}
      className="bg-gradient-to-br from-white to-blue-50/20"
    >
      <div className="space-y-4">
        {/* Lifetime Stats */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-orange-100 p-1.5 rounded-lg">
                <div className="w-4 h-4 bg-orange-500 rounded" />
              </div>
              <span className="text-sm text-gray-600">Lifetime</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">$289,265.22</p>
            <p className="text-xs text-gray-500 mt-1">Failed charges</p>
          </div>

          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-gray-500">20%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Yearly</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* Second Amount Display */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-100 p-1.5 rounded-lg">
              <div className="w-4 h-4 bg-blue-500 rounded" />
            </div>
            <span className="text-sm text-gray-600">Yearly</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">$289,265.22</p>
        </div>
      </div>
    </Card>
  );
};
