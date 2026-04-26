import React from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  icon: Icon,
  badge,
}) => {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle || Icon) && (
        <div className="mb-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-base font-semibold mb-0.5" style={{ color: '#f2f2f2' }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs" style={{ color: '#555' }}>
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {badge}
              {Icon && (
                <div className="p-2 rounded-xl" style={{ background: 'rgba(255,117,34,0.1)' }}>
                  <Icon className="w-4 h-4" style={{ color: '#FF7522' }} />
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
