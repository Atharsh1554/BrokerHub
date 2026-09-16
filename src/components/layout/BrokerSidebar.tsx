import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Bell,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/broker/dashboard' },
  { label: 'My Products', icon: Package, path: '/broker/products' },
  { label: 'Messages', icon: MessageSquare, path: '/broker/messages' },
  { label: 'Notifications', icon: Bell, path: '/broker/notifications' },
  { label: 'Orders', icon: ClipboardList, path: '/broker/orders' },
  { label: 'Settings', icon: Settings, path: '/broker/settings' },
];

export const BrokerSidebar: React.FC = () => {
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { user, signOut } = useAuth();

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const initials = getUserInitials(displayName);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-gray-border">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="B2C Logo" className="h-9 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="font-bold text-base text-text-primary tracking-tight leading-tight">BROKER HUB</span>
            <span className="text-[10px] font-semibold text-primary italic leading-tight">A MYSTRIO Product</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isNotifications = item.label === 'Notifications';

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-text hover:bg-gray-50 hover:text-text-primary'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  {isNotifications && unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white leading-none">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-gray-border space-y-2">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-semibold text-xs shadow-xs shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">{displayName}</p>
            <p className="text-[10px] text-gray-label truncate">{user?.email || 'Broker Account'}</p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-status-red hover:bg-red-50 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

