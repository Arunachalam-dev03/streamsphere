'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore, useAuthStore } from '@/lib/store';
import { getInitials } from '@/lib/utils';
import { 
  HiMenu, HiSearch, HiOutlineVideoCamera, 
  HiViewGrid, HiFilm, HiChartBar, HiChatAlt2, 
  HiTranslate, HiCurrencyDollar, HiColorSwatch, HiMusicNote, HiCog, HiOutlineExclamationCircle 
} from 'react-icons/hi';
import { SiYoutube } from 'react-icons/si';

export default function MainStudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  
  // This layout wrapper applies to everything in /studio EXCEPT /studio/go-live
  // We don't want nesting of the Studio Navbars, but Next.js will nest whatever is in /studio/layout.tsx
  // over /studio/go-live/layout.tsx unless we conditionally render or we rely on the fact that layout.tsx
  // is inherited. Wait! The best practice in App Router is to use route groups to strictly isolate.
  // Since we haven't used a route group, we will conditionally render the Main Studio UI ONLY if we are NOT in /go-live
  
  const isGoLive = pathname?.startsWith('/studio/go-live');

  if (isGoLive) {
    // We just pass through children. The /studio/go-live/layout.tsx will handle the UI directly.
    return <>{children}</>;
  }

  const sidebarContent = () => (
    <>
      <div className="flex flex-col items-center py-6 border-b border-border-light">
        <div className="w-[112px] h-[112px] bg-accent-purple rounded-full overflow-hidden mb-4 relative drop-shadow-sm">
            {user?.avatar ? (
              <img src={user.avatar} alt="Channel Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-white font-bold">
                {getInitials(user?.displayName || 'U')}
              </div>
            )}
        </div>
        <h3 className="font-semibold text-[15px] px-4 text-center truncate w-full">Your channel</h3>
        <p className="text-sm text-secondary px-4 text-center truncate w-full">{user?.displayName || 'Creator'}</p>
      </div>

      <div className="py-3 flex-1 flex flex-col gap-1 w-full">
        <StudioNavLink href="/studio" icon={<HiViewGrid />} label="Dashboard" active={pathname === '/studio'} onClick={() => setSidebarOpen(false)} />
        <StudioNavLink href="/studio/content" icon={<HiFilm />} label="Content" active={pathname?.startsWith('/studio/content')} onClick={() => setSidebarOpen(false)} />
        <StudioNavLink href="/studio/analytics" icon={<HiChartBar />} label="Analytics" active={pathname?.startsWith('/studio/analytics')} onClick={() => setSidebarOpen(false)} />
        <StudioNavLink href="/studio/comments" icon={<HiChatAlt2 />} label="Comments" active={pathname?.startsWith('/studio/comments')} onClick={() => setSidebarOpen(false)} />
        <StudioNavLink href="/studio/subtitles" icon={<HiTranslate />} label="Subtitles" active={pathname?.startsWith('/studio/subtitles')} onClick={() => setSidebarOpen(false)} />
        <StudioNavLink href="/studio/copyright" icon={<span className="font-serif italic text-lg px-0.5">©</span>} label="Copyright" active={pathname?.startsWith('/studio/copyright')} onClick={() => setSidebarOpen(false)} />
        <StudioNavLink href="/studio/earn" icon={<HiCurrencyDollar />} label="Earn" active={pathname?.startsWith('/studio/earn')} onClick={() => setSidebarOpen(false)} />
        <StudioNavLink href="/studio/customization" icon={<HiColorSwatch />} label="Customisation" active={pathname?.startsWith('/studio/customization')} onClick={() => setSidebarOpen(false)} />
        <StudioNavLink href="/studio/audio-library" icon={<HiMusicNote />} label="Audio Library" active={pathname?.startsWith('/studio/audio-library')} onClick={() => setSidebarOpen(false)} />
      </div>

      <div className="border-t border-border-light py-3 flex flex-col gap-1 w-full">
        <StudioNavLink href="/studio/settings" icon={<HiCog />} label="Settings" active={pathname?.startsWith('/studio/settings')} onClick={() => setSidebarOpen(false)} />
        <StudioNavLink href="/studio/feedback" icon={<HiOutlineExclamationCircle />} label="Send feedback" active={pathname?.startsWith('/studio/feedback')} onClick={() => setSidebarOpen(false)} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-page text-primary flex flex-col">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-page border-b border-border-light z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4 min-w-[150px] sm:min-w-[240px]">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-hover rounded-full transition-colors text-primary outline-none focus-visible:ring-0 lg:hidden"
          >
            <HiMenu className="w-6 h-6" />
          </button>
          <Link href="/studio" className="flex items-center gap-1.5 shrink-0 outline-none">
            <SiYoutube className="w-8 h-8 text-[#FF0000]" />
            <span className="text-[20px] font-semibold tracking-tighter text-primary mt-0.5">
              Studio
            </span>
          </Link>
        </div>
        
        <div className="flex-1 max-w-2xl px-4 flex justify-center">
          <div className="w-full max-w-md relative hidden sm:block">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
            <input 
              type="text" 
              placeholder="Search across your channel" 
              className="w-full bg-surface border border-border-light rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-blue transition-colors placeholder-secondary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link href="/studio/go-live" className="flex items-center gap-2 border border-border-light hover:bg-hover rounded-full py-1.5 px-3 transition-colors text-sm font-medium">
            <HiOutlineVideoCamera className="w-5 h-5" />
            <span className="hidden sm:inline">CREATE</span>
          </Link>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-purple flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(user?.displayName || 'U')
            )}
          </div>
        </div>
      </nav>

      {/* Main Studio Sidebar & Content */}
      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar */}
        <aside className="fixed top-16 left-0 bottom-0 w-[240px] bg-page border-r border-border-light overflow-y-auto hidden lg:flex flex-col z-40 custom-scrollbar hover-scrollbar">
          {sidebarContent()}
        </aside>

        {/* Mobile Sidebar Overlay Backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ease-in-out lg:hidden
                      ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Mobile Sidebar Drawer */}
        <aside
          className={`fixed top-0 left-0 bottom-0 z-[60] w-[240px] overflow-y-auto scrollbar-hide bg-page
                      transition-transform duration-300 ease-in-out shadow-2xl lg:hidden flex flex-col
                      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                     `}
        >
          <div className="h-16 flex items-center px-4 border-b border-border-light shrink-0">
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-hover rounded-full text-primary -ml-2 mr-2">
              <HiMenu className="w-6 h-6" />
            </button>
            <SiYoutube className="w-8 h-8 text-[#FF0000]" />
            <span className="text-[20px] font-semibold tracking-tighter text-primary ml-1 mt-0.5">Studio</span>
          </div>
          {sidebarContent()}
        </aside>

        {/* Dynamic Page Content */}
        <main className="flex-1 lg:pl-[240px] bg-page min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

function StudioNavLink({ href, icon, label, active, onClick }: { href: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (href === '#') {
          e.preventDefault();
        } else if (onClick) {
          onClick();
        }
      }}
      className={`mx-3 px-3 py-2.5 flex items-center gap-4 transition-colors text-[14px]
        ${active 
          ? 'bg-hover text-accent-red font-medium border-l-4 border-accent-red rounded-r-lg pl-2' 
          : 'text-primary hover:bg-hover border-l-4 border-transparent hover:rounded-r-lg pl-2'
        }
      `}
    >
      <span className={`text-[20px] shrink-0 ${active ? 'text-accent-red' : 'text-secondary'}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
