// Imprint — public token verifier endpoint.
// Third parties (Discord bots, ticket vendors, merch checkouts, partner APIs) call
// this to verify a fan's signed token. No auth: tokens are self-verifying via HMAC
// against a rotation-aware signing key.
//
// Hardening:
// - CORS allowlist via VERIFIER_CORS_ALLOWLIST (comma-separated origins, or "*" for any)
// - In-memory rate limit per IP+route (40 req/min default; tune via VERIFIER_RATE_LIMIT)
// - Audit log line per call: timestamp, ip, partner-origin, kid, valid/invalid, reason
//
// Production should swap the rate limiter for Upstash/Vercel KV (see lib/rate-limit.ts).

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/verification/token'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const RATE_LIMIT = Number(process.env.VERIFIER_RATE_LIMIT ?? 40)
const RATE_WINDOW_MS = Number(process.env.VERIFIER_RATE_WINDOW_MS ?? 60_000)
const CORS_ALLOWLIST = (process.env.VERIFIER_CORS_ALLOWLIST ?? '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function corsHeaders(origin: string | null): Record<string, string> {
  if (CORS_ALLOWLIST.includes('*')) {
    return { 'Access-Control-Allow-Origin': '*' }
  }
  if (origin && CORS_ALLOWLIST.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
    }
  }
  return {}
}

function rateLimit(request: NextRequest): { ok: true } | { ok: false; res: NextResponse } {
  const ip = getClientIp(request)
  const result = checkRateLimit({
    key: `verify:${ip}`,
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
  })
  if (!result.ok) {
    const headers: Record<string, string> = {
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    }
    return {
      ok: false,
      res: NextResponse.json(
        { valid: false, error: 'Rate limit exceeded' },
        { status: 429, headers }
      ),
    }
  }
  return { ok: true }
}

function auditLog(input: {
  ip: string
  origin: string | null
  valid: boolean
  reason?: string
  kid?: string
}) {
  // Single-line structured log so the platform's log aggregator can parse it later.
  console.log(
    JSON.stringify({
      type: 'verify',
      ts: new Date().toISOString(),
      ip: input.ip,
      origin: input.origin ?? null,
      valid: input.valid,
      reason: input.reason ?? null,
      kid: input.kid ?? null,
    })
  )
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '600',
    },
  })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const ip = getClientIp(request)

  const limit = rateLimit(request)
  if (!limit.ok) return limit.res

  try {
    const body = await request.json().catch(() => ({}))
    const { token } = body as { token?: string }

    if (!token || typeof token !== 'string') {
      auditLog({ ip, origin, valid: false, reason: 'missing_token' })
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400, headers: corsHeaders(origin) }
      )
    }

    const result = await verifyToken(token)
    auditLog({ ip, origin, valid: result.valid, reason: result.error })

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          expired: result.expired,
          revoked: result.revoked,
          error: result.error,
        },
        { headers: corsHeaders(origin) }
      )
    }

    return NextResponse.json(
      {
        valid: true,
        artistId: result.data?.artistId,
        artistName: result.data?.artistName,
        tier: result.data?.tier,
        stanScore: result.data?.stanScore,
        relationshipMonths: result.data?.relationshipMonths,
        issuedAt: result.data?.issuedAt,
        expiresAt: result.data?.expiresAt,
      },
      { headers: corsHeaders(origin) }
    )
  } catch (error) {
    console.error('Verification error:', error)
    auditLog({ ip, origin, valid: false, reason: 'exception' })
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500, headers: corsHeaders(origin) }
    )
  }
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const ip = getClientIp(request)

  const limit = rateLimit(request)
  if (!limit.ok) return limit.res

  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    auditLog({ ip, origin, valid: false, reason: 'missing_token' })
    return NextResponse.json(
      { valid: false, error: 'Token query parameter is required' },
      { status: 400, headers: corsHeaders(origin) }
    )
  }

  const result = await verifyToken(token)
  auditLog({ ip, origin, valid: result.valid, reason: result.error })

  if (!result.valid) {
    return NextResponse.json(
      {
        valid: false,
        expired: result.expired,
        revoked: result.revoked,
        error: result.error,
      },
      { headers: corsHeaders(origin) }
    )
  }

  return NextResponse.json(
    {
      valid: true,
      artistId: result.data?.artistId,
      artistName: result.data?.artistName,
      tier: result.data?.tier,
      stanScore: result.data?.stanScore,
      relationshipMonths: result.data?.relationshipMonths,
      issuedAt: result.data?.issuedAt,
      expiresAt: result.data?.expiresAt,
    },
    { headers: corsHeaders(origin) }
  )
}
