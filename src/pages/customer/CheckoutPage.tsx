import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  User,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart } = useApp();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: '',
    address: '',
    city: 'Mumbai',
    pincode: '400001',
    paymentMethod: 'cod', // cod | upi | card
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate order placement
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderPlaced(true);
      clearCart();
    }, 1200);
  };

  if (orderPlaced) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-16 space-y-6">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Order Confirmed!</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your order / inquiry request has been successfully transmitted to the respective broker(s). They will contact you shortly regarding fulfillment and delivery details.
        </p>

        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 text-left space-y-3 border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Status</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Pending Broker Approval</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Delivery Contact</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formData.fullName} ({formData.phone})</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Total Value</span>
            <span className="font-bold text-gray-900 dark:text-white">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Link
            to="/customer/products"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            to="/customer/messages"
            className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Message Brokers
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Items to Checkout</h2>
        <Link
          to="/customer/products"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg mt-4 font-semibold"
        >
          <ArrowLeft size={18} />
          Return to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Shipping Info Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <User size={20} className="text-emerald-600 dark:text-emerald-400" />
              Contact & Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Delivery / Site Address *
              </label>
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, building, apartment/suite number"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
              <CreditCard size={20} className="text-emerald-600 dark:text-emerald-400" />
              Payment Preference
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Broker Direct Payment / Cash on Delivery</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pay directly to the broker upon inspection or delivery</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={formData.paymentMethod === 'upi'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">UPI / Online Transfer</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">GPay, PhonePe, Paytm or Netbanking</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary & Submit Button */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 sticky top-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
              Items in Order
            </h2>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 dark:border-slate-700/50">
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{item.productName}</div>
                    <div className="text-gray-500 dark:text-gray-400">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-slate-700">
                <span>Total Payable</span>
                <span className="text-emerald-600 dark:text-emerald-400">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  <span>Confirm & Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
