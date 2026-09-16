import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, UserCheck, Briefcase,
  ShieldCheck, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const SignUpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'customer' | 'broker') || 'customer';

  const [accountType, setAccountType] = useState<'customer' | 'broker'>(initialRole);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'broker' ? '/broker/dashboard' : '/customer/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle(accountType);
    } catch {
      setIsGoogleLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please agree to the Terms of Service to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await signUp(formData.email, formData.password);
      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) {
        throw new Error('Account created! Please check your email to verify your account before logging in.');
      }

      const { error: userError } = await supabase.from('users').insert([{
        id: userId,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: accountType,
      }]);
      if (userError) throw userError;

      if (accountType === 'broker') {
        const { error: brokerError } = await supabase.from('brokers').insert([{
          id: userId,
          name: formData.fullName,
          specialty: '',
          company: '',
        }]);
        if (brokerError) throw brokerError;
      }

      navigate(accountType === 'broker' ? '/broker/dashboard' : '/customer/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCustomer = accountType === 'customer';

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Left Branding Panel ── */}
      <div
        className={`hidden lg:flex lg:w-[48%] relative overflow-hidden items-center justify-center transition-all duration-700 ${
          isCustomer
            ? 'bg-gradient-to-br from-teal-600 via-primary to-emerald-700'
            : 'bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900'
        }`}
      >
        {/* Blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-white max-w-sm px-10 py-12 space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/95 rounded-2xl flex items-center justify-center shadow-xl p-2.5">
              <img src="/logo.png" alt="BrokerHub" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">BROKER HUB</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60 italic">A MYSTRIO Product</p>
            </div>
          </div>

          {/* Account type badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-white/20 backdrop-blur-sm ${
            isCustomer ? 'bg-white/15' : 'bg-white/10'
          }`}>
            {isCustomer ? <UserCheck size={15} /> : <Briefcase size={15} />}
            {isCustomer ? 'Creating Customer Account' : 'Creating Broker Account'}
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-snug">
              {isCustomer ? 'Start finding verified brokers today' : 'Launch your professional brokerage'}
            </h2>
            <p className="text-sm text-white/75 leading-relaxed">
              {isCustomer
                ? 'Get instant access to a curated directory of trusted brokers, real-time order tracking, and secure communication.'
                : 'Onboard in minutes and start managing clients, listing products, and closing deals on one unified platform.'}
            </p>
          </div>

          {/* Bullet points */}
          <ul className="space-y-2.5">
            {(isCustomer
              ? ['Free to join — no monthly fee', 'Verified broker profiles only', 'End-to-end encrypted messages', 'Real-time order & shipment tracking']
              : ['Professional lead management', 'Custom product catalog', 'Analytics & commission tracking', 'Verified client badge']
            ).map((item, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm font-medium text-white/90">
                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 text-xs text-white/50 pt-4 border-t border-white/10">
            <ShieldCheck size={15} className="text-emerald-300" />
            256-bit Bank-Grade Encryption · GDPR Compliant
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-start justify-center p-5 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-[420px] py-6 space-y-5">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <img src="/logo.png" alt="BrokerHub" className="h-9 w-auto object-contain" />
            <span className="font-black text-xl text-gray-900 tracking-tight">BROKER HUB</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-7 space-y-5">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account ✨</h2>
              <p className="text-sm text-gray-500 mt-1">Join thousands of brokers and businesses</p>
            </div>

            {/* Account type toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(['customer', 'broker'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    accountType === type
                      ? type === 'customer'
                        ? 'bg-white text-teal-700 shadow-sm border border-gray-200'
                        : 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type === 'customer' ? <UserCheck size={14} /> : <Briefcase size={14} />}
                  {type === 'customer' ? 'Customer' : 'Broker'}
                </button>
              ))}
            </div>

            {/* Google sign up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : <GoogleIcon />}
              {isGoogleLoading ? 'Redirecting…' : `Sign up as ${isCustomer ? 'Customer' : 'Broker'} with Google`}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400 font-medium">or fill in the details below</span>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Form */}
            <form className="space-y-3.5" onSubmit={handleSignUp}>
              <Input
                label="Full Name"
                placeholder="Your full name"
                icon={<User size={17} />}
                value={formData.fullName}
                onChange={handleChange('fullName')}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                icon={<Mail size={17} />}
                value={formData.email}
                onChange={handleChange('email')}
                required
              />

              <Input
                label="Phone Number (optional)"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                icon={<Phone size={17} />}
                value={formData.phone}
                onChange={handleChange('phone')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  icon={<Lock size={17} />}
                  value={formData.password}
                  onChange={handleChange('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-[38px] text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  icon={<Lock size={17} />}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3.5 top-[38px] text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Agree to terms */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className={`w-4 h-4 mt-0.5 rounded border-gray-300 ${isCustomer ? 'text-teal-600 focus:ring-teal-500' : 'text-indigo-600 focus:ring-indigo-500'}`}
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className={`font-semibold hover:underline ${isCustomer ? 'text-teal-700' : 'text-indigo-700'}`}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className={`font-semibold hover:underline ${isCustomer ? 'text-teal-700' : 'text-indigo-700'}`}>Privacy Policy</a>
                </span>
              </label>

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
                    Creating Account…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Create {isCustomer ? 'Customer' : 'Broker'} Account
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-gray-500 pt-1">
              Already have an account?{' '}
              <Link to={`/login?role=${accountType}`} className={`font-bold hover:underline ${isCustomer ? 'text-teal-700' : 'text-indigo-700'}`}>
                Sign In
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 pb-4">
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-teal-500" /> Secure & Encrypted</span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-teal-500" /> No credit card required</span>
          </div>
        </div>
      </div>
    </div>
  );
};
