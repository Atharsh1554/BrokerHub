import React, { useState } from 'react';
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
import { Calendar, TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import type { AnalyticsDateFilter } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminAnalytics: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<AnalyticsDateFilter>('30days');
  const [customStart, setCustomStart] = useState('2026-01-01');
  const [customEnd, setCustomEnd] = useState('2026-09-21');
  const { theme } = useAdminTheme();

  const isLight = theme === 'light';

  // Interactive Recharts mock dataset adjusted per filter
  const userGrowthData = [
    { period: 'Jan', customers: 45, brokers: 12 },
    { period: 'Feb', customers: 85, brokers: 18 },
    { period: 'Mar', customers: 140, brokers: 25 },
    { period: 'Apr', customers: 210, brokers: 32 },
    { period: 'May', customers: 320, brokers: 41 },
    { period: 'Jun', customers: 460, brokers: 50 },
    { period: 'Jul', customers: 610, brokers: 64 },
    { period: 'Aug', customers: 780, brokers: 79 },
    { period: 'Sep', customers: 950, brokers: 92 },
  ];

  const orderTrendsData = [
    { day: 'Mon', completed: 14, pending: 4, cancelled: 1 },
    { day: 'Tue', completed: 22, pending: 6, cancelled: 2 },
    { day: 'Wed', completed: 18, pending: 3, cancelled: 0 },
    { day: 'Thu', completed: 29, pending: 8, cancelled: 3 },
    { day: 'Fri', completed: 35, pending: 10, cancelled: 1 },
    { day: 'Sat', completed: 42, pending: 12, cancelled: 2 },
    { day: 'Sun', completed: 26, pending: 5, cancelled: 1 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 180000 },
    { month: 'Feb', revenue: 240000 },
    { month: 'Mar', revenue: 390000 },
    { month: 'Apr', revenue: 450000 },
    { month: 'May', revenue: 620000 },
    { month: 'Jun', revenue: 890000 },
    { month: 'Jul', revenue: 1120000 },
    { month: 'Aug', revenue: 1450000 },
    { month: 'Sep', revenue: 1890000 },
  ];

  const categoryDistribution = [
    { name: 'Electronics', value: 45, color: '#10B981' },
    { name: 'Audio', value: 25, color: '#6366F1' },
    { name: 'Furniture', value: 15, color: '#F59E0B' },
    { name: 'Accessories', value: 10, color: '#3B82F6' },
    { name: 'Fashion', value: 5, color: '#EC4899' },
  ];

  const tooltipStyle = {
    backgroundColor: isLight ? '#FFFFFF' : '#0F172A',
    borderColor: isLight ? '#E2E8F0' : '#334155',
    borderRadius: '12px',
    fontSize: '12px',
    color: isLight ? '#0F172A' : '#F8FAFC',
    boxShadow: isLight ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
  };

  return (
    <div className="space-y-8">
      {/* Header & Date Range Selector */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>Platform Analytics & Performance</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-time interactive intelligence on user acquisition, products, orders, and revenue streams.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['today', '7days', '30days', '3months', '1year', 'custom'] as AnalyticsDateFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                dateFilter === filter
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {filter === '7days' ? '7 Days' : filter === '30days' ? '30 Days' : filter === '3months' ? '3 Months' : filter === '1year' ? '1 Year' : filter}
            </button>
          ))}
        </div>
      </div>

      {dateFilter === 'custom' && (
        <div className={`p-4 rounded-2xl border flex items-center space-x-4 ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold">Custom Date Range:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className={`border rounded-lg px-3 py-1 text-xs ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
          <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className={`border rounded-lg px-3 py-1 text-xs ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>
      )}

      {/* Grid 1: Revenue & User Acquisition Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Analytics Chart */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isLight ? 'border-slate-100' : 'border-slate-800'
          }`}>
            <div>
              <h2 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Revenue Growth (₹)</span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total gross transaction volume</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              +34.2% YoY
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#1E293B'} />
                <XAxis dataKey="month" stroke={isLight ? '#64748B' : '#64748B'} fontSize={11} />
                <YAxis stroke={isLight ? '#64748B' : '#64748B'} fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isLight ? 'border-slate-100' : 'border-slate-800'
          }`}>
            <div>
              <h2 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Users className="w-4 h-4 text-indigo-500" />
                <span>User Registrations (Customers vs Brokers)</span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Platform user onboarding trajectory</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#1E293B'} />
                <XAxis dataKey="period" stroke={isLight ? '#64748B' : '#64748B'} fontSize={11} />
                <YAxis stroke={isLight ? '#64748B' : '#64748B'} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="customers" name="Customers" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="brokers" name="Brokers" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 2: Order Status & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Status Breakdown */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isLight ? 'border-slate-100' : 'border-slate-800'
          }`}>
            <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Weekly Order Fulfillment Trends</h2>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Completed vs Pending vs Cancelled</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#1E293B'} />
                <XAxis dataKey="day" stroke={isLight ? '#64748B' : '#64748B'} fontSize={11} />
                <YAxis stroke={isLight ? '#64748B' : '#64748B'} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10B981" />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#F59E0B" />
                <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className={`p-6 rounded-3xl border space-y-4 flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`border-b pb-3 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <h2 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Package className="w-4 h-4 text-violet-500" />
              <span>Product Category Share</span>
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Active listings distribution</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            {categoryDistribution.map((item, idx) => (
              <div key={idx} className={`flex items-center space-x-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="truncate">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
