import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Users, Package, DollarSign, RefreshCw } from 'lucide-react';
import type { Order, Broker, Product } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { getAdminOrders, getAdminBrokers } from '../../lib/api/admin';
import { getProducts } from '../../lib/api/products';
import { formatRupeeCompact, formatRupeeExact } from '../../lib/api/orders';

export const AdminAnalytics: React.FC = () => {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [orders, setOrders] = useState<Order[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [oData, bData, pData] = await Promise.all([
        getAdminOrders(),
        getAdminBrokers(),
        getProducts(),
      ]);
      setOrders(oData);
      setBrokers(bData);
      setProducts(pData);
    } catch (err) {
      console.error('Error loading admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Revenue Over Time Chart
  const revenueChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      buckets.push({
        key: `${y}-${String(m + 1).padStart(2, '0')}`,
        month: monthNames[m],
        revenue: 0,
        orders: 0,
      });
    }

    for (const order of orders) {
      const statusLower = (order.status || '').toLowerCase();
      if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('refund')) continue;

      const orderDateStr = order.createdAt || order.date;
      if (!orderDateStr) continue;
      const d = new Date(orderDateStr);
      if (isNaN(d.getTime())) continue;

      const oYear = d.getFullYear();
      const oMonth = d.getMonth();
      const oKey = `${oYear}-${String(oMonth + 1).padStart(2, '0')}`;

      const match = buckets.find((b) => b.key === oKey);
      if (match) {
        match.revenue += order.totalAmount ?? order.amount ?? 0;
        match.orders += 1;
      }
    }

    return buckets;
  }, [orders]);

  // Compute Revenue By Category
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    let totalCatRev = 0;

    for (const order of orders) {
      const statusLower = (order.status || '').toLowerCase();
      if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('refund')) continue;

      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const matchedProd = products.find((p) => p.name.toLowerCase() === item.productName.toLowerCase());
          const cat = matchedProd?.category || 'General';
          const lineRev = (item.unitPrice || 0) * (item.quantity || 1);
          catMap[cat] = (catMap[cat] || 0) + lineRev;
          totalCatRev += lineRev;
        }
      }
    }

    const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];
    const entries = Object.entries(catMap).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length],
    }));

    if (entries.length === 0) {
      return [{ name: 'Listings', value: 1, color: '#10B981' }];
    }

    return entries.sort((a, b) => b.value - a.value);
  }, [orders, products]);

  // Compute Revenue By Broker
  const revenueByBroker = useMemo(() => {
    const brokerMap: Record<string, { name: string; revenue: number; orders: number }> = {};

    for (const order of orders) {
      const statusLower = (order.status || '').toLowerCase();
      if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('refund')) continue;

      const bId = order.brokerId || 'unknown';
      const bName = order.brokerName || brokers.find((b) => b.id === bId)?.name || 'Verified Broker';

      if (!brokerMap[bName]) {
        brokerMap[bName] = { name: bName, revenue: 0, orders: 0 };
      }

      brokerMap[bName].revenue += order.totalAmount ?? order.amount ?? 0;
      brokerMap[bName].orders += 1;
    }

    return Object.values(brokerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [orders, brokers]);

  const tooltipStyle = {
    backgroundColor: isLight ? '#FFFFFF' : '#0F172A',
    borderColor: isLight ? '#E2E8F0' : '#334155',
    borderRadius: '12px',
    fontSize: '12px',
    color: isLight ? '#0F172A' : '#F8FAFC',
    boxShadow: isLight ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Sync Button */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>Platform Analytics & Performance</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-time platform intelligence calculated from verified database orders.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 📈 Total Revenue Over Time (Area Chart) */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>Total Revenue Trajectory Over Time (₹)</span>
          </h2>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Real Database Records
          </span>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#F1F5F9' : '#1E293B'} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: isLight ? '#64748B' : '#94A3B8', fontSize: 12 }} />
              <YAxis tick={{ fill: isLight ? '#64748B' : '#94A3B8', fontSize: 12 }} tickFormatter={formatRupeeCompact} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [formatRupeeExact(Number(val)), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fill="url(#adminRevenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 📊 Revenue by Broker & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue by Broker */}
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <h2 className={`text-base font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Revenue Generated by Broker (₹)</span>
          </h2>

          {revenueByBroker.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No broker revenue data yet.</p>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByBroker}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#F1F5F9' : '#1E293B'} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: isLight ? '#64748B' : '#94A3B8', fontSize: 11 }} />
                  <YAxis tick={{ fill: isLight ? '#64748B' : '#94A3B8', fontSize: 11 }} tickFormatter={formatRupeeCompact} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [formatRupeeExact(Number(val)), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue by Category (Pie Chart) */}
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <h2 className={`text-base font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Package className="w-4 h-4 text-emerald-500" />
            <span>Sales Share by Product Category</span>
          </h2>

          <div className="h-64 flex flex-col sm:flex-row items-center justify-between">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{cat.name}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">{formatRupeeCompact(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
