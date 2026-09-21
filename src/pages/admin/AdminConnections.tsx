import React, { useEffect, useState } from 'react';
import { Link2, Search, Filter } from 'lucide-react';
import { getAdminConnections } from '../../lib/api/admin';
import type { BrokerCustomerConnection } from '../../types';

export const AdminConnections: React.FC = () => {
  const [connections, setConnections] = useState<BrokerCustomerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Accepted' | 'Pending' | 'Rejected'>('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getAdminConnections();
      setConnections(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredConnections = connections.filter((c) => {
    const matchesSearch =
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.brokerName.toLowerCase().includes(search.toLowerCase()) ||
      c.brokerCompany.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Link2 className="w-5 h-5 text-indigo-400" />
            <span>Broker-Customer Connection Monitoring</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Privacy-respecting administrative monitoring of broker-client pairing requests.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
          Total Connections: {connections.length}
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Customer or Broker name..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {(['all', 'Accepted', 'Pending', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading connection metadata...</div>
        ) : filteredConnections.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No connection requests match filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Connection ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Broker / Firm</th>
                  <th className="py-4 px-4">Pairing Status</th>
                  <th className="py-4 px-4">Request Date</th>
                  <th className="py-4 px-4 text-right">Privacy Notice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredConnections.map((conn) => (
                  <tr key={conn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{conn.id}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{conn.customerName}</p>
                      <p className="text-[10px] text-slate-500">{conn.customerEmail}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-indigo-400">{conn.brokerName}</p>
                      <p className="text-[10px] text-slate-500">{conn.brokerCompany}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          conn.status === 'Accepted'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : conn.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {conn.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{conn.requestDate}</td>
                    <td className="py-3.5 px-4 text-right text-[11px] text-slate-500 italic">
                      Metadata Only (End-to-End Encrypted)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
