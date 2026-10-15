import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  BarChart3,
  Clock,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Package,
  RotateCcw,
  CheckCircle2,
  Eye,
  X,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName } from '../../lib/userUtils';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { formatRupeeCompact, formatRupeeExact, updateOrderStatusInDB } from '../../lib/api/orders';
import type { Order } from '../../types';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3 rounded-xl shadow-lg text-xs space-y-1 z-50">
        <p className="font-bold text-text-primary dark:text-white border-b border-gray-100 dark:border-slate-700 pb-1">{data.periodLabel || data.fullMonth}</p>
        <div className="pt-1 space-y-0.5">
          <p className="text-gray-text dark:text-slate-400">
            Revenue: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupeeExact(data.revenue)}</span>
          </p>
          <p className="text-gray-text dark:text-slate-400">
            Orders: <span className="font-semibold text-text-primary dark:text-white">{data.ordersCount ?? data.transactions ?? 0}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const BrokerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { orders, brokerProducts, updateOrderStatus, resetOrders } = useApp();
  const { user } = useAuth();

  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);

  // 1. Calculate Time-Filtered Revenues & Order Status Counts
  const revenueMetrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRev = 0;
    let todayRev = 0;
    let weekRev = 0;
    let monthRev = 0;

    let completedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    for (const order of orders) {
      const statusLower = (order.status || '').toLowerCase();
      const paymentStatusLower = (order.paymentStatus || '').toLowerCase();

      // Classify order by status lifecycle
      if (statusLower.includes('delivered') || statusLower.includes('completed')) {
        completedCount++;
      } else if (statusLower.includes('cancel') || statusLower.includes('refund')) {
        cancelledCount++;
      } else {
        // Pending, Pending Broker Approval, Confirmed, Processing, Shipped, In Transit
        pendingCount++;
      }

      // REVENUE: Only count orders where payment was actually Successful
      const isSuccessfulPayment =
        paymentStatusLower === 'successful' ||
        paymentStatusLower === 'success' ||
        paymentStatusLower === 'paid' ||
        paymentStatusLower === 'completed';

      if (!isSuccessfulPayment) continue;

      // Also exclude cancelled/refunded from revenue
      if (statusLower.includes('cancel') || statusLower.includes('refund')) continue;

      const val = order.totalAmount ?? order.amount ?? 0;
      totalRev += val;

      const orderDateStr = order.createdAt || order.date;
      if (orderDateStr) {
        const orderDate = new Date(orderDateStr);
        if (!isNaN(orderDate.getTime())) {
          const orderDay = orderDateStr.split('T')[0];
          if (orderDay === todayStr) {
            todayRev += val;
          }
          if (orderDate >= weekAgo) {
            weekRev += val;
          }
          if (orderDate >= startOfMonth) {
            monthRev += val;
          }
        }
      }
    }

    return {
      totalRevenue: totalRev,
      todayRevenue: todayRev,
      weekRevenue: weekRev,
      monthRevenue: monthRev,
      completedOrders: completedCount,
      pendingOrders: pendingCount,
      cancelledOrders: cancelledCount,
    };
  }, [orders]);

  const dynamicStats = [
    { label: "Today's Revenue", value: formatRupeeExact(revenueMetrics.todayRevenue), change: 0, changeLabel: 'today' },
    { label: "This Month's Revenue", value: formatRupeeExact(revenueMetrics.monthRevenue), change: 0, changeLabel: 'this month' },
    { label: 'Total Completed Orders', value: revenueMetrics.completedOrders.toString(), change: 0, changeLabel: 'successful' },
    { label: 'Pending Orders', value: revenueMetrics.pendingOrders.toString(), change: 0, changeLabel: 'requires action' },
  ];

  const statIcons = [
    <DollarSign size={20} />,
    <TrendingUp size={20} />,
    <CheckCircle2 size={20} />,
    <Clock size={20} />,
  ];

  // 2. Sales Analytics Graph Data (Daily, Weekly, Monthly)
  const { analyticsChartData, yoyGrowthText, yoyIsPositive } = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Filter for revenue-eligible orders only
    const revenueOrders = orders.filter((o) => {
      const ps = (o.paymentStatus || '').toLowerCase();
      const st = (o.status || '').toLowerCase();
      const isSuccessful = ps === 'successful' || ps === 'success' || ps === 'paid' || ps === 'completed';
      return isSuccessful && !st.includes('cancel') && !st.includes('refund');
    });

    if (analyticsTimeframe === 'daily') {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        days.push({ key: dayStr, month: label, periodLabel: label, revenue: 0, ordersCount: 0 });
      }

      for (const order of revenueOrders) {
        const orderDateStr = (order.createdAt || order.date || '').split('T')[0];
        const match = days.find((day) => day.key === orderDateStr);
        if (match) {
          match.revenue += order.totalAmount ?? order.amount ?? 0;
          match.ordersCount += 1;
        }
      }

      return { analyticsChartData: days, yoyGrowthText: 'Daily View', yoyIsPositive: true };
    }

    if (analyticsTimeframe === 'weekly') {
      // Last 8 weeks
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - i * 7);
        const label = `W${8 - i} (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
        weeks.push({ key: `w-${i}`, start, index: i, month: `W${8 - i}`, periodLabel: label, revenue: 0, ordersCount: 0 });
      }

      for (const order of revenueOrders) {
        const orderDateStr = order.createdAt || order.date;
        if (!orderDateStr) continue;
        const d = new Date(orderDateStr);
        if (isNaN(d.getTime())) continue;

        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
        const weekIdx = Math.floor(diffDays / 7);

        if (weekIdx >= 0 && weekIdx < 8) {
          const match = weeks.find((w) => w.index === weekIdx);
          if (match) {
            match.revenue += order.totalAmount ?? order.amount ?? 0;
            match.ordersCount += 1;
          }
        }
      }

      return { analyticsChartData: weeks.reverse(), yoyGrowthText: 'Weekly View', yoyIsPositive: true };
    }

    // Monthly View (Default 12 Months)
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const buckets = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      buckets.push({
        key: key,
        monthKey: key,
        month: monthNames[m],
        fullMonth: `${fullMonthNames[m]} ${y}`,
        periodLabel: `${fullMonthNames[m]} ${y}`,
        revenue: 0,
        ordersCount: 0,
      });
    }

    let currentPeriodRev = 0;
    let previousPeriodRev = 0;

    for (const order of revenueOrders) {
      const orderDateStr = order.createdAt || order.date;
      if (!orderDateStr) continue;
      const d = new Date(orderDateStr);
      if (isNaN(d.getTime())) continue;

      const val = order.totalAmount ?? order.amount ?? 0;
      const oYear = d.getFullYear();
      const oMonth = d.getMonth();
      const oKey = `${oYear}-${String(oMonth + 1).padStart(2, '0')}`;

      const bucket = buckets.find((b) => b.monthKey === oKey);
      if (bucket) {
        bucket.revenue += val;
        bucket.ordersCount += 1;
        currentPeriodRev += val;
      } else {
        const monthsDiff = (currentYear - oYear) * 12 + (currentMonthIdx - oMonth);
        if (monthsDiff >= 12 && monthsDiff < 24) {
          previousPeriodRev += val;
        }
      }
    }

    let yoyText = 'YoY: N/A';
    let yoyPos = true;

    if (previousPeriodRev > 0) {
      const growth = ((currentPeriodRev - previousPeriodRev) / previousPeriodRev) * 100;
      yoyPos = growth >= 0;
      yoyText = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% YoY`;
    } else if (currentPeriodRev > 0) {
      yoyPos = true;
      yoyText = '+100% YoY';
    }

    return { analyticsChartData: buckets, yoyGrowthText: yoyText, yoyIsPositive: yoyPos };
  }, [orders, analyticsTimeframe]);

  // 3. Calculate Top Selling Products from actual order items
  const topSellingProducts = useMemo(() => {
    const productStatsMap: Record<
      string,
      { name: string; image: string; unitsSold: number; revenue: number }
    > = {};

    let grandTotalRevenue = 0;

    for (const order of orders) {
      const statusLower = (order.status || '').toLowerCase();
      if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('refund')) continue;

      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const pName = item.productName;
          const qty = item.quantity || 1;
          const lineRevenue = (item.unitPrice || 0) * qty;

          if (!productStatsMap[pName]) {
            const matchedProd = brokerProducts.find((p) => p.name.toLowerCase() === pName.toLowerCase());
            productStatsMap[pName] = {
              name: pName,
              image: matchedProd?.image || item.productImage || '',
              unitsSold: 0,
              revenue: 0,
            };
          }

          productStatsMap[pName].unitsSold += qty;
          productStatsMap[pName].revenue += lineRevenue;
          grandTotalRevenue += lineRevenue;
        }
      } else if (order.productName || order.product) {
        const pName = order.productName || order.product || 'Product';
        const qty = order.quantity || 1;
        const lineRevenue = order.totalAmount ?? order.amount ?? 0;

        if (!productStatsMap[pName]) {
          const matchedProd = brokerProducts.find((p) => p.name.toLowerCase() === pName.toLowerCase());
          productStatsMap[pName] = {
            name: pName,
            image: matchedProd?.image || '',
            unitsSold: 0,
            revenue: 0,
          };
        }

        productStatsMap[pName].unitsSold += qty;
        productStatsMap[pName].revenue += lineRevenue;
        grandTotalRevenue += lineRevenue;
      }
    }

    const list = Object.values(productStatsMap).map((item) => ({
      ...item,
      share: grandTotalRevenue > 0 ? Math.round((item.revenue / grandTotalRevenue) * 100) : 0,
    }));

    return list.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders, brokerProducts]);

  // Handle Order Status Update in Modal
  const handleUpdateModalOrderStatus = async (newStatus: string) => {
    if (!selectedOrderDetails) return;

    setIsUpdatingStatus(true);
    try {
      updateOrderStatus(selectedOrderDetails.id, newStatus);
      await updateOrderStatusInDB(selectedOrderDetails.id, newStatus);
      setSelectedOrderDetails((prev) => (prev ? { ...prev, status: newStatus as any } : null));
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden">
      {/* Welcome Banner & Total Lifetime Revenue */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-gray-border dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full md:w-auto">
          <UserAvatar
            src={user?.avatar}
            name={displayName}
            alt={displayName}
            className="w-11 h-11 sm:w-14 sm:h-14 shadow-sm border border-gray-100 dark:border-slate-600 shrink-0"
            roundedClassName="rounded-2xl"
            fallbackClassName="bg-gradient-to-br from-primary to-teal-400 text-white text-base sm:text-xl font-bold"
          />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white truncate">Welcome back, {displayName}</h1>
            <p className="text-xs sm:text-sm text-gray-text dark:text-slate-400 truncate">Live brokerage performance overview and order metrics</p>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <DollarSign size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Total Lifetime Revenue</p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 truncate">{formatRupeeExact(revenueMetrics.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {dynamicStats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} icon={statIcons[i]} />
        ))}
      </div>

      {/* 📈 Sales Analytics & Quick Glance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Analytics Graph Card */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-border dark:border-slate-700 p-6 shadow-xs text-text-primary dark:text-white flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center font-bold text-lg shadow-xs">
                $
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary dark:text-white tracking-tight">Revenue Growth (₹)</h2>
                <p className="text-xs text-gray-text dark:text-slate-400">Total gross transaction volume</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Timeframe Selector */}
              <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-xl flex items-center text-xs font-semibold">
                <button
                  onClick={() => setAnalyticsTimeframe('daily')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    analyticsTimeframe === 'daily' ? 'bg-white dark:bg-slate-600 text-primary dark:text-emerald-400 shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-text-primary dark:hover:text-white'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setAnalyticsTimeframe('weekly')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    analyticsTimeframe === 'weekly' ? 'bg-white dark:bg-slate-600 text-primary dark:text-emerald-400 shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-text-primary dark:hover:text-white'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setAnalyticsTimeframe('monthly')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    analyticsTimeframe === 'monthly' ? 'bg-white dark:bg-slate-600 text-primary dark:text-emerald-400 shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-text-primary dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* YoY Badge */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  yoyGrowthText === 'YoY: N/A'
                    ? 'bg-gray-100 text-gray-500 border-gray-200'
                    : yoyIsPositive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {yoyGrowthText}
              </div>
            </div>
          </div>

          {/* Chart View */}
          {revenueMetrics.completedOrders === 0 && analyticsChartData.every((b) => b.revenue === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                <DollarSign size={24} />
              </div>
              <p className="text-sm font-bold text-text-primary dark:text-white mb-1">No completed sales yet.</p>
              <p className="text-xs text-gray-text dark:text-slate-400 max-w-sm">
                Your revenue chart will appear here once you receive your first completed order.
              </p>
            </div>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={formatRupeeCompact} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    activeDot={{ r: 6, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Quick Glance & Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-border dark:border-slate-700 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <h2 className="text-lg font-bold text-text-primary dark:text-white">Quick Glance</h2>
          <div className="space-y-3">
            <div
              onClick={() => navigate('/broker/messages')}
              className="flex items-center gap-3 p-3.5 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors cursor-pointer border border-blue-100 dark:border-blue-900"
            >
              <div className="w-10 h-10 rounded-lg bg-status-blue/10 flex items-center justify-center shrink-0">
                <MessageSquare size={20} className="text-status-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary dark:text-white">New Customer Messages</p>
                <p className="text-xs text-gray-text dark:text-slate-400">Respond to client inquiries & quotes</p>
              </div>
            </div>

            <div
              onClick={() => navigate('/broker/notifications')}
              className="flex items-center gap-3 p-3.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors cursor-pointer border border-amber-100 dark:border-amber-900"
            >
              <div className="w-10 h-10 rounded-lg bg-status-yellow/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-status-yellow" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary dark:text-white">Pending Call & Meeting Alerts</p>
                <p className="text-xs text-gray-text dark:text-slate-400">Review customer callback requests</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <div className="w-10 h-10 rounded-lg bg-status-green/10 flex items-center justify-center shrink-0">
                <BarChart3 size={20} className="text-status-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary dark:text-white">{yoyGrowthText} Trajectory</p>
                <p className="text-xs text-gray-text dark:text-slate-400">Gross revenue trends based on orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🏆 Top Selling Products Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-border dark:border-slate-700 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Top Selling Products</h2>
              <p className="text-xs text-gray-text dark:text-slate-400">Calculated from actual completed order items</p>
            </div>
          </div>
        </div>

        {topSellingProducts.length === 0 ? (
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-8 text-center">
            <ShoppingBag size={36} className="text-gray-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-text-primary dark:text-white">No top-selling product data yet</p>
            <p className="text-xs text-gray-label dark:text-slate-500">Top products will populate automatically when customers buy your listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {topSellingProducts.map((item, idx) => (
              <div key={item.name} className="bg-gray-50/80 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 overflow-hidden border border-gray-200 dark:border-slate-600 shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-gray-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-primary dark:text-emerald-400 bg-primary/10 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                      #{idx + 1} Top
                    </span>
                    <h3 className="text-xs font-bold text-text-primary dark:text-white truncate mt-1">{item.name}</h3>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-slate-700 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-slate-400">
                    <span>Units Sold:</span>
                    <span className="font-bold text-text-primary dark:text-white">{item.unitsSold}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-slate-400">
                    <span>Revenue:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupeeExact(item.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-slate-400">
                    <span>Sales Share:</span>
                    <span className="font-bold text-primary dark:text-emerald-400">{item.share}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📋 Recent Received Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-border dark:border-slate-700 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-white">Recent Received Orders</h2>
            <p className="text-xs text-gray-text dark:text-slate-400">Live incoming customer orders requiring fulfillment</p>
          </div>
          <div className="flex items-center gap-3">
            {orders.length > 0 && (
              <button
                onClick={() => resetOrders()}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-red-100"
                title="Reset Received Orders"
              >
                <RotateCcw size={13} />
                <span>Reset Orders</span>
              </button>
            )}
            <Link
              to="/broker/orders"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <span>View All ({orders.length})</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-border dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40 text-xs font-semibold text-gray-label dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product / Details</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-slate-500">
                    No orders received yet
                  </td>
                </tr>
              ) : (
                orders.slice(0, 6).map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-sm"
                  >
                    <td className="py-3.5 px-4 font-bold text-primary dark:text-emerald-400 font-mono text-xs">{order.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-text-primary dark:text-white">{order.customerName}</td>
                    <td className="py-3.5 px-4 text-gray-text dark:text-slate-400 text-xs max-w-48 truncate">
                      {order.product ||
                        (order.items
                          ? order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')
                          : 'Order Item')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-text-primary dark:text-white">
                      {formatRupeeExact(order.amount ?? order.totalAmount ?? 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        (order.paymentStatus || '').toLowerCase() === 'successful'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.paymentStatus || 'Successful'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-primary-50 px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        <Eye size={13} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔍 Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-gray-border dark:border-slate-700 shadow-2xl p-6 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-border dark:border-slate-700 pb-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary dark:text-white flex items-center gap-2">
                  Order Details: <span className="font-mono text-primary dark:text-emerald-400">{selectedOrderDetails.id}</span>
                </h3>
                <p className="text-xs text-gray-label dark:text-slate-400">
                  Placed on {selectedOrderDetails.date || selectedOrderDetails.createdAt}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/80 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-gray-label dark:text-slate-400 uppercase tracking-wider mb-1">Customer Info</p>
                <p className="text-sm font-semibold text-text-primary dark:text-white">{selectedOrderDetails.customerName}</p>
                {selectedOrderDetails.customerEmail && (
                  <p className="text-xs text-gray-text dark:text-slate-400">📧 {selectedOrderDetails.customerEmail}</p>
                )}
                {selectedOrderDetails.customerPhone && (
                  <p className="text-xs text-gray-text dark:text-slate-400">📞 {selectedOrderDetails.customerPhone}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-label dark:text-slate-400 uppercase tracking-wider mb-1">Delivery Address</p>
                <p className="text-xs text-gray-text dark:text-slate-400">
                  {selectedOrderDetails.deliveryAddress || 'No delivery address provided'}
                </p>
              </div>
            </div>

            {/* Customer Requirements */}
            {selectedOrderDetails.customerRequirements && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">📋 Customer Requirements / Notes</p>
                <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">{selectedOrderDetails.customerRequirements}</p>
              </div>
            )}


            {/* Items Table */}
            <div>
              <p className="text-xs font-bold text-gray-label dark:text-slate-400 uppercase tracking-wider mb-2">Order Line Items</p>
              <div className="border border-gray-border dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-border dark:border-slate-700 font-semibold text-gray-label dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                      selectedOrderDetails.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-medium text-text-primary dark:text-white">{item.productName}</td>
                          <td className="py-2.5 px-3 text-center font-bold dark:text-slate-200">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right dark:text-slate-300">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-text-primary dark:text-white">
                          {selectedOrderDetails.product || 'Order Item'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold dark:text-slate-200">{selectedOrderDetails.quantity || 1}</td>
                        <td className="py-2.5 px-3 text-right dark:text-slate-300">
                          ₹{(selectedOrderDetails.totalAmount || selectedOrderDetails.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{(selectedOrderDetails.totalAmount || selectedOrderDetails.amount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment & Settlement Breakdown */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                💰 Settlement & Commission Breakdown
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 shadow-2xs">
                  <p className="text-gray-500 dark:text-slate-400 font-medium text-[11px]">Payment Received</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{(selectedOrderDetails.totalAmount || selectedOrderDetails.amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 shadow-2xs">
                  <p className="text-gray-500 dark:text-slate-400 font-medium text-[11px]">Platform Commission</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹0</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 shadow-2xs">
                  <p className="text-gray-500 dark:text-slate-400 font-medium text-[11px]">Broker Amount</p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    ₹{(selectedOrderDetails.totalAmount || selectedOrderDetails.amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 shadow-2xs">
                  <p className="text-gray-500 dark:text-slate-400 font-medium text-[11px]">Settlement Status</p>
                  <span className={`inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    (selectedOrderDetails.settlement_status === 'Settled')
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {selectedOrderDetails.settlement_status || 'Pending Admin Settlement'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Order Status Control */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-border dark:border-slate-700">
              <div>
                <p className="text-xs font-bold text-gray-label dark:text-slate-400 uppercase tracking-wider mb-1">Payment Info</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-text-primary dark:text-white">{selectedOrderDetails.paymentMethod || 'Online Payment'}</span>
                  <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {selectedOrderDetails.paymentStatus || 'Successful'}
                  </span>
                </div>
                {selectedOrderDetails.transactionId && (
                  <p className="text-[11px] text-gray-label dark:text-slate-500 font-mono mt-1">Txn: {selectedOrderDetails.transactionId}</p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-label dark:text-slate-400 uppercase tracking-wider mb-1.5">Update Order Status</p>
                <select
                  value={selectedOrderDetails.status}
                  disabled={isUpdatingStatus}
                  onChange={(e) => handleUpdateModalOrderStatus(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="Pending Broker Approval">Pending Broker Approval</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerDashboard;
