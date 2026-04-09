import React from 'react';

interface LiveChatPanelProps {
  streamId: string;
}

export default function LiveChatPanel({ streamId }: LiveChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-[#1F1F1F]">
      <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center justify-center text-center">
        <p className="text-[#AAAAAA] text-sm mb-2">Welcome to live chat!</p>
        <p className="text-[#AAAAAA] text-[12px] max-w-[200px]">
          Remember to guard your privacy and abide by our community guidelines.
        </p>
      </div>
      <div className="p-3 border-t border-white/10">
        <div className="bg-[#282828] rounded-full px-4 py-2 flex items-center">
          <input 
            type="text" 
            placeholder="Chat.." 
            disabled
            className="bg-transparent text-[13px] outline-none text-white w-full placeholder-[#717171]"
          />
          <button className="text-[#AAAAAA] p-1"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 1.5 8.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg></button>
          <button className="text-[#AAAAAA] p-1"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
        </div>
      </div>
    </div>
  );
}
