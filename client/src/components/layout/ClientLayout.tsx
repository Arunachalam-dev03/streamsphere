'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MiniPlayer from '../video/MiniPlayer';
import KeyboardShortcuts from '../modals/KeyboardShortcuts';
import { useAuthStore, useUIStore } from '@/lib/store';
import { ThemeProvider } from '../providers/ThemeProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hydrate } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  // Read sidebarOpen directly from store to avoid subscription loop
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Full-width pages (no sidebar)
  const isFullWidth = pathname?.startsWith('/watch/') || pathname?.startsWith('/auth/');

  // Track previous pathname to only run sidebar logic on route changes or first mount
  const prevPathname = useRef(pathname);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only run on first mount or when the pathname actually changes
    if (!isFirstMount.current && prevPathname.current === pathname) return;
    
    isFirstMount.current = false;
    prevPathname.current = pathname;

    const isDesktop = window.innerWidth >= 1024;
    const store = useUIStore.getState();

    if (isFullWidth) {
      // Close sidebar on full-width pages only if it's currently open
      if (store.sidebarOpen) {
        store.setSidebarOpen(false);
      }
    } else if (isDesktop) {
      // Re-open sidebar on desktop for normal pages only if it's currently closed
      if (!store.sidebarOpen) {
        store.setSidebarOpen(true);
      }
    } else {
      // Close sidebar on mobile for all navigations
      if (store.sidebarOpen) {
        store.setSidebarOpen(false);
      }
    }
  }, [pathname, isFullWidth]);

  // Hide main navigation on studio routes
  const isStudioRoute = pathname?.startsWith('/studio');

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <Toaster
        position="bottom-left"
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          className: 'bg-surface text-primary border border-border-light/10 rounded-xl text-sm',
          success: { iconTheme: { primary: '#00cc66', secondary: '#fff' } },
          error: { iconTheme: { primary: 'var(--accent-red)', secondary: '#fff' } },
        }}
      />
      {!isStudioRoute && <Navbar />}
      {!isStudioRoute && <Sidebar isOverlayMode={!!isFullWidth} />}
      <main
        className={`min-h-screen transition-all duration-300
          ${!isStudioRoute ? 'pt-14' : ''}
          ${!isStudioRoute && !isFullWidth && sidebarOpen
            ? sidebarCollapsed
              ? 'lg:pl-[72px]'
              : 'lg:pl-60'
            : ''
          }
        `}
      >
        {children}
      </main>
      <MiniPlayer />
      <KeyboardShortcuts />
    </ThemeProvider>
  );
}
