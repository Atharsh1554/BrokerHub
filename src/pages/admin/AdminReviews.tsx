import React, { useEffect, useState } from 'react';
import { MessageSquareQuote, Star, Search, Filter } from 'lucide-react';
import { getAdminReviews, updateReviewStatus } from '../../lib/api/admin';
import type { AdminReviewItem } from '../../types';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Published' | 'Hidden' | 'Reported'>('all');
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const fetchReviews = async () => {
    setLoading(true);
    const data = await getAdminReviews();
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusChange = async (reviewId: string, newStatus: 'Published' | 'Hidden' | 'Reported') => {
    await updateReviewStatus(reviewId, newStatus);
    fetchReviews();
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      (r.productName && r.productName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

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
            <MessageSquareQuote className="w-5 h-5 text-amber-500" />
            <span>Customer Reviews & Feedback Moderation</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Audit customer feedback, flag inappropriate content, and maintain platform review standards.
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          Total Reviews: {reviews.length}
        </span>
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
            placeholder="Search customer, comment, product..."
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 border transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white placeholder-slate-400'
                : 'bg-slate-800 border-slate-700/80 text-white placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Status:</span>
          {(['all', 'Published', 'Hidden', 'Reported'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
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

      {/* Reviews Table */}
      <div className={`rounded-3xl border overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        {loading ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading feedback records...</div>
        ) : filteredReviews.length === 0 ? (
          <div className={`p-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No reviews found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Target (Broker / Product)</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Review Content</th>
                  <th className="py-4 px-4">Moderation Status</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredReviews.map((r) => (
                  <tr key={r.id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-800/40 text-slate-200'
                  }`}>
                    <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{r.customerName}</td>
                    <td className="py-3.5 px-4">
                      {r.productName ? (
                        <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Product: {r.productName}</span>
                      ) : (
                        <span className={`font-bold ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>Broker: {r.brokerName}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{r.rating}/5</span>
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 max-w-sm italic ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>"{r.comment}"</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          r.status === 'Published'
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : r.status === 'Reported'
                            ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                            : isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{r.createdAt}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {r.status === 'Published' ? (
                        <button
                          onClick={() => handleStatusChange(r.id, 'Hidden')}
                          className={`px-2.5 py-1 rounded-lg font-bold border text-xs transition-all ${
                            isLight
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          Hide Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(r.id, 'Published')}
                          className={`px-2.5 py-1 rounded-lg font-bold border text-xs transition-all ${
                            isLight
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          Restore Review
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
    </div>
  );
};
