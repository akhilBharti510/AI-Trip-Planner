import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from '@/config/env';
import { API_PREFIX, RATE_LIMITS } from '@/config/constants';
import { ApiError } from '@/utils/ApiError';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import apiRoutes from '@/routes';

/**
 * Build and configure the Express application. Kept free of side effects (no
 * `listen`, no DB connection) so it can be imported by tests and the bootstrap
 * file alike.
 */
export function createApp(): Application {
  const app = express();

  // Trust the platform proxy (Railway/Vercel) so rate limiting and secure
  // cookies see the real client IP and protocol.
  app.set('trust proxy', 1);

  // Security headers.
  app.use(helmet());

  // CORS with an explicit allowlist; credentials enabled for refresh cookies.
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin/non-browser requests (no Origin header).
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new ApiError(403, 'FORBIDDEN', `Origin not allowed: ${origin}`));
      },
      credentials: true,
    })
  );

  // Body & cookie parsing.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Response compression.
  app.use(compression());

  // HTTP request logging (concise in dev, combined in prod).
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  // Global rate limiter; stricter per-route limiters are added in later phases.
  app.use(
    rateLimit({
      ...RATE_LIMITS.global,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, _res, next) =>
        next(new ApiError(429, 'RATE_LIMITED', 'Too many requests, please try again later.')),
    })
  );

  // API routes.
  app.use(API_PREFIX, apiRoutes);

  // Root info endpoint.
  app.get('/', (_req, res) => {
    res.json({ success: true, message: 'AI Travel Planner API', version: 'v1' });
  });

  // 404 + centralized error handling (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
