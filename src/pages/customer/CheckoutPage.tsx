import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  User,
  ShoppingBag,
  AlertCircle,
  MapPin,
  Building2,
  Compass,
  Edit3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { createOrderInDB } from '../../lib/api/orders';
import type { ShippingAddress } from '../../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart, products, updateProduct, addOrder } = useApp();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    paymentMethod: 'cod', // cod | upi | card
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);

  useEffect(() => {
    if (user) {
      const line1 = user.addressLine1 || (user.address ? user.address.split(',')[0] : '');
      const hasAddr = Boolean(line1 && (user.city || user.pincode));

      setHasSavedAddress(hasAddr);
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        phone: user.phone || '',
        addressLine1: line1,
        addressLine2: user.addressLine2 || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        landmark: user.landmark || '',
      }));
    }
  }, [user]);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); }
  }, []);

  const handleRazorpayPayment = async (amount: number, dbOrder: any) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      // 1. Create order on backend
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount, receipt: dbOrder.id }
      });

      if (orderError) throw orderError;

      // 2. Open Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourKeyId', // Frontend only needs the public Key ID
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Broker Hub",
        description: "Order Payment",
        order_id: orderData.id,
        handler: async function (response: any) {
          // 3. Verify payment on backend
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: dbOrder.id
            }
          });

          if (verifyError || !verifyData.success) {
            alert('Payment verification failed!');
          } else {
            setOrderPlaced(true);
            clearCart();
          }
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
        },
        theme: {
          color: "#059669"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        alert("Payment Failed: " + response.error.description);
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay Error:', err);
      alert('Could not initialize payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.addressLine1.trim() || !formData.city.trim() || !formData.state.trim() || !formData.pincode.trim()) {
      alert('Please fill out all required delivery address fields before placing the order.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Properly reduce product inventory stock & status for each item bought
      for (const item of cart) {
        const targetProd = products.find((p) => p.id === item.productId);
        if (targetProd) {
          const currentStock = targetProd.stock ?? 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          const newStatus =
            newStock === 0
              ? 'Out of Stock'
              : newStock <= 10
              ? 'Low Stock'
              : 'In Stock';

          await updateProduct(item.productId, {
            stock: newStock,
            status: newStatus,
          });
        }
      }

      // 2. Prepare Order Address Snapshot
      const shippingAddressSnapshot: ShippingAddress = {
        fullName: formData.fullName || user?.fullName || 'Customer',
        phone: formData.phone || user?.phone || '',
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        landmark: formData.landmark,
      };

      const deliveryAddrStr = [
        formData.addressLine1,
        formData.addressLine2,
        formData.city,
        formData.state,
        formData.pincode,
        formData.landmark ? `(Landmark: ${formData.landmark})` : '',
      ]
        .filter(Boolean)
        .join(', ');

      // 3. Create permanent order with address snapshot in Supabase database
      const dbOrder = await createOrderInDB({
        customerId: user?.id || '',
        customerName: formData.fullName || user?.fullName || 'Customer',
        customerEmail: user?.email || '',
        customerPhone: formData.phone || user?.phone || '',
        totalAmount,
        paymentStatus: formData.paymentMethod === 'cod' ? 'Pending' : 'Processing',
        paymentMethod: formData.paymentMethod.toUpperCase(),
        deliveryAddress: deliveryAddrStr,
        shippingAddress: shippingAddressSnapshot,
        customerRequirements: formData.notes || '',
        items: cart.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          productImage: i.productImage,
          quantity: i.quantity,
          unitPrice: i.price,
          brokerId: i.brokerId,
          brokerName: i.brokerName,
        })),
      });

      const orderToSave = dbOrder || { id: `ORD-${Math.floor(1000 + Math.random() * 9000)}` };

      if (dbOrder) {
        addOrder(dbOrder);
      }
      
      // Trigger Razorpay if Online Payment selected
      if (formData.paymentMethod === 'upi' || formData.paymentMethod === 'card') {
        await handleRazorpayPayment(totalAmount, orderToSave);
        // Returns early so it doesn't clear cart and show success until Razorpay succeeds
        return; 
      }

      // COD Path
      setIsSubmitting(false);
      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      console.error('Checkout submit error:', err);
      setIsSubmitting(false);
    }
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
            <span className="text-gray-500 dark:text-gray-400">Delivery Address Snapshot</span>
            <span className="font-semibold text-gray-900 dark:text-white text-right max-w-xs">
              {formData.addressLine1}, {formData.city}, {formData.state} - {formData.pincode}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Total Value</span>
            <span className="font-bold text-gray-900 dark:text-white">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Link
            to="/customer/my-orders"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors"
          >
            View My Orders
          </Link>
          <Link
            to="/customer/products"
            className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Continue Shopping
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        </div>

        <Link
          to="/customer/settings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <Edit3 size={15} />
          Edit Profile Address
        </Link>
      </div>

      {/* Warning banner if no address saved in profile */}
      {!hasSavedAddress && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">No saved address found on your profile.</p>
              <p className="text-amber-700 dark:text-amber-300">
                Please complete your profile address details below or update your settings before placing the order.
              </p>
            </div>
          </div>
          <Link
            to="/customer/settings"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 transition-colors shrink-0 text-center"
          >
            Complete Profile
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Delivery Address Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User size={20} className="text-emerald-600 dark:text-emerald-400" />
                Delivery Address Verification
              </h2>
              <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800">
                Auto-Retrieved Profile Address
              </span>
            </div>

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

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={14} className="text-emerald-600" /> Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="House No., Building Name, Street"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Building2 size={14} className="text-gray-400" /> Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  placeholder="Apartment, Suite, Area, Sector"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Nagercoil"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="629001"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Compass size={14} className="text-gray-400" /> Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="Near Bus Stand / Opposite Temple"
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
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Broker: {item.brokerName}</div>
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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

