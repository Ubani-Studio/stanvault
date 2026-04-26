// Imprint — minimal in-memory rate limiter.
// Suitable for local dev and small staging. Production should swap this for Upstash
// Redis (https://upstash.com/redis) or Vercel KV. The interface below is the swap point.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

interface CheckOptions {
  /** Unique key (typically `${route}:${ip}`). */
  key: string
  /** Max requests allowed in the window. */
  limit: number
  /** Window duration in milliseconds. */
  windowMs: number
}

interface CheckResult {
  ok: boolean
  remaining: number
  resetAt: number
}

/**
 * Token-bucket-style check. Increments the count if under the limit, returns false otherwise.
 */
export function checkRateLimit({ key, limit, windowMs }: CheckOptions): CheckResult {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs }
    buckets.set(key, fresh)
    return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt }
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

/**
 * Pull the caller's IP from the request. Honors common proxy headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

// Periodic cleanup so the map does not grow unbounded.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key)
    }
  }, 60_000).unref?.()
}
