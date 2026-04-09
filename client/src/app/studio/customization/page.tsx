'use client';

import React, { useRef, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { channelAPI } from '@/lib/api';
import toast from 'react-hot-toast';

type Tab = 'layout' | 'branding' | 'basicInfo';

export default function StudioCustomization() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('branding');
  
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const watermarkRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState({ avatar: false, banner: false, watermark: false });

  const handleUpload = async (file: File, type: 'avatar' | 'banner' | 'watermark') => {
    if (!file) return;

    // Validate size natively
    const sizeInMB = file.size / (1024 * 1024);
    if (type === 'avatar' && sizeInMB > 4) return toast.error('Avatar must be under 4MB');
    if (type === 'banner' && sizeInMB > 6) return toast.error('Banner must be under 6MB');
    if (type === 'watermark' && sizeInMB > 1) return toast.error('Watermark must be under 1MB');

    setLoading(s => ({ ...s, [type]: true }));
    const loadingToast = toast.loading(`Uploading ${type}...`);

    try {
      let res;
      if (type === 'avatar') res = await channelAPI.uploadAvatar(file);
      else if (type === 'banner') res = await channelAPI.uploadBanner(file);
      else res = await channelAPI.uploadWatermark(file);

      // Update Auth Store natively
      if (user) {
        setUser({ ...user, [type]: res.data[type] });
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`, { id: loadingToast });
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to update ${type}`, { id: loadingToast });
    } finally {
      setLoading(s => ({ ...s, [type]: false }));
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Channel customisation</h1>
      
      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-border-light mb-8 overflow-x-auto scrollbar-hide whitespace-nowrap">
        <button onClick={() => setActiveTab('layout')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'layout' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Layout</button>
        <button onClick={() => setActiveTab('branding')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'branding' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Branding</button>
        <button onClick={() => setActiveTab('basicInfo')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'basicInfo' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Basic info</button>
      </div>

      {activeTab === 'branding' ? (
        <div className="space-y-12 max-w-[800px]">
          
          {/* Profile Picture */}
          <div>
            <h2 className="text-[16px] font-medium mb-1">Picture</h2>
            <p className="text-secondary text-[13px] mb-4">Your profile picture will appear where your channel is presented on StreamSphere, such as next to your videos and comments.</p>
            
            <div className="flex gap-8 items-center bg-surface p-6 rounded-lg border border-border-light flex-col sm:flex-row text-center sm:text-left">
               <div className="w-[120px] h-[120px] rounded-full bg-accent-purple shrink-0 overflow-hidden text-5xl flex items-center justify-center font-bold text-white shadow-inner border border-white/10 relative">
                 {loading.avatar && (
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                     <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                   </div>
                 )}
                 {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user?.displayName?.charAt(0).toUpperCase() || 'U')}
               </div>
               <div>
                  <p className="text-[#AAAAAA] text-[13px] mb-4">It's recommended to use a picture that's at least 98 x 98 pixels and 4 MB or less. Use a PNG or GIF (no animations) file.</p>
                  <div className="flex gap-3 justify-center sm:justify-start">
                     <input 
                       type="file" 
                       ref={avatarRef} 
                       className="hidden" 
                       accept="image/png, image/jpeg, image/gif" 
                       onChange={(e) => {
                         if (e.target.files?.[0]) handleUpload(e.target.files[0], 'avatar');
                         e.target.value = '';
                       }}
                     />
                     <button onClick={() => avatarRef.current?.click()} disabled={loading.avatar} className="text-accent-blue font-medium uppercase text-[14px] disabled:opacity-50">
                       {user?.avatar ? 'Change' : 'Upload'}
                     </button>
                     {user?.avatar && (
                       <button onClick={() => channelAPI.updateProfile({ avatar: null }).then(() => setUser({ ...user!, avatar: null }))} className="text-accent-blue font-medium uppercase text-[14px]">
                         Remove
                       </button>
                     )}
                  </div>
               </div>
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <h2 className="text-[16px] font-medium mb-1">Banner image</h2>
            <p className="text-secondary text-[13px] mb-4">This image will appear across the top of your channel.</p>
            
            <div className="flex gap-8 items-center bg-surface p-6 rounded-lg border border-border-light flex-col sm:flex-row text-center sm:text-left">
               <div className="w-[180px] h-[100px] shrink-0 bg-page border border-dashed border-secondary rounded flex flex-col justify-end items-center pb-2 relative overflow-hidden group">
                  {loading.banner && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {user?.banner ? (
                    <img src={user.banner} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="w-[40px] h-[30px] bg-secondary/50 rounded-sm mb-1"></div>
                      <div className="w-[80%] h-1 bg-border-light"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                      </div>
                    </>
                  )}
               </div>
               <div>
                  <p className="text-[#AAAAAA] text-[13px] mb-4">For the best results on all devices, use an image that's at least 2048 x 1152 pixels and 6 MB or less.</p>
                  <div className="flex gap-3 justify-center sm:justify-start">
                     <input 
                       type="file" 
                       ref={bannerRef} 
                       className="hidden" 
                       accept="image/png, image/jpeg, image/gif" 
                       onChange={(e) => {
                         if (e.target.files?.[0]) handleUpload(e.target.files[0], 'banner');
                         e.target.value = '';
                       }}
                     />
                     <button onClick={() => bannerRef.current?.click()} disabled={loading.banner} className="text-accent-blue font-medium uppercase text-[14px] disabled:opacity-50">
                       {user?.banner ? 'Change' : 'Upload'}
                     </button>
                     {user?.banner && (
                       <button onClick={() => channelAPI.updateProfile({ banner: null }).then(() => setUser({ ...user!, banner: null }))} className="text-accent-blue font-medium uppercase text-[14px]">
                         Remove
                       </button>
                     )}
                  </div>
               </div>
            </div>
          </div>
          
          {/* Video Watermark */}
          <div>
            <h2 className="text-[16px] font-medium mb-1">Video watermark</h2>
            <p className="text-secondary text-[13px] mb-4">The watermark will appear on your videos in the bottom right-hand corner of the video player.</p>
            
            <div className="flex gap-8 items-center bg-surface p-6 rounded-lg border border-border-light flex-col sm:flex-row text-center sm:text-left">
               <div className="w-[180px] h-[100px] shrink-0 bg-page border border-border-light rounded relative overflow-hidden">
                  {loading.watermark && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded">
                      <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {user?.watermark ? (
                     <img src={user.watermark} className="absolute bottom-1 right-1 w-[35px] h-[35px] object-cover rounded-sm shadow-sm opacity-80" />
                  ) : (
                     <div className="absolute bottom-1 right-1 w-[24px] h-[24px] bg-accent-red rounded-sm border border-black flex items-center justify-center opacity-60">
                       <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                     </div>
                  )}
               </div>
               <div>
                  <p className="text-[#AAAAAA] text-[13px] mb-4">An image that's 150 x 150 pixels is recommended. Use a PNG, GIF (no animations), BMP or JPEG file that's 1 MB or less.</p>
                  <div className="flex gap-3 justify-center sm:justify-start">
                     <input 
                       type="file" 
                       ref={watermarkRef} 
                       className="hidden" 
                       accept="image/png, image/jpeg, image/gif, image/bmp" 
                       onChange={(e) => {
                         if (e.target.files?.[0]) handleUpload(e.target.files[0], 'watermark');
                         e.target.value = '';
                       }}
                     />
                     <button onClick={() => watermarkRef.current?.click()} disabled={loading.watermark} className="text-accent-blue font-medium uppercase text-[14px] disabled:opacity-50">
                       {user?.watermark ? 'Change' : 'Upload'}
                     </button>
                     {user?.watermark && (
                       <button onClick={() => channelAPI.updateProfile({ watermark: null }).then(() => setUser({ ...user!, watermark: null }))} className="text-accent-blue font-medium uppercase text-[14px]">
                         Remove
                       </button>
                     )}
                  </div>
               </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center border border-border-light bg-surface rounded-lg">
          <div className="text-5xl opacity-30 mb-4">🎨</div>
          <h2 className="text-xl font-medium text-primary mb-2 capitalize">{activeTab === 'layout' ? 'Channel Layout' : 'Basic Info'} options coming soon</h2>
          <p className="text-secondary max-w-sm text-sm">We are currently migrating {activeTab} settings to the new StreamSphere architecture.</p>
        </div>
      )}
    </div>
  );
}
