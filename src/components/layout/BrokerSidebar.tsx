import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Bell,
  ClipboardList,
  Settings,
} from 'lucide-react';

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

      {/* User Profile Card */}
      <div className="p-4 border-t border-gray-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-semibold text-sm">
            AM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">Alex Mercer</p>
            <p className="text-xs text-gray-label truncate">Prime Brokerage</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
