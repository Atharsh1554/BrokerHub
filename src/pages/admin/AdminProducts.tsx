import React, { useEffect, useState, useRef } from 'react';
import {
  Package,
  Search,
  Filter,
  Eye,
  Trash2,
  Power,
  X,
  ShieldAlert,
  Plus,
  Edit,
  ImagePlus,
  CheckCircle2,
} from 'lucide-react';
import { getAdminProducts, toggleProductActive, deleteAdminProduct } from '../../lib/api/admin';
import type { Product } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; product: Product | null }>({
    show: false,
    product: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Add / Edit Modal
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    stock: '',
    description: '',
    image: '',
    brokerName: 'Apex Brokerage',
  });

  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category: 'Electronics',
      stock: '',
      description: '',
      image: '',
      brokerName: 'Apex Brokerage',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      description: product.description || '',
      image: product.image || '',
      brokerName: product.brokerName || 'Apex Brokerage',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const stockNum = parseInt(formData.stock) || 0;
    const priceNum = parseFloat(formData.price) || 0;
    const statusVal = stockNum === 0 ? 'Out of Stock' : stockNum < 10 ? 'Low Stock' : 'In Stock';

    if (editingProduct) {
      // Update existing product
      const updatedList = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: formData.name,
              price: priceNum,
              category: formData.category,
              stock: stockNum,
              status: statusVal as any,
              description: formData.description,
              image: formData.image,
              brokerName: formData.brokerName,
            }
          : p
      );
      setProducts(updatedList);

      // Store in localStorage overrides
      try {
        const overrides = JSON.parse(localStorage.getItem('brokerhub_product_admin_overrides') || '{}');
        overrides[editingProduct.id] = {
          name: formData.name,
          price: priceNum,
          category: formData.category,
          stock: stockNum,
          status: statusVal,
          description: formData.description,
          image: formData.image,
          brokerName: formData.brokerName,
        };
        localStorage.setItem('brokerhub_product_admin_overrides', JSON.stringify(overrides));
      } catch {}
    } else {
      // Add new product
      const newId = `p_adm_${Date.now()}`;
      const newProd: Product = {
        id: newId,
        name: formData.name,
        price: priceNum,
        category: formData.category,
        stock: stockNum,
        status: statusVal as any,
        description: formData.description,
        image: formData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
        brokerId: 'b1',
        brokerName: formData.brokerName,
        rating: 4.8,
        reviewCount: 1,
        isActive: true,
      };

      setProducts([newProd, ...products]);

      // Save to custom products
      try {
        const customProds = JSON.parse(localStorage.getItem('brokerhub_custom_products') || '[]');
        localStorage.setItem('brokerhub_custom_products', JSON.stringify([newProd, ...customProds]));
      } catch {}
    }

    setIsAddEditModalOpen(false);
    setEditingProduct(null);
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Package className="w-5 h-5 text-violet-500" />
            <span>Product Catalog Governance</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Add, update, moderate, and control product listings across BROKER HUB.
          </p>
        </div>
        <div className="flex items-center space-x-3 flex-wrap">
          <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
            isLight ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-violet-500/10 border-violet-500/30 text-violet-400'
          }`}>
            Total Products: {products.length}
          </span>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
      }`}>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name, ID, broker..."
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`rounded-xl px-2.5 py-1.5 text-xs border font-semibold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}>Stock Status:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className={`rounded-xl px-2.5 py-1.5 text-xs border font-semibold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
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
      <div className={`rounded-3xl border overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        {loading ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading product catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No products match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <th className="py-4 px-4">Product Details</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Broker</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Stock</th>
                  <th className="py-4 px-4">Listing Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                  }`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden ${
                          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                        }`}>
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className={`font-bold truncate max-w-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.name}</p>
                          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                        isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {p.category}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{p.brokerName || 'Apex Brokerage'}</td>
                    <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>₹{p.price.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          p.stock === 0 ? 'text-red-600' : p.stock < 10 ? 'text-amber-600' : isLight ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        {p.stock} units ({p.status})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          p.isActive !== false
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {p.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title="Inspect Product Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
                        }`}
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          p.isActive !== false
                            ? isLight ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                            : isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                        }`}
                        title={p.isActive !== false ? 'Deactivate Product' : 'Activate Product'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteModal({ show: true, product: p })}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                        }`}
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

      {/* Add / Edit Product Modal */}
      {isAddEditModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <button
              onClick={() => setIsAddEditModalOpen(false)}
              className={`absolute right-4 top-4 p-1 rounded-lg ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {editingProduct ? 'Edit Product Details' : 'Add New Product Listing'}
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {editingProduct
                  ? 'Update price, stock, category, or product information.'
                  : 'Add a new product listing directly to the platform catalog.'}
              </p>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Image Upload */}
              <div>
                <label className={`block font-semibold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Product Image
                </label>
                <div
                  className={`w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${
                    isLight
                      ? 'border-slate-300 bg-slate-50 hover:border-emerald-500'
                      : 'border-slate-700 bg-slate-950/60 hover:border-emerald-500'
                  }`}
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
                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                      <p className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Click to upload product image
                      </p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        PNG, JPG, WEBP formats supported
                      </p>
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
                <label className={`block font-semibold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Quantum Processor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full rounded-xl p-3 border focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="24900"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full rounded-xl p-3 border focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className={`w-full rounded-xl p-3 border focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full rounded-xl p-3 border font-semibold ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option>Electronics</option>
                    <option>Audio</option>
                    <option>Furniture</option>
                    <option>Fashion</option>
                    <option>Accessories</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Broker Vendor
                  </label>
                  <input
                    type="text"
                    value={formData.brokerName}
                    onChange={(e) => setFormData({ ...formData, brokerName: e.target.value })}
                    className={`w-full rounded-xl p-3 border focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter product features and deal specifications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full rounded-xl p-3 border focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-3 pt-3 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  {editingProduct ? 'Save Product Changes' : '🚀 Publish Product Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Inspector Modal */}
      {selectedProduct && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <button
              onClick={() => setSelectedProduct(null)}
              className={`absolute top-5 right-5 p-1 rounded-lg ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`flex items-center space-x-4 border-b pb-4 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center overflow-hidden ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
              }`}>
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-7 h-7 text-slate-400" />
                )}
              </div>
              <div>
                <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedProduct.name}</h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ID: {selectedProduct.id}</p>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">₹{selectedProduct.price.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Category</span>
                <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedProduct.category}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Broker Vendor</span>
                <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedProduct.brokerName}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Available Stock</span>
                <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedProduct.stock} units ({selectedProduct.status})</span>
              </div>
              <div className="space-y-1">
                <span className={`font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Description</span>
                <p className={`p-3 rounded-xl border leading-relaxed ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}>
                  {selectedProduct.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.product && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Confirm Product Removal</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{deleteModal.product.name}</p>
              </div>
            </div>

            <p className={`text-xs p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
            }`}>
              Are you sure you want to permanently delete this product from the platform catalog? This action cannot be undone and will be audit logged.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ show: false, product: null })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md shadow-red-500/20"
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
