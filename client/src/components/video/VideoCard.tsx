'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Hls from 'hls.js';
import { formatViews, formatDuration, timeAgo, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import Dropdown, { DropdownItem } from '@/components/layout/Dropdown';
import { videoAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  HiOutlineClock,
  HiOutlineFlag,
  HiOutlineShare,
  HiOutlineBan,
  HiOutlineBookmark,
  HiOutlineClipboardList,
} from 'react-icons/hi';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    hlsUrl?: string;
    duration: number;
    views: number;
    createdAt: string;
    status?: string;
    isShort?: boolean;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatar: string | null;
      isVerified?: boolean;
    };
  };
  layout?: 'grid' | 'list';
}

export default function VideoCard({ video, layout = 'grid' }: VideoCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isHovered, setIsHovered] = React.useState(false);
  const hoverTimerRef = React.useRef<NodeJS.Timeout>();
  const isShort = video.isShort === true || (video.duration > 0 && video.duration <= 180);

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 50);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHovered(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (video.status && video.status !== 'READY') {
      e.preventDefault();
      toast('Video is still processing...', { icon: '⏳' });
    }
  };

  // Build dropdown menu items
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
        const url = isShort
          ? `${window.location.origin}/shorts/${video.id}`
          : `${window.location.origin}/watch/${video.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
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



  // ─── LIST LAYOUT ───────────────────────────────────────────────────
  if (layout === 'list') {
    return (
      <Link
        href={isShort ? `/shorts/${video.id}` : `/watch/${video.id}`}
        onClick={handleCardClick}
        className="flex gap-3 group animate-fade-in relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`video-card-thumbnail shrink-0 relative ${isShort ? 'w-24 aspect-[9/16]' : 'w-40 xl:w-44 aspect-video'} rounded-xl overflow-hidden`}>
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered && video.hlsUrl ? 'opacity-0' : 'opacity-100'}`}
            />
          ) : (
            <div className={`absolute inset-0 w-full h-full bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center transition-opacity duration-300 ${isHovered && video.hlsUrl ? 'opacity-0' : 'opacity-100'}`}>
              <span className="text-3xl">🎬</span>
            </div>
          )}

          {isHovered && video.hlsUrl && (
            <div className="absolute inset-0 w-full h-full z-10 scale-105">
              <HoverPlayer hlsUrl={video.hlsUrl} poster={video.thumbnailUrl || undefined} />
            </div>
          )}

          {video.status && video.status !== 'READY' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-20 backdrop-blur-sm">
              <span className="text-white font-medium text-[10px] flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {video.status === 'UPLOADING' ? 'Uploading...' : 'Processing...'}
              </span>
            </div>
          )}
          {video.duration > 0 && video.status === 'READY' && (
            <span className={`absolute bottom-1 right-1 bg-black/80 text-white text-[11px] font-medium px-1 py-0.5 rounded transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100 z-10'}`}>
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 py-0.5 pr-6 relative">
          <h3 className="text-sm font-medium line-clamp-2 mb-1 group-hover:text-accent-red transition-colors leading-tight text-primary">
            {video.title}
          </h3>
          <p className="text-[12px] text-secondary mb-1">
            {formatViews(video.views)} • {timeAgo(video.createdAt)}
          </p>
          <Link
            href={`/@${video.user.username}`}
            className="flex items-center gap-1.5 group/channel w-fit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[9px] font-bold shrink-0 overflow-hidden text-white shadow-sm">
              {video.user.avatar ? (
                <img src={video.user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="select-none">{getInitials(video.user.displayName)}</span>
              )}
            </div>
            <span className="text-[12px] text-secondary group-hover/channel:text-primary transition-colors truncate flex items-center gap-1">
              {video.user.displayName}
              {video.user.isVerified && <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
            </span>
          </Link>

          {/* List layout 3-dot menu */}
          <div className="absolute top-0 right-0">
            <Dropdown
              items={getMenuItems()}
              position="bottom-right"
              className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </Link>
    );
  }

  // ─── GRID LAYOUT (regular videos) ──────────────────────────────────
  return (
    <div
      className="animate-fade-in group relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={isShort ? `/shorts/${video.id}` : `/watch/${video.id}`} onClick={handleCardClick}>
        {/* Thumbnail — edge-to-edge on mobile, rounded on desktop */}
        <div className={`video-card-thumbnail relative overflow-hidden sm:rounded-xl rounded-none aspect-video ${isShort ? 'bg-black' : ''}`}>
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className={`absolute inset-0 w-full h-full ${isShort ? 'object-contain' : 'object-cover'} transition-all duration-300 group-hover:scale-105 ${isHovered && video.hlsUrl ? 'opacity-0' : 'opacity-100'}`}
            />
          ) : (
            <div className={`absolute inset-0 w-full h-full bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${isHovered && video.hlsUrl ? 'opacity-0' : 'opacity-100'}`}>
              <span className="text-4xl">🎬</span>
            </div>
          )}

          {isHovered && video.hlsUrl && (
            <div className="absolute inset-0 w-full h-full z-10 scale-105 bg-black">
              <HoverPlayer hlsUrl={video.hlsUrl} poster={video.thumbnailUrl || undefined} isShort={isShort} />
            </div>
          )}

          {isShort && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-red-500 fill-current"><path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.54 1.02 1.4 1.72 2.4 2 .5.14 1.01.2 1.53.2.78 0 1.56-.21 2.25-.62L18 17.07c1.28-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.22-3.26z" /></svg>
              <span className="text-[10px] text-white font-bold">Short</span>
            </div>
          )}

          {video.status && video.status !== 'READY' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-20 backdrop-blur-sm">
              <span className="text-white font-medium text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {video.status === 'UPLOADING' ? 'Uploading...' : 'Processing...'}
              </span>
            </div>
          )}
          {video.duration > 0 && (!video.status || video.status === 'READY') && (
            <span className={`absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100 z-20'}`}>
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
      </Link>

      {/* Card info — avatar + title + channel + 3-dot menu */}
      <div className="flex gap-3 mt-3 px-3 sm:px-0">
        {/* Avatar */}
        <Link href={`/@${video.user.username}`} className="shrink-0 mt-0.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold overflow-hidden
                          bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
            {video.user.avatar ? (
              <img src={video.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="select-none">{getInitials(video.user.displayName)}</span>
            )}
          </div>
        </Link>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <Link href={isShort ? `/shorts/${video.id}` : `/watch/${video.id}`} onClick={handleCardClick}>
            <h3 className="text-sm font-medium line-clamp-2 leading-5 text-primary group-hover:text-accent-red transition-colors">
              {video.title}
            </h3>
          </Link>
          <Link href={`/@${video.user.username}`}>
            <p className="text-[13px] text-secondary hover:text-primary transition-colors mt-0.5 leading-tight flex items-center gap-1">
              {video.user.displayName}
              {video.user.isVerified && <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
            </p>
          </Link>
          <p className="text-[13px] text-secondary leading-tight">
            {formatViews(video.views)} • {timeAgo(video.createdAt)}
          </p>
        </div>

        {/* 3-dot menu */}
        <Dropdown
          items={getMenuItems()}
          position="bottom-right"
          className="-mt-0.5 -mr-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
}

// Hover HLS Player sub-component — uses static Hls import for instant start
function HoverPlayer({ hlsUrl, poster, isShort }: { hlsUrl: string, poster?: string, isShort?: boolean }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hlsRef = React.useRef<Hls | null>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startLevel: 0, // Start at lowest quality for instant playback
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
      className={`absolute inset-0 w-full h-full ${isShort ? 'object-contain' : 'object-cover'} pointer-events-none`}
      muted
      loop
      playsInline
      poster={poster}
    />
  );
}

// Skeleton loader
export function VideoCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video rounded-xl skeleton" />
      <div className="flex gap-3 mt-3">
        <div className="w-9 h-9 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton w-full rounded" />
          <div className="h-4 skeleton w-3/4 rounded" />
          <div className="h-3 skeleton w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}
