'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Hls from 'hls.js';
import { videoAPI, commentAPI, channelAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatViews, getInitials, timeAgo } from '@/lib/utils';
import Dropdown, { DropdownItem } from '@/components/layout/Dropdown';
import ShareModal from '@/components/video/ShareModal';
import toast from 'react-hot-toast';
import {
  HiThumbUp, HiThumbDown, HiChat, HiShare,
  HiChevronUp, HiChevronDown, HiX, HiVolumeUp, HiVolumeOff,
  HiOutlineFlag, HiOutlineBan, HiOutlineClock, HiOutlineBookmark,
  HiOutlineDownload, HiOutlineInformationCircle,
} from 'react-icons/hi';

// --- Inline SVG icons for YouTube-specific actions (Remix, CC, Fullscreen) ---
function RemixIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.71 12l2.5-2.5c.39-.39.39-1.02 0-1.41L12.71 5.6a.9959.9959 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41L12.59 8.3H8C5.79 8.3 4 10.09 4 12.3V14c0 .55.45 1 1 1s1-.45 1-1v-1.7c0-1.1.9-2 2-2h4.59l-1.29 1.29c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l2.5-2.5zM20 10v1.7c0 1.1-.9 2-2 2h-4.59l1.29-1.29c.39-.39.39-1.02 0-1.41a.9959.9959 0 0 0-1.41 0l-2.5 2.5c-.39.39-.39 1.02 0 1.41l2.5 2.5c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 14.7H18c2.21 0 4-1.79 4-4V10c0-.55-.45-1-1-1s-1 .45-1 1z" />
    </svg>
  );
}

export default function ShortsPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [shorts, setShorts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareVideoId, setShareVideoId] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [subscribedMap, setSubscribedMap] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const hlsRefs = useRef<{ [key: string]: Hls | null }>({});
  const viewedShortsRef = useRef<Set<string>>(new Set());

  const [playingMap, setPlayingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadShorts();
    return () => {
      Object.values(hlsRefs.current).forEach(hls => {
        if (hls) hls.destroy();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadShorts = async () => {
    try {
      const { data } = await videoAPI.getShorts(1, 20);
      const allShorts = data.videos || [];
      const targetId = params?.id as string;
      const targetIdx = allShorts.findIndex((s: any) => s.id === targetId);
      if (targetIdx > 0) {
        const [target] = allShorts.splice(targetIdx, 1);
        allShorts.unshift(target);
      }
      setShorts(allShorts);
      
      const initialPlaying: Record<string, boolean> = {};
      if (allShorts.length > 0) initialPlaying[allShorts[0].id] = true;
      setPlayingMap(initialPlaying);
    } catch (err: any) {
      console.error('Failed to load shorts:', err);
    } finally {
      setLoading(false);
    }
  };

  const manageHlsInstances = useCallback((index: number) => {
    const activeIndices = new Set([index - 1, index, index + 1, index + 2]);

    shorts.forEach((short, i) => {
      const video = videoRefs.current[i];
      if (!video) return;

      const src = short.hlsUrl || short.url;
      const isHls = src && src.endsWith('.m3u8');

      if (activeIndices.has(i)) {
        if (isHls && Hls.isSupported() && !hlsRefs.current[short.id]) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            maxMaxBufferLength: i === index ? 60 : 30,
            maxBufferSize: 50 * 1024 * 1024,
            startLevel: -1,
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hlsRefs.current[short.id] = hls;
        }
      } else {
        if (hlsRefs.current[short.id]) {
          hlsRefs.current[short.id]?.destroy();
          hlsRefs.current[short.id] = null;
        }
      }

      if (!isHls || (!Hls.isSupported() && video.canPlayType('application/vnd.apple.mpegurl'))) {
        if (!video.src.includes(src)) video.src = src;
      }
    });
  }, [shorts]);

  const playCurrentVideo = useCallback((index: number) => {
    manageHlsInstances(index);

    videoRefs.current.forEach((v, i) => {
      if (v) {
        if (i === index) {
          v.currentTime = 0;
          v.play().catch((_e: any) => {});
        } else {
          v.pause();
        }
      }
    });
    
    setPlayingMap(prev => {
      const newMap = { ...prev };
      shorts.forEach((s, i) => {
        newMap[s.id] = i === index;
      });
      return newMap;
    });
  }, [shorts, manageHlsInstances]);

  useEffect(() => {
    if (shorts.length > 0) {
      playCurrentVideo(currentIndex);
      const currentShortId = shorts[currentIndex]?.id;
      if (currentShortId && !viewedShortsRef.current.has(currentShortId)) {
        viewedShortsRef.current.add(currentShortId);
        videoAPI.recordView(currentShortId).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, shorts.length]);

  const navigateShort = useCallback((direction: 'up' | 'down') => {
    setCurrentIndex((prev) => {
      const nextIndex = direction === 'up' && prev > 0 ? prev - 1 : 
                        direction === 'down' && prev < shorts.length - 1 ? prev + 1 : prev;
      
      if (nextIndex !== prev) {
        setTimeout(() => {
          const container = containerRef.current;
          if (container && container.children[nextIndex]) {
            (container.children[nextIndex] as HTMLElement).scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 10);
      }
      return nextIndex;
    });
  }, [shorts.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); navigateShort('up'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); navigateShort('down'); }
      if (e.key === 'Escape') router.push('/shorts');
      if (e.key === 'm') setMuted((m) => !m);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigateShort, router]);

  // Touch/Scroll snap using Intersection Observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setCurrentIndex(prev => prev !== index ? index : prev);
            }
          }
        });
      },
      {
        root: el,
        threshold: 0.6,
      }
    );

    Array.from(el.children).forEach(child => observer.observe(child));
    
    return () => observer.disconnect();
  }, [shorts.length]);

  const handleLike = async (videoId: string, type: 'LIKE' | 'DISLIKE') => {
    if (!isAuthenticated) { toast.error('Sign in to like'); return; }
    try {
      const { data } = await videoAPI.like(videoId, type);
      setShorts((prev) => prev.map((s) => {
        if (s.id !== videoId) return s;

        let likesCount = s.likesCount || 0;
        let dislikesCount = s.dislikesCount || 0;
        let userLike = s.userLike;

        if (data.action === 'added') {
          if (type === 'LIKE') likesCount++;
          else dislikesCount++;
          userLike = type;
        } else if (data.action === 'removed') {
          if (type === 'LIKE') likesCount = Math.max(0, likesCount - 1);
          else dislikesCount = Math.max(0, dislikesCount - 1);
          userLike = null;
        } else if (data.action === 'switched') {
          if (type === 'LIKE') {
            likesCount++;
            dislikesCount = Math.max(0, dislikesCount - 1);
          } else {
            likesCount = Math.max(0, likesCount - 1);
            dislikesCount++;
          }
          userLike = type;
        }

        return { ...s, likesCount, dislikesCount, userLike };
      }));
    } catch (_err: any) {
      toast.error('Failed to update like status');
    }
  };

  const handleShare = (videoId: string) => {
    setShareVideoId(videoId);
    setShowShareModal(true);
  };

  const handleSubscribe = async (channelId: string) => {
    if (!isAuthenticated) {
      toast.error('Sign in to subscribe');
      return;
    }
    try {
      await channelAPI.subscribe(channelId);
      setSubscribedMap(prev => ({ ...prev, [channelId]: !prev[channelId] }));
      toast.success(subscribedMap[channelId] ? 'Unsubscribed' : 'Subscribed!');
    } catch (_err: any) {
      toast.error('Failed to subscribe');
    }
  };

  const loadComments = async (videoId: string) => {
    try {
      const { data } = await commentAPI.getByVideo(videoId);
      setComments(data.comments || []);
    } catch (_err: any) {
      /* ignore */
    }
  };

  const handleComment = async (videoId: string) => {
    if (!commentText.trim()) return;
    try {
      await commentAPI.create(videoId, commentText);
      setCommentText('');
      loadComments(videoId);
      toast.success('Comment added');
    } catch (_err: any) {
      toast.error('Failed to post comment');
    }
  };

  const togglePlayPause = (index: number, shortId: string) => {
    const v = videoRefs.current[index];
    if (v) {
      if (v.paused) {
        v.play().catch(() => {});
        setPlayingMap(p => ({ ...p, [shortId]: true }));
      } else {
        v.pause();
        setPlayingMap(p => ({ ...p, [shortId]: false }));
      }
    }
  };

  // Three-dot menu items for the Short
  const getShortMenuItems = (short: any): DropdownItem[] => {
    const items: DropdownItem[] = [
      {
        id: 'description',
        label: 'Description',
        icon: <HiOutlineInformationCircle className="w-5 h-5" />,
        onClick: () => setShowDescription(d => !d),
      },
    ];

    if (isAuthenticated) {
      items.push({
        id: 'watch-later',
        label: 'Save to Watch Later',
        icon: <HiOutlineClock className="w-5 h-5" />,
        onClick: () => {
          videoAPI.toggleWatchLater(short.id)
            .then(() => toast.success('Added to Watch Later'))
            .catch(() => toast.error('Failed'));
        },
      });
      items.push({
        id: 'save-playlist',
        label: 'Save to playlist',
        icon: <HiOutlineBookmark className="w-5 h-5" />,
        onClick: () => toast('Playlist modal coming soon', { icon: '📋' }),
      });
    }

    items.push({ id: 'div-1', label: '', divider: true });

    items.push({
      id: 'captions',
      label: 'Captions',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/>
        </svg>
      ),
      onClick: () => toast('Captions not available for this video', { icon: 'CC' }),
    });

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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
        <p className="text-lg">No shorts available</p>
        <button onClick={() => router.push('/shorts')} className="mt-4 btn-primary">Back to Shorts</button>
      </div>
    );
  }

  const currentShort = shorts[currentIndex];
  if (!currentShort) return null;

  return (
    <div className="fixed inset-0 z-[100] sm:relative sm:inset-auto sm:z-auto w-full h-[100dvh] sm:h-[calc(100vh-56px)] bg-black sm:bg-surface/30 flex justify-center overflow-hidden">
      {/* Close button (mobile only) */}
      <button
        onClick={() => router.push('/shorts')}
        className="absolute top-4 left-4 z-50 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors backdrop-blur-sm sm:hidden"
      >
        <HiX className="w-6 h-6 text-white" />
      </button>

      {/* Main scroll container */}
      <div
        ref={containerRef}
        className="h-full w-full sm:w-auto overflow-y-auto snap-y snap-mandatory scrollbar-hide py-0 sm:py-6"
      >
        {shorts.map((short, index) => (
          <div key={short.id} data-index={index} className="h-full w-full sm:w-auto snap-start snap-always flex items-center justify-center sm:pb-6 relative shrink-0">
            <div className="relative flex items-center sm:items-end justify-center h-full sm:h-full gap-0 sm:gap-4 w-full sm:w-auto px-0 sm:px-4">
              
              {/* Video Container */}
              <div className="relative h-full w-full sm:w-auto sm:aspect-[9/16] sm:min-w-[340px] sm:max-w-[400px] xl:max-w-[420px] bg-black sm:rounded-2xl overflow-hidden flex items-center justify-center group/video sm:shadow-2xl shrink-0">
                <video
                  ref={(el) => { videoRefs.current[index] = el; }}
                  src={short.hlsUrl || short.url}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted={muted}
                />

                {/* Invisible Click Overlay for Play/Pause */}
                <div 
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={() => togglePlayPause(index, short.id)}
                />

                {/* Top controls bar */}
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 pt-3 pb-8 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                  {/* Left: Mute */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                    className="pointer-events-auto p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors backdrop-blur-sm"
                  >
                    {muted ? <HiVolumeOff className="w-5 h-5 text-white" /> : <HiVolumeUp className="w-5 h-5 text-white" />}
                  </button>
                  
                  {/* Right: Three-dot menu */}
                  <div className="pointer-events-auto">
                    <Dropdown
                      items={getShortMenuItems(short)}
                      position="bottom-right"
                      trigger={
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                          <path d="M12,16.5c0.83,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S11.17,16.5,12,16.5z M10.5,12 c0,0.83,0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5S10.5,11.17,10.5,12z M10.5,4.5C10.5,5.33,11.17,6,12,6 s1.5-0.67,1.5-1.5S12.83,3,12,3S10.5,3.67,10.5,4.5z" />
                        </svg>
                      }
                    />
                  </div>
                </div>

                {/* Play/Pause Visual Feedback */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-300 ${!playingMap[short.id] && index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white/90">
                    <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>

                {/* Bottom gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none z-10" />

                {/* Video info (Inside Video Bottom) */}
                <div className="absolute bottom-6 left-4 right-16 sm:right-4 text-white z-20 pointer-events-none pb-safe">
                  {/* Location tag (if available) */}
                  {short.location && (
                    <div className="flex items-center gap-1.5 mb-2 pointer-events-auto w-fit">
                      <svg className="w-3.5 h-3.5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[11px] text-white/70 font-medium">{short.location}</span>
                    </div>
                  )}

                  {/* Channel info row */}
                  <div className="flex items-center gap-3 mb-3 pointer-events-auto w-fit">
                    <Link href={`/@${short.user?.username || ''}`}>
                      <div className="w-9 h-9 rounded-full bg-accent-purple flex items-center justify-center text-xs font-bold overflow-hidden ring-2 ring-white/20 shadow-lg">
                        {short.user?.avatar ? (
                          <img src={short.user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(short.user?.displayName || 'U')
                        )}
                      </div>
                    </Link>
                    <Link href={`/@${short.user?.username || ''}`} className="flex items-center gap-1">
                      <span className="text-[14px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] tracking-wide">@{short.user?.username || 'unknown'}</span>
                      {short.user?.isVerified && <svg className="w-4 h-4 text-blue-400 shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                    </Link>
                    {user?.id !== short.user?.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSubscribe(short.user?.id); }}
                        className={`px-3 py-1 text-[13px] font-bold rounded-full transition-all ml-1 shadow-lg pointer-events-auto ${
                          subscribedMap[short.user?.id] 
                            ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm' 
                            : 'bg-white text-black hover:bg-gray-200'
                        }`}
                      >
                        {subscribedMap[short.user?.id] ? 'Subscribed' : 'Subscribe'}
                      </button>
                    )}
                  </div>

                  {/* Title with expand/collapse */}
                  <h3 className={`text-[15px] font-medium leading-snug mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] pr-4 ${showDescription ? '' : 'line-clamp-2'}`}>{short.title}</h3>
                  
                  {/* Description (expandable) */}
                  {showDescription && short.description && (
                    <p className="text-[13px] text-white/80 mt-1 pr-4 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {short.description}
                    </p>
                  )}
                </div>

                {/* Mobile-only Action Buttons (Inside Video Right) */}
                <div className="absolute right-2 bottom-6 flex flex-col items-center gap-4 z-30 pointer-events-auto sm:hidden pb-safe">
                  {/* Like */}
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(short.id, 'LIKE'); }} className="flex flex-col items-center gap-1 group relative z-10">
                    <div className={`p-2 rounded-full transition-all duration-300 ${short.userLike === 'LIKE' ? 'text-blue-500 scale-110' : 'text-white/90 group-hover:scale-110'} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
                      <HiThumbUp className="w-7 h-7" />
                    </div>
                    <span className="text-[12px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{short.likesCount || 0}</span>
                  </button>

                  {/* Dislike */}
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(short.id, 'DISLIKE'); }} className="flex flex-col items-center gap-1 group relative z-10">
                    <div className={`p-2 rounded-full transition-all duration-300 ${short.userLike === 'DISLIKE' ? 'text-blue-500 scale-110' : 'text-white/90 group-hover:scale-110'} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
                      <HiThumbDown className="w-7 h-7" />
                    </div>
                    <span className="text-[12px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">Dislike</span>
                  </button>

                  {/* Comments */}
                  <button
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      setShowComments(!showComments); 
                      if (!showComments) loadComments(short.id); 
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="p-2 rounded-full transition-all duration-300 text-white/90 group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      <HiChat className="w-7 h-7" />
                    </div>
                    <span className="text-[12px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{short.commentsCount || 0}</span>
                  </button>

                  {/* Share */}
                  <button onClick={(e) => { e.stopPropagation(); handleShare(short.id); }} className="flex flex-col items-center gap-1 group">
                    <div className="p-2 rounded-full transition-all duration-300 text-white/90 group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      <HiShare className="w-7 h-7" />
                    </div>
                    <span className="text-[12px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">Share</span>
                  </button>

                  {/* Remix */}
                  <button onClick={(e) => { e.stopPropagation(); toast('Remix coming soon!', { icon: '🎵' }); }} className="flex flex-col items-center gap-1 group">
                    <div className="p-2 rounded-full transition-all duration-300 text-white/90 group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      <RemixIcon className="w-7 h-7" />
                    </div>
                    <span className="text-[12px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">Remix</span>
                  </button>

                  {/* Spinning avatar disc */}
                  <Link href={`/@${short.user?.username || ''}`} className="mt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="w-9 h-9 rounded-lg border-2 border-white/30 overflow-hidden shadow-lg animate-[spin_8s_linear_infinite]" style={{ animationPlayState: playingMap[short.id] ? 'running' : 'paused' }}>
                      {short.user?.avatar ? (
                        <img src={short.user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent-purple to-accent-red flex items-center justify-center text-[10px] font-bold text-white">
                          {getInitials(short.user?.displayName || 'U')}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
              
              {/* Desktop-only Action Buttons (Outside Video Right) */}
              <div className="hidden sm:flex flex-col items-center justify-end h-full w-16 mb-2 gap-4 shrink-0">
                {/* Like */}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(short.id, 'LIKE'); }} className="flex flex-col items-center gap-1.5 group outline-none">
                  <div className={`p-3.5 rounded-full transition-all duration-300 shadow-sm group-hover:scale-110 group-active:scale-95 group-hover:-translate-y-1 ${short.userLike === 'LIKE' ? 'bg-blue-500/10 text-blue-500 ring-2 ring-blue-500/30' : 'bg-surface-100 hover:bg-surface-200 text-primary'}`}>
                    <HiThumbUp className="w-6 h-6" />
                  </div>
                  <span className={`text-[13px] font-semibold transition-colors ${short.userLike === 'LIKE' ? 'text-blue-500' : 'text-secondary group-hover:text-primary'}`}>{short.likesCount || 0}</span>
                </button>

                {/* Dislike */}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(short.id, 'DISLIKE'); }} className="flex flex-col items-center gap-1.5 group outline-none">
                  <div className={`p-3.5 rounded-full transition-all duration-300 shadow-sm group-hover:scale-110 group-active:scale-95 group-hover:-translate-y-1 ${short.userLike === 'DISLIKE' ? 'bg-blue-500/10 text-blue-500 ring-2 ring-blue-500/30' : 'bg-surface-100 hover:bg-surface-200 text-primary'}`}>
                    <HiThumbDown className="w-6 h-6" />
                  </div>
                  <span className={`text-[13px] font-semibold transition-colors ${short.userLike === 'DISLIKE' ? 'text-blue-500' : 'text-secondary group-hover:text-primary'}`}>Dislike</span>
                </button>

                {/* Comments */}
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation(); 
                    setShowComments(!showComments); 
                    if (!showComments) loadComments(short.id); 
                  }}
                  className="flex flex-col items-center gap-1.5 group outline-none"
                >
                  <div className="p-3.5 rounded-full bg-surface-100 hover:bg-surface-200 text-primary transition-all duration-300 shadow-sm group-hover:scale-110 group-active:scale-95 group-hover:-translate-y-1">
                    <HiChat className="w-6 h-6" />
                  </div>
                  <span className="text-[13px] font-semibold text-secondary group-hover:text-primary transition-colors">{short.commentsCount || 0}</span>
                </button>

                {/* Share */}
                <button onClick={(e) => { e.stopPropagation(); handleShare(short.id); }} className="flex flex-col items-center gap-1.5 group outline-none">
                  <div className="p-3.5 rounded-full bg-surface-100 hover:bg-surface-200 text-primary transition-all duration-300 shadow-sm group-hover:scale-110 group-active:scale-95 group-hover:-translate-y-1">
                    <HiShare className="w-6 h-6" />
                  </div>
                  <span className="text-[13px] font-semibold text-secondary group-hover:text-primary transition-colors">Share</span>
                </button>

                {/* Remix */}
                <button onClick={(e) => { e.stopPropagation(); toast('Remix coming soon!', { icon: '🎵' }); }} className="flex flex-col items-center gap-1.5 group outline-none">
                  <div className="p-3.5 rounded-full bg-surface-100 hover:bg-surface-200 text-primary transition-all duration-300 shadow-sm group-hover:scale-110 group-active:scale-95 group-hover:-translate-y-1">
                    <RemixIcon className="w-6 h-6" />
                  </div>
                  <span className="text-[13px] font-semibold text-secondary group-hover:text-primary transition-colors">Remix</span>
                </button>

                {/* Three-dot menu (Desktop) */}
                <Dropdown
                  items={getShortMenuItems(short)}
                  position="top-right"
                  trigger={
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-secondary">
                      <path d="M12,16.5c0.83,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S11.17,16.5,12,16.5z M10.5,12 c0,0.83,0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5S10.5,11.17,10.5,12z M10.5,4.5C10.5,5.33,11.17,6,12,6 s1.5-0.67,1.5-1.5S12.83,3,12,3S10.5,3.67,10.5,4.5z" />
                    </svg>
                  }
                />

                {/* Spinning avatar disc */}
                <Link href={`/@${short.user?.username || ''}`} className="mt-1">
                  <div className="w-10 h-10 rounded-lg border-2 border-border-light/30 overflow-hidden shadow-md transition-transform hover:scale-110" style={{ animation: playingMap[short.id] ? 'spin 8s linear infinite' : 'none' }}>
                    {short.user?.avatar ? (
                      <img src={short.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[11px] font-bold text-white">
                        {getInitials(short.user?.displayName || 'U')}
                      </div>
                    )}
                  </div>
                </Link>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows (Desktop only, fixed right) */}
      <div className="absolute right-6 xl:right-16 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-40">
        <button
          onClick={() => navigateShort('up')}
          disabled={currentIndex === 0}
          className="p-3.5 rounded-full bg-surface-200 hover:bg-surface-300 dark:bg-surface-100 dark:hover:bg-surface-200 transition-colors shadow-sm disabled:opacity-0 disabled:pointer-events-none text-primary"
        >
          <HiChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={() => navigateShort('down')}
          disabled={currentIndex === shorts.length - 1}
          className="p-3.5 rounded-full bg-surface-200 hover:bg-surface-300 dark:bg-surface-100 dark:hover:bg-surface-200 transition-colors shadow-sm disabled:opacity-0 disabled:pointer-events-none text-primary"
        >
          <HiChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Premium Comments Panel */}
      {showComments && currentShort && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-sm sm:hidden"
            onClick={() => setShowComments(false)}
          />
          
          <div className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[420px] bg-card/95 backdrop-blur-2xl sm:rounded-3xl rounded-t-3xl z-50 border border-border-light/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out h-[65dvh] sm:h-[650px] animate-scale-in">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-page/40 rounded-t-3xl">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <HiChat className="w-5 h-5 text-accent-red" />
                Comments
                <span className="text-secondary text-sm font-normal ml-1 bg-white/5 px-2 py-0.5 rounded-full">
                  {comments.length}
                </span>
              </h3>
              <button 
                onClick={() => setShowComments(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide bg-gradient-to-b from-transparent to-page/10">
              {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-secondary space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                    <HiChat className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No comments yet</p>
                  <p className="text-xs opacity-70">Be the first to share your thoughts!</p>
                </div>
              ) : comments.map((c: any) => (
                <div key={c.id} className="flex gap-3 group animate-slide-up">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-purple to-accent-red flex items-center justify-center text-xs font-bold shrink-0 shadow-lg ring-1 ring-white/10">
                    {c.user?.avatar ? <img src={c.user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(c.user?.displayName || 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1 pl-1">
                      <span className="text-[13px] font-semibold text-white/90">@{c.user?.username}</span>
                      <span className="text-[11px] text-secondary">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-[14px] text-primary leading-relaxed break-words bg-white/5 hover:bg-white/10 transition-colors rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block border border-white/5 shadow-sm align-top">
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input Area */}
            {isAuthenticated ? (
              <div className="p-4 border-t border-white/5 bg-page/60 sm:rounded-b-3xl">
                <div className="flex gap-3 items-end">
                  <div className="w-9 h-9 rounded-full bg-accent-purple shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden ring-2 ring-surface pb-1">
                    {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(user?.displayName || 'U')}
                  </div>
                  <div className="flex-1 bg-surface-200 border border-white/10 shadow-inner rounded-2xl overflow-hidden focus-within:border-accent-red/50 focus-within:ring-1 focus-within:ring-accent-red/50 transition-all flex flex-col">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-transparent px-4 py-3 pb-2 text-[14px] focus:outline-none resize-none max-h-32 min-h-[44px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleComment(currentShort.id);
                        }
                      }}
                    />
                    {commentText.trim() && (
                      <div className="flex justify-end px-2 pb-2 pt-1 bg-surface-200">
                        <button
                          onClick={() => handleComment(currentShort.id)}
                          className="px-4 py-1.5 bg-accent-red hover:bg-red-600 text-white text-[13px] font-bold rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 border-t border-white/5 bg-page/60 text-center sm:rounded-b-3xl">
                <p className="text-[15px] font-medium text-white mb-1">Join the conversation</p>
                <p className="text-[13px] text-secondary mb-4">Sign in to share your thoughts with the creator.</p>
                <Link href={`/auth/login?redirect=/shorts/${currentShort.id}`} className="btn-primary py-2 px-8 rounded-full inline-block font-semibold shadow-lg hover:scale-105 transition-transform">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal 
          url={typeof window !== 'undefined' ? `${window.location.origin}/shorts/${shareVideoId}` : `https://streamsphere.arunai.pro/shorts/${shareVideoId}`}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
