'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import VideoCard, { VideoCardSkeleton } from '@/components/video/VideoCard';
import { videoAPI } from '@/lib/api';
import { HiSearch, HiAdjustments } from 'react-icons/hi';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('relevance');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (query) {
      searchVideos();
    }
  }, [query, sort]);

  const searchVideos = async () => {
    try {
      setLoading(true);
      const { data } = await videoAPI.search(query, 1, 20, sort);
      setVideos(data.videos);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <HiSearch className="w-5 h-5 text-secondary" />
            Results for &quot;{query}&quot;
          </h1>
          <p className="text-sm text-secondary/80 mt-1">{total} results found</p>
        </div>
        <div className="flex items-center gap-2">
          <HiAdjustments className="w-5 h-5 text-secondary" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-surface border border-border-light rounded-lg px-3 py-1.5 text-sm
                       focus:outline-none focus:border-primary-500"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Upload date</option>
            <option value="views">View count</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <>
          {/* Mobile skeleton — grid cards */}
          <div className="grid grid-cols-1 gap-6 sm:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video skeleton rounded-xl" />
                <div className="flex gap-3 mt-3">
                  <div className="w-9 h-9 rounded-full skeleton shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 skeleton w-full rounded" />
                    <div className="h-3 skeleton w-2/3 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop skeleton — list rows */}
          <div className="hidden sm:block space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-64 aspect-video skeleton rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 skeleton w-3/4 rounded" />
                  <div className="h-4 skeleton w-1/2 rounded" />
                  <div className="h-3 skeleton w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-7xl mb-6">🔍</div>
          <h2 className="text-xl font-bold mb-2">No results found</h2>
          <p className="text-secondary text-sm text-center max-w-md">
            Try different keywords or remove search filters
          </p>
        </div>
      ) : (
        <>
          {/* Mobile — Grid cards */}
          <div className="grid grid-cols-1 gap-6 sm:hidden">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
          {/* Desktop — List rows */}
          <div className="hidden sm:block space-y-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} layout="list" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-accent-red border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
