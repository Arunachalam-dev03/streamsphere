import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get community posts for a channel (with polls)
router.get('/channel/:channelId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: { userId: req.params.channelId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, displayName: true, avatar: true, isVerified: true } },
          poll: {
            include: {
              options: {
                include: {
                  _count: { select: { votes: true } },
                },
              },
            },
          },
        },
      }),
      prisma.communityPost.count({ where: { userId: req.params.channelId } }),
    ]);

    // Check which options the current user voted on
    const postsWithVoteState = await Promise.all(posts.map(async (post) => {
      if (post.poll && req.user) {
        const userVotes = await prisma.pollVote.findMany({
          where: {
            userId: req.user.userId,
            option: { pollId: post.poll.id },
          },
          select: { optionId: true },
        });
        return { ...post, poll: { ...post.poll, userVotedOptionIds: userVotes.map(v => v.optionId) } };
      }
      return { ...post, poll: post.poll ? { ...post.poll, userVotedOptionIds: [] } : null };
    }));

    res.json({ posts: postsWithVoteState, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create community post (with optional poll)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { text, imageUrl, pollOptions } = req.body;
    if (!text?.trim()) {
      res.status(400).json({ error: 'Text content is required' });
      return;
    }

    const post = await prisma.communityPost.create({
      data: { userId: req.user!.userId, text: text.trim(), imageUrl },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true, isVerified: true } },
      },
    });

    // Create poll if options provided
    if (pollOptions && Array.isArray(pollOptions) && pollOptions.length >= 2) {
      const poll = await prisma.poll.create({
        data: {
          communityPostId: post.id,
          options: {
            create: pollOptions.map((opt: string) => ({ text: opt.trim() })),
          },
        },
        include: {
          options: {
            include: { _count: { select: { votes: true } } },
          },
        },
      });
      return res.status(201).json({ ...post, poll: { ...poll, userVotedOptionIds: [] } });
    }

    res.status(201).json({ ...post, poll: null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on a poll
router.post('/poll/:pollId/vote', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { optionId } = req.body;
    if (!optionId) { res.status(400).json({ error: 'optionId is required' }); return; }

    // Verify option belongs to this poll
    const option = await prisma.pollOption.findFirst({
      where: { id: optionId, pollId: req.params.pollId },
    });
    if (!option) { res.status(404).json({ error: 'Option not found in this poll' }); return; }

    // Remove any existing vote for this user in this poll
    await prisma.pollVote.deleteMany({
      where: {
        userId: req.user!.userId,
        option: { pollId: req.params.pollId },
      },
    });

    // Cast new vote
    await prisma.pollVote.create({
      data: { optionId, userId: req.user!.userId },
    });

    // Return updated poll with counts
    const poll = await prisma.poll.findUnique({
      where: { id: req.params.pollId },
      include: {
        options: { include: { _count: { select: { votes: true } } } },
      },
    });

    res.json({ ...poll, userVotedOptionIds: [optionId] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete community post
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post || post.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.communityPost.delete({ where: { id: req.params.id } });
    res.json({ message: 'Post deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
