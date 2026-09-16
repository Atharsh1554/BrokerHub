import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, UserCheck, Briefcase,
  Sparkles, CheckCircle2, ArrowRight, Building2, TrendingUp, Package, MessageCircle
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

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'customer' | 'broker') || 'customer';

  const [role, setRole] = useState<'customer' | 'broker'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signIn, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'broker' ? '/broker/dashboard' : '/customer/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) setErrorMsg(error.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle(role);
    } catch {
      setIsGoogleLoading(false);
    }
  };

  const fillDemoCustomer = () => {
    setEmail('customer@brokerhub.com');
    setPassword('password123');
    setRole('customer');
  };

  const fillDemoBroker = () => {
    setEmail('broker@brokerhub.com');
    setPassword('password123');
    setRole('broker');
  };

  const isCustomer = role === 'customer';
  const features = isCustomer ? CUSTOMER_FEATURES : BROKER_FEATURES;

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
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-white max-w-md px-10 py-16 space-y-10">
          {/* Brand */}
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

          {/* Role headline */}
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20 ${
              isCustomer ? 'bg-white/15' : 'bg-white/10'
            }`}>
              {isCustomer ? <UserCheck size={16} /> : <Briefcase size={16} />}
              {isCustomer ? 'Customer Portal' : 'Broker Professional Desk'}
            </div>
            <h2 className="text-3xl font-bold leading-tight">
              {isCustomer
                ? 'Find the best brokers for your business'
                : 'Manage clients, grow your brokerage'}
            </h2>
            <p className="text-sm text-white/75 leading-relaxed">
              {isCustomer
                ? 'Connect with top-verified brokers, track orders in real-time, and negotiate deals with full transparency.'
                : 'Streamline inquiries, list inventory, and close deals faster with our all-in-one professional platform.'}
            </p>
          </div>

          {/* Feature bullets */}
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

          {/* Trust badge */}
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
                onClick={() => setRole('customer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isCustomer
                    ? 'bg-white text-teal-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserCheck size={15} />
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('broker')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  !isCustomer
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Briefcase size={15} />
                Broker
              </button>
            </div>

            {/* Demo Quick Fill */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1 mb-2">
                <Sparkles size={11} className="text-amber-500" />
                Quick Demo Fill
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={fillDemoCustomer}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 transition-all cursor-pointer shadow-sm"
                >
                  👤 Customer Demo
                </button>
                <button
                  type="button"
                  onClick={fillDemoBroker}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm"
                >
                  💼 Broker Demo
                </button>
              </div>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : <GoogleIcon />}
              {isGoogleLoading ? 'Redirecting…' : `Sign in as ${isCustomer ? 'Customer' : 'Broker'} with Google`}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400 font-medium">or sign in with email</span>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleLogin}>
              <Input
                label="Email Address"
                type="email"
                placeholder={`your@${isCustomer ? 'email' : 'brokerage'}.com`}
                icon={<Mail size={17} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  icon={<Lock size={17} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-[38px] text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs cursor-pointer text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  Remember me
                </label>
                <a href="#" className="text-xs font-semibold text-teal-700 hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting}
                className={`mt-1 group !flex !items-center !justify-center !gap-2 ${
                  !isCustomer ? '!bg-indigo-600 hover:!bg-indigo-700 focus:!ring-indigo-500' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    Sign In as {isCustomer ? 'Customer' : 'Broker'}
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

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
                  <button
                    type="button"
                    onClick={() => setRole('broker')}
                    className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Switch to Broker Login
                  </button>
                </p>
              )}
              {!isCustomer && (
                <p className="text-xs text-gray-400">
                  Looking as a customer?{' '}
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className="text-teal-700 font-semibold hover:underline cursor-pointer"
                  >
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
