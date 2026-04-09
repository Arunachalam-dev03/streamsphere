'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import { getInitials } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { videoAPI, notificationAPI } from '@/lib/api';
import {
  HiMenu, HiSearch, HiMicrophone, HiVideoCamera,
  HiBell, HiOutlineBell, HiUser, HiLogout, HiCog, HiOutlineUpload,
  HiSun, HiMoon, HiPlus, HiOutlineVideoCamera, HiOutlineStatusOnline, HiOutlinePencilAlt,
} from 'react-icons/hi';
import Dropdown from '@/components/layout/Dropdown';
import { SiYoutube } from 'react-icons/si';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated, logout } = useAuthStore();
  const { toggleSidebar, toggleSidebarCollapse } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Handle hamburger menu appropriately based on route and screen size
  const handleMenuClick = () => {
    const isFullWidth = pathname?.startsWith('/watch/') || pathname?.startsWith('/auth/') || pathname?.match(/^\/shorts\/[^/]+$/);

    if (window.innerWidth >= 1024 && !isFullWidth) {
      toggleSidebarCollapse();
    } else {
      toggleSidebar();
    }
  };
  const [showSearch, setShowSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => setMounted(true), []);

  // Fetch unread notifications periodically
  useEffect(() => {
    if (!isAuthenticated || !isHydrated) return;
    
    const fetchNotifications = async () => {
      try {
        const { data } = await notificationAPI.getAll();
        const unread = data.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        // fail silently
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isHydrated]);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in (window as any)) && !('SpeechRecognition' in (window as any))) {
      alert('Voice search is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSearchQuery('');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Automatically search if query is not empty
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setSuggestions([]);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Debounced search suggestions
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await videoAPI.searchSuggestions(q.trim());
        setSuggestions(data.suggestions || []);
        setShowSuggestions((data.suggestions || []).length > 0);
        setSelectedSuggestion(-1);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    fetchSuggestions(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-page/80 backdrop-blur-xl z-50 flex items-center px-4 border-b border-border-light/10 dark:border-border-light/5">
      {/* Left section */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={handleMenuClick}
          className="p-2 hover:bg-hover rounded-full transition-colors outline-none focus-visible:ring-0"
          aria-label="Toggle sidebar"
        >
          <HiMenu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/favicon.svg" alt="streamsphere Logo" className="w-8 h-8 drop-shadow-sm" />
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Stream<span className="text-accent-red">Sphere</span>
          </span>
        </Link>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 flex justify-center max-w-2xl mx-auto px-4">
        <form onSubmit={handleSearch} className="hidden md:flex items-center w-full">
          <div className="flex-1 flex relative" ref={suggestionsRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search"
              autoComplete="off"
              className="w-full bg-surface border border-border-light rounded-l-full px-5 py-2 text-sm
                         placeholder-secondary focus:outline-none focus:border-primary-500 transition-colors"
            />
            <button
              type="submit"
              className="px-6 bg-hover hover:bg-surface-300/30 border border-l-0 border-border-light
                         rounded-r-full transition-colors"
            >
              <HiSearch className="w-5 h-5 text-secondary" />
            </button>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-12 mt-1 bg-surface border border-border-light/20 rounded-2xl shadow-2xl z-50 overflow-hidden py-2 animate-scale-in">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors
                      ${idx === selectedSuggestion ? 'bg-hover text-primary' : 'text-primary/80 hover:bg-hover/60'}`}
                  >
                    <HiSearch className="w-4 h-4 text-secondary/60 shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={startVoiceSearch}
            className={`ml-3 p-2.5 rounded-full transition-colors ${isListening
                ? 'bg-accent-red animate-pulse'
                : 'bg-hover hover:bg-surface-300/30'
              }`}
            title={isListening ? 'Listening...' : 'Search with your voice'}
          >
            <HiMicrophone className="w-5 h-5" />
          </button>
        </form>
        {/* Mobile search toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 hover:bg-hover rounded-full transition-colors"
        >
          <HiSearch className="w-5 h-5" />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 h-9">
        {!mounted || !isHydrated ? (
          <div className="w-24 h-full bg-surface-300/20 animate-pulse rounded-full" />
        ) : isAuthenticated ? (
          <>
            {/* Create Dropdown */}
            <Dropdown
              position="bottom-right"
              trigger={
                <div className="flex items-center gap-2 bg-hover hover:bg-surface-300 rounded-full py-1.5 px-3 transition-colors text-sm font-medium mr-1">
                  <HiPlus className="w-5 h-5" />
                  <span className="hidden sm:inline">Create</span>
                </div>
              }
              items={[
                {
                  id: 'upload',
                  label: 'Upload video',
                  icon: <HiOutlineVideoCamera className="w-5 h-5" />,
                  onClick: () => router.push('/upload'),
                },
                {
                  id: 'go-live',
                  label: 'Go live',
                  icon: <HiOutlineStatusOnline className="w-5 h-5" />,
                  onClick: () => router.push('/studio/go-live'),
                },
                {
                  id: 'create-post',
                  label: 'Create post',
                  icon: <HiOutlinePencilAlt className="w-5 h-5" />,
                  onClick: () => {
                    if (user?.username) {
                      router.push(`/@${user.username}?tab=community`);
                    }
                  },
                },
              ]}
            />
            {/* Theme toggle dropdown */}
            {(() => {
              const handleThemeChange = (newTheme: string) => {
                document.documentElement.classList.add('theme-transition');
                setTheme(newTheme);
                setTimeout(() => {
                  document.documentElement.classList.remove('theme-transition');
                }, 350);
                setShowThemeMenu(false);
              };

              const resolvedTheme = theme === 'system' 
                ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : theme;

              return (
                <div className="relative" ref={themeMenuRef}>
                  <button
                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                    className="p-2 hover:bg-hover rounded-full transition-colors"
                    title="Theme"
                  >
                    {resolvedTheme === 'dark' ? (
                      <HiMoon className="w-5 h-5" />
                    ) : (
                      <HiSun className="w-5 h-5 text-yellow-500" />
                    )}
                  </button>
                  {showThemeMenu && (
                    <div className="absolute right-0 top-11 w-44 glass rounded-xl shadow-2xl py-1.5 animate-scale-in z-50">
                      <p className="px-3.5 py-1.5 text-[11px] font-semibold text-secondary uppercase tracking-wider">Appearance</p>
                      {[
                        { key: 'light', label: 'Light', icon: <HiSun className="w-4 h-4 text-yellow-500" /> },
                        { key: 'dark', label: 'Dark', icon: <HiMoon className="w-4 h-4 text-blue-400" /> },
                        { key: 'system', label: 'System', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => handleThemeChange(opt.key)}
                          className={`flex items-center gap-2.5 w-full px-3.5 py-2 text-sm transition-colors
                            ${theme === opt.key ? 'text-primary bg-hover/60 font-medium' : 'text-secondary hover:text-primary hover:bg-hover/40'}`}
                        >
                          {opt.icon}
                          {opt.label}
                          {theme === opt.key && (
                            <svg className="w-3.5 h-3.5 ml-auto text-accent-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            <Link
              href="/notifications"
              className="relative p-2 hover:bg-hover rounded-full transition-colors"
            >
              <HiOutlineBell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-accent-red text-white text-[10px] font-bold px-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-page">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="ml-2 w-8 h-8 rounded-full overflow-hidden bg-accent-purple flex items-center justify-center
                           text-xs font-bold ring-2 ring-transparent hover:ring-primary-500/50 transition-all"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.displayName || 'U')
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-72 glass rounded-xl shadow-2xl py-2 animate-scale-in">
                  <div className="px-4 py-3 border-b border-border-light/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center text-sm font-bold">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          getInitials(user?.displayName || 'U')
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user?.displayName}</p>
                        <p className="text-xs text-secondary">@{user?.username}</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/@${user?.username}`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-sm"
                  >
                    <HiUser className="w-5 h-5 text-white/60" />
                    Your Channel
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-sm"
                  >
                    <HiCog className="w-5 h-5 text-white/60" />
                    Settings
                  </Link>
                  <div className="border-t border-border-light/10 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        router.push('/');
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-sm w-full text-left"
                    >
                      <HiLogout className="w-5 h-5 text-white/60" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link href="/auth/login" className="btn-primary flex items-center gap-2 h-full">
            <HiUser className="w-4 h-4" />
            Sign in
          </Link>
        )}
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <div className="absolute top-14 left-0 right-0 bg-page p-4 md:hidden border-b border-border-light/5 animate-slide-down">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              autoFocus
              className="flex-1 bg-surface border border-border-light rounded-full px-4 py-2 text-sm
                         placeholder-secondary focus:outline-none focus:border-primary-500"
            />
            <button type="submit" className="p-2 bg-hover rounded-full">
              <HiSearch className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}
