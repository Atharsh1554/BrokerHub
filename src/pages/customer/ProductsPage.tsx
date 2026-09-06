import React, { useState } from 'react';
import { Search, ShoppingBag, Star } from 'lucide-react';
import { products } from '../../data/mockData';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const ProductsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', ...new Set(products.map((p) => p.category))];

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Browse Products</h1>
        <p className="text-sm text-gray-text">Explore products available from your brokers</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="bg-white rounded-xl border border-gray-border overflow-hidden hover:shadow-md transition-all duration-200 group">
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
              <ShoppingBag size={48} className="text-gray-300 group-hover:scale-110 transition-transform duration-300" />
              {product.status !== 'In Stock' && (
                <div className="absolute top-3 right-3">
                  <StatusBadge status={product.status} size="sm" />
                </div>
              )}
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-label uppercase tracking-wider mb-1">{product.category}</p>
              <h3 className="font-semibold text-text-primary mb-2">{product.name}</h3>
              <p className="text-sm text-gray-text mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-text-primary">4.5</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
