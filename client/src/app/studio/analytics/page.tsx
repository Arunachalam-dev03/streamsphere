'use client';

import React, { useState } from 'react';
import { HiOutlineInformationCircle, HiDownload } from 'react-icons/hi';
import { videoAPI } from '@/lib/api';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'content' | 'audience' | 'revenue' | 'research';

export default function StudioAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Channel analytics</h1>
      
      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-border-light mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap">
        <button onClick={() => setActiveTab('overview')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Overview</button>
        <button onClick={() => setActiveTab('content')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'content' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Content</button>
        <button onClick={() => setActiveTab('audience')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'audience' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Audience</button>
        <button onClick={() => setActiveTab('revenue')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'revenue' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Revenue</button>
        <button onClick={() => setActiveTab('research')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'research' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Research</button>
        
        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={async () => {
              try {
                const response = await videoAPI.analyticsExport();
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'analytics.csv';
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Analytics exported');
              } catch {
                toast.error('Failed to export');
              }
            }}
            className="flex items-center gap-1.5 text-accent-blue text-[13px] font-medium hover:text-blue-400 transition-colors"
          >
            <HiDownload className="w-4 h-4" /> Export CSV
          </button>
          <span className="text-secondary text-[13px] font-medium cursor-pointer hover:text-primary uppercase">Advanced Mode</span>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Main Chart Area */}
           <div className="lg:col-span-2 space-y-6">
               <div className="bg-surface border border-border-light rounded-lg p-6">
                   <h2 className="text-[18px] font-medium mb-1">Your channel got 0 views in the last 28 days</h2>
                   <p className="text-[#AAAAAA] text-[13px] mb-8">About the same as usual</p>
                   
                   <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <div className="flex-1 border-b-[3px] border-accent-blue pb-4 cursor-pointer">
                         <div className="flex items-center gap-1.5 text-[13px] text-secondary">Views <HiOutlineInformationCircle/></div>
                         <div className="text-2xl mt-1 text-primary">0</div>
                      </div>
                      <div className="flex-1 border-b-[3px] border-transparent hover:border-border-light pb-4 cursor-pointer">
                         <div className="flex items-center gap-1.5 text-[13px] text-secondary">Watch time (hours) <HiOutlineInformationCircle/></div>
                         <div className="text-2xl mt-1 text-primary">0.0</div>
                         <div className="text-[12px] text-secondary mt-1">
                            <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full mr-1"></span> =
                         </div>
                      </div>
                      <div className="flex-1 border-b-[3px] border-transparent hover:border-border-light pb-4 cursor-pointer">
                         <div className="flex items-center gap-1.5 text-[13px] text-secondary">Subscribers <HiOutlineInformationCircle/></div>
                         <div className="text-2xl mt-1 text-primary">+0</div>
                         <div className="text-[12px] text-secondary mt-1">
                            <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full mr-1"></span> =
                         </div>
                      </div>
                   </div>
                   
                   <div className="h-[250px] w-full border-b border-border-light flex items-end relative pb-[20px]">
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-secondary py-5">
                         <span>10</span>
                         <span>5</span>
                         <span>0</span>
                      </div>
                      <div className="w-full h-full border-l border-border-light ml-8 relative pt-5">
                         {/* SVG Line Graph Mock */}
                         <svg width="100%" height="200" preserveAspectRatio="none" className="absolute bottom-[20px]">
                            <path d="M 0 190.5 L 800 190.5" stroke="currentColor" className="text-border-light" strokeWidth="1" strokeDasharray="4 4" />
                            <path d="M 0 100 L 800 100" stroke="currentColor" className="text-border-light" strokeWidth="1" strokeDasharray="4 4" />
                            <path d="M 0 10 L 800 10" stroke="currentColor" className="text-border-light" strokeWidth="1" strokeDasharray="4 4" />
                            <path d="M 0 200 L 100 195 L 200 198 L 300 190 L 400 199 L 500 195 L 600 200 L 700 198 L 800 200" fill="none" stroke="#3EA6FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M 0 200 L 100 195 L 200 198 L 300 190 L 400 199 L 500 195 L 600 200 L 700 198 L 800 200 L 800 200 L 0 200 Z" fill="url(#gradient)" opacity="0.2"/>
                            <defs>
                              <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#3EA6FF" />
                                <stop offset="100%" stopColor="transparent" />
                              </linearGradient>
                            </defs>
                         </svg>
                         <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[11px] text-secondary">
                            <span>Mar 7</span>
                            <span>Mar 14</span>
                            <span>Mar 21</span>
                            <span>Mar 28</span>
                            <span>Apr 4</span>
                         </div>
                      </div>
                   </div>
                   <div className="pt-4 text-center">
                      <span className="text-accent-blue text-sm font-medium uppercase cursor-pointer hover:text-blue-400">See more</span>
                   </div>
               </div>
           </div>
           
           {/* Sidebar panels */}
           <div className="space-y-6">
               <div className="bg-surface border border-border-light rounded-lg p-6">
                  <h3 className="font-medium flex items-center justify-between mb-4">
                    Realtime
                    <span className="text-[12px] font-normal text-secondary flex items-center gap-1">
                      Updating live <span className="relative flex h-2 w-2 shadow"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span></span>
                    </span>
                  </h3>
                  
                  <div className="border-b border-border-light pb-4 mb-4">
                     <p className="text-xs text-secondary">Subscribers</p>
                     <p className="text-2xl mt-1">0</p>
                  </div>
                  
                  <div>
                     <p className="text-xs text-secondary">Views · Last 48 hours</p>
                     <p className="text-2xl mt-1">0</p>
                     <div className="h-[60px] flex items-end gap-1 mt-4">
                       {Array.from({length: 24}).map((_, i) => (
                         <div key={i} className="flex-1 bg-border-light rounded-t-sm hover:bg-accent-blue transition-colors" style={{height: `${Math.max(5, Math.random() * 20)}%`}}></div>
                       ))}
                     </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border-light text-center">
                     <span className="text-accent-blue text-sm font-medium uppercase cursor-pointer hover:text-blue-400">See live count</span>
                  </div>
               </div>
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center border border-border-light bg-surface rounded-lg">
          <div className="text-5xl opacity-30 mb-4">📊</div>
          <h2 className="text-xl font-medium text-primary mb-2 capitalize">{activeTab} Metrics Coming Soon</h2>
          <p className="text-secondary max-w-sm text-sm">Detailed {activeTab} analytics components are currently in development as part of the data processing pipeline roll-out.</p>
        </div>
      )}
    </div>
  );
}
