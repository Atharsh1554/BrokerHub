import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  DollarSign,
  Activity,
  X,
} from 'lucide-react';
import { getAdminKpis, getAdminOrders, getAdminBrokers } from '../../lib/api/admin';
import { getProducts } from '../../lib/api/products';
import { useApp } from '../../context/AppContext';
import type { AdminKpis, Order, Broker, Product } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { formatRupeeExact, updateOrderStatusInDB } from '../../lib/api/orders';

export const AdminDashboard: React.FC = () => {
  const { orders: appOrders } = useApp();
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedBrokerModal, setSelectedBrokerModal] = useState<Broker | null>(null);
  const { theme } = useAdminTheme();

  const isLight = theme === 'light';

  const loadDashboardData = async () => {
    try {
      const [kpiData, ordersData, brokersData, productsData] = await Promise.all([
        getAdminKpis(),
        getAdminOrders(),
        getAdminBrokers(),
        getProducts(),
      ]);
      setKpis(kpiData);

      const map = new Map<string, Order>();
      (ordersData || []).forEach((o) => map.set(o.id, o));
      (appOrders || []).forEach((o) => map.set(o.id, o));
      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
      );

      setOrders(combined);
      setBrokers(brokersData);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (appOrders && appOrders.length > 0) {
      setOrders((prev) => {
        const map = new Map<string, Order>();
        prev.forEach((o) => map.set(o.id, o));
        appOrders.forEach((o) => map.set(o.id, o));
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        );
      });
    }
  }, [appOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // 1. Calculate Time-Filtered Platform Revenue Metrics
  const platformRevenueMetrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRev = 0;
    let todayRev = 0;
    let weekRev = 0;
    let monthRev = 0;
    let totalCommission = 0;
    let totalBrokerPayable = 0;
    let pendingSettlements = 0;
    let completedSettlements = 0;

    let successfulCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let refundedCount = 0;

    for (const order of orders) {
      const o = order as any;
      const statusLower = (order.status || '').toLowerCase();

      if (statusLower.includes('pending')) {
        pendingCount++;
      } else if (statusLower.includes('cancel')) {
        cancelledCount++;
      } else if (statusLower.includes('refund')) {
        refundedCount++;
      } else {
        successfulCount++;
      }

      if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('refund')) {
        continue;
      }

      const val = order.totalAmount ?? order.amount ?? 0;
      totalRev += val;
      totalCommission += (o.platform_commission ?? 0);
      totalBrokerPayable += (o.broker_amount ?? val);

      if ((o.settlement_status || 'Pending') === 'Settled') completedSettlements++;
      else pendingSettlements++;

      const orderDateStr = order.createdAt || order.date;
      if (orderDateStr) {
        const orderDate = new Date(orderDateStr);
        if (!isNaN(orderDate.getTime())) {
          if (orderDateStr.split('T')[0] === todayStr) todayRev += val;
          if (orderDate >= weekAgo) weekRev += val;
          if (orderDate >= startOfMonth) monthRev += val;
        }
      }
    }

    return {
      totalRevenue: totalRev,
      todayRevenue: todayRev,
      weekRevenue: weekRev,
      monthRevenue: monthRev,
      totalOrders: orders.length,
      successfulOrders: successfulCount,
      pendingOrders: pendingCount,
      cancelledOrders: cancelledCount,
      refundedOrders: refundedCount,
      totalCommission,
      totalBrokerPayable,
      pendingSettlements,
      completedSettlements,
    };
  }, [orders]);

  // 2. Calculate Broker Performance Table
  const brokerPerformanceList = useMemo(() => {
    const map: Record<
      string,
      {
        brokerId: string;
        name: string;
        company: string;
        productsCount: number;
        ordersCount: number;
        unitsSold: number;
        revenue: number;
        pendingOrders: number;
        completedOrders: number;
      }
    > = {};

    for (const b of brokers) {
      const bProds = products.filter((p) => p.brokerId === b.id);
      map[b.id] = {
        brokerId: b.id,
        name: b.name,
        company: b.company || b.specialty || 'Broker Hub Network',
        productsCount: bProds.length,
        ordersCount: 0,
        unitsSold: 0,
        revenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
      };
    }

    for (const order of orders) {
      const statusLower = (order.status || '').toLowerCase();
      const bId = order.brokerId;
      if (!bId || !map[bId]) continue;

      map[bId].ordersCount += 1;

      if (statusLower.includes('pending')) {
        map[bId].pendingOrders += 1;
      } else if (!statusLower.includes('cancel') && !statusLower.includes('refund')) {
        map[bId].completedOrders += 1;
        const val = order.totalAmount ?? order.amount ?? 0;
        map[bId].revenue += val;

        if (order.items) {
          map[bId].unitsSold += order.items.reduce((s, i) => s + (i.quantity || 1), 0);
        } else {
          map[bId].unitsSold += order.quantity || 1;
        }
      }
    }

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [brokers, orders, products]);

  // 3. Calculate Product Performance Table
  const productPerformanceList = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        brokerName: string;
        price: number;
        unitsSold: number;
        revenue: number;
        ordersCount: number;
      }
    > = {};

    for (const p of products) {
      const b = brokers.find((br) => br.id === p.brokerId);
      map[p.name.toLowerCase()] = {
        id: p.id,
        name: p.name,
        brokerName: b?.name || p.brokerName || 'Verified Broker',
        price: p.price,
        unitsSold: 0,
        revenue: 0,
        ordersCount: 0,
      };
    }

    for (const order of orders) {
      const statusLower = (order.status || '').toLowerCase();
      if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('refund')) continue;

      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const key = item.productName.toLowerCase();
          if (!map[key]) {
            map[key] = {
              id: item.productId || key,
              name: item.productName,
              brokerName: order.brokerName || 'Verified Broker',
              price: item.unitPrice,
              unitsSold: 0,
              revenue: 0,
              ordersCount: 0,
            };
          }

          const qty = item.quantity || 1;
          map[key].unitsSold += qty;
          map[key].revenue += item.unitPrice * qty;
          map[key].ordersCount += 1;
        }
      }
    }

    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [products, orders, brokers]);

  // Update order status in Admin view
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    await updateOrderStatusInDB(orderId, newStatus);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o)));
    if (selectedOrder) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
    }
  };

  if (loading || !kpis) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Fetching real-time platform metrics...
        </p>
      </div>
    );
  }

  const revenueCards = [
    { label: "Today's Revenue", value: formatRupeeExact(platformRevenueMetrics.todayRevenue), icon: DollarSign, color: 'text-emerald-500' },
    { label: "This Week's Revenue", value: formatRupeeExact(platformRevenueMetrics.weekRevenue), icon: TrendingUp, color: 'text-teal-500' },
    { label: "This Month's Revenue", value: formatRupeeExact(platformRevenueMetrics.monthRevenue), icon: Activity, color: 'text-indigo-500' },
    { label: 'Total Payment Volume', value: formatRupeeExact(platformRevenueMetrics.totalRevenue), icon: ShieldCheck, color: 'text-emerald-600' },
    { label: 'Total Platform Commission', value: formatRupeeExact(platformRevenueMetrics.totalCommission), icon: DollarSign, color: 'text-amber-500' },
    { label: 'Total Broker Payable', value: formatRupeeExact(platformRevenueMetrics.totalBrokerPayable), icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Pending Settlements', value: platformRevenueMetrics.pendingSettlements, icon: Clock, color: 'text-amber-500' },
    { label: 'Completed Settlements', value: platformRevenueMetrics.completedSettlements, icon: CheckCircle2, color: 'text-teal-500' },
    { label: 'Total Orders', value: platformRevenueMetrics.totalOrders, icon: ShoppingBag, color: 'text-sky-500' },
    { label: 'Cancelled / Refunded', value: platformRevenueMetrics.cancelledOrders + platformRevenueMetrics.refundedOrders, icon: XCircle, color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl relative overflow-hidden shadow-xl ${
          isLight
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-800 text-white border border-emerald-500/20'
            : 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 text-white'
        }`}
      >
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-300 tracking-wider uppercase">Live Real-Time Control Center</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">BROKER HUB Admin Control Center</h1>
          <p className="text-xs text-emerald-100/80">Monitoring platform revenue, broker performance, products, and customer orders.</p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
              isLight
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live DB</span>
          </button>
          <Link
            to="/admin/analytics"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 shadow-lg transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sales Analytics</span>
          </Link>
        </div>
      </div>

      {/* 💰 Platform Revenue & Order Metrics (8 Cards) */}
      <div>
        <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>Platform Revenue & Order Metrics</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {revenueCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {card.label}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-emerald-50 ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {card.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🏢 Broker Performance Table */}
      <div className={`p-6 rounded-3xl border space-y-4 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
          <div>
            <h3 className={`text-base font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Briefcase className="w-5 h-5 text-indigo-500" />
              <span>Broker Performance Breakdown</span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Revenue, order count, and product listings per registered broker
            </p>
          </div>
          <Link to="/admin/brokers" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1">
            <span>Manage Brokers</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b font-semibold uppercase tracking-wider ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/40 border-slate-800 text-slate-400'}`}>
                <th className="py-3 px-4">Broker Name</th>
                <th className="py-3 px-4">Company / Brand</th>
                <th className="py-3 px-4 text-center">Listings</th>
                <th className="py-3 px-4 text-center">Total Orders</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brokerPerformanceList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No broker performance data recorded yet.
                  </td>
                </tr>
              ) : (
                brokerPerformanceList.map((broker) => (
                  <tr key={broker.brokerId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{broker.name}</td>
                    <td className="py-3 px-4 text-slate-600">{broker.company}</td>
                    <td className="py-3 px-4 text-center font-bold">{broker.productsCount}</td>
                    <td className="py-3 px-4 text-center font-bold">{broker.ordersCount}</td>
                    <td className="py-3 px-4 text-center font-bold">{broker.unitsSold}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600">{formatRupeeExact(broker.revenue)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedBrokerModal(brokers.find((b) => b.id === broker.brokerId) || null)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] cursor-pointer"
                      >
                        View Broker
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📦 Product Performance & Recent Platform Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Performance Table */}
        <div className={`p-6 rounded-3xl border space-y-4 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <h3 className={`text-base font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Package className="w-5 h-5 text-emerald-500" />
              <span>Top Performing Products</span>
            </h3>
            <Link to="/admin/products" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">View All</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b font-semibold uppercase ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/40 border-slate-800 text-slate-400'}`}>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Broker</th>
                  <th className="py-2.5 px-3 text-center">Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productPerformanceList.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400">No sales recorded yet.</td></tr>
                ) : (
                  productPerformanceList.map((prod) => (
                    <tr key={prod.name} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-40">{prod.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-32">{prod.brokerName}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{prod.unitsSold}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600">{formatRupeeExact(prod.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Platform Orders Table */}
        <div className={`p-6 rounded-3xl border space-y-4 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <h3 className={`text-base font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <ShoppingBag className="w-5 h-5 text-sky-500" />
              <span>Recent Customer Orders</span>
            </h3>
            <Link to="/admin/orders" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">All Orders</Link>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No platform orders placed yet.</p>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs cursor-pointer hover:shadow-md transition-all ${
                    isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div>
                    <p className="font-mono font-bold text-primary">{order.id}</p>
                    <p className="text-[11px] text-slate-600 font-semibold">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-emerald-600">{formatRupeeExact(order.totalAmount || order.amount || 0)}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 🔍 Order Details Modal for Admin */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Platform Order Details: <span className="font-mono text-emerald-600">{selectedOrder.id}</span>
                </h3>
                <p className="text-xs text-slate-500">Placed on {selectedOrder.date || selectedOrder.createdAt}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Customer</p>
                <p className="font-bold text-slate-900">{selectedOrder.customerName}</p>
                {selectedOrder.customerEmail && <p className="text-slate-600">{selectedOrder.customerEmail}</p>}
                {selectedOrder.customerPhone && <p className="text-slate-600">{selectedOrder.customerPhone}</p>}
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Broker</p>
                <p className="font-bold text-indigo-700">{selectedOrder.brokerName || 'Verified Broker'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Line Items</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((i, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-slate-900">{i.productName}</td>
                          <td className="py-2 px-3 text-center font-bold">{i.quantity}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-emerald-600">₹{(i.unitPrice * i.quantity).toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2 px-3 font-medium text-slate-900">{selectedOrder.product || 'Order Item'}</td>
                        <td className="py-2 px-3 text-center font-bold">{selectedOrder.quantity || 1}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-emerald-600">₹{(selectedOrder.totalAmount || selectedOrder.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method & Txn</p>
                <p className="font-bold text-slate-900">{selectedOrder.paymentMethod || 'Online Payment'}</p>
                <p className="font-mono text-slate-500">{selectedOrder.transactionId || `TXN-${selectedOrder.id}`}</p>
              </div>

              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Modify Order Status</p>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="Pending Broker Approval">Pending Broker Approval</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 Broker Details Modal for Admin */}
      {selectedBrokerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Broker Profile: {selectedBrokerModal.name}</h3>
              <button onClick={() => setSelectedBrokerModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Company:</strong> {selectedBrokerModal.company || 'Broker Network'}</p>
              <p><strong>Specialty:</strong> {selectedBrokerModal.specialty || 'General Brokerage'}</p>
              <p><strong>Status:</strong> {selectedBrokerModal.status}</p>
              <p><strong>Rating:</strong> ⭐ {selectedBrokerModal.rating || 5.0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
