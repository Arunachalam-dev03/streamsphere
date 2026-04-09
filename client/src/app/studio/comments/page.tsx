'use client';

import React, { useEffect, useState } from 'react';
import { HiFilter } from 'react-icons/hi';
import { commentAPI } from '@/lib/api';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

type Tab = 'comments' | 'mentions';

export default function StudioComments() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('comments');

  useEffect(() => {
    if (activeTab === 'comments') {
       loadComments();
    } else {
       // Mock mentions lack of data for now
       setLoading(false);
       setComments([]);
    }
  }, [activeTab]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await commentAPI.getChannelComments(1, 50);
      setComments(res.data?.comments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await commentAPI.delete(id);
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success('Comment deleted');
    } catch (e) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold mb-6 text-primary">Channel comments & mentions</h1>
        
        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-border-light mb-6">
          <button onClick={() => setActiveTab('comments')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'comments' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Comments</button>
          <button onClick={() => setActiveTab('mentions')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'mentions' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Mentions</button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-4 text-sm text-secondary px-2">
          <HiFilter className="w-5 h-5" />
          <input type="text" placeholder="Filter" className="bg-transparent outline-none flex-1 placeholder-secondary text-primary" />
        </div>

        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin"></div></div>
        ) : activeTab === 'mentions' ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border-t border-border-light mt-4">
             <div className="text-5xl opacity-30 mb-4">@</div>
             <h2 className="text-xl font-medium text-primary mb-2">No mentions yet</h2>
             <p className="text-secondary mb-6 text-[14px] max-w-md">When other channels mention you, they will appear here.</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border-t border-border-light mt-4">
            <img src="https://www.gstatic.com/youtube/img/creator/no_content_illustration_v3.svg" alt="No comments" className="w-[160px] mb-6 opacity-80 dark:invert-[0.8]" />
            <h2 className="text-xl font-medium text-primary mb-2">No comments yet</h2>
            <p className="text-secondary mb-6 text-[14px] max-w-md">When viewers comment on your videos, they will show up here.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto border-t border-border-light mt-4 pb-32">
            <table className="w-full text-left border-collapse min-w-[900px]">
               <thead>
                  <tr className="border-b border-border-light text-xs text-secondary hover:bg-hover">
                     <th className="py-3 px-4 font-normal w-12"><input type="checkbox" className="w-4 h-4 rounded border-border-light text-accent-blue bg-transparent" /></th>
                     <th className="py-3 px-2 font-medium w-[55%]">Comment</th>
                     <th className="py-3 px-2 font-medium w-[45%]">Video</th>
                  </tr>
               </thead>
               <tbody>
                  {comments.map((c) => (
                    <tr key={c.id} className="border-b border-border-light hover:bg-hover group transition-colors">
                       <td className="py-4 px-4 align-top pt-5"><input type="checkbox" className="w-4 h-4 rounded border-border-light bg-transparent" /></td>
                       <td className="py-4 px-2 pr-6 align-top">
                         <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-accent-purple shrink-0 overflow-hidden text-white flex items-center justify-center font-bold">
                               {c.user?.avatar ? <img src={c.user.avatar} className="w-full h-full object-cover" /> : getInitials(c.user?.displayName || 'U')}
                            </div>
                            <div className="flex flex-col relative min-h-[60px] w-full">
                               <div className="text-[13px] text-secondary mb-1">
                                 <span className="font-medium text-primary">{c.user?.displayName}</span>
                                 <span className="mx-2">•</span>
                                 <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                               </div>
                               <p className="text-[14px] text-primary">{c.text}</p>
                               
                               <div className="absolute bottom-0 left-0 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 text-secondary text-sm">
                                  <button className="hover:text-primary transition-colors font-medium">Reply</button>
                                  <button onClick={() => handleDelete(c.id)} className="hover:text-red-500 transition-colors">Delete</button>
                               </div>
                            </div>
                         </div>
                       </td>
                       <td className="py-4 px-2 align-top">
                         <Link href={`/watch/${c.video?.id}`} className="flex gap-3 items-start group/video">
                           <div className="w-[120px] aspect-video bg-black rounded shrink-0 overflow-hidden">
                              <img src={c.video?.thumbnailUrl || '/placeholder-thumb.jpg'} className="w-full h-full object-cover" />
                           </div>
                           <div className="flex flex-col flex-1 min-w-0 pr-4">
                              <h3 className="text-[13px] font-medium text-primary line-clamp-2 leading-tight group-hover/video:text-accent-blue transition-colors">
                                {c.video?.title}
                              </h3>
                           </div>
                         </Link>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
