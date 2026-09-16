import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CustomerSidebar } from './CustomerSidebar';
import { TopHeader } from './TopHeader';
import { useAuth } from '../../context/AuthContext';

export const CustomerLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Still loading auth session — show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading your workspace…</p>
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
    <div className="min-h-screen bg-gray-bg flex flex-col">
      <CustomerSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="lg:ml-64 min-h-screen flex flex-col justify-between flex-1">
        <TopHeader onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main className="p-4 sm:p-6 flex-1 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
        <footer className="px-4 sm:px-6 py-4 border-t border-gray-border text-center text-xs text-gray-text space-y-0.5">
          <p className="font-semibold text-text-primary">BROKER HUB</p>
          <p className="italic text-gray-label">A MYSTRIO Product</p>
          <p className="text-[11px] text-gray-label">© 2026 MYSTRIO. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};
