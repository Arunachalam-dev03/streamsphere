'use client';

import React, { useState } from 'react';
import { HiFilter } from 'react-icons/hi';

type Tab = 'all' | 'drafts' | 'published';

export default function StudioSubtitles() {
  const [activeTab, setActiveTab] = useState<Tab>('all');

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6 text-primary">Channel subtitles</h1>
      
      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-border-light mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap">
        <button onClick={() => setActiveTab('all')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>All</button>
        <button onClick={() => setActiveTab('drafts')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'drafts' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Drafts</button>
        <button onClick={() => setActiveTab('published')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'published' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Published</button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 mb-4 text-sm text-secondary px-2">
        <HiFilter className="w-5 h-5" />
        <input type="text" placeholder="Filter" className="bg-transparent outline-none flex-1 placeholder-secondary text-primary" />
      </div>

      {/* Empty Table Header */}
      <div className="w-full overflow-x-auto border-t border-b border-border-light mt-4">
        <table className="w-full text-left border-collapse min-w-[600px]">
           <thead>
              <tr className="text-xs text-secondary">
                 <th className="py-3 px-2 font-medium w-[40%]">Video</th>
                 <th className="py-3 px-2 font-medium">Languages</th>
                 <th className="py-3 px-2 font-medium">Modified on</th>
              </tr>
           </thead>
        </table>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-6 opacity-30">⌨️</div>
        {activeTab === 'all' && (
           <>
              <h2 className="text-[15px] font-medium text-primary mb-1">No videos found.</h2>
              <p className="text-secondary text-[13px]">Upload a video to add subtitles and closed captions.</p>
           </>
        )}
        {activeTab === 'drafts' && (
           <>
              <h2 className="text-[15px] font-medium text-primary mb-1">No draft subtitles.</h2>
              <p className="text-secondary text-[13px]">Any subtitles you are currently editing will appear here.</p>
           </>
        )}
        {activeTab === 'published' && (
           <>
              <h2 className="text-[15px] font-medium text-primary mb-1">No published subtitles.</h2>
              <p className="text-secondary text-[13px]">Subtitles that are live on your videos will appear here.</p>
           </>
        )}
      </div>
    </div>
  );
}
