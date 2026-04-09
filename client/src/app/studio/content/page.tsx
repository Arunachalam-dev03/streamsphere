'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { videoAPI, liveAPI, playlistAPI } from '@/lib/api';
import { formatViews } from '@/lib/utils';
import Link from 'next/link';
import { HiOutlineChatAlt2, HiFilter, HiOutlineStatusOnline } from 'react-icons/hi';
import { SiYoutubeshorts } from 'react-icons/si';

type Tab = 'videos' | 'shorts' | 'live' | 'playlists';

export default function StudioContent() {
  const { user, isHydrated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('videos');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHydrated && user) loadData();
  }, [isHydrated, user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setItems([]);
    try {
      if (activeTab === 'videos' || activeTab === 'shorts') {
        // Use the channel API to fetch ALL videos (including private/drafts/uploading)
        const res = await (await import('@/lib/api')).channelAPI.getVideos(user!.id, 1);
        const myVideos = res.data?.videos || [];
        
        if (activeTab === 'videos') {
           setItems(myVideos.filter((v: any) => v.duration > 180 || (!v.isShort && v.duration === 0)));
        } else {
           setItems(myVideos.filter((v: any) => v.isShort || (v.duration > 0 && v.duration <= 180)));
        }
      } else if (activeTab === 'live') {
        const res = await liveAPI.getMyActive();
        // Fallback to my-streams if we implement full history
        const streamArray = res.data?.streams || (Array.isArray(res.data) ? res.data : []);
        setItems(streamArray);
      } else if (activeTab === 'playlists') {
        const res = await playlistAPI.getAll();
        setItems(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
       console.log('Failed fetching for tab:', activeTab);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string, type: string) => {
    if (!confirm(`Are you sure you want to permanently delete '${title}'?`)) return;
    try {
      if (type === 'video') await videoAPI.delete(id);
      if (type === 'playlist') await playlistAPI.delete(id);
      if (type === 'stream') await liveAPI.endStream(id); // Using endStream as pseudo-delete for now
      
      setItems((prev) => prev.filter((v) => v.id !== id));
      import('react-hot-toast').then(({ default: toast }) => toast.success('Deleted successfully'));
    } catch (e: any) {
      import('react-hot-toast').then(({ default: toast }) => toast.error('Failed to delete item'));
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold mb-6">Channel content</h1>
        
        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-border-light mb-6">
          <button onClick={() => setActiveTab('videos')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'videos' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Videos</button>
          <button onClick={() => setActiveTab('shorts')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'shorts' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Shorts</button>
          <button onClick={() => setActiveTab('live')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'live' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Live</button>
          <button onClick={() => setActiveTab('playlists')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'playlists' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Playlists</button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-4 text-sm text-secondary px-2">
          <HiFilter className="w-5 h-5" />
          <input type="text" placeholder="Filter" className="bg-transparent outline-none flex-1 placeholder-secondary text-primary" />
        </div>

        {/* Content Table */}
        <div className="w-full overflow-x-auto pb-32">
          <table className="w-full text-left border-collapse min-w-[900px]">
             <thead>
                <tr className="border-y border-border-light text-xs text-secondary hover:bg-hover">
                   <th className="py-3 px-4 font-normal w-12"><input type="checkbox" className="w-4 h-4 rounded border-border-light text-accent-blue bg-transparent" /></th>
                   <th className="py-3 px-2 font-medium w-[40%]">{activeTab === 'playlists' ? 'Playlist' : 'Video'}</th>
                   <th className="py-3 px-2 font-medium">{activeTab === 'playlists' ? 'Video Count' : 'Visibility'}</th>
                   {(activeTab === 'videos' || activeTab === 'shorts') && <th className="py-3 px-2 font-medium">Date</th>}
                   {activeTab === 'live' && <th className="py-3 px-2 font-medium">Status</th>}
                   {activeTab !== 'playlists' && <th className="py-3 px-2 font-medium text-right">Views</th>}
                   {(activeTab === 'videos' || activeTab === 'shorts') && <th className="py-3 px-2 font-medium text-right">Comments</th>}
                   {(activeTab === 'videos' || activeTab === 'shorts') && <th className="py-3 px-4 font-medium text-right">Likes</th>}
                </tr>
             </thead>
             <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-20 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-accent-blue border-t-transparent animate-spin ml-1/2"></div></td></tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center border-t border-border-light mt-4">
                        <h2 className="text-xl font-medium text-primary mb-2">No {activeTab} available</h2>
                        <p className="text-secondary mb-6 text-[14px]">You haven't created any {activeTab} yet.</p>
                    </td>
                  </tr>
                ) : items.map(v => (
                  <tr key={v.id} className="border-b border-border-light hover:bg-hover group transition-colors">
                     <td className="py-3 px-4"><input type="checkbox" className="w-4 h-4 rounded border-border-light bg-transparent" /></td>
                     <td className="py-3 px-2">
                       <div className="flex gap-4 items-start">
                         <div className={`relative bg-black rounded shrink-0 overflow-hidden block ${activeTab === 'shorts' ? 'w-[70px] aspect-[9/16]' : 'w-[120px] aspect-video'}`}>
                           {activeTab === 'playlists' ? (
                             <img src={v.videos?.[0]?.video?.thumbnailUrl || '/placeholder-thumb.jpg'} className="w-full h-full object-cover opacity-80" />
                           ) : (
                             <img src={v.thumbnailUrl || '/placeholder-thumb.jpg'} className="w-full h-full object-cover" />
                           )}
                           {(activeTab === 'videos' || activeTab === 'shorts') && (
                             <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1 rounded">
                               {Math.floor((v.duration||0) / 60)}:{((v.duration||0) % 60).toString().padStart(2, '0')}
                             </span>
                           )}
                           {activeTab === 'playlists' && (
                             <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-black/60 flex items-center justify-center flex-col text-white backdrop-blur-[2px]">
                                <span className="font-bold text-sm">{v._count?.videos || 0}</span>
                                <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 mt-1"><path d="M22 7H2v1h20V7zm-6 4H2v1h14v-1zm-6 4H2v1h8v-1zm12-.41L15.41 12 14 13.41 17.59 17 14 20.59 15.41 22 22 15.41z" /></svg>
                             </div>
                           )}
                         </div>
                         <div className="flex flex-col flex-1 min-w-0 pr-4 relative min-h-[68px]">
                            {activeTab === 'live' ? (
                              <h3 className="text-[13px] font-medium text-primary line-clamp-1 leading-tight mb-0.5"><HiOutlineStatusOnline className="inline mr-1 text-accent-red" /> {v.title}</h3>
                            ) : activeTab === 'playlists' ? (
                              <h3 className="text-[13px] font-medium text-primary line-clamp-1 leading-tight mb-0.5">{v.title}</h3>
                            ) : (
                              <Link href={`/watch/${v.id}`}>
                                <h3 className="text-[13px] font-medium text-primary line-clamp-1 leading-tight mb-0.5 group-hover:text-accent-blue cursor-pointer">{activeTab === 'shorts' && <SiYoutubeshorts className="inline mr-1 text-accent-red"/>}{v.title}</h3>
                              </Link>
                            )}
                            
                            <p className="text-secondary text-[12px] line-clamp-2 leading-tight group-hover:opacity-0 transition-opacity">{v.description || 'Add description'}</p>
                            
                            {/* Hover Actions */}
                            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0">
                               {activeTab !== 'playlists' && activeTab !== 'live' && (
                                 <Link href={`/studio/edit/${v.id}`} title="Edit" className="p-1 hover:text-accent-blue text-secondary transition-colors">
                                   <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.147l-2.827.902.902-2.827a4.5 4.5 0 011.147-1.89l12.723-12.723z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" /></svg>
                                 </Link>
                               )}
                               
                               <button onClick={() => handleDelete(v.id, v.title, activeTab === 'playlists' ? 'playlist' : activeTab === 'live' ? 'stream' : 'video')} title="Delete (Forever)" className="p-1 hover:text-red-500 text-secondary transition-colors ml-auto mr-4">
                                 <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                               </button>
                            </div>
                         </div>
                       </div>
                     </td>
                     
                     <td className="py-3 px-2">
                        {activeTab === 'playlists' ? (
                          <div className="text-[13px] text-secondary">{v._count?.videos || 0} videos</div>
                        ) : (
                          <div className="flex items-center gap-2 text-[13px]">
                             <span className={`w-2.5 h-2.5 rounded-full ${v.privacy === 'PRIVATE' ? 'bg-secondary' : 'bg-green-500'}`}></span> {v.privacy || 'Public'}
                          </div>
                        )}
                     </td>
                     
                     {(activeTab === 'videos' || activeTab === 'shorts') && (
                       <td className="py-3 px-2 text-[13px] text-primary">
                          <div className="flex flex-col">
                             <span>{new Date(v.createdAt).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year:'numeric'})}</span>
                             <span className="text-secondary text-[11px]">Published</span>
                          </div>
                       </td>
                     )}
                     
                     {activeTab === 'live' && (
                       <td className="py-3 px-2">
                         <div className={`text-[11px] px-2 py-0.5 rounded border inline-block ${v.status === 'LIVE' ? 'border-accent-red text-accent-red bg-accent-red/10' : v.status === 'ENDED' ? 'border-secondary text-secondary' : 'border-blue-500 text-blue-500'}`}>
                            {v.status || 'SCHEDULED'}
                         </div>
                       </td>
                     )}
                     
                     {activeTab !== 'playlists' && (
                       <td className="py-3 px-2 text-[13px] text-right">{(v.views || 0).toLocaleString()}</td>
                     )}
                     
                     {(activeTab === 'videos' || activeTab === 'shorts') && (
                       <td className="py-3 px-2 text-[13px] text-right">{(v.comments?.length || v._count?.comments || 0)}</td>
                     )}
                     
                     {(activeTab === 'videos' || activeTab === 'shorts') && (
                       <td className="py-3 px-4 text-[13px] text-right">
                         <div className="flex flex-col items-end">
                           <span>{v.likesCount || 0}</span>
                         </div>
                       </td>
                     )}
                  </tr>
                ))}
             </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
