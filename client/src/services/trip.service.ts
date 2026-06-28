import { api } from '@/services/axios';
import type { ApiSuccess } from '@/types/api';

// ============================================================================
// FRONTEND TYPES
// ============================================================================

export interface Activity {
  time?: string;
  activity: string;
  description?: string;
  location?: string;
  cost?: number;
  _id?: string;
}

export interface DayPlan {
  dayNumber: number;
  activities: Activity[];
  _id?: string;
}

export interface BudgetEstimation {
  flights: number;
  hotels: number;
  food: number;
  transport: number;
  activities: number;
  miscellaneous: number;
  total: number;
  currency: string;
  _id: string;
}

export interface HotelSuggestion {
  name: string;
  description?: string;
  pricePerNight: number;
  rating?: number;
  address?: string;
  imageUrl?: string;
  _id: string;
}

export interface Trip {
  _id: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationInDays: number;
  budgetLimit: number;
  companions: string;
  interests: string[];
  itinerary: DayPlan[];
  budgetEstimation?: BudgetEstimation;
  hotelSuggestions?: HotelSuggestion[];
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripListResult {
  trips: Trip[];
  total: number;
  page: number;
  pages: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  explanation?: string;
  timestamp: string;
  _id?: string;
}

export interface AIChat {
  _id: string;
  user: string;
  trip: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface TripHistory {
  _id: string;
  trip: string;
  user: string;
  modifiedAt: string;
  changeSummary: string;
  previousItinerary: DayPlan[];
  newItinerary: DayPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface AssistantResponse {
  trip: Trip;
  explanation: string;
  chat: AIChat;
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Save/create a manual trip.
 */
export async function createTrip(tripData: Partial<Trip>): Promise<Trip> {
  const { data } = await api.post<ApiSuccess<Trip>>('/trips', tripData);
  return data.data;
}

/**
 * Generate a complete AI trip (itinerary, budget, hotels) using Gemini.
 */
export async function generateTrip(tripData: Partial<Trip>): Promise<Trip> {
  const { data } = await api.post<ApiSuccess<Trip>>('/trips/generate', tripData);
  return data.data;
}

/**
 * List trips for the logged-in user with filters and search.
 */
export async function listTrips(search?: string, page = 1, limit = 10): Promise<TripListResult> {
  const params: Record<string, unknown> = { page, limit };
  if (search) params.search = search;

  const { data } = await api.get<ApiSuccess<TripListResult>>('/trips', { params });
  return data.data;
}

/**
 * Fetch detailed trip information by ID.
 */
export async function getTripById(id: string): Promise<Trip> {
  const { data } = await api.get<ApiSuccess<Trip>>(`/trips/${id}`);
  return data.data;
}

/**
 * Update trip properties or manual itinerary.
 */
export async function updateTrip(id: string, tripData: Partial<Trip>): Promise<Trip> {
  const { data } = await api.put<ApiSuccess<Trip>>(`/trips/${id}`, tripData);
  return data.data;
}

/**
 * Delete a trip.
 */
export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trips/${id}`);
}

/**
 * Interact with the AI Assistant to edit/modify the itinerary.
 */
export async function interactWithAssistant(id: string, message: string): Promise<AssistantResponse> {
  const { data } = await api.post<ApiSuccess<AssistantResponse>>(`/trips/${id}/assistant`, { message });
  return data.data;
}

/**
 * Fetch assistant chat history logs.
 */
export async function getChatHistory(id: string): Promise<AIChat> {
  const { data } = await api.get<ApiSuccess<AIChat>>(`/trips/${id}/assistant`);
  return data.data;
}

/**
 * Fetch itinerary change history log list.
 */
export async function getTripHistory(id: string): Promise<TripHistory[]> {
  const { data } = await api.get<ApiSuccess<TripHistory[]>>(`/trips/${id}/history`);
  return data.data;
}
