'use client';

import React, { useEffect, useState } from 'react';
import { HiCog, HiBell } from 'react-icons/hi';
import { notificationAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface NotificationPrefs {
  newVideo: boolean;
  newSubscriber: boolean;
  newComment: boolean;
  newLike: boolean;
  newLivestream: boolean;
  system: boolean;
}

function ToggleSwitch({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-secondary">{label}</span>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${enabled ? 'bg-accent-red' : 'bg-surface-200'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

export default function StudioSettings() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    newVideo: true, newSubscriber: true, newComment: true,
    newLike: true, newLivestream: true, system: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'notifications') {
      setLoading(true);
      notificationAPI.getPreferences().then(({ data }) => {
        setPrefs({
          newVideo: data.newVideo,
          newSubscriber: data.newSubscriber,
          newComment: data.newComment,
          newLike: data.newLike,
          newLivestream: data.newLivestream,
          system: data.system,
        });
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [isAuthenticated, activeTab]);

  const handleSavePrefs = async () => {
    try {
      setSaving(true);
      await notificationAPI.updatePreferences(prefs);
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key: keyof NotificationPrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'channel', label: 'Channel' },
    { id: 'upload-defaults', label: 'Upload defaults' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'community', label: 'Community' },
  ];

  return (
    <div className="w-full max-w-[1000px] mx-auto">
      <div className="px-8 py-12 text-center">
        
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center text-primary/50 shadow-sm border border-border-light">
            <HiCog className="w-12 h-12" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-primary">Channel Settings</h1>
        <p className="text-secondary text-[15px] max-w-xl mx-auto mb-10">
          Manage your account settings, permissions, defaults, and channel privacy options.
        </p>

        <div className="bg-surface border border-border-light rounded-xl max-w-xl mx-auto text-left shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row bg-page/50 border-b border-border-light">
             <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border-light flex flex-row md:flex-col overflow-x-auto scrollbar-hide">
               {tabs.map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors
                     ${activeTab === tab.id
                       ? 'text-primary bg-hover border-accent-blue'
                       : 'text-secondary hover:bg-hover border-transparent'}`}
                 >
                   {tab.label}
                 </button>
               ))}
             </div>
             <div className="shrink-0 w-full md:w-2/3 p-6">
               {activeTab === 'notifications' ? (
                 loading ? (
                   <div className="flex items-center justify-center py-8">
                     <div className="w-6 h-6 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
                   </div>
                 ) : (
                   <div>
                     <div className="flex items-center gap-2 mb-4">
                       <HiBell className="w-5 h-5 text-accent-red" />
                       <h3 className="font-semibold text-sm">Notification Preferences</h3>
                     </div>
                     <div className="divide-y divide-border-light/10">
                       <ToggleSwitch enabled={prefs.newVideo} onToggle={() => togglePref('newVideo')} label="New video from subscriptions" />
                       <ToggleSwitch enabled={prefs.newSubscriber} onToggle={() => togglePref('newSubscriber')} label="New subscriber" />
                       <ToggleSwitch enabled={prefs.newComment} onToggle={() => togglePref('newComment')} label="Comments on your videos" />
                       <ToggleSwitch enabled={prefs.newLike} onToggle={() => togglePref('newLike')} label="Likes on your videos" />
                       <ToggleSwitch enabled={prefs.newLivestream} onToggle={() => togglePref('newLivestream')} label="Live stream alerts" />
                       <ToggleSwitch enabled={prefs.system} onToggle={() => togglePref('system')} label="System announcements" />
                     </div>
                   </div>
                 )
               ) : (
                 <div className="flex flex-col justify-center text-center py-4">
                   <div className="text-4xl mb-4 opacity-30">⚙️</div>
                   <p className="text-sm text-secondary font-medium mb-1">Advanced Settings Hub</p>
                   <p className="text-[13px] text-[#AAAAAA]">This panel is currently being integrated into StreamSphere. Global settings will be manageable here soon.</p>
                 </div>
               )}
             </div>
          </div>
          <div className="p-4 bg-page flex justify-end gap-3 border-t border-border-light">
            <button
              onClick={() => setActiveTab('general')}
              className="text-sm font-medium text-secondary hover:text-primary px-4 py-2 uppercase"
            >
              Cancel
            </button>
            <button
              onClick={activeTab === 'notifications' ? handleSavePrefs : undefined}
              disabled={activeTab !== 'notifications' || saving}
              className={`text-sm font-medium px-4 py-2 border border-border-light transition-colors
                ${activeTab === 'notifications'
                  ? 'text-white bg-accent-red hover:bg-accent-red/90 border-accent-red cursor-pointer'
                  : 'text-primary bg-hover opacity-50 cursor-not-allowed'}`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
