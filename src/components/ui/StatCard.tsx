import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { StatCardData } from '../../types';

type StatCardProps = StatCardData;

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon,
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-border p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-text font-medium">{label}</p>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary mb-1">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp size={14} className="text-status-green" />
          ) : (
            <TrendingDown size={14} className="text-status-red" />
          )}
          <span className={`text-xs font-medium ${isPositive ? 'text-status-green' : 'text-status-red'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-gray-label">from last month</span>
        </div>
      )}
    </div>
  );
};
