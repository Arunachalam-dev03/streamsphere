'use client';

import React, { useState } from 'react';
import { liveAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateStreamModalProps {
  onClose: () => void;
  onSuccess: (streamData: any) => void;
}

export default function CreateStreamModal({ onClose, onSuccess }: CreateStreamModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Details State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [broadcastType, setBroadcastType] = useState('software');
  const [category, setCategory] = useState('People and blogs');

  // Next steps state (Placeholders for UI completeness)
  const [visibility, setVisibility] = useState('Public');
  const [isScheduled, setIsScheduled] = useState(false);
  
  // Format current date + 1 hr for default schedule
  const defaultDate = new Date();
  defaultDate.setHours(defaultDate.getHours() + 1);
  const [scheduledDate, setScheduledDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState(defaultDate.toTimeString().substring(0, 5));

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }
    setLoading(true);
    try {
      const { data } = await liveAPI.create({
        title: title.trim(),
        description: description.trim() || undefined,
        // Backend currently only supports title and description. 
        // Real implementation would also send category, privacy, etc.
      });
      toast.success('Stream created successfully!');
      onSuccess(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create stream');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-[#282828] w-full max-w-[800px] h-[85vh] sm:h-[700px] flex flex-col rounded-xl overflow-hidden shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Create stream</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        {/* Stepper */}
        <div className="px-16 pt-6 pb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/10 -z-10" />
            <StepItem number={1} label="Details" current={step} />
            <StepItem number={2} label="Customisation" current={step} />
            <StepItem number={3} label="Visibility" current={step} />
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-6 max-w-[600px] mx-auto animate-fade-in">
              <h3 className="text-2xl font-bold text-white mb-6">Details</h3>
              
              {/* Title Input */}
              <div className="relative border border-[#AAAAAA] rounded-md focus-within:border-[#3EA6FF] transition-colors">
                <div className="absolute left-3 top-1 text-[11px] text-[#AAAAAA]">Title (required)</div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Add a title that describes your stream"
                  className="w-full bg-transparent text-white text-[15px] px-3 pt-6 pb-2 outline-none placeholder-[#717171]"
                  maxLength={100}
                />
              </div>

              {/* Description Input */}
              <div className="relative border border-[#AAAAAA] rounded-md focus-within:border-[#3EA6FF] transition-colors">
                <div className="absolute left-3 top-1 text-[11px] text-[#AAAAAA]">Description</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers more about your stream"
                  className="w-full bg-transparent text-white text-[15px] px-3 pt-6 pb-2 outline-none resize-none placeholder-[#717171]"
                  rows={4}
                />
              </div>

              {/* Broadcast Type Dropdown */}
              <div>
                <label className="block text-white text-[15px] font-medium mb-1">How do you want to go live?</label>
                <p className="text-[#AAAAAA] text-xs mb-2">Choose a broadcast type for your stream</p>
                <select 
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-white/20 text-white rounded-md px-3 py-2.5 outline-none focus:border-[#3EA6FF]"
                >
                  <option value="software">Streaming software</option>
                  <option value="webcam">Webcam</option>
                </select>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-white text-[15px] font-medium mb-1">Category</label>
                <p className="text-[#AAAAAA] text-xs mb-2">Add your stream to a category so that viewers can find it more easily</p>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-white/20 text-white rounded-md px-3 py-2.5 outline-none focus:border-[#3EA6FF]"
                >
                  <option value="People and blogs">People and blogs</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Education">Education</option>
                </select>
              </div>

              {/* Thumbnail (Mock) */}
              <div>
                <label className="block text-white text-[15px] font-medium mb-1">Thumbnail</label>
                <p className="text-[#AAAAAA] text-xs mb-2">Select or upload a picture that represents your stream. A good thumbnail stands out and draws viewers' attention.</p>
                <div className="w-[180px] h-[100px] border border-dashed border-[#AAAAAA] rounded flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                  <svg className="w-8 h-8 text-[#AAAAAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-[600px] mx-auto animate-fade-in">
              <h3 className="text-2xl font-bold text-white mb-6">Customisation</h3>
              <p className="text-white/70 text-sm">Set up your live chat and other interaction settings.</p>
              
              <div className="bg-[#1F1F1F] rounded-lg border border-white/10 overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                  <div>
                    <h4 className="text-white font-medium">Live chat</h4>
                    <p className="text-[#AAAAAA] text-xs mt-0.5">Allow viewers to chat during your stream</p>
                  </div>
                  <div className="w-10 h-5 bg-[#3EA6FF] rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Enable slow mode</h4>
                    <p className="text-[#AAAAAA] text-xs mt-0.5">Limit how often individual users can post</p>
                  </div>
                  <div className="w-10 h-5 bg-[#AAAAAA] rounded-full relative">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-[#1F1F1F] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-[600px] mx-auto animate-fade-in pb-10">
              <h3 className="text-2xl font-bold text-white mb-6">Visibility</h3>
              <p className="text-white/70 text-sm mb-4">Choose when to publish and who can see your stream</p>
              
              <div className="bg-[#1F1F1F] border border-white/10 rounded-lg p-5 space-y-5 shadow-sm">
                
                {/* Privacy Options */}
                <div className="space-y-4">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input type="radio" name="visibility" value="Private" checked={visibility === 'Private'} onChange={(e) => setVisibility(e.target.value)} className="mt-1 w-4 h-4 accent-[#3EA6FF]" />
                    <div>
                      <div className="text-white font-medium text-[15px]">Private</div>
                      <div className="text-[#AAAAAA] text-[13px] mt-0.5">Only you and people you choose can watch your stream</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input type="radio" name="visibility" value="Unlisted" checked={visibility === 'Unlisted'} onChange={(e) => setVisibility(e.target.value)} className="mt-1 w-4 h-4 accent-[#3EA6FF]" />
                    <div>
                      <div className="text-white font-medium text-[15px]">Unlisted</div>
                      <div className="text-[#AAAAAA] text-[13px] mt-0.5">Anyone with the stream link can watch</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input type="radio" name="visibility" value="Public" checked={visibility === 'Public'} onChange={(e) => setVisibility(e.target.value)} className="mt-1 w-4 h-4 accent-[#3EA6FF]" />
                    <div>
                      <div className="text-white font-medium text-[15px]">Public</div>
                      <div className="text-[#AAAAAA] text-[13px] mt-0.5">Everyone can watch your stream</div>
                    </div>
                  </label>
                </div>

                {/* Scheduling Section */}
                <div className="border-t border-white/10 pt-5 mt-2">
                  <h4 className="text-white font-medium mb-3 text-[15px]">Schedule</h4>
                  
                  <label className="flex items-center gap-3 cursor-pointer mb-5 group">
                    <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out bg-[#1F1F1F] border border-[#AAAAAA] rounded-full group-hover:border-white">
                       <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="absolute w-0 h-0 opacity-0" />
                       <span className={`absolute left-[3px] top-[2px] bg-[#AAAAAA] w-3.5 h-3.5 rounded-full transition-transform duration-200 ${isScheduled ? 'transform translate-x-[18px] bg-[#3EA6FF]' : ''}`}></span>
                    </div>
                    <span className="text-white text-[14px]">Schedule for later</span>
                  </label>

                  {isScheduled && (
                    <div className="flex items-center gap-4 animate-fade-in bg-[#282828] p-4 rounded-md border border-[#3EA6FF]/30">
                      <div className="flex-1">
                        <label className="block text-[#AAAAAA] text-[12px] mb-1">Date</label>
                        <input 
                          type="date" 
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 text-white pb-1 outline-none focus:border-[#3EA6FF]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[#AAAAAA] text-[12px] mb-1">Time</label>
                        <input 
                          type="time" 
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 text-white pb-1 outline-none focus:border-[#3EA6FF]"
                        />
                      </div>
                    </div>
                  )}
                  {isScheduled && (
                    <p className="text-[#AAAAAA] text-[12px] mt-3 bg-white/5 p-2 rounded border-l-2 border-[#3EA6FF]">
                      <strong>Note:</strong> Your stream will be created, but you won't be able to broadcast until you connect your {broadcastType === 'software' ? 'encoder' : 'webcam'}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-white/10 bg-[#282828]">
          <div className="text-xs text-[#AAAAAA] max-w-[400px]">
             Stream setup will apply automatically. Ensure your encoder is ready.
          </div>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={handleBack} className="text-white font-medium text-[14px] hover:text-white/80 uppercase">
                Back
              </button>
            )}
            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="bg-[#3EA6FF] text-black hover:bg-[#65B8FF] font-medium text-[14px] px-6 py-2 rounded-full transition-colors"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#3EA6FF] text-black hover:bg-[#65B8FF] font-medium text-[14px] px-6 py-2 rounded-full transition-colors flex items-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StepItem({ number, label, current }: { number: number, label: string, current: number }) {
  const isPast = current > number;
  const isCurrent = current === number;
  
  return (
    <div className="flex flex-col items-center gap-2 bg-[#282828] z-10 px-4">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
        ${isPast || isCurrent ? 'bg-[#3EA6FF] text-black' : 'bg-transparent border-2 border-[#AAAAAA] text-[#AAAAAA]'}
      `}>
        {isPast ? <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg> : number}
      </div>
      <span className={`text-[13px] ${isCurrent || isPast ? 'text-white' : 'text-[#AAAAAA]'}`}>
        {label}
      </span>
    </div>
  );
}
