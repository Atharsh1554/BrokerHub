import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, User, Briefcase, Layers } from 'lucide-react';
import { getAdminCustomers, getAdminBrokers, getAdminProducts, getAdminOrders, getAdminPayments } from '../../lib/api/admin';
import type { CustomerProfile, Broker, Product, Order, PaymentRecord } from '../../types';

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
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <span>Deep Cross-Entity Platform Search</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
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
            className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all"
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
              <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Connected Entity Chains</span>
              </h2>

              <div className="space-y-4">
                {matchedOrders.map((order) => (
                  <div key={order.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <span className="font-mono text-sm font-bold text-white">Order: {order.id}</span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs items-center">
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">1. Customer</span>
                        <p className="font-bold text-white truncate">{order.customerName}</p>
                      </div>
                      <div className="hidden md:flex justify-center text-slate-600">→</div>
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">2. Broker</span>
                        <p className="font-bold text-indigo-400 truncate">{order.brokerName || 'Marcus Chen'}</p>
                      </div>
                      <div className="hidden md:flex justify-center text-slate-600">→</div>
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">3. Payment & Amount</span>
                        <p className="font-bold text-emerald-400 truncate">₹{(order.amount || order.totalAmount || 0).toLocaleString('en-IN')}</p>
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
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center space-x-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Customers ({matchedCustomers.length})</span>
              </h3>
              {matchedCustomers.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-white">{c.fullName}</p>
                    <p className="text-[10px] text-slate-500">{c.email}</p>
                  </div>
                  <Link to="/admin/customers" className="text-emerald-400 hover:underline font-semibold">View</Link>
                </div>
              ))}
            </div>

            {/* Brokers */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Brokers ({matchedBrokers.length})</span>
              </h3>
              {matchedBrokers.map((b) => (
                <div key={b.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-white">{b.name}</p>
                    <p className="text-[10px] text-slate-500">{b.company}</p>
                  </div>
                  <Link to="/admin/brokers" className="text-indigo-400 hover:underline font-semibold">View</Link>
                </div>
              ))}
            </div>

            {/* Products */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center space-x-2">
                <User className="w-4 h-4 text-violet-400" />
                <span>Products ({matchedProducts.length})</span>
              </h3>
              {matchedProducts.map((p) => (
                <div key={p.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-500">₹{p.price.toLocaleString('en-IN')} • {p.category}</p>
                  </div>
                  <Link to="/admin/products" className="text-violet-400 hover:underline font-semibold">View</Link>
                </div>
              ))}
            </div>

            {/* Payments */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center space-x-2">
                <User className="w-4 h-4 text-teal-400" />
                <span>Payments ({matchedPayments.length})</span>
              </h3>
              {matchedPayments.map((p) => (
                <div key={p.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-white">{p.transactionId}</p>
                    <p className="text-[10px] text-slate-500">₹{p.amount.toLocaleString('en-IN')} • {p.status}</p>
                  </div>
                  <Link to="/admin/payments" className="text-teal-400 hover:underline font-semibold">View</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
