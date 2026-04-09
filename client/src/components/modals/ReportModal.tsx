'use client';

import React, { useState } from 'react';
import { reportAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiFlag, HiX } from 'react-icons/hi';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'VIDEO' | 'COMMENT' | 'CHANNEL';
  targetId: string;
}

const REPORT_REASONS = [
  'Sexual content',
  'Violent or repulsive content',
  'Hateful or abusive content',
  'Harassment or bullying',
  'Harmful or dangerous acts',
  'Misinformation',
  'Child abuse',
  'Spam or misleading',
  'Infringes my rights',
  'Captions issue',
];

export default function ReportModal({ isOpen, onClose, type, targetId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) { toast.error('Please select a reason'); return; }
    try {
      setSubmitting(true);
      await reportAPI.create({
        type,
        reason: selectedReason,
        description: description.trim() || undefined,
        ...(type === 'VIDEO' && { videoId: targetId }),
        ...(type === 'COMMENT' && { commentId: targetId }),
        ...(type === 'CHANNEL' && { channelId: targetId }),
      });
      toast.success('Report submitted. Thank you!');
      onClose();
      setSelectedReason('');
      setDescription('');
    } catch {
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light/10">
          <div className="flex items-center gap-2">
            <HiFlag className="w-5 h-5 text-accent-red" />
            <h3 className="text-lg font-semibold">Report {type.toLowerCase()}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-hover rounded-full transition-colors">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-secondary mb-4">Select a reason for reporting:</p>
          <div className="space-y-1.5">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors
                  ${selectedReason === reason ? 'bg-accent-red/10 text-primary ring-1 ring-accent-red/30' : 'hover:bg-hover text-secondary'}`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-accent-red"
                />
                <span className="text-sm">{reason}</span>
              </label>
            ))}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details (optional)"
            rows={2}
            className="w-full mt-4 bg-surface-200 text-sm rounded-xl px-4 py-3 text-primary placeholder:text-secondary/40
                       focus:outline-none focus:ring-1 focus:ring-accent-red/40 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border-light/10">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors rounded-full">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedReason}
            className="px-5 py-2 text-sm font-medium bg-accent-red text-white rounded-full hover:bg-accent-red/90
                       disabled:opacity-40 transition-all flex items-center gap-2"
          >
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiFlag className="w-4 h-4" />}
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
