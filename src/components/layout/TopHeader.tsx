import React from 'react';
import { Search, Bell, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

interface TopHeaderProps {
  title?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();

  const handleNotificationsClick = () => {
    if (user?.role === 'customer') {
      navigate('/customer/messages');
    } else {
      navigate('/broker/notifications');
    }
  };

  const handleMessagesClick = () => {
    if (user?.role === 'customer') {
      navigate('/customer/messages');
    } else {
      navigate('/broker/messages');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-border flex items-center justify-between px-6 sticky top-0 z-30">
      {title && (
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      )}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-label" />
          <input
            type="text"
            placeholder="Search transactions, products..."
            className="w-64 lg:w-72 pl-10 pr-4 py-2 border border-gray-border rounded-lg text-sm text-text-primary placeholder-gray-label bg-gray-bg focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Notification Bell */}
        <button 
          onClick={handleNotificationsClick}
          aria-label="Notifications"
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
          title="Notification Center"
        >
          <Bell size={20} className="text-gray-text group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Messages */}
        <button 
          onClick={handleMessagesClick}
          aria-label="Direct Messages"
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
          title="Messages"
        >
          <MessageSquare size={20} className="text-gray-text group-hover:text-primary transition-colors" />
        </button>
      </div>
    </header>
  );
};

