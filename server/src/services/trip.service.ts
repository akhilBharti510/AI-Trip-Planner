import { Trip, ITrip, IDayPlan, Budget, Hotel, AIChat, TripHistory, IAIChat, ITripHistory, IMessage } from '@/models';
import { ApiError } from '@/utils/ApiError';
import { validateOwnership } from '@/middleware/auth.middleware';
import mongoose from 'mongoose';
import * as geminiService from './gemini.service';

export interface TripListResult {
  trips: ITrip[];
  total: number;
  page: number;
  pages: number;
}

export interface ListTripsQuery {
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Calculates duration in days between two dates.
 */
function calculateDuration(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw ApiError.badRequest('Invalid start or end date format');
  }
  
  if (start > end) {
    throw ApiError.badRequest('Start date must be before or equal to end date');
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start & end
  return diffDays;
}

/**
 * Create a new trip.
 */
export async function createTrip(userId: string, tripData: Partial<ITrip>): Promise<ITrip> {
  if (!tripData.startDate || !tripData.endDate) {
    throw ApiError.badRequest('Start date and end date are required');
  }

  const durationInDays = calculateDuration(tripData.startDate, tripData.endDate);
  
  const trip = await Trip.create({
    ...tripData,
    user: new mongoose.Types.ObjectId(userId),
    durationInDays,
    isSaved: true,
  });

  return trip;
}

/**
 * List saved trips for a user with search and pagination support.
 */
export async function listTrips(userId: string, options: ListTripsQuery = {}): Promise<TripListResult> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const skip = (page - 1) * limit;

  const query: mongoose.FilterQuery<ITrip> = {
    user: new mongoose.Types.ObjectId(userId),
    isSaved: true,
  };

  if (options.search) {
    query.destination = { $regex: options.search.trim(), $options: 'i' };
  }

  const [trips, total] = await Promise.all([
    Trip.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('budgetEstimation')
      .populate('hotelSuggestions'),
    Trip.countDocuments(query),
  ]);

  return {
    trips,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Fetch a specific trip by its ID, checking user ownership.
 */
export async function getTripById(userId: string, tripId: string): Promise<ITrip> {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw ApiError.notFound('Trip not found');
  }

  const trip = await Trip.findById(tripId)
    .populate('budgetEstimation')
    .populate('hotelSuggestions');

  if (!trip) {
    throw ApiError.notFound('Trip not found');
  }

  validateOwnership(userId, trip.user);
  return trip;
}

/**
 * Update trip details (dates, options).
 */
export async function updateTrip(userId: string, tripId: string, updateData: Partial<ITrip>): Promise<ITrip> {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw ApiError.notFound('Trip not found');
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw ApiError.notFound('Trip not found');
  }

  validateOwnership(userId, trip.user);

  // Recalculate duration if dates are updated
  if (updateData.startDate || updateData.endDate) {
    const start = updateData.startDate || trip.startDate;
    const end = updateData.endDate || trip.endDate;
    trip.durationInDays = calculateDuration(start, end);
  }

  // Apply updates
  Object.assign(trip, updateData);
  await trip.save();

  // Return refreshed data
  const updatedTrip = await Trip.findById(tripId)
    .populate('budgetEstimation')
    .populate('hotelSuggestions');

  return updatedTrip!;
}

/**
 * Delete a trip, performing cascading deletes of associated budgets and hotels.
 */
export async function deleteTrip(userId: string, tripId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw ApiError.notFound('Trip not found');
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw ApiError.notFound('Trip not found');
  }

  validateOwnership(userId, trip.user);

  // Cascade delete associated assets
  await Promise.all([
    Budget.deleteMany({ trip: trip._id }),
    Hotel.deleteMany({ trip: trip._id }),
    Trip.deleteOne({ _id: trip._id }),
  ]);
}

/**
 * Generate a complete AI trip: itinerary, budget estimation, and hotel recommendations.
 */
export async function generateAiTrip(
  userId: string,
  tripData: {
    destination: string;
    startDate: Date;
    endDate: Date;
    budgetLimit: number;
    companions: string;
    interests: string[];
  }
): Promise<ITrip> {
  const durationInDays = calculateDuration(tripData.startDate, tripData.endDate);

  // 1. Call Gemini services in parallel for efficiency
  const [itineraryResult, budgetResult, hotelsResult] = await Promise.all([
    geminiService.generateItinerary(
      tripData.destination,
      durationInDays,
      tripData.budgetLimit,
      tripData.companions,
      tripData.interests
    ),
    geminiService.estimateBudget(
      tripData.destination,
      durationInDays,
      tripData.budgetLimit,
      tripData.companions,
      tripData.interests
    ),
    geminiService.suggestHotels(
      tripData.destination,
      tripData.budgetLimit
    ),
  ]);

  // Cast results safely
  const itineraryData = itineraryResult as { itinerary: IDayPlan[] };
  const budgetData = budgetResult as {
    flights: number;
    hotels: number;
    food: number;
    transport: number;
    activities: number;
    miscellaneous: number;
    total: number;
  };
  const hotelsData = hotelsResult as {
    hotels: Array<{
      name: string;
      description?: string;
      pricePerNight: number;
      rating: number;
      address: string;
      imageUrl?: string;
    }>;
  };

  // 2. Create the Trip document
  const trip = new Trip({
    user: new mongoose.Types.ObjectId(userId),
    destination: tripData.destination,
    startDate: tripData.startDate,
    endDate: tripData.endDate,
    durationInDays,
    budgetLimit: tripData.budgetLimit,
    companions: tripData.companions,
    interests: tripData.interests,
    itinerary: itineraryData.itinerary || [],
    isSaved: true,
  });
  await trip.save();

  // 3. Create Budget document
  const budget = await Budget.create({
    trip: trip._id,
    flights: budgetData.flights || 0,
    hotels: budgetData.hotels || 0,
    food: budgetData.food || 0,
    transport: budgetData.transport || 0,
    activities: budgetData.activities || 0,
    miscellaneous: budgetData.miscellaneous || 0,
    total: budgetData.total || 0,
  });

  // 4. Create Hotel documents
  const hotelDocs = await Promise.all(
    (hotelsData.hotels || []).map((hotel) =>
      Hotel.create({
        trip: trip._id,
        name: hotel.name,
        description: hotel.description,
        pricePerNight: hotel.pricePerNight,
        rating: hotel.rating,
        address: hotel.address,
        imageUrl: hotel.imageUrl,
      })
    )
  );

  // 5. Link them back to the Trip
  trip.budgetEstimation = budget._id as mongoose.Types.ObjectId;
  trip.hotelSuggestions = hotelDocs.map((h) => h._id as mongoose.Types.ObjectId);
  await trip.save();

  // 6. Return fully populated trip details
  const fullyPopulatedTrip = await Trip.findById(trip._id)
    .populate('budgetEstimation')
    .populate('hotelSuggestions');

  return fullyPopulatedTrip!;
}

/**
 * Interact with the AI Assistant to modify a trip's itinerary.
 */
export async function interactWithAssistant(
  userId: string,
  tripId: string,
  userMessage: string
): Promise<{ trip: ITrip; explanation: string; chat: IAIChat }> {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw ApiError.notFound('Trip not found');
  }
  validateOwnership(userId, trip.user);

  let chat = await AIChat.findOne({ user: userId, trip: tripId });
  if (!chat) {
    chat = await AIChat.create({
      user: new mongoose.Types.ObjectId(userId),
      trip: new mongoose.Types.ObjectId(tripId),
      messages: [],
    });
  }

  const chatHistory = chat.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const result = await geminiService.modifyItinerary(
    trip.destination,
    trip.durationInDays,
    trip.budgetLimit,
    trip.itinerary,
    userMessage,
    chatHistory
  );

  const assistantResult = result as {
    explanation: string;
    itinerary: IDayPlan[];
  };

  const previousItinerary = JSON.parse(JSON.stringify(trip.itinerary));
  const newItinerary = assistantResult.itinerary;

  // Update Trip itinerary
  trip.itinerary = newItinerary;
  await trip.save();

  // Log to TripHistory
  await TripHistory.create({
    trip: trip._id,
    user: new mongoose.Types.ObjectId(userId),
    changeSummary: assistantResult.explanation,
    previousItinerary,
    newItinerary,
  });

  // Log to AIChat
  chat.messages.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  } as unknown as IMessage);

  chat.messages.push({
    role: 'assistant',
    content: assistantResult.explanation,
    explanation: assistantResult.explanation,
    timestamp: new Date(),
  } as unknown as IMessage);
  await chat.save();

  const populatedTrip = await Trip.findById(trip._id)
    .populate('budgetEstimation')
    .populate('hotelSuggestions');

  return {
    trip: populatedTrip!,
    explanation: assistantResult.explanation,
    chat,
  };
}

/**
 * Fetch the AI Assistant chat history for a specific trip.
 */
export async function getChatHistory(userId: string, tripId: string): Promise<IAIChat> {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw ApiError.notFound('Trip not found');
  }
  
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw ApiError.notFound('Trip not found');
  }
  validateOwnership(userId, trip.user);

  let chat = await AIChat.findOne({ user: userId, trip: tripId });
  if (!chat) {
    chat = await AIChat.create({
      user: new mongoose.Types.ObjectId(userId),
      trip: new mongoose.Types.ObjectId(tripId),
      messages: [],
    });
  }

  return chat;
}

/**
 * Fetch the modification history logs for a specific trip.
 */
export async function getTripHistory(userId: string, tripId: string): Promise<ITripHistory[]> {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw ApiError.notFound('Trip not found');
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw ApiError.notFound('Trip not found');
  }
  validateOwnership(userId, trip.user);

  const history = await TripHistory.find({ trip: tripId }).sort({ modifiedAt: -1 });
  return history;
}
