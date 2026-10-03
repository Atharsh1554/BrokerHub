import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  User,
  MessageSquare,
  Bell,
  ClipboardList,
  Gavel,
  X,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/broker/dashboard' },
  { label: 'My Profile', icon: User, path: '/broker/my-shop' },
  { label: 'Products', icon: Package, path: '/broker/products' },
  { label: 'Messages', icon: MessageSquare, path: '/broker/messages' },
  { label: 'My Orders', icon: ClipboardList, path: '/broker/orders' },
  { label: 'Reverse Auction', icon: Gavel, path: '/reverse-auction' },
  { label: 'Notifications', icon: Bell, path: '/broker/notifications' },
];

interface BrokerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const BrokerSidebar: React.FC<BrokerSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const initials = getUserInitials(displayName);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSettingsClick = () => {
    setShowDropdown(false);
    onClose?.();
    navigate('/broker/settings');
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    onClose?.();
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-border flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Header */}
        <div className="p-5 border-b border-gray-border flex items-center justify-between shrink-0">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <img src="/logo.png" alt="B2C Logo" className="h-9 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-bold text-base text-text-primary tracking-tight leading-tight">BROKER HUB</span>
              <span className="text-[10px] font-semibold text-primary italic leading-tight">A MYSTRIO Product</span>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/broker/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              const isNotifications = item.label === 'Notifications';

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        isActive
                          ? 'bg-primary-50 text-primary font-semibold'
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

        {/* Profile card — fixed at bottom of sidebar */}
        <div className="shrink-0 border-t border-gray-border p-3" ref={dropdownRef}>
          {/* Dropdown opens upward */}
          {showDropdown && (
            <div className="absolute bottom-[72px] left-3 right-3 bg-white rounded-2xl shadow-xl border border-gray-border py-1.5 z-50 animate-fade-in">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
                    <p className="text-[11px] text-gray-text capitalize">{user?.role || 'Broker'}</p>
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
                  Profile &amp; Settings
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

          {/* Profile trigger button */}
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-border cursor-pointer group"
            aria-expanded={showDropdown}
            title="Account Menu"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover shadow-xs shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 flex flex-col text-left min-w-0">
              <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-gray-text capitalize leading-tight">
                {user?.role || 'Broker'}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-label transition-transform duration-200 shrink-0 ${showDropdown ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </aside>
    </>
  );
};
