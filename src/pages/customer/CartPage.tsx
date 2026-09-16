import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useApp();

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400">
          <ShoppingCart size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Cart is Empty</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Explore products listed by top brokers and add them to your cart to proceed with your inquiry or order.
        </p>
        <Link
          to="/customer/products"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-sm"
        >
          <ArrowLeft size={18} />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Shopping Cart
            <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-slate-800 dark:text-gray-400 px-3 py-1 rounded-full">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 hover:underline"
        >
          <Trash2 size={16} />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.productId}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:shadow-md"
            >
              <img
                src={item.productImage || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80'}
                alt={item.productName}
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100 dark:bg-slate-700"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                  <Building2 size={14} />
                  <span>Broker: {item.brokerName}</span>
                </div>
                <Link
                  to={`/customer/products/${item.productId}`}
                  className="text-lg font-bold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 line-clamp-1"
                >
                  {item.productName}
                </Link>
                <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-lg mt-1">
                  ₹{item.price.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-100 dark:border-slate-700 sm:border-0">
                <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900">
                  <button
                    onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-l-lg text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-semibold text-gray-900 dark:text-white text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-r-lg text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Side Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 sticky top-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Broker Service Fee</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Estimated Taxes & Verification</span>
                <span className="text-gray-500 dark:text-gray-400">Calculated at checkout</span>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between items-center text-base font-extrabold text-gray-900 dark:text-white">
                <span>Total Amount</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xl">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/customer/checkout')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            <div className="pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-center">
              <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Verified Broker Guarantees & Secure Transactions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
