'use client';

import React, { useState } from 'react';
import { HiFilter, HiOutlinePlay } from 'react-icons/hi';

type Tab = 'music' | 'sfx' | 'starred';

export default function StudioAudioLibrary() {
  const [activeTab, setActiveTab] = useState<Tab>('music');

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6 text-primary">Audio Library</h1>
      
      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-border-light mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap">
        <button onClick={() => setActiveTab('music')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'music' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Free music</button>
        <button onClick={() => setActiveTab('sfx')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'sfx' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Sound effects</button>
        <button onClick={() => setActiveTab('starred')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'starred' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Starred</button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 mb-4 text-sm text-secondary px-2">
        <HiFilter className="w-5 h-5" />
        <input type="text" placeholder="Search or filter library" className="bg-transparent outline-none flex-1 placeholder-secondary text-primary" />
      </div>

      {activeTab === 'starred' ? (
        <div className="flex flex-col items-center justify-center py-32 text-center border-t border-border-light mt-4">
           <div className="text-5xl opacity-30 mb-4">⭐</div>
           <h2 className="text-xl font-medium text-primary mb-2">No starred tracks</h2>
           <p className="text-secondary mb-6 text-[14px] max-w-md">Click the star next to any audio track to save it here for later.</p>
        </div>
      ) : (
        /* Mock Table */
        <div className="w-full overflow-x-auto border-t border-border-light mt-4">
          <table className="w-full text-left border-collapse min-w-[900px]">
             <thead>
                <tr className="border-b border-border-light text-xs text-secondary hover:bg-hover">
                   <th className="py-3 px-4 font-normal w-12"><HiOutlinePlay className="w-5 h-5 opacity-50" /></th>
                   <th className="py-3 px-2 font-medium w-[30%]">{activeTab === 'music' ? 'Track title' : 'Sound effect'}</th>
                   <th className="py-3 px-2 font-medium">Genre</th>
                   <th className="py-3 px-2 font-medium">Mood</th>
                   <th className="py-3 px-2 font-medium">Artist</th>
                   <th className="py-3 px-2 font-medium text-right pr-4">Duration</th>
                </tr>
             </thead>
             <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-border-light hover:bg-hover transition-colors opacity-50 cursor-not-allowed">
                     <td className="py-3 px-4"><HiOutlinePlay className="w-6 h-6" /></td>
                     <td className="py-3 px-2 text-[13px] font-medium text-primary">Coming Soon {activeTab === 'sfx' ? 'SFX' : 'Track'} {i}</td>
                     <td className="py-3 px-2 text-[13px] text-secondary">Cinematic</td>
                     <td className="py-3 px-2 text-[13px] text-secondary">Dramatic</td>
                     <td className="py-3 px-2 text-[13px] text-secondary">StreamSphere Audio</td>
                     <td className="py-3 px-2 pr-4 text-[13px] text-secondary text-right">2:45</td>
                  </tr>
                ))}
             </tbody>
          </table>
          <div className="py-8 text-center text-sm text-secondary">
             The {activeTab === 'sfx' ? 'Sound Effects' : 'Free Music'} Library feature is currently under development. Wait for updates!
          </div>
        </div>
      )}
    </div>
  );
}
