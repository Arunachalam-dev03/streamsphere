import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/helpers';
import { EmailService } from './email.service';

export class AuthService {
  static async register(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new AppError('Email already registered', 409);
      }
      throw new AppError('Username already taken', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, ...tokens };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        role: true,
        subscriberCount: true,
        createdAt: true,
        _count: {
          select: {
            videos: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  static async updateProfile(userId: string, data: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    banner?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        role: true,
        subscriberCount: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't leak if user exists or not, but return success anyway
      return { message: 'If an account with that email exists, we sent a password reset link.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour token

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires
      }
    });

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    
    // In production, this would send a real email
    await EmailService.sendPasswordResetEmail(user.email, resetUrl);

    return { message: 'If an account with that email exists, we sent a password reset link.' };
  }

  static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gte: new Date() }
      }
    });

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return { message: 'Password has been successfully changed' };
  }
}
