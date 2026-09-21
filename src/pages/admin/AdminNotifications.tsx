import React, { useEffect, useState } from 'react';
import { Bell, Search, Phone, MessageSquare, ShoppingBag, Calendar, UserCheck, ShieldAlert } from 'lucide-react';
import { notifications as mockNotifications } from '../../data/mockData';
import type { Notification } from '../../types';

export const AdminNotifications: React.FC = () => {
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Map mock notifications for admin platform telemetry view
    const formatted: Notification[] = mockNotifications.map((n) => ({
      ...n,
      type: n.type as any,
    }));
    setNotificationsList(formatted);
  }, []);

  const categories = [
    { key: 'all', label: 'All Categories', icon: Bell },
    { key: 'call_request', label: 'Calls', icon: Phone },
    { key: 'message', label: 'Messages', icon: MessageSquare },
    { key: 'order_alert', label: 'Orders', icon: ShoppingBag },
    { key: 'meeting', label: 'Meetings', icon: Calendar },
    { key: 'broker_request', label: 'Broker Requests', icon: UserCheck },
    { key: 'general', label: 'System Alerts', icon: ShieldAlert },
  ];

  const filteredNotifications = notificationsList.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());

    const matchesCat = categoryFilter === 'all' || n.type === categoryFilter;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <span>Platform-Wide Notification Dispatch Audit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of system alerts, call requests, order notifications, and broker alerts.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          Total Notifications: {notificationsList.length}
        </span>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat.key
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notification title or content..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {/* Notifications List Card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl p-6 space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No notifications found in this category.</div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-bold text-white">{item.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-slate-400 uppercase">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{item.description}</p>
                    <span className="text-[10px] text-slate-500 block">{item.timestamp}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      item.read
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {item.read ? 'Delivered' : 'Unread'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
