import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Search,
  Eye,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { getAdminBrokers, updateBrokerStatus } from '../../lib/api/admin';
import type { Broker } from '../../types';

export const AdminBrokers: React.FC = () => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified' | 'suspended'>('all');
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);

  const [modalAction, setModalAction] = useState<{
    show: boolean;
    broker: Broker | null;
    targetStatus: Broker['status'];
    title: string;
  }>({ show: false, broker: null, targetStatus: 'Verified', title: '' });

  const fetchBrokers = async () => {
    setLoading(true);
    const data = await getAdminBrokers();
    setBrokers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleConfirmStatusUpdate = async () => {
    if (modalAction.broker) {
      await updateBrokerStatus(modalAction.broker.id, modalAction.targetStatus);
      setModalAction({ show: false, broker: null, targetStatus: 'Verified', title: '' });
      fetchBrokers();
    }
  };

  const filteredBrokers = brokers.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.company.toLowerCase().includes(search.toLowerCase()) ||
      (b.email && b.email.toLowerCase().includes(search.toLowerCase()));

    if (activeTab === 'pending') {
      return matchesSearch && (b.status === 'Under Review' || b.status === 'Pending Match');
    }
    if (activeTab === 'verified') {
      return matchesSearch && (b.status === 'Connected' || b.status === 'Verified');
    }
    if (activeTab === 'suspended') {
      return matchesSearch && (b.status === 'Suspended' || b.status === 'Rejected');
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <span>Broker Accreditation & Verification Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review broker credentials, manage accreditation status, and audit business operations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            Total Brokers: {brokers.length}
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {[
            { key: 'all', label: 'All Brokers' },
            { key: 'pending', label: 'Pending Approval' },
            { key: 'verified', label: 'Verified Brokers' },
            { key: 'suspended', label: 'Suspended Brokers' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search broker name or firm..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Fetching brokers list...</div>
        ) : filteredBrokers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No brokers found in this category.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Broker / Firm</th>
                  <th className="py-4 px-4">Specialty</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Listings</th>
                  <th className="py-4 px-4">Total Sales</th>
                  <th className="py-4 px-4">Verification Status</th>
                  <th className="py-4 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredBrokers.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-400">
                          {b.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{b.name}</p>
                          <p className="text-[11px] text-slate-400">{b.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{b.specialty || 'Commercial'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-amber-400 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{b.rating}</span>
                        <span className="text-[10px] text-slate-500">({b.reviewCount})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{b.totalProducts || 5} products</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">₹{(b.totalSales || 250000).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border ${
                          b.status === 'Connected' || b.status === 'Verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : b.status === 'Under Review' || b.status === 'Pending Match'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedBroker(b)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View Broker Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {b.status !== 'Verified' && b.status !== 'Connected' && (
                        <button
                          onClick={() =>
                            setModalAction({
                              show: true,
                              broker: b,
                              targetStatus: 'Verified',
                              title: `Approve and accreditate broker ${b.name}`,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-medium transition-all"
                        >
                          Approve
                        </button>
                      )}

                      {b.status !== 'Suspended' && (
                        <button
                          onClick={() =>
                            setModalAction({
                              show: true,
                              broker: b,
                              targetStatus: 'Suspended',
                              title: `Suspend broker account ${b.name}`,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-medium transition-all"
                        >
                          Suspend
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

      {/* Broker Detailed Inspector Drawer Modal */}
      {selectedBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedBroker(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 border-b border-slate-800 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center font-bold text-xl text-indigo-400">
                {selectedBroker.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{selectedBroker.name}</h2>
                <p className="text-xs text-indigo-400 font-medium">{selectedBroker.company}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mt-1">
                  Status: {selectedBroker.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Broker Specialty</span>
                <p className="font-semibold text-white">{selectedBroker.specialty}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Business Rating</span>
                <p className="font-semibold text-amber-400">
                  {selectedBroker.rating} ★ ({selectedBroker.reviewCount} reviews)
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Location</span>
                <p className="font-semibold text-white">{selectedBroker.location || 'India'}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Total Sales Volume</span>
                <p className="font-semibold text-emerald-400">₹{(selectedBroker.totalSales || 350000).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Broker Description & Bio</span>
              <p className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-300 leading-relaxed">
                {selectedBroker.description || 'Specializing in high-value asset brokerage with extensive customer portfolio management.'}
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedBroker(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {modalAction.show && modalAction.broker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm Broker Status Update</h3>
                <p className="text-xs text-slate-400">{modalAction.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              Are you sure you want to change {modalAction.broker.name}'s accreditation status to{' '}
              <strong className="text-emerald-400 uppercase">{modalAction.targetStatus}</strong>? This action will be audit logged.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setModalAction({ show: false, broker: null, targetStatus: 'Verified', title: '' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusUpdate}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
