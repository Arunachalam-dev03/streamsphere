'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { liveAPI } from '@/lib/api';
import { formatViews, getInitials } from '@/lib/utils';
import { HiStatusOnline } from 'react-icons/hi';

export default function LiveNowShelf() {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    loadStreams();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStreams = async () => {
    try {
      const { data } = await liveAPI.getActive(1, 10);
      setStreams(data.streams || []);
    } catch (error) {
      console.error('Failed to load live streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -400 : 400;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Don't render anything if no live streams
  if (!loading && streams.length === 0) return null;
  if (loading) return null;

  return (
    <div className="my-8 relative group/shelf">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="relative">
          <HiStatusOnline className="w-6 h-6 text-red-500" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </div>
        <h2 className="text-xl font-bold text-primary">Live Now</h2>
        <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-medium">
          {streams.length} streaming
        </span>
        <Link
          href="/live"
          className="ml-auto text-sm text-accent-red hover:text-red-400 font-medium transition-colors"
        >
          See all →
        </Link>
      </div>

      {/* Scroll Arrows */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-30 w-10 h-10 bg-white dark:bg-surface-600 rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-surface transition-colors opacity-0 group-hover/shelf:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
        </button>
      )}

      {showRightArrow && streams.length > 3 && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-30 w-10 h-10 bg-white dark:bg-surface-600 rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-surface transition-colors opacity-0 group-hover/shelf:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
        </button>
      )}

      {/* Scrollable stream cards */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-2"
      >
        {streams.map((stream) => (
          <LiveShelfCard key={stream.id} stream={stream} />
        ))}
      </div>

      <div className="border-b border-border-light/10 dark:border-border-light/5 my-6 mx-2" />
    </div>
  );
}

function LiveShelfCard({ stream }: { stream: any }) {
  return (
    <div className="w-[300px] sm:w-[340px] shrink-0 snap-center group/card flex flex-col">
      <Link
        href={`/live/${stream.id}`}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-200 block"
      >
        {/* Thumbnail / Placeholder */}
        {stream.thumbnailUrl ? (
          <img
            src={stream.thumbnailUrl}
            alt={stream.title}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover/card:scale-105"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-red-900/60 to-rose-900/80 flex items-center justify-center transition-all duration-300 group-hover/card:scale-105">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-red-500/30 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </div>
              <span className="text-white/60 text-xs font-medium">LIVE</span>
            </div>
          </div>
        )}

        {/* LIVE badge */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-red-600 rounded px-2 py-0.5 shadow-lg shadow-red-600/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="text-[11px] text-white font-bold tracking-wide">LIVE</span>
        </div>

        {/* Viewer count */}
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
          <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <span className="text-[11px] text-white font-medium">{formatViews(stream.viewerCount)}</span>
        </div>

        {/* Glow ring */}
        <div className="absolute inset-0 rounded-xl ring-2 ring-red-500/30 group-hover/card:ring-red-500/50 transition-all duration-300 pointer-events-none" />
      </Link>

      {/* Stream info */}
      <div className="flex gap-3 mt-3">
        {/* Streamer Avatar */}
        <Link href={`/@${stream.user.username}`} className="shrink-0 mt-0.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold overflow-hidden
                          bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-sm ring-2 ring-red-500/30">
            {stream.user.avatar ? (
              <img src={stream.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="select-none">{getInitials(stream.user.displayName)}</span>
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/live/${stream.id}`}>
            <h3 className="text-sm font-medium line-clamp-2 leading-5 text-primary group-hover/card:text-red-500 transition-colors">
              {stream.title}
            </h3>
          </Link>
          <Link href={`/@${stream.user.username}`}>
            <p className="text-[13px] text-secondary hover:text-primary transition-colors mt-0.5 leading-tight">
              {stream.user.displayName}
            </p>
          </Link>
          <p className="text-[13px] text-red-400 leading-tight flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            {formatViews(stream.viewerCount)} watching
          </p>
        </div>
      </div>
    </div>
  );
}
