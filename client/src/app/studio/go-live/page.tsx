'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { liveAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import EmptyStreamState from './components/EmptyStreamState';
import CreateStreamModal from './components/CreateStreamModal';
import ActiveStreamDashboard from './components/ActiveStreamDashboard';

export default function GoLiveStudioPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  const [activeStream, setActiveStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isHydrated && isAuthenticated) {
      loadActiveStream();
    }
  }, [isHydrated, isAuthenticated, router]);

  const loadActiveStream = async () => {
    try {
      const { data } = await liveAPI.getMyActive();
      setActiveStream(data.stream);
    } catch (error) {
      console.error('Failed to load active stream:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1F1F1F]">
        <div className="w-10 h-10 border-3 border-[#3EA6FF]/20 border-t-[#3EA6FF] rounded-full animate-spin" />
      </div>
    );
  }

  // Top sub-header shown inside the studio content area
  // Contains "Studio" title, schedule stream buttons, etc. if no active stream.
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-[#1F1F1F]">
      {/* Sub Header */}
      {!activeStream && (
        <div className="flex items-center justify-end px-6 py-4 border-b border-white/10 shrink-0">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#3EA6FF]/10 text-[#3EA6FF] hover:bg-[#3EA6FF]/20 font-medium px-4 py-2 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 4h-1V3h-2v1H8V3H6v1H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"></path></svg>
            Schedule Stream
          </button>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative w-full h-full">
        {activeStream ? (
          <ActiveStreamDashboard 
             stream={activeStream} 
             onStreamEnded={() => setActiveStream(null)}
             onKeyRegenerated={(newKey) => setActiveStream({ ...activeStream, streamKey: newKey })}
          />
        ) : (
          <EmptyStreamState />
        )}
      </div>

      {showCreateModal && (
        <CreateStreamModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={(streamData) => {
            setActiveStream(streamData);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
