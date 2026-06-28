import type { Request, Response } from 'express';
import { z } from 'zod';
import * as tripService from '@/services/trip.service';
import { sendSuccess } from '@/utils/ApiResponse';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { ITrip } from '@/models/trip.model';

// Validation schemas
const activitySchema = z.object({
  time: z.string().trim().optional(),
  activity: z.string().trim().min(1, 'Activity description is required'),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  cost: z.number().nonnegative().optional().default(0),
});

const dayPlanSchema = z.object({
  dayNumber: z.number().int().positive(),
  activities: z.array(activitySchema),
});

const createTripSchema = z.object({
  destination: z.string().trim().min(1, 'Destination is required'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  budgetLimit: z.number().positive('Budget limit must be positive'),
  companions: z.string().trim().min(1, 'Companion type is required'),
  interests: z.array(z.string()).default([]),
  itinerary: z.array(dayPlanSchema).optional(),
});

const updateTripSchema = z.object({
  destination: z.string().trim().optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  budgetLimit: z.number().positive().optional(),
  companions: z.string().trim().optional(),
  interests: z.array(z.string()).optional(),
  itinerary: z.array(dayPlanSchema).optional(),
  isSaved: z.boolean().optional(),
});

/**
 * Create a new trip.
 */
export async function handleCreateTrip(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const payload = createTripSchema.parse(req.body);

  const trip = await tripService.createTrip(authReq.user._id.toString(), payload as unknown as Partial<ITrip>);
  sendSuccess(res, trip, 'Trip created successfully', 201);
}

/**
 * List trips for the active user.
 */
export async function handleListTrips(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  
  const search = req.query.search?.toString();
  const page = req.query.page ? parseInt(req.query.page.toString(), 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit.toString(), 10) : undefined;

  const result = await tripService.listTrips(authReq.user._id.toString(), {
    search,
    page,
    limit,
  });

  sendSuccess(res, result, 'Trips retrieved successfully');
}

/**
 * Get details for a single trip.
 */
export async function handleGetTripById(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const trip = await tripService.getTripById(authReq.user._id.toString(), req.params.id);
  
  sendSuccess(res, trip, 'Trip details retrieved successfully');
}

/**
 * Update details of a trip.
 */
export async function handleUpdateTrip(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const payload = updateTripSchema.parse(req.body);

  const trip = await tripService.updateTrip(authReq.user._id.toString(), req.params.id, payload as unknown as Partial<ITrip>);
  sendSuccess(res, trip, 'Trip updated successfully');
}

/**
 * Delete a trip.
 */
export async function handleDeleteTrip(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  await tripService.deleteTrip(authReq.user._id.toString(), req.params.id);
  
  sendSuccess(res, null, 'Trip deleted successfully');
}

/**
 * Generate a complete AI trip: itinerary, budget, and hotel recommendations.
 */
export async function handleGenerateTrip(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const payload = createTripSchema.parse(req.body);

  const trip = await tripService.generateAiTrip(authReq.user._id.toString(), payload as unknown as {
    destination: string;
    startDate: Date;
    endDate: Date;
    budgetLimit: number;
    companions: string;
    interests: string[];
  });
  sendSuccess(res, trip, 'AI Trip generated successfully', 201);
}

const assistantMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message is required'),
});

/**
 * Interact with the AI Assistant to edit the itinerary.
 */
export async function handleInteractWithAssistant(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const { message } = assistantMessageSchema.parse(req.body);

  const result = await tripService.interactWithAssistant(
    authReq.user._id.toString(),
    req.params.id,
    message
  );

  sendSuccess(res, result, 'AI Assistant responded successfully');
}

/**
 * Fetch the assistant chat logs for a specific trip.
 */
export async function handleGetChatHistory(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const chat = await tripService.getChatHistory(authReq.user._id.toString(), req.params.id);
  sendSuccess(res, chat, 'Chat history retrieved successfully');
}

/**
 * Fetch the itinerary modification logs for a specific trip.
 */
export async function handleGetTripHistory(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const history = await tripService.getTripHistory(authReq.user._id.toString(), req.params.id);
  sendSuccess(res, history, 'Trip modification history retrieved successfully');
}
