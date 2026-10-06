import React, { useEffect, useState, useCallback } from 'react';
import {
  Percent,
  DollarSign,
  Search,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Users,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminTheme } from '../../context/AdminThemeContext';

type CommissionType = 'NONE' | 'FIXED' | 'PERCENTAGE';

interface BrokerCommission {
  broker_id: string;
  broker_name: string;
  broker_email: string;
  commission_type: CommissionType;
  commission_value: number;
  is_active: boolean;
}

const MAX_PERCENTAGE = 50; // Enforce max 50% commission

const commissionTypeOptions: { value: CommissionType; label: string; icon: React.ReactNode }[] = [
  { value: 'NONE', label: 'No Commission', icon: <span className="text-gray-400">₹0</span> },
  { value: 'FIXED', label: 'Fixed Amount', icon: <DollarSign className="w-3.5 h-3.5" /> },
  { value: 'PERCENTAGE', label: 'Percentage', icon: <Percent className="w-3.5 h-3.5" /> },
];

const previewCommission = (gross: number, type: CommissionType, value: number) => {
  if (type === 'NONE') return { commission: 0, brokerAmount: gross };
  if (type === 'FIXED') return { commission: Math.max(0, value), brokerAmount: Math.max(0, gross - value) };
  if (type === 'PERCENTAGE') return {
    commission: Math.round(gross * value) / 100,
    brokerAmount: Math.round(gross * (100 - value)) / 100,
  };
  return { commission: 0, brokerAmount: gross };
};

export const AdminCommissions: React.FC = () => {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [brokers, setBrokers] = useState<BrokerCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, { type: CommissionType; value: number }>>({});

  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all brokers with their commission config
      const { data: brokerRows, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'broker')
        .order('full_name');

      if (error) throw error;

      // Fetch commissions
      const { data: commRows } = await supabase
        .from('broker_commissions')
        .select('broker_id, commission_type, commission_value, is_active');

      const commMap = new Map(commRows?.map((c: any) => [c.broker_id, c]) || []);

      const combined: BrokerCommission[] = (brokerRows || []).map((b: any) => {
        const comm = commMap.get(b.id) as any;
        return {
          broker_id: b.id,
          broker_name: b.full_name,
          broker_email: b.email,
          commission_type: comm?.commission_type || 'NONE',
          commission_value: comm?.commission_value || 0,
          is_active: comm?.is_active ?? true,
        };
      });

      setBrokers(combined);
      // Seed editing state with current values
      const editMap: Record<string, { type: CommissionType; value: number }> = {};
      combined.forEach((b) => {
        editMap[b.broker_id] = { type: b.commission_type, value: b.commission_value };
      });
      setEditing(editMap);
    } catch (err: any) {
      console.error('[AdminCommissions] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBrokers(); }, [fetchBrokers]);

  const validateCommission = (type: CommissionType, value: number, brokerId: string): boolean => {
    const newErrors = { ...errors };
    if (type === 'FIXED') {
      if (value < 0) { newErrors[brokerId] = 'Commission cannot be negative'; setErrors(newErrors); return false; }
      if (value > 100000) { newErrors[brokerId] = 'Fixed commission too high (max ₹1,00,000)'; setErrors(newErrors); return false; }
    }
    if (type === 'PERCENTAGE') {
      if (value < 0) { newErrors[brokerId] = 'Percentage cannot be negative'; setErrors(newErrors); return false; }
      if (value > MAX_PERCENTAGE) { newErrors[brokerId] = `Percentage cannot exceed ${MAX_PERCENTAGE}%`; setErrors(newErrors); return false; }
    }
    delete newErrors[brokerId];
    setErrors(newErrors);
    return true;
  };

  const handleSave = async (brokerId: string) => {
    const edit = editing[brokerId];
    if (!edit) return;
    if (!validateCommission(edit.type, edit.value, brokerId)) return;

    setSaving((s) => ({ ...s, [brokerId]: true }));
    try {
      const { error } = await supabase
        .from('broker_commissions')
        .upsert({
          broker_id: brokerId,
          commission_type: edit.type,
          commission_value: edit.value,
          is_active: true,
          effective_from: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'broker_id' });

      if (error) throw error;

      setBrokers((prev) =>
        prev.map((b) =>
          b.broker_id === brokerId
            ? { ...b, commission_type: edit.type, commission_value: edit.value }
            : b
        )
      );

      setSaved((s) => ({ ...s, [brokerId]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [brokerId]: false })), 3000);
    } catch (err: any) {
      setErrors((e) => ({ ...e, [brokerId]: err.message || 'Save failed' }));
    } finally {
      setSaving((s) => ({ ...s, [brokerId]: false }));
    }
  };

  const PREVIEW_AMOUNT = 1000;

  const filteredBrokers = brokers.filter((b) =>
    b.broker_name.toLowerCase().includes(search.toLowerCase()) ||
    b.broker_email.toLowerCase().includes(search.toLowerCase())
  );

  const cl = (light: string, dark: string) => isLight ? light : dark;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border ${cl('bg-white border-slate-200 shadow-sm', 'bg-slate-900 border-slate-800')}`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center gap-2 ${cl('text-slate-900', 'text-white')}`}>
            <Percent className="w-5 h-5 text-emerald-500" />
            Commission Management
          </h1>
          <p className={`text-xs mt-1 ${cl('text-slate-500', 'text-slate-400')}`}>
            Set per-broker platform commission. Changes apply to future orders only — past orders retain their original commission.
          </p>
        </div>
        <button
          onClick={fetchBrokers}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${cl('bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100', 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700')}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${cl('bg-blue-50 border-blue-200', 'bg-blue-500/10 border-blue-500/30')}`}>
        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className={`text-xs font-semibold ${cl('text-blue-800', 'text-blue-300')}`}>Commission is currently ₹0 for all brokers (initial launch)</p>
          <p className={`text-xs mt-0.5 ${cl('text-blue-700', 'text-blue-400')}`}>
            Negotiate individual commission rates with brokers. Set <strong>Fixed</strong> (e.g., ₹15) or <strong>Percentage</strong> (e.g., 2%) per broker.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brokers by name or email..."
          className={`w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border transition-all ${cl('bg-white border-slate-200 text-slate-900 placeholder-slate-400', 'bg-slate-800 border-slate-700 text-white placeholder-slate-400')}`}
        />
      </div>

      {/* Brokers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className={`text-sm ${cl('text-slate-500', 'text-slate-400')}`}>Loading brokers...</span>
        </div>
      ) : filteredBrokers.length === 0 ? (
        <div className={`text-center py-12 text-sm ${cl('text-slate-400', 'text-slate-500')}`}>
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          {search ? 'No brokers match your search.' : 'No brokers found in the system.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBrokers.map((broker) => {
            const edit = editing[broker.broker_id] || { type: broker.commission_type, value: broker.commission_value };
            const { commission, brokerAmount } = previewCommission(PREVIEW_AMOUNT, edit.type, edit.value);
            const isSaving = saving[broker.broker_id];
            const isSaved = saved[broker.broker_id];
            const errorMsg = errors[broker.broker_id];
            const isDirty = edit.type !== broker.commission_type || edit.value !== broker.commission_value;

            return (
              <div
                key={broker.broker_id}
                className={`p-5 rounded-2xl border transition-all ${cl('bg-white border-slate-200 shadow-sm', 'bg-slate-900 border-slate-800')}`}
              >
                {/* Broker Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`font-bold text-sm ${cl('text-slate-900', 'text-white')}`}>{broker.broker_name}</p>
                    <p className={`text-xs ${cl('text-slate-500', 'text-slate-400')}`}>{broker.broker_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaved && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      edit.type === 'NONE'
                        ? cl('bg-slate-100 text-slate-600 border-slate-200', 'bg-slate-800 text-slate-300 border-slate-700')
                        : cl('bg-emerald-50 text-emerald-700 border-emerald-200', 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30')
                    }`}>
                      {edit.type === 'NONE' ? 'No Commission' : edit.type === 'FIXED' ? `₹${edit.value}` : `${edit.value}%`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Commission Type */}
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${cl('text-slate-500', 'text-slate-400')}`}>
                      Commission Type
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {commissionTypeOptions.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            edit.type === opt.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                              : cl('border-slate-200 hover:border-slate-300 bg-slate-50', 'border-slate-700 hover:border-slate-600 bg-slate-800')
                          }`}
                        >
                          <input
                            type="radio"
                            name={`type-${broker.broker_id}`}
                            value={opt.value}
                            checked={edit.type === opt.value}
                            onChange={() => setEditing((e) => ({
                              ...e,
                              [broker.broker_id]: { type: opt.value, value: opt.value === 'NONE' ? 0 : (e[broker.broker_id]?.value || 0) }
                            }))}
                            className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600"
                          />
                          <span className="text-xs font-semibold text-current">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Commission Value */}
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${cl('text-slate-500', 'text-slate-400')}`}>
                      Commission Value
                    </label>
                    {edit.type === 'NONE' ? (
                      <div className={`p-3 rounded-xl border ${cl('bg-slate-50 border-slate-200 text-slate-400', 'bg-slate-800 border-slate-700 text-slate-500')} text-sm italic`}>
                        No commission charged
                      </div>
                    ) : (
                      <div className="relative">
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${cl('text-slate-500', 'text-slate-400')}`}>
                          {edit.type === 'FIXED' ? '₹' : '%'}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={edit.type === 'PERCENTAGE' ? MAX_PERCENTAGE : 100000}
                          step={edit.type === 'PERCENTAGE' ? 0.1 : 1}
                          value={edit.value}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditing((prev) => ({ ...prev, [broker.broker_id]: { ...prev[broker.broker_id], value: val } }));
                            validateCommission(edit.type, val, broker.broker_id);
                          }}
                          className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${cl('bg-white border-slate-200 text-slate-900', 'bg-slate-800 border-slate-700 text-white')}`}
                          placeholder={edit.type === 'FIXED' ? '0' : '0.0'}
                        />
                      </div>
                    )}
                    {errorMsg && (
                      <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errorMsg}
                      </p>
                    )}
                  </div>

                  {/* Live Preview */}
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${cl('text-slate-500', 'text-slate-400')}`}>
                      Preview (₹{PREVIEW_AMOUNT.toLocaleString('en-IN')} order)
                    </label>
                    <div className={`p-3 rounded-xl border space-y-2 text-xs ${cl('bg-slate-50 border-slate-200', 'bg-slate-800 border-slate-700')}`}>
                      <div className="flex justify-between">
                        <span className={cl('text-slate-500', 'text-slate-400')}>Product Amount</span>
                        <span className={`font-semibold ${cl('text-slate-900', 'text-white')}`}>₹{PREVIEW_AMOUNT.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cl('text-slate-500', 'text-slate-400')}>Platform Commission</span>
                        <span className="font-semibold text-amber-600">₹{commission.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={`flex justify-between pt-1.5 border-t ${cl('border-slate-200', 'border-slate-700')}`}>
                        <span className="font-bold text-emerald-600">Broker Amount</span>
                        <span className="font-bold text-emerald-600">₹{brokerAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => handleSave(broker.broker_id)}
                    disabled={isSaving || !isDirty || Boolean(errorMsg)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      isSaved
                        ? 'bg-emerald-500 text-white'
                        : isDirty && !errorMsg
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        : cl('bg-slate-100 text-slate-400 cursor-not-allowed', 'bg-slate-800 text-slate-500 cursor-not-allowed')
                    }`}
                  >
                    {isSaving ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                    ) : isSaved ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
                    ) : (
                      <><Save className="w-3.5 h-3.5" /> Save Commission</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCommissions;
