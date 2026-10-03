import React, { useState, useEffect } from 'react';
import {
  Plus,
  Send,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  X,
  Trash2,
  AlertCircle,
  Building2,
  Check,
  Upload,
  Calendar,
  Clock
} from 'lucide-react';
import type { ReverseAuction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { createReverseAuction, deleteReverseAuction } from '../../lib/api/reverseAuction';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface CustomerAuctionViewProps {
  auctions: ReverseAuction[];
  onRefresh: () => void;
  onNavigateToMessages?: (brokerId?: string) => void;
}

const TIMELINE_STEPS = [
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'READY', label: 'Ready' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Completed' },
];

const TIMELINE_KEYS = TIMELINE_STEPS.map(s => s.key);

export const CustomerAuctionView: React.FC<CustomerAuctionViewProps> = ({
  auctions,
  onRefresh,
  onNavigateToMessages,
}) => {
  const { user } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedAuction, setSelectedAuction] = useState<ReverseAuction | null>(null);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);

  // Create form
  const [productNeeded, setProductNeeded] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  
  // Date/Time
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');

  // Image Upload
  const [files, setFiles] = useState<File[]>([]);

  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const customerAuctions = auctions.filter(a => a.customerId === user?.id || !user?.id);

  const handleOpenDetail = (auc: ReverseAuction) => {
    setSelectedAuction(auc);
    setCurrentScreen('detail');
  };

  const handleConfirmDelete = async (auc: ReverseAuction) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) return;
    setIsDeleting(true);
    try {
      const res = await deleteReverseAuction(auc.id, user?.id);
      if (!res.success) {
        alert(res.error || 'Failed to delete');
      } else {
        onRefresh();
        if (selectedAuction?.id === auc.id) {
          setCurrentScreen('list');
          setSelectedAuction(null);
        }
      }
    } catch (err) {
      alert('Failed to delete');
    }
    setIsDeleting(false);
  };

  const uploadImagesForAuction = async (auctionId: string): Promise<string[]> => {
    if (!isSupabaseConfigured || files.length === 0) return [];
    
    const urls: string[] = [];
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        let publicUrl = '';

        // Try primary bucket: reverse-auctions
        const primaryPath = `${auctionId}/${fileName}`;
        const { error: primaryErr } = await supabase.storage
          .from('reverse-auctions')
          .upload(primaryPath, file, { upsert: true, contentType: file.type });
        
        if (!primaryErr) {
          const { data } = supabase.storage.from('reverse-auctions').getPublicUrl(primaryPath);
          publicUrl = data?.publicUrl || '';
          console.log('Uploaded to reverse-auctions bucket:', publicUrl);
        } else {
          // Fallback: use avatars bucket with a subfolder path
          console.warn('reverse-auctions bucket not available, using avatars fallback. Error:', primaryErr.message);
          const fallbackPath = `auction-images/${auctionId}/${fileName}`;
          const { error: fallbackErr } = await supabase.storage
            .from('avatars')
            .upload(fallbackPath, file, { upsert: true, contentType: file.type });
          
          if (!fallbackErr) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(fallbackPath);
            publicUrl = data?.publicUrl || '';
            console.log('Uploaded to avatars (fallback) bucket:', publicUrl);
          } else {
            throw new Error(`Image upload failed: ${primaryErr.message}. Fallback also failed: ${fallbackErr.message}`);
          }
        }

        if (publicUrl) urls.push(publicUrl);
      } catch (err: any) {
        console.error('Upload exception:', err);
        throw new Error(err.message || 'Product image upload failed. Please try again.');
      }
    }
    return urls;
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!deadlineDate || !deadlineTime) {
      setErrorMsg('Please select a future date and time.');
      return;
    }

    const selectedDateTime = new Date(`${deadlineDate}T${deadlineTime}`);
    if (selectedDateTime <= new Date()) {
      setErrorMsg('Please select a future date and time.');
      return;
    }

    setPublishing(true);
    try {
      // 1. Create Auction First
      const newAuction = await createReverseAuction({
        customerId: user?.id || 'cust-id',
        customerName: user?.fullName || 'Customer',
        title: productNeeded,
        category: 'General',
        quantity: 1,
        description,
        startingPrice: Number(budget) || 1000,
        photos: [], // will update below
        durationHours: (selectedDateTime.getTime() - Date.now()) / (1000 * 3600),
      });

      // 2. Upload images to reverse-auctions/{auction_id}/
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
         uploadedUrls = await uploadImagesForAuction(newAuction.id);
         
         // 3. Save Image References in Database
         if (isSupabaseConfigured) {
           await supabase.from('reverse_auctions').update({ photos: uploadedUrls, product_image: uploadedUrls[0] }).eq('id', newAuction.id);
         }
      }

      setPublishing(false);
      onRefresh();
      setCurrentScreen('list');
      
      // Reset
      setProductNeeded('');
      setBudget('');
      setDeadlineDate('');
      setDeadlineTime('');
      setDescription('');
      setFiles([]);
    } catch (err: any) {
      setPublishing(false);
      setErrorMsg(err.message || 'Failed to publish auction');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (currentScreen === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
          <button onClick={() => setCurrentScreen('list')} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Create Reverse Auction</h1>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePublishSubmit} className="max-w-2xl bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Project Title / Product Needed</label>
              <input required type="text" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500" value={productNeeded} onChange={e => setProductNeeded(e.target.value)} />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">Budget (€)</label>
              <input required type="number" min="1" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Deadline Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input required type="date" className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Deadline Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input required type="time" className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500" value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Product Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload size={32} className="text-gray-400 mb-2" />
                <p className="text-sm font-bold text-gray-600">Click to upload images</p>
                <p className="text-xs text-gray-400 mt-1">Select one or multiple photos</p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {files.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 p-1 bg-white/90 text-red-600 rounded-full hover:bg-white shadow">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Detailed Requirements</label>
              <textarea required rows={4} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          <button disabled={publishing} className="w-full py-4 bg-teal-700 hover:bg-teal-800 transition text-white font-bold rounded-xl flex items-center justify-center gap-2">
            {publishing ? 'Publishing...' : <><Send size={18} /> Publish Auction</>}
          </button>
        </form>
      </div>
    );
  }

  if (currentScreen === 'detail' && selectedAuction) {
    const currentStepIndex = TIMELINE_KEYS.indexOf(selectedAuction.currentLevel || '');
    const isCompletedOrDelivered = selectedAuction.currentLevel === 'DELIVERED' || selectedAuction.currentLevel === 'COMPLETED';

    // Calculate connector fill percentage
    const totalSegments = TIMELINE_STEPS.length - 1; // 4 segments between 5 dots
    let fillPercent = 0;
    if (currentStepIndex >= 0) {
      // If completed, fill the whole bar; otherwise fill up to the active step
      fillPercent = currentStepIndex >= totalSegments
        ? 100
        : (currentStepIndex / totalSegments) * 100;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentScreen('list')} className="p-2 hover:bg-gray-100 rounded-xl">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{selectedAuction.title}</h1>
              <span className="text-xs font-bold px-3 py-1 bg-teal-100 text-teal-800 rounded-md uppercase inline-block mt-1">
                Status: {selectedAuction.currentLevel || 'OPEN'}
              </span>
            </div>
          </div>
          <button onClick={() => handleConfirmDelete(selectedAuction)} disabled={isDeleting} className="px-4 py-2 text-red-600 font-bold border border-red-200 rounded-xl hover:bg-red-50 transition">
            <Trash2 size={16} className="inline mr-2" /> Delete
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Horizontal Order-Tracking Timeline */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="font-bold text-lg mb-5">Live Project Timeline</h3>

              <div className="timeline-track">
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
                  // When status is COMPLETED all steps are done
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
                        {(done || (allDone)) && <Check size={16} strokeWidth={3} />}
                      </div>
                      <span className={labelClass}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Product Images uploaded by Customer */}
            {selectedAuction.photos && selectedAuction.photos.length > 0 && (
               <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                 <h3 className="font-bold text-lg">Product Images</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedAuction.photos.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-200">
                        <img src={img} alt="Product" className="w-full h-full object-cover" />
                      </div>
                    ))}
                 </div>
               </div>
            )}

            {/* Delivery Proof uploaded by Broker */}
            {isCompletedOrDelivered && selectedAuction.deliveryProofPhotos && selectedAuction.deliveryProofPhotos.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-teal-900 flex items-center gap-2"><CheckCircle2 /> Delivery Proof</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedAuction.deliveryProofPhotos.map((url, i) => (
                    <img key={i} src={url} alt="Proof" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                  ))}
                </div>
              </div>
            )}
            
            {!isCompletedOrDelivered && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                 <p className="text-gray-500 text-sm text-center">Delivery proof will appear here once the broker marks the project as DELIVERED.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg">Assigned Broker</h3>
              {selectedAuction.assignedBrokerId ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold">Verified Broker</h4>
                      <p className="text-xs text-gray-500">ID: {selectedAuction.assignedBrokerId}</p>
                    </div>
                  </div>
                  <button onClick={() => onNavigateToMessages?.(selectedAuction.assignedBrokerId)} className="w-full py-3 bg-teal-700 hover:bg-teal-800 transition text-white rounded-xl font-bold flex justify-center items-center gap-2">
                    <MessageSquare size={18} /> Message Broker
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-sm font-bold text-center flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-amber-600 animate-spin" />
                  Waiting for a Broker to Accept
                </div>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg">Project Details</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedAuction.description}</p>
              
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Budget</p>
                  <p className="font-bold text-slate-800 text-lg">€{selectedAuction.startingPrice}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Calendar size={12}/> Deadline</p>
                  <p className="font-bold text-slate-800">
                    {new Date(selectedAuction.endTime || '').toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-rose-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Clock size={12}/> Time Left</p>
                  <p className="font-bold text-rose-700 text-lg">
                    {formatCountdown(selectedAuction.endTime || '')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Reverse Auctions</h1>
           <p className="text-sm text-gray-500 mt-1">Manage your active requests and view broker progress.</p>
        </div>
        <button onClick={() => setCurrentScreen('create')} className="px-5 py-3 bg-teal-700 hover:bg-teal-800 transition text-white font-bold rounded-xl flex items-center gap-2 shadow-sm">
          <Plus size={18} /> Add Auction
        </button>
      </div>

      <div className="space-y-4">
        {customerAuctions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-gray-800 font-bold text-lg mb-2">You have no active auctions.</p>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">Create a reverse auction to let verified brokers bid on your requirements.</p>
          </div>
        ) : (
          customerAuctions.map(auc => (
            <div key={auc.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition gap-4">
              <div className="flex items-center gap-4">
                {auc.photos && auc.photos.length > 0 ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                    <img src={auc.photos[0]} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                    No Img
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{auc.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Budget: €{auc.startingPrice} · 
                    Deadline: {new Date(auc.endTime || '').toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${auc.currentLevel === 'OPEN' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                      Status: {auc.currentLevel || 'OPEN'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-1">
                      <Clock size={12}/> {formatCountdown(auc.endTime || '')}
                    </span>
                    {auc.assignedBrokerId && (
                       <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                         Assigned to Broker
                       </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                <button 
                  onClick={() => handleConfirmDelete(auc)} 
                  disabled={isDeleting} 
                  className="p-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition disabled:opacity-50" 
                  title="Delete Auction"
                >
                  <Trash2 size={20} />
                </button>
                <button onClick={() => handleOpenDetail(auc)} className="w-full sm:w-auto px-6 py-3 bg-teal-50 text-teal-700 font-bold rounded-xl hover:bg-teal-100 transition whitespace-nowrap">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
