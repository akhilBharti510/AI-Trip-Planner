import { Router } from 'express';
import healthRoutes from '@/routes/health.routes';
import authRoutes from '@/routes/auth.routes';
import tripRoutes from '@/routes/trip.routes';

/**
 * Root API router. Feature routers (auth, users, trips, assistant) are mounted
 * here in their respective phases, keeping `app.ts` free of route wiring.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);

export default router;
