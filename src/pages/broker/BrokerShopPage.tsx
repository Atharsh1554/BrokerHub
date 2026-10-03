import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  User,
  Copy,
  Check,
  Share2,
  Package,
  Star,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Eye,
  Edit3,
  Plus,
  Building2,
  Phone,
  Mail,
  CheckCircle,
  QrCode,
  ChevronRight,
  ShoppingCart,
  Search,
  X,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';
import type { Product } from '../../types';

const formatINR = (amount: number) =>
  '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });


export const BrokerShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { brokerProducts, orders, brokers } = useApp();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'settings'>('products');
  const [shopSearchQuery, setShopSearchQuery] = useState('');

  // Find active broker record
  const currentBroker = brokers.find((b) => b.id === user?.id || b.id === 'b1');

  // Local overrides check
  let localOv: any = null;
  try {
    const raw = localStorage.getItem('brokerhub_broker_overrides');
    if (raw && user?.id) localOv = JSON.parse(raw)[user.id];
  } catch {}

  const displayName = resolveUserDisplayName(localOv?.name || user?.fullName || currentBroker?.name, localOv?.email || user?.email);
  const initials = getUserInitials(displayName);
  const brandName = localOv?.company || currentBroker?.company || 'MYTRIO';
  const displayEmail = localOv?.email || user?.email || currentBroker?.email || '';
  const displayPhone = localOv?.phone || user?.phone || currentBroker?.phone || '';
  const avatarUrl = localOv?.avatar || user?.avatar || currentBroker?.avatar;

  // Filter products belonging to this broker (use broker-isolated products)
  const myProducts: Product[] = brokerProducts;

  // Derive product type / specialty
  const productTypeCounts = myProducts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const dominantCategory =
    localOv?.specialty || currentBroker?.specialty || Object.entries(productTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Industrial Products';

  const aboutText = localOv?.description || currentBroker?.description || `Specialized commercial and industrial broker matching verified buyers with premier ${dominantCategory.toLowerCase()} products and manufacturers.`;

  // Search-filtered products for the shop product tab
  const searchFilteredProducts = useMemo(() => {
    const q = shopSearchQuery.toLowerCase().trim();
    if (!q) return myProducts;
    return myProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
    );
  }, [myProducts, shopSearchQuery]);

  // Shop URL — shareable link
  const shopUrl = `${window.location.origin}/shop/${user?.id || currentBroker?.id || 'b1'}`;

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount ?? o.amount ?? 0), 0);
  const totalOrders = orders.length;
  const avgRating = currentBroker?.rating ?? 4.9;
  const inStockCount = myProducts.filter((p) => p.status === 'In Stock').length;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
    } catch {
      const el = document.createElement('input');
      el.value = shopUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shopStats = [
    {
      label: 'Total Products',
      value: myProducts.length,
      icon: <Package size={18} className="text-primary" />,
      bg: 'bg-primary-50',
    },
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: <ShoppingBag size={18} className="text-violet-600" />,
      bg: 'bg-violet-50',
    },
    {
      label: 'Revenue',
      value: formatINR(totalRevenue),
      icon: <TrendingUp size={18} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      label: 'Avg Rating',
      value: avgRating.toFixed(1),
      icon: <Star size={18} className="text-amber-500" />,
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title */}
      <div className="flex items-center gap-2 text-sm">
        <User size={16} className="text-primary" />
        <span className="font-bold text-text-primary">My Profile</span>
        <ChevronRight size={14} className="text-gray-label" />
        <span className="text-gray-text">Public broker profile & shareable store</span>
      </div>

      {/* ── Broker Info Card ── */}
      <div className="bg-white rounded-2xl border border-gray-border shadow-xs overflow-hidden">
        {/* Top accent strip */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-teal-400 to-emerald-400" />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0">
                {initials}
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-2.5">
              {/* Name + Brand + Verified badge */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-black text-text-primary">{displayName}</h1>
                {brandName && (
                  <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-lg border border-primary/20">
                    {brandName}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  <CheckCircle size={10} />
                  Verified Broker
                </span>
              </div>
              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-text">
                  <Mail size={13} className="text-primary shrink-0" />
                  <span className="truncate font-medium">{displayEmail || '—'}</span>
                </div>
                {displayPhone && (
                  <div className="flex items-center gap-2 text-gray-text">
                    <Phone size={13} className="text-primary shrink-0" />
                    <span className="font-medium">{displayPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-text">
                  <Package size={13} className="text-primary shrink-0" />
                  <span className="font-medium">
                    Product Type:{' '}
                    <span className="text-text-primary font-semibold">{dominantCategory}</span>
                  </span>
                </div>
              </div>
              {/* About */}
              <div className="flex items-start gap-2 text-sm text-gray-text">
                <Info size={13} className="text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-semibold text-text-primary">About: </span>
                  {aboutText}
                </p>
              </div>
            </div>
            {/* Edit Profile shortcut */}
            <button
              onClick={() => navigate('/broker/settings')}
              className="shrink-0 flex items-center gap-2 px-3.5 py-2 border border-gray-border bg-white text-text-primary rounded-xl text-xs font-semibold hover:bg-gray-50 hover:border-primary/40 transition-all cursor-pointer self-start"
            >
              <Edit3 size={13} />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Shareable Link Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-teal-50 to-emerald-50 rounded-2xl border border-primary/20 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md">
            <Share2 size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary">Your Shareable Shop Link</p>
            <p className="text-xs text-gray-text mt-0.5">
              Share this link with customers so they can view your shop and products directly
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-2 bg-white border border-gray-border rounded-xl px-3 py-2 flex-1 min-w-0 max-w-md">
                <Store size={13} className="text-primary shrink-0" />
                <span className="text-xs text-gray-text font-mono truncate">{shopUrl}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-primary text-white hover:bg-primary-dark shadow-md'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 pt-4 border-t border-primary/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '📱', text: 'Share on WhatsApp & social media' },
            { icon: '🔗', text: 'Add to your email signature' },
            { icon: '📊', text: 'Track visits from your analytics' },
          ].map((tip) => (
            <div key={tip.text} className="flex items-center gap-2 text-xs text-gray-text">
              <span>{tip.icon}</span>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {shopStats.map(({ label, value, icon, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-border p-5 shadow-xs flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              {icon}
            </div>
            <div>
              <p className="text-lg font-black text-text-primary">{value}</p>
              <p className="text-xs text-gray-text">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-border overflow-hidden shadow-xs">
        {/* Tab Header */}
        <div className="flex border-b border-gray-border bg-gray-50/50">
          {[
            { id: 'products', label: 'Product Listings', icon: Package },
            { id: 'analytics', label: 'Shop Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Shop Info', icon: Building2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all cursor-pointer border-b-2 ${
                activeTab === id
                  ? 'text-primary border-primary bg-white'
                  : 'text-gray-text border-transparent hover:text-text-primary hover:bg-white/50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Products */}
        {activeTab === 'products' && (
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-text-primary">Your Product Listings</h2>
                <p className="text-xs text-gray-text mt-0.5">
                  {myProducts.length} products · {inStockCount} In Stock
                  {shopSearchQuery && ` · ${searchFilteredProducts.length} match search`}
                </p>
              </div>
              <Link
                to="/broker/products"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-sm shrink-0"
              >
                <Plus size={14} />
                Add Product
              </Link>
            </div>

            {/* Product Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-label pointer-events-none" />
              <input
                type="text"
                placeholder="Search products by name, category, or description..."
                value={shopSearchQuery}
                onChange={(e) => setShopSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 border border-gray-border rounded-xl bg-gray-bg text-sm text-text-primary placeholder-gray-label focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
              />
              {shopSearchQuery && (
                <button
                  type="button"
                  onClick={() => setShopSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-label hover:text-text-primary transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {myProducts.length === 0 ? (
              <div className="py-16 text-center">
                <Package size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-text-primary">No products listed yet</p>
                <p className="text-sm text-gray-text mt-1">
                  Add your first product to get your shop started!
                </p>
                <Link
                  to="/broker/products"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all"
                >
                  <Plus size={15} />
                  Add First Product
                </Link>
              </div>
            ) : searchFilteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Search size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-text-primary">No products match your search</p>
                <p className="text-sm text-gray-text mt-1">Try a different keyword or clear the search.</p>
                <button
                  type="button"
                  onClick={() => setShopSearchQuery('')}
                  className="mt-3 text-sm font-semibold text-primary hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchFilteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="border border-gray-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group"
                  >
                    {/* Product Image */}
                    <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ShoppingCart size={32} className="text-gray-300" />
                      )}
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prod.status === 'In Stock'
                            ? 'bg-emerald-500 text-white'
                            : prod.status === 'Low Stock'
                            ? 'bg-amber-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {prod.status}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="p-3.5">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        {prod.category}
                      </p>
                      <p className="text-sm font-semibold text-text-primary mt-0.5 line-clamp-2 leading-tight">
                        {prod.name}
                      </p>
                      <div className="flex items-center justify-between mt-2.5">
                        <p className="text-base font-black text-primary">{formatINR(prod.price)}</p>
                        <span className="text-[10px] text-gray-text font-medium">
                          Stock: {prod.stock}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <Link
                          to="/broker/products"
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <Edit3 size={11} />
                          Edit
                        </Link>
                        <a
                          href={`${window.location.origin}/customer/products/${prod.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-text text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Eye size={11} />
                          Preview
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Analytics */}
        {activeTab === 'analytics' && (
          <div className="p-5">
            <h2 className="font-bold text-text-primary mb-4">Shop Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Total Shop Views', value: '—', sub: 'Analytics coming soon', icon: Eye },
                { label: 'Link Clicks', value: '—', sub: 'Track link engagement', icon: QrCode },
                { label: 'Product Views', value: myProducts.length * 12, sub: 'Estimated impressions', icon: Package },
                { label: 'Conversion Rate', value: '—', sub: 'Views to orders ratio', icon: TrendingUp },
              ].map(({ label, value, sub, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 p-4 border border-gray-border rounded-xl bg-gray-50/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-text-primary">{value}</p>
                    <p className="text-xs font-semibold text-text-primary">{label}</p>
                    <p className="text-[10px] text-gray-text">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-primary-50 rounded-xl border border-primary/20 text-center">
              <TrendingUp size={28} className="text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-text-primary">Full Analytics Dashboard Coming Soon</p>
              <p className="text-xs text-gray-text mt-1">
                View page visits, product click-through rates, and revenue attribution from your shop link.
              </p>
            </div>
          </div>
        )}

        {/* Tab: Shop Info */}
        {activeTab === 'settings' && (
          <div className="p-5 space-y-4">
            <h2 className="font-bold text-text-primary">Shop Information</h2>
            <p className="text-xs text-gray-text">
              This information is shown on your public broker profile page. Update it in{' '}
              <Link to="/broker/settings" className="text-primary font-semibold hover:underline">
                Settings
              </Link>
              .
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: 'Broker Name',
                  value: displayName,
                  icon: Building2,
                },
                {
                  label: 'Brand Name',
                  value: brandName || '—',
                  icon: Building2,
                },
                {
                  label: 'Product Type',
                  value: dominantCategory || '—',
                  icon: Package,
                },
                {
                  label: 'Email',
                  value: displayEmail || '—',
                  icon: Mail,
                },
                {
                  label: 'Phone',
                  value: displayPhone || '—',
                  icon: Phone,
                },
                {
                  label: 'Location',
                  value: currentBroker?.location || 'India',
                  icon: MapPin,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-4 border border-gray-border rounded-xl"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-gray-text" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-label">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-text-primary truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Completeness */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <span>💡</span> Improve your shop profile
              </p>
              <ul className="mt-2 space-y-1.5">
                {[
                  'Add a profile photo in Settings',
                  'Write a compelling bio/description',
                  'Add your business location',
                  'Upload product images for better conversions',
                ].map((tip) => (
                  <li key={tip} className="flex items-center gap-2 text-xs text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
              <Link
                to="/broker/settings"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline"
              >
                Go to Settings <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerShopPage;
