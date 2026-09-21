import React, { useEffect, useState } from 'react';
import { MessageSquareQuote, Star, Search, Filter } from 'lucide-react';
import { getAdminReviews, updateReviewStatus } from '../../lib/api/admin';
import type { AdminReviewItem } from '../../types';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Published' | 'Hidden' | 'Reported'>('all');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <MessageSquareQuote className="w-5 h-5 text-amber-400" />
            <span>Customer Reviews & Feedback Moderation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit customer feedback, flag inappropriate content, and maintain platform review standards.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          Total Reviews: {reviews.length}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, comment, product..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {(['all', 'Published', 'Hidden', 'Reported'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading feedback records...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No reviews found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Target (Broker / Product)</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Review Content</th>
                  <th className="py-4 px-4">Moderation Status</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{r.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {r.productName ? (
                        <span className="text-emerald-400 font-medium">Product: {r.productName}</span>
                      ) : (
                        <span className="text-indigo-400 font-medium">Broker: {r.brokerName}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{r.rating}/5</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-sm italic">"{r.comment}"</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          r.status === 'Published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : r.status === 'Reported'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{r.createdAt}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {r.status === 'Published' ? (
                        <button
                          onClick={() => handleStatusChange(r.id, 'Hidden')}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold transition-all"
                        >
                          Hide Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(r.id, 'Published')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold transition-all"
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
