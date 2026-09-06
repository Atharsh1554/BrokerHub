import React, { useState } from 'react';
import { Calendar, Clock, Plus, Video, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';

export const AppointmentsPage: React.FC = () => {
  const { appointments, addAppointment, cancelAppointment, brokers } = useApp();
  const [filter, setFilter] = useState<'all' | 'Confirmed' | 'Pending' | 'Cancelled'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [brokerName, setBrokerName] = useState(brokers[0]?.name || 'Marcus Chen');
  const [date, setDate] = useState('2026-01-25');
  const [time, setTime] = useState('10:00 AM');
  const [type, setType] = useState('Strategy Session');
  const [notes, setNotes] = useState('');

  const filteredAppointments = appointments.filter(
    (app) => filter === 'all' || app.status === filter
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerName || !date) return;

    addAppointment({
      brokerName,
      date,
      time,
      type,
      status: 'Confirmed',
      notes,
    });

    setIsModalOpen(false);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-border shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Appointments</h1>
          <p className="text-sm text-gray-text">Schedule and manage consultations with your brokers</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Book Consultation
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2">
        {(['all', 'Confirmed', 'Pending', 'Cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
              filter === status
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-gray-text border border-gray-border hover:bg-gray-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAppointments.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-2xl border border-gray-border p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 text-primary font-bold flex items-center justify-center text-sm">
                    {app.brokerName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{app.brokerName}</h3>
                    <p className="text-xs text-gray-label">{app.type}</p>
                  </div>
                </div>
                <StatusBadge status={app.status} size="sm" />
              </div>

              <div className="space-y-2 bg-gray-50 p-3 rounded-xl mb-4 text-xs">
                <div className="flex items-center gap-2 text-gray-text">
                  <Calendar size={14} className="text-primary" />
                  <span>{app.date}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-text">
                  <Clock size={14} className="text-primary" />
                  <span>{app.time}</span>
                </div>
                {app.notes && (
                  <p className="text-gray-label italic border-t border-gray-200 pt-2 mt-2">
                    "{app.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={() => alert(`Launching Video Consultation Room with ${app.brokerName}...`)}
              >
                <Video size={14} />
                Join Room
              </Button>
              {app.status !== 'Cancelled' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-red-600 hover:bg-red-50"
                  onClick={() => cancelAppointment(app.id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Book Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-gray-border">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-text-primary mb-4">Book Broker Consultation</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-label mb-1">
                  Select Broker
                </label>
                <select
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-border rounded-xl text-sm bg-white"
                >
                  {brokers.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-label mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-label mb-1">Time</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-border rounded-xl text-sm bg-white"
                  >
                    <option>09:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:30 AM</option>
                    <option>02:00 PM</option>
                    <option>04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-label mb-1">Consultation Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portfolio Strategy & Deal Review"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-label mb-1">Notes / Agenda</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what you'd like to discuss..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Confirm Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
