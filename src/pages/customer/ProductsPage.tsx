import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Star, Package, Sparkles, ShoppingCart, MapPin, Plus, Check, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, brokers, cart, addToCart, refreshProducts } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [addedIds, setAddedIds] = useState<{ [key: string]: boolean }>({});

  // Sync products on mount and whenever deletions/updates occur
  React.useEffect(() => {
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

  const activeProducts = React.useMemo(() => {
    let globalDeleted: string[] = [];
    try {
      globalDeleted = JSON.parse(localStorage.getItem('brokerhub_deleted_products') || '[]');
    } catch {}
    return products.filter((p) => !globalDeleted.includes(p.id) && p.isActive !== false);
  }, [products]);

  const categories = ['All', ...Array.from(new Set(activeProducts.map((p) => p.category)))];

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filtered = activeProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  // Products added in the last 24 hours (id starts with p_ meaning broker-added at runtime)
  const isNew = (id: string) => id.startsWith('p_');

  const getBrokerInfo = (brokerId?: string) => {
    if (!brokerId) return brokers[0] || { id: 'b1', name: 'Marcus Chen', company: 'Apex Realty Group', location: 'Mumbai' };
    return brokers.find((b) => b.id === brokerId) || brokers[0] || { id: 'b1', name: 'Marcus Chen', company: 'Apex Realty Group', location: 'Mumbai' };
  };

  const handleQuickAdd = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if ((product.stock ?? 0) <= 0) {
      return; // Out of stock, button disabled via rendering anyway
    }
    const broker = getBrokerInfo(product.brokerId);
    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      brokerId: product.brokerId || broker.id || 'b1',
      brokerName: broker.name,
      price: product.price,
      quantity: 1,
      stock: product.stock ?? 1,
    });
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleContactBroker = (e: React.MouseEvent, brokerId: string) => {
    e.stopPropagation();
    navigate(`/customer/messages?brokerId=${brokerId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Browse Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Explore products available from verified brokers — <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeProducts.length} listings</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeProducts.some((p) => isNew(p.id)) && (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Sparkles size={12} />
              New listings
            </div>
          )}

          <Link
            to="/customer/cart"
            className="relative flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <ShoppingCart size={18} />
            <span>Cart</span>
            {totalCartCount > 0 && (
              <span className="bg-amber-400 text-slate-900 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products, materials, machinery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none shadow-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 outline-none shadow-sm cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
          <Package size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">No products found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4">
          {filtered.map((product) => {
            const broker = getBrokerInfo(product.brokerId);
            const isAdded = addedIds[product.id];

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/customer/products/${product.id}`)}
                className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700/80 overflow-hidden hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all duration-200 group relative flex flex-col justify-between cursor-pointer"
              >
                {/* Product Image Area */}
                <div className="relative aspect-square sm:h-40 w-full bg-white dark:bg-slate-900/40 p-2 sm:p-2.5 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-slate-700/60">
                  {/* Badges */}
                  {isNew(product.id) && (
                    <span className="absolute top-2 left-2 z-10 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs tracking-wider">
                      NEW
                    </span>
                  )}

                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag size={32} className="text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                  )}

                  {product.status !== 'In Stock' && (
                    <span className="absolute top-2 right-2 z-10 bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {product.status}
                    </span>
                  )}

                  {/* Quick Add Floating Button */}
                  <button
                    onClick={(e) => handleQuickAdd(e, product)}
                    className="absolute bottom-2 right-2 bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 sm:p-2 rounded-full shadow-md transition-all hover:scale-110 z-10 opacity-90 hover:opacity-100"
                    title="Add to Cart"
                  >
                    {isAdded ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                </div>

                {/* Product Details Area (Flipkart / Amazon Style) */}
                <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between space-y-1.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
                      <span className="uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[65%]">
                        {product.category}
                      </span>
                      {broker.location && (
                        <span className="flex items-center gap-0.5 truncate text-[10px] text-gray-400">
                          <MapPin size={10} />
                          {broker.location}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors min-h-[2rem] sm:min-h-[2.5rem]">
                      {product.name}
                    </h3>

                    {/* Flipkart/Amazon-style Rating Badge */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="inline-flex items-center gap-0.5 bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded text-[10px] leading-none">
                        {product.rating ? Number(product.rating).toFixed(1) : '0.0'} <Star size={9} className="fill-white text-white" />
                      </span>
                      <span className="text-[10px] text-gray-400">
                        ({product.reviewCount ?? 0})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium truncate">
                        {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                      </span>
                    </div>

                    {/* Broker Snippet with Contact Action */}
                    <div className="pt-1.5 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] sm:text-[11px]">
                      <span className="text-gray-500 truncate max-w-[65%] font-medium">
                        By <strong className="text-gray-800 dark:text-gray-200">{broker.name}</strong>
                      </span>
                      <button
                        onClick={(e) => handleContactBroker(e, broker.id)}
                        className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-0.5 hover:underline shrink-0"
                        title={`Chat with ${broker.name}`}
                      >
                        <MessageSquare size={11} />
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
