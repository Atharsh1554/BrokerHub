import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Edit,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react';
import { getAdminOrders, updateOrderStatus } from '../../lib/api/admin';
import type { Order } from '../../types';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editStatusModal, setEditStatusModal] = useState<{
    show: boolean;
    order: Order | null;
    newStatus: string;
  }>({ show: false, order: null, newStatus: 'Pending' });

  const fetchOrders = async () => {
    setLoading(true);
    const data = await getAdminOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmStatusChange = async () => {
    if (editStatusModal.order) {
      await updateOrderStatus(editStatusModal.order.id, editStatusModal.newStatus);
      setEditStatusModal({ show: false, order: null, newStatus: 'Pending' });
      fetchOrders();
    }
  };

  const statusOptions = [
    'PENDING',
    'ACCEPTED',
    'PROCESSING',
    'SHIPPED',
    'COMPLETED',
    'Delivered',
    'CANCELLED',
    'REFUNDED',
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.product && o.product.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || o.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-sky-400" />
            <span>Platform Orders & Fulfillment Oversight</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track order life cycles, inspect payment states, and update fulfillment milestones securely.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
          Total Orders: {orders.length}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, Customer, Product..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Order Statuses</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Directory Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No orders found matching search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Order ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Broker Vendor</th>
                  <th className="py-4 px-4">Total Amount</th>
                  <th className="py-4 px-4">Payment Status</th>
                  <th className="py-4 px-4">Fulfillment Status</th>
                  <th className="py-4 px-4">Order Date</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{o.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{o.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-300">{o.brokerName || 'Marcus Chen'}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      ₹{(o.amount || o.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          o.paymentStatus === 'Successful'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : o.paymentStatus === 'Refunded'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {o.paymentStatus || 'Successful'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          o.status === 'Delivered' || o.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : o.status === 'Pending' || o.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : o.status === 'Cancelled'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{o.date}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View Full Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditStatusModal({ show: true, order: o, newStatus: o.status })}
                        className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors"
                        title="Update Order Status"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-4">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Order Audit Overview</span>
              <h2 className="text-lg font-bold text-white">{selectedOrder.id}</h2>
              <p className="text-xs text-slate-400">Date: {selectedOrder.date}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Customer</span>
                <p className="font-semibold text-white">{selectedOrder.customerName}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Broker</span>
                <p className="font-semibold text-white">{selectedOrder.brokerName || 'Marcus Chen'}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Total Amount</span>
                <p className="font-bold text-emerald-400">₹{(selectedOrder.amount || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Payment Status</span>
                <p className="font-semibold text-sky-400">{selectedOrder.paymentStatus || 'Successful'}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Purchased Items Breakdown</span>
              <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-300">
                      <span>{item.productName} (x{item.quantity})</span>
                      <span className="font-semibold text-white">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{selectedOrder.product || 'Quantum Smart Watch'} (x{selectedOrder.quantity || 1})</span>
                    <span className="font-semibold text-white">₹{(selectedOrder.amount || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Confirmation Modal */}
      {editStatusModal.show && editStatusModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Modify Order Status</h3>
                <p className="text-xs text-slate-400">Order ID: {editStatusModal.order.id}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-slate-300 font-semibold">Select New Fulfillment Status:</label>
              <select
                value={editStatusModal.newStatus}
                onChange={(e) => setEditStatusModal({ ...editStatusModal, newStatus: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Updating critical order statuses triggers customer notification alerts and audit logging.</span>
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditStatusModal({ show: false, order: null, newStatus: 'Pending' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-xs font-semibold text-white shadow-lg shadow-sky-500/20"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
