'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { videoAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatViews, timeAgo } from '@/lib/utils';
import { SiYoutube } from 'react-icons/si';
import Dropdown, { DropdownItem } from '@/components/layout/Dropdown';
import toast from 'react-hot-toast';
import {
  HiOutlineClock,
  HiOutlineFlag,
  HiOutlineShare,
  HiOutlineBan,
  HiOutlineBookmark,
} from 'react-icons/hi';

export default function ShortsPage() {
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadShorts(1);
  }, []);

  const loadShorts = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const { data } = await videoAPI.getShorts(pageNum, 24);
      if (pageNum === 1) {
        setShorts(data.videos);
      } else {
        setShorts((prev) => [...prev, ...data.videos]);
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load shorts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMenuItems = (videoId: string): DropdownItem[] => {
    const items: DropdownItem[] = [];

    if (isAuthenticated) {
      items.push({
        id: 'watch-later',
        label: 'Save to Watch Later',
        icon: <HiOutlineClock className="w-5 h-5" />,
        onClick: () => {
          videoAPI.toggleWatchLater(videoId)
            .then(() => toast.success('Added to Watch Later'))
            .catch(() => toast.error('Failed to save'));
        },
      });
      items.push({
        id: 'save-playlist',
        label: 'Save to playlist',
        icon: <HiOutlineBookmark className="w-5 h-5" />,
        onClick: () => toast('Playlist modal coming soon', { icon: '📋' }),
      });
    }

    items.push({
      id: 'share',
      label: 'Share',
      icon: <HiOutlineShare className="w-5 h-5" />,
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/shorts/${videoId}`);
        toast.success('Link copied!');
      },
    });

    items.push({ id: 'div-1', label: '', divider: true });

    items.push({
      id: 'not-interested',
      label: 'Not interested',
      icon: <HiOutlineBan className="w-5 h-5" />,
      onClick: () => toast.success('We\'ll tune your recommendations'),
    });

    items.push({
      id: 'report',
      label: 'Report',
      icon: <HiOutlineFlag className="w-5 h-5" />,
      danger: true,
      onClick: () => toast('Thanks for reporting', { icon: '🚩' }),
    });

    return items;
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <SiYoutube className="w-7 h-7 sm:w-8 sm:h-8 text-accent-red" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Shorts</h1>
      </div>

      {loading && page === 1 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[9/16] bg-surface-300 rounded-xl" />
              <div className="mt-2.5 space-y-1.5">
                <div className="h-3.5 bg-surface-300 rounded w-full" />
                <div className="h-3 bg-surface-300 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : shorts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <SiYoutube className="w-16 h-16 text-secondary/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Shorts Yet</h2>
          <p className="text-secondary text-center max-w-sm">
            Check back later for bite-sized vertical videos from across the platform.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8">
            {shorts.map((video) => (
              <div key={video.id} className="group/card animate-fade-in">
                {/* Thumbnail */}
                <Link
                  href={`/shorts/${video.id}`}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden bg-surface-200 block"
                >
                  <img
                    src={video.thumbnailUrl || '/placeholder-thumb.jpg'}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                    loading="lazy"
                  />
                </Link>

                {/* Title + meta below thumbnail — same as YouTube */}
                <div className="mt-3 flex items-start gap-1">
                  <div className="flex-1 min-w-0">
                    <Link href={`/shorts/${video.id}`}>
                      <h3 className="text-[14px] font-semibold line-clamp-2 leading-snug group-hover/card:text-accent-red transition-colors text-primary">
                        {video.title}
                      </h3>
                    </Link>
                    <p className="text-[13px] text-secondary mt-1">
                      {formatViews(video.views)}
                    </p>
                  </div>

                  {/* 3-dot menu */}
                  <Dropdown
                    items={getMenuItems(video.id)}
                    position="bottom-right"
                    className="shrink-0 mt-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-12 mb-8">
              <button
                onClick={() => loadShorts(page + 1)}
                className="btn-secondary px-8 py-2.5 rounded-full"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Shorts'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
