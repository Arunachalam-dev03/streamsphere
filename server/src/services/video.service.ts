import prisma from '../config/database';
import redis from '../config/redis';
import { AppError } from '../utils/helpers';
import { Prisma } from '@prisma/client';
import { SEOService } from './seo.service';

export class VideoService {
  static async create(data: {
    title: string;
    description?: string;
    fileName: string;
    userId: string;
    privacy?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    tags?: string[];
  }) {
    const video = await prisma.video.create({
      data: {
        title: data.title,
        description: data.description || '',
        fileName: data.fileName,
        userId: data.userId,
        privacy: data.privacy || 'PUBLIC',
        status: 'UPLOADING',
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
        },
      },
    });

    // Create tags if provided
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName.toLowerCase() },
          create: { name: tagName.toLowerCase() },
          update: {},
        });
        await prisma.videoTag.create({
          data: { videoId: video.id, tagId: tag.id },
        });
      }
    }

    return video;
  }

  static async updateProcessingResult(videoId: string, data: {
    hlsUrl: string;
    thumbnailUrl: string;
    duration: number;
    width: number;
    height: number;
  }) {
    const existingVideo = await prisma.video.findUnique({ where: { id: videoId }, select: { thumbnailUrl: true } });
    const finalThumbnail = existingVideo?.thumbnailUrl?.includes('custom-thumbnail')
      ? existingVideo.thumbnailUrl
      : data.thumbnailUrl;

    // Short = any video ≤ 3 minutes (180 seconds)
    const isShort = data.duration > 0 && data.duration <= 180;
    return prisma.video.update({
      where: { id: videoId },
      data: {
        hlsUrl: data.hlsUrl,
        thumbnailUrl: finalThumbnail,
        duration: data.duration,
        width: data.width,
        height: data.height,
        isShort,
        status: 'READY',
      },
    }).then(async (video) => {
      // Notify search engines in the background (fire and forget)
      if (video.privacy === 'PUBLIC') {
        SEOService.notifySearchEngines(videoId, isShort).catch((err) => {
          console.error('SEO notification failed:', err);
        });
      }
      return video;
    });
  }

  static async setFailed(videoId: string) {
    return prisma.video.update({
      where: { id: videoId },
      data: { status: 'FAILED' },
    });
  }

  static async getById(videoId: string, userId?: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        user: {
          select: {
            id: true, username: true, displayName: true,
            avatar: true, subscriberCount: true, isVerified: true,
          },
        },
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!video) {
      throw new AppError('Video not found', 404);
    }

    // Check privacy
    if (video.privacy === 'PRIVATE' && video.userId !== userId) {
      throw new AppError('Video is private', 403);
    }

    // Get user's like status
    let userLike = null;
    if (userId) {
      userLike = await prisma.like.findUnique({
        where: { videoId_userId: { videoId, userId } },
      });
    }

    // Check if user is subscribed to the channel
    let isSubscribed = false;
    if (userId && userId !== video.userId) {
      const sub = await prisma.subscription.findUnique({
        where: {
          subscriberId_channelId: { subscriberId: userId, channelId: video.userId },
        },
      });
      isSubscribed = !!sub;
    }

    return {
      ...video,
      userLike: userLike?.type || null,
      isSubscribed,
    };
  }

  static async incrementViews(videoId: string, userId?: string) {
    // Use Redis to debounce view counting (1 view per user per 30 minutes)
    if (userId) {
      const cacheKey = `view:${videoId}:${userId}`;
      const cached = await redis.get(cacheKey).catch(() => null);
      if (cached) return;
      await redis.set(cacheKey, '1', 'EX', 1800).catch(() => { });
    }

    await prisma.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
    });

    // Update watch history
    if (userId) {
      await prisma.watchHistory.upsert({
        where: { userId_videoId: { userId, videoId } },
        create: { userId, videoId },
        update: { watchedAt: new Date() },
      });
    }
  }

  static async getFeed(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Try to get from cache
    const cacheKey = `feed:${page}:${limit}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: {
          status: 'READY',
          privacy: 'PUBLIC',
          isShort: false,
          duration: { gt: 180 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
          },
        },
      }),
      prisma.video.count({
        where: {
          status: 'READY',
          privacy: 'PUBLIC',
          isShort: false,
          duration: { gt: 180 },
        },
      }),
    ]);

    const result = {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 3 minutes (only if results exist)
    if (result.videos.length > 0) {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 180).catch(() => { });
    }
    return result;
  }

  static async getShorts(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: {
          status: 'READY',
          privacy: 'PUBLIC',
          OR: [
            { isShort: true },
            { duration: { gt: 0, lte: 180 } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
          },
        },
      }),
      prisma.video.count({
        where: {
          status: 'READY',
          privacy: 'PUBLIC',
          OR: [
            { isShort: true },
            { duration: { gt: 0, lte: 180 } },
          ],
        },
      }),
    ]);

    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTrending(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: {
          status: 'READY',
          privacy: 'PUBLIC',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { views: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
          },
        },
      }),
      prisma.video.count({
        where: {
          status: 'READY',
          privacy: 'PUBLIC',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      videos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async search(query: string, page: number = 1, limit: number = 20, sort: string = 'relevance') {
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'views') orderBy = { views: 'desc' };
    if (sort === 'date') orderBy = { createdAt: 'desc' };

    const where: any = {
      status: 'READY',
      privacy: 'PUBLIC',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
          },
        },
      }),
      prisma.video.count({ where }),
    ]);

    return {
      videos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getUserVideos(userId: string, page: number = 1, limit: number = 20, requesterId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      status: 'READY',
      ...(requesterId !== userId ? { privacy: 'PUBLIC' } : {}),
    };

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
          },
        },
      }),
      prisma.video.count({ where }),
    ]);

    return {
      videos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async update(videoId: string, userId: string, data: {
    title?: string;
    description?: string;
    privacy?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    tags?: string[];
  }) {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new AppError('Video not found', 404);
    if (video.userId !== userId) throw new AppError('Not authorized', 403);

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.privacy) updateData.privacy = data.privacy;

    const updated = await prisma.video.update({
      where: { id: videoId },
      data: updateData,
    });

    // Update tags if provided
    if (data.tags) {
      await prisma.videoTag.deleteMany({ where: { videoId } });
      for (const tagName of data.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName.toLowerCase() },
          create: { name: tagName.toLowerCase() },
          update: {},
        });
        await prisma.videoTag.create({
          data: { videoId, tagId: tag.id },
        });
      }
    }

    // Invalidate caches safely
    try {
      const keys = await redis.keys('feed:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error('Cache invalidation error:', err);
    }

    return updated;
  }

  static async delete(videoId: string, userId: string, isAdmin: boolean = false) {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new AppError('Video not found', 404);
    if (video.userId !== userId && !isAdmin) throw new AppError('Not authorized', 403);

    await prisma.video.delete({ where: { id: videoId } });

    // Invalidate caches safely
    try {
      const keys = await redis.keys('feed:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error('Cache invalidation error:', err);
    }

    return { message: 'Video deleted successfully' };
  }

  static async like(videoId: string, userId: string, type: 'LIKE' | 'DISLIKE') {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new AppError('Video not found', 404);

    const existingLike = await prisma.like.findUnique({
      where: { videoId_userId: { videoId, userId } },
    });

    if (existingLike) {
      if (existingLike.type === type) {
        // Remove like/dislike
        await prisma.like.delete({ where: { id: existingLike.id } });
        await prisma.video.update({
          where: { id: videoId },
          data: {
            ...(type === 'LIKE' ? { likesCount: { decrement: 1 } } : { dislikesCount: { decrement: 1 } }),
          },
        });
        return { action: 'removed', type };
      } else {
        // Switch like/dislike
        await prisma.like.update({
          where: { id: existingLike.id },
          data: { type },
        });
        await prisma.video.update({
          where: { id: videoId },
          data: {
            ...(type === 'LIKE'
              ? { likesCount: { increment: 1 }, dislikesCount: { decrement: 1 } }
              : { likesCount: { decrement: 1 }, dislikesCount: { increment: 1 } }),
          },
        });
        return { action: 'switched', type };
      }
    }

    // New like/dislike
    await prisma.like.create({ data: { videoId, userId, type } });
    await prisma.video.update({
      where: { id: videoId },
      data: {
        ...(type === 'LIKE' ? { likesCount: { increment: 1 } } : { dislikesCount: { increment: 1 } }),
      },
    });

    return { action: 'added', type };
  }

  static async getRecommendations(videoId: string, limit: number = 12) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { tags: { include: { tag: true } } },
    });

    if (!video) return [];

    const tagNames = video.tags.map((t: { tag: { name: string } }) => t.tag.name);

    // Find videos with similar tags or from same user
    const recommendations = await prisma.video.findMany({
      where: {
        id: { not: videoId },
        status: 'READY',
        privacy: 'PUBLIC',
        isShort: false,
        OR: [
          { tags: { some: { tag: { name: { in: tagNames } } } } },
          { userId: video.userId },
        ],
      },
      orderBy: { views: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
        },
      },
    });

    // If not enough recommendations, fill with popular videos
    if (recommendations.length < limit) {
      const moreVideos = await prisma.video.findMany({
        where: {
          id: { notIn: [videoId, ...recommendations.map((r: { id: string }) => r.id)] },
          status: 'READY',
          privacy: 'PUBLIC',
          isShort: false,
        },
        orderBy: { views: 'desc' },
        take: limit - recommendations.length,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
          },
        },
      });
      recommendations.push(...moreVideos);
    }

    return recommendations;
  }

  static async getSubscriptionFeed(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: userId },
      select: { channelId: true },
    });

    const channelIds = subscriptions.map((s: { channelId: string }) => s.channelId);

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: {
          userId: { in: channelIds },
          status: 'READY',
          privacy: 'PUBLIC',
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
          },
        },
      }),
      prisma.video.count({
        where: {
          userId: { in: channelIds },
          status: 'READY',
          privacy: 'PUBLIC',
        },
      }),
    ]);

    return {
      videos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getWatchHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        skip,
        take: limit,
        include: {
          video: {
            include: {
              user: {
                select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
              },
            },
          },
        },
      }),
      prisma.watchHistory.count({ where: { userId } }),
    ]);

    return {
      videos: history.map((h: any) => ({ ...h.video, watchedAt: h.watchedAt, progress: h.progress })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getLikedVideos(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { userId, type: 'LIKE' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          video: {
            include: {
              user: {
                select: { id: true, username: true, displayName: true, avatar: true, isVerified: true },
              },
            },
          },
        },
      }),
      prisma.like.count({ where: { userId, type: 'LIKE' } }),
    ]);

    return {
      videos: likes.map((l: any) => ({ ...l.video, likedAt: l.createdAt })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getWatchLater(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.watchLater.findMany({
        where: { userId },
        orderBy: { addedAt: 'desc' },
        skip,
        take: limit,
        include: {
          video: {
            include: {
              user: { select: { id: true, username: true, displayName: true, avatar: true, isVerified: true } },
            },
          },
        },
      }),
      prisma.watchLater.count({ where: { userId } }),
    ]);

    return {
      videos: items.map((i: any) => ({ ...i.video, addedAt: i.addedAt })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async toggleWatchLater(userId: string, videoId: string) {
    const existing = await prisma.watchLater.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (existing) {
      await prisma.watchLater.delete({ where: { id: existing.id } });
      return { action: 'removed' };
    }
    await prisma.watchLater.create({ data: { userId, videoId } });
    return { action: 'added' };
  }
}
