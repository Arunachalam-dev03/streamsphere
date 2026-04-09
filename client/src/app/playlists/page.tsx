'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { playlistAPI } from '@/lib/api';
import Link from 'next/link';
import { MdPlaylistPlay } from 'react-icons/md';

interface Playlist {
  id: string;
  title: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  _count: { videos: number };
  videos: { video: { thumbnailUrl: string } }[];
  updatedAt: string;
}

export default function PlaylistsPage() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/auth/login?redirect=/playlists');
      return;
    }

    if (isAuthenticated) {
      loadPlaylists();
    }
  }, [isAuthenticated, isHydrated, router]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const { data } = await playlistAPI.getAll();
      setPlaylists(data || []);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setLoading(false);
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between border-b border-border-light/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-accent-red">
            <MdPlaylistPlay className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="mt-1 text-sm text-gray-400">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
            </p>
          </div>
        </div>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-16 text-center border border-border-light/5">
          <MdPlaylistPlay className="mb-4 h-16 w-16 text-secondary/40" />
          <h2 className="mb-2 text-xl font-semibold">No playlists created</h2>
          <p className="text-gray-400 max-w-sm">
            Save videos to new playlists to organize your content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8">
          {playlists.map((playlist) => {
            // Determine a fallback thumbnail
            let thumbnailUrl = '';
            if (playlist.videos && playlist.videos.length > 0) {
              thumbnailUrl = playlist.videos[0].video.thumbnailUrl;
            }

            return (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="group block">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-light border border-border-light/5">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={playlist.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-hover">
                      <MdPlaylistPlay className="h-12 w-12 text-secondary/40" />
                    </div>
                  )}

                  {/* Playlist Overlay */}
                  <div className="absolute bottom-0 right-0 top-0 flex w-1/3 flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-sm">
                    <span className="text-sm font-medium">{playlist._count.videos}</span>
                    <MdPlaylistPlay className="mt-1 h-6 w-6" />
                  </div>
                  
                  {/* Default Overlay */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-xs font-medium backdrop-blur-md group-hover:hidden">
                    <MdPlaylistPlay className="h-4 w-4" />
                    <span>{playlist._count.videos}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="line-clamp-2 text-base font-semibold leading-tight group-hover:text-accent-red transition-colors">
                    {playlist.title}
                  </h3>
                  <div className="mt-1 flex items-center text-xs text-gray-400">
                    <span className="capitalize">{playlist.privacy.toLowerCase()}</span>
                    <span className="mx-1">•</span>
                    <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
