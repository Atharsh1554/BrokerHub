import React, { useState, useEffect, useRef } from 'react';
import { User, Building, CreditCard, Bell, Save, Check, Upload, AlertCircle, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { updateBrokerProfile, uploadBrokerAvatar } from '../../lib/api/brokers';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

const PRODUCT_TYPE_OPTIONS = [
  'Electronics & Hardware',
  'Industrial Products & Machinery',
  'Furniture & Fixtures',
  'Food Products & Agro',
  'Textiles & Apparel',
  'Automotive & Spare Parts',
  'Construction Materials',
  'Multiple Categories',
];

export const BrokerSettings: React.FC = () => {
  const { user, updateUserLocal, refreshUser } = useAuth();
  const { brokers, refreshBrokers, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'payouts' | 'notifications'>('profile');

  // Broker details from context or overrides
  const currentBroker = brokers.find((b) => b.id === user?.id || b.id === 'b1');

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [productType, setProductType] = useState('Industrial Products & Machinery');
  const [customProductType, setCustomProductType] = useState('');
  const [about, setAbout] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Status & Validation State
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form with latest data from DB / auth / broker record
  useEffect(() => {
    const rawOverrides = localStorage.getItem('brokerhub_broker_overrides');
    let localOv: any = null;
    if (rawOverrides && user?.id) {
      try {
        localOv = JSON.parse(rawOverrides)[user.id];
      } catch {}
    }

    const initialName = localOv?.name || user?.fullName || currentBroker?.name || '';
    const initialBrand = localOv?.company || currentBroker?.company || 'MYTRIO';
    const initialEmail = localOv?.email || user?.email || currentBroker?.email || '';
    const initialPhone = localOv?.phone || user?.phone || currentBroker?.phone || '';
    const initialSpecialty = localOv?.specialty || currentBroker?.specialty || 'Industrial Products & Machinery';
    const initialAbout = localOv?.description || currentBroker?.description || '';
    const initialAvatar = localOv?.avatar || user?.avatar || currentBroker?.avatar || null;

    setFullName(initialName);
    setBrandName(initialBrand);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setAbout(initialAbout);
    setAvatarPreview(initialAvatar);

    if (PRODUCT_TYPE_OPTIONS.includes(initialSpecialty)) {
      setProductType(initialSpecialty);
      setCustomProductType('');
    } else {
      setProductType('Custom');
      setCustomProductType(initialSpecialty);
    }
  }, [user, currentBroker]);

  const displayName = resolveUserDisplayName(fullName || user?.fullName, email || user?.email);
  const initials = getUserInitials(displayName);

  // Handle Photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Please choose a JPG, PNG, or WebP image file.');
      return;
    }

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB.');
      return;
    }

    setSelectedFile(file);

    // Instant client-side preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = (): boolean => {
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return false;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }

    if (phone.trim() && !/^[+0-9\s\-()]{7,20}$/.test(phone.trim())) {
      setErrorMessage('Please enter a valid phone number (7-20 digits).');
      return false;
    }

    const resolvedProductType = productType === 'Custom' ? customProductType.trim() : productType;
    if (!resolvedProductType) {
      setErrorMessage('Product Type is required.');
      return false;
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const brokerId = user?.id || currentBroker?.id || 'b1';
      const resolvedProductType = productType === 'Custom' ? customProductType.trim() : productType;

      let finalAvatarUrl = avatarPreview || '';

      // Upload new avatar if file was selected
      if (selectedFile) {
        try {
          finalAvatarUrl = await uploadBrokerAvatar(selectedFile, brokerId);
        } catch (uploadErr: any) {
          console.warn('Avatar upload fallback used:', uploadErr);
        }
      }

      // Save to Supabase DB & Local Storage
      const result = await updateBrokerProfile(brokerId, {
        fullName: fullName.trim(),
        company: brandName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        specialty: resolvedProductType,
        description: about.trim(),
        avatar: finalAvatarUrl || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save profile');
      }

      // Update local AuthContext user
      updateUserLocal({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: finalAvatarUrl || undefined,
      });

      // Refresh app contexts
      await refreshUser();
      await refreshBrokers();

      setSaveSuccess(true);
      showToast('Profile updated successfully.', 'success');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMessage(err?.message || 'An error occurred while saving your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-border shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Broker Profile & Settings</h1>
          <p className="text-sm text-gray-text mt-1">
            Manage your verified public profile, brand credentials, product categories, and buyer preferences
          </p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            Profile updated successfully.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="bg-white p-3 rounded-2xl border border-gray-border shadow-xs space-y-1 h-fit">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary-50 text-primary'
                : 'text-gray-text hover:bg-gray-50 hover:text-text-primary'
            }`}
          >
            <User className="w-4 h-4" />
            Broker Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'business'
                ? 'bg-primary-50 text-primary'
                : 'text-gray-text hover:bg-gray-50 hover:text-text-primary'
            }`}
          >
            <Building className="w-4 h-4" />
            Business & Licensing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-primary-50 text-primary'
                : 'text-gray-text hover:bg-gray-50 hover:text-text-primary'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Payout Methods
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-primary-50 text-primary'
                : 'text-gray-text hover:bg-gray-50 hover:text-text-primary'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
        </div>

        {/* Settings Form Panel */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-7 rounded-2xl border border-gray-border shadow-xs">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Validation Error</p>
                  <p className="text-xs mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* TAB 1: BROKER PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-border pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Broker Public Profile
                    </h3>
                    <p className="text-xs text-gray-text mt-0.5">
                      Information displayed on your public store, customer broker profile, and shared links
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    <ShieldCheck size={12} />
                    Verified Broker Record
                  </span>
                </div>

                {/* 1. Profile Photo / Avatar */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-label">
                    Profile Photo
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-gray-bg rounded-2xl border border-gray-border">
                    <div className="relative group shrink-0">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={displayName}
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/30 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
                          {initials}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                          id="avatar-upload-input"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-1.5 text-xs font-bold"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {avatarPreview ? 'Change Avatar' : 'Upload Avatar'}
                        </Button>

                        {avatarPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            className="text-xs text-status-red hover:bg-red-50 gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-label">
                        Supported formats: JPG, JPEG, PNG, or WebP. Max file size: 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Full Name & 3. Brand Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Atharsh S"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      Brand Name / Company
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. MYTRIO"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 4. Email ID & 5. Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. jithuatharsh123@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 6. Product Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-label">
                    Product Type / Category Focus <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    {PRODUCT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="Custom">Other (Specify Custom Category)</option>
                  </select>

                  {productType === 'Custom' && (
                    <input
                      type="text"
                      value={customProductType}
                      onChange={(e) => setCustomProductType(e.target.value)}
                      placeholder="Enter custom product type/categories..."
                      className="w-full mt-2 px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  )}
                  <p className="text-xs text-gray-label">
                    Buyers use product type filters to find and connect with specialized brokers.
                  </p>
                </div>

                {/* 7. About */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-label">
                    About / Business Specialization
                  </label>
                  <textarea
                    rows={4}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Describe your brokerage services, verified products, brand background, supply chain network, and client commitments..."
                    className="w-full p-3.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-gray-label">
                    <span>This description appears on your customer profile and shop link.</span>
                    <span>{about.length} characters</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BUSINESS */}
            {activeTab === 'business' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary border-b border-gray-border pb-3">
                  Business & Commission Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      Registered Entity Name
                    </label>
                    <input
                      type="text"
                      defaultValue={brandName || "MYTRIO Commercial Services LLC"}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      GSTIN / Business Registration ID
                    </label>
                    <input
                      type="text"
                      defaultValue="33AAAAA0000A1Z5"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      Standard Brokerage Margin (%)
                    </label>
                    <input
                      type="text"
                      defaultValue="3.5%"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      Minimum Bulk Order Threshold (₹)
                    </label>
                    <input
                      type="text"
                      defaultValue="₹1,00,000"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PAYOUTS */}
            {activeTab === 'payouts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary border-b border-gray-border pb-3">
                  Direct Settlement & Bank Details
                </h3>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-950 text-sm">HDFC Bank (Verified Payout Account)</p>
                      <p className="text-xs text-emerald-700">Account ending in ****7821 · IFSC: HDFC0001234</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Primary
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      Bank IFSC Code
                    </label>
                    <input
                      type="text"
                      defaultValue="HDFC0001234"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-label mb-1.5">
                      Account Number
                    </label>
                    <input
                      type="text"
                      defaultValue="50100098767821"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary border-b border-gray-border pb-3">
                  Broker Alert & Notification Preferences
                </h3>

                <div className="space-y-3">
                  {[
                    { title: 'New Customer Inquiries & Quotes', desc: 'Notify instantly when a customer sends a message or deal inquiry' },
                    { title: 'Order & Shipment Status Changes', desc: 'Receive notifications when orders are placed, accepted, or delivered' },
                    { title: 'Weekly Trade & Commission Report', desc: 'Receive performance summaries of active listings and monthly revenue' },
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-border hover:bg-gray-50 cursor-pointer transition-colors">
                      <div>
                        <p className="font-semibold text-sm text-text-primary">{item.title}</p>
                        <p className="text-xs text-gray-text mt-0.5">{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary rounded cursor-pointer" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Form Action Footer */}
            <div className="border-t border-gray-border pt-5 flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-gray-label">
                All changes are permanently saved and synchronized across your public profile.
              </p>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="gap-2 px-6 py-2.5 font-bold shadow-md cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrokerSettings;
