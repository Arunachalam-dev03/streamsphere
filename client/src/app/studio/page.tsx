'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { videoAPI, channelAPI } from '@/lib/api';
import { formatViews } from '@/lib/utils';
import Link from 'next/link';
import { HiOutlineExternalLink, HiUpload, HiOutlineEye, HiOutlineClock } from 'react-icons/hi';

export default function StudioDashboard() {
  const { user, isHydrated } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [latestVideo, setLatestVideo] = useState<any>(null);

  useEffect(() => {
    if (isHydrated && user) {
      loadDashboard();
    }
  }, [isHydrated, user]);

  const loadDashboard = async () => {
    try {
      const [channelRes, videosRes] = await Promise.all([
        channelAPI.getById(user!.id),
        videoAPI.getFeed(1, 10),
      ]);
      const myVideos = (videosRes.data?.videos || []).filter((v: any) => v.user?.id === user!.id);
      
      const totalViews = myVideos.reduce((sum: number, v: any) => sum + (v.views || 0), 0);
      
      setStats({
        subscribers: channelRes.data?.subscriberCount || 0,
        views28days: totalViews,
        watchTime28days: (totalViews * 2.5).toFixed(1), // Mocked for display
      });
      
      if (myVideos.length > 0) {
        setLatestVideo(myVideos.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]);
      }
    } catch (err) {}
  };

  if (!isHydrated) return null;

  return (
    <div className="w-full max-w-[1200px] mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Channel dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Latest Video Performance */}
        <div className="bg-surface border border-border-light rounded-lg overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border-light relative hover:cursor-pointer group">
             <h2 className="font-medium text-[15px] mb-4">Latest video performance</h2>
             {latestVideo ? (
               <div className="relative aspect-video w-full rounded-md overflow-hidden bg-black/50">
                 <img src={latestVideo.thumbnailUrl || '/placeholder-thumb.jpg'} alt="Thumbnail" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
               </div>
             ) : (
               <div className="aspect-video w-full rounded-md bg-hover flex flex-col items-center justify-center text-center p-4 border border-dashed border-border-light">
                 <HiUpload className="w-8 h-8 text-secondary mb-2" />
                 <p className="text-sm text-secondary">Upload a video to see its performance here</p>
               </div>
             )}
          </div>
          {latestVideo && (
            <div className="p-5 flex-1 flex flex-col">
               <p className="text-sm text-primary mb-4 truncate pr-4">{latestVideo.title}</p>
               <div className="space-y-4 text-[13px]">
                 <div className="flex justify-between items-center text-secondary">
                   <span>Ranking by views</span>
                   <span className="text-primary font-medium">1 of 10</span>
                 </div>
                 <div className="flex justify-between items-center text-secondary">
                   <span className="flex items-center gap-2"><HiOutlineEye className="w-4 h-4"/> Views</span>
                   <span className="text-primary font-medium">{formatViews(latestVideo.views)}</span>
                 </div>
                 <div className="flex justify-between items-center text-secondary">
                   <span className="flex items-center gap-2"><HiOutlineClock className="w-4 h-4"/> Average watch time</span>
                   <span className="text-primary font-medium">2:45</span>
                 </div>
               </div>
               <div className="mt-auto pt-6 px-1">
                 <Link href={`/studio/analytics`} className="text-accent-blue text-sm font-medium hover:text-blue-400 uppercase">Go to video analytics</Link>
               </div>
            </div>
          )}
        </div>

        {/* Channel Analytics Summary */}
        <div className="bg-surface border border-border-light rounded-lg flex flex-col">
          <div className="p-5">
            <h2 className="font-medium text-[15px] mb-2">Channel analytics</h2>
            <p className="text-[13px] text-secondary">Current subscribers</p>
            <p className="text-3xl font-normal mt-1">{stats?.subscribers || 0}</p>
            
            <div className="border-t border-border-light mt-5 pt-5">
              <h3 className="font-medium text-[13px] mb-3">Summary <span className="text-secondary font-normal ml-1">Last 28 days</span></h3>
              <div className="space-y-3 text-[13px]">
                 <div className="flex justify-between items-center text-secondary">
                   <span>Views</span>
                   <span className="text-primary">{formatViews(stats?.views28days || 0)}</span>
                 </div>
                 <div className="flex justify-between items-center text-secondary">
                   <span>Watch time (hours)</span>
                   <span className="text-primary">{stats?.watchTime28days || '0.0'}</span>
                 </div>
              </div>
            </div>
            
            <div className="border-t border-border-light mt-5 pt-5">
               <h3 className="font-medium text-[13px] mb-3">Top videos <span className="text-secondary font-normal ml-1">Last 48 hours</span></h3>
               <div className="text-[13px] text-secondary text-center py-2">
                 Not enough data
               </div>
            </div>
          </div>
          <div className="mt-auto p-5 border-t border-border-light">
             <Link href="/studio/analytics" className="text-accent-blue text-[14px] font-medium hover:text-blue-400 uppercase">Go to channel analytics</Link>
          </div>
        </div>

        {/* Creator Insider Mockup */}
        <div className="bg-surface border border-border-light rounded-lg flex flex-col">
          <div className="p-5">
            <h2 className="font-medium text-[15px] mb-4">Creator Insider</h2>
            <div className="aspect-video w-full rounded-md overflow-hidden bg-black relative mb-4">
               <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713b?auto=format&fit=crop&q=80&w=400&h=225" className="w-full h-full object-cover opacity-80" alt="News update"/>
               <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white/90 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
               </div>
            </div>
            <h3 className="text-[14px] font-medium leading-snug mb-2 hover:text-accent-blue cursor-pointer">What's new in Studio: Better analytics and more</h3>
            <p className="text-[13px] text-secondary line-clamp-2">This week we're bringing you an update on some exciting new features rolling out to Creator Studio including advanced real-time metrics.</p>
          </div>
          <div className="mt-auto p-5 space-y-4">
             <Link href="#" className="text-accent-blue text-[13px] hover:text-blue-400 block uppercase">Watch on StreamSphere</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
