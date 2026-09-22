import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  ExternalLink,
  ChevronRight,
  User,
  Sun,
  Moon,
} from 'lucide-react';
import { logAdminActivity } from '../../lib/api/admin';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useAdminTheme();

  const isLight = theme === 'light';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logAdminActivity('Admin Logout', 'Header action');
    localStorage.removeItem('brokerhub_admin_session');
    localStorage.removeItem('brokerhub_admin_role');
    navigate('/admin/login');
  };

  // Extract current page title from path
  const currentPath = location.pathname.replace('/admin/', '');
  const pageTitle = currentPath ? currentPath.charAt(0).toUpperCase() + currentPath.slice(1) : 'Dashboard';

  return (
    <div className={`min-h-screen flex font-sans antialiased transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className={`fixed inset-0 backdrop-blur-sm ${isLight ? 'bg-slate-900/30' : 'bg-slate-950/80'}`}
            onClick={() => setMobileOpen(false)}
          />
          <div className={`relative w-64 max-w-xs h-full shadow-2xl z-10 ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}>
            <AdminSidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-6 py-3 flex items-center justify-between transition-colors ${
          isLight ? 'bg-white/90 border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className={`flex items-center space-x-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Admin</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              <span className={`font-semibold capitalize ${isLight ? 'text-slate-900' : 'text-white'}`}>{pageTitle}</span>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Global Search (Order ID, Customer, Broker, Product...)"
                className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all ${
                  isLight
                    ? 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    : 'bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-400'
                }`}
              />
            </div>
          </form>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button (Light/Dark Mode) */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-amber-600'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle Theme"
            >
              {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            <Link
              to="/admin/notifications"
              className={`relative p-2 rounded-xl transition-colors ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
            </Link>

            <Link
              to="/"
              target="_blank"
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-300'
              }`}
              title="View Public App"
            >
              <span>Main Site</span>
              <ExternalLink className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
            </Link>

            {/* Admin Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center space-x-2.5 p-1.5 rounded-xl transition-colors focus:outline-none ${
                  isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 shadow-md shadow-emerald-500/10">
                  <div className={`w-full h-full rounded-[10px] flex items-center justify-center font-bold text-xs ${
                    isLight ? 'bg-white text-emerald-600' : 'bg-slate-900 text-emerald-400'
                  }`}>
                    SA
                  </div>
                </div>
                <span className={`hidden md:block text-xs font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Super Admin
                </span>
              </button>

              {showProfileMenu && (
                <div
                  className={`absolute right-0 mt-2 w-56 border rounded-2xl shadow-2xl py-2 z-50 text-xs ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className={`px-4 py-2.5 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                    <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Super Administrator</p>
                    <p className={isLight ? 'text-slate-500 text-[11px]' : 'text-slate-400 text-[11px]'}>admin@brokerhub.com</p>
                  </div>
                  <Link
                    to="/admin/settings"
                    className={`flex items-center space-x-2 px-4 py-2 ${
                      isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Admin Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 px-4 py-2 text-red-500 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
