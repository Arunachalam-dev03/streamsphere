import React, { useState, useEffect } from 'react';
import { HiX, HiCode, HiOutlineMail } from 'react-icons/hi';
import { FaWhatsapp, FaFacebookF, FaRedditAlien } from 'react-icons/fa';
import { FiChevronRight } from 'react-icons/fi';

interface ShareModalProps {
  url: string;
  startTime?: string | number; // e.g. "5:09" or 309
  subscriberCount?: string; // e.g. "358 subscribers"
  onClose: () => void;
  onCreatePost?: () => void;
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white pr-0.5 pb-0.5">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

export default function ShareModal({
  url,
  startTime,
  subscriberCount,
  onClose,
  onCreatePost,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [startAtChecked, setStartAtChecked] = useState(false);
  const [finalUrl, setFinalUrl] = useState(url);

  // Convert startTime "5:09" to seconds for the ?t= parameter
  const getSeconds = (time: string | number) => {
    if (typeof time === 'number') return time;
    const parts = time.split(':').reverse();
    let seconds = 0;
    for (let i = 0; i < parts.length; i++) {
      seconds += parseInt(parts[i], 10) * Math.pow(60, i);
    }
    return seconds;
  };

  useEffect(() => {
    if (startAtChecked && startTime !== undefined) {
      const char = url.includes('?') ? '&' : '?';
      setFinalUrl(`${url}${char}t=${getSeconds(startTime)}`);
    } else {
      setFinalUrl(url);
    }
  }, [startAtChecked, startTime, url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const shareLinks = [
    { name: 'Embed', icon: <HiCode className="w-7 h-7" />, color: 'bg-[#F2F2F2] text-black', action: () => alert('Embed logic here') },
    { name: 'WhatsApp', icon: <FaWhatsapp className="w-7 h-7 text-white" />, color: 'bg-[#25D366]', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(finalUrl)}`, '_blank') },
    { name: 'Facebook', icon: <FaFacebookF className="w-6 h-6 text-white" />, color: 'bg-[#1877F2]', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(finalUrl)}`, '_blank') },
    { name: 'X', icon: <XIcon />, color: 'bg-[#0F1419]', action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(finalUrl)}`, '_blank') },
    { name: 'Email', icon: <HiOutlineMail className="w-7 h-7 text-white" />, color: 'bg-[#888888]', action: () => window.location.href = `mailto:?subject=Check out this video&body=${encodeURIComponent(finalUrl)}` },
    { name: 'Reddit', icon: <FaRedditAlien className="w-7 h-7 text-white" />, color: 'bg-[#FF4500]', action: () => window.open(`https://reddit.com/submit?url=${encodeURIComponent(finalUrl)}`, '_blank') },
  ];

  const handleMoreShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share Video',
          url: finalUrl,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      alert('Native Web Share not supported on this browser.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-hidden" 
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="bg-white rounded-2xl w-[90%] max-w-[500px] flex flex-col shadow-xl text-[#0F0F0F] font-roboto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 relative">
          <h2 className="text-[17px] font-semibold w-full text-center tracking-normal">Share in a post</h2>
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Create Post Section */}
        {onCreatePost && (
          <div className="flex flex-col items-center justify-center pb-6">
            <button 
              onClick={onCreatePost}
              className="bg-[#0F0F0F] text-white px-6 py-2.5 rounded-full font-medium text-[15px] hover:bg-[#272727] transition-colors"
            >
              Create post
            </button>
            {subscriberCount && (
              <span className="text-[#606060] text-[13px] mt-3">
                {subscriberCount}
              </span>
            )}
          </div>
        )}

        <hr className="border-[#E5E5E5] mx-6" />

        {/* Share Platforms */}
        <div className="px-6 py-5">
          <p className="text-[15px] font-medium mb-4 text-[#0F0F0F]">Share</p>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide shrink-0 relative pr-6">
            {shareLinks.map((platform) => (
              <button 
                key={platform.name}
                onClick={platform.action}
                className="flex flex-col items-center gap-2 group min-w-[72px]"
              >
                <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center ${platform.color} shadow-sm group-hover:scale-[1.02] transition-transform`}>
                  {platform.icon}
                </div>
                <span className="text-[12px] text-[#0F0F0F] group-hover:text-black">{platform.name}</span>
              </button>
            ))}
            {/* More Native Share */}
            <button 
              onClick={handleMoreShare}
              className="flex flex-col items-center gap-2 group min-w-[72px]"
            >
              <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center bg-[#F2F2F2] shadow-sm group-hover:scale-[1.02] transition-transform">
                <FiChevronRight className="w-8 h-8 text-[#0F0F0F]" />
              </div>
              <span className="text-[12px] text-[#0F0F0F] group-hover:text-black">More</span>
            </button>
          </div>
        </div>

        {/* URL Input Box */}
        <div className="px-6 pb-4">
          <div className="flex items-center bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg p-1.5 focus-within:border-blue-500 overflow-hidden">
            <input 
              readOnly 
              value={finalUrl} 
              className="w-full bg-transparent outline-none px-3 text-[14px] text-[#0F0F0F] truncate"
            />
            <button 
              onClick={handleCopy}
              className={`shrink-0 px-5 py-2 rounded-full font-medium text-[14px] transition-all ml-2 ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-[#065FD4] hover:bg-[#0056C2] text-white'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Start At Checkbox */}
        {startTime !== undefined && (
          <div className="px-6 pb-6 pt-2">
            <label className="flex items-center gap-4 cursor-pointer w-fit group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={startAtChecked}
                  onChange={(e) => setStartAtChecked(e.target.checked)}
                  className="peer appearance-none w-[18px] h-[18px] border-2 border-[#0F0F0F] rounded-sm checked:bg-[#0F0F0F] transition-colors cursor-pointer"
                />
                <svg 
                  className="absolute w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 peer-checked:text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[#0F0F0F] text-[14px] select-none">
                Start at <span className="text-[#606060] font-medium ml-1">{startTime}</span>
              </span>
            </label>
          </div>
        )}

      </div>
    </div>
  );
}
