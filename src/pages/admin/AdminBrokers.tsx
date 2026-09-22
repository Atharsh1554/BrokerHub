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
import { useAdminTheme } from '../../context/AdminThemeContext';

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

  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Briefcase className="w-5 h-5 text-indigo-500" />
            <span>Broker Accreditation & Verification Management</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Review broker credentials, manage accreditation status, and audit business operations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
            isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
          }`}>
            Total Brokers: {brokers.length}
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
      }`}>
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
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
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
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-3xl border overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        {loading ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Fetching brokers list...</div>
        ) : filteredBrokers.length === 0 ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No brokers found in this category.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <th className="py-4 px-4">Broker / Firm</th>
                  <th className="py-4 px-4">Specialty</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Listings</th>
                  <th className="py-4 px-4">Total Sales</th>
                  <th className="py-4 px-4">Verification Status</th>
                  <th className="py-4 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredBrokers.map((b) => (
                  <tr key={b.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                  }`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {b.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{b.name}</p>
                          <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{b.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{b.specialty || 'Commercial'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{b.rating}</span>
                        <span className={`text-[10px] font-normal ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>({b.reviewCount})</span>
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{b.totalProducts || 5} products</td>
                    <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>₹{(b.totalSales || 250000).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border ${
                          b.status === 'Connected' || b.status === 'Verified'
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : b.status === 'Under Review' || b.status === 'Pending Match'
                            ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                            : isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedBroker(b)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                        }`}
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
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-xs shadow-xs"
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
                          className={`px-2.5 py-1 rounded-lg font-bold border text-xs transition-all ${
                            isLight
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                              : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40'
                          }`}
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <button
              onClick={() => setSelectedBroker(null)}
              className={`absolute top-5 right-5 p-1 rounded-lg ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`flex items-center space-x-4 border-b pb-5 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl ${
                isLight ? 'bg-indigo-50 border-2 border-indigo-200 text-indigo-700' : 'bg-indigo-500/20 border-2 border-indigo-500/40 text-indigo-400'
              }`}>
                {selectedBroker.name.charAt(0)}
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedBroker.name}</h2>
                <p className="text-xs text-indigo-600 font-bold">{selectedBroker.company}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 mt-1">
                  Status: {selectedBroker.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Broker Specialty</span>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedBroker.specialty}</p>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Business Rating</span>
                <p className="font-bold text-amber-500">
                  {selectedBroker.rating} ★ ({selectedBroker.reviewCount} reviews)
                </p>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Location</span>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedBroker.location || 'India'}</p>
              </div>
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Total Sales Volume</span>
                <p className="font-bold text-emerald-600">₹{(selectedBroker.totalSales || 350000).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className={`font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Broker Description & Bio</span>
              <p className={`p-3.5 rounded-2xl border leading-relaxed ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/40 border-slate-800 text-slate-300'
              }`}>
                {selectedBroker.description || 'Specializing in high-value asset brokerage with extensive customer portfolio management.'}
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedBroker(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {modalAction.show && modalAction.broker && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
          isLight ? 'bg-slate-900/40' : 'bg-slate-950/80'
        }`}>
          <div className={`border rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-400'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Confirm Broker Status Update</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{modalAction.title}</p>
              </div>
            </div>

            <p className={`text-xs p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
            }`}>
              Are you sure you want to change {modalAction.broker.name}'s accreditation status to{' '}
              <strong className="text-emerald-600 uppercase">{modalAction.targetStatus}</strong>? This action will be audit logged.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setModalAction({ show: false, broker: null, targetStatus: 'Verified', title: '' })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusUpdate}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-500/20"
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
