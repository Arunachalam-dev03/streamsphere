import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema, updateProfileSchema } from '../utils/validators';
import { uploadImage } from '../middleware/upload';
import { StorageService } from '../services/storage.service';

const router = Router();

// Register
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data.email, data.password);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const result = await AuthService.forgotPassword(email);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Reset Password
router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }
    const result = await AuthService.resetPassword(token, password);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});


// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }
    const tokens = await AuthService.refreshToken(refreshToken);
    res.json(tokens);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await AuthService.getProfile(req.user!.userId);
    res.json(user);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await AuthService.updateProfile(req.user!.userId, data);
    res.json(user);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Upload avatar
router.post('/avatar', authenticate, uploadImage.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Avatar image required' });
      return;
    }
    const url = await StorageService.uploadFile(
      req.file.path,
      `avatars/${req.user!.userId}/avatar${require('path').extname(req.file.originalname)}`,
      req.file.mimetype
    );
    StorageService.cleanupTempFile(req.file.path);
    const user = await AuthService.updateProfile(req.user!.userId, { avatar: url });
    res.json(user);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
