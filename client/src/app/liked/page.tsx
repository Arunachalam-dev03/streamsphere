'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { videoAPI } from '@/lib/api';
import VideoCard from '@/components/video/VideoCard';
import { HiThumbUp } from 'react-icons/hi';

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  createdAt: string;
  likedAt?: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
}

export default function LikedVideosPage() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/auth/login?redirect=/liked');
      return;
    }

    if (isAuthenticated) {
      loadVideos();
    }
  }, [isAuthenticated, isHydrated, router]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const { data } = await videoAPI.getLiked();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Failed to load liked videos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-red border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4 border-b border-border-light/10 pb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
          <HiThumbUp className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Liked Videos</h1>
          <p className="mt-1 text-sm text-gray-400">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-16 text-center border border-border-light/5">
          <HiThumbUp className="mb-4 h-16 w-16 text-secondary/40" />
          <h2 className="mb-2 text-xl font-semibold">No liked videos</h2>
          <p className="text-gray-400 max-w-sm">
            Videos that you have liked will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video as any} />
          ))}
        </div>
      )}
    </div>
  );
}
