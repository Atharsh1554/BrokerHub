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
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingBrokers, setPendingBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useAdminTheme();

  const isLight = theme === 'light';

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
        <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Fetching real-time platform metrics...
        </p>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Customers', value: kpis.totalCustomers, icon: Users, color: isLight ? 'text-blue-600' : 'text-blue-400', bg: isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Total Brokers', value: kpis.totalBrokers, icon: Briefcase, color: isLight ? 'text-indigo-600' : 'text-indigo-400', bg: isLight ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Active Brokers', value: kpis.activeBrokers, icon: CheckCircle2, color: isLight ? 'text-emerald-600' : 'text-emerald-400', bg: isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Pending Approvals', value: kpis.pendingBrokerApprovals, icon: Clock, color: isLight ? 'text-amber-600' : 'text-amber-400', bg: isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20' },

    { label: 'Total Products', value: kpis.totalProducts, icon: Package, color: isLight ? 'text-violet-600' : 'text-violet-400', bg: isLight ? 'bg-violet-50 border-violet-200' : 'bg-violet-500/10 border-violet-500/20' },
    { label: 'Active Products', value: kpis.activeProducts, icon: Activity, color: isLight ? 'text-teal-600' : 'text-teal-400', bg: isLight ? 'bg-teal-50 border-teal-200' : 'bg-teal-500/10 border-teal-500/20' },
    { label: 'Total Orders', value: kpis.totalOrders, icon: ShoppingBag, color: isLight ? 'text-sky-600' : 'text-sky-400', bg: isLight ? 'bg-sky-50 border-sky-200' : 'bg-sky-500/10 border-sky-500/20' },
    { label: 'Pending Orders', value: kpis.pendingOrders, icon: Clock, color: isLight ? 'text-orange-600' : 'text-orange-400', bg: isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-orange-500/20' },

    { label: 'Completed Orders', value: kpis.completedOrders, icon: CheckCircle2, color: isLight ? 'text-emerald-600' : 'text-emerald-400', bg: isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Cancelled Orders', value: kpis.cancelledOrders, icon: XCircle, color: isLight ? 'text-red-600' : 'text-red-400', bg: isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20' },
    { label: 'Total Revenue', value: `₹${kpis.totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: isLight ? 'text-emerald-700' : 'text-emerald-300', bg: isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30' },
    { label: 'Pending Payments', value: kpis.pendingPayments, icon: AlertCircle, color: isLight ? 'text-amber-600' : 'text-amber-400', bg: isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20' },

    { label: 'Completed Payments', value: kpis.completedPayments, icon: CreditCard, color: isLight ? 'text-cyan-600' : 'text-cyan-400', bg: isLight ? 'bg-cyan-50 border-cyan-200' : 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Total Meetings', value: kpis.totalMeetings, icon: Calendar, color: isLight ? 'text-fuchsia-600' : 'text-fuchsia-400', bg: isLight ? 'bg-fuchsia-50 border-fuchsia-200' : 'bg-fuchsia-500/10 border-fuchsia-500/20' },
    { label: 'Total Messages', value: kpis.totalMessages, icon: MessageSquare, color: isLight ? 'text-pink-600' : 'text-pink-400', bg: isLight ? 'bg-pink-50 border-pink-200' : 'bg-pink-500/10 border-pink-500/20' },
    { label: 'Pending Requests', value: kpis.pendingRequests, icon: AlertCircle, color: isLight ? 'text-rose-600' : 'text-rose-400', bg: isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl relative overflow-hidden shadow-xl ${
        isLight
          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-800 text-white border border-emerald-500/20'
          : 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 text-white'
      }`}>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-300 tracking-wider uppercase">Live Real-time System Overview</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">BROKER HUB Admin Control Center</h1>
          <p className="text-xs text-emerald-100/80">Monitoring real-time database telemetry, brokers, customers, payments, and product orders.</p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 ${
              isLight
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live DB</span>
          </button>
          <Link
            to="/admin/analytics"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/30 transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interactive Analytics</span>
          </Link>
        </div>
      </div>

      {/* Real-time KPI Cards Grid (16 Cards) */}
      <div>
        <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center space-x-2 ${
          isLight ? 'text-slate-800' : 'text-slate-300'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Real-Time Platform Metrics</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] flex flex-col justify-between space-y-3 ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-xs hover:shadow-md'
                    : `bg-slate-900 border-slate-800 ${card.bg}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>{card.label}</span>
                  <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-xl font-extrabold tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>{card.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Broker Approvals Card */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center justify-between border-b pb-4 ${
            isLight ? 'border-slate-100' : 'border-slate-800'
          }`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center space-x-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Pending Broker Verification Approvals</span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Brokers requesting platform accreditation</p>
            </div>
            <Link to="/admin/brokers" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {pendingBrokers.length === 0 ? (
            <div className={`p-8 text-center text-xs rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}>
              No pending broker approvals. All brokers are verified!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBrokers.map((broker) => (
                <div
                  key={broker.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                      {broker.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{broker.name}</p>
                      <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{broker.company || broker.specialty}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickApproveBroker(broker.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shrink-0 shadow-xs"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Overview */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center justify-between border-b pb-4 ${
            isLight ? 'border-slate-100' : 'border-slate-800'
          }`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center space-x-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <ShoppingBag className="w-4 h-4 text-sky-500" />
                <span>Recent Platform Orders</span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Latest transactions processed across customer portals</p>
            </div>
            <Link to="/admin/orders" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1">
              <span>All Orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{order.id}</p>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-emerald-600">₹{(order.amount || order.totalAmount || 0).toLocaleString('en-IN')}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-0.5 border ${
                    isLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
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
