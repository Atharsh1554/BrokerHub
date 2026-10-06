import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RotateCcw,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Coins,
  Check,
} from 'lucide-react';
import { getAdminPayments, processPaymentRefund } from '../../lib/api/admin';
import type { PaymentRecord } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { supabase } from '../../lib/supabase';
import type { BrokerPaymentDetails } from '../../lib/api/paymentDetails';
import {
  getAllBrokersPaymentDetailsMap,
  maskUpiId,
  maskAccountNumber,
} from '../../lib/api/paymentDetails';

export const AdminPayments: React.FC = () => {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Active Tab: 'settlements' | 'gateway'
  const [activeTab, setActiveTab] = useState<'settlements' | 'gateway'>('settlements');

  // --- Gateway Tab State ---
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [gatewaySearch, setGatewaySearch] = useState('');
  const [gatewayStatusFilter, setGatewayStatusFilter] = useState<string>('all');
  const [refundModal, setRefundModal] = useState<{ show: boolean; payment: PaymentRecord | null }>({
    show: false,
    payment: null,
  });

  // --- Settlements Tab State ---
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentDetailsMap, setPaymentDetailsMap] = useState<Map<string, BrokerPaymentDetails>>(new Map());
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [settlementSearch, setSettlementSearch] = useState('');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState<string>('all'); // all | pending | settled
  const [unmaskedRows, setUnmaskedRows] = useState<Record<string, boolean>>({});
  const [settlingOrderId, setSettlingOrderId] = useState<string | null>(null);

  // Fetch Gateway Payments
  const fetchGatewayPayments = async () => {
    setGatewayLoading(true);
    const data = await getAdminPayments();
    setPayments(data);
    setGatewayLoading(false);
  };

  // Fetch Orders & Payment Details for Settlements
  const fetchSettlementOrders = useCallback(async () => {
    setSettlementsLoading(true);
    try {
      // Fetch orders from Supabase DB
      const { data: orderRows, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && orderRows) {
        setOrders(orderRows);
      } else {
        // Fallback query if schema cache issue
        const { data: fallbackRows } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (fallbackRows) setOrders(fallbackRows);
      }

      // Fetch all broker payment details
      const detailsMap = await getAllBrokersPaymentDetailsMap();
      setPaymentDetailsMap(detailsMap);
    } catch (err) {
      console.error('[AdminPayments] Error fetching settlement orders:', err);
    } finally {
      setSettlementsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGatewayPayments();
    fetchSettlementOrders();
  }, [fetchSettlementOrders]);

  // Handle Mark as Settled
  const handleMarkAsSettled = async (orderId: string) => {
    setSettlingOrderId(orderId);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('orders')
        .update({
          settlement_status: 'Settled',
          settlement_date: now,
          updated_at: now,
        })
        .eq('id', orderId);

      if (error) {
        console.warn('DB update failed, applying optimistic update:', error);
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, settlement_status: 'Settled', settlement_date: now } : o))
      );
    } catch (err) {
      console.error('Error marking order settled:', err);
    } finally {
      setSettlingOrderId(null);
    }
  };

  const handleProcessRefund = async () => {
    if (refundModal.payment) {
      await processPaymentRefund(refundModal.payment.id);
      setRefundModal({ show: false, payment: null });
      fetchGatewayPayments();
    }
  };

  const toggleUnmaskRow = (orderId: string) => {
    setUnmaskedRows((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Filter Gateway Payments
  const filteredGatewayPayments = payments.filter((p) => {
    const matchesSearch =
      p.transactionId.toLowerCase().includes(gatewaySearch.toLowerCase()) ||
      p.orderId.toLowerCase().includes(gatewaySearch.toLowerCase()) ||
      p.customerName.toLowerCase().includes(gatewaySearch.toLowerCase()) ||
      p.brokerName.toLowerCase().includes(gatewaySearch.toLowerCase());

    const matchesStatus = gatewayStatusFilter === 'all' || p.status.toLowerCase() === gatewayStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Filter Settlement Orders
  const filteredSettlementOrders = orders.filter((o) => {
    const brokerName = o.broker_name || o.brokerName || '';
    const customerName = o.customer_name || o.customerName || '';
    const orderId = o.id || '';

    const matchesSearch =
      orderId.toLowerCase().includes(settlementSearch.toLowerCase()) ||
      brokerName.toLowerCase().includes(settlementSearch.toLowerCase()) ||
      customerName.toLowerCase().includes(settlementSearch.toLowerCase());

    const statusStr = (o.settlement_status || 'Pending Admin Settlement').toLowerCase();
    let matchesStatus = true;
    if (settlementStatusFilter === 'pending') {
      matchesStatus = statusStr.includes('pending');
    } else if (settlementStatusFilter === 'settled') {
      matchesStatus = statusStr === 'settled';
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Coins className="w-5 h-5 text-emerald-500" />
            <span>Payments & Broker Settlements</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Manage manual broker payouts, verify UPI/bank details, and track customer Razorpay payments.
          </p>
        </div>

        {/* Tab Selector */}
        <div
          className={`flex items-center p-1 rounded-2xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}
        >
          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settlements'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Broker Settlements
          </button>
          <button
            onClick={() => setActiveTab('gateway')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gateway'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Razorpay Gateway Logs
          </button>
        </div>
      </div>

      {/* TAB 1: BROKER SETTLEMENTS (MANUAL PAYOUTS) */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/30'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <p className={`font-bold ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>
                Manual Broker Settlement Workflow (₹0 Platform Commission)
              </p>
              <p className={isLight ? 'text-blue-700' : 'text-blue-400'}>
                1. Customer pays the full amount via Razorpay into your merchant account.
                <br />
                2. Broker Hub takes ₹0 commission, so <strong>Broker Amount = Customer Paid Amount</strong>.
                <br />
                3. Click the eye icon next to a broker's saved payment details to reveal their full UPI ID or Bank Account details for your manual bank/UPI transfer.
                <br />
                4. Once you complete the manual payout, click <strong>Mark as Settled</strong> to update the order status.
              </p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div
            className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
            }`}
          >
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={settlementSearch}
                onChange={(e) => setSettlementSearch(e.target.value)}
                placeholder="Search Order ID, Broker, Customer..."
                className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                    : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
                }`}
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <span className={`text-xs font-semibold shrink-0 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Settlement Status:
              </span>
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'pending', label: 'Pending Admin Settlement' },
                { key: 'settled', label: 'Settled' },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setSettlementStatusFilter(st.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settlementStatusFilter === st.key
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
              <button
                onClick={fetchSettlementOrders}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh settlements"
              >
                <RefreshCw className={`w-4 h-4 ${settlementsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Settlements Table */}
          <div
            className={`rounded-3xl border overflow-hidden transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
            }`}
          >
            {settlementsLoading ? (
              <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Loading broker settlement records...
              </div>
            ) : filteredSettlementOrders.length === 0 ? (
              <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                No order settlements found matching filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <th className="py-4 px-4">Order ID</th>
                      <th className="py-4 px-4">Broker</th>
                      <th className="py-4 px-4">Customer</th>
                      <th className="py-4 px-4">Paid Amount</th>
                      <th className="py-4 px-4">Commission</th>
                      <th className="py-4 px-4">Broker Amount</th>
                      <th className="py-4 px-4">Settlement Status</th>
                      <th className="py-4 px-4">Broker Payment Method</th>
                      <th className="py-4 px-4">Paid Date</th>
                      <th className="py-4 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                    {filteredSettlementOrders.map((o) => {
                      const total = o.total_amount ?? o.totalAmount ?? o.amount ?? 0;
                      const platformComm = o.platform_commission ?? o.platformCommission ?? 0;
                      const brokerAmt = o.broker_amount ?? o.brokerAmount ?? total;
                      const brokerName = o.broker_name || o.brokerName || 'Verified Broker';
                      const brokerId = o.broker_id || o.brokerId || '';
                      
                      // Perform comprehensive lookup across all mapped keys (ID, name, normalized name, default)
                      const cleanBrokerName = brokerName.toLowerCase().replace(/[^a-z0-9]/g, '');
                      const rawPayDetails =
                        paymentDetailsMap.get(brokerId) ||
                        paymentDetailsMap.get(brokerId.toLowerCase()) ||
                        paymentDetailsMap.get(brokerName) ||
                        paymentDetailsMap.get(brokerName.toLowerCase()) ||
                        paymentDetailsMap.get(cleanBrokerName) ||
                        paymentDetailsMap.get('__DEFAULT__');
                      
                      const payDetails: BrokerPaymentDetails | null = rawPayDetails || null;

                      const isUnmasked = unmaskedRows[o.id];

                      const settlementStatus = o.settlement_status || 'Pending Admin Settlement';
                      const isSettled = settlementStatus === 'Settled';

                      return (
                        <tr
                          key={o.id}
                          className={`transition-colors ${
                            isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                          }`}
                        >
                          {/* Order ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{o.id}</td>

                          {/* Broker */}
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {o.broker_name || o.brokerName || 'Verified Broker'}
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {o.customer_name || o.customerName || 'Customer'}
                          </td>

                          {/* Paid Amount */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            ₹{total.toLocaleString('en-IN')}
                          </td>

                          {/* Commission */}
                          <td className="py-3.5 px-4 font-semibold text-emerald-600">
                            ₹{platformComm} (0%)
                          </td>

                          {/* Broker Amount */}
                          <td className="py-3.5 px-4 font-black text-emerald-700 dark:text-emerald-400">
                            ₹{brokerAmt.toLocaleString('en-IN')}
                          </td>

                          {/* Settlement Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                                isSettled
                                  ? isLight
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : isLight
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {settlementStatus}
                            </span>
                          </td>

                          {/* Broker Payment Method & Info */}
                          <td className="py-3.5 px-4 max-w-64">
                            {!payDetails ? (
                              <span className="text-amber-600 font-semibold text-[11px]">No payment details saved</span>
                            ) : payDetails.paymentMethod === 'upi' ? (
                              <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div>
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase">UPI</span>
                                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                    {isUnmasked ? payDetails.upiId : maskUpiId(payDetails.upiId)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleUnmaskRow(o.id)}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                  title={isUnmasked ? 'Mask details' : 'Unmask full UPI ID'}
                                >
                                  {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="text-[11px]">
                                  <span className="text-[10px] font-bold text-blue-600 uppercase">BANK</span>
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                                    {payDetails.bankName || 'Bank'} ({payDetails.accountHolderName})
                                  </p>
                                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                    A/c: {isUnmasked ? payDetails.accountNumber : maskAccountNumber(payDetails.accountNumber)} | IFSC: {payDetails.ifscCode}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleUnmaskRow(o.id)}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                  title={isUnmasked ? 'Mask account number' : 'Unmask full account number'}
                                >
                                  {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Paid Date */}
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                            {o.created_at || o.date ? new Date(o.created_at || o.date).toLocaleDateString('en-IN') : 'N/A'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            {isSettled ? (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                  <Check className="w-3.5 h-3.5" /> Settled
                                </span>
                                {o.settlement_date && (
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(o.settlement_date).toLocaleDateString('en-IN')}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkAsSettled(o.id)}
                                disabled={settlingOrderId === o.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                {settlingOrderId === o.id ? 'Settling...' : 'Mark as Settled'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RAZORPAY GATEWAY LOGS */}
      {activeTab === 'gateway' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div
            className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
            }`}
          >
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={gatewaySearch}
                onChange={(e) => setGatewaySearch(e.target.value)}
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
              <span className={`text-xs font-semibold shrink-0 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Status:
              </span>
              {(['all', 'successful', 'pending', 'failed', 'refunded'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setGatewayStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    gatewayStatusFilter === st
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
          <div
            className={`rounded-3xl border overflow-hidden transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
            }`}
          >
            {gatewayLoading ? (
              <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Loading payment records...
              </div>
            ) : filteredGatewayPayments.length === 0 ? (
              <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                No payment transactions match filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
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
                    {filteredGatewayPayments.map((p) => (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                        }`}
                      >
                        <td className={`py-3.5 px-4 font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                          {p.transactionId}
                        </td>
                        <td className={`py-3.5 px-4 font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {p.orderId}
                        </td>
                        <td className={`py-3.5 px-4 font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {p.customerName}
                        </td>
                        <td className={`py-3.5 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{p.brokerName}</td>
                        <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td className={`py-3.5 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{p.paymentMethod}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              p.status === 'Successful'
                                ? isLight
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : p.status === 'Refunded'
                                ? isLight
                                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                                : p.status === 'Failed'
                                ? isLight
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                                : isLight
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
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
                            <span className={`text-[11px] italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                              No Action
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal.show && refundModal.payment && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
          }`}
        >
          <div
            className={`border rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Process Razorpay Refund</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Txn: {refundModal.payment.transactionId}
                </p>
              </div>
            </div>

            <p
              className={`text-xs p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
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

export default AdminPayments;
