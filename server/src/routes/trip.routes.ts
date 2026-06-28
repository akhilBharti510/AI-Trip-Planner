import { Router } from 'express';
import { requireAuth } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import {
  handleCreateTrip,
  handleListTrips,
  handleGetTripById,
  handleUpdateTrip,
  handleDeleteTrip,
  handleGenerateTrip,
  handleInteractWithAssistant,
  handleGetChatHistory,
  handleGetTripHistory,
} from '@/controllers/trip.controller';

const router = Router();

// Apply requireAuth middleware to all trip endpoints
router.use(requireAuth);

router.post('/', asyncHandler(handleCreateTrip));
router.post('/generate', asyncHandler(handleGenerateTrip));
router.get('/', asyncHandler(handleListTrips));
router.get('/:id', asyncHandler(handleGetTripById));
router.put('/:id', asyncHandler(handleUpdateTrip));
router.delete('/:id', asyncHandler(handleDeleteTrip));

// AI Assistant & History routes
router.post('/:id/assistant', asyncHandler(handleInteractWithAssistant));
router.get('/:id/assistant', asyncHandler(handleGetChatHistory));
router.get('/:id/history', asyncHandler(handleGetTripHistory));

export default router;
