import React, { useState } from 'react';
import { X, Plus, Trash2, Gavel, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createReverseAuction } from '../../lib/api/reverseAuction';
import { useNotifications } from '../../context/NotificationContext';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Textiles & Fabrics',
  'Industrial Machinery',
  'Electronics & Tech',
  'Agriculture & Food',
  'Chemicals & Materials',
  'Automotive & Parts',
  'Construction Materials',
  'General',
];

export const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Textiles & Fabrics');
  const [quantity, setQuantity] = useState<number | ''>(100);
  const [unit, setUnit] = useState('units');
  const [startingPrice, setStartingPrice] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState(24);
  const [description, setDescription] = useState('');
  const [productImage, setProductImage] = useState('');
  const [specPairs, setSpecPairs] = useState<{ key: string; value: string }[]>([
    { key: 'Delivery Location', value: '' },
    { key: 'Quality Standard', value: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAddSpec = () => {
    setSpecPairs((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    setSpecPairs((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a requirement title.');
      return;
    }

    if (!startingPrice || Number(startingPrice) <= 0) {
      setErrorMsg('Please enter a valid starting / maximum target budget.');
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setErrorMsg('Please enter a valid quantity.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please provide a brief requirement description.');
      return;
    }

    setLoading(true);

    try {
      // Build specs object
      const specifications: Record<string, string> = {};
      specPairs.forEach((pair) => {
        if (pair.key.trim() && pair.value.trim()) {
          specifications[pair.key.trim()] = pair.value.trim();
        }
      });
      if (unit.trim()) {
        specifications['Unit'] = unit.trim();
      }

      const created = await createReverseAuction({
        customerId: user?.id || 'cust-guest',
        customerName: user?.fullName || 'Customer',
        customerEmail: user?.email,
        customerPhone: user?.phone,
        title: title.trim(),
        category,
        productName: title.trim(),
        productImage: productImage.trim() || undefined,
        quantity: Number(quantity),
        description: description.trim(),
        specifications,
        startingPrice: Number(startingPrice),
        durationHours: Number(durationHours),
      });

      // Dispatch notification
      await createNotification({
        broker_id: 'all_brokers',
        customer_id: user?.id || 'cust-guest',
        customer_name: user?.fullName || 'Customer',
        type: 'reverse_auction',
        title: 'New Reverse Auction Created',
        description: `Customer published auction: ${title} (Budget: ₹${Number(startingPrice).toLocaleString('en-IN')})`,
        is_read: false,
        status: 'pending',
        metadata: { auction_id: created.id },
      });

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Failed to create reverse auction. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-border flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-border flex items-center justify-between bg-gray-50/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Gavel size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Create Reverse Auction Request</h2>
              <p className="text-xs text-gray-label">Publish your requirement for verified brokers to bid lower prices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Requirement / Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bulk Combed Cotton Yarn 40s (5,000 kg)"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity, Unit & Starting Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 100"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. kg, units, meters"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Max Target Budget (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="350000"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Auction Duration */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Auction Duration</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: '6 Hours', hours: 6 },
                { label: '12 Hours', hours: 12 },
                { label: '24 Hours (1 Day)', hours: 24 },
                { label: '3 Days', hours: 72 },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.hours}
                  onClick={() => setDurationHours(opt.hours)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    durationHours === opt.hours
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-gray-border bg-white text-gray-text hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Requirement Description & Details <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail your requirements, acceptable quality standards, delivery timeline, or commercial terms..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          {/* Image URL optional */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Product Image URL (Optional)</label>
            <input
              type="url"
              value={productImage}
              onChange={(e) => setProductImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Specifications Key-Value Pairs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-primary">Key Specifications & Terms</label>
              <button
                type="button"
                onClick={handleAddSpec}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Spec Field
              </button>
            </div>
            <div className="space-y-2">
              {specPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Attribute (e.g. Material)"
                    value={pair.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-white border border-gray-border rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 100% Organic)"
                    value={pair.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-white border border-gray-border rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                  {specPairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-gray-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-border rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Gavel size={18} />
                  <span>Publish Reverse Auction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
