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
  Search,
  ExternalLink,
  Clock,
  Sparkles,
  Database,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { CustomerProfileModal } from '../../components/broker/CustomerProfileModal';
import type { BrokerNotification, BrokerNotificationType, NotificationStatus, CustomerProfile } from '../../types';

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
    getCustomerProfile,
    createNotification,
  } = useNotifications();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = notif.customer_name?.toLowerCase().includes(q);
        const matchesTitle = notif.title?.toLowerCase().includes(q);
        const matchesDesc = notif.description?.toLowerCase().includes(q);
        const matchesOrder = notif.related_order_id?.toLowerCase().includes(q);
        return matchesName || matchesTitle || matchesDesc || matchesOrder;
      }
      return true;
    });
  }, [notifications, activeCategory, statusFilter, searchQuery]);

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

  const handleTestNotification = async () => {
    await createNotification({
      broker_id: 'broker_alex',
      customer_id: 'cust-sarah',
      customer_name: 'Sarah Jenkins',
      customer_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      type: 'call_request',
      title: 'Urgent Callback Requested',
      description: 'Customer requested a callback regarding immediate bulk quote for Industrial Valves.',
      is_read: false,
      status: 'pending',
      metadata: {
        phone: '+1 (555) 234-5678',
        priority: 'High',
        requestedTime: 'Next 10 mins'
      }
    });
    showToast('Simulation: New customer call request received!', 'success');
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
    { id: 'call_request', label: 'Calls', icon: <Phone className="w-4 h-4" /> },
    { id: 'message', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'order', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'meeting', label: 'Meetings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'profile_request', label: 'Profile Requests', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'general', label: 'System', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header section - Clean Light Theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-50 text-primary">
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

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestNotification}
            className="flex items-center gap-1.5"
            title="Simulate an incoming customer request"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulate Request</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-primary" />
              <span>Mark all read ({unreadCount})</span>
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
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-gray-border'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, title, order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 rounded-lg border border-gray-border text-slate-800 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 text-sm bg-slate-50 border border-gray-border rounded-lg text-slate-800 focus:bg-white focus:border-primary outline-none transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Declined</option>
            <option value="completed">Completed / Handled</option>
          </select>
        </div>
      </div>

      {/* Notification Cards List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-border p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-primary-50 text-primary mx-auto flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No notifications found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' || activeCategory !== 'all'
                ? 'No activities match your current filter criteria. Try clearing search or switching tabs.'
                : 'You are all caught up! When customers request calls, send messages, or place orders, they will appear here.'}
            </p>
            {(searchQuery || statusFilter !== 'all' || activeCategory !== 'all') && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
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
                className={`relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden hover:shadow-md ${
                  isUnread
                    ? 'border-l-4 border-l-primary border-t-emerald-200/60 border-r-emerald-200/60 border-b-emerald-200/60 bg-emerald-50/20 shadow-xs'
                    : 'border-gray-border'
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
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-xs border border-gray-border">
                        {getCategoryIcon(notif.type)}
                      </div>
                    </div>

                    {/* Notification content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <button
                          onClick={() => handleOpenProfile(notif.customer_id)}
                          className="font-bold text-sm text-slate-900 hover:text-primary transition-colors cursor-pointer"
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
                        <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto md:ml-0">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(notif.created_at)}
                        </span>
                      </div>

                      <h4 className="font-semibold text-base text-slate-900 mb-1">
                        {notif.title}
                      </h4>

                      {notif.description && (
                        <p className="text-sm text-slate-600 leading-relaxed mb-3">
                          {notif.description}
                        </p>
                      )}

                      {/* Metadata previews */}
                      {notif.metadata && (
                        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                          {notif.metadata.phone && (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono border border-slate-200">
                              📞 {notif.metadata.phone}
                            </span>
                          )}
                          {notif.metadata.requestedTime && (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                              🕒 {notif.metadata.requestedTime}
                            </span>
                          )}
                          {notif.metadata.proposedDate && (
                            <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                              📅 {notif.metadata.proposedDate}
                            </span>
                          )}
                          {notif.related_order_id && (
                            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono font-medium">
                              🛒 Order #{notif.related_order_id}
                            </span>
                          )}
                          {notif.metadata.company && (
                            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                              🏢 {notif.metadata.company}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap md:flex-col items-center md:items-end justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-border">
                    {/* Status badge if already handled */}
                    {notif.status !== 'pending' && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                          notif.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : notif.status === 'rejected'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
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
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
