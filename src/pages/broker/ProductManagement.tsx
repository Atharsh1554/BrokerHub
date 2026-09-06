import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ShoppingBag, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';
import type { Product } from '../../types';

export const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    stock: '',
    description: '',
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const stockNum = parseInt(formData.stock) || 0;
    const statusVal = stockNum === 0 ? 'Out of Stock' : stockNum < 10 ? 'Low Stock' : 'In Stock';

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: stockNum,
        status: statusVal,
        description: formData.description,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        image: '',
        category: formData.category,
        stock: stockNum,
        status: statusVal,
        description: formData.description,
      });
    }

    setIsAddModalOpen(false);
    setFormData({ name: '', price: '', category: 'Electronics', stock: '', description: '' });
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      description: product.description || '',
    });
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Product Inventory Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage product listings, pricing, and stock levels across your brokerage deals
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2 shrink-0"
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: '', category: 'Electronics', stock: '', description: '' });
            setIsAddModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add New Listing
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 hover:bg-zinc-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <StatusBadge status={product.status} />
              </div>

              <h3 className="font-bold text-zinc-900 dark:text-white text-base line-clamp-1">{product.name}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{product.description}</p>

              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Unit Price</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">${product.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">Available Stock</p>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{product.stock} units</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={() => handleEditClick(product)}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                    deleteProduct(product.id);
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              {editingProduct ? 'Edit Product Listing' : 'Add New Product Listing'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Quantum Processor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="299.99"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option>Electronics</option>
                  <option>Audio</option>
                  <option>Furniture</option>
                  <option>Fashion</option>
                  <option>Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter product features and deal terms..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingProduct ? 'Save Changes' : 'Create Listing'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
