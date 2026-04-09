'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { liveAPI } from '@/lib/api';
import LiveChatPanel from '@/components/chat/LiveChatPanel';

interface ActiveStreamDashboardProps {
  stream: any;
  onStreamEnded: () => void;
  onKeyRegenerated: (newKey: string) => void;
}

const RTMP_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '').replace('https://', 'rtmp://').replace('http://', 'rtmp://').split(':')[0] 
  ? `rtmp://${new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').hostname}:1935/live`
  : 'rtmp://localhost:1935/live';

export default function ActiveStreamDashboard({ stream, onStreamEnded, onKeyRegenerated }: ActiveStreamDashboardProps) {
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState('Stream settings');
  const [isEnding, setIsEnding] = useState(false);
  const [localStream, setLocalStream] = useState(stream);
  const [showTour, setShowTour] = useState(true);

  // Poll for stream status changes every 3 seconds to auto-detect encoder connection
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const checkStreamStatus = async () => {
      try {
        const { data } = await liveAPI.getById(localStream.id);
        if (data) {
          setLocalStream(data);
        }
      } catch (error) {
        console.error('Failed to poll stream status:', error);
      }
    };

    if (localStream.status !== 'ENDED') {
      intervalId = setInterval(checkStreamStatus, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [localStream.id, localStream.status]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      style: { background: '#323232', color: '#fff' }
    });
  };

  const handleEndStream = async () => {
    if (!confirm('Are you sure you want to end this stream?')) return;
    setIsEnding(true);
    try {
      await liveAPI.endStream(stream.id);
      toast.success('Stream ended', { style: { background: '#323232', color: '#fff' } });
      onStreamEnded();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to end stream');
      setIsEnding(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (stream.status === 'LIVE') {
      toast.error('Cannot change key while live');
      return;
    }
    if (!confirm('Regenerate stream key? You will need to update your encoder.')) return;
    try {
      const { data } = await liveAPI.regenerateKey(stream.id);
      onKeyRegenerated(data.streamKey);
      toast.success('Stream key reset');
    } catch (error) {
      toast.error('Failed to regenerate key');
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#1F1F1F]">
      {/* Main Dashboard Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto px-6 py-6 pb-20 custom-scrollbar">
        
        {/* Top Header Actions */}
        <div className="flex justify-end mb-4 gap-3">
          <button className="p-2 hover:bg-white/10 rounded-full text-white/70 transition-colors" aria-label="Edit">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M14.06 9.02l.92.92-9.06 9.06H5v-4.06l9.06-9.06m3.9-3.9c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34zM14.06 6.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/></svg>
          </button>
          {stream.status === 'LIVE' ? (
            <button 
              onClick={handleEndStream}
              disabled={isEnding}
              className="bg-[#CC0000] text-white font-medium px-4 py-2 rounded-full hover:bg-[#FF0000] transition-colors"
            >
              {isEnding ? 'Ending...' : 'END STREAM'}
            </button>
          ) : (
             <button 
               onClick={handleEndStream}
               className="border border-white/20 text-white font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
             >
               Cancel
             </button>
          )}
        </div>

        {/* Video Player / Encoder state Box */}
        <div className="w-full bg-[#111111] rounded-xl aspect-[21/9] border border-white/10 flex flex-col mb-6 overflow-hidden relative">
          <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-xs text-white/70 flex items-center gap-2 z-10">
            <div className={`w-2 h-2 rounded-full ${localStream.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-[#AAAAAA]'}`}></div>
            {localStream.status === 'LIVE' ? 'Excellent connection' : 'No data'}
          </div>
          
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <div className="bg-black/60 px-3 py-1 rounded-full text-xs text-white">Stream key: Default stream ⌄</div>
          </div>

          {localStream.status !== 'LIVE' ? (
            <div className="flex-1 flex flex-col items-center justify-center pt-8">
              <h3 className="text-white text-xl font-medium mb-4">Connect your encoder to go live</h3>
              <p className="text-[#AAAAAA] text-sm mb-6">Copy and paste a stream key into your encoder or sign in using your StreamSphere account</p>
              <button className="bg-white/10 hover:bg-white/20 text-white text-[14px] font-medium px-4 py-2 rounded-full transition-colors mb-6">
                Learn how to use encoders
              </button>
              
              {/* Tooltip mockup */}
              {showTour && (
                <div className="bg-white text-black p-4 rounded-lg shadow-lg relative bottom-0 left-10 mt-8">
                  <div className="font-medium text-[15px] mb-2 flex justify-between items-center">
                    Welcome to Live Control Room 
                    <button onClick={() => setShowTour(false)} className="hover:bg-gray-200 rounded p-0.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                  </div>
                  <div className="flex justify-between items-center gap-8">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-[#3EA6FF] rounded-full"></div>
                      <div className="w-2 h-2 bg-black/20 rounded-full"></div>
                      <div className="w-2 h-2 bg-black/20 rounded-full"></div>
                      <div className="w-2 h-2 bg-black/20 rounded-full"></div>
                    </div>
                    <button onClick={() => setShowTour(false)} className="text-[#3EA6FF] font-medium text-sm hover:bg-[#3EA6FF]/10 px-2 py-1 rounded transition">Next</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <p className="text-red-500 font-bold text-2xl tracking-widest animate-pulse mb-3">● LIVE</p>
              <div className="flex gap-10 mt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white mb-1">{localStream.viewerCount}</p>
                  <p className="text-[#AAAAAA] text-sm uppercase">Watching</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white mb-1">{localStream.peakViewers}</p>
                  <p className="text-[#AAAAAA] text-sm uppercase">Peak</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-[#1F1F1F] p-3 text-xs text-[#AAAAAA] flex items-center border-t border-white/10">
            <div className={`w-2 h-2 rounded-full mr-2 ${localStream.status === 'LIVE' ? 'bg-[#3EA6FF]' : 'bg-[#AAAAAA]'}`}></div>
            {localStream.status === 'LIVE' ? 'Streaming live video to audience' : 'Start sending us your video from your streaming software to go live'}
          </div>
        </div>

        {/* Settings Area */}
        <div className="bg-[#282828] rounded-xl border border-white/5 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/10 px-6">
            {['Stream settings', 'Analytics', 'Stream health'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-4 font-medium text-[15px] transition-colors relative
                  ${activeTab === tab ? 'text-white' : 'text-[#AAAAAA] hover:text-white'}
                `}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'Stream settings' && (
              <div className="grid grid-cols-[1fr_300px] gap-8">
                {/* Left col settings */}
                <div>
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-white text-[15px] font-medium flex items-center gap-2">
                        Dual stream <span className="bg-[#3EA6FF]/20 text-[#3EA6FF] text-[10px] px-1.5 py-0.5 rounded font-bold">New</span>
                      </div>
                      <div className="w-10 h-5 bg-[#AAAAAA]/30 rounded-full relative">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-[#AAAAAA] rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-[#AAAAAA] text-xs">Automatically generate a vertical cropped version for the Shorts Feed. <a href="#" className="text-[#3EA6FF] hover:underline">Learn more</a></p>
                  </div>

                  <div className="mb-4">
                    <label className="text-white text-[14px] font-medium mb-2 block">Stream URL</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-black/20 rounded border border-white/10 px-3 py-2 text-white/90 font-mono text-[13px] truncate flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#AAAAAA] shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
                        {RTMP_URL}
                      </div>
                      <button onClick={() => copyToClipboard(RTMP_URL, 'Stream URL')} className="px-4 py-2 border border-white/20 rounded-full text-white text-[13px] font-medium hover:bg-white/10 transition-colors">Copy</button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="text-[#AAAAAA] text-[11px] mb-1 block">Backup server URL</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-black/20 rounded border border-white/10 px-3 py-2 text-[#AAAAAA] font-mono text-[13px] truncate flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
                        {RTMP_URL}?backup=1
                      </div>
                      <button onClick={() => copyToClipboard(`${RTMP_URL}?backup=1`, 'Backup URL')} className="px-4 py-2 border border-white/20 rounded-full text-white text-[13px] font-medium hover:bg-white/10 transition-colors">Copy</button>
                    </div>
                    <p className="text-[#AAAAAA] text-[11px] mt-1">Platform also supports RTMPS for secure connections. <a href="#" className="text-[#3EA6FF]">Learn more</a></p>
                  </div>

                  {/* Stream Key Field */}
                  <div className="bg-[#1F1F1F] p-4 rounded border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <label className="text-white text-[14px] font-medium flex items-center gap-1">
                        Stream key 
                        <svg className="w-4 h-4 text-[#AAAAAA]" fill="currentColor" viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                      </label>
                      <button 
                        onClick={handleRegenerateKey}
                        className="text-[#3EA6FF] text-[13px] font-medium hover:text-[#65B8FF]"
                      >
                        RESET
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                       <div className="flex-1 bg-black/20 rounded border border-white/10 px-3 py-2 text-white/90 font-mono text-[13px] truncate flex items-center justify-between">
                         {showKey ? localStream.streamKey : '••••••••••••••••••••••••••••••••'}
                         <button onClick={() => setShowKey(!showKey)} className="text-[#AAAAAA] hover:text-white ml-2">
                           {showKey ? <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm0-11c-5 0-9.27 3.11-11 7.5 1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 13c-3.87 0-7.33-2.12-9.17-5.5 1.84-3.38 5.3-5.5 9.17-5.5s7.33 2.12 9.17 5.5c-1.84 3.38-5.3 5.5-9.17 5.5z"/></svg> : <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.43.43L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.42-.08.65 0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>}
                         </button>
                       </div>
                       <button onClick={() => copyToClipboard(localStream.streamKey, 'Stream Key')} className="px-4 py-2 border border-white/20 rounded-full text-white text-[13px] font-medium hover:bg-white/10 transition-colors">Copy</button>
                    </div>
                  </div>

                  <div className="flex gap-16 mt-8 border-t border-white/10 pt-6">
                    {/* Latency */}
                    <div>
                      <label className="text-white text-[14px] font-medium flex items-center gap-1 mb-2">
                        Stream latency <svg className="w-4 h-4 text-[#AAAAAA]" fill="currentColor" viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                      </label>
                      <div className="space-y-3 mt-4">
                        <label className="flex items-center gap-3">
                          <input type="radio" name="latency" value="normal" className="w-4 h-4 bg-transparent border-white/50" />
                          <span className="text-white text-[13px]">Normal latency</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input type="radio" name="latency" value="low" defaultChecked className="w-4 h-4 text-white" />
                          <span className="text-white text-[13px]">Low-latency</span>
                        </label>
                      </div>
                    </div>

                    {/* Additional */}
                    <div className="flex-1 max-w-[200px]">
                      <label className="text-[#AAAAAA] text-[13px] mb-4 block">Additional settings</label>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-white text-[13px]">Enable DVR</span>
                        <div className="w-8 h-4 bg-black/40 rounded-full relative border border-white/30">
                          <div className="absolute right-[2px] top-[2px] w-2.5 h-2.5 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white text-[13px]">360° video</span>
                        <div className="w-8 h-4 bg-black/40 rounded-full relative border border-white/30 border-dashed">
                          <div className="absolute left-[2px] top-[2px] w-2.5 h-2.5 bg-[#AAAAAA] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right col info */}
                <div className="bg-[#1F1F1F] rounded-lg p-5 h-fit border border-white/5 relative">
                   <button className="absolute right-3 top-3 px-3 py-1.5 border border-white/10 rounded-full text-white text-xs hover:bg-white/10 font-medium transition-colors">Edit</button>
                   <div className="text-[11px] text-[#AAAAAA] mb-1">Title</div>
                   <div className="text-white text-[14px] font-medium mb-4 pr-10">{localStream.title}</div>
                   
                   <div className="text-[11px] text-[#AAAAAA] mb-1">Category</div>
                   <div className="text-white text-[13px] font-medium mb-4">People and blogs</div>
                   
                   <div className="text-[11px] text-[#AAAAAA] mb-1">Privacy</div>
                   <div className="text-white text-[13px] font-medium flex items-center gap-1.5 mb-6">
                     <svg className="w-4 h-4 fill-current text-[#AAAAAA]" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg> 
                     Public
                   </div>

                   <div className="flex gap-8">
                     <div>
                       <div className="text-[11px] text-[#AAAAAA] mb-0.5">Viewers waiting</div>
                       <div className="text-white text-[16px] font-medium">0</div>
                     </div>
                     <div>
                       <div className="text-[11px] text-[#AAAAAA] mb-0.5">Likes</div>
                       <div className="text-white text-[16px] font-medium">0</div>
                     </div>
                   </div>
                </div>
              </div>
            )}
            {activeTab !== 'Stream settings' && (
              <div className="text-[#AAAAAA] text-sm text-center py-10">Data will populate when stream is active.</div>
            )}
          </div>
        </div>

      </div>

      {/* Live Chat Panel Right Side */}
      <div className="w-[340px] bg-[#282828] border-l border-white/10 flex flex-col shrink-0 h-full relative">
         <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#1F1F1F]">
           <button className="text-white text-[14px] font-medium flex items-center gap-1 hover:bg-white/10 px-2 py-1.5 rounded transition">
             Top chat <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
           </button>
           <div className="flex items-center gap-1">
             <button className="text-[#3EA6FF] text-[11px] font-bold border border-[#3EA6FF]/50 rounded-full px-2 py-0.5 bg-[#3EA6FF]/10">Top Fans</button>
             <button className="p-1 hover:bg-white/10 rounded-full text-white"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></button>
           </div>
         </div>
         <div className="flex-1 relative overflow-hidden bg-[#282828]">
           {/* Real chat component placed here. Disable input if not LIVE. */}
           <LiveChatPanel streamId={localStream.id} />
           
           {/* Q&A Tooltip Mockup from screenshot */}
           <div className="absolute bottom-16 right-4 bg-white text-black p-3 rounded-lg shadow-lg max-w-[250px] z-20">
             <div className="font-medium text-[14px] mb-1">Start a Q&A or poll</div>
             <div className="text-[12px] text-[#606060]">Let viewers ask questions or weigh in on a topic</div>
           </div>
         </div>
      </div>
    </div>
  );
}
