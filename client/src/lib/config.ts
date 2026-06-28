/**
 * Client runtime configuration sourced from public env vars. Only
 * `NEXT_PUBLIC_*` values are available in the browser.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:5000/api/v1';
