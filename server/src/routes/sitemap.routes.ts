import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import redis from '../config/redis';

const router = Router();

// Get all public videos for sitemap generation
router.get('/videos', async (_req: Request, res: Response) => {
  try {
    // Try cache first (1 hour TTL)
    const cacheKey = 'sitemap:videos';
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const videos = await prisma.video.findMany({
      where: {
        status: 'READY',
        privacy: 'PUBLIC',
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        duration: true,
        views: true,
        isShort: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = { videos };

    // Cache for 1 hour
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600).catch(() => {});

    res.json(result);
  } catch (error: any) {
    console.error('Sitemap videos error:', error);
    res.status(500).json({ error: 'Failed to get sitemap data' });
  }
});

// Get all channels (users with at least one public video) for sitemap
router.get('/channels', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'sitemap:channels';
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const channels = await prisma.user.findMany({
      where: {
        videos: {
          some: {
            status: 'READY',
            privacy: 'PUBLIC',
          },
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { videos: true },
        },
      },
    });

    const result = { channels };

    // Cache for 1 hour
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600).catch(() => {});

    res.json(result);
  } catch (error: any) {
    console.error('Sitemap channels error:', error);
    res.status(500).json({ error: 'Failed to get sitemap data' });
  }
});

export default router;
