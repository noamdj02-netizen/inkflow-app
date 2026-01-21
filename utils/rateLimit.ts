/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for Vercel Serverless Functions
 * 
 * Note: For production at scale, consider using:
 * - Vercel KV (Redis)
 * - Upstash Redis
 * - Or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Timestamp when the limit resets
}

// In-memory store (cleared on each serverless function cold start)
// For production, use Vercel KV or external Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes (in production, use a scheduled job)
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
  
  lastCleanup = now;
}

/**
 * Rate limit check
 * 
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with `allowed` boolean and `remaining` count
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 3,
  windowMs: number = 60 * 60 * 1000 // 1 hour default
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  // No entry exists, create one
  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }
  
  // Entry expired, reset
  if (now >= entry.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }
  
  // Entry exists and is valid
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }
  
  // Increment count
  entry.count += 1;
  rateLimitStore.set(identifier, entry);
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP address from Vercel request
 */
export function getClientIP(req: any): string {
  // Vercel provides IP in headers
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const realIP = req.headers?.['x-real-ip'];
  const cfConnectingIP = req.headers?.['cf-connecting-ip']; // Cloudflare
  
  // Use the first IP from x-forwarded-for (can contain multiple IPs)
  const ip = forwardedFor?.split(',')[0]?.trim() || 
             realIP || 
             cfConnectingIP || 
             req.socket?.remoteAddress || 
             'unknown';
  
  return ip;
}
