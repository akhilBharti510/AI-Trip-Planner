/**
 * Shared API contract types that mirror the server's response envelope. Keeping
 * these in one place lets every service/hook stay strongly typed against the
 * backend.
 */

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
}

export interface HealthStatus {
  status: string;
  uptime: number;
  database: string;
  timestamp: string;
}
