import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit3,
  ShieldCheck,
  Percent,
  Clock,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { BrokerPaymentDetails } from '../../lib/api/paymentDetails';
import {
  getBrokerPaymentDetails,
  saveBrokerPaymentDetails,
  maskUpiId,
  maskAccountNumber,
  validateUpiId,
  validateIfscCode,
} from '../../lib/api/paymentDetails';

export const BrokerPaymentSetup: React.FC = () => {
  const { user } = useAuth();
  const brokerId = user?.id || 'ea1a6e0b-c775-4801-8ef4-b1f809dbedb0';

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedDetails, setSavedDetails] = useState<BrokerPaymentDetails | null>(null);

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [confirmUpiId, setConfirmUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Status & Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const details = await getBrokerPaymentDetails(brokerId);
      if (details && (details.upiId || details.accountNumber)) {
        setSavedDetails(details);
        setPaymentMethod(details.paymentMethod || 'upi');
        setUpiId(details.upiId || '');
        setConfirmUpiId(details.upiId || '');
        setAccountHolderName(details.accountHolderName || '');
        setBankName(details.bankName || '');
        setAccountNumber(details.accountNumber || '');
        setConfirmAccountNumber(details.accountNumber || '');
        setIfscCode(details.ifscCode || '');
        setIsEditing(false);
      } else {
        setSavedDetails(null);
        setIsEditing(true);
      }
    } catch (err: any) {
      console.error('[BrokerPaymentSetup] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [brokerId]);

  const validateForm = (): boolean => {
    setErrorMsg(null);

    if (paymentMethod === 'upi') {
      const upiValidation = validateUpiId(upiId);
      if (!upiValidation.valid) {
        setErrorMsg(upiValidation.error || 'Please enter a valid UPI ID (e.g., brokername@upi or 8903609825@okicici).');
        return false;
      }

      if (upiId.trim().toLowerCase() !== confirmUpiId.trim().toLowerCase()) {
        setErrorMsg('UPI ID and Confirm UPI ID do not match. Please re-check both fields.');
        return false;
      }
    } else if (paymentMethod === 'bank') {
      if (!accountHolderName.trim()) {
        setErrorMsg('Account Holder Name is required.');
        return false;
      }
      if (!bankName.trim()) {
        setErrorMsg('Bank Name is required.');
        return false;
      }
      if (!accountNumber.trim() || accountNumber.trim().length < 6) {
        setErrorMsg('Please enter a valid Bank Account Number (at least 6 digits).');
        return false;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        setErrorMsg('Bank Account Number and Confirm Account Number do not match.');
        return false;
      }
      const ifscValidation = validateIfscCode(ifscCode);
      if (!ifscValidation.valid) {
        setErrorMsg(ifscValidation.error || 'Please enter a valid 11-character IFSC Code (e.g., SBIN0001234).');
        return false;
      }
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: BrokerPaymentDetails = {
        brokerId,
        paymentMethod,
        upiId: paymentMethod === 'upi' ? upiId.trim() : undefined,
        accountHolderName: paymentMethod === 'bank' ? accountHolderName.trim() : undefined,
        bankName: paymentMethod === 'bank' ? bankName.trim() : undefined,
        accountNumber: paymentMethod === 'bank' ? accountNumber.trim() : undefined,
        ifscCode: paymentMethod === 'bank' ? ifscCode.trim().toUpperCase() : undefined,
      };

      const result = await saveBrokerPaymentDetails(payload);
      if (result.success && result.data) {
        setSavedDetails(result.data);
        setIsEditing(false);
        setSuccessMsg('Payment details saved successfully! Broker Hub Admin will process your settlements using this payout method.');
        
        // Dispatch window storage event so Admin Payments and context update instantly
        window.dispatchEvent(new Event('broker_payment_details_updated'));

        setTimeout(() => setSuccessMsg(null), 6000);
      } else {
        throw new Error(result.error || 'Failed to save payment details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving payment details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Broker Payout & Settlement Setup
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              Verified Settlement
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure your registered UPI ID or Bank Account for manual ₹0-commission order settlements by Broker Hub Admin.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDetails}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          title="Refresh payout status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Platform Commission</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700">₹0 (Zero Fee)</p>
          <p className="text-[11px] text-emerald-700">100% of order earnings are transferred to your payout account.</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50/50 border border-blue-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Customer Gateway</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm font-bold text-blue-900">Razorpay Encrypted</p>
          <p className="text-[11px] text-blue-700">Customer payments are collected securely in merchant escrow.</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Settlement Transfer</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-amber-900">Direct Admin Transfer</p>
          <p className="text-[11px] text-amber-700">Admin verifies your saved UPI/Bank details and marks order as Settled.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="ml-2.5 text-sm font-medium text-slate-600">Loading payout settings...</span>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Success Banner */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-3 shadow-xs animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Details Saved Successfully!</p>
                <p className="text-xs text-emerald-800 mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-start gap-3 shadow-xs animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-900">Validation Error</p>
                <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* DISPLAY MODE (ACTIVE SAVED PAYOUT DETAILS) */}
          {!isEditing && savedDetails ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-sm shadow-xs">
                    {savedDetails.paymentMethod === 'upi' ? <QrCode className="w-6 h-6" /> : <Building className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {savedDetails.paymentMethod === 'upi' ? 'UPI Settlement Account' : 'Direct Bank Account'}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Active Payout Method
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Updated:{' '}
                      <span className="font-semibold text-slate-700">
                        {savedDetails.updatedAt
                          ? new Date(savedDetails.updatedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recently'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  Edit Details
                </button>
              </div>

              {/* Masked Card Overview */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                {savedDetails.paymentMethod === 'upi' ? (
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Registered UPI ID (VPA)</span>
                      <p className="text-lg font-mono font-bold text-emerald-700 mt-0.5">
                        {savedDetails.upiId}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Masked display for Admin: <span className="font-mono text-slate-700">{maskUpiId(savedDetails.upiId)}</span></p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                      GPay / PhonePe / Paytm / BHIM
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Holder</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{savedDetails.accountHolderName || 'N/A'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Name</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{savedDetails.bankName || 'N/A'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Number</span>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                        {maskAccountNumber(savedDetails.accountNumber)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IFSC Code</span>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{savedDetails.ifscCode || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Your settlement account is ready. Admin will use these details to process your 100% order payout upon completion.
                </p>
              </div>
            </div>
          ) : (
            /* EDIT / SETUP FORM */
            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {savedDetails ? 'Update Payout Details' : 'Configure Settlement Payout Details'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your preferred payout method and enter your accurate account details.
                  </p>
                </div>

                {savedDetails && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Settlement Method Tabs */}
              <div className="space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Select Preferred Payout Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      paymentMethod === 'upi' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                    }`}>
                      UPI
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">Option A — UPI ID (VPA)</p>
                      <p className="text-xs text-slate-500 mt-0.5">Fast settlements via GPay, PhonePe, Paytm, BHIM</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'bank'
                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      paymentMethod === 'bank' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">Option B — Bank Account</p>
                      <p className="text-xs text-slate-500 mt-0.5">Direct NEFT / IMPS / RTGS bank transfer</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* OPTION A: UPI FIELDS */}
              {paymentMethod === 'upi' && (
                <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      UPI ID (VPA) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. brokername@upi or 8903609825@okicici"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 shadow-xs transition-all"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Examples: <code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">brokername@upi</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">9876543210@okicici</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">user@paytm</code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Confirm UPI ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={confirmUpiId}
                      onChange={(e) => setConfirmUpiId(e.target.value)}
                      placeholder="Re-enter your UPI ID"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 shadow-xs transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* OPTION B: BANK ACCOUNT FIELDS */}
              {paymentMethod === 'bank' && (
                <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Account Holder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="Name as registered in bank"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. State Bank of India, HDFC Bank"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Bank Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter full bank account number"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Confirm Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={confirmAccountNumber}
                        onChange={(e) => setConfirmAccountNumber(e.target.value)}
                        placeholder="Re-enter bank account number"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      maxLength={11}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">11-character code (4 letters, 0, 6 numbers/letters)</p>
                  </div>
                </div>
              )}

              {/* Submit Action Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Your payment details are strictly encrypted and used solely for admin settlement payouts.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Payment Details...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Payment Details
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default BrokerPaymentSetup;
