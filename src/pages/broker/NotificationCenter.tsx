import React, { useState } from 'react';
import { Phone, Package, Info, Bell } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

type TabType = 'all' | 'call_request' | 'order_alert' | 'general';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filteredNotifications = notifications.filter(
    (n) => activeTab === 'all' || n.type === activeTab
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'call_request':
        return <Phone className="w-5 h-5 text-indigo-600" />;
      case 'order_alert':
        return <Package className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-amber-600" />;
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'call_request':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300';
      case 'order_alert':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300';
    }
  };

  const handleAction = (notifId: string, label: string, notifTitle: string) => {
    markNotificationRead(notifId);
    showToast(`Action "${label}" processed for: ${notifTitle}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Broker Notifications</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time call requests, order alerts, and deal updates
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'call_request', label: 'Call Requests' },
          { id: 'order_alert', label: 'Order Alerts' },
          { id: 'general', label: 'General System' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center text-zinc-400 border border-zinc-200 dark:border-zinc-800">
            <Bell className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
            <p className="text-sm font-medium">No notifications in this category</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`bg-white dark:bg-zinc-900 p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-xs ${
                n.read
                  ? 'border-zinc-200 dark:border-zinc-800 opacity-80'
                  : 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${getBadgeStyle(n.type)}`}>
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-base">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{n.description}</p>
                  <p className="text-[10px] text-zinc-400 mt-2">{n.timestamp}</p>
                </div>
              </div>

              {n.actions && n.actions.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  {n.actions.map((act, idx) => (
                    <Button
                      key={idx}
                      variant={act.variant === 'primary' ? 'primary' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(n.id, act.label, n.title);
                      }}
                    >
                      {act.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
