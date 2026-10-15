import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Send,
  X,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  getBrokerReviews,
  submitReview,
  calculateRatingStats,
  checkOrderReviewed,
  type Review,
  type RatingStats,
} from '../../lib/api/reviews';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import type { Order } from '../../types';

interface BrokerReviewsSectionProps {
  brokerId: string;
  brokerName?: string;
  onStatsChange?: (stats: RatingStats) => void;
  preselectedOrderId?: string;
}

export const BrokerReviewsSection: React.FC<BrokerReviewsSectionProps> = ({
  brokerId,
  brokerName = 'Broker',
  onStatsChange,
  preselectedOrderId,
}) => {
  const { user } = useAuth();
  const { orders } = useApp();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Form States
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(preselectedOrderId || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Eligible completed orders for this broker
  const completedOrders = useMemo(() => {
    return orders.filter((order: Order) => {
      const isUserOrder = !user || order.customerId === user.id || !order.customerId;
      const bMatch =
        order.brokerId === brokerId ||
        (order.brokerName &&
          brokerName &&
          order.brokerName.toLowerCase() === brokerName.toLowerCase());
      const st = (order.status || '').toLowerCase();
      const isCompleted =
        st.includes('deliver') || st.includes('complet') || st.includes('accept');
      return isUserOrder && bMatch && isCompleted;
    });
  }, [orders, user, brokerId, brokerName]);

  const fetchReviews = async () => {
    if (!brokerId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getBrokerReviews(brokerId);
      setReviews(data);
      const computedStats = calculateRatingStats(data);
      onStatsChange?.(computedStats);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError('Failed to load live reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();

    const handleUpdate = (e: any) => {
      if (!e.detail?.brokerId || e.detail.brokerId === brokerId) {
        fetchReviews();
      }
    };

    window.addEventListener('brokerhub_reviews_updated', handleUpdate);
    return () => {
      window.removeEventListener('brokerhub_reviews_updated', handleUpdate);
    };
  }, [brokerId]);

  const stats = useMemo(() => calculateRatingStats(reviews), [reviews]);

  // Star label helpers
  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return 'Excellent';
      case 4:
        return 'Very Good';
      case 3:
        return 'Good';
      case 2:
        return 'Fair';
      case 1:
        return 'Poor';
      default:
        return 'Select Rating';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user) {
      setSubmitError('Please sign in as a customer to submit a review.');
      return;
    }

    if (!comment.trim()) {
      setSubmitError('Please provide a comment explaining your experience.');
      return;
    }

    if (selectedOrderId) {
      const alreadyReviewed = await checkOrderReviewed(selectedOrderId);
      if (alreadyReviewed) {
        setSubmitError('You have already submitted a review for this completed order.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await submitReview({
        brokerId,
        orderId: selectedOrderId || undefined,
        rating,
        comment: comment.trim(),
      });

      setSubmitSuccess('Thank you! Your verified review has been published live.');
      setComment('');
      setRating(5);
      setSelectedOrderId('');
      setShowForm(false);
      await fetchReviews();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === 'all') return reviews;
    return reviews.filter((r) => Math.round(r.rating) === selectedStarFilter);
  }, [reviews, selectedStarFilter]);

  return (
    <div id="reviews-section" className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            Client Reviews & Ratings
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Real feedback and performance metrics from verified buyers
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              alert('Please sign in as a customer to submit a review.');
              return;
            }
            setShowForm(!showForm);
            setSubmitError(null);
            setSubmitSuccess(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary dark:bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-primary-dark dark:hover:bg-emerald-700 transition-all shadow-xs cursor-pointer shrink-0"
        >
          {showForm ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          {showForm ? 'Cancel Review' : 'Write a Review'}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Success notification */}
        {submitSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-medium animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {/* Review Form Drawer */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Submit Feedback for {brokerName}
              </h3>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                Live Supabase Rating
              </span>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl flex items-center gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Rating Stars Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Your Rating: <span className="text-amber-600 font-extrabold">{getRatingLabel(hoverRating || rating)} ({hoverRating || rating} ★)</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const active = (hoverRating || rating) >= starVal;
                  return (
                    <button
                      type="button"
                      key={starVal}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Order Linking */}
            {completedOrders.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                  Link Completed Order (Optional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="">General Review (No specific order)</option>
                  {completedOrders.map((ord: Order) => (
                    <option key={ord.id} value={ord.id}>
                      Order #{ord.id.slice(0, 8)} — {ord.productName || ord.product || 'Order items'} (₹
                      {(ord.totalAmount ?? ord.amount ?? 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                  Reviews linked to a completed order will earn a "Verified Buyer" badge.
                </p>
              </div>
            )}

            {/* Review Comment */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                Your Review & Deal Experience
              </label>
              <textarea
                required
                rows={3}
                placeholder="Share your experience regarding responsiveness, pricing, product condition, and logistics..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting}
                className="gap-2 bg-primary dark:bg-emerald-600 hover:bg-primary-dark dark:hover:bg-emerald-700 text-white font-bold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Publish Live Review
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Live Rating Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700">
          {/* Big Average Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-700">
            <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats.totalReviews > 0 ? stats.average.toFixed(1) : '0.0'}
            </div>

            {/* Stars row */}
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((s) => {
                const filled = stats.totalReviews > 0 && stats.average >= s;
                const half = stats.totalReviews > 0 && stats.average >= s - 0.5 && stats.average < s;
                return (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      filled
                        ? 'fill-amber-400 text-amber-400'
                        : half
                        ? 'fill-amber-200 text-amber-400'
                        : 'text-gray-200'
                    }`}
                  />
                );
              })}
            </div>

            <p className="text-xs font-semibold text-gray-600">
              {stats.totalReviews > 0
                ? `Based on ${stats.totalReviews} verified review${stats.totalReviews === 1 ? '' : 's'}`
                : 'Based on 0 reviews'}
            </p>

            {stats.totalReviews === 0 && (
              <span className="mt-2 text-[11px] text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
                No reviews yet
              </span>
            )}
          </div>

          {/* Dynamic Percentage Bars */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = stats.starCounts[star];
              const pct = stats.starPercentages[star];

              return (
                <button
                  type="button"
                  key={star}
                  onClick={() =>
                    setSelectedStarFilter(selectedStarFilter === star ? 'all' : star)
                  }
                  className={`flex items-center gap-3 p-1.5 rounded-xl text-left transition-all cursor-pointer ${
                    selectedStarFilter === star
                      ? 'bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-300 dark:ring-amber-600'
                      : 'hover:bg-gray-100/70 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-1 w-14 shrink-0">
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  </div>

                  {/* Percentage Bar */}
                  <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 0 ? 'bg-amber-400' : 'bg-transparent'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="w-20 text-right shrink-0 flex items-center justify-end gap-1.5 text-xs">
                    <span className="font-mono font-bold text-gray-700 dark:text-slate-300">{pct}%</span>
                    <span className="text-gray-400 dark:text-slate-500 text-[11px]">({count})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 mr-1">Filter:</span>
            <button
              onClick={() => setSelectedStarFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStarFilter === 'all'
                  ? 'bg-primary dark:bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              All ({reviews.length})
            </button>
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <button
                key={star}
                onClick={() => setSelectedStarFilter(star)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  selectedStarFilter === star
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <span>{star}</span>
                <Star className={`w-3 h-3 ${selectedStarFilter === star ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                <span className="opacity-80">({stats.starCounts[star]})</span>
              </button>
            ))}
          </div>

          {selectedStarFilter !== 'all' && (
            <button
              onClick={() => setSelectedStarFilter('all')}
              className="text-xs text-primary dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Loading verified customer reviews...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-rose-50/50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900 space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-900 dark:text-rose-300">{error}</p>
            <button
              onClick={fetchReviews}
              className="text-xs text-rose-700 dark:text-rose-400 underline font-semibold hover:text-rose-900 cursor-pointer"
            >
              Click to retry
            </button>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 space-y-3">
            <Star className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto" />
            <div>
              <p className="text-base font-bold text-gray-800 dark:text-white">
                {selectedStarFilter === 'all'
                  ? 'No reviews yet'
                  : `No ${selectedStarFilter}-star reviews found`}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 max-w-sm mx-auto mt-1">
                {selectedStarFilter === 'all'
                  ? `Be the first to share your transaction experience with ${brokerName}. Verified customer reviews will appear here.`
                  : 'Try selecting another star rating filter.'}
              </p>
            </div>
            {selectedStarFilter === 'all' && !showForm && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowForm(true)}
                className="mt-2 text-xs font-bold"
              >
                Be the first to review
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((rev) => {
              const initials = (rev.customerName || 'U')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {rev.customerAvatar ? (
                        <img
                          src={rev.customerAvatar}
                          alt={rev.customerName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-teal-400 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {initials}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{rev.customerName}</h4>
                          {rev.orderId && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                              <PackageCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Verified Order Buyer
                            </span>
                          )}
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-200 dark:text-slate-600'
                              }`}
                            />
                          ))}
                          <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 ml-1">
                            {rev.rating}.0
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed pl-1 sm:pl-13">
                    {rev.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
