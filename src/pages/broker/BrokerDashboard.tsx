import React from 'react';
import { DollarSign, ShoppingBag, BarChart3, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { brokerStats, sellingTrendsData } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

export const BrokerDashboard: React.FC = () => {
  const { orders } = useApp();
  const { user } = useAuth();

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const initials = getUserInitials(displayName);

  const statIcons = [
    <DollarSign size={20} />,
    <DollarSign size={20} />,
    <ShoppingBag size={20} />,
    <Clock size={20} />,
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-sm">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back, {displayName}</h1>
          <p className="text-sm text-gray-text">Here is your brokerage performance overview and live inquiry metrics</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {brokerStats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} icon={statIcons[i]} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Selling Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-border p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Selling Trends (Monthly)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sellingTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="sales" fill="url(#greenGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#2DD4A8" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Glance */}
        <div className="bg-white rounded-xl border border-gray-border p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Quick Glance</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-status-blue/10 flex items-center justify-center">
                <MessageSquare size={20} className="text-status-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">4 New Messages</p>
                <p className="text-xs text-gray-text">Respond to customer inquiries</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-status-yellow/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-status-yellow" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">3 Alerts & Requests</p>
                <p className="text-xs text-gray-text">Pending actions require attention</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-status-green/10 flex items-center justify-center">
                <BarChart3 size={20} className="text-status-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">+12.3% Growth</p>
                <p className="text-xs text-gray-text">Month over month improvement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-gray-border p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-label uppercase tracking-wider">Order ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-label uppercase tracking-wider">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-label uppercase tracking-wider">Product</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-label uppercase tracking-wider">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-label uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 3).map((order) => (
                <tr key={order.id} className="border-b border-gray-border last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-primary">{order.id}</td>
                  <td className="py-3 px-4 text-sm text-text-primary">{order.customerName}</td>
                  <td className="py-3 px-4 text-sm text-gray-text">{order.product}</td>
                  <td className="py-3 px-4 text-sm font-medium text-text-primary">
                    ₹{(order.amount ?? order.totalAmount ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={order.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
