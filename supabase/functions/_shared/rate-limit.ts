/**
 * In-memory token bucket rate limiter for Edge Functions.
 * Identifies callers by JWT sub claim (user ID).
 *
 * Note: Each Edge Function instance has its own memory, so limits
 * are per-isolate. This provides basic protection against abuse
 * without external dependencies.
 */

interface Bucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()

const CLEANUP_INTERVAL = 60_000 // 1 min
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const staleThreshold = now - 120_000 // 2 min
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < staleThreshold) {
      buckets.delete(key)
    }
  }
}

function extractUserId(request: Request): string {
  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return 'anonymous'
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? 'anonymous'
  } catch {
    return 'anonymous'
  }
}

export interface RateLimitOptions {
  maxTokens: number     // Max requests in the window
  refillRate: number    // Tokens added per second
}

const AI_LIMITS: RateLimitOptions = { maxTokens: 60, refillRate: 1 }       // 60/min
const DEFAULT_LIMITS: RateLimitOptions = { maxTokens: 120, refillRate: 2 } // 120/min
const EMAIL_LIMITS: RateLimitOptions = { maxTokens: 30, refillRate: 0.5 }  // 30/min

export function getRateLimitPreset(functionName: string): RateLimitOptions {
  if (functionName.startsWith('ai-')) return AI_LIMITS
  if (functionName.includes('email') || functionName.includes('gmail') || functionName.includes('outlook-send')) return EMAIL_LIMITS
  return DEFAULT_LIMITS
}

export function checkRateLimit(
  request: Request,
  options: RateLimitOptions = DEFAULT_LIMITS
): { allowed: boolean; retryAfter?: number } {
  cleanup()

  const userId = extractUserId(request)
  const now = Date.now()

  let bucket = buckets.get(userId)
  if (!bucket) {
    bucket = { tokens: options.maxTokens, lastRefill: now }
    buckets.set(userId, bucket)
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000
  bucket.tokens = Math.min(options.maxTokens, bucket.tokens + elapsed * options.refillRate)
  bucket.lastRefill = now

  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil((1 - bucket.tokens) / options.refillRate)
    return { allowed: false, retryAfter }
  }

  bucket.tokens -= 1
  return { allowed: true }
}

export function rateLimitResponse(retryAfter: number, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  )
}
