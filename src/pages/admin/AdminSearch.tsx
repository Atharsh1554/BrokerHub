import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, User, Briefcase, Layers } from 'lucide-react';
import { getAdminCustomers, getAdminBrokers, getAdminProducts, getAdminOrders, getAdminPayments } from '../../lib/api/admin';
import type { CustomerProfile, Broker, Product, Order, PaymentRecord } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [searched, setSearched] = useState(false);

  const [matchedCustomers, setMatchedCustomers] = useState<CustomerProfile[]>([]);
  const [matchedBrokers, setMatchedBrokers] = useState<Broker[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);
  const [matchedPayments, setMatchedPayments] = useState<PaymentRecord[]>([]);

  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setSearched(true);
    const q = searchTerm.toLowerCase();

    const [customers, brokers, products, orders, payments] = await Promise.all([
      getAdminCustomers(),
      getAdminBrokers(),
      getAdminProducts(),
      getAdminOrders(),
      getAdminPayments(),
    ]);

    setMatchedCustomers(customers.filter((c) => c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)));
    setMatchedBrokers(brokers.filter((b) => b.name.toLowerCase().includes(q) || b.company.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)));
    setMatchedProducts(products.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
    setMatchedOrders(orders.filter((o) => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || (o.product && o.product.toLowerCase().includes(q))));
    setMatchedPayments(payments.filter((p) => p.transactionId.toLowerCase().includes(q) || p.orderId.toLowerCase().includes(q)));
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
    performSearch(query);
  };

  return (
    <div className="space-y-8">
      {/* Title Header & Big Input */}
      <div className={`p-8 rounded-3xl border space-y-6 transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Search className="w-5 h-5 text-emerald-500" />
            <span>Deep Cross-Entity Platform Search</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Search any ID, name, transaction reference or keyword to view the complete relational chain (Customer → Broker → Product → Payment → Status).
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type Order ID (e.g. ORD-7841), Customer name, Transaction ID..."
            className={`w-full rounded-2xl pl-12 pr-28 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                : 'bg-slate-950 border-slate-700/80 text-white placeholder-slate-500'
            }`}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results View */}
      {searched && (
        <div className="space-y-8">
          {/* Linked Chain Visualizer for Orders */}
          {matchedOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Connected Entity Chains</span>
              </h2>

              <div className="space-y-4">
                {matchedOrders.map((order) => (
                  <div key={order.id} className={`p-5 rounded-3xl border space-y-4 transition-all ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
                  }`}>
                    <div className={`flex justify-between items-center border-b pb-3 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                      <span className={`font-mono text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Order: {order.id}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${
                        isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs items-center">
                      <div className={`p-3 rounded-2xl border ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>1. Customer</span>
                        <p className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{order.customerName}</p>
                      </div>
                      <div className={`hidden md:flex justify-center font-bold ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>→</div>
                      <div className={`p-3 rounded-2xl border ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>2. Broker</span>
                        <p className="font-bold text-indigo-600 truncate">{order.brokerName || 'Marcus Chen'}</p>
                      </div>
                      <div className={`hidden md:flex justify-center font-bold ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>→</div>
                      <div className={`p-3 rounded-2xl border ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>3. Payment & Amount</span>
                        <p className="font-bold text-emerald-600 truncate">₹{(order.amount || order.totalAmount || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Entity Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customers */}
            <div className={`p-5 rounded-3xl border space-y-3 transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className={`text-xs font-bold uppercase flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                <User className="w-4 h-4 text-emerald-500" />
                <span>Customers ({matchedCustomers.length})</span>
              </h3>
              {matchedCustomers.map((c) => (
                <div key={c.id} className={`p-3 rounded-2xl border flex justify-between items-center text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div>
                    <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.fullName}</p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{c.email}</p>
                  </div>
                  <Link to="/admin/customers" className="text-emerald-600 hover:underline font-bold">View</Link>
                </div>
              ))}
            </div>

            {/* Brokers */}
            <div className={`p-5 rounded-3xl border space-y-3 transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className={`text-xs font-bold uppercase flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span>Brokers ({matchedBrokers.length})</span>
              </h3>
              {matchedBrokers.map((b) => (
                <div key={b.id} className={`p-3 rounded-2xl border flex justify-between items-center text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div>
                    <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{b.name}</p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{b.company}</p>
                  </div>
                  <Link to="/admin/brokers" className="text-indigo-600 hover:underline font-bold">View</Link>
                </div>
              ))}
            </div>

            {/* Products */}
            <div className={`p-5 rounded-3xl border space-y-3 transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className={`text-xs font-bold uppercase flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                <User className="w-4 h-4 text-violet-500" />
                <span>Products ({matchedProducts.length})</span>
              </h3>
              {matchedProducts.map((p) => (
                <div key={p.id} className={`p-3 rounded-2xl border flex justify-between items-center text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div>
                    <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.name}</p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>₹{p.price.toLocaleString('en-IN')} • {p.category}</p>
                  </div>
                  <Link to="/admin/products" className="text-violet-600 hover:underline font-bold">View</Link>
                </div>
              ))}
            </div>

            {/* Payments */}
            <div className={`p-5 rounded-3xl border space-y-3 transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className={`text-xs font-bold uppercase flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                <User className="w-4 h-4 text-teal-500" />
                <span>Payments ({matchedPayments.length})</span>
              </h3>
              {matchedPayments.map((p) => (
                <div key={p.id} className={`p-3 rounded-2xl border flex justify-between items-center text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div>
                    <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.transactionId}</p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>₹{p.amount.toLocaleString('en-IN')} • {p.status}</p>
                  </div>
                  <Link to="/admin/payments" className="text-teal-600 hover:underline font-bold">View</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
