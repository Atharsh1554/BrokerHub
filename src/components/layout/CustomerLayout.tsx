import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CustomerSidebar } from './CustomerSidebar';
import { TopHeader } from './TopHeader';
import { useAuth } from '../../context/AuthContext';

export const CustomerLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isMessagesPage = location.pathname.includes('/messages');

  // Still loading auth session — show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  // Not logged in → send to login
  if (!user) {
    return <Navigate to="/login?role=customer" replace />;
  }

  // Logged in as broker → redirect to broker dashboard
  if (user.role === 'broker') {
    return <Navigate to="/broker/dashboard" replace />;
  }

  return (
    <div className="bg-gray-bg dark:bg-slate-900 flex w-full overflow-x-hidden transition-colors duration-300"
      style={{ height: isMessagesPage ? '100dvh' : undefined, minHeight: isMessagesPage ? undefined : '100vh' }}
    >
      <CustomerSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div
        className={`lg:ml-64 flex flex-col flex-1 min-w-0 overflow-x-hidden ${
          isMessagesPage ? 'h-full overflow-hidden' : 'min-h-screen'
        }`}
      >
        <TopHeader onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main
          className={`min-w-0 ${
            isMessagesPage
              ? 'flex-1 min-h-0 overflow-hidden p-2 sm:p-4 flex flex-col'
              : 'flex-1 p-3.5 sm:p-6 overflow-x-hidden'
          }`}
        >
          <Outlet />
        </main>
        {!isMessagesPage && (
          <footer className="px-4 sm:px-6 py-4 border-t border-gray-border dark:border-slate-700 text-center text-xs text-gray-text dark:text-slate-400 space-y-2">
            <div>
              <p className="font-semibold text-text-primary dark:text-slate-200">BROKER HUB</p>
              <p className="italic text-gray-label dark:text-slate-500">A Mystrio Technologies Product</p>
            </div>
            <p className="text-[10px] text-gray-label dark:text-slate-500 max-w-2xl mx-auto leading-relaxed">
              BrokerHub is a digital marketplace connecting customers with independent sellers and service providers. BrokerHub does not provide stock trading, investment advice, securities brokerage, portfolio management, or other financial services.
            </p>
            <p className="text-[11px] text-gray-label dark:text-slate-500">© 2026 Mystrio Technologies. All rights reserved.</p>
          </footer>
        )}
      </div>
    </div>
  );
};
