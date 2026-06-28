import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/token';
import { User, IUser } from '@/models/user.model';
import { ApiError } from '@/utils/ApiError';
import { asyncHandler } from '@/utils/asyncHandler';

export interface AuthenticatedRequest extends Request {
  user: IUser;
}

/**
 * Middleware to require authentication on protected routes.
 * Extracts the JWT from the Authorization Bearer header, validates it,
 * loads the user, and attaches the user object to the request.
 */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token is missing or malformed');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = user;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
});

/**
 * Validates that the resource (carrying a user ID field) belongs to the authenticated user.
 */
export function validateOwnership(userId: string, resourceUserId: string | mongoose.Types.ObjectId): void {
  if (resourceUserId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You do not have permission to access this resource');
  }
}
import mongoose from 'mongoose';
