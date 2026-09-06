import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Phone, Mail, Star } from 'lucide-react';

export const BrokerAuthPage: React.FC = () => {
  const [authTab, setAuthTab] = useState<'email' | 'phone'>('email');
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left - Purple Gradient Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary via-indigo-500 to-purple-700 items-center justify-center p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />

        <div className="text-center text-white max-w-md relative z-10">
          <div className="w-24 h-24 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 p-3 shadow-xl">
            <img src="/logo.png" alt="B2C Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-1 tracking-tight">BROKER HUB</h1>
          <p className="text-sm font-semibold text-purple-200 italic mb-8">A MYSTRIO Product</p>
          <p className="text-lg opacity-90 leading-relaxed mb-12">
            The professional platform for brokers to manage clients, products, and grow their business.
          </p>

          {/* Testimonial Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left border border-white/20">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm opacity-90 leading-relaxed mb-4">
              "BrokerHub has transformed how I manage my clients. The dashboard is intuitive and the matching system brings me qualified leads every week."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                JD
              </div>
              <div>
                <p className="text-sm font-semibold">James Davidson</p>
                <p className="text-xs opacity-75">Senior Broker, Apex Group</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img src="/logo.png" alt="B2C Logo" className="h-10 w-auto object-contain" />
            <span className="font-bold text-xl text-secondary tracking-tight">BROKER HUB</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Create Your Account</h2>
          <p className="text-sm text-gray-text mb-6">Start managing your brokerage efficiently</p>

          {/* Email / Phone Tabs */}
          <div className="flex bg-gray-bg rounded-lg p-1 mb-6">
            {(['email', 'phone'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setAuthTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200
                  ${authTab === tab
                    ? 'bg-white text-secondary shadow-sm'
                    : 'text-gray-text hover:text-text-primary'
                  }`}
              >
                {tab === 'email' ? 'Email' : 'Phone'}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              icon={<User size={18} />}
            />

            {authTab === 'email' ? (
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                icon={<Mail size={18} />}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Phone Number</label>
                <div className="flex gap-2">
                  <select className="w-24 px-3 py-2.5 border border-gray-border rounded-lg text-sm bg-white">
                    <option>+1</option>
                    <option>+44</option>
                    <option>+91</option>
                    <option>+61</option>
                  </select>
                  <div className="flex-1">
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      icon={<Phone size={18} />}
                    />
                  </div>
                </div>
              </div>
            )}

            <Input
              label="OTP Verification"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-border text-secondary focus:ring-secondary"
              />
              <span className="text-gray-text">
                I agree to the{' '}
                <a href="#" className="text-secondary font-medium hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-secondary font-medium hover:underline">Privacy Policy</a>
              </span>
            </label>

            <Link to="/broker/dashboard">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="!bg-secondary hover:!bg-secondary-dark mt-2"
              >
                Create Account
              </Button>
            </Link>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-label">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-border rounded-lg text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-border rounded-lg text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-text mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-secondary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
