import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, Bell, MessageSquare, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../context/NotificationContext';
import { resolveUserDisplayName } from '../../lib/userUtils';
import { UserAvatar } from '../ui/UserAvatar';

interface TopHeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart } = useApp();
  const { unreadCount } = useNotifications();


  const totalCartCount = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const role = user?.role || (location.pathname.startsWith('/broker') ? 'broker' : 'customer');

  // Compute dynamic page title if not explicitly passed
  const getComputedTitle = (): { section: string; title: string } => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return { section: role === 'broker' ? 'Broker' : 'Customer', title: 'Dashboard' };
    if (path.includes('/my-orders') || path === '/broker/orders') return { section: role === 'broker' ? 'Broker' : 'Customer', title: 'My Orders' };
    if (path.includes('/my-brokers')) return { section: 'Customer', title: 'My Brokers' };
    if (path.includes('/products/') && path.split('/products/')[1]) return { section: 'Customer', title: 'Product Details' };
    if (path.includes('/products')) return { section: role === 'broker' ? 'Broker' : 'Customer', title: role === 'broker' ? 'Product Catalog' : 'Browse Products' };
    if (path.includes('/brokers/')) return { section: 'Customer', title: 'Broker Profile' };
    if (path.includes('/cart')) return { section: 'Customer', title: 'Cart' };
    if (path.includes('/checkout')) return { section: 'Customer', title: 'Checkout' };
    if (path.includes('/messages')) return { section: role === 'broker' ? 'Broker' : 'Customer', title: 'Messages' };
    if (path.includes('/settings')) return { section: role === 'broker' ? 'Broker' : 'Customer', title: 'Settings' };
    if (path.includes('/my-shop')) return { section: 'Broker', title: 'My Shop / Profile' };
    if (path.includes('/notifications')) return { section: 'Broker', title: 'Notifications' };
    if (path.includes('/reverse-auction')) return { section: 'Marketplace', title: 'Reverse Auction' };
    return { section: 'Broker Hub', title: 'Portal' };
  };

  const computed = getComputedTitle();
  const displayTitle = title || computed.title;
  const settingsPath = role === 'broker' ? '/broker/settings' : '/customer/settings';
  const messagesPath = role === 'broker' ? '/broker/messages' : '/customer/messages';

  return (
    <header className="h-14 sm:h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-gray-border dark:border-slate-700 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 transition-all min-w-0 overflow-x-hidden">
      {/* Left side: Hamburger button + Breadcrumb / Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer active:scale-95 shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Mobile Page Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-text-primary text-sm truncate lg:hidden">{displayTitle}</span>

          {/* Desktop Breadcrumbs */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium text-gray-400 capitalize">{computed.section}</span>
            <ChevronRight size={14} className="text-gray-400" />
            <h1 className="text-base font-bold text-text-primary tracking-tight truncate">{displayTitle}</h1>
          </div>
        </div>
      </div>

      {/* Right side: Logo on Mobile Top Right + Quick Shortcuts & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Logo on the Top Right */}
        <Link to="/" className="lg:hidden flex items-center gap-1.5 mr-1 shrink-0" title="BrokerHub">
          <img src="/logo.png" alt="BrokerHub Logo" className="h-7 w-auto object-contain" />
          <span className="font-black text-xs text-text-primary tracking-tight hidden xs:inline">BROKER HUB</span>
        </Link>
        {/* Customer Cart shortcut */}
        {role === 'customer' && (
          <Link
            to="/customer/cart"
            className="relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-xl transition-all"
            title="Shopping Cart"
            aria-label="View Cart"
          >
            <ShoppingCart size={19} />
            {totalCartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {totalCartCount}
              </span>
            )}
          </Link>
        )}

        {/* Broker Notifications shortcut */}
        {role === 'broker' && (
          <Link
            to="/broker/notifications"
            className="relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-xl transition-all"
            title="Notifications"
            aria-label="View Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
            )}
          </Link>
        )}


        {/* Messages shortcut */}
        <Link
          to={messagesPath}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          title="Direct Messages"
          aria-label="Messages"
        >
          <MessageSquare size={19} />
        </Link>

        {/* User Avatar Circle */}
        <button
          onClick={() => navigate(settingsPath)}
          className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
          title={`${displayName} - Account Settings`}
        >
          <UserAvatar
            src={user?.avatar}
            name={displayName}
            alt={displayName}
            className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-border group-hover:border-primary transition-colors"
          />
          <span className="hidden md:block text-xs font-semibold text-text-primary dark:text-slate-200 max-w-[120px] truncate group-hover:text-primary transition-colors">
            {displayName}
          </span>
        </button>
      </div>
    </header>
  );
};
