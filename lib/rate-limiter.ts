import { throttle } from 'lodash';
import { NextRequest, NextResponse } from 'next/server';

const ipRequestMap = new Map<string, number>();

const ipResetTimers = new Map<string, NodeJS.Timeout>();

interface RateLimitOptions {
  limit: number;

  windowMs: number;

  message?: string;
}

/**
 * Creates a rate limiter function using lodash's throttle
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { limit, windowMs, message = 'Too many requests, please try again later' } = options;

  return function rateLimiter(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    const currentRequests = ipRequestMap.get(ip) || 0;

    if (currentRequests === 0) {
      const timer = setTimeout(() => {
        ipRequestMap.delete(ip);
        ipResetTimers.delete(ip);
      }, windowMs);

      ipResetTimers.set(ip, timer);
    }

    ipRequestMap.set(ip, currentRequests + 1);

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
