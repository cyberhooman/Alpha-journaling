import React from 'react';
import { RealTimeAnalytics } from '../components/RealTimeAnalytics';
import { SubscriptionAnalytics } from '../components/SubscriptionAnalytics';
import { PaymentRecovery } from '../components/PaymentRecovery';
import { CancellationInsights } from '../components/CancellationInsights';
import { FinancialForecasting } from '../components/FinancialForecasting';

export const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Track, analyze, and optimize your business performance
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Row - Real Time Analytics & Subscription Analytics */}
          <div className="lg:col-span-1">
            <RealTimeAnalytics />
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubscriptionAnalytics />
            <PaymentRecovery />
          </div>

          {/* Bottom Row - Cancellation Insights & Financial Forecasting */}
          <div className="lg:col-span-2">
            <CancellationInsights />
          </div>

          <div className="lg:col-span-1">
            <FinancialForecasting />
          </div>
        </div>
      </div>
    </div>
  );
};
