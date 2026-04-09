import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(50),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
});

export const videoUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(5000).optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional().default('PUBLIC'),
  tags: z.array(z.string()).optional(),
});

export const videoUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
  tags: z.array(z.string()).optional(),
});

export const commentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(2000),
  parentId: z.string().uuid().optional(),
});

export const playlistSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional().default('PUBLIC'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sort: z.enum(['relevance', 'date', 'views']).optional().default('relevance'),
});
