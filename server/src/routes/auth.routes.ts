import { Router } from 'express';
import { requireAuth } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import {
  handleRegister,
  handleLogin,
  handleLogout,
  handleRefresh,
  handleProfile,
} from '@/controllers/auth.controller';

const router = Router();

router.post('/register', asyncHandler(handleRegister));
router.post('/login', asyncHandler(handleLogin));
router.post('/logout', requireAuth, asyncHandler(handleLogout));
router.post('/refresh', asyncHandler(handleRefresh));
router.get('/me', requireAuth, asyncHandler(handleProfile));

export default router;
