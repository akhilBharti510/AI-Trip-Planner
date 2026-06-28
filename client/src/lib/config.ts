/**
 * Client runtime configuration sourced from public env vars. Only
 * `NEXT_PUBLIC_*` values are available in the browser.
 */
let rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (rawUrl) {
  rawUrl = rawUrl.replace(/\/$/, '');
  
  // If it's a domain name without protocol (e.g. ai-trip-planner-server.up.railway.app),
  // prepend https:// so Axios treats it as an absolute URL.
  if (!rawUrl.startsWith('/') && !/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`;
  }
  
  // Ensure the /api/v1 path suffix is appended if missing.
  if (!rawUrl.endsWith('/api/v1') && !rawUrl.endsWith('/api/v1/')) {
    if (rawUrl.endsWith('/api')) {
      rawUrl = `${rawUrl}/v1`;
    } else {
      rawUrl = `${rawUrl}/api/v1`;
    }
  }
}

export const API_BASE_URL = rawUrl ?? 'http://localhost:5000/api/v1';

if (typeof window !== 'undefined') {
  console.log('🔌 Wayfarer.ai API Base URL configured to:', API_BASE_URL);
}

