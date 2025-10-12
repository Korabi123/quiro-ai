import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limiter';

// Create different rate limiters for different endpoints
export const globalRateLimiter = createRateLimiter({
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests, please try again later'
});

export const authRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many authentication attempts, please try again later'
});

export const apiRateLimiter = createRateLimiter({
  limit: 50,
  windowMs: 60 * 1000, // 1 minute
  message: 'API rate limit exceeded, please try again later'
});

/**
 * Middleware to apply rate limiting to API routes
 */
export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse, limiter = apiRateLimiter) {
  return async function rateLimit(req: NextRequest) {
    // Apply rate limiting
    const rateLimitResponse = limiter(req);
    
    // If rate limited, return the response
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Otherwise, continue to the handler
    return handler(req);
  };
}