import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Package,
  ShoppingBag,
  CreditCard,
  Calendar,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  DollarSign,
  Activity,
} from 'lucide-react';
import { getAdminKpis, getAdminOrders, getAdminBrokers, updateBrokerStatus } from '../../lib/api/admin';
import type { AdminKpis, Order, Broker } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingBrokers, setPendingBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [kpiData, ordersData, brokersData] = await Promise.all([
        getAdminKpis(),
        getAdminOrders(),
        getAdminBrokers(),
      ]);
      setKpis(kpiData);
      setRecentOrders(ordersData.slice(0, 5));
      setPendingBrokers(brokersData.filter((b) => b.status === 'Under Review' || b.status === 'Pending Match'));
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleQuickApproveBroker = async (brokerId: string) => {
    await updateBrokerStatus(brokerId, 'Verified');
    loadDashboardData();
  };

  if (loading || !kpis) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Fetching real-time platform metrics...</p>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Customers', value: kpis.totalCustomers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Total Brokers', value: kpis.totalBrokers, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Active Brokers', value: kpis.activeBrokers, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Pending Approvals', value: kpis.pendingBrokerApprovals, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },

    { label: 'Total Products', value: kpis.totalProducts, icon: Package, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { label: 'Active Products', value: kpis.activeProducts, icon: Activity, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
    { label: 'Total Orders', value: kpis.totalOrders, icon: ShoppingBag, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    { label: 'Pending Orders', value: kpis.pendingOrders, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },

    { label: 'Completed Orders', value: kpis.completedOrders, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Cancelled Orders', value: kpis.cancelledOrders, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Total Revenue', value: `₹${kpis.totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-300', bg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30' },
    { label: 'Pending Payments', value: kpis.pendingPayments, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },

    { label: 'Completed Payments', value: kpis.completedPayments, icon: CreditCard, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Total Meetings', value: kpis.totalMeetings, icon: Calendar, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
    { label: 'Total Messages', value: kpis.totalMessages, icon: MessageSquare, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
    { label: 'Pending Requests', value: kpis.pendingRequests, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Live Real-time System Overview</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BROKER HUB Admin Control Center</h1>
          <p className="text-xs text-slate-400">Monitoring real-time database telemetry, brokers, customers, payments, and product orders.</p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live DB</span>
          </button>
          <Link
            to="/admin/analytics"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interactive Analytics</span>
          </Link>
        </div>
      </div>

      {/* Real-time KPI Cards Grid (16 Cards) */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Real-Time Platform Metrics</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${card.bg} backdrop-blur-sm transition-all hover:scale-[1.02] flex flex-col justify-between space-y-3 shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">{card.label}</span>
                  <div className={`p-2 rounded-xl bg-slate-950/40 ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-white tracking-tight">{card.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Broker Approvals Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Pending Broker Verification Approvals</span>
              </h3>
              <p className="text-xs text-slate-400">Brokers requesting platform accreditation</p>
            </div>
            <Link to="/admin/brokers" className="text-xs text-emerald-400 hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {pendingBrokers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
              No pending broker approvals. All brokers are verified!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBrokers.map((broker) => (
                <div
                  key={broker.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                      {broker.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{broker.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{broker.company || broker.specialty}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickApproveBroker(broker.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all shrink-0"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Overview */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <span>Recent Platform Orders</span>
              </h3>
              <p className="text-xs text-slate-400">Latest transactions processed across customer portals</p>
            </div>
            <Link to="/admin/orders" className="text-xs text-emerald-400 hover:underline flex items-center space-x-1">
              <span>All Orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{order.id}</p>
                  <p className="text-slate-400 text-[11px]">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">₹{(order.amount || order.totalAmount || 0).toLocaleString('en-IN')}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 mt-0.5">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
