import React from 'react';
import { Menu } from 'lucide-react';

interface TopHeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, onMenuClick }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-border flex items-center px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
        )}
        {title && (
          <h1 className="text-lg sm:text-xl font-bold text-text-primary truncate">{title}</h1>
        )}
      </div>
    </header>
  );
};
