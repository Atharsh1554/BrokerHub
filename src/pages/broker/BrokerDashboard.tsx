import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingBag, BarChart3, Clock, MessageSquare, AlertTriangle, ArrowRight, Package } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { sellingTrendsData } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

export const BrokerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { orders, products } = useApp();
  const { user } = useAuth();

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const initials = getUserInitials(displayName);

  // Computed metrics from real orders state
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount ?? o.amount ?? 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status.toLowerCase().includes('pending')).length;

  const dynamicStats = [
    { label: 'Total Received Orders', value: orders.length.toString(), change: 12.3, changeLabel: 'from last month' },
    { label: 'Total Revenue Value', value: `₹${totalRevenue.toLocaleString('en-IN')}`, change: 8.4, changeLabel: 'from last month' },
    { label: 'Active Product Listings', value: products.length.toString(), change: 5.0, changeLabel: 'active listings' },
    { label: 'Pending Approval', value: pendingOrdersCount.toString(), change: pendingOrdersCount > 0 ? 15.0 : 0, changeLabel: 'requires action' },
  ];

  const statIcons = [
    <ShoppingBag size={20} />,
    <DollarSign size={20} />,
    <Package size={20} />,
    <Clock size={20} />,
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-gray-border shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-sm">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back, {displayName}</h1>
          <p className="text-sm text-gray-text">Here is your live brokerage performance overview and order metrics</p>
        </div>
      </div>

      {/* Dynamic Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} icon={statIcons[i]} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Selling Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-border p-6 shadow-xs">
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
        <div className="bg-white rounded-xl border border-gray-border p-6 shadow-xs">
          <h2 className="text-lg font-bold text-text-primary mb-4">Quick Glance</h2>
          <div className="space-y-4">
            <div
              onClick={() => navigate('/broker/messages')}
              className="flex items-center gap-3 p-3.5 bg-blue-50/80 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer border border-blue-100"
            >
              <div className="w-10 h-10 rounded-lg bg-status-blue/10 flex items-center justify-center shrink-0">
                <MessageSquare size={20} className="text-status-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">4 New Customer Messages</p>
                <p className="text-xs text-gray-text">Respond to client inquiries & quotes</p>
              </div>
            </div>

            <div
              onClick={() => navigate('/broker/notifications')}
              className="flex items-center gap-3 p-3.5 bg-amber-50/80 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer border border-amber-100"
            >
              <div className="w-10 h-10 rounded-lg bg-status-yellow/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-status-yellow" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Pending Call & Meeting Alerts</p>
                <p className="text-xs text-gray-text">Review customer callback requests</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-100">
              <div className="w-10 h-10 rounded-lg bg-status-green/10 flex items-center justify-center shrink-0">
                <BarChart3 size={20} className="text-status-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">+12.3% Growth</p>
                <p className="text-xs text-gray-text">Month over month revenue performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Received Orders Table */}
      <div className="bg-white rounded-xl border border-gray-border p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Recent Received Orders</h2>
            <p className="text-xs text-gray-text">Live incoming customer orders requiring fulfillment</p>
          </div>
          <Link
            to="/broker/orders"
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-border bg-gray-50/60 text-xs font-semibold text-gray-label uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product / Details</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No orders received yet
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate('/broker/orders')}
                    className="hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                  >
                    <td className="py-3.5 px-4 font-bold text-primary font-mono text-xs">{order.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-text-primary">{order.customerName}</td>
                    <td className="py-3.5 px-4 text-gray-text text-xs max-w-48 truncate">
                      {order.product ||
                        (order.items
                          ? order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')
                          : 'Order Item')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-text-primary">
                      ₹{(order.amount ?? order.totalAmount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/broker/orders"
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-primary-50 px-2.5 py-1 rounded-lg"
                      >
                        Process
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BrokerDashboard;
