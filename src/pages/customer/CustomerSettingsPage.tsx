import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Sun, Moon, Check } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName } from '../../lib/userUtils';
import { supabase } from '../../lib/supabase';

export const CustomerSettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '123 Main Street, Apt 4B',
    city: 'New York',
    state: 'NY',
    zip: '10001',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: resolveUserDisplayName(user.fullName, user.email),
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
        })
        .eq('id', user.id);

      if (!error) {
        await refreshUser();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Portal Settings</h1>
          <p className="text-sm text-gray-text">Manage your contact details, security credentials, and system preferences</p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-200">
            <Check className="w-4 h-4" />
            Profile updated successfully!
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <div className="bg-white rounded-xl border border-gray-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Aesthetic Theme</h2>
        <p className="text-sm text-gray-text mb-4">Choose your preferred visual theme</p>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all border cursor-pointer
              ${theme === 'light'
                ? 'bg-primary-50 text-primary border-primary'
                : 'bg-white text-gray-text border-gray-border hover:bg-gray-50'
              }`}
          >
            <Sun size={18} />
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all border cursor-pointer
              ${theme === 'dark'
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-gray-text border-gray-border hover:bg-gray-50'
              }`}
          >
            <Moon size={18} />
            Dark
          </button>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-white rounded-xl border border-gray-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Personal Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={formData.fullName}
            onChange={handleChange('fullName')}
            icon={<User size={18} />}
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            disabled
            icon={<Mail size={18} />}
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange('phone')}
            icon={<Phone size={18} />}
          />
        </div>
      </div>

      {/* Residential Address */}
      <div className="bg-white rounded-xl border border-gray-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Residential Address</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Street Address"
              value={formData.address}
              onChange={handleChange('address')}
              icon={<MapPin size={18} />}
            />
          </div>
          <Input
            label="City"
            value={formData.city}
            onChange={handleChange('city')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="State"
              value={formData.state}
              onChange={handleChange('state')}
            />
            <Input
              label="ZIP Code"
              value={formData.zip}
              onChange={handleChange('zip')}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => refreshUser()}>Reset</Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

