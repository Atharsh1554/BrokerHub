import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Star, ShoppingCart, Zap, Shield, MapPin, CheckCircle,
  Minus, Plus, Package, ChevronRight, MessageSquare, User, Calendar,
  Tag, AlertTriangle, Share2, Heart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getBrokerById } from '../../lib/api/brokers';
import { getProductById } from '../../lib/api/products';
import type { Broker, Product, ProductReview } from '../../types';
import { brokers as mockBrokers, products as mockProducts } from '../../data/mockData';

// Helpers
const formatINR = (amount: number) =>
  '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => (
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

// Mock reviews
const generateMockReviews = (productId: string): ProductReview[] => [
  {
    id: `rev-${productId}-1`,
    customerId: 'c1',
    customerName: 'Arjun Mehta',
    rating: 5,
    comment: 'Excellent product! Exactly as described. Very fast delivery and great packaging. Highly recommend this broker.',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: `rev-${productId}-2`,
    customerId: 'c2',
    customerName: 'Priya Sharma',
    rating: 4,
    comment: 'Good quality product. Minor delay in delivery but the broker was responsive and helpful throughout.',
    createdAt: '2026-08-15T14:30:00Z',
  },
  {
    id: `rev-${productId}-3`,
    customerId: 'c3',
    customerName: 'Rahul Nair',
    rating: 5,
    comment: 'Outstanding quality. The broker provided all specifications upfront and the product matched perfectly.',
    createdAt: '2026-08-10T09:15:00Z',
  },
];

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { products, brokers, addToCart, showToast } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [broker, setBroker] = useState<Broker | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlist, setWishlist] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!productId) return;
      setLoading(true);

      // Try context first (already loaded), then API, then mock
      let prod = products.find((p) => p.id === productId) || null;
      if (!prod) {
        prod = await getProductById(productId);
      }
      if (!prod) {
        prod = mockProducts.find((p) => p.id === productId) || null;
      }
      setProduct(prod);

      if (prod?.brokerId) {
        let bk = brokers.find((b) => b.id === prod!.brokerId) || null;
        if (!bk) bk = await getBrokerById(prod.brokerId);
        if (!bk) bk = mockBrokers.find((b) => b.id === prod!.brokerId) || null;
        setBroker(bk);
      }

      setLoading(false);
    };
    load();
  }, [productId, products, brokers]);

  useEffect(() => {
    setQuantity(1);
    setActiveImage(0);
  }, [productId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-text font-medium">Loading product details…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Package size={56} className="text-gray-300" />
        <h2 className="text-xl font-bold text-text-primary">Product Not Found</h2>
        <p className="text-gray-text text-sm">This product may have been removed or doesn't exist.</p>
        <button
          onClick={() => navigate('/customer/products')}
          className="mt-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-all"
        >
          ← Back to Products
        </button>
      </div>
    );
  }

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);
  const isOutOfStock = product.stock === 0 || product.status === 'Out of Stock';
  const isLowStock = !isOutOfStock && (product.stock <= 5 || product.status === 'Low Stock');
  const rating = product.rating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const reviews = generateMockReviews(product.id);

  // Related products — same category, excluding current
  const allProducts = products.length > 0 ? products : mockProducts;
  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    setAddingToCart(true);
    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      brokerId: product.brokerId || broker?.id || '',
      brokerName: broker?.company || broker?.name || 'Unknown Broker',
      price: product.price,
      quantity,
      totalPrice: product.price * quantity,
    });
    setTimeout(() => {
      setAddingToCart(false);
      showToast(`"${product.name}" added to cart!`, 'success');
    }, 400);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    handleAddToCart();
    navigate('/customer/checkout');
  };

  const handleConnectBroker = () => {
    if (broker) {
      navigate(`/customer/messages?brokerId=${broker.id}`);
    }
  };

  const handleViewBrokerProfile = () => {
    if (broker) navigate(`/customer/brokers/${broker.id}`);
  };

  const brokerInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/customer/products')}
          className="flex items-center gap-1.5 text-gray-text hover:text-primary transition-colors font-medium cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>
        <ChevronRight size={14} className="text-gray-label" />
        <span className="text-gray-label">{product.category}</span>
        <ChevronRight size={14} className="text-gray-label" />
        <span className="text-text-primary font-medium truncate max-w-48">{product.name}</span>
      </div>

      {/* ─── Main Detail Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — Image Gallery */}
        <div className="space-y-3">
          {/* Main Image */}
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden aspect-square max-h-[480px] border border-gray-border group">
            {allImages.length > 0 && allImages[activeImage] ? (
              <img
                src={allImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <ShoppingCart size={72} className="text-gray-300" />
                <p className="text-xs text-gray-label font-medium">{product.name}</p>
              </div>
            )}

            {/* Stock badge overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-red-500 text-white font-bold text-lg px-6 py-2 rounded-full">Out of Stock</span>
              </div>
            )}
            {isLowStock && !isOutOfStock && (
              <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle size={12} />
                Low Stock
              </div>
            )}

            {/* New badge */}
            {product.id.startsWith('p_') && (
              <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">NEW</div>
            )}

            {/* Wishlist + Share */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => setWishlist((w) => !w)}
                className={`w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-all hover:scale-110 cursor-pointer ${wishlist ? 'text-red-500' : 'text-gray-400'}`}
              >
                <Heart size={18} fill={wishlist ? 'currentColor' : 'none'} />
              </button>
              <button className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 hover:text-primary hover:scale-110 transition-all cursor-pointer">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImage === idx ? 'border-primary shadow-md' : 'border-gray-border hover:border-gray-300'
                  }`}
                >
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Package size={20} className="text-gray-300" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Product Info */}
        <div className="space-y-5">
          {/* Category + Name + Uploaded by Broker */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-50 px-3 py-1 rounded-full">
                {product.category}
              </span>
              {broker && (
                <span className="text-xs font-medium text-gray-600 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center gap-1 border border-gray-200 dark:border-slate-700">
                  <User size={12} className="text-primary" />
                  Uploaded by: <strong className="text-gray-900 dark:text-white">{broker.name}</strong> ({broker.company || 'Verified Broker'})
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-2">
              <StarRating rating={rating} size={18} />
              <span className="text-sm font-bold text-text-primary">{rating > 0 ? rating.toFixed(1) : 'No ratings'}</span>
              {reviewCount > 0 && (
                <a href="#reviews" className="text-xs text-primary underline underline-offset-2 hover:text-primary-dark">
                  ({reviewCount} reviews)
                </a>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-primary-50 to-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-xs text-gray-text font-medium mb-1">Unit Price</p>
            <p className="text-4xl font-black text-primary tracking-tight">{formatINR(product.price)}</p>
            <p className="text-xs text-gray-text mt-1">Inclusive of all taxes</p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm font-semibold">
                <AlertTriangle size={16} />
                Out of Stock
              </div>
            ) : isLowStock ? (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm font-semibold">
                <AlertTriangle size={14} />
                Only {product.stock} left in stock!
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm font-semibold">
                <CheckCircle size={16} />
                Available: {product.stock} units
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-text leading-relaxed">{product.description}</p>
          )}

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-border rounded-xl overflow-hidden bg-white shadow-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-11 h-11 flex items-center justify-center text-gray-text hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-bold text-text-primary text-lg border-x border-gray-border">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="w-11 h-11 flex items-center justify-center text-gray-text hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="text-sm text-gray-text">
                  Subtotal:{' '}
                  <span className="font-bold text-text-primary text-base">{formatINR(product.price * quantity)}</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA Buttons - Add to Cart, Buy Now & Contact Broker */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-primary text-primary hover:bg-primary-50 hover:shadow-md active:scale-98'
              }`}
            >
              <ShoppingCart size={18} className={addingToCart ? 'animate-bounce' : ''} />
              {addingToCart ? 'Adding…' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-md ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark hover:shadow-lg active:scale-98'
              }`}
            >
              <Zap size={18} />
              Buy Now
            </button>
            <button
              onClick={handleConnectBroker}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg active:scale-98"
            >
              <MessageSquare size={18} />
              Contact Broker
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { icon: Shield, text: 'Verified Product' },
              { icon: Package, text: 'Secure Delivery' },
              { icon: CheckCircle, text: 'Quality Assured' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-2.5 text-center border border-gray-border">
                <Icon size={18} className="text-primary" />
                <span className="text-[10px] font-semibold text-gray-text leading-tight">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Broker Section ─── */}
      {broker && (
        <div className="bg-white rounded-2xl border border-gray-border p-6 shadow-xs">
          <h2 className="text-sm font-bold text-gray-label uppercase tracking-wider mb-4">Posted by Broker</h2>
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar */}
            <div className="shrink-0">
              {broker.avatar ? (
                <img src={broker.avatar} alt={broker.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                  {brokerInitials(broker.name)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-lg font-bold text-text-primary leading-tight">{broker.company || broker.name}</h3>
                  <p className="text-sm text-gray-text">{broker.specialty}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                  <CheckCircle size={12} />
                  Verified Broker
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-text">
                {broker.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-primary shrink-0" />
                    <span>{broker.location}</span>
                  </div>
                )}
                {broker.rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="fill-yellow-400 text-yellow-400 shrink-0" />
                    <span className="font-semibold text-text-primary">{broker.rating.toFixed(1)}</span>
                    {broker.reviewCount > 0 && <span className="text-gray-label">({broker.reviewCount} reviews)</span>}
                  </div>
                )}
              </div>

              {broker.description && (
                <p className="text-xs text-gray-text leading-relaxed line-clamp-2">{broker.description}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleViewBrokerProfile}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-border rounded-xl text-sm font-semibold text-text-primary hover:bg-gray-50 hover:border-primary transition-all cursor-pointer"
                >
                  <User size={15} />
                  View Profile
                </button>
                <button
                  onClick={handleConnectBroker}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all shadow-sm cursor-pointer"
                >
                  <MessageSquare size={15} />
                  Connect with Broker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Product Specifications ─── */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-border overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-gray-border bg-gray-50/50">
            <h2 className="font-bold text-text-primary flex items-center gap-2">
              <Tag size={16} className="text-primary" />
              Product Specifications
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(product.specifications).map(([key, val]) => (
              <div key={key} className="flex px-6 py-3 hover:bg-gray-50/50 transition-colors">
                <span className="w-1/3 text-sm font-semibold text-gray-text">{key}</span>
                <span className="flex-1 text-sm text-text-primary">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Customer Reviews ─── */}
      <div id="reviews" className="bg-white rounded-2xl border border-gray-border overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-gray-border bg-gray-50/50">
          <h2 className="font-bold text-text-primary flex items-center gap-2">
            <Star size={16} className="text-primary" />
            Customer Reviews
          </h2>
        </div>
        <div className="p-6">
          {/* Summary */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
            <div className="text-center">
              <p className="text-5xl font-black text-text-primary">{rating > 0 ? rating.toFixed(1) : '—'}</p>
              <StarRating rating={rating} size={20} />
              <p className="text-xs text-gray-label mt-1">Based on {reviewCount} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = star === 5 ? 55 : star === 4 ? 25 : star === 3 ? 12 : star === 2 ? 5 : 3;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-text w-4">{star}</span>
                    <Star size={12} className="fill-yellow-400 text-yellow-400 shrink-0" />
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-label w-6">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Cards */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-purple-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {review.customerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-bold text-text-primary">{review.customerName}</p>
                      <span className="text-xs text-gray-label flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <StarRating rating={review.rating} size={13} />
                  </div>
                </div>
                <p className="text-sm text-gray-text leading-relaxed pl-12">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Related Products ─── */}
      {related.length > 0 && (
        <div>
          <h2 className="font-bold text-text-primary text-lg mb-4 flex items-center gap-2">
            <Package size={18} className="text-primary" />
            Related Products
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((rp) => (
              <Link
                to={`/customer/products/${rp.id}`}
                key={rp.id}
                className="bg-white rounded-xl border border-gray-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                  {rp.image ? (
                    <img src={rp.image} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <ShoppingCart size={32} className="text-gray-300" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{rp.category}</p>
                  <p className="text-xs font-semibold text-text-primary line-clamp-2 mt-0.5">{rp.name}</p>
                  <p className="text-sm font-bold text-primary mt-1">{formatINR(rp.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Dates */}
      {(product.createdAt || product.updatedAt) && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-label border-t border-gray-border pt-4">
          {product.createdAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              Listed: {new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
          {product.updatedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              Updated: {new Date(product.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
