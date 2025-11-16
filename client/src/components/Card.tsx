import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  icon: Icon,
  badge
}) => {
  return (
    <div className={`bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 ${className}`}>
      {(title || subtitle || Icon) && (
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {badge}
              {Icon && (
                <div className="bg-purple-50 p-2.5 rounded-xl">
                  <Icon className="w-5 h-5 text-purple-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
