'use client';

import React, { useEffect, useState } from 'react';
import LiveStreamCard, { LiveStreamCardSkeleton } from '@/components/video/LiveStreamCard';
import { liveAPI } from '@/lib/api';

export default function LivePage() {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStreams = async () => {
    try {
      const { data } = await liveAPI.getActive();
      setStreams(data.streams);
    } catch (error) {
      console.error('Failed to load live streams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreams();

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      loadStreams();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h1 className="text-2xl font-bold text-primary">Live</h1>
          </div>
          {streams.length > 0 && (
            <span className="text-sm text-secondary bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-medium">
              {streams.length} live now
            </span>
          )}
        </div>
        <p className="text-sm text-secondary">
          Watch live streams from creators in the StreamSphere community
        </p>
      </div>

      {/* Stream Grid */}
      <div className="px-0 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <LiveStreamCardSkeleton key={i} />
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-surface-200 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-secondary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-primary">No Live Streams</h2>
            <p className="text-secondary text-center max-w-md">
              No one is streaming right now. Check back later or start your own live stream!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
            {streams.map((stream) => (
              <LiveStreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
