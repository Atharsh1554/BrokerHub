import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Mail, Phone, Lock } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const [accountType, setAccountType] = useState<'customer' | 'broker'>('customer');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
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
            <p className="text-sm text-gray-text mb-6">Fill in the details to get started</p>

            {/* Account Type Toggle */}
            <div className="flex bg-gray-bg rounded-lg p-1 mb-6">
              {(['customer', 'broker'] as const).map((type) => (
                <button
                  key={type}
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

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                icon={<User size={18} />}
                value={formData.fullName}
                onChange={handleChange('fullName')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                icon={<Mail size={18} />}
                value={formData.email}
                onChange={handleChange('email')}
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
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                icon={<Lock size={18} />}
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
              />

              <Link to={accountType === 'broker' ? '/broker/dashboard' : '/customer/dashboard'}>
                <Button variant="primary" size="lg" fullWidth className="mt-2">
                  Sign Up
                </Button>
              </Link>
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
