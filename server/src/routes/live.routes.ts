import { Router, Response } from 'express';
import { LiveService } from '../services/live.service';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const createStreamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
});

// Get all active live streams (public)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await LiveService.getActiveStreams(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get my streams (auth required)
router.get('/my-streams', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const streams = await LiveService.getUserStreams(req.user!.userId);
    res.json({ streams });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get my active/scheduled stream (auth required)
router.get('/my-active', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stream = await LiveService.getUserActiveStream(req.user!.userId);
    res.json({ stream });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Create a new live stream (auth required)
router.post('/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createStreamSchema.parse(req.body);
    const stream = await LiveService.createStream(req.user!.userId, data);
    res.status(201).json(stream);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// End a stream (auth required, owner only)
router.post('/:id/end', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await LiveService.endStreamById(req.params.id, req.user!.userId);
    res.json({ message: 'Stream ended', stream: result });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Regenerate stream key (auth required, owner only)
router.post('/:id/regenerate-key', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stream = await LiveService.regenerateStreamKey(req.params.id, req.user!.userId);
    res.json({ streamKey: stream.streamKey });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get stream by ID (public)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const stream = await LiveService.getStreamById(req.params.id);
    res.json(stream);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
