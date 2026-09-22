import React, { useEffect, useState } from 'react';
import { Link2, Search, Filter } from 'lucide-react';
import { getAdminConnections } from '../../lib/api/admin';
import type { BrokerCustomerConnection } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminConnections: React.FC = () => {
  const [connections, setConnections] = useState<BrokerCustomerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Accepted' | 'Pending' | 'Rejected'>('all');
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Link2 className="w-5 h-5 text-indigo-500" />
            <span>Broker-Customer Connection Monitoring</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Privacy-respecting administrative monitoring of broker-client pairing requests.
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
        }`}>
          Total Connections: {connections.length}
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Customer or Broker name..."
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Status:</span>
          {(['all', 'Accepted', 'Pending', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
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

      {/* Directory Table */}
      <div className={`rounded-3xl border overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        {loading ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading connection metadata...</div>
        ) : filteredConnections.length === 0 ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No connection requests match filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <th className="py-4 px-4">Connection ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Broker / Firm</th>
                  <th className="py-4 px-4">Pairing Status</th>
                  <th className="py-4 px-4">Request Date</th>
                  <th className="py-4 px-4 text-right">Privacy Notice</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredConnections.map((conn) => (
                  <tr key={conn.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                  }`}>
                    <td className={`py-3.5 px-4 font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{conn.id}</td>
                    <td className="py-3.5 px-4">
                      <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{conn.customerName}</p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{conn.customerEmail}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-indigo-600">{conn.brokerName}</p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{conn.brokerCompany}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          conn.status === 'Accepted'
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : conn.status === 'Pending'
                            ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {conn.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{conn.requestDate}</td>
                    <td className={`py-3.5 px-4 text-right text-[11px] italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
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
