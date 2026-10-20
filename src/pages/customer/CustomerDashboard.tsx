import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Package,
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { products, brokers, orders, refreshProducts } = useApp();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const initials = getUserInitials(displayName);

  // Sync products on mount and whenever deletions/updates occur
  useEffect(() => {
    refreshProducts();

    const handleUpdate = () => {
      refreshProducts();
    };

    window.addEventListener('brokerhub_products_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('brokerhub_products_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Guaranteed exclusion of deleted & inactive products in Customer Dashboard
  const activeProducts = useMemo(() => {
    let globalDeleted: string[] = [];
    try {
      globalDeleted = JSON.parse(localStorage.getItem('brokerhub_deleted_products') || '[]');
    } catch {}
    return products.filter((p) => !globalDeleted.includes(p.id) && p.isActive !== false);
  }, [products]);

  // Helper to find broker info
  const getBrokerInfo = (brokerId?: string, fallbackName?: string) => {
    if (brokerId) {
      const found = brokers.find((b) => b.id === brokerId);
      if (found) return found;
    }
    return { id: brokerId || '', name: fallbackName || 'Verified Broker', company: 'MYSTRIO Partner' };
  };

  // 1. Calculate Top Sale Product dynamically from actual orders data
  const topSaleInfo = useMemo(() => {
    if (!orders || orders.length === 0 || !activeProducts || activeProducts.length === 0) return null;

    const salesMap: Record<string, number> = {};

    for (const order of orders) {
      const statusLower = (order.status || '').toLowerCase();
      // Skip cancelled or failed orders
      if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('refund')) {
        continue;
      }

      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const qty = item.quantity || 1;
          const matched = activeProducts.find(
            (p) => p.name.toLowerCase() === (item.productName || '').toLowerCase()
          );
          if (matched) {
            salesMap[matched.id] = (salesMap[matched.id] || 0) + qty;
          }
        }
      } else if (order.productName || order.product) {
        const pName = order.productName || order.product || '';
        const matched = activeProducts.find(
          (p) =>
            pName.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(pName.toLowerCase())
        );
        if (matched) {
          const qty = order.quantity || 1;
          salesMap[matched.id] = (salesMap[matched.id] || 0) + qty;
        }
      }
    }

    let topId: string | null = null;
    let maxQty = 0;

    for (const [pId, qty] of Object.entries(salesMap)) {
      if (qty > maxQty) {
        maxQty = qty;
        topId = pId;
      }
    }

    if (!topId || maxQty === 0) return null;

    const topProduct = activeProducts.find((p) => p.id === topId);
    if (!topProduct) return null;

    return {
      product: topProduct,
      totalSold: maxQty,
    };
  }, [orders, activeProducts]);

  // 2. Filter products based on search term
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return activeProducts.filter((p) => {
      const broker = getBrokerInfo(p.brokerId, p.brokerName);
      const nameMatch = p.name.toLowerCase().includes(q);
      const categoryMatch = (p.category || '').toLowerCase().includes(q);
      const brokerMatch = (broker.name || '').toLowerCase().includes(q) || (p.brokerName || '').toLowerCase().includes(q) || (broker.company || '').toLowerCase().includes(q);
      const descMatch = (p.description || '').toLowerCase().includes(q);
      return nameMatch || categoryMatch || brokerMatch || descMatch;
    });
  }, [searchQuery, activeProducts, brokers]);

  const latestProducts = activeProducts.slice(0, 8);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white text-base sm:text-xl font-bold shadow-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white truncate">Welcome back, {displayName}</h1>
            <p className="text-xs sm:text-sm text-gray-text dark:text-slate-400 truncate">Here's what's happening with your broker connections</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-border dark:border-slate-700 p-4 shadow-sm">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, category, broker, or keywords..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-text-primary dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-gray-200 dark:bg-slate-700 dark:text-slate-400 px-2 py-1 rounded-md"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search Results view when user is actively searching */}
      {searchQuery.trim().length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary dark:text-white">
              Search Results for "{searchQuery}"
            </h2>
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'} found
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-border dark:border-slate-700 p-12 text-center">
              <ShoppingBag size={48} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-text-primary dark:text-white mb-1">No products found.</h3>
              <p className="text-xs text-gray-label dark:text-slate-400">Try searching for another product name, category, or broker.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3.5">
              {searchResults.map((product) => {
                const broker = getBrokerInfo(product.brokerId, product.brokerName);
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/customer/products/${product.id}`)}
                    className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-gray-border dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500 transition-all duration-200 group cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative aspect-square sm:h-36 w-full bg-white dark:bg-slate-900 p-2 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-slate-700">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ShoppingBag size={28} className="text-gray-300 dark:text-slate-600 group-hover:scale-110 transition-transform duration-300" />
                      )}
                    </div>
                    <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider truncate mb-0.5">{product.category}</p>
                        <h3 className="text-xs sm:text-sm font-semibold text-text-primary dark:text-slate-200 line-clamp-2 leading-tight group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors min-h-[1.8rem] sm:min-h-[2.2rem]">{product.name}</h3>
                        <div className="flex items-baseline justify-between gap-1 pt-1">
                          <p className="text-xs sm:text-sm font-extrabold text-primary dark:text-emerald-400">₹{product.price.toLocaleString('en-IN')}</p>
                          <StatusBadge status={product.status} size="sm" />
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400">
                        <span className="truncate max-w-[70%]">
                          By <strong className="text-gray-700 dark:text-slate-200">{broker.name}</strong>
                        </span>
                        <span className="text-primary dark:text-emerald-400 font-bold">View</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 🔥 Top Sale Product Section */}
          <div className="bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-800 dark:to-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <TrendingUp size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary dark:text-white tracking-tight">Top Sale Product</h2>
                <p className="text-xs text-gray-text dark:text-slate-400">Highest selling product based on verified customer orders</p>
              </div>
            </div>

            {topSaleInfo ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/80 dark:border-slate-700 p-5 shadow-xs flex flex-col md:flex-row items-center md:items-stretch gap-6">
                <div className="w-full md:w-56 h-48 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 dark:border-slate-700">
                  {topSaleInfo.product.image ? (
                    <img
                      src={topSaleInfo.product.image}
                      alt={topSaleInfo.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag size={48} className="text-gray-300 dark:text-slate-600" />
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-4 text-center md:text-left w-full">
                  <div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                      <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {topSaleInfo.product.category || 'General'}
                      </span>
                      <span className="bg-primary/10 dark:bg-emerald-900/30 text-primary dark:text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Package size={12} />
                        {topSaleInfo.totalSold} sold
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-text-primary dark:text-white mb-1">{topSaleInfo.product.name}</h3>

                    {topSaleInfo.product.description && (
                      <p className="text-xs text-gray-text dark:text-slate-300 line-clamp-2 mb-3 max-w-xl">
                        {topSaleInfo.product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <p className="text-2xl font-extrabold text-primary dark:text-emerald-400">
                        ₹{topSaleInfo.product.price.toLocaleString('en-IN')}
                      </p>
                      <span className="text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                        Broker: <strong className="text-gray-800 dark:text-white">{getBrokerInfo(topSaleInfo.product.brokerId, topSaleInfo.product.brokerName).name}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => navigate(`/customer/products/${topSaleInfo.product.id}`)}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors text-sm cursor-pointer"
                    >
                      <span>View Product</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-8 text-center">
                <p className="text-base font-semibold text-text-primary dark:text-white mb-1">Top Sale Product</p>
                <p className="text-sm text-gray-label dark:text-slate-400">No sales data available yet.</p>
              </div>
            )}
          </div>

          {/* Latest Products */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary dark:text-white">Latest Products</h2>
                <span className="bg-primary/10 dark:bg-emerald-900/30 text-primary dark:text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {activeProducts.length} listings
                </span>
              </div>
              <Link
                to="/customer/products"
                className="flex items-center gap-1 text-sm text-primary dark:text-emerald-400 font-medium hover:underline"
              >
                Browse All <ArrowRight size={14} />
              </Link>
            </div>

            {latestProducts.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-border dark:border-slate-700 p-8 text-center">
                <ShoppingBag size={36} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-gray-text dark:text-slate-400">No products yet. Check back when your brokers add listings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                {latestProducts.map((product) => {
                  const broker = getBrokerInfo(product.brokerId, product.brokerName);
                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/customer/products/${product.id}`)}
                      className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-gray-border dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500 transition-all duration-200 group relative cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-square sm:h-36 w-full bg-white dark:bg-slate-900 p-2 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-slate-700">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <ShoppingBag size={28} className="text-gray-300 dark:text-slate-600 group-hover:scale-110 transition-transform duration-300" />
                        )}
                      </div>
                      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                        <div>
                          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider truncate mb-0.5">{product.category}</p>
                          <h3 className="text-xs sm:text-sm font-semibold text-text-primary dark:text-slate-200 line-clamp-2 leading-tight group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors min-h-[1.8rem] sm:min-h-[2.2rem]">{product.name}</h3>
                          <div className="flex items-baseline justify-between gap-1 pt-1">
                            <p className="text-xs sm:text-sm font-extrabold text-primary dark:text-emerald-400">₹{product.price.toLocaleString('en-IN')}</p>
                            <StatusBadge status={product.status} size="sm" />
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400">
                          <span className="truncate max-w-[65%]">
                            By <strong className="text-gray-700 dark:text-slate-200">{broker.name}</strong>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customer/messages?brokerId=${broker.id}`);
                            }}
                            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold flex items-center gap-0.5 hover:underline shrink-0"
                          >
                            <MessageSquare size={11} />
                            Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Your Matched Brokers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Your Matched Brokers</h2>
              <Link to="/customer/my-brokers" className="text-sm text-primary dark:text-emerald-400 font-medium hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {brokers.slice(0, 3).map((broker) => (
                <div key={broker.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-border dark:border-slate-700 p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-teal-100 dark:from-emerald-900/50 dark:to-slate-700 flex items-center justify-center text-primary dark:text-emerald-300 font-bold">
                      {broker.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary dark:text-white">{broker.name}</h3>
                      <p className="text-xs text-gray-text dark:text-slate-400">{broker.specialty}</p>
                      <p className="text-xs text-gray-label dark:text-slate-500">{broker.company}</p>
                    </div>
                    <StatusBadge status={broker.status} size="sm" />
                  </div>
                  <div className="pt-3 border-t border-gray-border dark:border-slate-700">
                    <Link
                      to="/customer/messages"
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-primary dark:text-emerald-400 bg-primary/5 dark:bg-slate-700/60 hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <MessageCircle size={14} />
                      Send Message
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-border dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Recent Orders</h2>
              <Link to="/customer/my-orders" className="flex items-center gap-1 text-sm text-primary dark:text-emerald-400 font-medium hover:underline">
                View All Orders <ArrowRight size={14} />
              </Link>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-slate-500">
                <p className="text-sm">No recent order activity yet</p>
                <p className="text-xs text-gray-label dark:text-slate-500 mt-1">Your orders will appear here once placed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-start gap-3 pb-4 border-b border-gray-border dark:border-slate-700 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary dark:text-slate-200">
                        Order for <span className="font-semibold">{order.productName || order.product || 'product'}</span> — {order.status}
                      </p>
                      <p className="text-xs text-gray-label dark:text-slate-400 mt-0.5">₹{(order.totalAmount || (order as any).amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
