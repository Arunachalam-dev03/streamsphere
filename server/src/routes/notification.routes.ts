import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, read: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification preferences
router.get('/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: req.user!.userId },
      });
    }
    res.json(prefs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification preferences
router.put('/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { newVideo, newSubscriber, newComment, newLike, newLivestream, system } = req.body;
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: req.user!.userId },
      create: {
        userId: req.user!.userId,
        newVideo: newVideo ?? true,
        newSubscriber: newSubscriber ?? true,
        newComment: newComment ?? true,
        newLike: newLike ?? true,
        newLivestream: newLivestream ?? true,
        system: system ?? true,
      },
      update: {
        ...(typeof newVideo === 'boolean' && { newVideo }),
        ...(typeof newSubscriber === 'boolean' && { newSubscriber }),
        ...(typeof newComment === 'boolean' && { newComment }),
        ...(typeof newLike === 'boolean' && { newLike }),
        ...(typeof newLivestream === 'boolean' && { newLivestream }),
        ...(typeof system === 'boolean' && { system }),
      },
    });
    res.json(prefs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
