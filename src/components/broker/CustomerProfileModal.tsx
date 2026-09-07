import React from 'react';
import { X, Phone, Mail, MapPin, Calendar, ShoppingBag, DollarSign, ShieldCheck, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import type { CustomerProfile } from '../../types';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile | null;
  onCall?: () => void;
  onMessage?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onCall,
  onMessage,
}) => {
  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-4 relative flex items-end justify-between">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Customer Profile</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 bg-white">
          {/* Avatar & Basic Info */}
          <div className="flex items-start justify-between -mt-12 mb-4">
            <div className="relative">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md">
                  {profile.fullName.charAt(0)}
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div className="pt-14 text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {profile.status || 'Active Customer'}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {profile.fullName}
            </h2>
            <p className="text-sm text-slate-500">
              Customer ID: <span className="font-mono text-xs">{profile.id}</span>
            </p>
          </div>

          {/* Details grid */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs text-slate-400">Email Address</p>
                <p className="font-medium text-slate-800 truncate">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs text-slate-400">Direct Phone</p>
                <p className="font-medium text-slate-800 truncate">{profile.phone}</p>
              </div>
            </div>

            {profile.location && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="font-medium text-slate-800 truncate">{profile.location}</p>
                </div>
              </div>
            )}

            {profile.joinedDate && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-400">Member Since</p>
                  <p className="font-medium text-slate-800 truncate">{profile.joinedDate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Activity summary */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700">Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {profile.totalOrders ?? 0}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700">Total Volume</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${(profile.totalSpent ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {profile.notes && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold">Broker Note:</span> {profile.notes}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {onMessage && (
              <Button 
                variant="secondary" 
                onClick={onMessage}
                className="flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
            )}
            {onCall && (
              <Button 
                variant="primary" 
                onClick={onCall}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Phone className="w-4 h-4" />
                Call Customer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
