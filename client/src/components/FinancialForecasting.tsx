import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from './Card';
import { TrendingUp, FileText, ArrowUpDown, PieChart as PieChartIcon } from 'lucide-react';

const data = [
  { name: 'Revenue', value: 65 },
  { name: 'Forecast', value: 35 }
];

const COLORS = ['#ff6b35', '#f0f0f0'];

const financialCategories = [
  { icon: FileText, label: 'Balance sheets', color: 'bg-blue-50', iconColor: 'text-blue-600' },
  { icon: ArrowUpDown, label: 'Cash flow', color: 'bg-gray-50', iconColor: 'text-gray-600' },
  { icon: PieChartIcon, label: 'Profit and loss', color: 'bg-gray-50', iconColor: 'text-gray-600' }
];

export const FinancialForecasting: React.FC = () => {
  return (
    <Card
      title="Financial Forecasting"
      subtitle="Make future planning simple with accurate financial forecasts."
      icon={TrendingUp}
      className="bg-gradient-to-br from-white to-purple-50/20"
    >
      <div className="space-y-6">
        {/* Donut Chart with Revenue */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mb-2" />
              <p className="text-sm text-gray-500 mb-1">Revenue forecast</p>
              <p className="text-2xl font-bold text-gray-900">$8,105.90</p>
              <p className="text-xs text-gray-400 mt-1">Active users</p>
            </div>
          </div>
        </div>

        {/* Financial Categories */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          {financialCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`${category.color} p-3 rounded-xl mb-3`}>
                  <Icon className={`w-5 h-5 ${category.iconColor}`} />
                </div>
                <p className="text-xs text-gray-600 leading-tight">
                  {category.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
