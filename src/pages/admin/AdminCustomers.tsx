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
import { useAdminTheme } from '../../context/AdminThemeContext';

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

  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Users className="w-5 h-5 text-emerald-500" />
            <span>Customer Account Management</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Search, inspect, and manage registered customer profiles across BROKER HUB.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
            isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            Total Customers: {customers.length}
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Status:</span>
          {(['all', 'active', 'inactive', 'suspended'] as const).map((st) => (
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

      {/* Customer Directory Table */}
      <div className={`rounded-3xl border overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        {loading ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading customers directory...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No customers found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
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
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                  }`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt={c.fullName}
                          className={`w-8 h-8 rounded-full object-cover border ${isLight ? 'border-slate-300' : 'border-slate-700'}`}
                        />
                        <div>
                          <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.fullName}</p>
                          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>ID: {c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{c.email}</p>
                      <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{c.phone}</p>
                    </td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{c.joinedDate}</td>
                    <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>{c.totalOrders || 0}</td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{c.brokerConnectionsCount || 0}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border ${
                          c.status === 'active'
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : c.status === 'suspended'
                            ? isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/30'
                            : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{c.lastActive || 'Recently'}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title="View Customer Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {c.status === 'active' ? (
                        <button
                          onClick={() => setConfirmModal({ show: true, customer: c, targetStatus: 'suspended' })}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isLight
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                          }`}
                          title="Suspend Customer"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ show: true, customer: c, targetStatus: 'active' })}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isLight
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          }`}
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <button
              onClick={() => setSelectedCustomer(null)}
              className={`absolute top-5 right-5 p-1 rounded-lg ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`flex items-center space-x-4 border-b pb-5 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
              <img
                src={selectedCustomer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                alt={selectedCustomer.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40"
              />
              <div>
                <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedCustomer.fullName}</h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Customer ID: {selectedCustomer.id}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 mt-1 uppercase">
                  {selectedCustomer.status} Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Email Address</span>
                <p className={`font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedCustomer.email}</p>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Phone Number</span>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedCustomer.phone}</p>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Joined Date</span>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedCustomer.joinedDate}</p>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Total Lifetime Spend</span>
                <p className="font-bold text-emerald-600">₹{(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Account Activity Metrics</h3>
              <div className={`p-4 rounded-2xl border divide-y text-xs ${
                isLight ? 'bg-slate-50 border-slate-200 divide-slate-200' : 'bg-slate-950/40 border-slate-800 divide-slate-800'
              }`}>
                <div className="py-2 flex justify-between">
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Orders Placed</span>
                  <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedCustomer.totalOrders} orders</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Broker Connections</span>
                  <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedCustomer.brokerConnectionsCount} active connections</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Last Active Session</span>
                  <span className="font-semibold text-emerald-600">{selectedCustomer.lastActive}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && confirmModal.customer && (
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
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Confirm Account Status Modification</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Target: {confirmModal.customer.fullName}</p>
              </div>
            </div>

            <p className={`text-xs p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
            }`}>
              Are you sure you want to change this customer's account status to{' '}
              <strong className="text-amber-600 uppercase">{confirmModal.targetStatus}</strong>?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModal({ show: false, customer: null, targetStatus: 'active' })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20"
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
