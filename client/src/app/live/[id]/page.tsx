'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Hls from 'hls.js';
import { liveAPI, channelAPI } from '@/lib/api';
import { formatViews, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LiveWatchPage() {
  const params = useParams();
  const streamId = params.id as string;
  const { isAuthenticated } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: number; user: string; text: string }[]>([
    { id: 1, user: 'StreamSphere', text: 'Welcome to the live chat! 🎉' },
    { id: 2, user: 'StreamSphere', text: 'Be kind and respectful to everyone.' },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    loadStream();
    const interval = setInterval(loadStream, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [streamId]);

  useEffect(() => {
    if (!stream?.hlsUrl || !videoRef.current) return;

    const video = videoRef.current;
    const hlsUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${stream.hlsUrl}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDuration: 3,
        liveMaxLatencyDuration: 10,
        liveDurationInfinity: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [stream?.hlsUrl]);

  const loadStream = async () => {
    try {
      const { data } = await liveAPI.getById(streamId);
      setStream(data);
    } catch (error: any) {
      console.error('Failed to load stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to subscribe');
      return;
    }
    if (!stream) return;
    try {
      await channelAPI.subscribe(stream.user.id);
      setIsSubscribed(!isSubscribed);
      toast.success(isSubscribed ? 'Unsubscribed' : 'Subscribed!');
    } catch {
      toast.error('Failed to subscribe');
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      user: 'You',
      text: chatInput.trim(),
    }]);
    setChatInput('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <span className="text-secondary text-sm">Loading stream...</span>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📡</div>
          <h2 className="text-2xl font-bold mb-2">Stream Not Found</h2>
          <p className="text-secondary mb-4">This stream may have ended or doesn&apos;t exist.</p>
          <Link href="/live" className="btn-primary">Browse Live Streams</Link>
        </div>
      </div>
    );
  }

  const isLive = stream.status === 'LIVE';
  const isEnded = stream.status === 'ENDED';

  return (
    <div className="min-h-screen">
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 lg:p-4">
        {/* Video Player */}
        <div className="flex-1 min-w-0">
          <div className="relative aspect-video bg-black rounded-none lg:rounded-xl overflow-hidden">
            {isLive && stream.hlsUrl ? (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                controls
              />
            ) : isEnded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-white text-xl font-bold mb-1">Stream Ended</h3>
                <p className="text-white/60 text-sm">This live stream has ended</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                  <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-white text-xl font-bold mb-1">Starting Soon</h3>
                <p className="text-white/60 text-sm">The streamer is setting up...</p>
              </div>
            )}

            {/* Live indicator overlay */}
            {isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-red-600 rounded px-2.5 py-1 shadow-lg shadow-red-600/40">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <span className="text-xs text-white font-bold">LIVE</span>
                </div>
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                  <svg className="w-3.5 h-3.5 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                  <span className="text-xs text-white/90 font-medium">{formatViews(stream.viewerCount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="px-4 lg:px-0 mt-3">
            <h1 className="text-lg font-bold text-primary leading-snug">{stream.title}</h1>

            <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
              {/* Channel info */}
              <div className="flex items-center gap-3">
                <Link href={`/@${stream.user.username}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden
                                  bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-sm">
                    {stream.user.avatar ? (
                      <img src={stream.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="select-none">{getInitials(stream.user.displayName)}</span>
                    )}
                  </div>
                </Link>
                <div>
                  <Link href={`/@${stream.user.username}`}>
                    <p className="text-sm font-medium text-primary hover:text-accent-red transition-colors">
                      {stream.user.displayName}
                    </p>
                  </Link>
                  {stream.user.subscriberCount !== undefined && (
                    <p className="text-xs text-secondary">
                      {formatViews(stream.user.subscriberCount)} subscribers
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSubscribe}
                  className={`ml-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSubscribed
                      ? 'bg-hover text-secondary hover:bg-surface-300'
                      : 'bg-white text-black hover:bg-gray-200 dark:bg-white dark:text-black'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    {formatViews(stream.viewerCount)} watching now
                  </span>
                )}
                {isEnded && (
                  <span className="text-xs text-secondary bg-hover px-3 py-1.5 rounded-full font-medium">
                    Stream ended
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {stream.description && (
              <div className="mt-4 p-3 bg-hover rounded-xl">
                <p className="text-sm text-secondary whitespace-pre-line">{stream.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Chat Panel */}
        <div className="w-full lg:w-96 shrink-0 mt-4 lg:mt-0">
          <div className="bg-surface-100 rounded-none lg:rounded-xl border border-border-light/10 flex flex-col h-[400px] lg:h-[calc(100vh-7rem)]">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-border-light/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Live Chat</h3>
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-hide">
              {!isLive && !isEnded && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-secondary text-center">Chat will be available when the stream goes live</p>
                </div>
              )}
              {isEnded && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-secondary text-center">Chat has ended with this stream</p>
                </div>
              )}
              {isLive && chatMessages.map((msg) => (
                <div key={msg.id} className="flex gap-2 py-0.5">
                  <span className="text-xs font-semibold text-accent-red shrink-0">{msg.user}</span>
                  <span className="text-xs text-primary break-words">{msg.text}</span>
                </div>
              ))}
            </div>

            {/* Chat input */}
            {isLive && (
              <form onSubmit={handleSendChat} className="px-3 py-2 border-t border-border-light/10">
                {isAuthenticated ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Say something..."
                      className="flex-1 bg-hover text-primary text-sm px-3 py-2 rounded-full border-none outline-none focus:ring-2 focus:ring-red-500/30 placeholder:text-secondary"
                      maxLength={200}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-secondary text-center py-2">
                    <Link href="/auth/login" className="text-red-400 hover:underline">Sign in</Link> to chat
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
