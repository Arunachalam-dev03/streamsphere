import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// Create a report
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type, reason, description, videoId, commentId, channelId } = req.body;

    if (!type || !reason) {
      res.status(400).json({ error: 'Type and reason are required' });
      return;
    }

    if (!['VIDEO', 'COMMENT', 'CHANNEL'].includes(type)) {
      res.status(400).json({ error: 'Invalid report type' });
      return;
    }

    const report = await prisma.report.create({
      data: {
        type,
        reason,
        description: description || null,
        reporterId: req.user!.userId,
        videoId: type === 'VIDEO' ? videoId : null,
        commentId: type === 'COMMENT' ? commentId : null,
        channelId: type === 'CHANNEL' ? channelId : null,
      },
    });

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reports (admin only)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, username: true, displayName: true, avatar: true } },
          video: { select: { id: true, title: true, thumbnailUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    res.json({ reports, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update report status (admin only)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { status } = req.body;
    if (!['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
