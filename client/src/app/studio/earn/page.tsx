'use client';

import React, { useState } from 'react';
import { HiCurrencyDollar } from 'react-icons/hi';

type Tab = 'overview' | 'ads' | 'memberships' | 'supers';

export default function StudioEarn() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="w-full max-w-[1000px] mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6 text-primary">Earn on StreamSphere</h1>
      
      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-border-light mb-8 overflow-x-auto scrollbar-hide whitespace-nowrap">
        <button onClick={() => setActiveTab('overview')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Overview</button>
        <button onClick={() => setActiveTab('ads')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'ads' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Ads</button>
        <button onClick={() => setActiveTab('memberships')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'memberships' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Memberships</button>
        <button onClick={() => setActiveTab('supers')} className={`font-medium pb-3 px-1 transition-colors ${activeTab === 'supers' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary border-b-2 border-transparent'}`}>Supers</button>
      </div>

      {activeTab === 'overview' ? (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-accent-blue/10 rounded-full flex items-center justify-center text-accent-blue">
              <HiCurrencyDollar className="w-12 h-12" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-primary">Grow with StreamSphere</h1>
          <p className="text-secondary text-[15px] max-w-2xl mx-auto mb-12">
            Join the StreamSphere Partner Programme to earn money, get creator support, and more.
          </p>

          <div className="bg-surface border border-border-light rounded-xl p-8 max-w-2xl mx-auto text-left shadow-sm">
             <h2 className="text-lg font-medium mb-6">How to join</h2>
             
             <div className="space-y-6">
               <div>
                  <p className="text-sm font-medium mb-3">1. Reach requirements to apply</p>
                  
                  {/* Progress bar mock 1 */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-primary font-medium">0 subscribers</span>
                      <span className="text-secondary">500 required</span>
                    </div>
                    <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
                      <div className="w-0 h-full bg-accent-blue rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Progress bar mock 2 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-primary font-medium">0 public watch hours</span>
                      <span className="text-secondary">3,000 required</span>
                    </div>
                    <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
                      <div className="w-0 h-full bg-accent-blue rounded-full"></div>
                    </div>
                  </div>
               </div>
               
               <div className="border-t border-border-light pt-6">
                  <p className="text-sm font-medium mb-2">2. Complete the basics</p>
                  <div className="flex items-center gap-3 text-sm text-secondary">
                    <div className="w-5 h-5 rounded-full border border-secondary flex items-center justify-center"></div>
                    2-Step Verification
                  </div>
                  <div className="flex items-center gap-3 text-sm text-secondary mt-3">
                    <div className="w-5 h-5 rounded-full border border-border-light bg-green-500/20 text-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Follow Community Guidelines
                  </div>
               </div>
               
               <div className="pt-4">
                  <button className="w-full bg-accent-blue hover:bg-blue-600 text-white font-medium py-2.5 rounded-full transition-colors opacity-50 cursor-not-allowed">
                    Apply Now
                  </button>
               </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center border border-border-light bg-surface rounded-lg">
          <div className="text-5xl opacity-30 mb-4">💰</div>
          <h2 className="text-xl font-medium text-primary mb-2 capitalize">{activeTab} monetization coming soon</h2>
          <p className="text-secondary max-w-sm text-sm">Become a StreamSphere Partner to unlock exclusive {activeTab} revenue generation tools and features.</p>
        </div>
      )}
    </div>
  );
}
