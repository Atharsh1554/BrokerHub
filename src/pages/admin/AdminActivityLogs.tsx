import React, { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { getAdminActivityLogs } from '../../lib/api/admin';
import type { AdminActivityLog } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await getAdminActivityLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.adminName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <History className="w-5 h-5 text-indigo-500" />
            <span>Administrative Security Audit Logs</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Immutable, audit-compliant trace of all administrative operations, logins, approvals, and moderations.
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
        }`}>
          Total Logged Actions: {logs.length}
        </span>
      </div>

      {/* Toolbar */}
      <div className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-white'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, target, or admin name..."
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
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No activity logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <th className="py-4 px-4">Admin Executor</th>
                  <th className="py-4 px-4">Administrative Action</th>
                  <th className="py-4 px-4">Target Entity</th>
                  <th className="py-4 px-4">Timestamp</th>
                  <th className="py-4 px-4 text-right">Device / IP Metadata</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredLogs.map((l) => (
                  <tr key={l.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                  }`}>
                    <td className="py-3.5 px-4">
                      <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{l.adminName}</p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{l.adminEmail}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg border font-bold text-[11px] ${
                        isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{l.target}</td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{new Date(l.timestamp).toLocaleString()}</td>
                    <td className={`py-3.5 px-4 text-right text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {l.ipAddress} ({l.device || 'Web App'})
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
