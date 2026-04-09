import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

function parseExpiry(val: string): number {
  const match = val.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 900; // default 15 minutes
  const num = parseInt(match[1]);
  switch (match[2]) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 3600;
    case 'd': return num * 86400;
    default: return 900;
  }
}

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: parseExpiry(env.JWT_EXPIRES_IN) };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: parseExpiry(env.JWT_REFRESH_EXPIRES_IN) };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export function generateTokenPair(payload: TokenPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

