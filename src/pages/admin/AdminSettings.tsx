import React, { useState } from 'react';
import { Settings, User, Lock, Bell, Shield, CheckCircle2, Save } from 'lucide-react';
import { logAdminActivity } from '../../lib/api/admin';

export const AdminSettings: React.FC = () => {
  const [tab, setTab] = useState<'profile' | 'security' | 'notifications' | 'platform' | 'roles'>('profile');

  // Form states
  const [adminName, setAdminName] = useState('Super Administrator');
  const [adminEmail, setAdminEmail] = useState('admin@brokerhub.com');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await logAdminActivity('Admin Settings Modified', `Updated section: ${tab}`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const rolesMatrix = [
    { role: 'SUPER ADMIN', desc: 'Full unrestricted platform access, system configuration, role delegation & audit logs', usersCount: 1, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { role: 'ADMIN', desc: 'Manage brokers, customers, orders, products, meetings & reports', usersCount: 3, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
    { role: 'MODERATOR', desc: 'Review moderation, broker verification checking, and customer assistance', usersCount: 2, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Admin Settings & Permission Controls</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage administrator credentials, security policies, platform defaults, and role-based permissions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { key: 'profile', label: 'Admin Profile', icon: User },
          { key: 'security', label: 'Security & Password', icon: Lock },
          { key: 'notifications', label: 'Notifications', icon: Bell },
          { key: 'platform', label: 'Platform Config', icon: Settings },
          { key: 'roles', label: 'Roles & Permissions', icon: Shield },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === item.key
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully! Audit log recorded.</span>
        </div>
      )}

      {/* Tab Contents */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl max-w-3xl">
        {tab === 'profile' && (
          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            <h2 className="text-sm font-bold text-white mb-4">Administrator Profile Information</h2>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Admin Email Address</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </form>
        )}

        {tab === 'security' && (
          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            <h2 className="text-sm font-bold text-white mb-4">Password & Session Security</h2>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordCurrent}
                onChange={(e) => setPasswordCurrent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordNew}
                onChange={(e) => setPasswordNew(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </form>
        )}

        {tab === 'notifications' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white mb-4">System Notification Preferences</h2>
            <label className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
              <span className="text-slate-300 font-semibold">Email alerts for new broker verification requests</span>
            </label>
            <label className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
              <span className="text-slate-300 font-semibold">Alerts for reported customer reviews</span>
            </label>
            <label className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
              <span className="text-slate-300 font-semibold">Daily transaction summary digests</span>
            </label>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </form>
        )}

        {tab === 'platform' && (
          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            <h2 className="text-sm font-bold text-white mb-4">Platform Operational Settings</h2>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Platform Name</label>
              <input
                type="text"
                defaultValue="BROKER HUB"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Razorpay Key ID (Public)</label>
              <input
                type="text"
                defaultValue="rzp_live_brokerhub_demo"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Platform Settings</span>
            </button>
          </form>
        )}

        {tab === 'roles' && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white mb-2">Role & Permission Hierarchy</h2>
            <p className="text-slate-400 text-[11px] mb-4">
              BROKER HUB uses role-based access control (RBAC).
            </p>
            <div className="space-y-3">
              {rolesMatrix.map((r, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${r.color}`}>
                      {r.role}
                    </span>
                    <span className="text-[11px] text-slate-500">{r.usersCount} Assigned Admin(s)</span>
                  </div>
                  <p className="text-slate-300">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
