'use client';

import React from 'react';
import Link from 'next/link';
import { formatViews, getInitials } from '@/lib/utils';

interface LiveStreamCardProps {
  stream: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    viewerCount: number;
    status: string;
    startedAt: string | null;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatar: string | null;
    };
  };
}

export default function LiveStreamCard({ stream }: LiveStreamCardProps) {
  return (
    <div className="animate-fade-in group relative">
      <Link href={`/live/${stream.id}`}>
        {/* Thumbnail */}
        <div className="relative overflow-hidden sm:rounded-xl rounded-none aspect-video">
          {stream.thumbnailUrl ? (
            <img
              src={stream.thumbnailUrl}
              alt={stream.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-red-900/60 to-rose-900/80 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
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

          {/* LIVE badge — pulsing red */}
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-red-600 rounded px-2 py-0.5 shadow-lg shadow-red-600/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-[11px] text-white font-bold tracking-wide">LIVE</span>
          </div>

          {/* Viewer count badge */}
          <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
            <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            <span className="text-[11px] text-white font-medium">{formatViews(stream.viewerCount)}</span>
          </div>

          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-xl ring-2 ring-red-500/30 group-hover:ring-red-500/50 transition-all duration-300 pointer-events-none" />
        </div>
      </Link>

      {/* Card info */}
      <div className="flex gap-3 mt-3 px-3 sm:px-0">
        {/* Avatar */}
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

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <Link href={`/live/${stream.id}`}>
            <h3 className="text-sm font-medium line-clamp-2 leading-5 text-primary group-hover:text-red-500 transition-colors">
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

// Skeleton loader for LiveStreamCard
export function LiveStreamCardSkeleton() {
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
