import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  ArrowLeft,
  MessageSquare,
  Check,
  UploadCloud,
  Clock,
  Calendar,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import type { ReverseAuction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { acceptAuction, updateAuctionLevel, submitDeliveryProof, completeAuction } from '../../lib/api/reverseAuction';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface BrokerAuctionViewProps {
  auctions: ReverseAuction[];
  onRefresh: () => void;
  onNavigateToMessages?: (customerId?: string) => void;
}

const TIMELINE_STEPS = [
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'READY', label: 'Ready' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Completed' },
];

const TIMELINE_KEYS = TIMELINE_STEPS.map(s => s.key);

export const BrokerAuctionView: React.FC<BrokerAuctionViewProps> = ({
  auctions,
  onRefresh,
  onNavigateToMessages,
}) => {
  const { user } = useAuth();
  const brokerId = user?.id || 'dummy-broker-id';

  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
  const [selectedAuction, setSelectedAuction] = useState<ReverseAuction | null>(null);
  
  // States for actions
  const [loading, setLoading] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofUploading, setProofUploading] = useState(false);
  const proofFileInputRef = useRef<HTMLInputElement>(null);
  
  // Realtime countdown timer state
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Expired';
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m ${s}s`;
  };

  const availableAuctions = auctions.filter(a => a.status === 'OPEN');
  const activeAuctions = auctions.filter(a => a.assignedBrokerId === brokerId && a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
  const completedAuctions = auctions.filter(a => a.assignedBrokerId === brokerId && a.status === 'COMPLETED');

  const handleAcceptAuction = async (auction: ReverseAuction) => {
    if (!window.confirm('Are you sure you want to accept this project?')) return;
    setLoading(true);
    const res = await acceptAuction(auction.id, brokerId);
    if (res.success) {
      setSelectedAuction(null);
      setActiveTab('active');
      onRefresh();
    } else {
      alert(res.error || 'Failed to accept project. It may have been taken by another broker.');
      onRefresh();
    }
    setLoading(false);
  };

  const handleUpdateLevel = async (auction: ReverseAuction, nextLevel: string) => {
    setLoading(true);
    const res = await updateAuctionLevel(auction.id, brokerId, nextLevel);
    if (res.success) {
      onRefresh();
      setSelectedAuction({ ...auction, currentLevel: nextLevel, status: nextLevel });
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleSubmitProof = async (auction: ReverseAuction) => {
    if (proofFiles.length === 0) {
      alert('Please select at least one image as delivery proof.');
      return;
    }
    setProofUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of proofFiles) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `delivery-proof-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        let publicUrl = '';
        if (isSupabaseConfigured) {
          // Try primary bucket: reverse-auctions
          const primaryPath = `${auction.id}/delivery/${fileName}`;
          const { error: primaryErr } = await supabase.storage
            .from('reverse-auctions')
            .upload(primaryPath, file, { upsert: true, contentType: file.type });
          
          if (!primaryErr) {
            const { data } = supabase.storage.from('reverse-auctions').getPublicUrl(primaryPath);
            publicUrl = data?.publicUrl || '';
          } else {
            // Fallback: use avatars bucket with subfolder
            console.warn('reverse-auctions bucket unavailable, falling back to avatars. Error:', primaryErr.message);
            const fallbackPath = `auction-images/${auction.id}/delivery/${fileName}`;
            const { error: fallbackErr } = await supabase.storage
              .from('avatars')
              .upload(fallbackPath, file, { upsert: true, contentType: file.type });
            if (!fallbackErr) {
              const { data } = supabase.storage.from('avatars').getPublicUrl(fallbackPath);
              publicUrl = data?.publicUrl || '';
            } else {
              throw new Error(`Upload failed: ${primaryErr.message}. Fallback: ${fallbackErr.message}`);
            }
          }
        }
        if (publicUrl) uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length === 0) {
        alert('Image upload failed. Please try again.');
        return;
      }

      setLoading(true);
      const res = await submitDeliveryProof(auction.id, brokerId, uploadedUrls, 'Delivery completed');
      if (res.success) {
        onRefresh();
        setSelectedAuction({ ...auction, currentLevel: 'DELIVERED', status: 'DELIVERED', deliveryProofPhotos: uploadedUrls });
        setProofFiles([]);
      } else {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
    setLoading(false);
    setProofUploading(false);
  };

  const handleCompleteProject = async (auction: ReverseAuction) => {
    if (!window.confirm('Mark this project as fully completed?')) return;
    setLoading(true);
    const res = await completeAuction(auction.id, brokerId);
    if (res.success) {
      onRefresh();
      setSelectedAuction(null);
      setActiveTab('completed');
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  // DETAIL VIEW
  if (selectedAuction) {
    const isAvailable = selectedAuction.status === 'OPEN';
    const isActive = selectedAuction.assignedBrokerId === brokerId && selectedAuction.status !== 'COMPLETED';
    
    const currentStepIndex = TIMELINE_KEYS.indexOf(selectedAuction.currentLevel || '');
    const nextLevel = currentStepIndex >= 0 && currentStepIndex < TIMELINE_KEYS.length - 1 ? TIMELINE_KEYS[currentStepIndex + 1] : null;

    // Calculate connector fill percentage
    const totalSegments = TIMELINE_STEPS.length - 1;
    let fillPercent = 0;
    if (currentStepIndex >= 0) {
      fillPercent = currentStepIndex >= totalSegments
        ? 100
        : (currentStepIndex / totalSegments) * 100;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
          <button onClick={() => setSelectedAuction(null)} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">{selectedAuction.title}</h1>
            <p className="text-sm text-gray-500">Customer: {selectedAuction.customerName} · Listed: {new Date(selectedAuction.createdAt || '').toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Product Images */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ImageIcon size={20}/> Product Images</h3>
               {selectedAuction.photos && selectedAuction.photos.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedAuction.photos.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-200">
                        <img src={img} alt={`Product ${idx+1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center text-gray-500 text-sm">
                   Customer did not provide any product images.
                 </div>
               )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Project Requirements</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">{selectedAuction.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                  <p className="text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">Budget</p>
                  <p className="font-bold text-teal-900 text-xl">₹{selectedAuction.startingPrice}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={14}/> Deadline</p>
                  <p className="font-bold text-amber-900 text-sm">
                    {new Date(selectedAuction.endTime || '').toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <p className="text-rose-700 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={14}/> Time Left</p>
                  <p className="font-bold text-rose-900 text-lg">{formatCountdown(selectedAuction.endTime || '')}</p>
                </div>
              </div>
            </div>

            {isActive && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-lg mb-5">Project Progress</h3>
                
                {/* Horizontal Order-Tracking Timeline */}
                <div className="timeline-track mb-6">
                  {/* Background connector line + filled portion */}
                  <div className="timeline-connector">
                    <div
                      className="timeline-connector-fill"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>

                  {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = currentStepIndex >= 0 && idx < currentStepIndex;
                    const isActive    = idx === currentStepIndex;
                    const allDone = selectedAuction.currentLevel === 'COMPLETED';
                    const done = allDone || isCompleted;

                    const dotClass = done
                      ? 'timeline-dot timeline-dot--completed'
                      : isActive
                        ? 'timeline-dot timeline-dot--active'
                        : 'timeline-dot timeline-dot--upcoming';

                    const labelClass = done
                      ? 'timeline-label timeline-label--completed'
                      : isActive
                        ? 'timeline-label timeline-label--active'
                        : 'timeline-label timeline-label--upcoming';

                    return (
                      <div key={step.key} className="timeline-step">
                        <div className={dotClass}>
                          {(done || allDone) && <Check size={16} strokeWidth={3} />}
                        </div>
                        <span className={labelClass}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                {selectedAuction.currentLevel === 'READY' && (
                  <div className="space-y-4 mb-6 p-5 border-2 border-teal-200 bg-teal-50 rounded-xl">
                    <h4 className="font-bold text-teal-900 flex items-center gap-2"><UploadCloud size={18}/> Upload Delivery Proof</h4>
                    <p className="text-xs text-teal-700 mb-2">Upload photos proving the delivery has been completed.</p>
                    
                    {/* File upload area */}
                    <div
                      className="border-2 border-dashed border-teal-300 rounded-xl p-5 flex flex-col items-center justify-center bg-white cursor-pointer hover:border-teal-400 transition"
                      onClick={() => proofFileInputRef.current?.click()}
                    >
                      <UploadCloud size={28} className="text-teal-400 mb-2" />
                      <p className="text-sm font-bold text-teal-700">Click to select delivery photos</p>
                      <p className="text-xs text-teal-500 mt-1">{proofFiles.length > 0 ? `${proofFiles.length} file(s) selected` : 'JPG, PNG, WEBP accepted'}</p>
                    </div>
                    <input
                      ref={proofFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files) setProofFiles(Array.from(e.target.files));
                      }}
                    />

                    {/* Preview selected files */}
                    {proofFiles.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {proofFiles.map((f, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden border border-teal-200">
                            <img src={URL.createObjectURL(f)} alt={`Proof ${i+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <button 
                      onClick={() => handleSubmitProof(selectedAuction)}
                      disabled={loading || proofUploading || proofFiles.length === 0}
                      className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 transition text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 shadow-sm"
                    >
                      {(proofUploading || loading) ? <><Loader2 size={16} className="animate-spin"/> Uploading...</> : 'Submit Proof & Mark Delivered'}
                    </button>
                  </div>
                )}

                {selectedAuction.currentLevel === 'DELIVERED' && (
                  <button 
                    onClick={() => handleCompleteProject(selectedAuction)}
                    disabled={loading}
                    className="w-full py-4 bg-teal-700 hover:bg-teal-800 transition text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 size={20} /> Finalize Project
                  </button>
                )}

                {nextLevel && selectedAuction.currentLevel !== 'READY' && selectedAuction.currentLevel !== 'DELIVERED' && (
                  <button 
                    onClick={() => handleUpdateLevel(selectedAuction, nextLevel)}
                    disabled={loading}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-900 transition text-white rounded-xl font-bold shadow-sm"
                  >
                    Mark {TIMELINE_STEPS.find(s => s.key === nextLevel)?.label || nextLevel} Completed
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-6 space-y-4">
              <h3 className="font-bold text-lg">Actions</h3>
              {isAvailable && (
                <button 
                  onClick={() => handleAcceptAuction(selectedAuction)}
                  disabled={loading}
                  className="w-full py-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-sm transition"
                >
                  <Check size={20} /> Accept Project
                </button>
              )}
              <button 
                onClick={() => onNavigateToMessages?.(selectedAuction.customerId)}
                className="w-full py-3 border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-bold rounded-xl flex justify-center items-center gap-2 transition"
              >
                <MessageSquare size={18} /> Message Customer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  const renderList = (list: ReverseAuction[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 font-bold text-lg">No reverse auctions found</p>
          <p className="text-gray-400 text-sm mt-1">There are no auctions available in this category.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {list.map(auc => (
          <div key={auc.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {auc.photos && auc.photos.length > 0 ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <img src={auc.photos[0]} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400 text-xs">
                  No Img
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg mb-1">{auc.title}</h3>
                <p className="text-sm text-gray-500 mb-2">Customer: {auc.customerName} · Budget: ₹{auc.startingPrice}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${auc.status === 'OPEN' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                    {auc.currentLevel || auc.status}
                  </span>
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                    <Clock size={12}/> {formatCountdown(auc.endTime || '')}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedAuction(auc)}
              className="w-full sm:w-auto px-6 py-3 bg-teal-50 text-teal-700 font-bold rounded-xl hover:bg-teal-100 transition whitespace-nowrap"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('available')}
          className={`px-5 py-4 font-bold border-b-2 transition-colors ${activeTab === 'available' ? 'border-teal-700 text-teal-800' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Available Auctions ({availableAuctions.length})
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-5 py-4 font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-teal-700 text-teal-800' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          My Active Projects ({activeAuctions.length})
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`px-5 py-4 font-bold border-b-2 transition-colors ${activeTab === 'completed' ? 'border-teal-700 text-teal-800' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Completed ({completedAuctions.length})
        </button>
      </div>

      <div>
        {activeTab === 'available' && renderList(availableAuctions)}
        {activeTab === 'active' && renderList(activeAuctions)}
        {activeTab === 'completed' && renderList(completedAuctions)}
      </div>
    </div>
  );
};
