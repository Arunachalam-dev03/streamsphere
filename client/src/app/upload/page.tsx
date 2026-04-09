'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { videoAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { HiUpload, HiFilm, HiX, HiCheckCircle, HiPhotograph, HiOutlineInformationCircle } from 'react-icons/hi';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  // Step 1: File
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'UNLISTED'>('PUBLIC');
  const [tags, setTags] = useState('');
  
  // Thumbnail
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [detailsSaving, setDetailsSaving] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  // Handle Thumbnail Selection
  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const img = e.target.files[0];
      setThumbnailFile(img);
      setThumbnailPreview(URL.createObjectURL(img));
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const videoFile = acceptedFiles[0];
      setFile(videoFile);
      
      const name = videoFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const autoTitle = name.charAt(0).toUpperCase() + name.slice(1);
      setTitle(autoTitle);
      
      // Move to details step immediately
      setStep(2);
      setUploading(true);
      setProgress(0);
      setUploadError(null);

      // Start actual upload in background
      try {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('title', autoTitle);
        formData.append('privacy', 'PRIVATE'); // Upload as private initially until saved

        const res = await videoAPI.upload(formData, (pct) => setProgress(pct));
        setVideoId(res.data?.video?.id || res.data?.id || res.data); // Handle {video: {id}}, {id}, or raw string
        toast.success('Upload complete! You can now save your details.');
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Upload failed';
        setUploadError(msg);
        toast.error(msg);
      } finally {
        setUploading(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'],
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
  });

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId) {
      toast.error('Please wait for the video file to finish uploading first.');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setDetailsSaving(true);
    try {
      // 1. Update metadata
      const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await videoAPI.update(videoId, {
        title,
        description,
        privacy,
        tags: tagArray
      });

      // 2. Upload Custom Thumbnail if selected
      if (thumbnailFile) {
        await videoAPI.uploadThumbnail(videoId, thumbnailFile);
      }

      setUploaded(true);
      toast.success('Video details saved and published!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save details');
    } finally {
      setDetailsSaving(false);
    }
  };

  const resetUpload = () => {
    setUploaded(false);
    setStep(1);
    setFile(null);
    setVideoId(null);
    setTitle('');
    setDescription('');
    setTags('');
    setProgress(0);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleDiscard = async () => {
    if (videoId && !uploaded) {
      if (!window.confirm('Are you sure you want to discard this upload? The video will be deleted.')) {
        return;
      }
      try {
        setDetailsSaving(true);
        await videoAPI.delete(videoId);
        toast.success('Upload discarded');
      } catch (err) {
        console.error('Failed to delete video on discard:', err);
      } finally {
        setDetailsSaving(false);
      }
    }
    resetUpload();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-secondary mb-6">You need to be signed in to upload videos.</p>
          <Link href="/auth/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (uploaded && videoId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-scale-in glass p-6 md:p-12 rounded-3xl max-w-lg mx-auto">
          <HiCheckCircle className="w-24 h-24 text-accent-green mx-auto mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
          <h2 className="text-3xl font-bold mb-3">Upload Complete!</h2>
          <p className="text-secondary mb-8">
            Your video details have been saved. It is currently processing and will be visible on your channel shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/watch/${videoId}`} className="btn-primary">View Video</Link>
            <button onClick={resetUpload} className="btn-secondary">
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Upload Video</h1>
        {step === 2 && (
           <button type="button" onClick={handleDiscard} className="p-2 hover:bg-hover rounded-full transition-colors group">
             <HiX className="w-6 h-6 text-secondary group-hover:text-white" />
           </button>
        )}
      </div>

      {step === 1 && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-3xl p-8 md:p-20 text-center cursor-pointer transition-all duration-300
            ${isDragActive
              ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
              : 'border-border-light hover:border-primary-500/50 hover:bg-surface-800/30'
            }`}
        >
          <input {...getInputProps()} />
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <HiUpload className="w-10 h-10 text-primary-500" />
          </div>
          <p className="text-2xl font-semibold mb-3">
            {isDragActive ? 'Drop your video here' : 'Select video to upload'}
          </p>
          <p className="text-secondary mb-8">Your video will be private until you publish it.</p>
          <button className="btn-primary px-8">Select File</button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSaveDetails} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-4 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold mb-6">Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Title (required)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field bg-page/50 text-lg py-3"
                  placeholder="Add a title that describes your video"
                  required
                  maxLength={100}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-secondary/50">{title.length}/100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field bg-page/50 min-h-[160px] resize-y"
                  placeholder="Tell viewers about your video"
                  maxLength={5000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Custom Thumbnail</label>
                <p className="text-xs text-secondary mb-3">Select a picture that shows what's in your video.</p>
                <div className="flex items-start gap-4">
                  <label className="w-40 h-[90px] border-2 border-dashed border-border-light hover:border-primary-500 hover:bg-surface-800/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0">
                    <input type="file" accept="image/*" className="hidden" onChange={onThumbnailChange} />
                    <HiPhotograph className="w-6 h-6 text-secondary mb-1" />
                    <span className="text-xs text-secondary">Upload file</span>
                  </label>
                  
                  {thumbnailPreview && (
                    <div className="w-40 h-[90px] rounded-xl overflow-hidden relative border border-border shrink-0">
                      <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setThumbnailPreview(null); setThumbnailFile(null); }}
                        className="absolute top-1 right-1 p-1 bg-black/70 rounded-full hover:bg-black"
                      >
                        <HiX className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="glass rounded-2xl p-4 sm:p-8 space-y-6">
               <h2 className="text-xl font-bold mb-6">Visibility & Meta</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Privacy</label>
                    <select
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value as any)}
                      className="input-field bg-page/50"
                    >
                      <option value="PUBLIC">🌍 Public - Everyone can watch</option>
                      <option value="UNLISTED">🔗 Unlisted - Anyone with link</option>
                      <option value="PRIVATE">🔒 Private - Only you</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Tags</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="input-field bg-page/50"
                      placeholder="gaming, vlog, tutorial"
                    />
                    <p className="text-xs text-secondary/50 mt-1">Separate keywords with commas</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column: Status & Save */}
          <div className="space-y-6">
             {/* Upload Status Card */}
             <div className="glass rounded-2xl overflow-hidden sticky top-24">
               <div className="aspect-video bg-black flex items-center justify-center relative border-b border-border/50">
                   {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover opacity-80" />
                   ) : (
                      <HiFilm className="w-12 h-12 text-white/20" />
                   )}
                   
                   {uploading && (
                     <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                        <div className="text-white font-medium mb-3 flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"/>
                          Uploading... {progress}%
                        </div>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                     </div>
                   )}
                   {!uploading && !uploadError && videoId && (
                     <div className="absolute top-2 right-2 bg-accent-green/90 text-white text-xs px-2 py-1 rounded backdrop-blur font-medium flex items-center gap-1">
                       <HiCheckCircle className="w-4 h-4"/> Uploaded
                     </div>
                   )}
               </div>
               
               <div className="p-6 bg-surface-800/20">
                 <div className="mb-4">
                   <p className="text-xs text-secondary mb-1">Filename</p>
                   <p className="text-sm font-medium truncate" title={file?.name}>{file?.name}</p>
                 </div>
                 
                 {uploadError ? (
                    <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg flex items-start gap-2 text-accent-red">
                      <HiOutlineInformationCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm">{uploadError}</p>
                    </div>
                 ) : (
                    <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-start gap-2 text-primary-400">
                      <HiOutlineInformationCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm">Video processing will begin as soon as the file upload completes and you hit Save.</p>
                    </div>
                 )}
               </div>

               <div className="p-6 border-t border-border-light bg-page/30 flex justify-end gap-3">
                 <button
                   type="button"
                   onClick={handleDiscard}
                   disabled={uploading || detailsSaving}
                   className="btn-secondary py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Discard
                 </button>
                 <button
                   type="submit"
                   disabled={!file || !title.trim() || uploading || detailsSaving || !!uploadError}
                   className="btn-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                 >
                   {uploadError ? 'Upload Failed' : uploading ? 'Wait for Upload...' : detailsSaving ? 'Publishing...' : 'Save & Publish'}
                   {!uploading && !detailsSaving && !uploadError && (
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"/>
                   )}
                 </button>
               </div>
             </div>
          </div>

        </form>
      )}
    </div>
  );
}

