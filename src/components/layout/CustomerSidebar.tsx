import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  ShoppingCart,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/customer/dashboard' },
  { label: 'My Brokers', icon: Users, path: '/customer/my-brokers' },
  { label: 'Products', icon: ShoppingBag, path: '/customer/products' },
  { label: 'Cart', icon: ShoppingCart, path: '/customer/cart', hasBadge: true },
  { label: 'Messages', icon: MessageSquare, path: '/customer/messages' },
  { label: 'Appointments', icon: Calendar, path: '/customer/appointments' },
  { label: 'Settings', icon: Settings, path: '/customer/settings' },
];

interface CustomerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { cart } = useApp();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    if (onClose) onClose();
    await signOut();
    navigate('/login');
  };

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const initials = getUserInitials(displayName);

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
        <div className="p-5 border-b border-gray-border flex items-center justify-between">
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

        {/* Navigation items */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/customer/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
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
                    {item.hasBadge && totalCartCount > 0 && (
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {totalCartCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="p-3 border-t border-gray-border space-y-2">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-semibold text-xs shadow-xs shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{displayName}</p>
              <p className="text-[10px] text-gray-label truncate">{user?.email || 'Customer Account'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-status-red hover:bg-red-50 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
