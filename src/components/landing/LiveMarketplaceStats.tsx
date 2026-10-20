import React, { useState, useEffect, useRef } from 'react';
import { Store, Users, Activity, RefreshCw, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getLiveMarketplaceStats, type MarketplaceStats } from '../../lib/api/marketplaceStats';
import { supabase } from '../../lib/supabase';

// Helper hook for smooth number counting animation
function useCountUp(targetValue: number | null, durationMs: number = 1200): number {
  const [currentValue, setCurrentValue] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const targetRef = useRef<number>(targetValue ?? 0);
  targetRef.current = targetValue ?? 0;

  useEffect(() => {
    if (targetValue === null || targetValue === 0) {
      setCurrentValue(0);
      return;
    }

    let animationFrameId: number;
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(easeProgress * targetRef.current);

      setCurrentValue(nextValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentValue(targetRef.current);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetValue, durationMs]);

  return currentValue;
}

export const LiveMarketplaceStats: React.FC = () => {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const animatedSellers = useCountUp(stats?.sellersCount ?? null);
  const animatedCustomers = useCountUp(stats?.customersCount ?? null);

  const fetchStats = async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    setError(null);
    const { data, error: fetchErr } = await getLiveMarketplaceStats();

    if (fetchErr) {
      setError(fetchErr);
      setStats(null);
    } else {
      setStats(data);
      setError(null);
    }

    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchStats();

    // Listen to real-time user registrations to keep counts fresh
    const channel = supabase
      .channel('landing_page_stats_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchStats(true);
      })
      .subscribe();

    // Refresh every 60 seconds as a gentle heartbeat
    const interval = setInterval(() => {
      fetchStats(true);
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return (
    <section id="marketplace-stats" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/60 border-y border-gray-border">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide uppercase text-[10px] font-bold">Live Marketplace Network</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Growing with <span className="text-emerald-600">BrokerHub</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
            Real-time count of registered independent sellers and active customers trading across our digital marketplace.
          </p>
        </div>

        {/* Loading State Skeleton */}
        {loading && !stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs animate-pulse">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100"></div>
                  <div className="w-20 h-6 rounded-full bg-slate-100"></div>
                </div>
                <div className="w-28 h-12 bg-slate-200 rounded-lg mb-3"></div>
                <div className="w-44 h-5 bg-slate-100 rounded-md mb-2"></div>
                <div className="w-60 h-4 bg-slate-100 rounded-md"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State: Graceful notice without fake fallback numbers */}
        {error && !stats && !loading && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center max-w-md mx-auto shadow-xs">
            <AlertCircle size={36} className="text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">Live Statistics Temporarily Unavailable</h3>
            <p className="text-xs text-slate-500 mb-4">
              Unable to establish real-time connection with the marketplace database.
            </p>
            <button
              onClick={() => fetchStats(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl transition-colors cursor-pointer border border-emerald-200"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              Retry Connection
            </button>
          </div>
        )}

        {/* Live Active Statistics Display */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {/* Card 1: Registered Sellers */}
            <div className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-300 p-7 sm:p-9 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.10)] transition-all duration-300 relative group overflow-hidden flex flex-col justify-between">
              {/* Subtle background ambient blur */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/8 rounded-full blur-2xl -z-0 pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform duration-300">
                    <Store size={26} />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                    <Activity size={11} className="text-emerald-500" />
                    Live Verified
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none">
                      {animatedSellers}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Sellers
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 pt-2">
                    Registered Sellers
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Verified independent commercial sellers and partner brokers listing active catalogs.
                  </p>
                </div>
              </div>

              {/* Trust Badge Chips */}
              <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  Verified Merchants
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Direct Listings
                </span>
              </div>
            </div>

            {/* Card 2: Registered Customers */}
            <div className="bg-white rounded-3xl border border-slate-200/90 hover:border-teal-300 p-7 sm:p-9 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(20,184,166,0.10)] transition-all duration-300 relative group overflow-hidden flex flex-col justify-between">
              {/* Subtle background ambient blur */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/8 rounded-full blur-2xl -z-0 pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform duration-300">
                    <Users size={26} />
                  </div>
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/70 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                    <Activity size={11} className="text-teal-500" />
                    Live Verified
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none">
                      {animatedCustomers}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                      Buyers
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 pt-2">
                    Registered Customers
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Registered buyers connecting with sellers and placing verified direct orders.
                  </p>
                </div>
              </div>

              {/* Trust Badge Chips */}
              <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                  <CheckCircle2 size={12} className="text-teal-600" />
                  Active Buyers
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                  <ShieldCheck size={12} className="text-teal-600" />
                  Verified Orders
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
