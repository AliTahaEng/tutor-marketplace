/**
 * Rate limiter with two modes:
 *   1. Upstash Redis — works correctly across all serverless instances (production).
 *      Requires: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars.
 *   2. In-memory Map — single-instance fallback (fine for local dev / single server).
 *
 * Setup Upstash (free tier):
 *   1. Create a database at https://console.upstash.com
 *   2. Copy REST URL + token into environment variables
 */

interface RateLimitEntry { count: number; resetAt: number }

// ── In-memory store (dev / single-instance fallback) ─────────────────────────
const memoryStore = new Map<string, RateLimitEntry>()

function memoryCheck(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = memoryStore.get(key)
  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return true   // allowed
  }
  if (entry.count >= max) return false   // blocked
  entry.count++
  return true
}

// ── Upstash Redis (production multi-instance) ─────────────────────────────────
async function redisCheck(key: string, max: number, windowMs: number): Promise<boolean> {
  const url   = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, Math.ceil(windowMs / 1000), 'NX'],
      ]),
    })

    if (!res.ok) throw new Error(`Redis HTTP ${res.status}`)

    const [[, count]] = await res.json() as [[unknown, number], unknown]
    return count <= max   // allowed
  } catch (err) {
    // Fail open — Redis unavailable must not block users
    console.error('[rate-limiter] Redis error, failing open:', err)
    return true
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

const HAS_REDIS =
  typeof process !== 'undefined' &&
  !!process.env['UPSTASH_REDIS_REST_URL'] &&
  !!process.env['UPSTASH_REDIS_REST_TOKEN']

/**
 * Returns true if the request should be BLOCKED (limit exceeded).
 */
export async function isRateLimited(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const allowed = HAS_REDIS
    ? await redisCheck(key, max, windowMs)
    : memoryCheck(key, max, windowMs)
  return !allowed
}

// Pre-configured limits — use in middleware and route handlers
export const RATE_LIMITS = {
  auth:    { max: 5,  windowMs: 60_000 },   // 5 sign-in attempts per minute
  payment: { max: 10, windowMs: 60_000 },   // 10 payment calls per minute
  search:  { max: 60, windowMs: 60_000 },   // 60 searches per minute
} as const

// Legacy synchronous class kept for any existing callers
interface RateLimiterOptions { maxRequests: number; windowMs: number }

export class RateLimiter {
  private readonly store = new Map<string, RateLimitEntry>()
  private readonly options: RateLimiterOptions

  constructor(options: RateLimiterOptions) {
    this.options = options
  }

  isAllowed(key: string): boolean {
    return memoryCheck(key, this.options.maxRequests, this.options.windowMs)
  }

  getRemaining(key: string): number {
    const now = Date.now()
    const entry = this.store.get(key)
    if (!entry || entry.resetAt < now) return this.options.maxRequests
    return Math.max(0, this.options.maxRequests - entry.count)
  }
}

export const authRateLimiter    = new RateLimiter({ maxRequests: 5,  windowMs: 60_000 })
export const paymentRateLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 })
export const searchRateLimiter  = new RateLimiter({ maxRequests: 60, windowMs: 60_000 })
