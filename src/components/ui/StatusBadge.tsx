import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  'Connected': { bg: 'bg-green-50', text: 'text-status-green', dot: 'bg-status-green' },
  'Delivered': { bg: 'bg-green-50', text: 'text-status-green', dot: 'bg-status-green' },
  'In Stock': { bg: 'bg-green-50', text: 'text-status-green', dot: 'bg-status-green' },
  'Confirmed': { bg: 'bg-green-50', text: 'text-status-green', dot: 'bg-status-green' },
  'Under Review': { bg: 'bg-yellow-50', text: 'text-status-yellow', dot: 'bg-status-yellow' },
  'In Transit': { bg: 'bg-yellow-50', text: 'text-status-yellow', dot: 'bg-status-yellow' },
  'Processing': { bg: 'bg-yellow-50', text: 'text-status-yellow', dot: 'bg-status-yellow' },
  'Pending': { bg: 'bg-orange-50', text: 'text-status-orange', dot: 'bg-status-orange' },
  'Pending Match': { bg: 'bg-blue-50', text: 'text-status-blue', dot: 'bg-status-blue' },
  'Pending Approval': { bg: 'bg-blue-50', text: 'text-status-blue', dot: 'bg-status-blue' },
  'Cancelled': { bg: 'bg-red-50', text: 'text-status-red', dot: 'bg-status-red' },
  'Out of Stock': { bg: 'bg-red-50', text: 'text-status-red', dot: 'bg-status-red' },
  'Low Stock': { bg: 'bg-orange-50', text: 'text-status-orange', dot: 'bg-status-orange' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-text', dot: 'bg-gray-400' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bg} ${config.text}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
};
