import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { getAdminPayments, processPaymentRefund } from '../../lib/api/admin';
import type { PaymentRecord } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refundModal, setRefundModal] = useState<{ show: boolean; payment: PaymentRecord | null }>({
    show: false,
    payment: null,
  });
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const fetchPayments = async () => {
    setLoading(true);
    const data = await getAdminPayments();
    setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleProcessRefund = async () => {
    if (refundModal.payment) {
      await processPaymentRefund(refundModal.payment.id);
      setRefundModal({ show: false, payment: null });
      fetchPayments();
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      p.orderId.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.brokerName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <span>Razorpay Payment Gateway Monitoring</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-time transaction tracking, payment statuses, and secure refund management.
          </p>
        </div>
        <div className={`flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-xl border ${
          isLight
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Razorpay Integration Connected</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Transaction ID, Order ID, Customer..."
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className={`text-xs font-semibold shrink-0 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Status:</span>
          {(['all', 'successful', 'pending', 'failed', 'refunded'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-3xl border overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        {loading ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading payment records...</div>
        ) : filteredPayments.length === 0 ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No payment transactions match filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <th className="py-4 px-4">Transaction ID</th>
                  <th className="py-4 px-4">Order ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Broker</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Method</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Date / Time</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                  }`}>
                    <td className={`py-3.5 px-4 font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>{p.transactionId}</td>
                    <td className={`py-3.5 px-4 font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.orderId}</td>
                    <td className={`py-3.5 px-4 font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{p.customerName}</td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{p.brokerName}</td>
                    <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{p.paymentMethod}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          p.status === 'Successful'
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : p.status === 'Refunded'
                            ? isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                            : p.status === 'Failed'
                            ? isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/30'
                            : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{p.createdAt}</td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'Successful' ? (
                        <button
                          onClick={() => setRefundModal({ show: true, payment: p })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1 ml-auto border ${
                            isLight
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Refund</span>
                        </button>
                      ) : (
                        <span className={`text-[11px] italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No Action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundModal.show && refundModal.payment && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Process Razorpay Refund</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Txn: {refundModal.payment.transactionId}</p>
              </div>
            </div>

            <p className={`text-xs p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
            }`}>
              Are you sure you want to issue a full refund of{' '}
              <strong className="text-emerald-600">₹{refundModal.payment.amount.toLocaleString('en-IN')}</strong> to{' '}
              {refundModal.payment.customerName}?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRefundModal({ show: false, payment: null })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20"
              >
                Issue Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
