import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiError, type ApiErrorCode } from '@/utils/ApiError';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

/**
 * 404 handler for unmatched routes. Placed after all routes.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

interface NormalizedError {
  statusCode: number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

/**
 * Translate any thrown value into our consistent error envelope. Known error
 * types (ApiError, ZodError, Mongoose duplicate-key/validation) get precise
 * mappings; anything else becomes a 500 and is never leaked in production.
 */
function normalize(err: unknown): NormalizedError {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, code: err.code, message: err.message, details: err.details };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.flatten(),
    };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: Object.values(err.errors).map((e) => e.message),
    };
  }

  // Mongo duplicate key
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return { statusCode: 409, code: 'CONFLICT', message: 'Resource already exists' };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, code: 'BAD_REQUEST', message: `Invalid ${err.path}` };
  }

  return { statusCode: 500, code: 'INTERNAL', message: 'Internal server error' };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const normalized = normalize(err);

  if (normalized.statusCode >= 500) {
    logger.error('Unhandled error', err instanceof Error ? err.stack : String(err));
  }

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    error: {
      code: normalized.code,
      ...(normalized.details !== undefined ? { details: normalized.details } : {}),
      ...(env.isProduction || normalized.statusCode < 500
        ? {}
        : { stack: err instanceof Error ? err.stack : undefined }),
    },
  });
}
