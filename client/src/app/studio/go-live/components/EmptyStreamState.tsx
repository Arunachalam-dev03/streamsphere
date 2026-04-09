import React from 'react';

export default function EmptyStreamState() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] w-full">
      {/* Abstract Illustration Placeholder (matching the playful YouTube studio vibe) */}
      <div className="relative w-64 h-52 mb-6 pointer-events-none select-none">
        {/* We recreate a stylized SVG illustration similar to the screenshot */}
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Background circle / blob */}
          <circle cx="100" cy="90" r="70" fill="#FFC107" />
          
          {/* Monster 1 (Teal) */}
          <path d="M50 120 C 30 120, 25 80, 50 60 C 75 40, 90 70, 80 100 C 75 115, 65 120, 50 120 Z" fill="#00D2D3" />
          <circle cx="65" cy="75" r="10" fill="#FFFFFF" />
          <circle cx="68" cy="75" r="4" fill="#111111" />
          <path d="M55 95 Q 65 105 75 90" stroke="#111111" strokeWidth="3" strokeLinecap="round" fill="none" />
          
          {/* Monster 2 (Purple) */}
          <path d="M140 130 C 120 140, 110 100, 130 80 C 150 60, 170 90, 160 115 C 155 125, 150 130, 140 130 Z" fill="#9C88FF" />
          <rect x="135" y="90" width="16" height="16" rx="8" fill="#FFFFFF" />
          <rect x="138" y="94" width="8" height="8" rx="4" fill="#111111" />
          <circle cx="120" cy="70" r="12" fill="#E84118" />
          <circle cx="160" cy="140" r="15" fill="#4CD137" />
          
          {/* Confetti/Stars */}
          <path d="M70 30 L 75 45 L 90 50 L 75 55 L 70 70 L 65 55 L 50 50 L 65 45 Z" fill="#FFFA65" />
          <circle cx="150" cy="40" r="4" fill="#00A8FF" />
          <rect x="30" y="50" width="6" height="6" transform="rotate(45 30 50)" fill="#E84118" />
        </svg>
      </div>
      
      <h2 className="text-white text-[19px] font-medium mb-2">No upcoming streams</h2>
      <p className="text-[#AAAAAA] text-[14px] text-center max-w-sm">
        Schedule your stream ahead of time and let your community know when you're going live!
      </p>
    </div>
  );
}
