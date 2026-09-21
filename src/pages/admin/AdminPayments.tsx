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

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refundModal, setRefundModal] = useState<{ show: boolean; payment: PaymentRecord | null }>({
    show: false,
    payment: null,
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Razorpay Payment Gateway Monitoring</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time transaction tracking, payment statuses, and secure refund management.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
          <Lock className="w-3.5 h-3.5" />
          <span>Razorpay Integration Connected</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Transaction ID, Order ID, Customer..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {(['all', 'successful', 'pending', 'failed', 'refunded'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading payment records...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No payment transactions match filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-300">{p.transactionId}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{p.orderId}</td>
                    <td className="py-3.5 px-4 text-slate-200">{p.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-300">{p.brokerName}</td>
                    <td className="py-3.5 px-4 font-bold text-white">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.paymentMethod}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          p.status === 'Successful'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : p.status === 'Refunded'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : p.status === 'Failed'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{p.createdAt}</td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'Successful' ? (
                        <button
                          onClick={() => setRefundModal({ show: true, payment: p })}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold transition-all flex items-center space-x-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Refund</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No Action</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Process Razorpay Refund</h3>
                <p className="text-xs text-slate-400">Txn: {refundModal.payment.transactionId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              Are you sure you want to issue a full refund of{' '}
              <strong className="text-emerald-400">₹{refundModal.payment.amount.toLocaleString('en-IN')}</strong> to{' '}
              {refundModal.payment.customerName}?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRefundModal({ show: false, payment: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20"
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
