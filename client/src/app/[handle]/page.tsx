'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import VideoCard, { VideoCardSkeleton } from '@/components/video/VideoCard';
import { channelAPI, communityAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatSubscribers, formatViews, getInitials, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  HiBell, HiCamera, HiPencil, HiCheck, HiX,
  HiSearch, HiDotsHorizontal, HiShare, HiFlag,
  HiGlobe, HiCalendar, HiEye, HiChartBar,
  HiMail, HiPlus, HiTrash, HiLink, HiExternalLink,
} from 'react-icons/hi';
import { SiYoutube, SiInstagram, SiFacebook, SiX, SiTiktok, SiWhatsapp, SiGithub, SiDiscord } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa';
import Link from 'next/link';

// Social platform config
const SOCIAL_PLATFORMS: Record<string, { label: string; icon: React.ElementType; color: string; placeholder: string }> = {
  instagram: { label: 'Instagram', icon: SiInstagram, color: 'text-pink-500', placeholder: 'https://instagram.com/username' },
  x: { label: 'X (Twitter)', icon: SiX, color: 'text-primary', placeholder: 'https://x.com/username' },
  facebook: { label: 'Facebook', icon: SiFacebook, color: 'text-blue-600', placeholder: 'https://facebook.com/username' },
  youtube: { label: 'YouTube', icon: SiYoutube, color: 'text-red-600', placeholder: 'https://youtube.com/@handle' },
  linkedin: { label: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-500', placeholder: 'https://linkedin.com/in/username' },
  tiktok: { label: 'TikTok', icon: SiTiktok, color: 'text-primary', placeholder: 'https://tiktok.com/@username' },
  whatsapp: { label: 'WhatsApp', icon: SiWhatsapp, color: 'text-green-500', placeholder: 'https://wa.me/number' },
  github: { label: 'GitHub', icon: SiGithub, color: 'text-primary', placeholder: 'https://github.com/username' },
  discord: { label: 'Discord', icon: SiDiscord, color: 'text-indigo-500', placeholder: 'https://discord.gg/invite' },
  website: { label: 'Website', icon: HiGlobe, color: 'text-accent-red', placeholder: 'https://example.com' },
};

export default function ChannelPage() {
  const params = useParams();
  const handle = params?.handle as string || '';
  const usernameParam = decodeURIComponent(handle).replace('@', '');

  const { user, isAuthenticated } = useAuthStore();
  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [showBioExpanded, setShowBioExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSocialLinks, setEditSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>([]);
  const [showPollInput, setShowPollInput] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.username === usernameParam;

  useEffect(() => {
    if (usernameParam) {
      loadChannel();
    }
  }, [usernameParam]);

  // Load videos + posts ONLY AFTER channel obj is fetched because their GET endpoints currently rely on channelId
  useEffect(() => {
    if (channel?.id) {
      loadVideos(channel.id);
      if (activeTab === 'community') {
        loadCommunityPosts(channel.id);
      }
    }
  }, [channel?.id]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadChannel = async () => {
    try {
      const { data } = await channelAPI.getByUsername(usernameParam);
      setChannel(data);
      setEditDisplayName(data.displayName);
      setEditBio(data.bio || '');
      setEditLocation(data.location || '');
      const links = data.socialLinks || [];
      setEditSocialLinks(Array.isArray(links) ? links : []);
    } catch (error) {
      console.error('Failed to load channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async (id: string) => {
    try {
      const { data } = await channelAPI.getVideos(id);
      setVideos(data.videos);
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  };

  const loadCommunityPosts = async (id: string) => {
    try {
      const { data } = await communityAPI.getByChannel(id);
      setCommunityPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load community posts:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    try {
      const payload: any = { text: newPostText.trim() };
      if (showPollInput && pollOptions.filter(o => o.trim()).length >= 2) {
        payload.pollOptions = pollOptions.filter(o => o.trim());
      }
      const { data } = await communityAPI.create(payload);
      setCommunityPosts((prev) => [data, ...prev]);
      setNewPostText('');
      setPollOptions([]);
      setShowPollInput(false);
      toast.success('Post published!');
    } catch {
      toast.error('Failed to create post');
    }
  };

  const handlePollVote = async (pollId: string, optionId: string) => {
    try {
      const { data } = await communityAPI.vote(pollId, optionId);
      setCommunityPosts((prev) => prev.map((p: any) => {
        if (p.poll?.id === pollId) {
          return { ...p, poll: data };
        }
        return p;
      }));
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) { toast.error('Sign in to subscribe'); return; }
    try {
      await channelAPI.subscribe(channel?.id);
      loadChannel();
    } catch { toast.error('Failed to subscribe'); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Avatar must be under 10MB'); return; }
    try {
      setUploadingAvatar(true);
      const { data } = await channelAPI.uploadAvatar(file);
      setChannel((prev: any) => ({ ...prev, avatar: data.avatar }));
      toast.success('Avatar updated!');
    } catch { toast.error('Failed to upload avatar'); }
    finally { setUploadingAvatar(false); }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Banner must be under 10MB'); return; }
    try {
      setUploadingBanner(true);
      const { data } = await channelAPI.uploadBanner(file);
      setChannel((prev: any) => ({ ...prev, banner: data.banner }));
      toast.success('Banner updated!');
    } catch { toast.error('Failed to upload banner'); }
    finally { setUploadingBanner(false); }
  };

  const handleSaveProfile = async () => {
    try {
      const validLinks = editSocialLinks.filter(l => l.platform && l.url.trim());
      const { data } = await channelAPI.updateProfile({
        displayName: editDisplayName,
        bio: editBio,
        location: editLocation,
        socialLinks: validLinks,
      });
      setChannel((prev: any) => ({ ...prev, ...data }));
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
  };

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: channel?.displayName, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Channel link copied!');
    }
  }, [channel]);

  const handleReport = () => {
    setShowMoreMenu(false);
    toast.success('Report submitted. Thank you!');
  };

  const addSocialLink = () => {
    setEditSocialLinks(prev => [...prev, { platform: '', url: '' }]);
  };

  const removeSocialLink = (idx: number) => {
    setEditSocialLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSocialLink = (idx: number, field: 'platform' | 'url', value: string) => {
    setEditSocialLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  // Sorting helpers
  const getSortedVideos = (vids: any[], short?: boolean) => {
    let filtered = short !== undefined
      ? vids.filter(v => short ? (v.isShort || (v.duration > 0 && v.duration <= 180)) : !(v.isShort || (v.duration > 0 && v.duration <= 180)))
      : vids;
    if (searchQuery.trim()) {
      filtered = filtered.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    switch (sortBy) {
      case 'popular': return [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'oldest': return [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      default: return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const socialLinks: { platform: string; url: string }[] = Array.isArray(channel?.socialLinks) ? channel.socialLinks : [];
  const tabs = ['Home', 'Videos', 'Shorts', 'Community', 'About'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-accent-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-7xl mb-4">👤</div>
        <h2 className="text-2xl font-bold mb-2">Channel Not Found</h2>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Hidden file inputs */}
      <input type="file" ref={avatarInputRef} accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} />
      <input type="file" ref={bannerInputRef} accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleBannerUpload} />

      {/* ===== BANNER ===== */}
      <div className="w-full max-w-[1284px] mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="w-full h-[80px] sm:h-[140px] md:h-[180px] lg:h-[200px] rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-r from-surface-300 via-surface-200 to-surface-300 relative group/banner">
          {channel.banner ? (
            <img src={channel.banner} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600/40 via-purple-600/30 to-pink-600/40" />
          )}
          {isOwner && (
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5
                         bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg
                         text-white text-xs font-medium transition-all
                         opacity-0 group-hover/banner:opacity-100"
            >
              {uploadingBanner ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiCamera className="w-3.5 h-3.5" />
              )}
              {uploadingBanner ? 'Uploading...' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* ===== CHANNEL INFO ===== */}
      <div className="max-w-[1284px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 py-4">

          {/* Avatar */}
          <div className="relative group/avatar shrink-0 -mt-6 sm:-mt-4">
            <div className="w-[72px] h-[72px] sm:w-[128px] sm:h-[128px] rounded-full bg-accent-purple flex items-center justify-center text-2xl sm:text-4xl font-bold text-white overflow-hidden ring-4 ring-page">
              {channel.avatar ? (
                <img src={channel.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(channel.displayName)
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full
                           bg-black/50 opacity-0 group-hover/avatar:opacity-100
                           transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HiCamera className="w-6 h-6 text-white" />
                )}
              </button>
            )}
          </div>

          {/* Channel Details */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              /* ===== EDITING MODE ===== */
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="text-xs font-medium text-secondary mb-1 block">Display Name</label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="input-field text-lg font-bold w-full"
                    placeholder="Display Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary mb-1 block">Bio / Description</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="input-field text-sm w-full resize-none"
                    placeholder="Tell viewers about your channel..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary mb-1 block">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="input-field text-sm w-full"
                    placeholder="e.g. India, New York, etc."
                  />
                </div>

                {/* Social Links Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-secondary">Social Links</label>
                    <button
                      onClick={addSocialLink}
                      className="text-xs text-accent-red hover:text-accent-red/80 font-medium flex items-center gap-1"
                    >
                      <HiPlus className="w-3.5 h-3.5" /> Add link
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {editSocialLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={link.platform}
                          onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                          className="bg-surface-200 text-primary text-sm rounded-lg px-2.5 py-2 border-none focus:outline-none focus:ring-1 focus:ring-accent-red/50 w-36 shrink-0"
                        >
                          <option value="">Platform</option>
                          {Object.entries(SOCIAL_PLATFORMS).map(([key, p]) => (
                            <option key={key} value={key}>{p.label}</option>
                          ))}
                        </select>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                          className="input-field text-sm flex-1"
                          placeholder={link.platform ? SOCIAL_PLATFORMS[link.platform]?.placeholder || 'https://...' : 'https://...'}
                        />
                        <button
                          onClick={() => removeSocialLink(idx)}
                          className="p-1.5 text-secondary hover:text-accent-red hover:bg-accent-red/10 rounded-full transition-colors shrink-0"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {editSocialLinks.length === 0 && (
                      <p className="text-xs text-secondary/50 py-2">No social links added yet</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-1.5 text-xs">
                    <HiCheck className="w-4 h-4" /> Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditDisplayName(channel.displayName);
                      setEditBio(channel.bio || '');
                      setEditLocation(channel.location || '');
                      setEditSocialLinks(Array.isArray(channel.socialLinks) ? channel.socialLinks : []);
                    }}
                    className="btn-secondary flex items-center gap-1.5 text-xs"
                  >
                    <HiX className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ===== VIEW MODE ===== */
              <>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight flex items-center gap-2">
                  {channel.displayName}
                  {channel.isVerified && <svg className="w-5 h-5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                </h1>

                <div className="flex flex-wrap items-center gap-1 text-[13px] text-secondary mt-1">
                  <span className="font-medium text-primary/70">@{channel.username}</span>
                  <span className="text-secondary/40 px-0.5">·</span>
                  <span>{formatSubscribers(channel.subscriberCount)}</span>
                  <span className="text-secondary/40 px-0.5">·</span>
                  <span>{channel._count?.videos || 0} videos</span>
                </div>

                {/* Bio with ...more */}
                {channel.bio && (
                  <div className="mt-2 max-w-2xl">
                    <p className={`text-[13px] text-secondary leading-relaxed ${!showBioExpanded ? 'line-clamp-1' : ''}`}>
                      {channel.bio}
                    </p>
                    {channel.bio.length > 80 && (
                      <button
                        onClick={() => setShowBioExpanded(!showBioExpanded)}
                        className="text-[13px] font-medium text-primary hover:text-accent-red transition-colors mt-0.5"
                      >
                        {showBioExpanded ? 'Show less' : '...more'}
                      </button>
                    )}
                  </div>
                )}

                {/* Social Links Inline (if any) */}
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                    {socialLinks.slice(0, 5).map((link, idx) => {
                      const platform = SOCIAL_PLATFORMS[link.platform];
                      if (!platform) return null;
                      const Icon = platform.icon;
                      return (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 text-xs font-medium ${platform.color} hover:opacity-80 transition-opacity bg-surface-200 px-2.5 py-1 rounded-full`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {platform.label}
                        </a>
                      );
                    })}
                    {socialLinks.length > 5 && (
                      <button
                        onClick={() => setActiveTab('about')}
                        className="text-xs text-accent-red font-medium hover:underline"
                      >
                        +{socialLinks.length - 5} more
                      </button>
                    )}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 mt-3">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-surface-200 hover:bg-surface-300 text-primary text-sm font-medium rounded-full transition-colors flex items-center gap-2"
                      >
                        <HiPencil className="w-4 h-4" />
                        Customize channel
                      </button>
                      <Link
                        href="/studio"
                        className="px-4 py-2 bg-surface-200 hover:bg-surface-300 text-primary text-sm font-medium rounded-full transition-colors flex items-center gap-2"
                      >
                        <HiChartBar className="w-4 h-4" />
                        Manage videos
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSubscribe}
                        className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2
                          ${channel.isSubscribed
                            ? 'bg-surface-200 hover:bg-surface-300 text-primary'
                            : 'bg-primary text-page dark:bg-white dark:text-black hover:opacity-90'}`}
                      >
                        {channel.isSubscribed && <HiBell className="w-4 h-4" />}
                        {channel.isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2 bg-surface-200 hover:bg-surface-300 text-primary rounded-full transition-colors"
                        title="Share"
                      >
                        <HiShare className="w-4 h-4" />
                      </button>

                      {/* 3-dot More Menu */}
                      <div className="relative" ref={moreMenuRef}>
                        <button
                          onClick={() => setShowMoreMenu(!showMoreMenu)}
                          className="p-2 bg-surface-200 hover:bg-surface-300 text-primary rounded-full transition-colors"
                          title="More"
                        >
                          <HiDotsHorizontal className="w-4 h-4" />
                        </button>
                        {showMoreMenu && (
                          <div className="absolute right-0 top-11 w-56 bg-surface border border-border-light/10 rounded-xl shadow-2xl z-50 py-1.5 animate-scale-in origin-top-right">
                            <button
                              onClick={handleShare}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-hover transition-colors text-primary text-left"
                            >
                              <HiShare className="w-4 h-4 text-secondary" />
                              Share channel
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('Link copied!');
                                setShowMoreMenu(false);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-hover transition-colors text-primary text-left"
                            >
                              <HiLink className="w-4 h-4 text-secondary" />
                              Copy channel URL
                            </button>
                            <div className="border-t border-border-light/10 my-1" />
                            <button
                              onClick={handleReport}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-hover transition-colors text-primary text-left"
                            >
                              <HiFlag className="w-4 h-4 text-secondary" />
                              Report channel
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== TAB NAVIGATION ===== */}
        <div className="flex items-center border-b border-border-light/10 -mx-4 sm:mx-0 px-4 sm:px-0 mt-1">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide flex-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab.toLowerCase());
                  if (tab.toLowerCase() === 'community' && channel?.id) loadCommunityPosts(channel.id);
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 shrink-0
                  ${activeTab === tab.toLowerCase()
                    ? 'text-primary border-primary dark:border-white'
                    : 'text-secondary border-transparent hover:text-primary hover:border-secondary/30'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {(activeTab === 'videos' || activeTab === 'shorts') && (
            <button
              onClick={() => { setShowSearch(!showSearch); setTimeout(() => searchInputRef.current?.focus(), 100); }}
              className="p-2 hover:bg-hover rounded-full transition-colors shrink-0"
            >
              <HiSearch className="w-5 h-5 text-secondary" />
            </button>
          )}
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="py-3 animate-slide-down">
            <div className="relative max-w-md">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search within channel"
                className="w-full pl-9 pr-4 py-2 bg-surface-200 rounded-lg text-sm text-primary
                           placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent-red/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary">
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-[1284px] mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {videos.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🏠</div>
                <p className="text-secondary">This channel hasn{'\''}t posted yet</p>
              </div>
            ) : (
              <>
                {videos[0] && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-medium text-primary flex items-center gap-2">
                        <span className="w-1 h-5 bg-accent-red rounded-full" />
                        Latest video
                      </h2>
                      <button onClick={() => setActiveTab('videos')} className="text-sm text-accent-red hover:text-accent-red/80 font-medium">
                        View all →
                      </button>
                    </div>
                    <div className="max-w-md">
                      <VideoCard video={videos[0]} />
                    </div>
                  </div>
                )}

                {/* Shorts Section */}
                {(() => {
                  const shorts = videos.filter(v => v.isShort || (v.duration > 0 && v.duration <= 180));
                  if (shorts.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-medium text-primary flex items-center gap-2">
                          <SiYoutube className="w-5 h-5 text-accent-red" /> Shorts
                        </h2>
                        <button onClick={() => setActiveTab('shorts')} className="text-sm text-accent-red hover:text-accent-red/80 font-medium">
                          View all →
                        </button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                        {shorts.slice(0, 8).map(v => (
                          <Link key={v.id} href={`/shorts/${v.id}`} className="w-[160px] sm:w-[180px] shrink-0 group">
                            <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-surface-200">
                              <img src={v.thumbnailUrl || '/placeholder-thumb.jpg'} alt={v.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                              <div className="absolute inset-x-2 bottom-2 z-10">
                                <p className="text-xs text-white/90 font-medium">{formatViews(v.views)}</p>
                              </div>
                            </div>
                            <h3 className="text-[13px] font-medium text-primary line-clamp-2 leading-snug mt-2 group-hover:text-accent-red transition-colors">{v.title}</h3>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Uploads */}
                {videos.length > 1 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-medium text-primary flex items-center gap-2">
                        <span className="w-1 h-5 bg-accent-red rounded-full" /> Uploads
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                      {videos.filter(v => !(v.isShort || (v.duration > 0 && v.duration <= 180))).slice(0, 8).map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              {(['latest', 'popular', 'oldest'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${sortBy === s ? 'bg-primary text-page dark:bg-white dark:text-black' : 'bg-surface-200 text-primary hover:bg-surface-300'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {(() => {
              const sorted = getSortedVideos(videos, false);
              return sorted.length === 0 ? (
                <div className="text-center py-16"><div className="text-5xl mb-4">📹</div><p className="text-secondary">{searchQuery ? 'No videos found' : 'No videos yet'}</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                  {sorted.map((video) => <VideoCard key={video.id} video={video} />)}
                </div>
              );
            })()}
          </div>
        )}

        {/* SHORTS TAB */}
        {activeTab === 'shorts' && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              {(['latest', 'popular', 'oldest'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${sortBy === s ? 'bg-primary text-page dark:bg-white dark:text-black' : 'bg-surface-200 text-primary hover:bg-surface-300'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {(() => {
              const shorts = getSortedVideos(videos, true);
              return shorts.length === 0 ? (
                <div className="text-center py-16"><div className="text-5xl mb-4">⚡</div><p className="text-secondary">{searchQuery ? 'No shorts found' : 'No shorts yet'}</p></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {shorts.map((v) => (
                    <Link key={v.id} href={`/shorts/${v.id}`} className="group">
                      <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-surface-200">
                        <img src={v.thumbnailUrl || '/placeholder-thumb.jpg'} alt={v.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="absolute inset-x-2 bottom-2 z-10">
                          <h3 className="text-[13px] font-medium text-white line-clamp-2 leading-snug drop-shadow-md">{v.title}</h3>
                          <p className="text-xs text-white/80 mt-1 drop-shadow-md">{formatViews(v.views)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* COMMUNITY TAB */}
        {activeTab === 'community' && (
          <div className="max-w-2xl space-y-5">
            {isOwner && (
              <div className="bg-surface rounded-2xl p-4 border border-border-light/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0">
                    {channel.avatar ? <img src={channel.avatar} className="w-full h-full object-cover" /> : getInitials(channel.displayName)}
                  </div>
                  <textarea value={newPostText} onChange={(e) => setNewPostText(e.target.value)} placeholder="Share something with your community..." rows={2}
                    className="flex-1 bg-transparent resize-none text-sm focus:outline-none placeholder:text-secondary/50" />
                </div>
                <div className="flex justify-between mt-2 border-t border-border-light/5 pt-2">
                  <button
                    onClick={() => {
                      setShowPollInput(!showPollInput);
                      if (!showPollInput) setPollOptions(['', '']);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5
                      ${showPollInput ? 'bg-accent-red/10 text-accent-red' : 'text-secondary hover:text-primary hover:bg-hover'}`}
                  >
                    📊 {showPollInput ? 'Remove poll' : 'Add poll'}
                  </button>
                  <button onClick={handleCreatePost} disabled={!newPostText.trim()}
                    className="px-5 py-1.5 bg-accent-red text-white text-sm font-medium rounded-full disabled:opacity-40 hover:bg-accent-red/90 transition-colors">
                    Post
                  </button>
                </div>
                {showPollInput && (
                  <div className="mt-3 space-y-2 border-t border-border-light/5 pt-3">
                    <p className="text-xs text-secondary font-medium">Poll Options</p>
                    {pollOptions.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={opt}
                        onChange={(e) => { const updated = [...pollOptions]; updated[idx] = e.target.value; setPollOptions(updated); }}
                        placeholder={`Option ${idx + 1}`}
                        className="w-full bg-surface-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-red/40"
                      />
                    ))}
                    {pollOptions.length < 5 && (
                      <button
                        onClick={() => setPollOptions([...pollOptions, ''])}
                        className="text-xs text-accent-red hover:text-accent-red/80 font-medium"
                      >
                        + Add option
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {communityPosts.length === 0 ? (
              <div className="text-center py-12 text-secondary"><p className="text-lg">💬</p><p className="mt-2">No community posts yet</p></div>
            ) : communityPosts.map((post: any) => (
              <div key={post.id} className="bg-surface rounded-2xl p-5 border border-border-light/10 hover:border-border-light/20 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                    {post.user?.avatar ? <img src={post.user.avatar} className="w-full h-full object-cover" /> : getInitials(post.user?.displayName || 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{post.user?.displayName}</p>
                    <p className="text-xs text-secondary">{timeAgo(post.createdAt)}</p>
                  </div>
                  <button className="p-1.5 hover:bg-hover rounded-full transition-colors text-secondary">
                    <HiDotsHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.text}</p>
                {post.imageUrl && <img src={post.imageUrl} className="mt-3 rounded-xl max-h-96 object-cover w-full" />}
                {/* Poll rendering */}
                {post.poll && (
                  <div className="mt-4 space-y-2">
                    {post.poll.options?.map((option: any) => {
                      const totalVotes = post.poll.options.reduce((sum: number, o: any) => sum + (o._count?.votes || 0), 0);
                      const pct = totalVotes > 0 ? Math.round((option._count?.votes || 0) / totalVotes * 100) : 0;
                      const hasVoted = (post.poll.userVotedOptionIds || []).length > 0;
                      const isMyVote = (post.poll.userVotedOptionIds || []).includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => handlePollVote(post.poll.id, option.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all relative overflow-hidden
                            ${isMyVote
                              ? 'border-accent-red/40 bg-accent-red/5'
                              : 'border-border-light/20 hover:border-border-light/40 bg-surface-200/50'}`}
                        >
                          {hasVoted && (
                            <div
                              className="absolute inset-y-0 left-0 bg-accent-red/10 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <div className="flex items-center justify-between relative z-10">
                            <span className="text-sm font-medium">{option.text}</span>
                            {hasVoted && <span className="text-xs text-secondary font-medium">{pct}%</span>}
                          </div>
                        </button>
                      );
                    })}
                    <p className="text-xs text-secondary mt-1">
                      {post.poll.options?.reduce((sum: number, o: any) => sum + (o._count?.votes || 0), 0)} votes
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ABOUT TAB — YouTube Style */}
        {activeTab === 'about' && (
          <div className="max-w-3xl grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
            {/* Left column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-base mb-3">Description</h3>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                  {channel.bio || 'No description provided.'}
                </p>
              </div>

              {/* Links section */}
              {socialLinks.length > 0 && (
                <div className="border-t border-border-light/10 pt-5">
                  <h3 className="font-semibold text-base mb-4">Links</h3>
                  <div className="space-y-3">
                    {socialLinks.map((link, idx) => {
                      const platform = SOCIAL_PLATFORMS[link.platform];
                      if (!platform) return null;
                      const Icon = platform.icon;
                      return (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 group hover:bg-hover p-2 -mx-2 rounded-lg transition-colors"
                        >
                          <div className={`w-9 h-9 rounded-full bg-surface-200 flex items-center justify-center shrink-0 ${platform.color}`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary">{platform.label}</p>
                            <p className="text-xs text-blue-500 truncate group-hover:underline">{link.url}</p>
                          </div>
                          <HiExternalLink className="w-4 h-4 text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* More info */}
              <div className="border-t border-border-light/10 pt-5">
                <h3 className="font-semibold text-base mb-4">More info</h3>
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 text-sm">
                    <HiGlobe className="w-5 h-5 text-secondary shrink-0" />
                    <span className="text-primary">{channel.location || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <HiCalendar className="w-5 h-5 text-secondary shrink-0" />
                    <span className="text-primary">
                      Joined {new Date(channel.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <HiEye className="w-5 h-5 text-secondary shrink-0" />
                    <span className="text-primary">{totalViews.toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column — Stats Card */}
            <div className="space-y-5">
              <div className="bg-surface rounded-2xl p-5 border border-border-light/10">
                <h3 className="font-semibold text-base mb-4">Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary flex items-center gap-2"><HiEye className="w-4 h-4" /> Total views</span>
                    <span className="text-sm font-medium">{totalViews.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border-light/5" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary flex items-center gap-2"><HiBell className="w-4 h-4" /> Subscribers</span>
                    <span className="text-sm font-medium">{formatSubscribers(channel.subscriberCount)}</span>
                  </div>
                  <div className="border-t border-border-light/5" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary flex items-center gap-2"><HiChartBar className="w-4 h-4" /> Videos</span>
                    <span className="text-sm font-medium">{channel._count?.videos || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
