'use client';

import React, { useEffect, useState } from 'react';
import { HiX } from 'react-icons/hi';

const SHORTCUTS = [
  { category: 'Playback', items: [
    { key: 'K / Space', desc: 'Play / Pause' },
    { key: 'J', desc: 'Rewind 10 seconds' },
    { key: 'L', desc: 'Forward 10 seconds' },
    { key: '←', desc: 'Rewind 5 seconds' },
    { key: '→', desc: 'Forward 5 seconds' },
    { key: '.', desc: 'Next frame (paused)' },
    { key: ',', desc: 'Previous frame (paused)' },
    { key: '0-9', desc: 'Seek to 0%-90%' },
    { key: 'Home', desc: 'Go to beginning' },
    { key: 'End', desc: 'Go to end' },
  ]},
  { category: 'Audio & Display', items: [
    { key: 'M', desc: 'Mute / Unmute' },
    { key: '↑', desc: 'Increase volume 5%' },
    { key: '↓', desc: 'Decrease volume 5%' },
    { key: 'F', desc: 'Toggle fullscreen' },
    { key: 'T', desc: 'Toggle theater mode' },
    { key: 'I', desc: 'Toggle mini player' },
    { key: 'C', desc: 'Toggle captions' },
  ]},
  { category: 'Speed', items: [
    { key: 'Shift + >', desc: 'Increase playback speed' },
    { key: 'Shift + <', desc: 'Decrease playback speed' },
  ]},
  { category: 'Navigation', items: [
    { key: 'Shift + N', desc: 'Next video' },
    { key: 'Shift + P', desc: 'Previous video' },
    { key: '/', desc: 'Focus search box' },
    { key: 'Esc', desc: 'Close overlay / Exit fullscreen' },
  ]},
];

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        // Don't trigger if typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}>
      <div className="bg-surface rounded-2xl w-full max-w-2xl mx-4 shadow-2xl animate-scale-in max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light/10">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">⌨️</span> Keyboard Shortcuts
          </h3>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-hover rounded-full transition-colors">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-70px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHORTCUTS.map((group) => (
              <div key={group.category}>
                <h4 className="text-sm font-semibold text-accent-red mb-3 uppercase tracking-wider">{group.category}</h4>
                <div className="space-y-1.5">
                  {group.items.map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-secondary">{shortcut.desc}</span>
                      <kbd className="px-2.5 py-1 bg-surface-200 text-primary text-xs font-mono rounded-lg border border-border-light/20 shadow-sm min-w-[40px] text-center">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-secondary/50 mt-5 text-center">Press <kbd className="px-1.5 py-0.5 bg-surface-200 rounded text-xs font-mono">?</kbd> to toggle this overlay</p>
        </div>
      </div>
    </div>
  );
}
