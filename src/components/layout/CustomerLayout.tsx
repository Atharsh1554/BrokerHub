import React from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerSidebar } from './CustomerSidebar';
import { TopHeader } from './TopHeader';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-bg">
      <CustomerSidebar />
      <div className="ml-64 min-h-screen flex flex-col justify-between">
        <TopHeader />
        <main className="p-6 flex-1">
          <Outlet />
        </main>
        <footer className="px-6 py-4 border-t border-gray-border text-center text-xs text-gray-text space-y-0.5">
          <p className="font-semibold text-text-primary">BROKER HUB</p>
          <p className="italic text-gray-label">A MYSTRIO Product</p>
          <p className="text-[11px] text-gray-label">© 2026 MYSTRIO. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

