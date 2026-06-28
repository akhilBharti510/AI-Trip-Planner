/**
 * Operational error carrying an HTTP status code and a machine-readable code.
 *
 * Throwing `ApiError` anywhere in the request lifecycle lets the centralized
 * error handler produce a consistent response envelope. `isOperational`
 * distinguishes expected errors (validation, auth, not-found) from unexpected
 * bugs, which we never leak to clients in production.
 */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'AI_ERROR'
  | 'INTERNAL';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, 'CONFLICT', message);
  }

  static validation(message = 'Validation failed', details?: unknown) {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static ai(message = 'AI service error', details?: unknown) {
    return new ApiError(502, 'AI_ERROR', message, details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL', message, undefined, false);
  }
}
