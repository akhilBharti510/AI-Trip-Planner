/**
 * Application-wide constants. Keeping these centralized avoids magic
 * strings/numbers scattered across the codebase.
 */

export const API_PREFIX = '/api/v1';

export const DEFAULT_CURRENCY = 'INR' as const;

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const RATE_LIMITS = {
  global: { windowMs: 15 * 60 * 1000, max: 300 },
  auth: { windowMs: 15 * 60 * 1000, max: 30 },
  ai: { windowMs: 15 * 60 * 1000, max: 30 },
} as const;
