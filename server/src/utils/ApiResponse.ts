import type { Response } from 'express';

/**
 * Consistent success-response envelope used by every controller:
 *   { success: true, message?, data? }
 *
 * The error counterpart is produced centrally by the error middleware, so the
 * client can rely on a single shape across all endpoints.
 */
export interface SuccessEnvelope<T> {
  success: true;
  message?: string;
  data?: T;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response<SuccessEnvelope<T>> {
  return res.status(statusCode).json({ success: true, message, data });
}
