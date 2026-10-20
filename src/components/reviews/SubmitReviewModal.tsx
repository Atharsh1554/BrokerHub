import React, { useState, useEffect } from 'react';
import { Star, X, Loader2, Send, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { submitReview, checkOrderReviewed } from '../../lib/api/reviews';
import { useAuth } from '../../context/AuthContext';

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerId: string;
  brokerName?: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  onSuccess?: () => void;
}

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
  isOpen,
  onClose,
  brokerId,
  brokerName = 'Broker',
  orderId,
  productId,
  productName,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setCheckingExisting(true);
      setError(null);
      setSuccess(false);
      checkOrderReviewed(orderId).then((existing) => {
        if (existing) {
          setAlreadyReviewed(true);
          setRating(existing.rating);
          setComment(existing.comment);
        } else {
          setAlreadyReviewed(false);
          setRating(5);
          setComment('');
        }
        setCheckingExisting(false);
      });
    } else {
      setAlreadyReviewed(false);
      setRating(5);
      setComment('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Please sign in as a customer to submit a review.');
      return;
    }

    if (!comment.trim()) {
      setError('Please enter your review feedback.');
      return;
    }

    setLoading(true);
    try {
      await submitReview({
        brokerId,
        orderId,
        productId,
        rating,
        comment: comment.trim(),
      });

      setSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return 'Excellent (5★)';
      case 4:
        return 'Very Good (4★)';
      case 3:
        return 'Good (3★)';
      case 2:
        return 'Fair (2★)';
      case 1:
        return 'Poor (1★)';
      default:
        return '5 Stars';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Verified Purchase Review</span>
          </div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
            {alreadyReviewed ? 'Your Submitted Review' : `Rate & Review ${brokerName}`}
          </h2>
          {productName && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
              Order item: <span className="font-semibold text-gray-700 dark:text-slate-200">{productName}</span>
            </p>
          )}
        </div>

        {checkingExisting ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-gray-400 dark:text-slate-500">Verifying order status...</p>
          </div>
        ) : alreadyReviewed ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Review already submitted</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  You have already reviewed this completed order. Thank you!
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-slate-700'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 ml-2">
                  {getRatingLabel(rating)}
                </span>
              </div>
              <p className="text-xs text-gray-700 dark:text-slate-300 italic">"{comment}"</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Review submitted successfully! Refreshing live ratings...</span>
              </div>
            )}

            {/* Rating Stars Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                Rating: <span className="text-amber-600 dark:text-amber-400 font-extrabold">{getRatingLabel(hoverRating || rating)}</span>
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
                        className={`w-8 h-8 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 dark:text-slate-600 hover:text-amber-200 dark:hover:text-amber-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                Your Experience & Deal Quality
              </label>
              <textarea
                required
                rows={4}
                placeholder="How was the communication, product packaging, and delivery timeframe?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading || success}
                className="gap-2 bg-primary hover:bg-primary-dark text-white font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
