import React from 'react';
import { Outlet } from 'react-router-dom';
import { BrokerSidebar } from './BrokerSidebar';
import { TopHeader } from './TopHeader';

export const BrokerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-bg">
      <BrokerSidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        <TopHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        <footer className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs space-y-0.5">
          <p className="font-semibold text-zinc-900 dark:text-white">BROKER HUB</p>
          <p className="italic text-zinc-500">A MYSTRIO Product</p>
          <p className="text-[11px] text-zinc-400">© 2026 MYSTRIO. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};
