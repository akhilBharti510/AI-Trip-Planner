import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';

export interface TokenPayload {
  userId: string;
}

/**
 * Generate a JWT access token.
 */
export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/**
 * Generate a JWT refresh token.
 */
export function generateRefreshToken(userId: string, rememberMe = false): string {
  const expiresIn = rememberMe ? env.JWT_REFRESH_EXPIRES_IN_REMEMBER : env.JWT_REFRESH_EXPIRES_IN;
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  });
}

/**
 * Verify a JWT access token.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

/**
 * Verify a JWT refresh token.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
