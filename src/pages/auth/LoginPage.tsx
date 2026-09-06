import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

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
            Your trusted platform for connecting with verified brokers and growing your business.
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-bg">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-border p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
              <img src="/logo.png" alt="B2C Logo" className="h-10 w-auto object-contain" />
              <span className="font-bold text-xl text-text-primary tracking-tight">BROKER HUB</span>
            </div>

            <h2 className="text-2xl font-bold text-text-primary mb-1">Welcome back</h2>
            <p className="text-sm text-gray-text mb-8">Sign in to your account to continue</p>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                icon={<Mail size={18} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={<Lock size={18} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-border text-primary focus:ring-primary"
                  />
                  <span className="text-gray-text">Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary font-medium hover:underline">
                  Forgot password?
                </a>
              </div>

              <Link to="/customer/dashboard">
                <Button variant="primary" size="lg" fullWidth className="mt-2">
                  Sign In
                </Button>
              </Link>
            </form>

            <p className="text-center text-sm text-gray-text mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
