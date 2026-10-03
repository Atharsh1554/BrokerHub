import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, UserCheck, Briefcase,
  Sparkles, CheckCircle2, ArrowRight,
  Building2, TrendingUp, Package, MessageCircle,
  Phone, Hash
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const CUSTOMER_FEATURES = [
  { icon: <UserCheck size={16} />, text: 'Verified Broker Match Directory' },
  { icon: <MessageCircle size={16} />, text: 'Direct Real-Time Chat & Consultation' },
  { icon: <Package size={16} />, text: 'Transparent Order & Shipment Tracking' },
  { icon: <TrendingUp size={16} />, text: 'Live Market Price Comparisons' },
];

const BROKER_FEATURES = [
  { icon: <Building2 size={16} />, text: 'Dedicated Lead & Inquiry Workspace' },
  { icon: <Package size={16} />, text: 'Real-Time Product Cataloging' },
  { icon: <MessageCircle size={16} />, text: 'Encrypted Client Messaging' },
  { icon: <TrendingUp size={16} />, text: 'Revenue & Commission Analytics' },
];

type LoginTab = 'google' | 'phone';
type PhoneStep = 'enter' | 'verify';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'customer' | 'broker') || 'customer';

  const [role, setRole] = useState<'customer' | 'broker'>(initialRole);
  const [tab, setTab] = useState<LoginTab>('google');

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('enter');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Google state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { sendPhoneOtp, verifyPhoneOtp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'broker' ? '/broker/dashboard' : '/customer/dashboard');
    }
  }, [user, navigate]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle(role);
    } catch {
      setIsGoogleLoading(false);
      setErrorMsg('Google sign-in failed. Please try again.');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phone.trim()) { setErrorMsg('Please enter your phone number.'); return; }

    // Format phone: ensure it starts with +91 or user's country code
    let formattedPhone = phone.trim().replace(/\s/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone; // default India code
    }

    setPhoneLoading(true);
    const { error } = await sendPhoneOtp(formattedPhone, role);
    setPhoneLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to send OTP. Please check your phone number.');
    } else {
      setSuccessMsg(`OTP sent to ${formattedPhone}`);
      setPhone(formattedPhone);
      setPhoneStep('verify');
      setResendTimer(30);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!otp.trim() || otp.length < 6) { setErrorMsg('Enter the 6-digit OTP.'); return; }

    setOtpLoading(true);
    const { error } = await verifyPhoneOtp(phone, otp);
    setOtpLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Invalid OTP. Please try again.');
    }
    // On success, AuthContext will update user and the useEffect above redirects
  };

  const handleResendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setOtp('');
    setPhoneLoading(true);
    const { error } = await sendPhoneOtp(phone, role);
    setPhoneLoading(false);
    if (error) {
      setErrorMsg(error.message || 'Failed to resend OTP.');
    } else {
      setSuccessMsg('OTP resent successfully!');
      setResendTimer(30);
    }
  };

  const isCustomer = role === 'customer';
  const features = isCustomer ? CUSTOMER_FEATURES : BROKER_FEATURES;

  const accentColor = isCustomer ? 'teal' : 'indigo';
  const btnClass = isCustomer
    ? 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'
    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Left Panel (Hero) ── */}
      <div
        className={`hidden lg:flex lg:w-[52%] relative overflow-hidden items-center justify-center transition-all duration-700 ${
          isCustomer
            ? 'bg-gradient-to-br from-teal-600 via-primary to-emerald-700'
            : 'bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900'
        }`}
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-white max-w-md px-10 py-16 space-y-10">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-white/95 rounded-3xl flex items-center justify-center shadow-2xl p-3 transform hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="BrokerHub" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">BROKER HUB</h1>
              <p className="text-sm font-bold uppercase tracking-widest text-white/60 italic mt-1">
                A MYSTRIO Product
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20 ${
              isCustomer ? 'bg-white/15' : 'bg-white/10'
            }`}>
              {isCustomer ? <UserCheck size={16} /> : <Briefcase size={16} />}
              {isCustomer ? 'Customer Portal' : 'Broker Professional Desk'}
            </div>
            <h2 className="text-3xl font-bold leading-tight">
              {isCustomer ? 'Find the best brokers for your business' : 'Manage clients, grow your brokerage'}
            </h2>
            <p className="text-sm text-white/75 leading-relaxed">
              {isCustomer
                ? 'Connect with top-verified brokers, track orders in real-time, and negotiate deals with full transparency.'
                : 'Streamline inquiries, list inventory, and close deals faster with our all-in-one professional platform.'}
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm font-medium">
                <span className={`p-1.5 rounded-lg ${isCustomer ? 'bg-emerald-400/30' : 'bg-indigo-400/30'} text-white`}>
                  {feat.icon}
                </span>
                <span className="text-white/90">{feat.text}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 text-xs font-semibold text-white/60 pt-2 border-t border-white/10">
            <ShieldCheck size={16} className="text-emerald-300" />
            256-bit Bank-Grade Encryption · SOC 2 Compliant
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <img src="/logo.png" alt="BrokerHub" className="h-9 w-auto object-contain" />
            <span className="font-black text-xl text-gray-900 tracking-tight">BROKER HUB</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-7 space-y-5">

            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back 👋</h2>
              <p className="text-sm text-gray-500 mt-1">Sign in to your {isCustomer ? 'Customer' : 'Broker'} account</p>
            </div>

            {/* Role Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => { setRole('customer'); setPhoneStep('enter'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isCustomer ? 'bg-white text-teal-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserCheck size={15} /> Customer
              </button>
              <button
                type="button"
                onClick={() => { setRole('broker'); setPhoneStep('enter'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  !isCustomer ? 'bg-white text-indigo-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Briefcase size={15} /> Broker
              </button>
            </div>

            {/* Sign-in Method Tabs */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button
                type="button"
                onClick={() => { setTab('google'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                  tab === 'google'
                    ? isCustomer ? 'bg-teal-600 text-white' : 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <GoogleIcon /> Google
              </button>
              <button
                type="button"
                onClick={() => { setTab('phone'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-colors cursor-pointer border-l border-gray-200 ${
                  tab === 'phone'
                    ? isCustomer ? 'bg-teal-600 text-white' : 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Phone size={14} /> Phone / SMS
              </button>
            </div>

            {/* Error / Success Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 font-medium">
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs border border-emerald-100 font-medium">
                ✅ {successMsg}
              </div>
            )}

            {/* ── Google Tab ── */}
            {tab === 'google' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : <GoogleIcon />}
                  {isGoogleLoading ? 'Redirecting…' : `Continue as ${isCustomer ? 'Customer' : 'Broker'} with Google`}
                </button>
                <p className="text-center text-xs text-gray-400">
                  Secure sign-in via your Google account. No password required.
                </p>
              </div>
            )}

            {/* ── Phone Tab ── */}
            {tab === 'phone' && (
              <div className="space-y-4">
                {phoneStep === 'enter' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Enter with country code (e.g. +91 for India)</p>
                    </div>
                    <button
                      type="submit"
                      disabled={phoneLoading}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer ${btnClass}`}
                    >
                      {phoneLoading ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : <Phone size={16} />}
                      {phoneLoading ? 'Sending OTP…' : 'Send OTP via SMS'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500">OTP sent to</p>
                      <p className="font-bold text-gray-800 text-sm">{phone}</p>
                      <button
                        type="button"
                        onClick={() => { setPhoneStep('enter'); setOtp(''); setErrorMsg(''); setSuccessMsg(''); }}
                        className="text-xs text-teal-600 hover:underline mt-1"
                      >
                        Change number
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Enter 6-Digit OTP
                      </label>
                      <div className="relative">
                        <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="• • • • • •"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm text-center tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={otpLoading || otp.length < 6}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer ${btnClass}`}
                    >
                      {otpLoading ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : <ArrowRight size={16} />}
                      {otpLoading ? 'Verifying…' : 'Verify & Sign In'}
                    </button>
                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-xs text-gray-400">Resend OTP in {resendTimer}s</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={phoneLoading}
                          className="text-xs text-teal-600 font-semibold hover:underline cursor-pointer"
                        >
                          {phoneLoading ? 'Sending…' : 'Resend OTP'}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Footer links */}
            <div className="text-center space-y-2 pt-1">
              <p className="text-xs text-gray-500">
                Don't have an account?{' '}
                <Link to={`/signup?role=${role}`} className="text-teal-700 font-bold hover:underline">
                  Create {isCustomer ? 'Customer' : 'Broker'} Account
                </Link>
              </p>
              {isCustomer && (
                <p className="text-xs text-gray-400">
                  Are you a broker?{' '}
                  <button type="button" onClick={() => setRole('broker')} className="text-indigo-600 font-semibold hover:underline cursor-pointer">
                    Switch to Broker Login
                  </button>
                </p>
              )}
              {!isCustomer && (
                <p className="text-xs text-gray-400">
                  Looking as a customer?{' '}
                  <button type="button" onClick={() => setRole('customer')} className="text-teal-700 font-semibold hover:underline cursor-pointer">
                    Switch to Customer Login
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Feature pills below card */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-4">
            {features.slice(0, 3).map((feat, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                <CheckCircle2 size={12} className={isCustomer ? 'text-teal-500' : 'text-indigo-500'} />
                {feat.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
