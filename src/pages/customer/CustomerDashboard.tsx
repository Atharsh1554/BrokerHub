import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, Calendar, MessageSquare, MessageCircle, CalendarDays, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';
import { customerStats, recentActivity } from '../../data/mockData';

export const CustomerDashboard: React.FC = () => {
  const { products, brokers } = useApp();

  const statIcons = [
    <Users size={20} />,
    <Clock size={20} />,
    <Calendar size={20} />,
    <MessageSquare size={20} />,
  ];

  const statColors = [
    'bg-green-50 text-status-green',
    'bg-yellow-50 text-status-yellow',
    'bg-blue-50 text-status-blue',
    'bg-purple-50 text-secondary',
  ];

  // Newest products first (broker-added ones have p_ prefix from context)
  const latestProducts = [...products].slice(0, 4);
  const hasNewProducts = products.some((p) => p.id.startsWith('p_'));

  return (
    <div>
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white text-xl font-bold">
            SJ
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Welcome back, Sarah Jenkins</h1>
            <p className="text-sm text-gray-text">Here's what's happening with your broker connections</p>
          </div>
        </div>
        {hasNewProducts && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200 animate-pulse">
            <Sparkles size={12} />
            New products from your brokers!
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {customerStats.map((stat, i) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-gray-text font-medium">{stat.label}</p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${statColors[i]}`}>
                {statIcons[i]}
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ✨ Latest Products from Brokers — live from AppContext */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary">Latest Products</h2>
            <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
              {products.length} listings
            </span>
          </div>
          <Link
            to="/customer/products"
            className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
          >
            Browse All <ArrowRight size={14} />
          </Link>
        </div>

        {latestProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-border p-8 text-center">
            <ShoppingBag size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-text">No products yet. Check back when your brokers add listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latestProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-border overflow-hidden hover:shadow-md transition-all duration-200 group relative"
              >
                {/* NEW badge for broker-added products */}
                {product.id.startsWith('p_') && (
                  <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    NEW
                  </div>
                )}
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag size={36} className="text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-gray-label uppercase tracking-wider mb-0.5">{product.category}</p>
                  <h3 className="text-xs font-semibold text-text-primary line-clamp-1 mb-1">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary">${product.price.toFixed(2)}</p>
                    <StatusBadge status={product.status} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Matched Brokers */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Your Matched Brokers</h2>
          <Link to="/customer/my-brokers" className="text-sm text-primary font-medium hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brokers.slice(0, 3).map((broker) => (
            <div key={broker.id} className="bg-white rounded-xl border border-gray-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-teal-100 flex items-center justify-center text-primary font-bold">
                  {broker.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary">{broker.name}</h3>
                  <p className="text-xs text-gray-text">{broker.specialty}</p>
                  <p className="text-xs text-gray-label">{broker.company}</p>
                </div>
                <StatusBadge status={broker.status} size="sm" />
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-border">
                <Link to="/customer/messages" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary-50 transition-colors">
                  <MessageCircle size={14} />
                  Chat
                </Link>
                <Link to="/customer/appointments" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary-50 transition-colors">
                  <CalendarDays size={14} />
                  Schedule
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-border p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-border last:border-0 last:pb-0">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-text-primary">{activity.text}</p>
                <p className="text-xs text-gray-label mt-0.5">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
