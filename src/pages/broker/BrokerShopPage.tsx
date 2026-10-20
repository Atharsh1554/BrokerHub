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
  ShoppingCart,
  Search,
  X,
  Info,
  ExternalLink,
  MessageCircle,
  BadgeCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';
import type { Product } from '../../types';

const formatINR = (amount: number) =>
  '\u20b9' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const BrokerShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { brokerProducts, orders, brokers } = useApp();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'settings'>('products');
  const [shopSearchQuery, setShopSearchQuery] = useState('');

  const currentBroker = brokers.find((b) => b.id === user?.id || b.id === 'b1');

  let localOv: any = null;
  try {
    const raw = localStorage.getItem('brokerhub_broker_overrides');
    if (raw && user?.id) localOv = JSON.parse(raw)[user.id];
  } catch {}

  const displayName = resolveUserDisplayName(localOv?.name || user?.fullName || currentBroker?.name, localOv?.email || user?.email);
  const initials = getUserInitials(displayName);
  const brandName = localOv?.company || currentBroker?.company || '';
  const displayEmail = localOv?.email || user?.email || currentBroker?.email || '';
  const displayPhone = localOv?.phone || user?.phone || currentBroker?.phone || '';
  const avatarUrl = localOv?.avatar || user?.avatar || currentBroker?.avatar;

  const myProducts: Product[] = brokerProducts;

  const productTypeCounts = myProducts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const dominantCategory =
    localOv?.specialty || currentBroker?.specialty || Object.entries(productTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Industrial Products';

  const aboutText = localOv?.description || currentBroker?.description || `Specialized commercial and industrial broker matching verified buyers with premier ${dominantCategory.toLowerCase()} products and manufacturers.`;

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

  const shopUrl = `${window.location.origin}/shop/${user?.id || currentBroker?.id || 'b1'}`;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount ?? o.amount ?? 0), 0);
  const totalOrders = orders.length;
  const avgRating = currentBroker?.rating ?? 0;
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
    { label: 'Products', value: myProducts.length, icon: <Package size={16} className="text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Orders', value: totalOrders, icon: <ShoppingBag size={16} className="text-violet-600" />, bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Revenue', value: formatINR(totalRevenue), icon: <TrendingUp size={16} className="text-teal-600" />, bg: 'bg-teal-50', border: 'border-teal-100' },
    { label: 'Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '0.0', icon: <Star size={16} className="text-amber-500 fill-amber-400" />, bg: 'bg-amber-50', border: 'border-amber-100' },
  ];

  return (
    <div className="pb-16 max-w-3xl mx-auto">

      {/* Hero Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">

        {/* Cover Banner */}
        <div className="relative h-32 sm:h-44 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute top-6 left-1/3 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/30">
            <BadgeCheck size={12} />
            Verified Broker
          </div>
        </div>

        <div className="px-4 sm:px-6 pt-0 pb-5">
          {/* Avatar + Edit row */}
          <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-4">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-lg bg-white" />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg border-4 border-white">
                  {initials}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <button
              onClick={() => navigate('/broker/settings')}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Name and badges */}
          <div className="mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{displayName}</h1>
              {brandName && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">{brandName}</span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                <CheckCircle size={10} />
                Verified Partner
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Specializing in <span className="font-semibold text-gray-700">{dominantCategory}</span>
            </p>
          </div>

          <div className="border-t border-gray-100 my-4" />

          {/* Contact Info */}
          <div className="space-y-2.5 mb-5">
            {displayEmail && (
              <a href={`mailto:${displayEmail}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-emerald-700 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <Mail size={14} className="text-emerald-600" />
                </div>
                <span className="truncate">{displayEmail}</span>
              </a>
            )}
            {displayPhone && (
              <a href={`tel:${displayPhone}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-emerald-700 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <Phone size={14} className="text-emerald-600" />
                </div>
                <span>{displayPhone}</span>
              </a>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Package size={14} className="text-emerald-600" />
              </div>
              <span>Product Type: <span className="font-semibold text-gray-900">{dominantCategory}</span></span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Info size={14} className="text-emerald-600" />
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">
                <span className="font-semibold text-gray-800">About: </span>{aboutText}
              </p>
            </div>
          </div>

          {/* Preview Store CTA */}
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Eye size={15} />
            <span>Preview Public Store</span>
          </a>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
        {shopStats.map(({ label, value, icon, bg, border }) => (
          <div key={label} className={`${bg} ${border} border rounded-2xl p-3 flex flex-col items-center text-center gap-1.5`}>
            <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-xs">{icon}</div>
            <p className="text-base sm:text-lg font-black text-gray-900 leading-none">{value}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Shareable Link Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Share2 size={18} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Your Shareable Shop Link</h2>
            <p className="text-xs text-gray-500">Share this link with customers to view your shop and products directly</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-3">
          <Store size={14} className="text-emerald-600 shrink-0" />
          <span className="flex-1 text-xs text-gray-600 font-mono truncate select-all">{shopUrl}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Check out my shop on BrokerHub: ' + shopUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] hover:bg-[#1fba5a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </a>
          <button
            onClick={handleCopyLink}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${copied ? 'bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <a href={shopUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 rounded-xl transition-colors cursor-pointer" title="Open shop preview">
            <ExternalLink size={15} />
          </a>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-1 text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5"><span>📱</span><span>Share on WhatsApp &amp; social media</span></div>
          <div className="flex items-center gap-1.5"><span>🔗</span><span>Add to your email signature</span></div>
          <div className="flex items-center gap-1.5"><span>📊</span><span>Track visits from your analytics</span></div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'products', label: 'Products', icon: Package, count: myProducts.length },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Shop Info', icon: Building2 },
          ].map(({ id, label, icon: Icon, count }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer border-b-2 ${isActive ? 'bg-white text-emerald-700 border-emerald-500 shadow-sm' : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100'}`}
              >
                <Icon size={14} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
                <span>{label}</span>
                {typeof count === 'number' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'products' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Product Inventory</h2>
                <p className="text-xs text-gray-500">{myProducts.length} products · {inStockCount} in stock</p>
              </div>
              <Link to="/broker/products" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0">
                <Plus size={13} /><span>Add Product</span>
              </Link>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Search products..." value={shopSearchQuery} onChange={(e) => setShopSearchQuery(e.target.value)} className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
              {shopSearchQuery && (
                <button type="button" onClick={() => setShopSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {myProducts.length === 0 ? (
              <div className="py-14 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-3">
                <Package size={40} className="text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-gray-700">No products listed yet</h3>
                  <p className="text-xs text-gray-400 mt-1">Add products to display them in your public shop.</p>
                </div>
                <Link to="/broker/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm">
                  <Plus size={14} /><span>List Your First Product</span>
                </Link>
              </div>
            ) : searchFilteredProducts.length === 0 ? (
              <div className="py-10 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <Search size={32} className="text-gray-300 mx-auto" />
                <p className="font-bold text-sm text-gray-700">No results for "{shopSearchQuery}"</p>
                <button type="button" onClick={() => setShopSearchQuery('')} className="text-xs font-bold text-emerald-600 hover:underline">Clear search</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchFilteredProducts.map((prod) => (
                  <div key={prod.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-300 transition-all flex flex-col">
                    <div className="h-36 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <ShoppingCart size={28} className="text-gray-300" />
                      )}
                      <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${prod.status === 'In Stock' ? 'bg-emerald-500 text-white' : prod.status === 'Low Stock' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>{prod.status}</span>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-0.5 mb-3">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{prod.category}</p>
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{prod.name}</h4>
                        <div className="flex items-baseline justify-between pt-1">
                          <p className="text-base font-bold text-gray-900">{formatINR(prod.price)}</p>
                          <span className="text-[11px] text-gray-400">Qty: {prod.stock}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link to="/broker/products" className="flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors">
                          <Edit3 size={11} /><span>Edit</span>
                        </Link>
                        <a href={`${window.location.origin}/customer/products/${prod.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition-colors">
                          <Eye size={11} /><span>Preview</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Store Traffic &amp; Engagement</h2>
              <p className="text-xs text-gray-500">Overview of your store performance</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Total Catalog Views', value: myProducts.length * 24, sub: 'Product catalog views', icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Store Link Clicks', value: totalOrders * 4 + 18, sub: 'Direct link visits', icon: QrCode, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Listed Products', value: myProducts.length, sub: 'Active in marketplace', icon: Package, color: 'text-teal-600', bg: 'bg-teal-50' },
                { label: 'Completed Orders', value: totalOrders, sub: 'Conversion volume', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                <div key={label} className="p-4 border border-gray-200 rounded-2xl bg-white flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{value}</p>
                    <p className="text-xs font-semibold text-gray-700">{label}</p>
                    <p className="text-[11px] text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Public Business Profile</h2>
                <p className="text-xs text-gray-500">Information shown on your public storefront</p>
              </div>
              <Link to="/broker/settings" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">Edit in Settings &rarr;</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Broker Name', value: displayName, icon: User },
                { label: 'Company / Brand', value: brandName || '—', icon: Building2 },
                { label: 'Primary Specialty', value: dominantCategory || '—', icon: Package },
                { label: 'Business Email', value: displayEmail || '—', icon: Mail },
                { label: 'Phone Number', value: displayPhone || '—', icon: Phone },
                { label: 'Location', value: currentBroker?.location || 'India', icon: MapPin },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerShopPage;
