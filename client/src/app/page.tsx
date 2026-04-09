'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import VideoCard, { VideoCardSkeleton } from '@/components/video/VideoCard';
import ShortsShelf from '@/components/video/ShortsShelf';
import LiveNowShelf from '@/components/video/LiveNowShelf';
import { videoAPI } from '@/lib/api';
import { useUIStore } from '@/lib/store';

const categories = [
  'All', 'Suggested for you', 'Music', 'News', 'Mixes', 
  'Tamil Cinema', 'Tamil television drama', 'AI', 'Live', 
  'Cloud computing', 'T-Series', 'Data Structures', 
  'Television comedy', 'Rapping', 'Cooking shows', 
  'Recently uploaded', 'Watched'
];

export default function HomePage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { sidebarCollapsed } = useUIStore();
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Calculate exact columns based on Tailwind breakpoints to prevent empty layout slots
  const [splitCount, setSplitCount] = useState(3);

  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (sidebarCollapsed) {
        if (w >= 1280) setSplitCount(4);      // xl
        else if (w >= 768) setSplitCount(3);  // md
        else if (w >= 640) setSplitCount(2);  // sm
        else setSplitCount(1);
      } else {
        if (w >= 1024) setSplitCount(3);      // lg
        else if (w >= 640) setSplitCount(2);  // sm
        else setSplitCount(1);
      }
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, [sidebarCollapsed]);

  const gridClass = sidebarCollapsed 
    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      const { data } = await videoAPI.getFeed(pageNum);
      if (pageNum === 1) {
        setVideos(data.videos);
      } else {
        setVideos((prev) => [...prev, ...data.videos]);
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Infinite scroll via IntersectionObserver
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  pageRef.current = page;
  hasMoreRef.current = hasMore;
  loadingMoreRef.current = loadingMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          loadVideos(pageRef.current + 1);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading]); // re-attach after initial load

  const handleCategoryClick = async (category: string) => {
    setActiveCategory(category);
    if (category === 'All') {
      loadVideos(1);
    } else {
      try {
        setLoading(true);
        const { data } = await videoAPI.search(category.toLowerCase());
        setVideos(data.videos);
        setHasMore(false);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* SEO: Hidden H1 for search engine crawlers */}
      <h1 className="sr-only">StreamSphere — Watch, Share & Discover Videos</h1>

      {/* Category chips */}
      <div className="sticky top-14 z-30 bg-page/90 backdrop-blur-xl border-b border-border-light/10 dark:border-border-light/5">
        <div className="flex gap-3 px-6 py-3 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={activeCategory === cat ? 'chip-active shrink-0' : 'chip shrink-0'}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="px-0 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className={`grid gap-x-4 gap-y-10 ${gridClass}`}>
            {Array.from({ length: splitCount * 3 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-7xl mb-6">🎬</div>
            <h2 className="text-2xl font-bold mb-2">No Videos Yet</h2>
            <p className="text-secondary text-center max-w-md">
              Be the first to upload a video! Share your creativity with the StreamSphere community.
            </p>
          </div>
        ) : (
          <>
            <div className={`grid gap-x-4 gap-y-8 ${gridClass}`}>
              {videos.slice(0, splitCount).map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* Live Now Shelf */}
            {page === 1 && activeCategory === 'All' && <LiveNowShelf />}

            {/* Shorts Shelf */}
            {page === 1 && activeCategory === 'All' && <ShortsShelf />}

            {videos.length > splitCount && (
              <div className={`grid gap-x-4 gap-y-8 mt-8 ${gridClass}`}>
                {videos.slice(splitCount).map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3 text-secondary text-sm">
                  <div className="w-5 h-5 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
                  Loading more...
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
