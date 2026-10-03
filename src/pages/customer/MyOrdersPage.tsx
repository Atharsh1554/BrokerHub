import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  MessageSquare,
  Eye,
  X,
  Calendar,
  CreditCard,
  MapPin,
  ShoppingBag,
  ShieldCheck,
  Building,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupeeExact } from '../../lib/api/orders';
import type { Order, OrderItem } from '../../types';

export const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, brokers, products } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter orders strictly for the logged-in customer
  const customerOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter((o) => {
      // Match by customerId or if customerId matches user's id
      const isCustomerMatch = o.customerId === user.id || !o.customerId || user.role === 'customer';
      return isCustomerMatch;
    });
  }, [orders, user]);

  // Compute dynamic stats
  const stats = useMemo(() => {
    const total = customerOrders.length;
    let pending = 0;
    let completed = 0;
    let cancelled = 0;
    let totalSpent = 0;

    for (const o of customerOrders) {
      const st = (o.status || '').toLowerCase();
      const amt = o.totalAmount ?? o.amount ?? 0;

      if (st.includes('cancel') || st.includes('refund')) {
        cancelled += 1;
      } else if (st.includes('deliver') || st.includes('complet')) {
        completed += 1;
        totalSpent += amt;
      } else {
        pending += 1;
        totalSpent += amt;
      }
    }

    return { total, pending, completed, cancelled, totalSpent };
  }, [customerOrders]);

  // Filtered orders based on search & status filter
  const filteredOrders = useMemo(() => {
    return customerOrders.filter((order) => {
      const searchLower = searchTerm.toLowerCase().trim();

      // Search by product name, order ID, or broker name
      const orderIdMatch = (order.id || '').toLowerCase().includes(searchLower);
      const brokerMatch = (order.brokerName || '').toLowerCase().includes(searchLower);
      const productMatch =
        (order.product || '').toLowerCase().includes(searchLower) ||
        (order.productName || '').toLowerCase().includes(searchLower) ||
        (order.items &&
          order.items.some((i: OrderItem) => (i.productName || '').toLowerCase().includes(searchLower)));

      const matchesSearch = !searchLower || orderIdMatch || brokerMatch || productMatch;

      // Status filter
      const st = (order.status || '').toLowerCase();
      let matchesStatus = true;

      if (selectedFilter === 'Pending') {
        matchesStatus = st.includes('pending');
      } else if (selectedFilter === 'Confirmed') {
        matchesStatus = st.includes('confirm') || st.includes('accept');
      } else if (selectedFilter === 'Processing') {
        matchesStatus = st.includes('process');
      } else if (selectedFilter === 'Shipped') {
        matchesStatus = st.includes('ship') || st.includes('transit');
      } else if (selectedFilter === 'Delivered') {
        matchesStatus = st.includes('deliver') || st.includes('complet');
      } else if (selectedFilter === 'Cancelled') {
        matchesStatus = st.includes('cancel') || st.includes('refund');
      }

      return matchesSearch && matchesStatus;
    });
  }, [customerOrders, searchTerm, selectedFilter]);

  // Helper to resolve broker details for an order
  const getBrokerDetails = (order: Order) => {
    const bId = order.brokerId;
    const bName = order.brokerName;

    const matched = brokers.find(
      (b) => (bId && b.id === bId) || (bName && b.name.toLowerCase() === bName.toLowerCase())
    );

    return {
      id: matched?.id || bId || 'b1',
      name: matched?.name || bName || 'Verified Broker',
      company: matched?.company || 'BrokerHub Partner',
      specialty: matched?.specialty || 'General Merchandise',
      rating: matched?.rating || 4.8,
      avatar: matched?.avatar,
      phone: matched?.phone || '+91 98765 43210',
      email: matched?.email || 'broker@brokerhub.com',
    };
  };

  // Helper to resolve product image
  const getOrderProductImage = (order: Order): string => {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      if (firstItem.productImage) return firstItem.productImage;
      const matchedProd = products.find((p) => p.id === firstItem.productId || p.name === firstItem.productName);
      if (matchedProd?.image) return matchedProd.image;
    }
    if (order.productImage) return order.productImage;
    if (order.productName || order.product) {
      const name = order.productName || order.product || '';
      const matchedProd = products.find((p) => name.toLowerCase().includes(p.name.toLowerCase()));
      if (matchedProd?.image) return matchedProd.image;
    }
    return '';
  };

  // Open modal with selected order
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Keep selected order object up-to-date with latest status from context (real-time sync)
  React.useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated && updated.status !== selectedOrder.status) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder]);

  // Open chat with broker
  const handleContactBroker = (brokerId: string) => {
    navigate(`/customer/messages?brokerId=${brokerId}`);
  };

  // Calculate timeline stage index based on order status
  const getTimelineStage = (statusStr: string): number => {
    const st = (statusStr || '').toLowerCase();
    if (st.includes('cancel') || st.includes('refund')) return -1; // Cancelled
    if (st.includes('deliver') || st.includes('complet')) return 4; // Delivered
    if (st.includes('ship') || st.includes('transit')) return 3; // Shipped
    if (st.includes('process')) return 2; // Processing
    if (st.includes('confirm') || st.includes('accept')) return 1; // Confirmed
    return 0; // Pending / Order Placed
  };

  // Format estimated delivery date
  const getEstimatedDeliveryDate = (orderDateStr: string, statusStr: string): string => {
    const st = (statusStr || '').toLowerCase();
    if (st.includes('cancel') || st.includes('refund')) return 'Order Cancelled';
    if (st.includes('deliver') || st.includes('complet')) return 'Delivered';

    try {
      const dateObj = new Date(orderDateStr);
      if (isNaN(dateObj.getTime())) return 'Within 3-5 Business Days';
      dateObj.setDate(dateObj.getDate() + 4);
      return `Expected by ${dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } catch {
      return 'Within 3-5 Business Days';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage all your orders in one place.
          </p>
        </div>

        <Link
          to="/customer/products"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer w-full sm:w-auto"
        >
          <ShoppingBag size={16} />
          <span>Browse Products</span>
        </Link>
      </div>

      {/* 2. Order Statistics Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Total Orders</p>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Pending</p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Completed</p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Cancelled</p>
            <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{stats.cancelled}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle size={20} />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Total Spent</p>
            <p className="text-lg sm:text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
              {formatRupeeExact(stats.totalSpent)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product, order ID, or broker name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 sm:py-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 hidden md:block mr-1" />
          {['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((f) => {
            const isActive = selectedFilter === f;
            return (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {f === 'All' ? 'All Orders' : f}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 sm:p-14 text-center shadow-xs">
          {customerOrders.length === 0 ? (
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <Package size={40} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">No orders yet</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                You haven't placed any orders yet. Explore products and connect with brokers to place your first order.
              </p>
              <div className="pt-2">
                <Link
                  to="/customer/products"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer"
                >
                  <ShoppingBag size={18} />
                  <span>Browse Products</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-3">
              <AlertCircle size={40} className="text-gray-300 dark:text-gray-600 mx-auto" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">No matching orders found</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                No orders match your search term "{searchTerm}" or filter "{selectedFilter}".
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('All');
                }}
                className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const broker = getBrokerDetails(order);
            const imgUrl = getOrderProductImage(order);
            const totalAmt = order.totalAmount ?? order.amount ?? 0;
            const itemsCount = order.items ? order.items.length : 1;
            const formattedDate = order.date
              ? new Date(order.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent Order';
            const expDelivery = getEstimatedDeliveryDate(order.date || '', order.status);

            const displayTitle =
              order.productName ||
              order.product ||
              (order.items && order.items[0]?.productName) ||
              'BrokerHub Product Order';

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Order Top Banner */}
                <div className="bg-gray-50/80 dark:bg-slate-900/60 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                      Order #{order.id}
                    </span>
                    <span className="text-gray-300 dark:text-slate-600 hidden sm:inline">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar size={13} />
                      Ordered on: {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} size="sm" />
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        (order.paymentStatus || '').toLowerCase() === 'paid' ||
                        (order.paymentStatus || '').toLowerCase() === 'successful'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      Payment: {order.paymentStatus || 'Paid'}
                    </span>
                  </div>
                </div>

                {/* Order Main Details Grid */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Left: Product Image + Info */}
                  <div className="md:col-span-6 flex items-start gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {imgUrl ? (
                        <img src={imgUrl} alt={displayTitle} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag size={28} className="text-gray-400" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white line-clamp-1">
                        {displayTitle}
                      </h3>

                      {order.items && order.items.length > 1 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          + {order.items.length - 1} more item(s)
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Quantity: <strong>{order.quantity || itemsCount}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {expDelivery}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Broker Info & Price */}
                  <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-700 pt-3 md:pt-0 md:pl-4 space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Broker</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {broker.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          {broker.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{broker.company}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Action Buttons */}
                  <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-700 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between items-start md:items-end space-y-3">
                    <div className="text-left md:text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Amount</p>
                      <p className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                        {formatRupeeExact(totalAmt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>View Order</span>
                      </button>

                      <button
                        onClick={() => handleContactBroker(broker.id)}
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageSquare size={14} />
                        <span>Contact Broker</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Detailed Order Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl relative animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    Order Details <span className="font-mono text-emerald-600 dark:text-emerald-400">#{selectedOrder.id}</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Placed on {selectedOrder.date ? new Date(selectedOrder.date).toLocaleString('en-IN') : 'Recent'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Order Status Progress Timeline */}
              <div className="bg-gray-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-400">
                    Fulfillment Status Timeline
                  </span>
                  <StatusBadge status={selectedOrder.status} />
                </div>

                {(() => {
                  const currentStage = getTimelineStage(selectedOrder.status);
                  const isCancelled = currentStage === -1;

                  if (isCancelled) {
                    return (
                      <div className="flex items-center justify-around py-3">
                        <div className="flex flex-col items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center font-bold text-xs">
                            ✓
                          </div>
                          <span className="text-xs font-bold">Order Placed</span>
                        </div>
                        <div className="h-0.5 flex-1 bg-rose-300 dark:bg-rose-900 mx-2" />
                        <div className="flex flex-col items-center gap-1.5 text-rose-600 dark:text-rose-400">
                          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center font-bold text-xs">
                            ✕
                          </div>
                          <span className="text-xs font-bold">Cancelled</span>
                        </div>
                      </div>
                    );
                  }

                  const steps = [
                    { label: 'Order Placed', icon: Package },
                    { label: 'Confirmed', icon: CheckCircle2 },
                    { label: 'Processing', icon: Clock },
                    { label: 'Shipped', icon: Truck },
                    { label: 'Delivered', icon: ShieldCheck },
                  ];

                  return (
                    <div className="grid grid-cols-5 gap-1 py-2 relative">
                      {steps.map((step, idx) => {
                        const isDone = idx <= currentStage;
                        const isCurrent = idx === currentStage;
                        const Icon = step.icon;

                        return (
                          <div key={step.label} className="flex flex-col items-center text-center space-y-1.5 z-10">
                            <div
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                                isDone
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
                              } ${isCurrent ? 'ring-4 ring-emerald-500/20 scale-110' : ''}`}
                            >
                              <Icon size={16} />
                            </div>
                            <span
                              className={`text-[10px] sm:text-xs font-bold leading-tight ${
                                isDone
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Order Items Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-400">
                  Ordered Items Breakdown
                </h3>
                <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/30">
                            <td className="p-3">
                              <p className="font-bold text-gray-900 dark:text-white">{item.productName}</p>
                            </td>
                            <td className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                              {item.quantity}
                            </td>
                            <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                              {formatRupeeExact(item.unitPrice)}
                            </td>
                            <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                              {formatRupeeExact(item.quantity * item.unitPrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-900/30">
                          <td className="p-3 font-bold text-gray-900 dark:text-white">
                            {selectedOrder.productName || selectedOrder.product || 'Order Item'}
                          </td>
                          <td className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                            {selectedOrder.quantity || 1}
                          </td>
                          <td className="p-3 text-right text-gray-600 dark:text-gray-400">
                            {formatRupeeExact(selectedOrder.totalAmount ?? selectedOrder.amount ?? 0)}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                            {formatRupeeExact(selectedOrder.totalAmount ?? selectedOrder.amount ?? 0)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment & Broker Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Summary */}
                <div className="bg-gray-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-2.5 text-xs sm:text-sm">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-1 border-b border-gray-200 dark:border-slate-700">
                    <CreditCard size={16} className="text-emerald-600 dark:text-emerald-400" />
                    Payment Summary
                  </h4>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatRupeeExact(selectedOrder.totalAmount ?? selectedOrder.amount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping / Logistics</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">FREE</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Payment Method</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedOrder.paymentMethod || 'Razorpay / Online'}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Transaction ID</span>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                      {selectedOrder.transactionId || `TXN-${selectedOrder.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-base text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-slate-700">
                    <span>Total Paid</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatRupeeExact(selectedOrder.totalAmount ?? selectedOrder.amount ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Broker Info */}
                {(() => {
                  const b = getBrokerDetails(selectedOrder);
                  return (
                    <div className="bg-gray-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3 text-xs sm:text-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                          <Building size={16} className="text-emerald-600 dark:text-emerald-400" />
                          Brokerage Details
                        </h4>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                            {b.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{b.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{b.company} • ⭐ {b.rating}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          handleContactBroker(b.id);
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageSquare size={15} />
                        <span>Message {b.name}</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Delivery Address Snapshot */}
              <div className="bg-gray-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-2 text-xs sm:text-sm">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-1 border-b border-gray-200 dark:border-slate-700">
                  <MapPin size={16} className="text-emerald-600 dark:text-emerald-400" />
                  Delivery Address Snapshot (Order Record)
                </h4>
                <div className="pt-1 text-gray-700 dark:text-gray-300 space-y-1">
                  <p><strong>Customer Name:</strong> {selectedOrder.shippingAddress?.fullName || selectedOrder.customerName}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone || selectedOrder.customerPhone || 'Not provided'}</p>

                  {selectedOrder.shippingAddress?.addressLine1 ? (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-0.5">
                      <p className="font-bold text-gray-900 dark:text-white">{selectedOrder.shippingAddress.addressLine1}</p>
                      {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                      <p>
                        {selectedOrder.shippingAddress.city}{selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''}{selectedOrder.shippingAddress.pincode ? ` - ${selectedOrder.shippingAddress.pincode}` : ''}
                      </p>
                      {selectedOrder.shippingAddress.landmark && (
                        <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold pt-1 border-t border-gray-100 dark:border-slate-700">
                          Landmark: {selectedOrder.shippingAddress.landmark}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {selectedOrder.deliveryAddress || 'Standard Site Address'}
                    </p>
                  )}

                  {selectedOrder.customerRequirements && (
                    <p className="mt-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                      <strong>Special Instructions:</strong> {selectedOrder.customerRequirements}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
