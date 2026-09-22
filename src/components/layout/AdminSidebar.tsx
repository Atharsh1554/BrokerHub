import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Briefcase,
  Package,
  ShoppingBag,
  CreditCard,
  Link2,
  Bell,
  Calendar,
  MessageSquareQuote,
  FileSpreadsheet,
  History,
  Search,
  Settings,
  LogOut,
  ShieldCheck,
  X,
  UserCheck,
} from 'lucide-react';
import { logAdminActivity } from '../../lib/api/admin';
import { useAdminTheme } from '../../context/AdminThemeContext';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const handleLogout = async () => {
    await logAdminActivity('Admin Logout', 'Session ended');
    localStorage.removeItem('brokerhub_admin_session');
    localStorage.removeItem('brokerhub_admin_role');
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Brokers', path: '/admin/brokers', icon: Briefcase },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Connections', path: '/admin/connections', icon: Link2 },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Meetings', path: '/admin/meetings', icon: Calendar },
    { label: 'Reviews & Moderation', path: '/admin/reviews', icon: MessageSquareQuote },
    { label: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Activity Logs', path: '/admin/activity-logs', icon: History },
    { label: 'Global Search', path: '/admin/search', icon: Search },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className={`w-64 border-r flex flex-col h-full select-none transition-colors duration-200 ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
    }`}>
      {/* Brand Header */}
      <div className={`p-5 flex items-center justify-between border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <NavLink to="/admin/dashboard" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className={`font-bold text-base tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              BROKER<span className="text-emerald-500">HUB</span>
            </span>
            <span className="block text-[10px] text-emerald-600 uppercase font-bold tracking-wider">
              ADMIN DASHBOARD
            </span>
          </div>
        </NavLink>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className={`lg:hidden p-1 rounded-lg ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold shadow-xs'
                      : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Profile Footer */}
      <div className={`p-3.5 m-3 rounded-2xl border space-y-3 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
            isLight ? 'bg-emerald-100 border border-emerald-200 text-emerald-700' : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
          }`}>
            SA
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>Super Admin</p>
            <p className="text-[11px] text-emerald-600 truncate flex items-center space-x-1 font-medium">
              <UserCheck className="w-3 h-3 inline mr-1" />
              Full Privileges
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            isLight
              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              : 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Admin Logout</span>
        </button>
      </div>
    </aside>
  );
};
