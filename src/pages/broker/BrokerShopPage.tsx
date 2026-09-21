import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
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
  ExternalLink,
  Building2,
  Phone,
  Mail,
  CheckCircle,
  QrCode,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';
import type { Product } from '../../types';

const formatINR = (amount: number) =>
  '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill={s <= Math.round(rating) ? '#F59E0B' : '#E5E7EB'}
        />
      </svg>
    ))}
  </div>
);

export const BrokerShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, orders } = useApp();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'settings'>('products');

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const initials = getUserInitials(displayName);

  // Filter products belonging to this broker
  const myProducts: Product[] = products.filter(
    (p) => !user?.id || p.brokerId === user.id || p.brokerId === 'b1'
  );

  // Shop URL — shareable link
  const shopUrl = `${window.location.origin}/shop/${user?.id || 'broker'}`;

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount ?? o.amount ?? 0), 0);
  const totalOrders = orders.length;
  const avgRating = 4.8; // placeholder — would come from reviews table
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
        <Store size={16} className="text-primary" />
        <span className="font-bold text-text-primary">My Shop</span>
        <ChevronRight size={14} className="text-gray-label" />
        <span className="text-gray-text">Public broker profile & shareable store</span>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-border overflow-hidden shadow-xs relative">
        {/* Cover Banner */}
        <div className="h-32 sm:h-36 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-10 w-24 h-24 rounded-full bg-white/30 blur-2xl" />
            <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/30 shadow-xs">
              <Eye size={12} />
              Public Shop • Live
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Avatar + Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="shrink-0 -mt-14 sm:-mt-16 z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg border-4 border-white">
                  {initials}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-text-primary">{displayName}</h1>
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle size={10} />
                    Verified Broker
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-text mt-0.5">
                  {user?.email || 'broker@brokerhub.com'}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <StarRating rating={avgRating} size={14} />
                  <span className="text-xs text-gray-text font-medium">{avgRating} · {totalOrders} reviews</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-primary font-semibold">{myProducts.length} Active Listings</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end mt-2 md:mt-0">
              <button
                onClick={() => navigate('/broker/settings')}
                className="flex items-center gap-2 px-3.5 py-2 border border-gray-border bg-white text-text-primary rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-all cursor-pointer shadow-2xs"
              >
                <Edit3 size={14} />
                Edit Profile
              </button>
              <a
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary-dark transition-all shadow-md cursor-pointer"
              >
                <ExternalLink size={14} />
                Preview Shop
              </a>
            </div>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-text-primary">Your Product Listings</h2>
                <p className="text-xs text-gray-text mt-0.5">
                  {myProducts.length} products visible on your public shop · {inStockCount} In Stock
                </p>
              </div>
              <Link
                to="/broker/products"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-sm"
              >
                <Plus size={14} />
                Add Product
              </Link>
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProducts.map((prod) => (
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
                  label: 'Email',
                  value: user?.email || '—',
                  icon: Mail,
                },
                {
                  label: 'Phone',
                  value: user?.phone || '—',
                  icon: Phone,
                },
                {
                  label: 'Location',
                  value: 'Not set',
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
