import React, { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { getAdminActivityLogs } from '../../lib/api/admin';
import type { AdminActivityLog } from '../../types';

export const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Administrative Security Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable, audit-compliant trace of all administrative operations, logins, approvals, and moderations.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
          Total Logged Actions: {logs.length}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, target, or admin name..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No activity logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Admin Executor</th>
                  <th className="py-4 px-4">Administrative Action</th>
                  <th className="py-4 px-4">Target Entity</th>
                  <th className="py-4 px-4">Timestamp</th>
                  <th className="py-4 px-4 text-right">Device / IP Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{l.adminName}</p>
                      <p className="text-[10px] text-slate-500">{l.adminEmail}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-semibold text-[11px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{l.target}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right text-[11px] font-mono text-slate-400">
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
