import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { commentSchema, paginationSchema } from '../utils/validators';
import { AppError } from '../utils/helpers';

const router = Router();

// Get comments for a video
router.get('/video/:videoId', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          videoId: req.params.videoId,
          parentId: null, // Only top-level comments
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
          replies: {
            orderBy: { createdAt: 'asc' },
            take: 3, // Load first 3 replies
            include: {
              user: {
                select: { id: true, username: true, displayName: true, avatar: true },
              },
            },
          },
          _count: { select: { replies: true } },
        },
      }),
      prisma.comment.count({
        where: { videoId: req.params.videoId, parentId: null },
      }),
    ]);

    res.json({
      comments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get replies for a comment
router.get('/:commentId/replies', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: req.params.commentId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
        },
      }),
      prisma.comment.count({ where: { parentId: req.params.commentId } }),
    ]);

    res.json({
      replies,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get all comments for a creator's channel (Studio Dashboard)
router.get('/channel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          video: { userId: req.user!.userId },
          parentId: null // Only fetch top level comments for the dashboard
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
          video: {
            select: { id: true, title: true, thumbnailUrl: true },
          },
          _count: { select: { replies: true } },
        },
      }),
      prisma.comment.count({
        where: {
          video: { userId: req.user!.userId },
          parentId: null
        },
      }),
    ]);

    res.json({
      comments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Create comment
router.post('/video/:videoId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = commentSchema.parse(req.body);

    // Verify video exists
    const video = await prisma.video.findUnique({ where: { id: req.params.videoId } });
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // If replying, verify parent comment exists
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: data.parentId } });
      if (!parent || parent.videoId !== req.params.videoId) {
        res.status(404).json({ error: 'Parent comment not found' });
        return;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        text: data.text,
        videoId: req.params.videoId,
        userId: req.user!.userId,
        parentId: data.parentId,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    // Create notification for video owner (use displayName, not email)
    if (video.userId !== req.user!.userId) {
      await prisma.notification.create({
        data: {
          userId: video.userId,
          type: 'NEW_COMMENT',
          title: 'New Comment',
          message: `${comment.user.displayName} commented on your video "${video.title}"`,
          referenceId: video.id,
          link: `/watch/${video.id}`,
        },
      });
    }

    res.status(201).json(comment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Delete comment
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Comment deleted' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Edit comment
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized to edit this comment' });
      return;
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { text: text.trim() },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Like/Unlike a comment (toggle) — uses CommentLike model for persistence
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId: req.params.id, userId: req.user!.userId } },
    });

    if (existing) {
      // Unlike
      await prisma.commentLike.delete({ where: { id: existing.id } });
      await prisma.comment.update({
        where: { id: req.params.id },
        data: { likesCount: { decrement: 1 } },
      });
      res.json({ liked: false, likesCount: Math.max(0, comment.likesCount - 1) });
    } else {
      // Like
      await prisma.commentLike.create({
        data: { commentId: req.params.id, userId: req.user!.userId },
      });
      await prisma.comment.update({
        where: { id: req.params.id },
        data: { likesCount: { increment: 1 } },
      });
      res.json({ liked: true, likesCount: comment.likesCount + 1 });
    }
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
