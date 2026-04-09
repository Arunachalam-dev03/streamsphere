'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore, useAuthStore } from '@/lib/store';
import { getInitials } from '@/lib/utils';
import { HiMenu, HiOutlineVideoCamera, HiStatusOnline, HiCog, HiOutlineExclamationCircle } from 'react-icons/hi';
import { SiYoutube } from 'react-icons/si';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const sidebarContent = () => (
    <>
      <div className="py-3 flex-1 flex flex-col gap-1">
        <NavLink href="/studio/go-live" icon={<HiStatusOnline />} label="Stream" active={pathname === '/studio/go-live'} onClick={() => setSidebarOpen(false)} />
        <NavLink href="#" icon={<HiOutlineVideoCamera />} label="Webcam" active={false} onClick={() => setSidebarOpen(false)} />
        <NavLink href="#" icon={<svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19 4h-1V3h-2v1H8V3H6v1H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"></path></svg>} label="Manage" active={false} onClick={() => setSidebarOpen(false)} />
      </div>
      <div className="border-t border-white/10 py-3 flex flex-col gap-1">
        <NavLink href="#" icon={<HiCog />} label="Channel-level settings" active={false} onClick={() => setSidebarOpen(false)} />
        <NavLink href="#" icon={<HiOutlineExclamationCircle />} label="Send feedback" active={false} onClick={() => setSidebarOpen(false)} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#282828] text-white">
      {/* Studio Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#282828] border-b border-white/10 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/90 lg:hidden"
          >
            <HiMenu className="w-6 h-6" />
          </button>
          <Link href="/studio/go-live" className="flex items-center gap-1.5 shrink-0">
            <SiYoutube className="w-8 h-8 text-[#FF0000]" />
            <span className="text-[19px] font-semibold tracking-tight text-white/90 mt-0.5">
              Studio
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 border border-white/20 hover:bg-white/10 rounded-full py-1.5 px-3 transition-colors text-sm font-medium">
            <HiOutlineVideoCamera className="w-5 h-5" />
            <span className="hidden sm:inline">CREATE</span>
          </button>
          <button className="w-8 h-8 rounded-full overflow-hidden bg-accent-purple flex items-center justify-center text-xs font-bold shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(user?.displayName || 'U')
            )}
          </button>
        </div>
      </nav>

      {/* Desktop Studio Sidebar */}
      <aside className="fixed top-16 left-0 bottom-0 w-[240px] bg-[#282828] border-r border-white/10 overflow-y-auto hidden lg:flex flex-col z-40">
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
        className={`fixed top-0 left-0 bottom-0 z-[60] w-[240px] overflow-y-auto scrollbar-hide bg-[#282828]
                    transition-transform duration-300 ease-in-out shadow-2xl lg:hidden flex flex-col
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                   `}
      >
        <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/90 -ml-2 mr-2">
            <HiMenu className="w-6 h-6" />
          </button>
          <SiYoutube className="w-8 h-8 text-[#FF0000]" />
          <span className="text-[19px] font-semibold tracking-tight text-white/90 ml-1 mt-0.5">Studio</span>
        </div>
        {sidebarContent()}
      </aside>

      {/* Main Studio Content Area */}
      <main className="pt-16 lg:pl-[240px] min-h-screen bg-[#1F1F1F]">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, label, active, onClick }: { href: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }) {
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
      className={`mx-3 px-3 py-2.5 rounded-lg flex items-center gap-4 transition-colors font-medium text-[15px]
        ${active 
          ? 'bg-white/10 text-white hover:bg-white/20' 
          : 'text-white/70 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      <span className={`text-[22px] ${active ? 'text-[#FF0000]' : 'text-white/60'}`}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
