import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ReverseAuction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getReverseAuctions } from '../../lib/api/reverseAuction';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { CustomerAuctionView } from './CustomerAuctionView';
import { BrokerAuctionView } from './BrokerAuctionView';
import { Building2, UserCheck, RefreshCw } from 'lucide-react';

export const ReverseAuctionPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [auctions, setAuctions] = useState<ReverseAuction[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine role context based on route and user role
  const isCustomerRoute = location.pathname.startsWith('/customer');
  const isBrokerRoute = location.pathname.startsWith('/broker');

  const showCustomerWorkspace = isCustomerRoute || user?.role === 'customer' || (!isBrokerRoute && user?.role !== 'broker');
  const showBrokerWorkspace = isBrokerRoute || user?.role === 'broker' || (!isCustomerRoute && user?.role !== 'customer');

  const activePerspective: 'customer' | 'broker' = isCustomerRoute || (user?.role === 'customer' && !isBrokerRoute)
    ? 'customer'
    : isBrokerRoute || (user?.role === 'broker' && !isCustomerRoute)
    ? 'broker'
    : user?.role === 'broker'
    ? 'broker'
    : 'customer';

  const [perspective, setPerspective] = useState<'customer' | 'broker'>(activePerspective);

  useEffect(() => {
    setPerspective(activePerspective);
  }, [activePerspective]);

  const fetchAuctionsData = useCallback(async () => {
    setLoading(true);
    const data = await getReverseAuctions();
    setAuctions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAuctionsData();

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime:reverse_auctions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reverse_auctions' },
          () => {
            fetchAuctionsData();
          }
        )
        .subscribe();
    }

    // Auto-refresh every 30s
    const interval = setInterval(fetchAuctionsData, 30000);
    return () => {
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchAuctionsData]);

  const handleNavigateToMessages = (contactId?: string) => {
    if (perspective === 'broker') {
      navigate('/broker/messages');
    } else {
      navigate('/customer/messages');
    }
  };

  const showBothToggles = showCustomerWorkspace && showBrokerWorkspace && user?.role === 'admin';

  return (
    <div className="space-y-4">
      {/* Workspace Perspective Switcher Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">View mode:</span>
          {showCustomerWorkspace && (showBothToggles || perspective === 'customer') && (
            <button
              onClick={() => showBothToggles && setPerspective('customer')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                showBothToggles ? 'cursor-pointer' : 'cursor-default'
              } ${
                perspective === 'customer'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}
            >
              <UserCheck size={14} />
              <span>Customer Workspace</span>
            </button>
          )}
          {showBrokerWorkspace && (showBothToggles || perspective === 'broker') && (
            <button
              onClick={() => showBothToggles && setPerspective('broker')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                showBothToggles ? 'cursor-pointer' : 'cursor-default'
              } ${
                perspective === 'broker'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}
            >
              <Building2 size={14} />
              <span>Broker Workspace</span>
            </button>
          )}
        </div>

        <button
          onClick={fetchAuctionsData}
          title="Refresh Data"
          className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Render matching view */}
      {perspective === 'customer' ? (
        <CustomerAuctionView
          auctions={auctions}
          onRefresh={fetchAuctionsData}
          onNavigateToMessages={handleNavigateToMessages}
        />
      ) : (
        <BrokerAuctionView
          auctions={auctions}
          onRefresh={fetchAuctionsData}
          onNavigateToMessages={handleNavigateToMessages}
        />
      )}
    </div>
  );
};
