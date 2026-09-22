import React, { useEffect, useState } from 'react';
import { Bell, Search, Phone, MessageSquare, ShoppingBag, Calendar, UserCheck, ShieldAlert } from 'lucide-react';
import { notifications as mockNotifications } from '../../data/mockData';
import type { Notification } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminNotifications: React.FC = () => {
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Bell className="w-5 h-5 text-emerald-500" />
            <span>Platform-Wide Notification Dispatch Audit</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-time audit log of system alerts, call requests, order notifications, and broker alerts.
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          Total Notifications: {notificationsList.length}
        </span>
      </div>

      {/* Category Pills & Search */}
      <div className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
      }`}>
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoryFilter === cat.key
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
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
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Notifications List Card */}
      <div className={`rounded-3xl border overflow-hidden p-6 space-y-4 transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        {filteredNotifications.length === 0 ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No notifications found in this category.</div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                    isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-800 text-emerald-400 border-slate-700'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        isLight ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{item.description}</p>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{item.timestamp}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      item.read
                        ? isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                        : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
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
