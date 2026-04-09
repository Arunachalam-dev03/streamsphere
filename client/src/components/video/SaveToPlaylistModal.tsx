'use client';

import React, { useEffect, useState } from 'react';
import { playlistAPI } from '@/lib/api';
import { MdPlaylistPlay, MdPlaylistAdd } from 'react-icons/md';
import { HiX, HiPlus, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

interface SaveToPlaylistModalProps {
  videoId: string;
  onClose: () => void;
}

export default function SaveToPlaylistModal({ videoId, onClose }: SaveToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const { data } = await playlistAPI.getAll();
      setPlaylists(data || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await playlistAPI.addVideo(playlistId, videoId);
      toast.success('Added to playlist');
      onClose();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast('Already in this playlist', { icon: 'ℹ️' });
      } else {
        toast.error('Failed to add to playlist');
      }
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      const { data } = await playlistAPI.create({ title: newTitle.trim() });
      await playlistAPI.addVideo(data.id, videoId);
      toast.success(`Added to "${newTitle.trim()}"`);
      onClose();
    } catch {
      toast.error('Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-border-light/10 animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light/10">
          <h3 className="text-base font-semibold">Save to...</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-hover rounded-full transition-colors">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
            </div>
          ) : playlists.length === 0 && !showCreate ? (
            <div className="text-center py-8 text-secondary text-sm">
              <MdPlaylistPlay className="w-10 h-10 mx-auto mb-2 opacity-40" />
              No playlists yet
            </div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-hover transition-colors text-left text-sm"
              >
                <MdPlaylistAdd className="w-5 h-5 text-secondary shrink-0" />
                <span className="flex-1 truncate">{pl.title}</span>
                <span className="text-xs text-secondary">{pl._count?.videos || 0}</span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border-light/10 p-3">
          {showCreate ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Playlist name"
                autoFocus
                className="flex-1 bg-surface border border-border-light/20 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:border-accent-red/50 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              />
              <button
                onClick={handleCreatePlaylist}
                disabled={creating || !newTitle.trim()}
                className="p-2 bg-accent-red text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <HiCheck className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-hover transition-colors text-sm font-medium"
            >
              <HiPlus className="w-5 h-5" /> Create new playlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
