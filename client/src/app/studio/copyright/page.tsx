'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type Tab = 'matches' | 'removalRequests' | 'messages' | 'archive';

export default function StudioCopyright() {
  const [activeTab, setActiveTab] = useState<Tab>('matches');

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6 text-primary">Channel copyright</h1>
      
      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-border-light mb-12 overflow-x-auto scrollbar-hide whitespace-nowrap">
        <button onClick={() => setActiveTab('matches')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'matches' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Matches</button>
        <button onClick={() => setActiveTab('removalRequests')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'removalRequests' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Removal requests</button>
        <button onClick={() => setActiveTab('messages')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'messages' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Messages</button>
        <button onClick={() => setActiveTab('archive')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'archive' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Archive</button>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto">
        <img src="https://www.gstatic.com/youtube/img/creator/no_content_illustration_v3.svg" alt="No copyright matches" className="w-[160px] mb-8 opacity-80 dark:invert-[0.8]" />
        
        {activeTab === 'matches' && (
           <>
              <h2 className="text-xl font-medium text-primary mb-3">Nothing to see here yet</h2>
              <p className="text-secondary text-[14px]">You haven't submitted any copyright takedown requests. Looking for a copyright claim made on one of your videos? Check the video list.</p>
           </>
        )}
        
        {activeTab === 'removalRequests' && (
           <>
              <h2 className="text-xl font-medium text-primary mb-3">No removal requests</h2>
              <p className="text-secondary text-[14px]">You haven't submitted any takedown requests for matched content yet.</p>
           </>
        )}
        
        {activeTab === 'messages' && (
           <>
              <h2 className="text-xl font-medium text-primary mb-3">No messages</h2>
              <p className="text-secondary text-[14px]">You have no active communications regarding copyright matches or disputes.</p>
           </>
        )}
        
        {activeTab === 'archive' && (
           <>
              <h2 className="text-xl font-medium text-primary mb-3">Archive is empty</h2>
              <p className="text-secondary text-[14px]">Archived copyright matches and resolved claims will appear here.</p>
           </>
        )}
        
        <Link href="/studio/content" className="mt-8 text-accent-blue font-medium uppercase text-sm hover:text-blue-400">Video list</Link>
      </div>
    </div>
  );
}
