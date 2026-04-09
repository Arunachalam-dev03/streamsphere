'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/video/VideoPlayer';
import VideoCard from '@/components/video/VideoCard';
import SaveToPlaylistModal from '@/components/video/SaveToPlaylistModal';
import ShortsShelf from '@/components/video/ShortsShelf';
import ShareModal from '@/components/video/ShareModal';
import ReportModal from '@/components/modals/ReportModal';
import { videoAPI, commentAPI, channelAPI, playlistAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatViews, timeAgo, getInitials, formatSubscribers } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  HiThumbUp, HiThumbDown, HiShare, HiOutlineBookmark,
  HiDotsHorizontal, HiReply, HiChevronDown,
  HiDownload, HiFlag, HiPencil, HiTrash, HiCheck, HiX,
  HiSortDescending,
} from 'react-icons/hi';
import Link from 'next/link';

export default function WatchPage() {
  const params = useParams();
  const videoId = params?.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const [video, setVideo] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAutoplayNext, setIsAutoplayNext] = useState(true);
  const [savedProgress, setSavedProgress] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [commentSort, setCommentSort] = useState<'newest' | 'top'>('top');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [playlistQueue, setPlaylistQueue] = useState<any[]>([]);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const lastSavedTime = useRef(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (videoId) {
      loadVideo();
      loadRecommendations();
      loadComments();

      // Only count view once per session to prevent refresh spam
      const viewedKey = `viewed_${videoId}`;
      if (!sessionStorage.getItem(viewedKey)) {
        sessionStorage.setItem(viewedKey, '1');
        videoAPI.recordView(videoId).catch(console.error);
      }

      // Load saved progress for resume playback
      if (isAuthenticated) {
        videoAPI.getProgress(videoId).then(({ data }) => {
          if (data.progress > 0) setSavedProgress(data.progress);
        }).catch(() => {});
      }

      // Load playlist queue if playlist param exists
      const plId = searchParams.get('playlist');
      if (plId && plId !== playlistId) {
        setPlaylistId(plId);
        playlistAPI.getById(plId).then(({ data }) => {
          setPlaylistQueue(data.videos?.map((v: any) => v.video) || []);
        }).catch(() => {});
      }
    }
    // Reset refs on video change
    lastSavedTime.current = 0;
  }, [videoId]);

  const loadVideo = async () => {
    try {
      const { data } = await videoAPI.getById(videoId);
      setVideo(data);
    } catch (error) {
      console.error('Failed to load video:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const { data } = await videoAPI.getRecommendations(videoId);
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const loadComments = async (page = 1) => {
    try {
      const { data } = await commentAPI.getByVideo(videoId, page);
      if (page === 1) {
        setComments(data.comments);
      } else {
        setComments((prev) => [...prev, ...data.comments]);
      }
      setTotalComments(data.pagination.total);
      setCommentPage(page);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async (type: 'LIKE' | 'DISLIKE') => {
    if (!isAuthenticated) {
      toast.error('Sign in to like videos');
      return;
    }
    try {
      const { data } = await videoAPI.like(videoId, type);
      loadVideo(); // Refresh video data
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to subscribe');
      return;
    }
    try {
      await channelAPI.subscribe(video.user.id);
      loadVideo();
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;
    try {
      await commentAPI.create(videoId, commentText);
      setCommentText('');
      loadComments(1);
      toast.success('Comment posted');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleDownload = () => {
    try {
      // Server streams the original file directly with Content-Disposition: attachment
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const downloadUrl = `${apiBase}/videos/${videoId}/download`;
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download started!');
    } catch {
      toast.error('Download not available');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      const { data } = await commentAPI.edit(commentId, editingCommentText);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, text: data.text } : c));
      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Comment updated');
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentAPI.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotalComments(prev => prev - 1);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  // Sort comments
  const sortedComments = React.useMemo(() => {
    if (commentSort === 'top') {
      return [...comments].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }
    return comments; // already sorted by newest from server
  }, [comments, commentSort]);

  // Parse chapters from description
  const chapters = React.useMemo(() => {
    if (!video?.description) return [];
    const regex = /(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/g;
    const result: { time: string; seconds: number; title: string }[] = [];
    let match;
    while ((match = regex.exec(video.description)) !== null) {
      const parts = match[1].split(':').map(Number);
      const seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
      result.push({ time: match[1], seconds, title: match[2].trim() });
    }
    return result;
  }, [video?.description]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-accent-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-7xl mb-4">❌</div>
        <h2 className="text-2xl font-bold mb-2">Video Not Found</h2>
        <p className="text-secondary">This video might have been removed or doesn't exist.</p>
      </div>
    );
  }  const handleNextTrack = () => {
    if (recommendations && recommendations.length > 0) {
      router.push(`/watch/${recommendations[0].id}`);
    }
  };

  const handleVideoEnded = () => {
    if (!isAutoplayNext) return;
    // Playlist continuous playback: advance to next video in queue
    if (playlistQueue.length > 0) {
      const currentIndex = playlistQueue.findIndex((v: any) => v.id === videoId);
      if (currentIndex >= 0 && currentIndex < playlistQueue.length - 1) {
        const nextVideo = playlistQueue[currentIndex + 1];
        router.push(`/watch/${nextVideo.id}?playlist=${playlistId}`);
        return;
      }
    }
    // Fall back to recommendation autoplay
    if (recommendations && recommendations.length > 0) {
      handleNextTrack();
    }
  };

  const renderSidebar = () => (
    <>
      {/* Playlist Queue */}
      {playlistQueue.length > 0 && (
        <div className="mb-6 bg-surface rounded-xl border border-border-light/10 overflow-hidden">
          <div className="p-3 bg-surface-200/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Playlist</h3>
              <p className="text-xs text-secondary">{playlistQueue.findIndex(v => v.id === videoId) + 1} / {playlistQueue.length}</p>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {playlistQueue.map((v: any, idx: number) => (
              <Link
                key={v.id}
                href={`/watch/${v.id}?playlist=${playlistId}`}
                className={`flex items-center gap-2 px-3 py-2 hover:bg-hover transition-colors
                  ${v.id === videoId ? 'bg-accent-red/10 border-l-2 border-accent-red' : 'border-l-2 border-transparent'}`}
              >
                <span className="text-xs text-secondary w-5 text-center shrink-0">{idx + 1}</span>
                <div className="w-16 aspect-video rounded overflow-hidden bg-surface-200 shrink-0">
                  {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium line-clamp-2 ${v.id === videoId ? 'text-accent-red' : ''}`}>{v.title}</p>
                  <p className="text-[10px] text-secondary">{v.user?.displayName}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <h3 className="text-sm font-bold mb-4 text-secondary uppercase tracking-wider">Related Videos</h3>
      <div className="space-y-3">
        {recommendations.slice(0, 2).map((rec) => (
          <VideoCard key={rec.id} video={rec} layout="list" />
        ))}
        {/* Inject ShortsShelf exactly like YouTube does in the related feed */}
        <div className="py-2 block">
          <ShortsShelf isSidebarMode={true} />
        </div>
        {recommendations.slice(2).map((rec) => (
          <VideoCard key={rec.id} video={rec} layout="list" />
        ))}
      </div>
    </>
  );

  return (
    <>
    <div className={`mx-auto w-full transition-all duration-300 ${isTheaterMode ? 'max-w-none' : 'max-w-[1800px] px-4 py-6'}`}>
      <div className={`flex flex-col ${isTheaterMode ? '' : 'xl:flex-row gap-6'}`}>
        
        {/* Main content */}
        <div className="flex-1 min-w-0">
          
          {/* Video Player wrapper */}
          <div className={isTheaterMode ? 'w-full bg-black mb-6 border-b border-border-light/10' : ''}>
            <div className={isTheaterMode ? 'max-w-[1800px] mx-auto' : ''}>
              <VideoPlayer
                src={video.hlsUrl || ''}
                poster={video.thumbnailUrl}
                autoPlay
                startTime={savedProgress}
                isTheaterMode={isTheaterMode}
                onTheaterModeToggle={() => setIsTheaterMode(!isTheaterMode)}
                isAutoplayNext={isAutoplayNext}
                onAutoplayNextToggle={setIsAutoplayNext}
                hasNextTrack={recommendations && recommendations.length > 0}
                onNextTrack={handleNextTrack}
                onEnded={handleVideoEnded}
                onTimeUpdate={(time) => {
                  // Save progress every 10 seconds
                  if (isAuthenticated && Math.abs(time - lastSavedTime.current) >= 10) {
                    lastSavedTime.current = time;
                    videoAPI.saveProgress(videoId, time).catch(() => {});
                  }
                }}
              />
            </div>
          </div>

          <div className={isTheaterMode ? 'max-w-[1800px] mx-auto px-4 lg:px-8 xl:px-4 flex flex-col xl:flex-row gap-6' : 'mt-4'}>
            
            <div className="flex-1 min-w-0">
              {/* Video Info */}
              <div>
                <h1 className="text-xl font-bold leading-snug">{video.title}</h1>

                {/* Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                  {/* Channel info */}
                  <div className="flex items-center gap-4">
                    <Link href={`/@${video.user.username}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center text-sm font-bold overflow-hidden">
                        {video.user.avatar ? (
                          <img src={video.user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(video.user.displayName)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1">
                          {video.user.displayName}
                          {video.user.isVerified && <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                        </p>
                        <p className="text-xs text-secondary">
                          {formatSubscribers(video.user.subscriberCount || 0)}
                        </p>
                      </div>
                    </Link>
                    {user?.id !== video.user.id && (
                      <button
                        onClick={handleSubscribe}
                        className={video.isSubscribed ? 'btn-subscribed' : 'btn-subscribe'}
                      >
                        {video.isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </button>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-full pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 w-full sm:w-auto">
                    <div className="flex items-center bg-hover rounded-full overflow-hidden shrink-0">
                      <button
                        onClick={() => handleLike('LIKE')}
                        className={`flex items-center gap-2 px-4 py-2 hover:bg-hover transition-colors text-sm
                          ${video.userLike === 'LIKE' ? 'text-primary-400' : ''}`}
                      >
                        <HiThumbUp className="w-5 h-5" />
                        <span>{video.likesCount}</span>
                      </button>
                      <div className="w-px h-6 bg-white/20" />
                      <button
                        onClick={() => handleLike('DISLIKE')}
                        className={`px-4 py-2 hover:bg-hover transition-colors
                          ${video.userLike === 'DISLIKE' ? 'text-primary-400' : ''}`}
                      >
                        <HiThumbDown className="w-5 h-5" />
                      </button>
                    </div>
                    <button onClick={handleShare} className="btn-secondary flex items-center gap-2 shrink-0">
                      <HiShare className="w-5 h-5" />
                      Share
                    </button>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) { toast.error('Sign in to save videos'); return; }
                        setShowSaveModal(true);
                      }}
                      className="btn-secondary flex items-center gap-2 shrink-0"
                    >
                      <HiOutlineBookmark className="w-5 h-5" />
                      Save
                    </button>
                    <button onClick={handleDownload} className="btn-secondary flex items-center gap-2 shrink-0">
                      <HiDownload className="w-5 h-5" />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) { toast.error('Sign in to report'); return; }
                        setShowReportModal(true);
                      }}
                      className="btn-secondary flex items-center gap-2 shrink-0"
                    >
                      <HiFlag className="w-5 h-5" />
                      Report
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4 bg-surface rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <span>{formatViews(video.views)}</span>
                    <span className="text-secondary">•</span>
                    <span className="text-secondary">{timeAgo(video.createdAt)}</span>
                  </div>
                  <div className={`text-sm text-secondary leading-relaxed whitespace-pre-wrap break-words ${!descriptionExpanded ? 'line-clamp-3' : ''}`}>
                    {video.description || 'No description.'}
                  </div>
                  {video.description && video.description.length > 100 && (
                    <button
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      className="text-sm font-medium mt-2 hover:text-primary transition-colors"
                    >
                      {descriptionExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {video.tags.map((t: any) => (
                        <Link
                          key={t.tag.id}
                          href={`/search?q=${t.tag.name}`}
                          className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          #{t.tag.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Chapters */}
              {chapters.length > 0 && (
                <div className="mt-4 bg-surface rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-accent-red rounded-full" /> Chapters
                  </h3>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {chapters.map((ch, i) => (
                      <button
                        key={i}
                        className="shrink-0 px-3 py-1.5 bg-surface-200 hover:bg-surface-300 rounded-lg text-xs text-secondary hover:text-primary transition-colors"
                        title={ch.title}
                      >
                        <span className="font-mono text-primary-400">{ch.time}</span>
                        <span className="ml-1.5">{ch.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="mt-6">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-lg font-bold">{totalComments} Comments</h2>
                  <div className="flex items-center gap-1">
                    <HiSortDescending className="w-4 h-4 text-secondary" />
                    <button
                      onClick={() => setCommentSort('top')}
                      className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${commentSort === 'top' ? 'text-primary bg-surface-200' : 'text-secondary hover:text-primary'}`}
                    >
                      Top
                    </button>
                    <button
                      onClick={() => setCommentSort('newest')}
                      className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${commentSort === 'newest' ? 'text-primary bg-surface-200' : 'text-secondary hover:text-primary'}`}
                    >
                      Newest
                    </button>
                  </div>
                </div>

                {/* Comment input */}
                {isAuthenticated ? (
                  <form onSubmit={handleComment} className="flex gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user?.displayName || 'U')
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent border-b border-border-light/20 focus:border-white pb-2
                                  text-sm focus:outline-none transition-colors placeholder-secondary/80"
                      />
                      {commentText && (
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setCommentText('')}
                            className="btn-ghost text-xs"
                          >
                            Cancel
                          </button>
                          <button type="submit" className="btn-primary text-xs px-4 py-1.5">
                            Comment
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="text-sm text-secondary mb-6">
                    <Link href="/auth/login" className="text-primary-400 hover:underline">Sign in</Link> to leave a comment.
                  </div>
                )}

                {/* Comments list */}
                <div className="space-y-5">
                  {sortedComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 animate-fade-in">
                      <Link href={`/@${comment.user.username}`} className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center text-xs font-bold overflow-hidden">
                          {comment.user.avatar ? (
                            <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(comment.user.displayName)
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/@${comment.user.username}`} className="text-sm font-medium hover:text-primary-400 transition-colors">
                            @{comment.user.username}
                          </Link>
                          <span className="text-xs text-secondary/80">{timeAgo(comment.createdAt)}</span>
                          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                            <span className="text-xs text-secondary/50">(edited)</span>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="w-full bg-transparent border-b border-border-light/20 focus:border-white pb-2 text-sm focus:outline-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleEditComment(comment.id)} className="text-xs btn-primary px-3 py-1 flex items-center gap-1">
                                <HiCheck className="w-3.5 h-3.5" /> Save
                              </button>
                              <button onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} className="text-xs btn-ghost px-3 py-1 flex items-center gap-1">
                                <HiX className="w-3.5 h-3.5" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-secondary leading-relaxed">{comment.text}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <button 
                            onClick={async () => {
                              if (!isAuthenticated) { toast.error('Sign in to like comments'); return; }
                              try {
                                const { data } = await commentAPI.like(comment.id);
                                setComments(prev => prev.map(c => 
                                  c.id === comment.id ? { ...c, likesCount: data.likesCount, _userLiked: data.liked } : c
                                ));
                              } catch { toast.error('Failed to like comment'); }
                            }}
                            className={`flex items-center gap-1 text-xs transition-colors ${comment._userLiked ? 'text-primary-400' : 'text-secondary hover:text-primary'}`}
                          >
                            <HiThumbUp className="w-4 h-4" />
                            <span>{comment.likesCount || ''}</span>
                          </button>
                          <button className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors">
                            <HiThumbDown className="w-4 h-4" />
                          </button>
                          <button className="text-xs text-secondary hover:text-primary transition-colors font-medium">
                            Reply
                          </button>
                          {user?.id === comment.user.id && editingCommentId !== comment.id && (
                            <>
                              <button
                                onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text); }}
                                className="text-xs text-secondary hover:text-primary transition-colors flex items-center gap-1"
                              >
                                <HiPencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-secondary hover:text-accent-red transition-colors flex items-center gap-1"
                              >
                                <HiTrash className="w-3.5 h-3.5" /> Delete
                              </button>
                            </>
                          )}
                        </div>
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {comment.replies.map((reply: any) => (
                              <div key={reply.id} className="flex gap-3">
                                <div className="w-7 h-7 rounded-full bg-accent-purple flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                  {reply.user.avatar ? (
                                    <img src={reply.user.avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    getInitials(reply.user.displayName)
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-medium">@{reply.user.username}</span>
                                    <span className="text-xs text-secondary/80">{timeAgo(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-secondary">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                            {comment._count?.replies > comment.replies.length && (
                              <button className="flex items-center gap-1 text-xs text-primary-400 font-medium ml-10">
                                <HiChevronDown className="w-4 h-4" />
                                {comment._count.replies - comment.replies.length} more replies
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations sidebar (Theater Mode) */}
            {isTheaterMode && (
              <div className="xl:w-[400px] shrink-0">
                {renderSidebar()}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations sidebar (Normal Mode) */}
        {!isTheaterMode && (
          <div className="xl:w-[400px] shrink-0">
            {renderSidebar()}
          </div>
        )}
      </div>
    </div>

    {showSaveModal && video && (
      <SaveToPlaylistModal videoId={video.id} onClose={() => setShowSaveModal(false)} />
    )}
    
    {showShareModal && video && (
      <ShareModal 
        url={typeof window !== 'undefined' ? window.location.href : `https://streamsphere.arunai.pro/watch/${video.id}`}
        subscriberCount={video.user?.subscriberCount ? formatSubscribers(video.user.subscriberCount) + ' subscribers' : undefined}
        onClose={() => setShowShareModal(false)}
      />
    )}

    {showReportModal && video && (
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="VIDEO"
        targetId={video.id}
      />
    )}
    </>
  );
}
