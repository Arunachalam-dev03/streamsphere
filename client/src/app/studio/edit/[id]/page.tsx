'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { videoAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { HiArrowLeft, HiPhotograph, HiCheckCircle } from 'react-icons/hi';

export default function EditVideoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'UNLISTED'>('PUBLIC');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  
  // New Thumbnail Upload
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/auth/login?redirect=/studio');
      return;
    }
    if (isAuthenticated && user) {
      loadVideo();
    }
  }, [isAuthenticated, isHydrated, user, params.id]);

  const loadVideo = async () => {
    try {
      const { data } = await videoAPI.getById(params.id);
      const video = data.video || data;
      
      // Ensure user owns this video
      if (video.user?.id !== user?.id && video.userId !== user?.id) {
        toast.error('You do not have permission to edit this video');
        router.push('/studio');
        return;
      }
      
      setTitle(video.title || '');
      setDescription(video.description || '');
      setPrivacy(video.privacy || 'PUBLIC');
      setThumbnailUrl(video.thumbnailUrl || '');
    } catch (err: any) {
      toast.error('Failed to load video details');
      router.push('/studio');
    } finally {
      setLoading(false);
    }
  };

  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const img = e.target.files[0];
      setThumbnailFile(img);
      setThumbnailPreview(URL.createObjectURL(img));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      // Update details
      await videoAPI.update(params.id, {
        title: title.trim(),
        description: description.trim(),
        privacy,
      });

      // Upload new thumbnail if selected
      if (thumbnailFile) {
        await videoAPI.uploadThumbnail(params.id, thumbnailFile);
      }

      toast.success('Video updated successfully');
      router.push('/studio');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update video');
      setSaving(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-red border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/studio" className="p-2 hover:bg-hover rounded-full transition-colors">
          <HiArrowLeft className="w-5 h-5 text-secondary" />
        </Link>
        <h1 className="text-2xl font-bold">Edit Video</h1>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl p-6 border border-border-light/10">
            <h2 className="text-lg font-semibold mb-4">Video Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-secondary">
                  Title (required)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full bg-page border border-border-light/20 rounded-xl px-4 py-2.5 text-primary
                             focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="Add a title that describes your video"
                />
                <div className="text-right text-xs text-secondary mt-1">
                  {title.length}/100
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-secondary">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  className="w-full bg-page border border-border-light/20 rounded-xl px-4 py-2.5 text-primary
                             focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  placeholder="Tell your viewers about your video"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Thumbnail */}
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl p-6 border border-border-light/10">
            <h2 className="text-lg font-semibold mb-4">Visibility</h2>
            <div className="space-y-3">
              {[
                { value: 'PUBLIC', label: 'Public', desc: 'Everyone can watch' },
                { value: 'UNLISTED', label: 'Unlisted', desc: 'Anyone with the link can watch' },
                { value: 'PRIVATE', label: 'Private', desc: 'Only you can watch' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-start gap-3 p-3 rounded-xl border border-border-light/10 cursor-pointer hover:bg-hover transition-colors">
                  <input
                    type="radio"
                    name="privacy"
                    value={opt.value}
                    checked={privacy === opt.value}
                    onChange={(e) => setPrivacy(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm text-primary">{opt.label}</div>
                    <div className="text-xs text-secondary mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-border-light/10">
            <h2 className="text-lg font-semibold mb-4">Thumbnail</h2>
            
            <div className="relative aspect-video rounded-xl overflow-hidden bg-page border border-border-light/20 group">
              {thumbnailPreview || thumbnailUrl ? (
                <img 
                  src={thumbnailPreview || thumbnailUrl} 
                  alt="Thumbnail preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary">
                  <HiPhotograph className="w-8 h-8 opacity-50 mb-2" />
                  <span className="text-sm">No thumbnail</span>
                </div>
              )}
              
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity
                              flex flex-col items-center justify-center cursor-pointer">
                <HiPhotograph className="w-8 h-8 text-white mb-2" />
                <span className="text-sm font-medium text-white">Change Thumbnail</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onThumbnailChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-secondary mt-3">
              Select or upload a custom picture that shows what's in your video. A good thumbnail stands out.
            </p>
          </div>

          {/* Schedule Publishing */}
          <div className="bg-surface rounded-2xl p-6 border border-border-light/10">
            <h2 className="text-lg font-semibold mb-4">Schedule</h2>
            <p className="text-xs text-secondary mb-3">Set a date and time to automatically publish this video.</p>
            <div className="flex flex-col gap-3">
              <input
                type="datetime-local"
                id="schedule-input"
                className="w-full bg-page border border-border-light/20 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:border-primary-500 transition-colors text-primary"
              />
              <button
                type="button"
                onClick={async () => {
                  const el = document.getElementById('schedule-input') as HTMLInputElement;
                  if (!el?.value) { toast.error('Select a date and time'); return; }
                  try {
                    await videoAPI.schedule(params.id, new Date(el.value).toISOString());
                    toast.success('Video scheduled for publishing!');
                    setPrivacy('PRIVATE');
                  } catch {
                    toast.error('Failed to schedule');
                  }
                }}
                className="btn-secondary text-sm flex items-center justify-center gap-2"
              >
                📅 Schedule Publish
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <><HiCheckCircle className="w-5 h-5" /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
