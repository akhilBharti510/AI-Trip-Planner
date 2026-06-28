import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

// ============================================================================
// GEMINI API TYPES
// ============================================================================

interface GeminiResponse {
  output_text?: string;
  outputText?: string;
  steps?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown;
  };
}

class GeminiApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly model: string,
    public readonly rootCause: string,
    public readonly details?: unknown
  ) {
    super(rootCause);
    Object.setPrototypeOf(this, GeminiApiError.prototype);
  }

  get isUnavailableModel(): boolean {
    return this.status === 404;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isServiceUnavailable(): boolean {
    return this.status === 503;
  }

  get isRetryable(): boolean {
    return this.isRateLimited || this.isServiceUnavailable || this.status >= 500;
  }
}

// ============================================================================
// GEMINI API JSON SCHEMAS (Google Generative AI Format)
// ============================================================================

const ITINERARY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    itinerary: {
      type: 'ARRAY',
      description: 'List of days in the travel plan',
      items: {
        type: 'OBJECT',
        properties: {
          dayNumber: { type: 'INTEGER', description: 'The day index (1-based)' },
          activities: {
            type: 'ARRAY',
            description: 'List of things to do on this day',
            items: {
              type: 'OBJECT',
              properties: {
                time: { type: 'STRING', description: 'Time of day e.g., "09:00 AM", "Morning", "Evening"' },
                activity: { type: 'STRING', description: 'Name of the activity' },
                description: { type: 'STRING', description: 'Short description of what the activity entails' },
                location: { type: 'STRING', description: 'Name of the place/landmark' },
                cost: { type: 'INTEGER', description: 'Estimated cost of this activity in INR (₹)' },
              },
              required: ['activity'],
            },
          },
        },
        required: ['dayNumber', 'activities'],
      },
    },
  },
  required: ['itinerary'],
};

const BUDGET_SCHEMA = {
  type: 'OBJECT',
  properties: {
    flights: { type: 'INTEGER', description: 'Estimated flights cost in INR (₹)' },
    hotels: { type: 'INTEGER', description: 'Estimated hotel accommodations cost in INR (₹)' },
    food: { type: 'INTEGER', description: 'Estimated food and meals cost in INR (₹)' },
    transport: { type: 'INTEGER', description: 'Estimated local transport cost in INR (₹)' },
    activities: { type: 'INTEGER', description: 'Estimated sights and activities cost in INR (₹)' },
    miscellaneous: { type: 'INTEGER', description: 'Estimated miscellaneous/emergency cost in INR (₹)' },
    total: { type: 'INTEGER', description: 'Total sum of all category estimations in INR (₹)' },
  },
  required: ['flights', 'hotels', 'food', 'transport', 'activities', 'miscellaneous', 'total'],
};

const HOTELS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    hotels: {
      type: 'ARRAY',
      description: 'Recommended hotel suggestions',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING', description: 'Name of the hotel' },
          description: { type: 'STRING', description: 'Short description highlighting amenities and style' },
          pricePerNight: { type: 'INTEGER', description: 'Price per night in INR (₹)' },
          rating: { type: 'NUMBER', description: 'User rating (1.0 to 5.0)' },
          address: { type: 'STRING', description: 'Location address' },
          imageUrl: { type: 'STRING', description: 'Optional representative image URL or placeholder' },
        },
        required: ['name', 'pricePerNight', 'rating', 'address'],
      },
    },
  },
  required: ['hotels'],
};

const ASSISTANT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    explanation: { type: 'STRING', description: 'Clear explanation describing what modifications were made and why' },
    itinerary: {
      type: 'ARRAY',
      description: 'The updated complete itinerary reflecting only the requested changes',
      items: {
        type: 'OBJECT',
        properties: {
          dayNumber: { type: 'INTEGER' },
          activities: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                time: { type: 'STRING' },
                activity: { type: 'STRING' },
                description: { type: 'STRING' },
                location: { type: 'STRING' },
                cost: { type: 'INTEGER' },
              },
              required: ['activity'],
            },
          },
        },
        required: ['dayNumber', 'activities'],
      },
    },
  },
  required: ['explanation', 'itinerary'],
};

// ============================================================================
// CORE SERVICE RUNNER
// ============================================================================

/**
 * Sends a structured generation request to Google Gemini API.
 */
async function callGemini(
  prompt: string,
  responseSchema: object,
  systemInstruction?: string
): Promise<unknown> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw ApiError.ai('GEMINI_API_KEY is not configured in backend environment variables');
  }

  const models = getModelCandidates();
  if (models.length === 0) {
    throw ApiError.ai('GEMINI_MODEL is not configured in backend environment variables');
  }

  let lastError: unknown;

  for (const model of models) {
    try {
      return await callGeminiModel(prompt, responseSchema, model, apiKey, systemInstruction);
    } catch (error) {
      lastError = error;

      if (error instanceof GeminiApiError) {
        logger.error('Gemini API request failed', {
          model: error.model,
          status: error.status,
          statusText: error.statusText,
          rootCause: error.rootCause,
          details: error.details,
        });

        if (error.isUnavailableModel) {
          logger.warn('Gemini model unavailable, trying fallback model', { failedModel: model });
          continue;
        }

        if (error.isRateLimited || error.isServiceUnavailable) {
          logger.warn('Gemini model temporarily unavailable, trying fallback model', {
            failedModel: model,
            status: error.status,
          });
          continue;
        }

        throw toApiError(error);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('Gemini request failed before receiving a valid API response', {
        model,
        rootCause: error instanceof Error ? error.message : String(error),
      });
      throw ApiError.ai('Gemini request failed before receiving a valid API response', {
        model,
        rootCause: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (lastError instanceof GeminiApiError) {
    throw toApiError(lastError);
  }

  throw ApiError.ai('Gemini API request failed for all configured models');
}

async function callGeminiModel(
  prompt: string,
  responseSchema: object,
  model: string,
  apiKey: string,
  systemInstruction?: string
): Promise<unknown> {
  const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
  const payload = {
    model,
    input: prompt,
    ...(systemInstruction ? { system_instruction: systemInstruction } : {}),
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: normalizeJsonSchema(responseSchema),
    },
    generation_config: {
      temperature: 0.2,
    },
  };

  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw await buildGeminiApiError(response, model);
      }

      const data = (await response.json()) as GeminiResponse;
      const rawText = extractOutputText(data);

      if (!rawText) {
        throw ApiError.ai('Gemini API returned an empty response', { model });
      }

      try {
        return JSON.parse(rawText.trim());
      } catch {
        logger.error('Failed to parse Gemini JSON output', {
          model,
          rawText,
        });
        throw ApiError.ai('Gemini API returned malformed or unparseable JSON', { model, rawText });
      }
    } catch (error) {
      lastError = error;
      if (error instanceof GeminiApiError && error.isRetryable && attempt < maxAttempts) {
        logger.warn('Retrying Gemini request after transient API failure', {
          model,
          attempt,
          status: error.status,
          rootCause: error.rootCause,
        });
        await wait(750 * attempt);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function getModelCandidates(): string[] {
  const configuredModels = [env.GEMINI_MODEL, ...env.GEMINI_FALLBACK_MODELS.split(',')]
    .map((model) => model.trim())
    .filter(Boolean);

  return Array.from(new Set(configuredModels));
}

function normalizeJsonSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map((item) => normalizeJsonSchema(item));
  }

  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [
      key,
      key === 'type' && typeof value === 'string'
        ? value.toLowerCase()
        : normalizeJsonSchema(value),
    ])
  );
}

function extractOutputText(data: GeminiResponse): string | undefined {
  if (data.output_text) return data.output_text;
  if (data.outputText) return data.outputText;

  const textFromSteps = data.steps
    ?.flatMap((step) => step.content || [])
    .filter((content) => !content.type || content.type === 'text')
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text))
    .join('');

  if (textFromSteps) return textFromSteps;

  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function buildGeminiApiError(response: Response, model: string): Promise<GeminiApiError> {
  const rawBody = await response.text();
  let parsedBody: GeminiErrorBody | undefined;

  try {
    parsedBody = rawBody ? (JSON.parse(rawBody) as GeminiErrorBody) : undefined;
  } catch {
    parsedBody = undefined;
  }

  const rootCause =
    parsedBody?.error?.message ||
    rawBody ||
    `Gemini API returned ${response.statusText || 'an unsuccessful response'}`;

  return new GeminiApiError(
    response.status,
    response.statusText,
    model,
    rootCause,
    parsedBody?.error?.details || rawBody
  );
}

function toApiError(error: GeminiApiError): ApiError {
  const details = {
    model: error.model,
    upstreamStatus: error.status,
    upstreamStatusText: error.statusText,
    rootCause: error.rootCause,
    details: error.details,
  };

  if (error.isRateLimited) {
    return new ApiError(429, 'RATE_LIMITED', 'Gemini rate limit exceeded. Please try again shortly.', details);
  }

  if (error.isServiceUnavailable) {
    return ApiError.ai('Gemini service is temporarily unavailable. Please try again shortly.', details);
  }

  if (error.isUnavailableModel) {
    return ApiError.ai('Configured Gemini model is unavailable and no fallback model succeeded.', details);
  }

  return ApiError.ai(`Gemini API request failed: ${error.rootCause}`, details);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ============================================================================
// EXPOSED INTERFACES
// ============================================================================

/**
 * Generate a complete travel itinerary based on search filters.
 */
export async function generateItinerary(
  destination: string,
  durationInDays: number,
  budgetLimit: number,
  companions: string,
  interests: string[]
): Promise<unknown> {
  const prompt = `
    Generate a complete day-by-day travel itinerary for a trip to: ${destination}.
    Trip Details:
    - Duration: ${durationInDays} days
    - Budget Limit: ₹${budgetLimit} INR
    - Companion Type: ${companions}
    - User Interests: ${interests.join(', ') || 'General Sightseeing'}

    Requirements:
    1. Organize the plan Day-by-Day (exactly ${durationInDays} days).
    2. Suggest realistic activities that fit the budget, companion type, and interests.
    3. For each activity, estimate costs in INR (₹) and assign a location name.
  `;

  const systemInstruction = `
    You are a professional travel planner. You generate extremely detailed and engaging travel itineraries.
    You must always adhere to the budget, companion restrictions, and duration.
    Always format your response exactly in JSON matching the requested schema.
  `;

  return callGemini(prompt, ITINERARY_SCHEMA, systemInstruction);
}

/**
 * Generate budget estimation breakdown.
 */
export async function estimateBudget(
  destination: string,
  durationInDays: number,
  budgetLimit: number,
  companions: string,
  interests: string[]
): Promise<unknown> {
  const prompt = `
    Provide a realistic budget breakdown estimation in INR (₹) for a trip to: ${destination}.
    Trip parameters:
    - Duration: ${durationInDays} days
    - Total User Budget Limit: ₹${budgetLimit} INR
    - Companion Type: ${companions}
    - Interests: ${interests.join(', ')}

    Requirements:
    1. Provide cost estimations for flights, hotels, food, transport, activities, and miscellaneous.
    2. Sum these categories into a "total" field which should realistically fit the budgetLimit (₹${budgetLimit} INR).
  `;

  const systemInstruction = `
    You are a travel finance analyst. Estimate realistic costs for the requested destination and parameters in Indian Rupees (INR).
    Always format your response exactly in JSON matching the requested schema.
  `;

  return callGemini(prompt, BUDGET_SCHEMA, systemInstruction);
}

/**
 * Suggest recommended hotels.
 */
export async function suggestHotels(
  destination: string,
  budgetLimit: number
): Promise<unknown> {
  const prompt = `
    Recommend a list of 3-5 hotels in ${destination} that would fit a traveler with a budget limit of ₹${budgetLimit} INR.
    Include ratings (1-5), address, and typical price per night in INR.
  `;

  const systemInstruction = `
    You are a local hospitality guide. Recommend top rated hotels at various price ranges within the budget.
    Always format your response exactly in JSON matching the requested schema.
  `;

  return callGemini(prompt, HOTELS_SCHEMA, systemInstruction);
}

/**
 * Modify a portion of the itinerary using the Assistant.
 */
export async function modifyItinerary(
  destination: string,
  durationInDays: number,
  budgetLimit: number,
  currentItinerary: unknown,
  instruction: string,
  chatHistory: unknown[]
): Promise<unknown> {
  const prompt = `
    We are planning a trip to ${destination} for ${durationInDays} days, with a budget of ₹${budgetLimit} INR.
    The current itinerary is: ${JSON.stringify(currentItinerary)}
    
    The user wants to make a modification. Here is the instruction:
    "${instruction}"

    Recent chat context:
    ${JSON.stringify(chatHistory.slice(-4))}

    Requirements:
    1. Apply the modification only to the required days/activities.
    2. Return the COMPLETE itinerary with the modified portions integrated. Do not truncate the other days.
    3. Write a clear, detailed explanation of what changes you made and why in the "explanation" field.
  `;

  const systemInstruction = `
    You are an expert travel assistant. You modify existing travel plans based on user commands.
    You must always explain your changes and output the entire updated itinerary matching the schema.
  `;

  return callGemini(prompt, ASSISTANT_SCHEMA, systemInstruction);
}
