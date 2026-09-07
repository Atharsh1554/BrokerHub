import React, { useState } from 'react';
import { Search, ShoppingBag, Star, Package, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const ProductsPage: React.FC = () => {
  const { products } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  // Products added in the last 24 hours (id starts with p_ meaning broker-added at runtime)
  const isNew = (id: string) => id.startsWith('p_');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Browse Products</h1>
          <p className="text-sm text-gray-text">
            Explore products available from your brokers — <span className="font-semibold text-primary">{products.length} listings</span>
          </p>
        </div>
        {products.some((p) => isNew(p.id)) && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
            <Sparkles size={12} />
            New products available!
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-label" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-border rounded-lg text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-border rounded-lg text-sm bg-white focus:border-primary"
        >
          {categories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={48} className="text-gray-300 mb-4" />
          <p className="text-lg font-semibold text-text-primary">No products found</p>
          <p className="text-sm text-gray-text mt-1">Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-border overflow-hidden hover:shadow-md transition-all duration-200 group relative"
            >
              {/* New badge for broker-added products */}
              {isNew(product.id) && (
                <div className="absolute top-3 left-3 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  NEW
                </div>
              )}

              {/* Product Image / Placeholder */}
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative overflow-hidden">
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
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={product.status} size="sm" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <p className="text-xs text-gray-label uppercase tracking-wider mb-1">{product.category}</p>
                <h3 className="font-semibold text-text-primary mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-text mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-label">{product.stock} in stock</span>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium text-text-primary">4.5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
