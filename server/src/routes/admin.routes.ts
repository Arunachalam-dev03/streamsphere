import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { paginationSchema } from '../utils/validators';

const router = Router();

// Admin middleware
router.use(authenticate, requireRole('ADMIN'));

// Dashboard stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalVideos, totalComments, totalViews, recentUsers, recentVideos] = await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.comment.count(),
      prisma.video.aggregate({ _sum: { views: true } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.video.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]);

    res.json({
      totalUsers,
      totalVideos,
      totalComments,
      totalViews: totalViews._sum.views || 0,
      recentUsers,
      recentVideos,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, username: true, displayName: true,
          avatar: true, role: true, isVerified: true, createdAt: true,
          subscriberCount: true,
          _count: { select: { videos: true, comments: true } },
        },
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.put('/users/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, username: true, role: true },
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle user verified badge
router.put('/users/:id/verify', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: !user.isVerified },
      select: { id: true, username: true, displayName: true, isVerified: true },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending verification requests
router.get('/verification-requests', async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.user.findMany({
      where: {
        verificationRequestedAt: { not: null },
        isVerified: false,
      },
      orderBy: { verificationRequestedAt: 'asc' },
      select: {
        id: true, username: true, displayName: true, avatar: true,
        subscriberCount: true, verificationRequestedAt: true,
        _count: { select: { videos: true } },
      },
    });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Approve verification request
router.put('/verification-requests/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: true, verificationRequestedAt: null },
      select: { id: true, username: true, displayName: true, isVerified: true },
    });

    // Notify the user
    await prisma.notification.create({
      data: {
        userId: req.params.id,
        type: 'SYSTEM',
        title: 'Channel Verified! ✓',
        message: 'Congratulations! Your channel has been verified. The verified badge is now visible on your profile.',
        link: `/@${updated.username}`,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reject verification request
router.put('/verification-requests/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { verificationRequestedAt: null },
      select: { id: true, username: true, displayName: true },
    });

    // Notify the user
    await prisma.notification.create({
      data: {
        userId: req.params.id,
        type: 'SYSTEM',
        title: 'Verification Request Update',
        message: 'Your verification request was not approved at this time. You can reapply later once your channel meets the criteria.',
        link: '/settings',
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List all videos (admin)
router.get('/videos', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, displayName: true },
          },
        },
      }),
      prisma.video.count(),
    ]);

    res.json({
      videos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete video (admin)
router.delete('/videos/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.video.delete({ where: { id: req.params.id } });
    res.json({ message: 'Video deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications
router.get('/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
