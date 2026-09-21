import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  Eye,
  ShieldAlert,
  X,
} from 'lucide-react';
import { getAdminCustomers, updateCustomerStatus } from '../../lib/api/admin';
import type { CustomerProfile } from '../../types';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    customer: CustomerProfile | null;
    targetStatus: 'active' | 'inactive' | 'suspended';
  }>({ show: false, customer: null, targetStatus: 'active' });

  const fetchCustomers = async () => {
    setLoading(true);
    const data = await getAdminCustomers();
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleStatusChange = async () => {
    if (confirmModal.customer) {
      await updateCustomerStatus(confirmModal.customer.id, confirmModal.targetStatus);
      setConfirmModal({ show: false, customer: null, targetStatus: 'active' });
      fetchCustomers();
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Customer Account Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, inspect, and manage registered customer profiles across BROKER HUB.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            Total Customers: {customers.length}
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {(['all', 'active', 'inactive', 'suspended'] as const).map((st) => (
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

      {/* Customer Directory Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading customers directory...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No customers found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">Reg Date</th>
                  <th className="py-4 px-4">Orders</th>
                  <th className="py-4 px-4">Brokers</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Last Active</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt={c.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <p className="font-semibold text-white">{c.fullName}</p>
                          <p className="text-[10px] text-slate-500">ID: {c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-300">{c.email}</p>
                      <p className="text-[11px] text-slate-500">{c.phone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{c.joinedDate}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-semibold">{c.totalOrders || 0}</td>
                    <td className="py-3.5 px-4 text-slate-300">{c.brokerConnectionsCount || 0}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border ${
                          c.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : c.status === 'suspended'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{c.lastActive || 'Recently'}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View Customer Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {c.status === 'active' ? (
                        <button
                          onClick={() => setConfirmModal({ show: true, customer: c, targetStatus: 'suspended' })}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Suspend Customer"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ show: true, customer: c, targetStatus: 'active' })}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                          title="Activate Customer"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile View Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 border-b border-slate-800 pb-5">
              <img
                src={selectedCustomer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                alt={selectedCustomer.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40"
              />
              <div>
                <h2 className="text-lg font-bold text-white">{selectedCustomer.fullName}</h2>
                <p className="text-xs text-slate-400">Customer ID: {selectedCustomer.id}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mt-1 uppercase">
                  {selectedCustomer.status} Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Email Address</span>
                <p className="font-semibold text-white truncate">{selectedCustomer.email}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Phone Number</span>
                <p className="font-semibold text-white">{selectedCustomer.phone}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Joined Date</span>
                <p className="font-semibold text-white">{selectedCustomer.joinedDate}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Total Lifetime Spend</span>
                <p className="font-semibold text-emerald-400">₹{(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Account Activity Metrics</h3>
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 divide-y divide-slate-800 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-400">Orders Placed</span>
                  <span className="font-semibold text-white">{selectedCustomer.totalOrders} orders</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-400">Broker Connections</span>
                  <span className="font-semibold text-white">{selectedCustomer.brokerConnectionsCount} active connections</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-400">Last Active Session</span>
                  <span className="font-semibold text-emerald-400">{selectedCustomer.lastActive}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && confirmModal.customer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm Account Status Modification</h3>
                <p className="text-xs text-slate-400">Target: {confirmModal.customer.fullName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              Are you sure you want to change this customer's account status to{' '}
              <strong className="text-amber-400 uppercase">{confirmModal.targetStatus}</strong>?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModal({ show: false, customer: null, targetStatus: 'active' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20"
              >
                Confirm Status Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
