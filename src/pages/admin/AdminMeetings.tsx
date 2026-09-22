import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Search, Filter, List, Grid } from 'lucide-react';
import { appointments as mockAppointments } from '../../data/mockData';
import type { Appointment } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminMeetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const formatted: Appointment[] = mockAppointments.map((a, idx) => ({
      ...a,
      id: `mtg-${100 + idx}`,
      customerName: idx % 2 === 0 ? 'Alice Johnson' : 'Mark Stevens',
      status: a.status as any,
      createdAt: '2026-01-14',
    }));
    setMeetings(formatted);
  }, []);

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.brokerName.toLowerCase().includes(search.toLowerCase()) ||
      (m.customerName && m.customerName.toLowerCase().includes(search.toLowerCase())) ||
      m.type.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || m.status.toLowerCase() === statusFilter.toLowerCase();

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
            <Calendar className="w-5 h-5 text-fuchsia-500" />
            <span>Consultation & Meeting Management</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Oversee scheduled broker appointments, customer consultations, and meeting statuses.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className={`flex items-center space-x-2 p-1.5 rounded-2xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-fuchsia-600 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'calendar'
                ? 'bg-fuchsia-600 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Calendar Grid</span>
          </button>
        </div>
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
            placeholder="Search broker, customer, meeting type..."
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Status:</span>
          {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20'
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

      {/* View Output */}
      {viewMode === 'list' ? (
        <div className={`rounded-3xl border overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <th className="py-4 px-4">Meeting ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Broker</th>
                  <th className="py-4 px-4">Consultation Type</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredMeetings.map((m) => (
                  <tr key={m.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                  }`}>
                    <td className={`py-3.5 px-4 font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{m.id}</td>
                    <td className={`py-3.5 px-4 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{m.customerName}</td>
                    <td className="py-3.5 px-4 text-fuchsia-600 font-bold">{m.brokerName}</td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{m.type}</td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {m.date} at {m.time}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          m.status === 'Confirmed'
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : m.status === 'Pending'
                            ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right truncate max-w-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{m.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredMeetings.map((m) => (
            <div key={m.id} className={`p-5 rounded-3xl border space-y-3 transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-fuchsia-600">{m.id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    m.status === 'Confirmed'
                      ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{m.type}</h3>
              <div className={`space-y-1 text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                <p>Client: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{m.customerName}</strong></p>
                <p>Broker: <strong className="text-fuchsia-600">{m.brokerName}</strong></p>
              </div>
              <div className={`p-3 rounded-2xl border text-xs flex items-center space-x-2 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <Clock className="w-4 h-4 text-fuchsia-500 shrink-0" />
                <span>{m.date} • {m.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
