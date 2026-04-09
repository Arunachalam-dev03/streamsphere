'use client';

import React, { useEffect, useState } from 'react';
import VideoCard, { VideoCardSkeleton } from '@/components/video/VideoCard';
import { videoAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { MdSubscriptions } from 'react-icons/md';
import Link from 'next/link';

export default function SubscriptionsPage() {
  const { isAuthenticated } = useAuthStore();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) loadFeed();
    else setLoading(false);
  }, [isAuthenticated]);

  const loadFeed = async () => {
    try {
      const { data } = await videoAPI.getSubscriptionFeed();
      setVideos(data.videos);
    } catch (error) {
      console.error('Failed to load subscription feed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MdSubscriptions className="w-20 h-20 text-secondary/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Don&apos;t miss new videos</h2>
          <p className="text-secondary mb-6 text-sm">Sign in to see updates from your favorite channels</p>
          <Link href="/auth/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (<VideoCardSkeleton key={i} />))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📺</div>
          <h3 className="text-lg font-medium mb-2">No subscription videos</h3>
          <p className="text-secondary text-sm">Subscribe to channels to see their latest videos here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
          {videos.map((video) => (<VideoCard key={video.id} video={video} />))}
        </div>
      )}
    </div>
  );
}
