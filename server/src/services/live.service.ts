import prisma from '../config/database';
import redis from '../config/redis';
import { AppError } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class LiveService {
  /**
   * Generate a unique stream key
   */
  private static generateStreamKey(): string {
    return `live_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Create a new live stream
   */
  static async createStream(userId: string, data: {
    title: string;
    description?: string;
  }) {
    // Check if user already has an active stream
    const existing = await prisma.liveStream.findFirst({
      where: {
        userId,
        status: { in: ['SCHEDULED', 'LIVE'] },
      },
    });

    if (existing) {
      throw new AppError('You already have an active stream. End it before creating a new one.', 400);
    }

    const stream = await prisma.liveStream.create({
      data: {
        title: data.title,
        description: data.description || '',
        streamKey: this.generateStreamKey(),
        userId,
        status: 'SCHEDULED',
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    return stream;
  }

  /**
   * Called by media server when a stream starts publishing
   */
  static async startStream(streamKey: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { streamKey },
    });

    if (!stream) {
      throw new AppError('Invalid stream key', 404);
    }

    if (stream.status === 'ENDED') {
      throw new AppError('Stream has already ended', 400);
    }

    const updated = await prisma.liveStream.update({
      where: { streamKey },
      data: {
        status: 'LIVE',
        startedAt: new Date(),
        hlsUrl: `/live/${streamKey}/index.m3u8`,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    // Invalidate active streams cache
    await redis.del('live:active').catch(() => {});

    console.log(`🔴 LIVE: Stream started - ${updated.title} by ${updated.user.displayName}`);
    return updated;
  }

  /**
   * Called when a stream stops publishing
   */
  static async endStream(streamKey: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { streamKey },
    });

    if (!stream) return null;

    const updated = await prisma.liveStream.update({
      where: { streamKey },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
        viewerCount: 0,
      },
    });

    // Invalidate caches
    await redis.del('live:active').catch(() => {});
    await redis.del(`live:viewers:${stream.id}`).catch(() => {});

    console.log(`⬛ LIVE: Stream ended - ${updated.title}`);
    return updated;
  }

  /**
   * End a stream by ID (used by the streamer via API)
   */
  static async endStreamById(streamId: string, userId: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream) throw new AppError('Stream not found', 404);
    if (stream.userId !== userId) throw new AppError('Not authorized', 403);
    if (stream.status === 'ENDED') throw new AppError('Stream already ended', 400);

    return this.endStream(stream.streamKey);
  }

  /**
   * Get all currently active (LIVE) streams
   */
  static async getActiveStreams(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Try cache
    const cacheKey = `live:active:${page}:${limit}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    const [streams, total] = await Promise.all([
      prisma.liveStream.findMany({
        where: { status: 'LIVE' },
        orderBy: { viewerCount: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
        },
      }),
      prisma.liveStream.count({ where: { status: 'LIVE' } }),
    ]);

    const result = {
      streams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    // Cache for 10 seconds
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 10).catch(() => {});
    return result;
  }

  /**
   * Get stream by ID (public)
   */
  static async getStreamById(streamId: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        user: {
          select: {
            id: true, username: true, displayName: true,
            avatar: true, subscriberCount: true,
          },
        },
      },
    });

    if (!stream) {
      throw new AppError('Stream not found', 404);
    }

    return stream;
  }

  /**
   * Validate a stream key (used by media server auth)
   */
  static async validateStreamKey(streamKey: string): Promise<boolean> {
    const stream = await prisma.liveStream.findUnique({
      where: { streamKey },
    });

    if (!stream) return false;
    if (stream.status === 'ENDED') return false;

    return true;
  }

  /**
   * Update viewer count
   */
  static async updateViewerCount(streamId: string, count: number) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream || stream.status !== 'LIVE') return;

    await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        viewerCount: count,
        peakViewers: count > stream.peakViewers ? count : stream.peakViewers,
      },
    });
  }

  /**
   * Get a user's stream history
   */
  static async getUserStreams(userId: string) {
    const streams = await prisma.liveStream.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    return streams;
  }

  /**
   * Get user's active/scheduled stream
   */
  static async getUserActiveStream(userId: string) {
    return prisma.liveStream.findFirst({
      where: {
        userId,
        status: { in: ['SCHEDULED', 'LIVE'] },
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });
  }

  /**
   * Regenerate stream key
   */
  static async regenerateStreamKey(streamId: string, userId: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream) throw new AppError('Stream not found', 404);
    if (stream.userId !== userId) throw new AppError('Not authorized', 403);
    if (stream.status === 'LIVE') throw new AppError('Cannot change key while live', 400);

    const updated = await prisma.liveStream.update({
      where: { id: streamId },
      data: { streamKey: this.generateStreamKey() },
    });

    return updated;
  }
}
