import { Router } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '@/utils/ApiResponse';

const router = Router();

const DB_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Liveness/readiness probe. Reports process uptime and DB connection state so
 * platform health checks (Railway) and the client can verify the API is up.
 */
router.get('/', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    uptime: process.uptime(),
    database: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
});

export default router;
