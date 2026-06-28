import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '@/services/auth.service';
import { setRefreshCookie, clearRefreshCookie } from '@/utils/cookie';
import { sendSuccess } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { REFRESH_COOKIE_NAME } from '@/config/constants';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';

// Validation schemas
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Handle user registration.
 */
export async function handleRegister(req: Request, res: Response): Promise<void> {
  const payload = registerSchema.parse(req.body);
  const user = await authService.register(payload.name, payload.email, payload.password);
  
  sendSuccess(res, user, 'Account created successfully', 201);
}

/**
 * Handle user login.
 */
export async function handleLogin(req: Request, res: Response): Promise<void> {
  const payload = loginSchema.parse(req.body);
  const session = await authService.login(payload.email, payload.password, payload.rememberMe);

  setRefreshCookie(res, session.refreshToken, payload.rememberMe);

  sendSuccess(
    res,
    {
      user: session.user,
      accessToken: session.accessToken,
    },
    'Logged in successfully'
  );
}

/**
 * Handle user logout.
 */
export async function handleLogout(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;

  if (refreshToken) {
    await authService.logout(authReq.user._id.toString(), refreshToken);
  }

  clearRefreshCookie(res);
  sendSuccess(res, null, 'Logged out successfully');
}

/**
 * Handle access token refresh.
 */
export async function handleRefresh(req: Request, res: Response): Promise<void> {
  const oldRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;
  if (!oldRefreshToken) {
    throw ApiError.unauthorized('Session expired or no refresh token provided');
  }

  const { accessToken, refreshToken } = await authService.refresh(oldRefreshToken);

  // Set the rotated refresh token cookie
  setRefreshCookie(res, refreshToken);

  sendSuccess(res, { accessToken }, 'Token refreshed successfully');
}

/**
 * Handle fetching the current user profile.
 */
export async function handleProfile(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  sendSuccess(res, authReq.user, 'Profile retrieved successfully');
}
