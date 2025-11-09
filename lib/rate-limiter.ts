import { throttle } from 'lodash';
import { NextRequest, NextResponse } from 'next/server';

// Store for tracking request counts by IP
const ipRequestMap = new Map<string, number>();

// Store for tracking when IPs should be reset
const ipResetTimers = new Map<string, NodeJS.Timeout>();

interface RateLimitOptions {
  // Maximum number of requests allowed in the window
  limit: number;

  // Time window in seconds
  windowMs: number;

  // Optional message to return when rate limited
  message?: string;
}

/**
 * Creates a rate limiter function using lodash's throttle
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { limit, windowMs, message = 'Too many requests, please try again later' } = options;

  return function rateLimiter(req: NextRequest) {
    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    // Get current count for this IP or initialize to 0
    const currentRequests = ipRequestMap.get(ip) || 0;

    // If this is the first request from this IP, set up reset timer
    if (currentRequests === 0) {
      const timer = setTimeout(() => {
        ipRequestMap.delete(ip);
        ipResetTimers.delete(ip);
      }, windowMs);

      ipResetTimers.set(ip, timer);
    }

    // Increment request count
    ipRequestMap.set(ip, currentRequests + 1);

    // Check if rate limit exceeded
    if (currentRequests >= limit) {
      return NextResponse.json(
        { error: message },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(Date.now() + windowMs).toString()
          }
        }
      );
    }

    // Not rate limited, continue
    return null;
  };
}

/**
 * Creates a throttled function using lodash
 */
export function createThrottledFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number
) {
  return throttle(func, wait, { trailing: false });
}
