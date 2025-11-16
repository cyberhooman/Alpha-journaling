import React from 'react';
import { Card } from './Card';
import { TrendingUp } from 'lucide-react';

export const SubscriptionAnalytics: React.FC = () => {
  return (
    <Card
      title="Subscription Analytics"
      subtitle="Track, analyze, and improve your subscription business."
      icon={TrendingUp}
      className="bg-gradient-to-br from-white to-purple-50/20"
    >
      <div className="text-gray-600">
        Coming soon...
      </div>
    </Card>
  );
};
