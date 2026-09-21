import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Search, Filter, List, Grid } from 'lucide-react';
import { appointments as mockAppointments } from '../../data/mockData';
import type { Appointment } from '../../types';

export const AdminMeetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-fuchsia-400" />
            <span>Consultation & Meeting Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Oversee scheduled broker appointments, customer consultations, and meeting statuses.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'list' ? 'bg-fuchsia-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'calendar' ? 'bg-fuchsia-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Calendar Grid</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search broker, customer, meeting type..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
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
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Meeting ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Broker</th>
                  <th className="py-4 px-4">Consultation Type</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredMeetings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{m.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{m.customerName}</td>
                    <td className="py-3.5 px-4 text-fuchsia-400 font-semibold">{m.brokerName}</td>
                    <td className="py-3.5 px-4 text-slate-300">{m.type}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {m.date} at {m.time}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          m.status === 'Confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : m.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 truncate max-w-xs">{m.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredMeetings.map((m) => (
            <div key={m.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-fuchsia-400">{m.id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    m.status === 'Confirmed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{m.type}</h3>
              <div className="space-y-1 text-xs text-slate-300">
                <p>Client: <strong className="text-white">{m.customerName}</strong></p>
                <p>Broker: <strong className="text-fuchsia-300">{m.brokerName}</strong></p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>{m.date} • {m.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
