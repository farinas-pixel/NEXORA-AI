// src/services/errorHandler.ts
/**
 * Centralized error handling utility.
 * Logs the error (console for now) and returns a user‑friendly message.
 * In a production app you could integrate a free logging service (e.g., Sentry free tier).
 */
export function handleError(error: unknown, context: string): string {
  // Basic console logging – you may replace with a remote logger later.
  console.error(`[Error] ${context}:`, error);
  if (error instanceof Error) {
    return error.message;
  }
  // Fallback generic message.
  return 'An unexpected error occurred.';
}
