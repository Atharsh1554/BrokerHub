import React, { useState } from 'react';
import { Settings, User, Lock, Bell, Shield, CheckCircle2, Save, Sun, Moon } from 'lucide-react';
import { logAdminActivity } from '../../lib/api/admin';
import { useAdminTheme } from '../../context/AdminThemeContext';

export const AdminSettings: React.FC = () => {
  const [tab, setTab] = useState<'profile' | 'security' | 'notifications' | 'platform' | 'roles'>('profile');
  const { theme, setTheme } = useAdminTheme();
  const isLight = theme === 'light';

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
    { role: 'SUPER ADMIN', desc: 'Full unrestricted platform access, system configuration, role delegation & audit logs', usersCount: 1, color: isLight ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { role: 'ADMIN', desc: 'Manage brokers, customers, orders, products, meetings & reports', usersCount: 3, color: isLight ? 'text-indigo-700 border-indigo-300 bg-indigo-50' : 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
    { role: 'MODERATOR', desc: 'Review moderation, broker verification checking, and customer assistance', usersCount: 2, color: isLight ? 'text-amber-700 border-amber-300 bg-amber-50' : 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Settings className="w-5 h-5 text-emerald-500" />
            <span>Admin Settings & Theme Controls</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Manage administrator credentials, appearance theme, security policies, platform defaults, and role permissions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex flex-wrap gap-2 border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        {[
          { key: 'profile', label: 'Admin Profile', icon: User },
          { key: 'security', label: 'Security & Password', icon: Lock },
          { key: 'notifications', label: 'Notifications', icon: Bell },
          { key: 'platform', label: 'Platform & Theme', icon: Settings },
          { key: 'roles', label: 'Roles & Permissions', icon: Shield },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === item.key
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : isLight
                  ? 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
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
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center space-x-2 ${
          isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Settings saved successfully! Audit log recorded.</span>
        </div>
      )}

      {/* Tab Contents */}
      <div className={`rounded-3xl border p-6 max-w-3xl ${
        isLight ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-slate-900 border-slate-800 shadow-xl text-white'
      }`}>
        {tab === 'profile' && (
          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            <h2 className={`text-sm font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Administrator Profile Information</h2>
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Full Name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Admin Email Address</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-800 border-slate-700 text-white'
                }`}
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
            <h2 className={`text-sm font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Password & Session Security</h2>
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordCurrent}
                onChange={(e) => setPasswordCurrent(e.target.value)}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordNew}
                onChange={(e) => setPasswordNew(e.target.value)}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-800 border-slate-700 text-white'
                }`}
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
            <h2 className={`text-sm font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>System Notification Preferences</h2>
            <label className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
              <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>Email alerts for new broker verification requests</span>
            </label>
            <label className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
              <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>Alerts for reported customer reviews</span>
            </label>
            <label className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <input type="checkbox" defaultChecked className="rounded accent-emerald-500" />
              <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>Daily transaction summary digests</span>
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
          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Platform Appearance & Operational Settings</h2>
            
            {/* Theme Toggle Selection Card */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <label className={`block font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Admin Dashboard Theme Mode
              </label>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose your preferred visual presentation theme for the Admin Portal.
              </p>
              <div className="flex items-center space-x-4 pt-1">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                    isLight
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light Theme (Active)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                    !isLight
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark Theme</span>
                </button>
              </div>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Platform Name</label>
              <input
                type="text"
                defaultValue="BROKER HUB"
                className={`w-full rounded-xl p-3 border ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Razorpay Key ID (Public)</label>
              <input
                type="text"
                defaultValue="rzp_live_brokerhub_demo"
                className={`w-full rounded-xl p-3 border font-mono ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
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
            <h2 className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Role & Permission Hierarchy</h2>
            <p className={`text-[11px] mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              BROKER HUB uses role-based access control (RBAC).
            </p>
            <div className="space-y-3">
              {rolesMatrix.map((r, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${r.color}`}>
                      {r.role}
                    </span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{r.usersCount} Assigned Admin(s)</span>
                  </div>
                  <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
