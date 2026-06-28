import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so rejected promises are forwarded to Express's
 * error pipeline. Removes the need for a try/catch in every controller.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
