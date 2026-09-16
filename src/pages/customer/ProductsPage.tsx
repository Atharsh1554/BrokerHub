import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Star, Package, Sparkles, ShoppingCart, MapPin, Plus, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, brokers, cart, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [addedIds, setAddedIds] = useState<{ [key: string]: boolean }>({});

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  // Products added in the last 24 hours (id starts with p_ meaning broker-added at runtime)
  const isNew = (id: string) => id.startsWith('p_');

  const getBrokerInfo = (brokerId?: string) => {
    if (!brokerId) return brokers[0] || { name: 'Verified Broker', location: 'Mumbai' };
    return brokers.find((b) => b.id === brokerId) || brokers[0] || { name: 'Verified Broker', location: 'Mumbai' };
  };

  const handleQuickAdd = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    const broker = getBrokerInfo(product.brokerId);
    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      brokerId: product.brokerId || broker.id || 'b1',
      brokerName: broker.name,
      price: product.price,
      quantity: 1,
    });
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Browse Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Explore products available from verified brokers — <span className="font-semibold text-emerald-600 dark:text-emerald-400">{products.length} listings</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {products.some((p) => isNew(p.id)) && (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => {
            const broker = getBrokerInfo(product.brokerId);
            const isAdded = addedIds[product.id];

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/customer/products/${product.id}`)}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-200 group relative flex flex-col cursor-pointer"
              >
                {/* New badge */}
                {isNew(product.id) && (
                  <div className="absolute top-3 left-3 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    NEW
                  </div>
                )}

                {/* Product Image */}
                <div className="h-52 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center relative overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag size={48} className="text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {product.status !== 'In Stock' && (
                    <div className="absolute top-3 right-3 z-10">
                      <StatusBadge status={product.status} size="sm" />
                    </div>
                  )}

                  {/* Quick add floating button on hover */}
                  <button
                    onClick={(e) => handleQuickAdd(e, product)}
                    className="absolute bottom-3 right-3 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-full shadow-md transition-all opacity-90 hover:opacity-100 hover:scale-110"
                    title="Add to Cart"
                  >
                    {isAdded ? <Check size={18} /> : <Plus size={18} />}
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span className="uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                        {product.category}
                      </span>
                      {broker.location && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <MapPin size={12} />
                          {broker.location}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-slate-700/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">Price</span>
                      <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {product.rating || 4.8}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">
                        Broker: {broker.name}
                      </span>
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
