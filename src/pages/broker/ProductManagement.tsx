import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, ShoppingBag, X, ImagePlus, CheckCircle2, Search, Loader2, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';
import type { Product } from '../../types';
import { compressImage } from '../../lib/utils/imageCompressor';
import { DEFAULT_PRODUCT_CATEGORIES } from '../../data/categories';

export const ProductManagement: React.FC = () => {
  const { brokerProducts, brokerProductsLoading, addProduct, updateProduct, deleteProduct } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    stock: '',
    description: '',
    images: [] as string[],
  });

  // Dynamic set of all known categories (predefined + any custom ones created)
  const allKnownCategories = Array.from(
    new Set([...DEFAULT_PRODUCT_CATEGORIES, ...brokerProducts.map((p) => p.category).filter(Boolean)])
  );
  const uniqueCustomExisting = Array.from(
    new Set(
      brokerProducts
        .map((p) => p.category)
        .filter((cat) => cat && !DEFAULT_PRODUCT_CATEGORIES.includes(cat))
    )
  );

  const categories = ['All', ...Array.from(new Set(brokerProducts.map((p) => p.category)))];

  const filteredProducts = brokerProducts.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Handle multi-image upload (max 4 images)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 4 - formData.images.length;
    const toProcess = files.slice(0, remaining);
    const results: string[] = [];
    for (const file of toProcess) {
      try {
        const compressed = await compressImage(file, 600, 0.7);
        results.push(compressed);
      } catch {
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            results.push(reader.result as string);
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...results].slice(0, 4) }));
    // reset file input so same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const resetForm = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setFormData({ name: '', price: '', category: 'Electronics', stock: '', description: '', images: [] });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setFormData({ name: '', price: '', category: 'Electronics', stock: '', description: '', images: [] });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = (isCustomCategory ? customCategoryInput.trim() : formData.category.trim()) || 'General';
    if (!formData.name || !formData.price || !finalCategory || isSubmitting) return;

    const stockNum = parseInt(formData.stock) || 0;
    const statusVal = stockNum === 0 ? 'Out of Stock' : stockNum < 10 ? 'Low Stock' : 'In Stock';
    const primaryImage = formData.images[0] || '';

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name,
          price: parseFloat(formData.price),
          category: finalCategory,
          stock: stockNum,
          status: statusVal,
          description: formData.description,
          image: primaryImage,
          images: formData.images,
        });
        setEditingProduct(null);
      } else {
        await addProduct({
          name: formData.name,
          price: parseFloat(formData.price),
          image: primaryImage,
          images: formData.images,
          category: finalCategory,
          stock: stockNum,
          status: statusVal,
          description: formData.description,
        });
      }

      resetForm();
    } catch (err) {
      console.error('Failed to save product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    const isStandard = DEFAULT_PRODUCT_CATEGORIES.includes(product.category);
    if (!isStandard) {
      setIsCustomCategory(true);
      setCustomCategoryInput(product.category);
    } else {
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    }
    // Build images array: use existing images[] or fallback to single image
    const existingImages = product.images && product.images.length > 0
      ? product.images
      : product.image ? [product.image] : [];
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      description: product.description || '',
      images: existingImages,
    });
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-zinc-200 shadow-xs">
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
            className="gap-2 shrink-0 bg-primary hover:bg-primary-dark text-white cursor-pointer"
            onClick={openAddModal}
          >
            <Plus className="w-4 h-4" />
            Add New Listing
          </Button>
        </div>
      </div>

      {/* Search + Category Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, category, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 border border-zinc-200 rounded-xl bg-white dark:bg-slate-800 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0 no-scrollbar flex-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid or Loading or Empty State */}
      {brokerProductsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-slate-800 rounded-2xl border border-zinc-200 p-5 animate-pulse space-y-4 shadow-xs">
              <div className="h-44 bg-zinc-100 rounded-xl" />
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
              <div className="pt-4 border-t border-zinc-100 flex justify-between">
                <div className="h-6 bg-zinc-100 rounded w-1/3" />
                <div className="h-6 bg-zinc-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-zinc-200 p-12 text-center shadow-xs">
          <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-700 mb-1">
            {searchQuery ? 'No products match your search' : 'No personal product listings yet'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            {searchQuery
              ? `No results for "${searchQuery}". Try a different keyword or clear the search.`
              : 'Add your first private product listing. It will only be visible and manageable by your broker account.'}
          </p>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm font-semibold text-primary hover:underline cursor-pointer"
            >
              Clear search
            </button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="mt-4 gap-1.5 cursor-pointer"
              onClick={openAddModal}
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3.5">
          {filteredProducts.map((product) => {
            const productImages = product.images && product.images.length > 0
              ? product.images
              : product.image ? [product.image] : [];
            const imgIdx = activeImageIndex[product.id] ?? 0;
            const displayImg = productImages[imgIdx];
            return (
          <div
            key={product.id}
            className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all overflow-hidden"
          >
            {/* Product Image Gallery */}
            <div className="relative aspect-square sm:h-36 w-full bg-zinc-50 flex items-center justify-center overflow-hidden border-b border-zinc-100 group">
              {displayImg ? (
                <img
                  src={displayImg}
                  alt={`${product.name} ${imgIdx + 1}`}
                  className="w-full h-full object-contain transition-all duration-300"
                />
              ) : (
                <ShoppingBag className="w-8 h-8 text-zinc-300" />
              )}
              {/* Multi-image nav arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => ({ ...prev, [product.id]: (imgIdx - 1 + productImages.length) % productImages.length }))}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => ({ ...prev, [product.id]: (imgIdx + 1) % productImages.length }))}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  {/* Dot indicator */}
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                    {productImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImageIndex((prev) => ({ ...prev, [product.id]: i }))}
                        className={`rounded-full transition-all ${
                          i === imgIdx ? 'w-2.5 h-1.5 bg-white dark:bg-slate-800' : 'w-1.5 h-1.5 bg-white dark:bg-slate-800/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {/* Image count badge */}
              {productImages.length > 1 && (
                <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[9px] font-semibold rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <Images className="w-2.5 h-2.5" />
                  {productImages.length}
                </div>
              )}
              <div className="absolute top-1.5 right-1.5">
                <StatusBadge status={product.status} size="sm" />
              </div>
            </div>

            <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
              <div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider truncate mb-0.5">{product.category}</p>
                <h3 className="font-semibold text-zinc-900 text-xs sm:text-sm line-clamp-2 leading-tight min-h-[1.8rem] sm:min-h-[2.2rem]">{product.name}</h3>
              </div>

              <div className="pt-1 border-t border-zinc-100 flex items-baseline justify-between gap-1">
                <div>
                  <p className="text-[10px] text-zinc-400 font-medium">Price</p>
                  <p className="text-xs sm:text-sm font-bold text-zinc-900">₹{product.price.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 font-medium">Stock</p>
                  <p className="text-xs font-semibold text-zinc-700">{product.stock} units</p>
                </div>
              </div>
            </div>

            <div className="p-2 pt-0 flex items-center gap-1.5 border-t border-zinc-50">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1 text-[11px] h-7 px-2 text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                onClick={() => handleEditClick(product)}
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1 text-[11px] h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                    deleteProduct(product.id);
                  }
                }}
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </Button>
            </div>
          </div>
            );
          })}
          </div>
        )}
      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
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
              {/* Multi-Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase text-zinc-500">
                    Product Images
                    <span className="ml-1.5 text-zinc-400 normal-case font-normal">(2–4 images)</span>
                  </label>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    formData.images.length >= 4
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {formData.images.length}/4
                  </span>
                </div>

                {/* Uploaded image thumbnails */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 group">
                        <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[8px] text-center font-bold py-0.5">
                            PRIMARY
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    {/* Add more slot */}
                    {formData.images.length < 4 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                      >
                        <ImagePlus className="w-4 h-4 text-zinc-400" />
                        <span className="text-[9px] text-zinc-400 mt-0.5">Add</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Main upload drop zone — only show when no images yet */}
                {formData.images.length === 0 && (
                  <div
                    className="w-full h-32 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors bg-zinc-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="w-8 h-8 text-zinc-400 mb-1.5" />
                    <p className="text-xs text-zinc-500 font-medium">Click to upload product images</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Select up to 4 images · PNG, JPG, WEBP up to 5MB each</p>
                  </div>
                )}

                {/* Tip */}
                <p className="text-[10px] text-zinc-400 mt-1.5">
                  📸 First image is the primary display image. Drag to reorder thumbnails.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
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
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase text-zinc-500">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCustomCategory) {
                        setIsCustomCategory(true);
                        setCustomCategoryInput(formData.category === '__CUSTOM__' ? '' : formData.category);
                      } else {
                        setIsCustomCategory(false);
                        const fallbackCat = DEFAULT_PRODUCT_CATEGORIES.includes(formData.category)
                          ? formData.category
                          : 'Electronics';
                        setFormData((prev) => ({ ...prev, category: fallbackCat }));
                      }
                    }}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isCustomCategory ? '📋 Choose standard list' : '✍️ Type custom category'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      autoFocus
                      list="broker-category-suggestions"
                      placeholder="e.g. Solar Panels, Handicrafts, Raw Silk..."
                      value={customCategoryInput}
                      onChange={(e) => {
                        setCustomCategoryInput(e.target.value);
                        setFormData((prev) => ({ ...prev, category: e.target.value }));
                      }}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-zinc-400"
                    />
                    <datalist id="broker-category-suggestions">
                      {allKnownCategories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                    <p className="text-[11px] text-zinc-400">
                      Type any custom category or choose from autocomplete suggestions as you type.
                    </p>
                  </div>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomCategory(true);
                        setCustomCategoryInput('');
                      } else {
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <optgroup label="Standard Categories">
                      {DEFAULT_PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </optgroup>
                    {uniqueCustomExisting.length > 0 && (
                      <optgroup label="Previously Used Custom Categories">
                        {uniqueCustomExisting.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <option value="__CUSTOM__">✍️ + Type Custom Category...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter product features and deal terms..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingProduct ? (
                    'Save Changes'
                  ) : (
                    '🚀 Create Listing'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
