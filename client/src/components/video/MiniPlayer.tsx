'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { HiX, HiPlay, HiPause, HiArrowsExpand } from 'react-icons/hi';
import { useUIStore } from '@/lib/store';

export default function MiniPlayer() {
  const { miniPlayer, closeMiniPlayer } = useUIStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (videoRef.current && miniPlayer) {
      videoRef.current.play().catch(() => {});
    }
  }, [miniPlayer]);

  if (!miniPlayer) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true); }
    else { videoRef.current.pause(); setPlaying(false); }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div
      className="fixed z-[100] shadow-2xl rounded-xl overflow-hidden border border-border-light/10 bg-black group"
      style={{ bottom: position.y, right: position.x, width: 360, cursor: dragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <video
        ref={videoRef}
        src={miniPlayer.src}
        className="w-full aspect-video object-cover"
        autoPlay
        onClick={togglePlay}
      />

      {/* Overlay controls */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
        <button onClick={togglePlay} className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
          {playing ? <HiPause className="w-5 h-5 text-white" /> : <HiPlay className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white truncate flex-1 mx-2">{miniPlayer.title}</p>
        <div className="flex gap-1">
          <Link
            href={`/watch/${miniPlayer.videoId}`}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            onClick={closeMiniPlayer}
          >
            <HiArrowsExpand className="w-3.5 h-3.5 text-white" />
          </Link>
          <button onClick={closeMiniPlayer} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <HiX className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
