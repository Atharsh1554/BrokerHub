import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Sun, Moon, Check, AlertCircle, Building2, Compass } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: resolveUserDisplayName(user.fullName, user.email),
        email: user.email || '',
        phone: user.phone || '',
        addressLine1: user.addressLine1 || (user.address ? user.address.split(',')[0] : ''),
        addressLine2: user.addressLine2 || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        landmark: user.landmark || '',
      });
    }
  }, [user]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (!formData.fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Phone Number is required.');
      return;
    }
    if (!formData.addressLine1.trim()) {
      setErrorMessage('Address Line 1 is required.');
      return;
    }
    if (!formData.city.trim()) {
      setErrorMessage('City is required.');
      return;
    }
    if (!formData.state.trim()) {
      setErrorMessage('State is required.');
      return;
    }
    if (!formData.pincode.trim()) {
      setErrorMessage('Pincode is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const fullAddressStr = [
        formData.addressLine1,
        formData.addressLine2,
        formData.city,
        formData.state,
        formData.pincode,
        formData.landmark ? `(Landmark: ${formData.landmark})` : '',
      ]
        .filter(Boolean)
        .join(', ');

      // 1. Update Supabase Auth user metadata permanently
      await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          address_line_1: formData.addressLine1,
          address_line_2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          landmark: formData.landmark,
          address: fullAddressStr,
        },
      });

      // 2. Update public.users database table
      const updatePayload: any = {
        full_name: formData.fullName,
        phone: formData.phone,
      };

      // Try setting address columns directly on users table
      updatePayload.address_line_1 = formData.addressLine1;
      updatePayload.address_line_2 = formData.addressLine2;
      updatePayload.city = formData.city;
      updatePayload.state = formData.state;
      updatePayload.pincode = formData.pincode;
      updatePayload.landmark = formData.landmark;
      updatePayload.address = fullAddressStr;

      const { error } = await supabase.from('users').update(updatePayload).eq('id', user.id);

      if (error && error.code === 'PGRST204') {
        // Fallback update for users table if new address columns aren't added to DB schema cache yet
        await supabase
          .from('users')
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
          })
          .eq('id', user.id);
      }

      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving profile address settings:', err);
      setErrorMessage(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Customer Profile & Settings</h1>
          <p className="text-sm text-gray-text">Manage your contact details and default delivery address permanently</p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600" />
            Profile and delivery address updated permanently!
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Theme Toggle */}
      <div className="bg-white rounded-xl border border-gray-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Aesthetic Theme</h2>
        <p className="text-sm text-gray-text mb-4">Choose your preferred visual theme</p>
        <div className="flex gap-3">
          <button
            type="button"
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
            type="button"
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

      <form onSubmit={handleSave}>
        {/* Personal Details */}
        <div className="bg-white rounded-xl border border-gray-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Personal Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={formData.fullName}
              onChange={handleChange('fullName')}
              icon={<User size={18} />}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              disabled
              icon={<Mail size={18} />}
            />
            <Input
              label="Phone Number *"
              value={formData.phone}
              onChange={handleChange('phone')}
              icon={<Phone size={18} />}
              required
            />
          </div>
        </div>

        {/* Residential / Delivery Address */}
        <div className="bg-white rounded-xl border border-gray-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Saved Delivery Address</h2>
          <p className="text-xs text-gray-500 mb-4">
            This address will be automatically linked to all your future product orders during checkout.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Address Line 1 *"
                placeholder="House No., Building Name, Street"
                value={formData.addressLine1}
                onChange={handleChange('addressLine1')}
                icon={<MapPin size={18} />}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Address Line 2 (Optional)"
                placeholder="Apartment, Suite, Area, Sector"
                value={formData.addressLine2}
                onChange={handleChange('addressLine2')}
                icon={<Building2 size={18} />}
              />
            </div>

            <Input
              label="City *"
              placeholder="e.g. Nagercoil, Chennai, Mumbai"
              value={formData.city}
              onChange={handleChange('city')}
              required
            />

            <Input
              label="State *"
              placeholder="e.g. Tamil Nadu, Maharashtra"
              value={formData.state}
              onChange={handleChange('state')}
              required
            />

            <Input
              label="Pincode *"
              placeholder="e.g. 629001"
              value={formData.pincode}
              onChange={handleChange('pincode')}
              required
            />

            <Input
              label="Landmark (Optional)"
              placeholder="e.g. Near Bus Stand / Opposite Temple"
              value={formData.landmark}
              onChange={handleChange('landmark')}
              icon={<Compass size={18} />}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => refreshUser()}>
            Reset
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving Profile...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerSettingsPage;


