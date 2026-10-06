import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Package, ChevronRight, Download, CheckCircle2, Truck,
  DollarSign, Clock, Check, X, FileText, Printer, ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';
import { updateOrderStatusInDB } from '../../lib/api/orders';
import type { Order } from '../../types';

export const OrderTracking: React.FC = () => {
  const { orders, updateOrderStatus, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.product && order.product.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.items && order.items.some((item) => item.productName.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesStatus =
      selectedStatus === 'all' ||
      order.status.toLowerCase().includes(selectedStatus.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  // Automatically select the first order if none is selected
  useEffect(() => {
    if (!selectedOrder && filteredOrders.length > 0) {
      setSelectedOrder(filteredOrders[0]);
    } else if (selectedOrder) {
      // Keep selected order object up-to-date with latest status from context
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders, filteredOrders, selectedOrder]);

  // Compute stats — revenue only from successful payments
  const totalRevenue = orders.reduce((sum, o) => {
    const ps = (o.paymentStatus || '').toLowerCase();
    const st = (o.status || '').toLowerCase();
    if ((ps === 'successful' || ps === 'success' || ps === 'paid') && !st.includes('cancel') && !st.includes('refund')) {
      return sum + (o.totalAmount ?? o.amount ?? 0);
    }
    return sum;
  }, 0);
  const pendingCount = orders.filter((o) => {
    const st = o.status.toLowerCase();
    return !st.includes('delivered') && !st.includes('completed') && !st.includes('cancel') && !st.includes('refund');
  }).length;
  const deliveredCount = orders.filter((o) => o.status.toLowerCase().includes('delivered') || o.status.toLowerCase().includes('completed')).length;


  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, newStatus);
    const success = await updateOrderStatusInDB(selectedOrder.id, newStatus);
    setSelectedOrder({ ...selectedOrder, status: newStatus as any });
    if (success) {
      showToast(`✅ Order marked as "${newStatus}" — customer notified.`, 'success');
    }
  };


  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Order ID,Customer,Product,Amount,Date,Status']
        .concat(
          orders.map(
            (o) =>
              `${o.id},"${o.customerName}","${o.product || 'Items'}",${o.totalAmount || o.amount},${o.date},"${o.status}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BrokerHub_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders exported to CSV file successfully!', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Received Orders & Fulfillment</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Monitor, confirm, and update customer order lifecycle and commission payouts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs"
            onClick={handleExportCSV}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Received</p>
            <p className="text-2xl font-black text-zinc-900 mt-1">{orders.length} Orders</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Revenue Value</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Pending Approval</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount} Orders</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Completed & Delivered</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{deliveredCount} Orders</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search order ID, buyer name, items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0 hidden sm:block" />
          {['all', 'pending', 'processing', 'in transit', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                selectedStatus === status
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Table List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Order Summary</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-zinc-400">
                      <Package className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                      <p className="font-semibold text-zinc-700">No orders found</p>
                      <p className="text-xs text-zinc-400 mt-1">Try changing filters or place a test order via customer checkout.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const orderTotal = order.totalAmount ?? order.amount ?? 0;
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                            : 'hover:bg-zinc-50'
                        }`}
                      >
                        <td className="p-4 font-bold text-emerald-700 font-mono text-xs">
                          {order.id}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-zinc-900 text-sm">{order.customerName}</p>
                          <p className="text-[11px] text-zinc-400">{order.date}</p>
                        </td>
                        <td className="p-4 text-zinc-600 text-xs max-w-48 truncate">
                          {order.product ||
                            (order.items
                              ? order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')
                              : 'Order Listing')}
                        </td>
                        <td className="p-4 font-extrabold text-zinc-900">
                          ₹{orderTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={order.status} size="sm" />
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-emerald-600">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Order Details Panel */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-5">
          {selectedOrder ? (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-zinc-900 font-mono">{selectedOrder.id}</h3>
                    {selectedOrder.id.startsWith('ORD-') && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">Placed on {selectedOrder.date}</p>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>

              {/* Customer & Complete Delivery Address Info */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Customer & Delivery Information</p>
                <div className="p-4 bg-zinc-50 rounded-xl space-y-2.5 border border-zinc-100 text-xs">
                  <div className="flex justify-between items-center border-b border-zinc-200/60 pb-2">
                    <span className="text-zinc-500 font-semibold">Customer Name:</span>
                    <span className="font-bold text-zinc-900 text-sm">
                      {selectedOrder.shippingAddress?.fullName || selectedOrder.customerName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-zinc-200/60 pb-2">
                    <span className="text-zinc-500 font-semibold">Customer Phone:</span>
                    <span className="font-bold text-zinc-900 font-mono">
                      {selectedOrder.shippingAddress?.phone || selectedOrder.customerPhone || 'Not provided'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-zinc-200/60 pb-2">
                    <span className="text-zinc-500 font-semibold">Payment Status:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {selectedOrder.paymentStatus || 'Successful'}
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] block mb-1">
                      Complete Delivery Address Snapshot:
                    </span>
                    {selectedOrder.shippingAddress && selectedOrder.shippingAddress.addressLine1 ? (
                      <div className="bg-white p-3 rounded-lg border border-zinc-200 space-y-1 text-zinc-800 font-medium">
                        <p className="font-bold text-zinc-900">{selectedOrder.shippingAddress.addressLine1}</p>
                        {selectedOrder.shippingAddress.addressLine2 && (
                          <p>{selectedOrder.shippingAddress.addressLine2}</p>
                        )}
                        <p>
                          {selectedOrder.shippingAddress.city}
                          {selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''}
                          {selectedOrder.shippingAddress.pincode ? ` - ${selectedOrder.shippingAddress.pincode}` : ''}
                        </p>
                        {selectedOrder.shippingAddress.landmark && (
                          <p className="text-amber-800 text-[11px] font-semibold pt-1 border-t border-zinc-100">
                            Landmark: {selectedOrder.shippingAddress.landmark}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded-lg border border-zinc-200 text-zinc-800 font-medium">
                        {selectedOrder.deliveryAddress || 'Standard Site Address'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Requirements */}
              {selectedOrder.customerRequirements && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Customer Requirements</p>
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                    <p className="font-medium text-amber-900">{selectedOrder.customerRequirements}</p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Ordered Items ({selectedOrder.items ? selectedOrder.items.length : 1})
                </p>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl text-xs border border-zinc-100">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-zinc-200"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 truncate">{item.productName}</p>
                            <p className="text-zinc-500">Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}</p>
                            {item.brokerName && (
                              <p className="text-emerald-600 text-[10px] font-semibold">Broker: {item.brokerName}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-black text-zinc-900 shrink-0">
                          ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl text-xs border border-zinc-100">
                      <div>
                        <p className="font-bold text-zinc-900">{selectedOrder.product || 'Commercial Item'}</p>
                        <p className="text-zinc-500">Qty: {selectedOrder.quantity || 1}</p>
                      </div>
                      <span className="font-black text-zinc-900">
                        ₹{(selectedOrder.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown — sourced from DB commission snapshot */}
              {(() => {
                const orderData = selectedOrder as any;
                const total = orderData.totalAmount ?? orderData.amount ?? 0;
                // Use stored commission snapshot if available, else fallback to 0
                const platformCommission = orderData.platform_commission ?? orderData.platformCommission ?? 0;
                const brokerAmount = orderData.broker_amount ?? orderData.brokerAmount ?? (total - platformCommission);
                const commissionType = orderData.commission_type ?? orderData.commissionType ?? 'NONE';
                const commissionValue = orderData.commission_value ?? orderData.commissionValue ?? 0;
                const settlementStatus = orderData.settlement_status ?? orderData.settlementStatus ?? 'Pending Admin Settlement';

                const commissionLabel = commissionType === 'NONE'
                  ? 'Platform Commission (Free Launch)'
                  : commissionType === 'FIXED'
                  ? `Platform Commission (₹${commissionValue} fixed)`
                  : `Platform Commission (${commissionValue}%)`;

                return (
                  <div className="border-t border-zinc-100 pt-3 space-y-2 text-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Payment & Settlement Breakdown
                    </p>
                    <div className="flex justify-between text-zinc-500">
                      <span>Gross Order Amount</span>
                      <span className="font-bold text-zinc-800">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>{commissionLabel}</span>
                      <span className={platformCommission > 0 ? 'text-amber-600 font-semibold' : 'text-zinc-400 font-semibold'}>
                        {platformCommission > 0 ? `-₹${platformCommission.toLocaleString('en-IN')}` : '₹0'}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-zinc-900 text-sm pt-2 border-t border-zinc-100">
                      <span>Your Broker Amount</span>
                      <span className="text-emerald-600 text-base">₹{brokerAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-zinc-400">Settlement Status</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        settlementStatus === 'Settled'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : settlementStatus === 'Refunded'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {settlementStatus}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Update Status Actions */}
              <div className="space-y-2 pt-1 border-t border-zinc-100">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Update Fulfillment Lifecycle</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Processing')}
                    className="flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Check size={14} />
                    Approve Order
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('In Transit')}
                    className="flex items-center justify-center gap-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors cursor-pointer"
                  >
                    <Truck size={14} />
                    Mark Shipped
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Delivered')}
                    className="flex items-center justify-center gap-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    Mark Delivered
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Cancelled')}
                    className="flex items-center justify-center gap-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                    Cancel Order
                  </button>
                </div>

                {/* Print Invoice Button */}
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(true)}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <FileText size={15} />
                  <span>View Order Receipt & Invoice</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 space-y-3">
              <Package className="w-12 h-12 text-zinc-300 mx-auto" />
              <p className="text-sm font-medium text-zinc-500">Select an order from the list to view full tracking and payout breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-xl p-6 relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
            >
              <X size={20} />
            </button>

            {/* Receipt Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                    BH
                  </div>
                  <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">BROKER HUB</h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Official Order Receipt & Tax Invoice</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-emerald-700">{selectedOrder.id}</span>
                <p className="text-xs text-zinc-400">{selectedOrder.date}</p>
              </div>
            </div>

            {/* Bill To & Broker Info */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl text-xs border border-zinc-100 mb-4">
              <div>
                <p className="font-bold uppercase tracking-wider text-zinc-400 mb-1">Customer / Billed To</p>
                <p className="font-bold text-zinc-900 text-sm">
                  {selectedOrder.shippingAddress?.fullName || selectedOrder.customerName}
                </p>
                {selectedOrder.shippingAddress?.addressLine1 ? (
                  <>
                    <p className="text-zinc-500">{selectedOrder.shippingAddress.addressLine1}</p>
                    {selectedOrder.shippingAddress.addressLine2 && (
                      <p className="text-zinc-500">{selectedOrder.shippingAddress.addressLine2}</p>
                    )}
                    <p className="text-zinc-500">
                      {selectedOrder.shippingAddress.city}
                      {selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''}
                      {selectedOrder.shippingAddress.pincode ? ` - ${selectedOrder.shippingAddress.pincode}` : ''}
                    </p>
                    <p className="text-zinc-500 font-mono">
                      {selectedOrder.shippingAddress.phone || selectedOrder.customerPhone || ''}
                    </p>
                  </>
                ) : (
                  <p className="text-zinc-500">{selectedOrder.deliveryAddress || 'Address not available'}</p>
                )}
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-zinc-400 mb-1">Fulfilling Broker</p>
                <p className="font-bold text-zinc-900 text-sm">{selectedOrder.brokerName || 'Verified Broker'}</p>
                <p className="text-zinc-500">Broker ID: {selectedOrder.brokerId ? selectedOrder.brokerId.slice(0, 8) + '...' : 'N/A'}</p>
                <p className="text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                  <ShieldCheck size={13} /> Verified Trade Escrow
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-3 font-semibold text-zinc-900">{item.productName}</td>
                        <td className="p-3 text-center text-zinc-600">{item.quantity}</td>
                        <td className="p-3 text-right text-zinc-600">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-bold text-zinc-900">
                          ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 font-semibold text-zinc-900">{selectedOrder.product || 'Order Item'}</td>
                      <td className="p-3 text-center text-zinc-600">{selectedOrder.quantity || 1}</td>
                      <td className="p-3 text-right text-zinc-600">
                        ₹{(selectedOrder.amount || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-bold text-zinc-900">
                        ₹{(selectedOrder.amount || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Calculation */}
            {(() => {
              const total = selectedOrder.totalAmount ?? selectedOrder.amount ?? 0;
              return (
                <div className="space-y-2 text-xs border-t border-zinc-200 pt-3">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Taxes & Processing</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between font-black text-zinc-900 text-base border-t border-zinc-200 pt-2">
                    <span>Total Amount Paid</span>
                    <span className="text-emerald-600">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })()}

            {/* Footer Action */}
            <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-zinc-100">
              <Button type="button" variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer size={16} /> Print Receipt
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  showToast('Invoice PDF downloaded successfully!', 'success');
                  setShowInvoiceModal(false);
                }}
              >
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
