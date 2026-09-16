import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, CheckCircle, MessageSquare,
  Package, ShoppingCart, ChevronRight, Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getBrokerById } from '../../lib/api/brokers';
import { getProductsByBrokerId } from '../../lib/api/products';
import type { Broker, Product } from '../../types';
import { brokers as mockBrokers, products as mockProducts } from '../../data/mockData';

const formatINR = (amount: number) =>
  '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 15 }) => (
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

export const BrokerProfilePage: React.FC = () => {
  const { brokerId } = useParams<{ brokerId: string }>();
  const navigate = useNavigate();
  const { brokers, products } = useApp();

  const [broker, setBroker] = useState<Broker | null>(null);
  const [brokerProducts, setBrokerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!brokerId) return;
      setLoading(true);

      let bk = brokers.find((b) => b.id === brokerId) || null;
      if (!bk) bk = await getBrokerById(brokerId);
      if (!bk) bk = mockBrokers.find((b) => b.id === brokerId) || null;
      setBroker(bk);

      // Get products for this broker
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

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

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
        <span className="text-text-primary font-medium">Broker Profile</span>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-gray-border overflow-hidden shadow-xs">
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-to-r from-primary via-teal-500 to-emerald-400" />
        <div className="px-6 pb-6">
          {/* Avatar + Core Info */}
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end -mt-10">
            <div className="shrink-0">
              {broker.avatar ? (
                <img
                  src={broker.avatar}
                  alt={broker.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-lg border-4 border-white">
                  {initials(broker.name)}
                </div>
              )}
            </div>
            <div className="flex-1 pt-2 sm:pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-text-primary">{broker.company || broker.name}</h1>
                  <p className="text-sm text-gray-text">{broker.name} · {broker.specialty}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle size={11} />
                      Verified Broker
                    </div>
                    {broker.location && (
                      <div className="flex items-center gap-1 text-gray-text text-xs">
                        <MapPin size={12} className="text-primary" />
                        {broker.location}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleConnect}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md cursor-pointer"
                >
                  <MessageSquare size={15} />
                  Connect with Broker
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Stats */}
        <div className="space-y-4">
          {/* Rating */}
          <div className="bg-white rounded-2xl border border-gray-border p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-label mb-3">Rating & Reviews</h3>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-black text-text-primary">{broker.rating.toFixed(1)}</p>
              <div>
                <StarRating rating={broker.rating} size={18} />
                <p className="text-xs text-gray-text mt-1">{broker.reviewCount} reviews</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-border p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-label">Quick Stats</h3>
            {[
              { label: 'Active Listings', value: brokerProducts.length },
              { label: 'Specialty', value: broker.specialty || '—' },
              { label: 'Status', value: broker.status },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-text">{label}</span>
                <span className="text-sm font-semibold text-text-primary">{value}</span>
              </div>
            ))}
          </div>

          {/* About */}
          {broker.description && (
            <div className="bg-white rounded-2xl border border-gray-border p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-label mb-2">About</h3>
              <p className="text-sm text-gray-text leading-relaxed">{broker.description}</p>
            </div>
          )}
        </div>

        {/* Right — Products */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-border overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-gray-border bg-gray-50/50">
              <h2 className="font-bold text-text-primary flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Products by {broker.company || broker.name}
                <span className="ml-auto text-xs font-normal text-gray-label bg-gray-100 px-2 py-0.5 rounded-full">
                  {brokerProducts.length} listings
                </span>
              </h2>
            </div>

            {brokerProducts.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-text-primary">No products listed yet</p>
                <p className="text-xs text-gray-text mt-1">This broker hasn't listed any products yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                {brokerProducts.map((prod) => (
                  <Link
                    to={`/customer/products/${prod.id}`}
                    key={prod.id}
                    className="flex gap-3 p-3 border border-gray-border rounded-xl hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <ShoppingCart size={24} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{prod.category}</p>
                      <p className="text-sm font-semibold text-text-primary line-clamp-2 leading-tight mt-0.5">{prod.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-sm font-bold text-primary">{formatINR(prod.price)}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prod.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700' :
                          prod.status === 'Low Stock' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {prod.status}
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
