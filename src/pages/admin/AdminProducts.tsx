import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Filter,
  Eye,
  Trash2,
  Power,
  X,
  ShieldAlert,
} from 'lucide-react';
import { getAdminProducts, toggleProductActive, deleteAdminProduct } from '../../lib/api/admin';
import type { Product } from '../../types';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; product: Product | null }>({
    show: false,
    product: null,
  });

  const fetchProducts = async () => {
    setLoading(true);
    const data = await getAdminProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleActive = async (product: Product) => {
    await toggleProductActive(product.id, !!product.isActive);
    fetchProducts();
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.product) {
      await deleteAdminProduct(deleteModal.product.id);
      setDeleteModal({ show: false, product: null });
      fetchProducts();
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.brokerName && p.brokerName.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || p.status === stockFilter;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Package className="w-5 h-5 text-violet-400" />
            <span>Product Catalog Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor, moderate, edit, and control product listings published by brokers.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold">
          Total Products: {products.length}
        </span>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name, ID, broker..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <span>Stock Status:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs"
            >
              <option value="all">All Stock Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading product catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No products match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Product Details</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Broker</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Stock</th>
                  <th className="py-4 px-4">Listing Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white truncate max-w-xs">{p.name}</p>
                          <p className="text-[10px] text-slate-500">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{p.brokerName || 'Apex Brokerage'}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">₹{p.price.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          p.stock === 0 ? 'text-red-400' : p.stock < 10 ? 'text-amber-400' : 'text-slate-200'
                        }`}
                      >
                        {p.stock} units ({p.status})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          p.isActive !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {p.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Inspect Product Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          p.isActive !== false
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                        }`}
                        title={p.isActive !== false ? 'Deactivate Product' : 'Activate Product'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteModal({ show: true, product: p })}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Remove Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Inspector Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-7 h-7 text-slate-500" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{selectedProduct.name}</h2>
                <p className="text-xs text-slate-400">ID: {selectedProduct.id}</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">₹{selectedProduct.price.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Category</span>
                <span className="font-semibold text-white">{selectedProduct.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Broker Vendor</span>
                <span className="font-semibold text-white">{selectedProduct.brokerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Available Stock</span>
                <span className="font-semibold text-white">{selectedProduct.stock} units ({selectedProduct.status})</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Description</span>
                <p className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedProduct.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm Product Removal</h3>
                <p className="text-xs text-slate-400">{deleteModal.product.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              Are you sure you want to permanently delete this product from the platform catalog? This action cannot be undone and will be audit logged.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ show: false, product: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-semibold text-white shadow-lg shadow-red-500/20"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
