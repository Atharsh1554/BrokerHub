import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  MessageSquare,
  Package,
  ShoppingCart,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  Copy,
  Check,
  Share2,
  Calendar,
  Star,
  Store,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getBrokerById } from '../../lib/api/brokers';
import { getProductsByBrokerId } from '../../lib/api/products';
import type { Broker, Product } from '../../types';
import { brokers as mockBrokers, products as mockProducts } from '../../data/mockData';

const formatINR = (amount: number) =>
  '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const BrokerProfilePage: React.FC = () => {
  const { brokerId } = useParams<{ brokerId: string }>();
  const navigate = useNavigate();
  const { brokers, products } = useApp();

  const [broker, setBroker] = useState<Broker | null>(null);
  const [brokerProducts, setBrokerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const load = async () => {
      if (!brokerId) return;
      setLoading(true);

      let bk = brokers.find((b) => b.id === brokerId) || null;
      if (!bk) bk = await getBrokerById(brokerId);
      if (!bk) bk = mockBrokers.find((b) => b.id === brokerId) || null;
      setBroker(bk);

      let prods = (products.length > 0 ? products : mockProducts).filter(
        (p) => p.brokerId === brokerId
      );
      if (prods.length === 0) {
        prods = await getProductsByBrokerId(brokerId);
      }
      setBrokerProducts(prods);
      setLoading(false);
    };
    load();
  }, [brokerId, brokers, products]);

  const handleConnect = () => {
    if (broker) navigate(`/customer/messages?brokerId=${broker.id}`);
  };

  const handleCopyShopLink = async () => {
    const shopUrl = `${window.location.origin}/shop/${brokerId}`;
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

  const initials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Categories from products
  const categories = ['All', ...Array.from(new Set(brokerProducts.map((p) => p.category)))];

  const filteredProducts = brokerProducts.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-text font-medium">Loading broker profile…</p>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Building2 size={56} className="text-gray-300" />
        <h2 className="text-xl font-bold text-text-primary">Broker Not Found</h2>
        <p className="text-gray-text text-sm">This broker profile doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-all cursor-pointer"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-text hover:text-primary transition-colors font-medium cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <ChevronRight size={14} className="text-gray-label" />
        <span className="text-gray-text">Brokers</span>
        <ChevronRight size={14} className="text-gray-label" />
        <span className="text-text-primary font-semibold">{broker.company || broker.name}</span>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-border overflow-hidden shadow-xs relative">
        {/* Cover Banner */}
        <div className="h-36 sm:h-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 relative">
          <div className="absolute inset-0">
            <div className="absolute top-3 right-16 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-4 left-24 w-36 h-36 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute top-6 left-1/2 w-20 h-20 rounded-full bg-white/5 blur-xl" />
          </div>

          {/* Verified badge on banner */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/30 shadow-xs">
              <CheckCircle size={11} />
              Verified Broker
            </span>
          </div>

          {/* Store icon decoration */}
          <div className="absolute bottom-4 left-6 opacity-10">
            <Store size={80} className="text-white" />
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Avatar + Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="shrink-0 -mt-14 sm:-mt-16 z-10">
                {broker.avatar ? (
                  <img
                    src={broker.avatar}
                    alt={broker.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg border-4 border-white">
                    {initials(broker.name)}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-text-primary">
                  {broker.company || broker.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-text mt-0.5">
                  {broker.name} · {broker.specialty}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {broker.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-text bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                      <MapPin size={11} className="text-primary" />
                      {broker.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-text bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                    <Package size={11} className="text-primary" />
                    {brokerProducts.length} Products
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100">
                    <Star size={11} className="fill-amber-500 text-amber-500" />
                    {broker.rating.toFixed(1)} · {broker.reviewCount} reviews
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap shrink-0 self-stretch sm:self-auto justify-end mt-2 md:mt-0">
              <button
                onClick={handleCopyShopLink}
                className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  copied
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-gray-border bg-white text-text-primary hover:bg-gray-50'
                }`}
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
              <Link
                to={`/customer/appointments`}
                className="flex items-center gap-2 px-3.5 py-2 border border-gray-border bg-white text-text-primary rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-all cursor-pointer"
              >
                <Calendar size={14} />
                Book
              </Link>
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-dark transition-all shadow-md cursor-pointer"
              >
                <MessageSquare size={14} />
                Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Products Listed',
            value: brokerProducts.length,
            icon: Package,
            color: 'text-primary',
            bg: 'bg-primary-50',
          },
          {
            label: 'Rating',
            value: `${broker.rating.toFixed(1)} ★`,
            icon: Star,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Reviews',
            value: broker.reviewCount,
            icon: MessageSquare,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: 'Status',
            value: broker.status,
            icon: CheckCircle,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-border p-4 shadow-xs flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-sm font-black text-text-primary">{value}</p>
              <p className="text-[10px] text-gray-text">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar — Broker Info */}
        <div className="space-y-4">
          {/* About */}
          <div className="bg-white rounded-2xl border border-gray-border p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-label mb-3">About</h3>
            {broker.description ? (
              <p className="text-sm text-gray-text leading-relaxed">{broker.description}</p>
            ) : (
              <p className="text-sm text-gray-text italic">No description provided.</p>
            )}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-border p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-label mb-3">Contact</h3>
            <div className="space-y-2.5">
              {broker.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Mail size={13} className="text-gray-text" />
                  </div>
                  <p className="text-sm text-text-primary truncate">{broker.email}</p>
                </div>
              )}
              {broker.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Phone size={13} className="text-gray-text" />
                  </div>
                  <p className="text-sm text-text-primary">{broker.phone}</p>
                </div>
              )}
              {broker.location && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <MapPin size={13} className="text-primary" />
                  </div>
                  <p className="text-sm text-text-primary">{broker.location}</p>
                </div>
              )}
              {!broker.email && !broker.phone && !broker.location && (
                <p className="text-sm text-gray-text italic">Contact info not provided.</p>
              )}
            </div>
          </div>

          {/* Share Shop Link */}
          <div className="bg-gradient-to-br from-primary/5 to-teal-50 rounded-2xl border border-primary/20 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
              <ExternalLink size={11} />
              Shop Link
            </h3>
            <p className="text-xs text-gray-text mb-3">
              Share this broker's shop with others
            </p>
            <button
              onClick={handleCopyShopLink}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Link Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy Shop Link
                </>
              )}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-gray-border p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-label mb-3">Quick Stats</h3>
            {[
              { label: 'Specialty', value: broker.specialty || '—' },
              { label: 'In Stock', value: `${brokerProducts.filter(p => p.status === 'In Stock').length} products` },
              { label: 'Verified', value: 'Yes' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm text-gray-text">{label}</span>
                <span className="text-sm font-semibold text-text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Products */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-border overflow-hidden shadow-xs">
            {/* Products Header with Search */}
            <div className="px-5 py-4 border-b border-gray-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-text-primary flex items-center gap-2">
                  <Store size={16} className="text-primary" />
                  {broker.company || broker.name}'s Shop
                  <span className="ml-1 text-xs font-normal text-gray-label bg-gray-100 px-2 py-0.5 rounded-full">
                    {brokerProducts.length} listings
                  </span>
                </h2>
              </div>

              {/* Search + Filter */}
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-border rounded-xl bg-gray-bg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-text hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="p-16 text-center">
                <Package size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-text-primary">
                  {brokerProducts.length === 0 ? 'No products listed yet' : 'No products match your search'}
                </p>
                <p className="text-xs text-gray-text mt-1">
                  {brokerProducts.length === 0
                    ? 'This broker has not listed any products yet.'
                    : 'Try a different search term or category.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                {filteredProducts.map((prod) => (
                  <Link
                    to={`/customer/products/${prod.id}`}
                    key={prod.id}
                    className="border border-gray-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer"
                  >
                    {/* Image */}
                    <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ShoppingCart size={28} className="text-gray-300" />
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

                    {/* Info */}
                    <div className="p-3.5">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        {prod.category}
                      </p>
                      <p className="text-sm font-semibold text-text-primary line-clamp-2 leading-tight mt-0.5">
                        {prod.name}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-base font-black text-primary">{formatINR(prod.price)}</p>
                        <span className="text-xs text-gray-text font-medium">
                          Stock: {prod.stock}
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:underline">
                          View Details <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
