'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { playlistAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatViews, timeAgo } from '@/lib/utils';
import { MdPlaylistPlay } from 'react-icons/md';
import { HiPlay, HiTrash, HiUserAdd, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collabUsername, setCollabUsername] = useState('');

  useEffect(() => {
    if (params?.id) loadPlaylist();
  }, [params?.id]);

  const loadPlaylist = async () => {
    try {
      const { data } = await playlistAPI.getById(params!.id as string);
      setPlaylist(data);
    } catch (err) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    try {
      await playlistAPI.removeVideo(params!.id as string, videoId);
      setPlaylist((prev: any) => ({
        ...prev,
        videos: prev.videos.filter((v: any) => v.video.id !== videoId),
      }));
      toast.success('Removed from playlist');
    } catch {
      toast.error('Failed to remove video');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Delete this playlist?')) return;
    try {
      await playlistAPI.delete(params!.id as string);
      toast.success('Playlist deleted');
      router.push('/playlists');
    } catch {
      toast.error('Failed to delete playlist');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-red border-t-transparent" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">Playlist not found</h2>
      </div>
    );
  }

  const isOwner = user?.id === playlist.user?.id;
  const videos = playlist.videos || [];
  const firstThumb = videos[0]?.video?.thumbnailUrl;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-6 p-6">
      {/* Left: Playlist Info Panel */}
      <div className="lg:w-80 xl:w-96 shrink-0">
        <div className="sticky top-20 bg-gradient-to-b from-accent-red/20 to-surface rounded-2xl overflow-hidden border border-border-light/10">
          <div className="aspect-video w-full bg-surface relative overflow-hidden">
            {firstThumb ? (
              <img src={firstThumb} alt="" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MdPlaylistPlay className="w-16 h-16 text-secondary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-xl font-bold text-white">{playlist.title}</h1>
              <p className="text-sm text-white/70 mt-1">{playlist.user?.displayName}</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span>{videos.length} videos</span>
              <span>•</span>
              <span className="capitalize">{playlist.privacy?.toLowerCase()}</span>
            </div>

            {playlist.description && (
              <p className="text-sm text-secondary whitespace-pre-wrap">{playlist.description}</p>
            )}

            {videos.length > 0 && (
              <Link
                href={`/watch/${videos[0].video.id}?playlist=${params!.id}`}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <HiPlay className="w-5 h-5" /> Play All
              </Link>
            )}

            {isOwner && (
              <button
                onClick={handleDeletePlaylist}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:bg-red-500/10 rounded-full py-2 transition-colors"
              >
                <HiTrash className="w-4 h-4" /> Delete Playlist
              </button>
            )}

            {/* Collaborators */}
            {isOwner && (
              <div className="border-t border-border-light/10 pt-3">
                <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Collaborators</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={collabUsername}
                    onChange={(e) => setCollabUsername(e.target.value)}
                    placeholder="Username"
                    className="flex-1 bg-page border border-border-light/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-500"
                  />
                  <button
                    onClick={async () => {
                      if (!collabUsername.trim()) return;
                      try {
                        await playlistAPI.addCollaborator(params!.id as string, collabUsername.trim());
                        loadPlaylist();
                        setCollabUsername('');
                        toast.success('Collaborator added');
                      } catch (e: any) {
                        toast.error(e.response?.data?.error || 'Failed to add');
                      }
                    }}
                    className="p-1.5 bg-accent-red text-white rounded-lg hover:bg-accent-red/90 transition-colors"
                  >
                    <HiUserAdd className="w-4 h-4" />
                  </button>
                </div>
                {playlist.collaborators?.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent-purple flex items-center justify-center text-[10px] font-bold overflow-hidden">
                        {c.user.avatar ? <img src={c.user.avatar} className="w-full h-full object-cover" /> : c.user.displayName?.[0]}
                      </div>
                      <span className="text-xs">@{c.user.username}</span>
                    </div>
                    <button
                      onClick={async () => {
                        await playlistAPI.removeCollaborator(params!.id as string, c.user.id);
                        loadPlaylist();
                        toast.success('Removed');
                      }}
                      className="p-1 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <HiX className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Video List */}
      <div className="flex-1 min-w-0">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl border border-border-light/5">
            <MdPlaylistPlay className="w-16 h-16 text-secondary/30 mb-4" />
            <h2 className="text-lg font-semibold mb-1">No videos in this playlist</h2>
            <p className="text-sm text-secondary">Add videos from the watch page.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((item: any, index: number) => {
              const v = item.video;
              return (
                <div key={v.id} className="flex gap-3 group rounded-xl hover:bg-hover p-2 transition-colors">
                  <span className="text-sm text-secondary self-center w-6 text-center shrink-0">{index + 1}</span>
                  <Link href={`/watch/${v.id}`} className="relative aspect-video w-40 shrink-0 rounded-lg overflow-hidden bg-surface">
                    <img src={v.thumbnailUrl || '/placeholder-thumb.jpg'} alt="" className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0 py-1">
                    <Link href={`/watch/${v.id}`}>
                      <h3 className="text-sm font-medium line-clamp-2 group-hover:text-accent-red transition-colors">{v.title}</h3>
                    </Link>
                    <p className="text-xs text-secondary mt-1">{v.user?.displayName}</p>
                    <p className="text-xs text-secondary">{formatViews(v.views)} • {timeAgo(v.createdAt)}</p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveVideo(v.id)}
                      className="self-center p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-full transition-all"
                      title="Remove from playlist"
                    >
                      <HiTrash className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
