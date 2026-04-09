'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore, useAuthStore } from '@/lib/store';
import {
  HiHome, HiClock,
  HiThumbUp, HiFire, HiMusicNote,
  HiDesktopComputer, HiNewspaper, HiSparkles, HiChartBar,
  HiStatusOnline, HiOutlineUserCircle, HiShieldCheck,
} from 'react-icons/hi';
import { MdSubscriptions, MdHistory, MdPlaylistPlay, MdVideocam } from 'react-icons/md';
import { SiYoutube } from 'react-icons/si';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  auth?: boolean;
}

const mainItems: NavItem[] = [
  { icon: HiHome, label: 'Home', href: '/' },
  { icon: SiYoutube, label: 'Shorts', href: '/shorts' },
  { icon: HiStatusOnline, label: 'Live', href: '/live' },
  { icon: MdSubscriptions, label: 'Subscriptions', href: '/subscriptions', auth: true },
];

const youItems: NavItem[] = [
  { icon: MdHistory, label: 'History', href: '/history', auth: true },
  { icon: MdPlaylistPlay, label: 'Playlists', href: '/playlists', auth: true },
  { icon: HiThumbUp, label: 'Liked Videos', href: '/liked', auth: true },
  { icon: HiClock, label: 'Watch Later', href: '/watch-later', auth: true },
  { icon: HiChartBar, label: 'Studio', href: '/studio', auth: true },
  { icon: MdVideocam, label: 'Go Live', href: '/studio/go-live', auth: true },
];

const exploreItems: NavItem[] = [
  { icon: HiFire, label: 'Trending', href: '/trending' },
  { icon: HiMusicNote, label: 'Music', href: '/search?q=music' },
  { icon: HiDesktopComputer, label: 'Gaming', href: '/search?q=gaming' },
  { icon: HiNewspaper, label: 'News', href: '/search?q=news' },
  { icon: HiSparkles, label: 'Learning', href: '/search?q=education' },
];

interface SidebarProps {
  isOverlayMode?: boolean;
}

export default function Sidebar({ isOverlayMode = false }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed } = useUIStore();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname === href;

  const renderItem = (item: NavItem) => {
    if (item.auth && (!mounted || !isHydrated || !isAuthenticated)) return null;

    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        className={`flex items-center gap-5 px-3 py-2 rounded-lg transition-all duration-200 group text-sm
          ${isActive(item.href)
            ? 'bg-hover font-medium text-primary'
            : 'hover:bg-hover text-primary'
          }
          ${sidebarCollapsed ? 'flex-col gap-1.5 px-0 py-4 text-[10px] w-full rounded-none hover:bg-hover' : ''}
        `}
      >
        <item.icon
          className={`shrink-0 w-6 h-6 transition-colors text-primary
          ${isActive(item.href) ? '' : 'opacity-90 group-hover:opacity-100'}
        `}
        />
        <span className={sidebarCollapsed ? 'text-center w-full px-0.5 text-[10px] sm:text-[11px] leading-tight tracking-tighter block break-words' : ''}>
          {item.label}
        </span>
      </Link>
    );
  };

  const sidebarContent = (collapsed: boolean) => (
    <div className={`py-2 ${collapsed ? 'px-0' : 'px-2.5'}`}>
      {/* Main Navigation */}
      <div className="space-y-0.5">
        {mainItems.map(renderItem)}
        {collapsed && mounted && isHydrated && isAuthenticated && renderItem({ icon: HiOutlineUserCircle, label: 'You', href: '/history', auth: true })}
      </div>

      {!collapsed && (
        <>
          {/* You Section */}
          {mounted && isHydrated && isAuthenticated && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <h3 className="px-3 mb-1.5 text-base font-medium flex items-center gap-1 text-primary">
                You <span className="text-xs text-secondary">›</span>
              </h3>
              <div className="space-y-0.5">
                {youItems.map(renderItem)}
                {user?.role === 'ADMIN' && renderItem({ icon: HiShieldCheck, label: 'Admin', href: '/admin', auth: true })}
              </div>
            </div>
          )}

          {/* Explore */}
          <div className="mt-3 pt-3 border-t border-border-light">
            <h3 className="px-3 mb-1.5 text-base font-medium flex items-center gap-1 text-primary">
              Explore <span className="text-xs text-secondary">›</span>
            </h3>
            <div className="space-y-0.5">
              {exploreItems.map(renderItem)}
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-4 pt-3 border-t border-border-light px-3 pb-6">
            <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3">
              {[
                { label: 'About', href: '/about' },
                { label: 'Press', href: '/press' },
                { label: 'Copyright', href: '/copyright' },
                { label: 'Contact us', href: '/contact' },
                { label: 'Creator', href: '/creator' },
                { label: 'Advertise', href: '/advertise' },
                { label: 'Developers', href: '/developers' },
              ].map(t => (
                <Link key={t.href} href={t.href} className="text-xs text-secondary hover:text-primary transition-colors">{t.label}</Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 mb-4">
              {[
                { label: 'Terms', href: '/terms' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Policy & Safety', href: '/policy-safety' },
                { label: 'How StreamSphere works', href: '/how-it-works' },
                { label: 'Test new features', href: '/new-features' },
              ].map(t => (
                <Link key={t.href} href={t.href} className="text-xs text-secondary hover:text-primary transition-colors">{t.label}</Link>
              ))}
            </div>
            <p className="text-[11px] text-secondary mt-1 opacity-70">
              © 2026 StreamSphere
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar — Hidden in overlay mode */}
      {!isOverlayMode && (
        <aside
          className={`fixed left-0 top-14 bottom-0 z-40 overflow-y-auto scrollbar-hide bg-page
                      transition-all duration-300 ease-in-out
                      ${sidebarCollapsed ? 'w-[72px]' : 'w-60'}
                      ${sidebarOpen || !mounted ? 'translate-x-0' : '-translate-x-full'}
                      max-lg:hidden
                     `}
        >
          {sidebarContent(sidebarCollapsed)}
        </aside>
      )}

      {/* Overlay Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ease-in-out
                    ${mounted && sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} 
                    ${isOverlayMode ? '' : 'lg:hidden'}`}
        onClick={() => useUIStore.getState().setSidebarOpen(false)}
      />

      {/* Drawer Sidebar (Mobile or Overlay) */}
      <aside
        className={`fixed left-0 top-14 bottom-0 z-40 w-60 overflow-y-auto scrollbar-hide bg-page
                    transition-transform duration-300 ease-in-out shadow-2xl ${isOverlayMode ? '' : 'lg:hidden'}
                    ${!mounted ? '-translate-x-full' : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')}
                   `}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}
