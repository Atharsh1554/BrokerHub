import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, ShoppingBag, X, ImagePlus, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';
import type { Product } from '../../types';

export const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    stock: '',
    description: '',
    image: '',
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  // Handle image file upload → convert to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

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
        image: formData.image,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        image: formData.image,
        category: formData.category,
        stock: stockNum,
        status: statusVal,
        description: formData.description,
      });
    }

    setIsAddModalOpen(false);
    setFormData({ name: '', price: '', category: 'Electronics', stock: '', description: '', image: '' });
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      description: product.description || '',
      image: product.image || '',
    });
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: 'Electronics', stock: '', description: '', image: '' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Product Inventory Management</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage product listings, pricing, and stock levels across your brokerage deals
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Products auto-publish to customers
          </div>
          <Button
            variant="primary"
            className="gap-2 shrink-0 bg-primary hover:bg-primary-dark text-white"
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', price: '', category: 'Electronics', stock: '', description: '', image: '' });
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add New Listing
          </Button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
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
            className="bg-white rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all overflow-hidden"
          >
            {/* Product Image */}
            <div className="h-44 bg-zinc-100 flex items-center justify-center relative overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag className="w-10 h-10 text-zinc-300" />
              )}
              <div className="absolute top-3 right-3">
                <StatusBadge status={product.status} />
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-zinc-900 text-base line-clamp-1">{product.name}</h3>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{product.description}</p>

              <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Unit Price</p>
                  <p className="text-lg font-bold text-zinc-900">₹{product.price.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400 font-medium">Available Stock</p>
                  <p className="text-sm font-semibold text-zinc-700">{product.stock} units</p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-0 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs text-zinc-700 border-zinc-200 hover:bg-zinc-50"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={resetForm}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-zinc-900 mb-1">
              {editingProduct ? 'Edit Product Listing' : 'Add New Product Listing'}
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              {editingProduct
                ? 'Changes will be reflected on the customer dashboard instantly.'
                : '✨ This product will automatically appear on the customer dashboard once created.'}
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Product Image</label>
                <div
                  className="w-full h-36 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors relative overflow-hidden bg-zinc-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.image ? (
                    <>
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData((prev) => ({ ...prev, image: '' }));
                        }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-zinc-400 mb-2" />
                      <p className="text-xs text-zinc-500 font-medium">Click to upload product image</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Quantum Processor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="24900"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingProduct ? 'Save Changes' : '🚀 Create Listing'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
