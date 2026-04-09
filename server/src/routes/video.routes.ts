import { Router, Response } from 'express';
import { VideoService } from '../services/video.service';
import { TranscodeService } from '../services/transcode.service';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { uploadVideo, uploadThumbnail } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';
import { videoUploadSchema, videoUpdateSchema, paginationSchema, searchSchema } from '../utils/validators';
import { StorageService } from '../services/storage.service';
import prisma from '../config/database';
import path from 'path';

const router = Router();

// Get video feed (public)
router.get('/feed', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await VideoService.getFeed(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get trending videos
router.get('/trending', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await VideoService.getTrending(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get Shorts
router.get('/shorts', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await VideoService.getShorts(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Search videos
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q, page, limit, sort } = searchSchema.parse(req.query);
    const result = await VideoService.search(q, page, limit, sort);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Search suggestions (autocomplete)
router.get('/suggestions', async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      res.json({ suggestions: [] });
      return;
    }

    // Find matching video titles
    const videos = await prisma.video.findMany({
      where: {
        status: 'READY',
        privacy: 'PUBLIC',
        title: { contains: q, mode: 'insensitive' },
      },
      select: { title: true },
      take: 8,
      orderBy: { views: 'desc' },
      distinct: ['title'],
    });

    // Also find matching tags
    const tags = await prisma.tag.findMany({
      where: { name: { contains: q.toLowerCase() } },
      select: { name: true },
      take: 4,
    });

    const titleSuggestions = videos.map(v => v.title);
    const tagSuggestions = tags.map(t => t.name).filter(t => !titleSuggestions.some(s => s.toLowerCase() === t));
    
    // Combine: titles first, then tags, max 10
    const suggestions = [...titleSuggestions, ...tagSuggestions].slice(0, 10);
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get subscription feed
router.get('/subscriptions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await VideoService.getSubscriptionFeed(req.user!.userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get watch history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await VideoService.getWatchHistory(req.user!.userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Upload video
router.post('/upload', authenticate, uploadLimiter, uploadVideo.single('video'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Video file required' });
      return;
    }

    const data = videoUploadSchema.parse(req.body);

    // Create video record
    const video = await VideoService.create({
      title: data.title,
      description: data.description,
      fileName: req.file.filename,
      userId: req.user!.userId,
      privacy: data.privacy,
      tags: data.tags,
    });

    // Process video in background
    (async () => {
      try {
        const result = await TranscodeService.processVideo(req.file!.path, video.id);
        await VideoService.updateProcessingResult(video.id, result);
      } catch (error) {
        console.error(`❌ Video processing failed for ${video.id}:`, error);
        await VideoService.setFailed(video.id);
      }
    })();

    res.status(201).json({
      message: 'Video uploaded, processing started',
      video,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get liked videos
router.get('/liked', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await VideoService.getLikedVideos(req.user!.userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get watch later videos
router.get('/watch-later', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await VideoService.getWatchLater(req.user!.userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Toggle watch later
router.post('/:id/watch-later', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await VideoService.toggleWatchLater(req.user!.userId, req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Record view explicitly (used primarily by the Shorts player feed)
router.post('/:id/view', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    await VideoService.incrementViews(req.params.id, req.user?.userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Save playback progress for resume playback
router.post('/:id/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { progress } = req.body;
    if (typeof progress !== 'number' || progress < 0) {
      res.status(400).json({ error: 'Invalid progress value' });
      return;
    }
    await prisma.watchHistory.upsert({
      where: { userId_videoId: { userId: req.user!.userId, videoId: req.params.id } },
      create: { userId: req.user!.userId, videoId: req.params.id, progress, watchedAt: new Date() },
      update: { progress, watchedAt: new Date() },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get playback progress for resume
router.get('/:id/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const history = await prisma.watchHistory.findUnique({
      where: { userId_videoId: { userId: req.user!.userId, videoId: req.params.id } },
    });
    res.json({ progress: history?.progress || 0 });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get video by ID
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const video = await VideoService.getById(req.params.id, req.user?.userId);
    // Views are now explicitly incremented by the client calling POST /view
    res.json(video);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get video recommendations
router.get('/:id/recommendations', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 12;
    const recommendations = await VideoService.getRecommendations(req.params.id, limit);
    res.json(recommendations);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Update video
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = videoUpdateSchema.parse(req.body);
    const video = await VideoService.update(req.params.id, req.user!.userId, data);
    res.json(video);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Upload thumbnail
router.post('/:id/thumbnail', authenticate, uploadThumbnail.single('thumbnail'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Thumbnail image required' });
      return;
    }
    const url = await StorageService.uploadFile(
      req.file.path,
      `videos/${req.params.id}/custom-thumbnail${path.extname(req.file.originalname)}`,
      req.file.mimetype
    );
    StorageService.cleanupTempFile(req.file.path);
    
    // Explicitly update the Video model in the database
    await prisma.video.update({
      where: { id: req.params.id },
      data: { thumbnailUrl: url }
    });
    
    res.json({ thumbnailUrl: url });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Delete video
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await VideoService.delete(req.params.id, req.user!.userId, req.user!.role === 'ADMIN');
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Like / Dislike video
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.body;
    if (!['LIKE', 'DISLIKE'].includes(type)) {
      res.status(400).json({ error: 'Type must be LIKE or DISLIKE' });
      return;
    }
    const result = await VideoService.like(req.params.id, req.user!.userId, type);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Download video - streams original file from MinIO directly to client
router.get('/:id/download', async (req: AuthRequest, res: Response) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true, privacy: true },
    });
    if (!video) { res.status(404).json({ error: 'Video not found' }); return; }
    if (video.privacy !== 'PUBLIC') { res.status(403).json({ error: 'Video is not public' }); return; }

    const bucketName = process.env.MINIO_BUCKET || 'streamsphere';
    const prefix = `videos/${video.id}/original`;
    
    // Find the original file in MinIO
    const { minioClient } = await import('../config/minio');
    
    let originalObjectName: string | null = null;
    
    await new Promise<void>((resolve) => {
      const stream = minioClient.listObjects(bucketName, prefix, false);
      stream.on('data', (obj) => {
        if (obj.name && obj.name.startsWith(prefix)) {
          originalObjectName = obj.name;
        }
      });
      stream.on('error', () => resolve());
      stream.on('end', () => resolve());
    });

    if (!originalObjectName) {
      res.status(404).json({ error: 'Original video file not found' });
      return;
    }

    // Get file stat for Content-Length
    const stat = await minioClient.statObject(bucketName, originalObjectName);
    
    // Sanitize filename
    const safeTitle = (video.title || 'video').replace(/[^\w\s.-]/g, '').trim().substring(0, 100);
    const ext = path.extname(originalObjectName) || '.mp4';

    // Set download headers
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}${ext}"`);
    
    // Stream file from MinIO directly to client
    const fileStream = await minioClient.getObject(bucketName, originalObjectName);
    fileStream.pipe(res);
    
  } catch (error: any) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Schedule video publishing
router.post('/:id/schedule', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { scheduledAt } = req.body;
    if (!scheduledAt) { res.status(400).json({ error: 'scheduledAt is required' }); return; }

    const video = await prisma.video.findUnique({ where: { id: req.params.id } });
    if (!video) { res.status(404).json({ error: 'Video not found' }); return; }
    if (video.userId !== req.user!.userId) { res.status(403).json({ error: 'Not authorized' }); return; }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) { res.status(400).json({ error: 'Scheduled time must be in the future' }); return; }

    const updated = await prisma.video.update({
      where: { id: req.params.id },
      data: { scheduledAt: scheduledDate, privacy: 'PRIVATE' },
    });

    res.json({ message: 'Video scheduled', scheduledAt: updated.scheduledAt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics export (CSV)
router.get('/analytics/export', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const videos = await prisma.video.findMany({
      where: { userId: req.user!.userId },
      select: {
        title: true, views: true, likesCount: true, dislikesCount: true,
        duration: true, createdAt: true, status: true, privacy: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV
    const headers = 'Title,Views,Likes,Dislikes,Comments,Duration (s),Status,Privacy,Created At\n';
    const rows = videos.map(v =>
      `"${v.title.replace(/"/g, '""')}",${v.views},${v.likesCount},${v.dislikesCount},${v._count.comments},${v.duration},${v.status},${v.privacy},${v.createdAt.toISOString()}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
    res.send(headers + rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get captions for a video
router.get('/:id/captions', async (req: AuthRequest, res: Response) => {
  try {
    const captions = await prisma.caption.findMany({
      where: { videoId: req.params.id },
      orderBy: { isDefault: 'desc' },
    });
    res.json(captions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
