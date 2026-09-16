import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, MessageSquare, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

interface TopHeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, onMenuClick }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const initials = getUserInitials(displayName);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSettingsClick = () => {
    setShowDropdown(false);
    if (user?.role === 'customer') {
      navigate('/customer/settings');
    } else {
      navigate('/broker/settings');
    }
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
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

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* Search - hidden on mobile screens */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-label" />
          <input
            type="text"
            placeholder="Search transactions, products..."
            className="w-48 lg:w-72 pl-10 pr-4 py-2 border border-gray-border rounded-lg text-sm text-text-primary placeholder-gray-label bg-gray-bg focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Notification Bell */}
        <button
          onClick={handleNotificationsClick}
          aria-label="Notifications"
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-all cursor-pointer group"
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
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-all cursor-pointer group"
          title="Messages"
        >
          <MessageSquare size={20} className="text-gray-text group-hover:text-primary transition-colors" />
        </button>

        {/* User Profile Pill with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors border border-gray-border cursor-pointer group"
            title="Account Menu"
            aria-expanded={showDropdown}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors max-w-[110px] truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-gray-text capitalize leading-tight">
                {user?.role || 'Guest'}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-label transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-border py-1.5 z-50 animate-fade-in">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
                    <p className="text-[11px] text-gray-text capitalize">{user?.role || 'Guest'}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={handleSettingsClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors cursor-pointer"
                >
                  <Settings size={16} className="text-gray-400" />
                  Profile & Settings
                </button>

                <div className="border-t border-gray-100 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
