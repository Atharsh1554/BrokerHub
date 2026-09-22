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
import { useAdminTheme } from '../../context/AdminThemeContext';

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

  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <ShoppingBag className="w-5 h-5 text-sky-500" />
            <span>Platform Orders & Fulfillment Oversight</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Track order life cycles, inspect payment states, and update fulfillment milestones securely.
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
        }`}>
          Total Orders: {orders.length}
        </span>
      </div>

      {/* Toolbar */}
      <div className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, Customer, Product..."
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none border ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-slate-800 border-slate-700 text-white'
            }`}
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
      <div className={`rounded-3xl border overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        {loading ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No orders found matching search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
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
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredOrders.map((o) => (
                  <tr key={o.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                  }`}>
                    <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{o.id}</td>
                    <td className={`py-3.5 px-4 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{o.customerName}</td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{o.brokerName || 'Marcus Chen'}</td>
                    <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      ₹{(o.amount || o.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          o.paymentStatus === 'Successful'
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : o.paymentStatus === 'Refunded'
                            ? isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                            : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {o.paymentStatus || 'Successful'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          o.status === 'Delivered' || o.status === 'COMPLETED'
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : o.status === 'Pending' || o.status === 'PENDING'
                            ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : o.status === 'Cancelled'
                            ? isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/30'
                            : isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{o.date}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title="View Full Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditStatusModal({ show: true, order: o, newStatus: o.status })}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                            : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400'
                        }`}
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <button
              onClick={() => setSelectedOrder(null)}
              className={`absolute top-5 right-5 p-1 rounded-lg ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`border-b pb-4 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Order Audit Overview</span>
              <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedOrder.id}</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Date: {selectedOrder.date}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Customer</span>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedOrder.customerName}</p>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Broker</span>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedOrder.brokerName || 'Marcus Chen'}</p>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Total Amount</span>
                <p className="font-bold text-emerald-600">₹{(selectedOrder.amount || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Payment Status</span>
                <p className="font-semibold text-sky-600">{selectedOrder.paymentStatus || 'Successful'}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className={`font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Purchased Items Breakdown</span>
              <div className={`p-3.5 rounded-2xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
              }`}>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <span>{item.productName} (x{item.quantity})</span>
                      <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <div className={`flex justify-between items-center ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <span>{selectedOrder.product || 'Quantum Smart Watch'} (x{selectedOrder.quantity || 1})</span>
                    <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{(selectedOrder.amount || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Confirmation Modal */}
      {editStatusModal.show && editStatusModal.order && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/20 text-sky-400'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Modify Order Status</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Order ID: {editStatusModal.order.id}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className={`block font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Select New Fulfillment Status:</label>
              <select
                value={editStatusModal.newStatus}
                onChange={(e) => setEditStatusModal({ ...editStatusModal, newStatus: e.target.value })}
                className={`w-full rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50 border ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <p className={`text-[11px] p-3 rounded-xl border flex items-start space-x-2 ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>Updating critical order statuses triggers customer notification alerts and audit logging.</span>
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditStatusModal({ show: false, order: null, newStatus: 'Pending' })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white shadow-md shadow-sky-500/20"
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
