'use client';

import React, { useEffect, useState } from 'react';
import VideoCard, { VideoCardSkeleton } from '@/components/video/VideoCard';
import { videoAPI } from '@/lib/api';
import { HiFire } from 'react-icons/hi';

export default function TrendingPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const { data } = await videoAPI.getTrending(1, 40);
      setVideos(data.videos);
    } catch (error) {
      console.error('Failed to load trending:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-accent-red to-accent-orange rounded-2xl flex items-center justify-center">
          <HiFire className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Trending</h1>
          <p className="text-sm text-secondary">Most popular videos this week</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
