import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/customer/dashboard' },
  { label: 'My Brokers', icon: Users, path: '/customer/my-brokers' },
  { label: 'Products', icon: ShoppingBag, path: '/customer/products' },
  { label: 'Messages', icon: MessageSquare, path: '/customer/messages' },
  { label: 'Appointments', icon: Calendar, path: '/customer/appointments' },
  { label: 'Settings', icon: Settings, path: '/customer/settings' },
];

export const CustomerSidebar: React.FC = () => {
  const location = useLocation();

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
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-text hover:bg-gray-50 hover:text-text-primary'
                    }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-status-red hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
};
