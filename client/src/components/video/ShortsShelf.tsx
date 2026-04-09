'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import { videoAPI } from '@/lib/api';
import { formatViews } from '@/lib/utils';
import { SiYoutube } from 'react-icons/si';
import Dropdown, { DropdownItem } from '@/components/layout/Dropdown';
import { useAuthStore, useUIStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  HiOutlineClock,
  HiOutlineFlag,
  HiOutlineShare,
  HiOutlineBan,
} from 'react-icons/hi';

export default function ShortsShelf({ isSidebarMode = false }: { isSidebarMode?: boolean }) {
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  
  // Use UI store or prop to determine desktop item counts
  const { sidebarCollapsed, sidebarOpen } = useUIStore();
  const isExpanded = !sidebarOpen || sidebarCollapsed;
  const desktopCols = isSidebarMode ? 3 : (isExpanded ? 6 : 5);

  useEffect(() => {
    loadShorts();
  }, []);

  const loadShorts = async () => {
    try {
      const { data } = await videoAPI.getShorts(1, 10);
      setShorts(data.videos);
    } catch (error) {
      console.error('Failed to load shorts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => handleScroll(), 100);
    window.addEventListener('resize', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleScroll);
    };
  }, [shorts]);

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

  if (loading || shorts.length === 0) return null;

  return (
    <div className={isSidebarMode ? "my-2" : "my-8"}>
      <div className={`flex items-center gap-2 mb-4 ${isSidebarMode ? 'px-0' : 'px-2'}`}>
        <SiYoutube className="w-6 h-6 text-accent-red" />
        <h2 className={isSidebarMode ? "text-lg font-bold" : "text-xl font-bold"}>Shorts</h2>
      </div>

      <div className="relative group/shelf">
        {/* Scroll Arrows */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute left-0 top-[calc(50%-45px)] -translate-y-1/2 -ml-3 z-30 w-10 h-10 bg-white dark:bg-surface-600 rounded-full shadow-lg items-center justify-center text-primary hover:bg-surface transition-colors opacity-0 group-hover/shelf:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute right-0 top-[calc(50%-45px)] -translate-y-1/2 -mr-3 z-30 w-10 h-10 bg-white dark:bg-surface-600 rounded-full shadow-lg items-center justify-center text-primary hover:bg-surface transition-colors opacity-0 group-hover/shelf:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={`grid grid-cols-2 ${isSidebarMode ? 'gap-x-2' : 'gap-x-2'} gap-y-4 sm:flex ${isSidebarMode ? 'sm:gap-2' : 'sm:gap-4'} sm:overflow-x-auto sm:snap-x sm:snap-mandatory scrollbar-hide pb-4 ${isSidebarMode ? 'px-0' : 'px-2'}`}
        >
          {shorts.map((video) => (
            <ShortCard 
              key={video.id} 
              video={video} 
              desktopCols={desktopCols} 
              isSidebarMode={isSidebarMode}
            />
          ))}
        </div>
      </div>
      
      {!isSidebarMode && (
        <div className="border-b border-border-light/10 dark:border-border-light/5 my-6 mx-2" />
      )}
    </div>
  );
}

function ShortCard({ video, desktopCols = 5, isSidebarMode = false }: { video: any, desktopCols?: number, isSidebarMode?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const hoverTimerRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 50);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHovered(false);
  };

  const getMenuItems = (): DropdownItem[] => {
    const items: DropdownItem[] = [];

    if (isAuthenticated) {
      items.push({
        id: 'watch-later',
        label: 'Save to Watch Later',
        icon: <HiOutlineClock className="w-5 h-5" />,
        onClick: () => {
          videoAPI.toggleWatchLater(video.id)
            .then(() => toast.success('Added to Watch Later'))
            .catch(() => toast.error('Failed to save'));
        },
      });
    }

    items.push({
      id: 'share',
      label: 'Share',
      icon: <HiOutlineShare className="w-5 h-5" />,
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/shorts/${video.id}`);
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

  // Determine dynamic width calculating exact fraction minus gaps.
  // Using 1rem (16px) gap. If sidebar mode, sometimes 0.5rem (8px) is used, but 16px is fine.
  const gapSize = isSidebarMode ? 8 : 16;
  const widthCalculation = `calc((100% - ${(desktopCols - 1) * gapSize}px) / ${desktopCols})`;

  return (
    <div
      className="w-full shrink-0 snap-center group/card flex flex-col relative"
      style={{
        // On mobile it uses the tailwind utility (w-[calc...]), on desktop (>=640px) we enforce the dynamic UI width natively.
        ...(typeof window !== 'undefined' && window.innerWidth >= 640 ? { width: widthCalculation, flexShrink: 0 } : {})
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-surface-200 block">
        <Link
          href={`/shorts/${video.id}`}
          className="absolute inset-0 block z-0"
        >
          {/* Thumbnail */}
          <img
            src={video.thumbnailUrl || '/placeholder-thumb.jpg'}
            alt={video.title}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover/card:scale-105 ${isHovered && video.hlsUrl ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
          />

          {isHovered && video.hlsUrl && (
            <div className="absolute inset-0 w-full h-full z-10 scale-105 pointer-events-none bg-black">
              <HoverPlayer hlsUrl={video.hlsUrl} poster={video.thumbnailUrl || undefined} />
            </div>
          )}

          {/* Bottom gradient for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10" />

          {/* Mobile Info Overlay (Inside Thumbnail) */}
          <div className="absolute bottom-2 left-2 right-2 z-20 sm:hidden pointer-events-none flex flex-col justify-end">
            <h3 className="text-[14px] font-medium text-white line-clamp-2 leading-snug drop-shadow-md">
              {video.title}
            </h3>
            <p className="text-[12px] text-white/90 mt-1 font-medium drop-shadow-md">
              {formatViews(video.views)}
            </p>
          </div>
        </Link>

        {/* Mobile 3-dot menu overlay */}
        <div className="absolute top-1 right-1 z-30 sm:hidden">
          <Dropdown
            items={getMenuItems()}
            position="bottom-right"
            trigger={
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-white drop-shadow-md">
                <path d="M12,16.5c0.83,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S11.17,16.5,12,16.5z M10.5,12 c0,0.83,0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5S10.5,11.17,10.5,12z M10.5,4.5C10.5,5.33,11.17,6,12,6 s1.5-0.67,1.5-1.5S12.83,3,12,3S10.5,3.67,10.5,4.5z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Info below thumbnail — Desktop only */}
      <div className="mt-3 hidden sm:flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <Link href={`/shorts/${video.id}`} className="block">
            <h3 className="text-[14px] font-semibold text-primary line-clamp-2 leading-snug group-hover/card:text-accent-red transition-colors">
              {video.title}
            </h3>
          </Link>
          <p className="text-[13px] text-secondary mt-1">
            {formatViews(video.views)}
          </p>
        </div>

        {/* 3-dot menu */}
        <Dropdown
          items={getMenuItems()}
          position="bottom-right"
          className="shrink-0 -mr-1 mt-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
}

function HoverPlayer({ hlsUrl, poster }: { hlsUrl: string, poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startLevel: 0,
        maxBufferLength: 5,
        maxMaxBufferLength: 10,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { });
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.play().catch(() => { });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      muted
      loop
      playsInline
      poster={poster}
    />
  );
}
