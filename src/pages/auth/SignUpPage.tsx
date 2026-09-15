import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Mail, Phone, Lock } from 'lucide-react';
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
  const [accountType, setAccountType] = useState<'customer' | 'broker'>('customer');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

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
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await signUp(formData.email, formData.password);
      if (error) throw error;

      const userId = data?.user?.id;

      if (!userId) {
        throw new Error('User creation succeeded but failed to get user id. Check if email confirmations are required.');
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
      setErrorMsg(err.message || 'Failed to sign up');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-teal-500 to-emerald-600 items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <div className="w-24 h-24 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 p-3 shadow-lg">
            <img src="/logo.png" alt="B2C Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-1 tracking-tight">BROKER HUB</h1>
          <p className="text-sm font-semibold text-teal-200 italic mb-4">A MYSTRIO Product</p>
          <p className="text-lg opacity-90 leading-relaxed">
            Join our growing community of trusted brokers and businesses.
          </p>
        </div>
      </div>

      {/* Right - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-bg">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-border p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-1">Create Account</h2>
            <p className="text-sm text-gray-text mb-5">Fill in the details to get started</p>

            {/* Account Type Toggle */}
            <div className="flex bg-gray-bg rounded-lg p-1 mb-5">
              {(['customer', 'broker'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200
                    ${accountType === type
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-text hover:text-text-primary'
                    }`}
                >
                  {type === 'customer' ? 'Customer' : 'Broker'}
                </button>
              ))}
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-border rounded-xl text-sm font-semibold text-text-primary hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mb-5"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {isGoogleLoading ? 'Redirecting to Google...' : `Continue as ${accountType === 'broker' ? 'Broker' : 'Customer'} with Google`}
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-label font-medium">or sign up with email</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                {errorMsg}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignUp}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                icon={<User size={18} />}
                value={formData.fullName}
                onChange={handleChange('fullName')}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                icon={<Mail size={18} />}
                value={formData.email}
                onChange={handleChange('email')}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                icon={<Phone size={18} />}
                value={formData.phone}
                onChange={handleChange('phone')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Create a password"
                icon={<Lock size={18} />}
                value={formData.password}
                onChange={handleChange('password')}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                icon={<Lock size={18} />}
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required
              />

              <Button type="submit" variant="primary" size="lg" fullWidth className="mt-2" disabled={isSubmitting}>
                {isSubmitting ? 'Signing up...' : 'Sign Up'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-text mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
