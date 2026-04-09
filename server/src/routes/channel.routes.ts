import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { paginationSchema } from '../utils/validators';
import { AppError } from '../utils/helpers';
import { uploadImage } from '../middleware/upload';
import { StorageService } from '../services/storage.service';
import { ImageService } from '../services/image.service';
import path from 'path';

const router = Router();

// Get channel info
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const channel = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        location: true,
        socialLinks: true,
        subscriberCount: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { videos: true } },
      },
    });

    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    // Check if current user is subscribed
    let isSubscribed = false;
    if (req.user && req.user.userId !== req.params.id) {
      const sub = await prisma.subscription.findUnique({
        where: {
          subscriberId_channelId: {
            subscriberId: req.user.userId,
            channelId: req.params.id,
          },
        },
      });
      isSubscribed = !!sub;
    }

    res.json({ ...channel, isSubscribed });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get channel by username
router.get('/by-username/:username', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const channel = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        location: true,
        socialLinks: true,
        subscriberCount: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { videos: true } },
      },
    });

    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    let isSubscribed = false;
    if (req.user && req.user.userId !== channel.id) {
      const sub = await prisma.subscription.findUnique({
        where: {
          subscriberId_channelId: {
            subscriberId: req.user.userId,
            channelId: channel.id,
          },
        },
      });
      isSubscribed = !!sub;
    }

    res.json({ ...channel, isSubscribed });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get channel videos
router.get('/:id/videos', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isOwner = req.user?.userId === req.params.id;
    
    // Owners see all their videos (except maybe FAILED, or let them see FAILED to retry later)
    // Non-owners see only READY and PUBLIC
    const whereClause: any = isOwner 
      ? { userId: req.params.id }
      : { userId: req.params.id, status: 'READY', privacy: 'PUBLIC' };

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
        },
      }),
      prisma.video.count({
        where: whereClause,
      }),
    ]);

    res.json({
      videos,
      pagination: { total, totalPages: 1 },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Subscribe / Unsubscribe
router.post('/:id/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.id;
    const subscriberId = req.user!.userId;

    if (channelId === subscriberId) {
      res.status(400).json({ error: "You can't subscribe to yourself" });
      return;
    }

    // Check if channel exists
    const channel = await prisma.user.findUnique({ where: { id: channelId } });
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const existingSub = await prisma.subscription.findUnique({
      where: { subscriberId_channelId: { subscriberId, channelId } },
    });

    if (existingSub) {
      // Unsubscribe
      await prisma.subscription.delete({ where: { id: existingSub.id } });
      await prisma.user.update({
        where: { id: channelId },
        data: { subscriberCount: { decrement: 1 } },
      });
      res.json({ subscribed: false });
    } else {
      // Subscribe
      await prisma.subscription.create({
        data: { subscriberId, channelId },
      });
      await prisma.user.update({
        where: { id: channelId },
        data: { subscriberCount: { increment: 1 } },
      });

      // Notification
      await prisma.notification.create({
        data: {
          userId: channelId,
          type: 'NEW_SUBSCRIBER',
          message: `You have a new subscriber!`,
          referenceId: subscriberId,
        },
      });

      res.json({ subscribed: true });
    }
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get user's subscriptions
router.get('/user/subscriptions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: req.user!.userId },
      include: {
        channel: {
          select: {
            id: true, username: true, displayName: true,
            avatar: true, subscriberCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(subscriptions.map((s: any) => s.channel));
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Update profile info (displayName, bio, location, socialLinks)
router.put('/me/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, bio, location, socialLinks, avatar, banner, watermark } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(socialLinks !== undefined && { socialLinks }),
        ...(avatar !== undefined && { avatar }),
        ...(banner !== undefined && { banner }),
        ...(watermark !== undefined && { watermark }),
      },
      select: {
        id: true, username: true, displayName: true,
        avatar: true, banner: true, bio: true,
        location: true, socialLinks: true,
      },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Upload avatar
router.put('/me/avatar', authenticate, uploadImage.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Process avatar: center-crop to square & convert to WebP
    const processedPath = await ImageService.processAndReplace(req.file.path, 512);

    const objectName = `avatars/${req.user!.userId}.webp`;
    const avatarUrl = await StorageService.uploadFile(processedPath, objectName, 'image/webp');

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });

    StorageService.cleanupTempFile(processedPath);
    res.json(updated);
  } catch (error: any) {
    if (req.file) StorageService.cleanupTempFile(req.file.path);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Upload banner
router.put('/me/banner', authenticate, uploadImage.single('banner'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Process banner: resize to 2560×424 & convert to WebP
    const ext = path.extname(req.file.path);
    const processedPath = req.file.path.replace(ext, '_banner.webp');

    const sharp = (await import('sharp')).default;
    await sharp(req.file.path)
      .resize(2560, 424, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toFile(processedPath);

    const objectName = `banners/${req.user!.userId}.webp`;
    const bannerUrl = await StorageService.uploadFile(processedPath, objectName, 'image/webp');

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { banner: bannerUrl },
      select: { id: true, banner: true },
    });

    StorageService.cleanupTempFile(req.file.path);
    StorageService.cleanupTempFile(processedPath);
    res.json(updated);
  } catch (error: any) {
    if (req.file) StorageService.cleanupTempFile(req.file.path);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});
// Upload watermark
router.put('/me/watermark', authenticate, uploadImage.single('watermark'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Process watermark: resize to 150x150 & convert to WebP
    const ext = path.extname(req.file.path);
    const processedPath = req.file.path.replace(ext, '_watermark.webp');

    const sharp = (await import('sharp')).default;
    await sharp(req.file.path)
      .resize(150, 150, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toFile(processedPath);

    const objectName = `watermarks/${req.user!.userId}.webp`;
    const watermarkUrl = await StorageService.uploadFile(processedPath, objectName, 'image/webp');

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { watermark: watermarkUrl },
      select: { id: true, watermark: true },
    });

    StorageService.cleanupTempFile(req.file.path);
    StorageService.cleanupTempFile(processedPath);
    res.json(updated);
  } catch (error: any) {
    if (req.file) StorageService.cleanupTempFile(req.file.path);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Request verification badge
router.post('/request-verification', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (user.isVerified) {
      res.status(400).json({ error: 'Your channel is already verified' });
      return;
    }
    if (user.verificationRequestedAt) {
      res.status(400).json({ error: 'You already have a pending verification request' });
      return;
    }

    // Mark request
    await prisma.user.update({
      where: { id: userId },
      data: { verificationRequestedAt: new Date() },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM',
          title: 'Verification Request',
          message: `@${user.username} (${user.displayName}) has requested channel verification.`,
          referenceId: userId,
          link: '/admin',
        },
      });
    }

    res.json({ message: 'Verification request submitted! An admin will review your channel.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get own verification status
router.get('/verification-status/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { isVerified: true, verificationRequestedAt: true },
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
