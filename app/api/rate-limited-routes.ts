import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, apiRateLimiter, authRateLimiter } from '@/middleware/rate-limit';

/**
 * Example of how to apply rate limiting to API routes
 * 
 * Import this file in your API route and wrap your handler function with withRateLimit
 * 
 * Example:
 * ```
 * import { withRateLimit } from '@/app/api/rate-limited-routes';
 * 
 * export const POST = withRateLimit(async (req: NextRequest) => {
 *   // Your handler logic here
 * });
 * ```
 */

// Export the rate limiters and withRateLimit function
export { withRateLimit, apiRateLimiter, authRateLimiter };