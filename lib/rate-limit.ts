/**
 * Rate limiting pour API et Server Actions (anti-abus).
 *
 * En développement : limite en mémoire (par instance).
 * En production : configurer Upstash Redis pour une limite partagée entre instances.
 *
 * Usage Upstash (recommandé en prod) :
 * 1. npm install @upstash/ratelimit @upstash/redis
 * 2. Définir UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN
 * 3. Décommenter le bloc "Upstash" ci-dessous et utiliser getRateLimiter()
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_LIMIT = 10; // requêtes par fenêtre

type Entry = { count: number; resetAt: number };
const memoryStore = new Map<string, Entry>();

function prune(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt < now) memoryStore.delete(key);
  }
}

export type RateLimitResult =
  | { success: true; remaining: number; resetAt: number }
  | { success: false; retryAfterMs: number };

/**
 * Limite en mémoire (par processus). Utiliser Upstash en production multi-instances.
 */
export function rateLimit(
  identifier: string,
  limit: number = DEFAULT_LIMIT
): RateLimitResult {
  prune();
  const now = Date.now();
  let entry = memoryStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    memoryStore.set(identifier, entry);
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      success: false,
      retryAfterMs: Math.max(0, entry.resetAt - now),
    };
  }

  return {
    success: true,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Identifiant pour le rate limiting (IP ou userId).
 * À utiliser depuis le middleware ou les API routes avec request.ip / request.headers.get('x-forwarded-for').
 */
export function getIdentifierFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') ?? 'unknown';
  return ip;
}
