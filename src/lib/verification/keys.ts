// Imprint — verification token key management.
// Production deployments must NEVER fall back to the default secret. We support
// versioned keys so rotation does not invalidate existing tokens.
//
// Two configuration paths:
//
// 1) VERIFICATION_KEYS env var: a JSON array of { kid, secret, retiredAt? } objects.
//    The first non-retired key is used for signing. All keys are accepted for
//    verification until expired tokens age out.
//
//    Example:
//      VERIFICATION_KEYS='[{"kid":"v2","secret":"hex..."},{"kid":"v1","secret":"old...","retiredAt":"2026-04-01"}]'
//
// 2) Single VERIFICATION_TOKEN_SECRET (legacy). Treated as kid="legacy".
//
// Migration to KMS: replace this module's resolution to fetch keys from AWS KMS,
// GCP KMS, or a secret manager. Token shape and signature format do not change.

import { createHmac, randomBytes } from 'crypto'

interface VerificationKey {
  kid: string
  secret: string
  retiredAt?: Date
}

let cachedKeys: VerificationKey[] | null = null

function loadKeys(): VerificationKey[] {
  if (cachedKeys) return cachedKeys

  const json = process.env.VERIFICATION_KEYS
  if (json) {
    try {
      const raw = JSON.parse(json) as Array<{ kid?: string; secret?: string; retiredAt?: string }>
      const keys: VerificationKey[] = raw
        .filter((k) => k.kid && k.secret)
        .map((k) => ({
          kid: k.kid as string,
          secret: k.secret as string,
          retiredAt: k.retiredAt ? new Date(k.retiredAt) : undefined,
        }))
      if (keys.length > 0) {
        cachedKeys = keys
        return keys
      }
    } catch (e) {
      console.error('[verification keys] VERIFICATION_KEYS parse error:', e)
    }
  }

  // Legacy single-secret fallback.
  const legacy = process.env.VERIFICATION_TOKEN_SECRET
  if (legacy) {
    cachedKeys = [{ kid: 'legacy', secret: legacy }]
    return cachedKeys
  }

  // Fall back to AUTH_SECRET in dev only. Refuse in production.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'VERIFICATION_KEYS or VERIFICATION_TOKEN_SECRET must be set in production. Refusing to sign tokens with default secret.'
    )
  }

  const auth = process.env.AUTH_SECRET
  if (auth) {
    cachedKeys = [{ kid: 'dev-auth', secret: auth }]
    return cachedKeys
  }

  // Last resort: a random per-process key. Tokens won't survive restarts. Dev-only.
  console.warn('[verification keys] No keys configured. Generating a random per-process key. DEV ONLY.')
  cachedKeys = [{ kid: 'ephemeral', secret: randomBytes(32).toString('hex') }]
  return cachedKeys
}

/** Active signing key. The first non-retired key in the list. */
export function getSigningKey(): VerificationKey {
  const keys = loadKeys()
  const active = keys.find((k) => !k.retiredAt || k.retiredAt > new Date())
  if (!active) {
    throw new Error('No active verification key. All keys are retired.')
  }
  return active
}

/** Look up a key by kid for verification. Returns undefined if unknown. */
export function getKeyByKid(kid: string): VerificationKey | undefined {
  return loadKeys().find((k) => k.kid === kid)
}

/** Sign a payload with a specific key. */
export function signWithKey(payload: object, key: VerificationKey): string {
  const hmac = createHmac('sha256', key.secret)
  hmac.update(JSON.stringify(payload))
  return hmac.digest('base64url')
}

/** Reset the cache. Useful in tests; not used in production. */
export function _resetKeyCacheForTests(): void {
  cachedKeys = null
}
