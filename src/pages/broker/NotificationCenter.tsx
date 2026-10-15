import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Phone,
  MessageSquare,
  ShoppingBag,
  Calendar,
  UserCheck,
  Info,
  Check,
  X,
  CheckCheck,
  ExternalLink,
  Clock,
  Database,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { CustomerProfileModal } from '../../components/broker/CustomerProfileModal';
import type { BrokerNotification, BrokerNotificationType, CustomerProfile } from '../../types';

type CategoryFilter = 'all' | BrokerNotificationType;
type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected' | 'completed';

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const {
    notifications,
    unreadCount,
    isLiveSupabase,
    markRead,
    markAllAsRead,
    updateStatus,
    deleteNotification,
    deleteAllNotifications,
    deleteReadNotifications,
    deleteNotificationsByType,
    getCustomerProfile,
  } = useNotifications();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Category
      if (activeCategory !== 'all' && notif.type !== activeCategory) {
        return false;
      }
      // Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && notif.status !== 'pending') return false;
        if (statusFilter === 'accepted' && notif.status !== 'accepted') return false;
        if (statusFilter === 'rejected' && notif.status !== 'rejected') return false;
        if (statusFilter === 'completed' && notif.status !== 'completed' && notif.status !== 'handled') return false;
      }
      return true;
    });
  }, [notifications, activeCategory, statusFilter]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: notifications.length,
      call_request: 0,
      message: 0,
      order: 0,
      meeting: 0,
      profile_request: 0,
      general: 0,
      reverse_auction: 0,
    };
    notifications.forEach((n) => {
      if (counts[n.type] !== undefined) {
        counts[n.type]++;
      }
    });
    return counts;
  }, [notifications]);

  const handleOpenProfile = (customerId: string) => {
    const profile = getCustomerProfile(customerId);
    if (profile) {
      setSelectedProfile(profile);
      setIsProfileOpen(true);
    } else {
      showToast('Customer profile not available', 'info');
    }
  };

  const handleAccept = async (notif: BrokerNotification, customMsg?: string) => {
    await updateStatus(notif.id, 'accepted');
    showToast(customMsg || `Accepted ${notif.title} from ${notif.customer_name}`, 'success');
  };

  const handleReject = async (notif: BrokerNotification) => {
    await updateStatus(notif.id, 'rejected');
    showToast(`Declined request from ${notif.customer_name}`, 'info');
  };

  const handleMarkRead = async (id: string) => {
    await markRead(id);
    showToast('Marked as read', 'info');
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      await deleteAllNotifications();
      showToast('All notifications cleared', 'success');
    }
  };

  const handleClearRead = async () => {
    await deleteReadNotifications();
    showToast('Read notifications cleared', 'info');
  };

  const handleClearCurrentCategory = async () => {
    if (activeCategory === 'all') return;
    const count = categoryCounts[activeCategory];
    if (window.confirm(`Are you sure you want to delete all ${count} notification(s) in this category?`)) {
      await deleteNotificationsByType(activeCategory);
      showToast(`Cleared notifications in ${getCategoryLabel(activeCategory)}`, 'success');
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const getCategoryIcon = (type: BrokerNotificationType) => {
    switch (type) {
      case 'call_request':
        return <Phone className="w-4 h-4 text-emerald-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-amber-600" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'profile_request':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (type: BrokerNotificationType) => {
    switch (type) {
      case 'call_request':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'message':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'order':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'meeting':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'profile_request':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryLabel = (type: BrokerNotificationType) => {
    switch (type) {
      case 'call_request':
        return 'Call Request';
      case 'message':
        return 'Message';
      case 'order':
        return 'Order Alert';
      case 'meeting':
        return 'Meeting';
      case 'profile_request':
        return 'Profile Access';
      default:
        return 'General';
    }
  };

  const categories: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Activities', icon: <Bell className="w-4 h-4" /> },
    { id: 'message', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'order', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'profile_request', label: 'Profile Requests', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'general', label: 'General', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-border dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-emerald-950/50 text-primary dark:text-emerald-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Notification & Request Center
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage incoming customer calls, messages, meeting schedules, orders, and inquiries.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Supabase status indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              isLiveSupabase
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
            title={
              isLiveSupabase
                ? 'Connected to Supabase Realtime Database'
                : 'Running in Local Storage Mode with Supabase schema ready'
            }
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isLiveSupabase ? '⚡ Supabase Live Cloud' : '📁 Supabase Ready (Local Sync)'}</span>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await markAllAsRead();
                showToast('All notifications marked as read', 'success');
              }}
              className="flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-primary" />
              <span>Mark all read ({unreadCount})</span>
            </Button>
          )}

          {notifications.some((n) => n.is_read) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearRead}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
              title="Delete all read notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Read</span>
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              title="Delete all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border border-gray-border dark:border-slate-700'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-border dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter by status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-gray-border dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-primary outline-none transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Declined</option>
            <option value="completed">Completed / Handled</option>
          </select>
        </div>

        {activeCategory !== 'all' && categoryCounts[activeCategory] > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCurrentCategory}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
            title={`Delete all notifications in ${getCategoryLabel(activeCategory)}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear {getCategoryLabel(activeCategory)} ({categoryCounts[activeCategory]})</span>
          </Button>
        )}
      </div>

      {/* Notification Cards List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-border dark:border-slate-700 p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-emerald-950/50 text-primary dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No notifications found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {(statusFilter !== 'all' || activeCategory !== 'all')
                ? 'No activities match your current filter criteria. Try clearing filters or switching tabs.'
                : 'You are all caught up! When customers send messages, place orders, or make requests, they will appear here.'}
            </p>
            {(statusFilter !== 'all' || activeCategory !== 'all') && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setStatusFilter('all');
                  setActiveCategory('all');
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = !notif.is_read;
            return (
              <div
                key={notif.id}
                className={`relative bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 overflow-hidden hover:shadow-md ${
                  isUnread
                    ? 'border-l-4 border-l-primary border-t-emerald-200/60 dark:border-t-emerald-900/60 border-r-emerald-200/60 dark:border-r-emerald-900/60 border-b-emerald-200/60 dark:border-b-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs'
                    : 'border-gray-border dark:border-slate-700'
                }`}
              >
                <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Avatar & Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Customer / Type Avatar */}
                    <div className="relative shrink-0">
                      {notif.customer_avatar ? (
                        <img
                          src={notif.customer_avatar}
                          alt={notif.customer_name}
                          onClick={() => handleOpenProfile(notif.customer_id)}
                          className="w-12 h-12 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all shadow-xs"
                        />
                      ) : (
                        <div
                          onClick={() => handleOpenProfile(notif.customer_id)}
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base cursor-pointer shadow-xs"
                        >
                          {notif.customer_name ? notif.customer_name.charAt(0) : 'B'}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-slate-700 shadow-xs border border-gray-border dark:border-slate-600">
                        {getCategoryIcon(notif.type)}
                      </div>
                    </div>

                    {/* Notification content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <button
                          onClick={() => handleOpenProfile(notif.customer_id)}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          {notif.customer_name}
                        </button>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                            notif.type
                          )}`}
                        >
                          {getCategoryLabel(notif.type)}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto md:ml-0">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(notif.created_at)}
                        </span>
                      </div>

                      <h4 className="font-semibold text-base text-slate-900 dark:text-white mb-1">
                        {notif.title}
                      </h4>

                      {notif.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                          {notif.description}
                        </p>
                      )}

                      {/* Metadata previews */}
                      {notif.metadata && (
                        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                          {notif.metadata.phone && (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-600">
                              📞 {notif.metadata.phone}
                            </span>
                          )}
                          {notif.metadata.requestedTime && (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
                              🕒 {notif.metadata.requestedTime}
                            </span>
                          )}
                          {notif.metadata.proposedDate && (
                            <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 font-medium">
                              📅 {notif.metadata.proposedDate}
                            </span>
                          )}
                          {notif.related_order_id && (
                            <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono font-medium">
                              🛒 Order #{notif.related_order_id}
                            </span>
                          )}
                          {notif.metadata.company && (
                            <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-medium">
                              🏢 {notif.metadata.company}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap md:flex-col items-center md:items-end justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-border dark:border-slate-700">
                    {/* Status badge if already handled */}
                    {notif.status !== 'pending' && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                          notif.status === 'accepted'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : notif.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {notif.status === 'accepted' && <Check className="w-3.5 h-3.5" />}
                        {notif.status === 'rejected' && <X className="w-3.5 h-3.5" />}
                        {notif.status.toUpperCase()}
                      </span>
                    )}

                    {/* Action buttons depending on Type */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Customer Profile button */}
                      {notif.customer_id && notif.customer_id !== 'system' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenProfile(notif.customer_id)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}

                      {/* Type-specific Action Buttons for Pending items */}
                      {notif.status === 'pending' && (
                        <>
                          {notif.type === 'call_request' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAccept(notif, 'Call accepted! Connecting...')}
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Accept Call</span>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleReject(notif)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs"
                              >
                                Decline
                              </Button>
                            </>
                          )}

                          {notif.type === 'message' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                handleMarkRead(notif.id);
                                navigate('/broker/messages');
                              }}
                              className="flex items-center gap-1 text-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Open Chat</span>
                            </Button>
                          )}

                          {notif.type === 'order' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAccept(notif, `Order ${notif.related_order_id || ''} confirmed!`)}
                                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm Order</span>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate('/broker/orders')}
                                className="text-xs"
                              >
                                View Order
                              </Button>
                            </>
                          )}

                          {notif.type === 'meeting' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAccept(notif, 'Meeting request accepted!')}
                                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Accept Meeting</span>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleReject(notif)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs"
                              >
                                Decline
                              </Button>
                            </>
                          )}

                          {notif.type === 'profile_request' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAccept(notif, 'Catalog access granted to customer')}
                                className="flex items-center gap-1 text-xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Grant Access</span>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleReject(notif)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs"
                              >
                                Decline
                              </Button>
                            </>
                          )}

                          {notif.type === 'general' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAccept(notif, 'Notification handled')}
                              className="text-xs"
                            >
                              Dismiss
                            </Button>
                          )}
                        </>
                      )}

                      {/* Delete notification */}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={selectedProfile}
        onCall={() => {
          setIsProfileOpen(false);
          showToast(`Connecting direct call to ${selectedProfile?.fullName}...`, 'success');
        }}
        onMessage={() => {
          setIsProfileOpen(false);
          navigate('/broker/messages');
        }}
      />
    </div>
  );
};
