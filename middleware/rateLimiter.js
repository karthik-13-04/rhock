import { apiError } from '../utils/errorHandler.js';

/**
 * In-memory Rate Limiter Map
 */
const rateLimitMap = new Map();

/**
 * Factory to create rate limiting middleware
 * @param {Object} options 
 * @returns {Function}
 */
export function createRateLimiter({ windowMs, max, message, type = 'general' }) {
  return async (req) => {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Unique key per IP and limiter type
    const key = `${type}:${ip}`;

    let userData = rateLimitMap.get(key) || { requests: [] };
    
    // Filter out requests outside the current window
    userData.requests = userData.requests.filter(timestamp => timestamp > windowStart);
    
    if (userData.requests.length >= max) {
      console.warn(`[RateLimit] Blocked ${type} request from ${ip}`);
      return apiError(429, message || 'Too many requests, please try again later.', 'RATE_LIMIT_EXCEEDED');
    }

    // Record this request
    userData.requests.push(now);
    rateLimitMap.set(key, userData);

    // Prune the map occasionally
    if (rateLimitMap.size > 10000) {
      const keysToDelete = Array.from(rateLimitMap.keys()).slice(0, 1000);
      keysToDelete.forEach(k => rateLimitMap.delete(k));
    }

    return null; // Passed
  };
}

/**
 * 1. AUTH LIMITER: Very strict for login/signup
 * 5 requests per hour per IP
 */
export const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20, // Increased from 5 to 20
  message: 'Too many authentication attempts. Please try again in an hour.',
  type: 'auth'
});

/**
 * 2. OTP LIMITER: Strict for OTP generation
 * 10 requests per hour per IP
 */
export const otpLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30, // Increased from 10 to 30
  message: 'Too many OTP requests. Please try again after an hour.',
  type: 'otp'
});

/**
 * 3. PAYMENT LIMITER: Prevent payment spam
 * 5 requests per 30 minutes
 */
export const paymentLimiter = createRateLimiter({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: 'Payment initiation limit reached. Please wait 30 minutes.',
  type: 'payment'
});

/**
 * 4. GENERAL LIMITER: Standard API protection
 * 100 requests per 15 minutes
 */
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Global rate limit exceeded. Please wait 15 minutes.',
  type: 'general'
});

// Legacy support (mapping strictLimiter to otpLimiter)
export const strictLimiter = otpLimiter;
