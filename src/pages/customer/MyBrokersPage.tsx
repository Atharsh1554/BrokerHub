import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Search, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';

export const MyBrokersPage: React.FC = () => {
  const { brokers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');

  const specialties = ['All', ...Array.from(new Set(brokers.map((b) => b.specialty)))];

  const filteredBrokers = brokers.filter((broker) => {
    const matchesSearch =
      broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.specialty.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpec = selectedSpecialty === 'All' || broker.specialty === selectedSpecialty;
    return matchesSearch && matchesSpec;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-border dark:border-slate-700 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-1">My Brokers</h1>
          <p className="text-sm text-gray-text dark:text-slate-400">View and manage your connected industry brokers</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-border dark:border-slate-700 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search broker name, specialty, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-border dark:border-slate-700 rounded-xl text-sm bg-gray-bg dark:bg-slate-900 text-text-primary dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-emerald-500 focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/20 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedSpecialty === spec
                  ? 'bg-primary dark:bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-bg dark:bg-slate-700/60 text-gray-text dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Broker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBrokers.map((broker) => (
          <div
            key={broker.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-border dark:border-slate-700 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {broker.avatar ? (
                    <img
                      src={broker.avatar}
                      alt={broker.name}
                      className="w-12 h-12 rounded-2xl object-cover shadow-xs border border-gray-100 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-teal-400 dark:from-emerald-600 dark:to-teal-500 text-white font-bold flex items-center justify-center text-base shadow-xs">
                      {broker.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-text-primary dark:text-white text-lg">{broker.name}</h3>
                    <p className="text-xs font-medium text-primary dark:text-emerald-400">{broker.specialty}</p>
                    <p className="text-xs text-gray-label dark:text-slate-400">{broker.company}</p>
                  </div>
                </div>
                <StatusBadge status={broker.status} size="sm" />
              </div>

              <p className="text-sm text-gray-text dark:text-slate-300 leading-relaxed mb-4">{broker.description}</p>

              <div className="flex items-center gap-1 text-sm bg-gray-bg dark:bg-slate-900 px-3 py-2 rounded-xl w-fit mb-4 border border-transparent dark:border-slate-700">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-text-primary dark:text-white">{broker.rating}</span>
                <span className="text-xs text-gray-label dark:text-slate-400">({broker.reviewCount} verified reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-border dark:border-slate-700">
              <Link to={`/customer/brokers/${broker.id}`} className="w-full">
                <Button variant="primary" size="sm" className="w-full text-xs gap-1">
                  <ExternalLink size={14} />
                  View Profile
                </Button>
              </Link>
              <Link to={`/customer/messages?brokerId=${broker.id}`} className="w-full">
                <Button variant="secondary" size="sm" className="w-full text-xs gap-1">
                  <MessageSquare size={14} />
                  Message
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
