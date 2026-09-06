import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, Calendar, MessageSquare, MessageCircle, CalendarDays } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { customerStats, brokers, recentActivity } from '../../data/mockData';

export const CustomerDashboard: React.FC = () => {
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
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary-50 transition-colors">
                  <MessageCircle size={14} />
                  Chat
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary-50 transition-colors">
                  <CalendarDays size={14} />
                  Schedule
                </button>
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
