import React from 'react';
import { Search, Bell, MessageSquare } from 'lucide-react';

interface TopHeaderProps {
  title?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-border flex items-center justify-between px-6">
      {title && (
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      )}
      <div className="flex items-center gap-4 ml-auto">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-label" />
          <input
            type="text"
            placeholder="Search transactions, products..."
            className="w-72 pl-10 pr-4 py-2 border border-gray-border rounded-lg text-sm text-text-primary placeholder-gray-label bg-gray-bg focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Bell size={20} className="text-gray-text" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-status-red rounded-full" />
        </button>

        {/* Messages */}
        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <MessageSquare size={20} className="text-gray-text" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>
      </div>
    </header>
  );
};
