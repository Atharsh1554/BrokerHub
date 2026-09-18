import React, { useState } from 'react';
import { Search, Filter, Package, ChevronRight, Download, CheckCircle2, Truck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';
import type { Order } from '../../types';

export const OrderTracking: React.FC = () => {
  const { orders, updateOrderStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.product && order.product.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.items && order.items.some((item) => item.productName.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesStatus = selectedStatus === 'all' || order.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Order Tracking</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Monitor and update order status across all your broker sales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50" onClick={() => alert('Order CSV report exported successfully!')}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search order ID, buyer, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0 hidden sm:block" />
          {['all', 'pending', 'processing', 'in transit', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors shrink-0 cursor-pointer ${
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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-400">
                      No orders found matching criteria
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const orderTotal = order.totalAmount ?? order.amount ?? 0;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`cursor-pointer hover:bg-zinc-50 transition-colors ${
                          selectedOrder?.id === order.id ? 'bg-primary-50/50' : ''
                        }`}
                      >
                        <td className="p-4 font-semibold text-primary">
                          {order.id}
                        </td>
                        <td className="p-4 font-medium text-zinc-900">
                          {order.customerName}
                        </td>
                        <td className="p-4 text-zinc-500 text-xs">
                          {order.date}
                        </td>
                        <td className="p-4 font-semibold text-zinc-900">
                          ₹{orderTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
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
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-6">
          {selectedOrder ? (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900">{selectedOrder.id}</h3>
                  <p className="text-xs text-zinc-500">{selectedOrder.date}</p>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Customer Details</p>
                <div className="p-3 bg-zinc-50 rounded-xl space-y-1 border border-zinc-100">
                  <p className="font-semibold text-zinc-900 text-sm">{selectedOrder.customerName}</p>
                  <p className="text-xs text-zinc-500">Shipping: 123 Commercial Way, Suite 400</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Items ({selectedOrder.items ? selectedOrder.items.length : 1})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl text-xs border border-zinc-100">
                        <div>
                          <p className="font-medium text-zinc-900">{item.productName}</p>
                          <p className="text-zinc-400">Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}</p>
                        </div>
                        <span className="font-semibold text-zinc-900">
                          ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl text-xs border border-zinc-100">
                      <div>
                        <p className="font-medium text-zinc-900">{selectedOrder.product || 'Commercial Deal'}</p>
                        <p className="text-zinc-400">Qty: {selectedOrder.quantity || 1}</p>
                      </div>
                      <span className="font-semibold text-zinc-900">
                        ₹{(selectedOrder.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Breakdown */}
              {(() => {
                const total = selectedOrder.totalAmount ?? selectedOrder.amount ?? 0;
                return (
                  <div className="border-t border-zinc-100 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal</span>
                      <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Commission Fee</span>
                      <span className="text-emerald-600 font-medium">-₹{(total * 0.05).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-zinc-900 text-base pt-2 border-t border-zinc-100">
                      <span>Net Payout</span>
                      <span className="text-primary">₹{(total * 0.95).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Update Status Actions */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Update Order Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'In Transit');
                      setSelectedOrder({ ...selectedOrder, status: 'In Transit' });
                    }}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Mark Shipped
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs gap-1 bg-primary hover:bg-primary-dark text-white"
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'Delivered');
                      setSelectedOrder({ ...selectedOrder, status: 'Delivered' });
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Delivered
                  </Button>
                </div>
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
    </div>
  );
};
