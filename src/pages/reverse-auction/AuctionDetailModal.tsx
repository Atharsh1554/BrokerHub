import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Clock,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  Package,
  Layers,
  Award,
  DollarSign,
  User,
  ShieldCheck,
  Ban,
  RefreshCw,
} from 'lucide-react';
import type { ReverseAuction, ReverseAuctionBid } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  getAuctionBids,
  placeReverseAuctionBid,
  acceptBrokerBid,
  cancelReverseAuction,
  calculateAuctionStatus,
} from '../../lib/api/reverseAuction';
import { useNotifications } from '../../context/NotificationContext';

interface AuctionDetailModalProps {
  auction: ReverseAuction | null;
  onClose: () => void;
  onAuctionUpdated: () => void;
}

export const AuctionDetailModal: React.FC<AuctionDetailModalProps> = ({
  auction,
  onClose,
  onAuctionUpdated,
}) => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  const [bids, setBids] = useState<ReverseAuctionBid[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);

  // Form states for bidding
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidFeedback, setBidFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  // Action states
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [cancellingAuction, setCancellingAuction] = useState(false);

  const isBroker = user?.role === 'broker';
  const isCustomerOwner = user?.id === auction?.customerId || (!isBroker && user?.role === 'customer');

  const fetchBids = useCallback(async () => {
    if (!auction) return;
    setLoadingBids(true);
    const fetched = await getAuctionBids(auction.id);
    setBids(fetched);
    setLoadingBids(false);
  }, [auction]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  // Live timer update
  useEffect(() => {
    if (!auction) return;

    const updateTimer = () => {
      const end = new Date(auction.endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 3600));
      const minutes = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  if (!auction) return null;

  const currentStatus = calculateAuctionStatus(auction.endTime, auction.status);
  const isAuctionEnded = currentStatus === 'Completed' || currentStatus === 'Cancelled' || timeLeft.isExpired;

  // Find existing bid by current broker if logged in
  const myPreviousBid = isBroker
    ? bids.find((b) => b.brokerId === user?.id)
    : undefined;

  // Quick discount calculation helper
  const handleQuickBidAdjustment = (percentageOrAmount: number, isPercentage: boolean) => {
    const base = auction.currentLowestBid || auction.startingPrice;
    let target = 0;
    if (isPercentage) {
      target = Math.floor(base * (1 - percentageOrAmount / 100));
    } else {
      target = Math.max(1, base - percentageOrAmount);
    }
    setBidAmount(target);
  };

  const handlePlaceBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidFeedback(null);

    if (isAuctionEnded) {
      setBidFeedback({ type: 'error', message: 'Auction has ended. Bids can no longer be placed.' });
      return;
    }

    if (!bidAmount || Number(bidAmount) <= 0) {
      setBidFeedback({ type: 'error', message: 'Please enter a valid positive bid amount.' });
      return;
    }

    const numBid = Number(bidAmount);

    setSubmittingBid(true);

    try {
      const res = await placeReverseAuctionBid({
        auctionId: auction.id,
        brokerId: user?.id || `broker-demo-${Date.now()}`,
        brokerName: user?.fullName || 'Verified Broker',
        brokerCompany: (user as any)?.company || 'Verified Brokerage',
        brokerAvatar: user?.avatar,
        bidAmount: numBid,
        notes: notes.trim() || undefined,
      });

      setSubmittingBid(false);

      if (res.success) {
        setBidFeedback({
          type: 'success',
          message: `Your competitive bid of ₹${numBid.toLocaleString('en-IN')} was placed successfully!`,
        });
        setBidAmount('');
        setNotes('');
        await fetchBids();
        onAuctionUpdated();

        // Dispatch realtime notification to Customer
        await createNotification({
          broker_id: auction.customerId,
          customer_id: auction.customerId,
          customer_name: user?.fullName || 'Broker',
          type: 'reverse_auction',
          title: 'New Lower Bid Received',
          description: `Broker ${user?.fullName || 'Broker'} placed a bid of ₹${numBid.toLocaleString('en-IN')} on "${auction.title}".`,
          is_read: false,
          status: 'pending',
          metadata: { auction_id: auction.id, bid_amount: numBid },
        });
      } else {
        setBidFeedback({ type: 'error', message: res.error || 'Failed to place bid.' });
      }
    } catch (err: any) {
      setSubmittingBid(false);
      setBidFeedback({ type: 'error', message: err?.message || 'Error submitting bid.' });
    }
  };

  const handleAcceptBid = async (bid: ReverseAuctionBid) => {
    if (!window.confirm(`Are you sure you want to accept the bid of ₹${bid.bidAmount.toLocaleString('en-IN')} from ${bid.brokerName}? This will finalize the auction.`)) {
      return;
    }

    setAcceptingBidId(bid.id);

    try {
      await acceptBrokerBid(auction.id, bid.id);

      // Send notification to Winning Broker
      await createNotification({
        broker_id: bid.brokerId,
        customer_id: auction.customerId,
        customer_name: auction.customerName,
        type: 'reverse_auction',
        title: 'Bid Accepted! Auction Won 🎉',
        description: `Your bid of ₹${bid.bidAmount.toLocaleString('en-IN')} was accepted by ${auction.customerName} for "${auction.title}".`,
        is_read: false,
        status: 'accepted',
        metadata: { auction_id: auction.id, bid_id: bid.id },
      });

      setAcceptingBidId(null);
      await fetchBids();
      onAuctionUpdated();
    } catch (err) {
      setAcceptingBidId(null);
      alert('Failed to accept bid.');
    }
  };

  const handleCancelAuction = async () => {
    if (!window.confirm('Are you sure you want to cancel this reverse auction? This action cannot be undone.')) {
      return;
    }

    setCancellingAuction(true);
    try {
      await cancelReverseAuction(auction.id);
      setCancellingAuction(false);
      onAuctionUpdated();
      onClose();
    } catch (err) {
      setCancellingAuction(false);
      alert('Failed to cancel auction.');
    }
  };

  const startingVal = auction.startingPrice || 1;
  const lowestVal = auction.currentLowestBid || auction.startingPrice;
  const totalSavings = startingVal - lowestVal;
  const savingsPct = Math.max(0, ((totalSavings / startingVal) * 100)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-border flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-border flex items-center justify-between bg-gray-50/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                currentStatus === 'Active'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : currentStatus === 'Ending Soon'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                  : currentStatus === 'Completed'
                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {currentStatus}
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-primary line-clamp-1">{auction.title}</h2>
              <p className="text-xs text-gray-label flex items-center gap-2">
                <span>Auction ID: <strong className="text-text-primary">{auction.id}</strong></span>
                <span>•</span>
                <span>Category: <strong className="text-text-primary">{auction.category}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBids}
              title="Refresh Bids"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <RefreshCw size={18} className={loadingBids ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Banner Grid: Key Metrics & Live Countdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Target Budget */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-label uppercase tracking-wider">Starting / Max Budget</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  ₹{auction.startingPrice.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
            </div>

            {/* Current Lowest Bid */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Current Lowest Bid</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-xl font-extrabold text-emerald-700">
                    {auction.currentLowestBid
                      ? `₹${auction.currentLowestBid.toLocaleString('en-IN')}`
                      : 'No Bids Yet'}
                  </p>
                  {auction.currentLowestBid && Number(savingsPct) > 0 && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <TrendingDown size={12} /> {savingsPct}% OFF
                    </span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Award size={20} />
              </div>
            </div>

            {/* Live Countdown Timer */}
            <div className="bg-primary-50/80 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Time Remaining</p>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-lg font-bold text-primary-dark">
                  {timeLeft.isExpired || isAuctionEnded ? (
                    <span className="text-gray-500 font-sans text-sm font-semibold">Auction Ended</span>
                  ) : (
                    <>
                      <span className="bg-white px-2 py-0.5 rounded border border-primary-200">{String(timeLeft.hours).padStart(2, '0')}h</span>
                      <span>:</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-primary-200">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                      <span>:</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-primary-200">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
          </div>

          {/* Details & Specs Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Product & Specs */}
            <div className="md:col-span-2 space-y-5">
              <div className="bg-white border border-gray-border rounded-xl p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Package size={18} className="text-primary" /> Requirement Details
                </h3>

                <p className="text-sm text-gray-text leading-relaxed whitespace-pre-line">{auction.description}</p>

                {/* Key Spec Badges */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <Layers size={18} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-gray-label">Quantity Required</p>
                      <p className="text-sm font-bold text-text-primary">
                        {auction.quantity.toLocaleString('en-IN')} {auction.specifications?.['Unit'] || 'units'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <User size={18} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-gray-label">Customer / Buyer</p>
                      <p className="text-sm font-bold text-text-primary line-clamp-1">{auction.customerName}</p>
                    </div>
                  </div>
                </div>

                {/* Specifications Table */}
                {auction.specifications && Object.keys(auction.specifications).length > 0 && (
                  <div className="pt-3">
                    <h4 className="text-xs font-semibold text-gray-label mb-2 uppercase tracking-wider">
                      Technical Specifications & Commercial Terms
                    </h4>
                    <div className="border border-gray-border rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-border">
                          {Object.entries(auction.specifications).map(([k, v]) => (
                            <tr key={k} className="hover:bg-gray-50/50">
                              <td className="px-3.5 py-2.5 font-semibold text-gray-text w-1/3 bg-gray-50/80">{k}</td>
                              <td className="px-3.5 py-2.5 text-text-primary font-medium">{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Customer Info Card / Quick Status */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-700/80 pb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary border border-primary/30">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white line-clamp-1">{auction.customerName}</h4>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck size={12} /> Verified Buyer
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Bids Received:</span>
                    <strong className="text-white font-bold">{bids.length} Bids</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Started At:</span>
                    <strong className="text-white font-medium">
                      {new Date(auction.startTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ends At:</span>
                    <strong className="text-white font-medium">
                      {new Date(auction.endTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                </div>

                {/* Customer Owner Actions */}
                {isCustomerOwner && !isAuctionEnded && (
                  <div className="pt-2 border-t border-slate-700">
                    <button
                      onClick={handleCancelAuction}
                      disabled={cancellingAuction}
                      className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Ban size={14} /> Cancel Auction
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Broker Bidding Widget (For Brokers when auction active) */}
          {isBroker && !isAuctionEnded && (
            <div className="bg-emerald-50/60 border-2 border-emerald-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown size={20} className="text-emerald-700" />
                  <h3 className="text-sm font-bold text-emerald-950">
                    {myPreviousBid ? 'Update Your Competitive Bid' : 'Submit Competitive Bid'}
                  </h3>
                </div>
                {myPreviousBid && (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                    Your Current Bid: ₹{myPreviousBid.bidAmount.toLocaleString('en-IN')} ({myPreviousBid.status})
                  </span>
                )}
              </div>

              {bidFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                    bidFeedback.type === 'success'
                      ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {bidFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{bidFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handlePlaceBidSubmit} className="space-y-4">
                {/* Input & Quick Steppers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1.5">
                      Your Offer Price (₹ Total for all {auction.quantity} units)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-emerald-700 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        max={auction.startingPrice - 1}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value ? Number(e.target.value) : '')}
                        placeholder={
                          auction.currentLowestBid
                            ? `Lower than ₹${auction.currentLowestBid.toLocaleString('en-IN')}`
                            : `Lower than ₹${auction.startingPrice.toLocaleString('en-IN')}`
                        }
                        className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Quick Discount Buttons */}
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1.5">Quick Bid Shortcuts</label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickBidAdjustment(1000, false)}
                        className="py-2 px-2 bg-white border border-emerald-300 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        -₹1k
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickBidAdjustment(5000, false)}
                        className="py-2 px-2 bg-white border border-emerald-300 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        -₹5k
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickBidAdjustment(5, true)}
                        className="py-2 px-2 bg-white border border-emerald-300 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        -5%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickBidAdjustment(10, true)}
                        className="py-2 px-2 bg-white border border-emerald-300 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        -10%
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Proposal Note */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">Proposal Note / Terms (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Price includes free doorstep freight delivery and 2-year warranty"
                    className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    {submittingBid ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>{myPreviousBid ? 'Submit Lower Bid' : 'Place Competitive Bid'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bid History Table */}
          <div className="bg-white border border-gray-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Award size={18} className="text-primary" /> Live Bid History ({bids.length})
              </h3>
              <span className="text-xs text-gray-label italic">Sorted from lowest to highest</span>
            </div>

            {loadingBids ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading bid history...</div>
            ) : bids.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                No bids have been submitted yet for this requirement.
              </div>
            ) : (
              <div className="border border-gray-border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-border text-gray-label font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Broker / Supplier</th>
                      <th className="px-4 py-3">Bid Amount (₹)</th>
                      <th className="px-4 py-3">Savings</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Status</th>
                      {isCustomerOwner && !isAuctionEnded && <th className="px-4 py-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-border">
                    {bids.map((bid, index) => {
                      const bidSavings = startingVal - bid.bidAmount;
                      const bidPct = ((bidSavings / startingVal) * 100).toFixed(1);
                      const isMe = user?.id === bid.brokerId;

                      return (
                        <tr
                          key={bid.id}
                          className={`transition-colors ${
                            index === 0
                              ? 'bg-emerald-50/40 hover:bg-emerald-50'
                              : isMe
                              ? 'bg-primary-50/30'
                              : 'hover:bg-gray-50/50'
                          }`}
                        >
                          <td className="px-4 py-3.5 font-bold">
                            {index === 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px]">
                                #1
                              </span>
                            ) : (
                              <span className="text-gray-500 ml-1.5">#{index + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                {bid.brokerName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-text-primary flex items-center gap-1.5">
                                  <span>{bid.brokerName}</span>
                                  {isMe && (
                                    <span className="text-[10px] bg-primary-50 text-primary px-1.5 py-0.2 rounded font-semibold">
                                      You
                                    </span>
                                  )}
                                </p>
                                {bid.notes && <p className="text-[11px] text-gray-500 italic mt-0.5">"{bid.notes}"</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-extrabold text-sm text-text-primary">
                            ₹{bid.bidAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-emerald-600">
                            {Number(bidPct) > 0 ? `-${bidPct}%` : '0%'}
                          </td>
                          <td className="px-4 py-3.5 text-gray-label font-medium">
                            {new Date(bid.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                                bid.status === 'Lowest'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : bid.status === 'Accepted'
                                  ? 'bg-primary-100 text-primary-dark font-extrabold'
                                  : bid.status === 'Outbid'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {bid.status}
                            </span>
                          </td>
                          {isCustomerOwner && !isAuctionEnded && (
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => handleAcceptBid(bid)}
                                disabled={acceptingBidId === bid.id}
                                className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                              >
                                {acceptingBidId === bid.id ? 'Accepting...' : 'Accept Bid'}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-border bg-gray-50 flex items-center justify-between text-xs text-gray-label">
          <span>Broker Hub Reverse Auction Marketplace · Verified Contracts</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-text-primary font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
