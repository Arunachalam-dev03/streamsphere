'use client';

import React from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default function StudioFeedback() {
  return (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="px-8 py-12 text-center">
        
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center text-primary/50 shadow-sm border border-border-light">
            <HiOutlineExclamationCircle className="w-12 h-12" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-primary">Send Feedback</h1>
        <p className="text-secondary text-[15px] max-w-xl mx-auto mb-10">
          Describe your issue or share your ideas. Your feedback helps make StreamSphere better for everyone.
        </p>

        <div className="bg-surface border border-border-light rounded-xl p-8 max-w-xl mx-auto text-left shadow-sm">
           <textarea 
             className="w-full bg-page border border-border-light rounded-lg p-4 text-[14px] text-primary outline-none focus:border-accent-blue transition-colors resize-none placeholder-secondary"
             rows={6}
             placeholder="Tell us what prompted this feedback..."
             disabled
           ></textarea>
           
           <div className="mt-4 flex items-start gap-3">
              <input type="checkbox" id="screenshot" className="mt-1" disabled />
              <label htmlFor="screenshot" className="text-sm text-secondary cursor-not-allowed">
                Include screenshot
                <span className="block text-[12px] opacity-70 mt-0.5">StreamSphere will capture your current screen automatically.</span>
              </label>
           </div>
           
           <div className="border-t border-border-light mt-6 pt-6">
              <p className="text-[12px] text-secondary text-justify mb-6">
                Some account and system information may be sent to StreamSphere. We will use it to fix problems and improve our services, subject to our Privacy Policy and Terms of Service. We may email you for more information or updates. 
              </p>
              <div className="flex justify-end gap-3">
                 <button className="text-sm font-medium text-secondary hover:text-primary px-4 py-2 uppercase opacity-50 cursor-not-allowed">Cancel</button>
                 <button className="bg-accent-blue text-white text-sm font-medium px-6 py-2 rounded uppercase hover:bg-blue-600 transition-colors opacity-50 cursor-not-allowed">Send</button>
              </div>
           </div>
        </div>
        
      </div>
    </div>
  );
}
