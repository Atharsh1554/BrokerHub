import React, { useState } from 'react';
import { User, Building, CreditCard, Bell, Save, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { resolveUserDisplayName, getUserInitials } from '../../lib/userUtils';

export const BrokerSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'payouts' | 'notifications'>('profile');
  const [saved, setSaved] = useState(false);

  const displayName = resolveUserDisplayName(user?.fullName, user?.email);
  const initials = getUserInitials(displayName);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Broker Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your broker profile, commission rates, and payout preferences
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl text-xs font-medium border border-emerald-200 dark:border-emerald-800">
            <Check className="w-4 h-4" />
            Changes saved successfully!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1 h-fit">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <User className="w-4 h-4" />
            Broker Profile
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'business'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Building className="w-4 h-4" />
            Business & Licensing
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'payouts'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Payout Methods
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
        </div>

        {/* Settings Form Panel */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <form onSubmit={handleSave} className="space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  Broker Public Profile
                </h3>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                    {initials}
                  </div>
                  <div>
                    <Button type="button" variant="outline" size="sm">Change Avatar</Button>
                    <p className="text-xs text-zinc-400 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" defaultValue={displayName} />
                  <Input label="License Number" defaultValue="BRK-2024-9981" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Email Address" defaultValue={user?.email || 'contact@apexbrokerage.com'} />
                  <Input label="Phone Number" defaultValue={user?.phone || '+1 (555) 234-5678'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Bio & Broker Specialty
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Specialized commercial and industrial broker matching verified buyers with premier tech and energy hardware manufacturers."
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                  />
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  Business & Commission Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Registered Entity Name" defaultValue="Apex Brokerage Services LLC" />
                  <Input label="Tax ID / EIN" defaultValue="XX-XXX8921" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Standard Commission Rate (%)" defaultValue="4.5%" />
                  <Input label="Minimum Deal Threshold (₹)" defaultValue="₹5,00,000" />
                </div>
              </div>
            )}

            {activeTab === 'payouts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  Direct Deposit & Payout Method
                </h3>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-950 dark:text-emerald-200 text-sm">Bank of America (Verified)</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">Account ending in ****4829</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-full">
                    Primary
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Input label="Bank Routing Number" defaultValue="121000358" />
                  <Input label="Account Number" defaultValue="*********4829" />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  Broker Alert Preferences
                </h3>

                <div className="space-y-3">
                  {[
                    { title: 'New Customer Inquiry Alerts', desc: 'Notify instantly when a buyer sends a message or deal inquiry' },
                    { title: 'Order Status Changes', desc: 'Receive push notifications when shipments are updated' },
                    { title: 'Weekly Performance Digest', desc: 'Receive a summary of total commission earned every Monday' },
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                      <div>
                        <p className="font-medium text-sm text-zinc-900 dark:text-white">{item.title}</p>
                        <p className="text-xs text-zinc-400">{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 rounded" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-end">
              <Button type="submit" variant="primary" className="gap-2">
                <Save className="w-4 h-4" />
                Save Preferences
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
