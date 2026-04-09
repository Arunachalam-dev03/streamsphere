'use client';

import React, { useEffect, useState } from 'react';
import VideoCard, { VideoCardSkeleton } from '@/components/video/VideoCard';
import { videoAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { MdHistory } from 'react-icons/md';
import Link from 'next/link';

export default function HistoryPage() {
  const { isAuthenticated } = useAuthStore();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) loadHistory();
    else setLoading(false);
  }, [isAuthenticated]);

  const loadHistory = async () => {
    try {
      const { data } = await videoAPI.getHistory();
      setVideos(data.videos);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MdHistory className="w-20 h-20 text-secondary/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Keep track of what you watch</h2>
          <p className="text-secondary mb-6 text-sm">Sign in to see your watch history</p>
          <Link href="/auth/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">Watch History</h1>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-64 aspect-video skeleton rounded-xl shrink-0" />
              <div className="flex-1 space-y-3"><div className="h-5 skeleton w-3/4 rounded" /><div className="h-4 skeleton w-1/2 rounded" /></div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📺</div>
          <p className="text-secondary text-sm">Your watch history is empty. Start watching!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (<VideoCard key={video.id} video={video} layout="list" />))}
        </div>
      )}
    </div>
  );
}
