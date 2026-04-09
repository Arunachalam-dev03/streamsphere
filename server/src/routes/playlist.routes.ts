import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { playlistSchema, paginationSchema } from '../utils/validators';

const router = Router();

// Helper: check if user is owner or collaborator
async function canEditPlaylist(playlistId: string, userId: string): Promise<boolean> {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) return false;
  if (playlist.userId === userId) return true;
  const collab = await prisma.playlistCollaborator.findUnique({
    where: { playlistId_userId: { playlistId, userId } },
  });
  return !!collab;
}

// Get user's playlists
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.user!.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { videos: true, collaborators: true } },
        videos: {
          take: 1,
          orderBy: { position: 'asc' },
          include: { video: { select: { thumbnailUrl: true } } },
        },
      },
    });
    res.json(playlists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create playlist
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = playlistSchema.parse(req.body);
    const playlist = await prisma.playlist.create({
      data: { ...data, userId: req.user!.userId },
    });
    res.status(201).json(playlist);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// Get playlist with videos
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        videos: {
          orderBy: { position: 'asc' },
          include: {
            video: {
              include: {
                user: {
                  select: { id: true, username: true, displayName: true, avatar: true },
                },
              },
            },
          },
        },
        collaborators: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
        },
      },
    });

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add video to playlist (owner or collaborator)
router.post('/:id/videos', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.body;
    const authorized = await canEditPlaylist(req.params.id, req.user!.userId);
    if (!authorized) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const count = await prisma.playlistVideo.count({ where: { playlistId: req.params.id } });
    
    await prisma.playlistVideo.create({
      data: {
        playlistId: req.params.id,
        videoId,
        position: count + 1,
      },
    });

    res.status(201).json({ message: 'Video added to playlist' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Video already in playlist' });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// Remove video from playlist
router.delete('/:id/videos/:videoId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const authorized = await canEditPlaylist(req.params.id, req.user!.userId);
    if (!authorized) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.playlistVideo.deleteMany({
      where: { playlistId: req.params.id, videoId: req.params.videoId },
    });

    res.json({ message: 'Video removed from playlist' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add collaborator to playlist (owner only)
router.post('/:id/collaborators', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) { res.status(400).json({ error: 'username is required' }); return; }

    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist || playlist.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Only the owner can add collaborators' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) { res.status(404).json({ error: 'User not found' }); return; }
    if (targetUser.id === req.user!.userId) { res.status(400).json({ error: 'Cannot add yourself' }); return; }

    const collab = await prisma.playlistCollaborator.create({
      data: { playlistId: req.params.id, userId: targetUser.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });

    res.status(201).json(collab);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'User is already a collaborator' });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// Remove collaborator from playlist (owner only)
router.delete('/:id/collaborators/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist || playlist.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Only the owner can remove collaborators' });
      return;
    }

    await prisma.playlistCollaborator.deleteMany({
      where: { playlistId: req.params.id, userId: req.params.userId },
    });

    res.json({ message: 'Collaborator removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete playlist
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist || playlist.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.playlist.delete({ where: { id: req.params.id } });
    res.json({ message: 'Playlist deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
