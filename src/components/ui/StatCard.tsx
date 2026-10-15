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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-border dark:border-slate-700 p-3.5 sm:p-5 hover:shadow-md transition-shadow duration-200 min-w-0 overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs sm:text-sm text-gray-text dark:text-slate-400 font-medium truncate pr-2">{label}</p>
        {icon && (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary-50 dark:bg-emerald-950/50 flex items-center justify-center text-primary dark:text-emerald-400 shrink-0">
            {icon}
          </div>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white mb-1 truncate">{value}</p>
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
          <span className="text-xs text-gray-label dark:text-slate-500">from last month</span>
        </div>
      )}
    </div>
  );
};
