/**
 * Non-gameable conviction scoring (Imprint v2).
 *
 * Implementation of the four-tier signal stack described in
 * `stanvault/nongamable.md`. Composite score with:
 *
 *   Tier 1 physical-world          0.40 weight
 *   Tier 2 identity + tenure       0.20 weight
 *   Tier 3 money commitment        0.20 weight
 *   Tier 4 behavioural depth       0.15 weight
 *   Tier 0 vanity (discounted)     0.05 weight
 *
 * Plus anti-gaming mechanics: velocity caps, identity-uniqueness
 * check, honeypot detection, token-gated escalation (no fan
 * becomes Superfan without at least one Tier 1 signal).
 *
 * This module is pure (no DB calls). Inputs come from the caller
 * which has already fetched all the relevant signals from Prisma.
 * Stays testable that way.
 */

export type Tier = 'CASUAL' | 'ENGAGED' | 'DEDICATED' | 'SUPERFAN'

export interface PhysicalSignals {
  // Counts of each kind of un-fakeable signal.
  attendances: number          // verified concert / event scans
  shipments: number            // verified merch shipments
  inPersonMeets: number        // photo-with-artist + sign-off
  offPlatformWitness: number   // tattoos, fan art, real-world flyer mentions
}

export interface IdentitySignals {
  proofOfPersonhood: boolean   // World ID / BrightID / Civic etc verified within 6mo
  crossPlatformHandles: number // how many platforms with verified-same-handle (0-4+)
  subscriptionMonths: number   // total recurring-subscription tenure
  accountAgeYears: number      // age of primary identity
}

export interface MoneySignals {
  donationsCents: number       // total donations cents (post velocity-cap)
  purchases: Array<{ priceCents: number }>  // merch / album / etc
  currentTier: Tier            // current Imprint membership tier
}

export interface BehaviouralSignals {
  voiceVideoResponses: number  // submitted + reviewed
  detailedTextResponses: number // 100+ chars, language-coherent
  sustainedListeningSessions: number // re-plays, 80%+ finish
  offPlatformMentions: number  // bio links, story mentions
}

export interface VanitySignals {
  views: number
  likes: number
  follows: number
  shares: number
}

export interface ConvictionInput {
  physical: PhysicalSignals
  identity: IdentitySignals
  money: MoneySignals
  behavioural: BehaviouralSignals
  vanity: VanitySignals

  // Per-artist normalisation context. The artist's catalogue
  // ceiling lets a casual artist's superfan and a global artist's
  // superfan share the same scale.
  artistCeiling: number  // max raw score observed across this artist's fans

  // Flags from earlier passes (anti-gaming).
  flags: {
    honeypot: boolean        // engages only with this artist
    suspectedAlt: boolean    // identity-uniqueness check failed
    inviterUntrusted: boolean // came in via low-trust inviter chain
  }
}

export interface ConvictionOutput {
  score: number               // 0-100 composite
  tier: Tier
  breakdown: {
    physical: number
    identity: number
    money: number
    behavioural: number
    vanity: number
  }
  flags: string[]             // any active anti-gaming flag
  superfanEligible: boolean
}

// Tier 1: physical-world. Big rewards per signal because each is
// expensive to fake.
function scorePhysical(p: PhysicalSignals): number {
  return (
    Math.min(200, p.attendances * 20) +
    Math.min(200, p.shipments * 12) +
    Math.min(200, p.inPersonMeets * 25) +
    Math.min(200, p.offPlatformWitness * 30)
  )
}

// Tier 2: identity + tenure. World ID one-time bonus; subscription
// tenure caps at 24 months so it doesn't dominate.
function scoreIdentity(i: IdentitySignals): number {
  let s = 0
  if (i.proofOfPersonhood) s += 15
  s += Math.min(32, i.crossPlatformHandles * 8)
  s += Math.min(24, i.subscriptionMonths)
  if (i.accountAgeYears >= 2) s += 5
  return s
}

// Tier 3: money. Velocity-capped at the input layer; here we just
// roll up the result. Plus a tier kicker.
function scoreMoney(m: MoneySignals): number {
  let s = 0
  s += (m.donationsCents / 100) * 0.5
  s += m.purchases.reduce((acc, p) => acc + 5 + (p.priceCents / 1000), 0)
  const tierKick = { CASUAL: 0, ENGAGED: 2, DEDICATED: 5, SUPERFAN: 10 }
  s += tierKick[m.currentTier]
  return s
}

// Tier 4: behavioural depth. Bots can fake some of this but not
// at scale. Voice/video responses are the hardest; detailed text
// is reviewed for language coherence.
function scoreBehavioural(b: BehaviouralSignals): number {
  let s = 0
  s += b.voiceVideoResponses * 3
  s += Math.min(20, b.detailedTextResponses)  // cap detailed text per month
  s += b.sustainedListeningSessions * 0.2
  s += b.offPlatformMentions * 2
  return s
}

// Tier 0: vanity. Deliberately small contribution.
function scoreVanity(v: VanitySignals): number {
  return (v.views + v.likes + v.follows + v.shares) * 0.01
}

/**
 * Compute conviction from the four signal tiers. Returns the
 * composite score, the tier, and which anti-gaming flags fired.
 */
export function computeConviction(input: ConvictionInput): ConvictionOutput {
  const physRaw = scorePhysical(input.physical)
  const identRaw = scoreIdentity(input.identity)
  const moneyRaw = scoreMoney(input.money)
  const behavRaw = scoreBehavioural(input.behavioural)
  const vanRaw = scoreVanity(input.vanity)

  // Normalise each tier against the artist's catalogue ceiling
  // before weighting, so the scale is consistent across fans.
  const ceiling = Math.max(1, input.artistCeiling)
  const norm = (raw: number) => Math.max(0, Math.min(100, (raw / ceiling) * 100))

  const physical = norm(physRaw)
  const identity = norm(identRaw)
  const money = norm(moneyRaw)
  const behavioural = norm(behavRaw)
  const vanity = norm(vanRaw)

  let composite = (
    physical * 0.40
    + identity * 0.20
    + money * 0.20
    + behavioural * 0.15
    + vanity * 0.05
  )

  const flags: string[] = []

  // Anti-gaming dampeners.
  if (input.flags.honeypot) {
    flags.push('honeypot-detected')
    composite = Math.min(composite, 30)
  }
  if (input.flags.suspectedAlt) {
    flags.push('suspected-alt')
    composite = composite * 0.5
  }
  if (input.flags.inviterUntrusted) {
    flags.push('inviter-untrusted')
    composite = composite * 0.7
  }

  composite = Math.max(0, Math.min(100, Math.round(composite)))

  // Token-gated escalation: cannot promote to Superfan tier
  // unless at least one Tier 1 signal exists. The composite can be
  // 80+, but the surfaced tier holds at Dedicated.
  const hasPhysicalSignal = (
    input.physical.attendances +
    input.physical.shipments +
    input.physical.inPersonMeets +
    input.physical.offPlatformWitness
  ) > 0

  let tier: Tier
  if (composite >= 80 && hasPhysicalSignal) tier = 'SUPERFAN'
  else if (composite >= 80) tier = 'DEDICATED' // gated
  else if (composite >= 60) tier = 'DEDICATED'
  else if (composite >= 30) tier = 'ENGAGED'
  else tier = 'CASUAL'

  if (composite >= 80 && !hasPhysicalSignal) {
    flags.push('superfan-gate-needs-physical-signal')
  }

  return {
    score: composite,
    tier,
    breakdown: { physical, identity, money, behavioural, vanity },
    flags,
    superfanEligible: composite >= 80 && hasPhysicalSignal,
  }
}

// ── Velocity cap helpers (called by the input-prep layer) ─────────

/**
 * Cap donation totals so a single fan cannot contribute more than
 * $50/week from one payment method. Inputs are timestamped donation
 * events; output is the post-cap cents total. Anti-money-wash.
 */
export function applyDonationVelocityCap(
  events: Array<{ amountCents: number; createdAt: Date }>,
  capCentsPerWeek = 5000,
): number {
  // Bucket by week-since-event then sum capped per-bucket.
  const buckets = new Map<string, number>()
  for (const e of events) {
    const week = weekKey(e.createdAt)
    const prev = buckets.get(week) || 0
    buckets.set(week, prev + e.amountCents)
  }
  let total = 0
  for (const v of buckets.values()) total += Math.min(v, capCentsPerWeek)
  return total
}

function weekKey(d: Date): string {
  const onejan = new Date(d.getFullYear(), 0, 1)
  const diff = (d.getTime() - onejan.getTime()) / 86400000
  const week = Math.floor((diff + onejan.getDay()) / 7)
  return `${d.getFullYear()}-${week}`
}

/**
 * Cap behavioural detailed-text responses at 20/month per fan.
 */
export function applyDetailedTextCap(
  events: Array<{ createdAt: Date }>,
  capPerMonth = 20,
): number {
  const buckets = new Map<string, number>()
  for (const e of events) {
    const m = `${e.createdAt.getFullYear()}-${e.createdAt.getMonth() + 1}`
    buckets.set(m, (buckets.get(m) || 0) + 1)
  }
  let total = 0
  for (const v of buckets.values()) total += Math.min(v, capPerMonth)
  return total
}

// ── Identity uniqueness check ─────────────────────────────────────

/**
 * Honeypot detection: returns true when the fan ONLY engages with
 * one artist across the platform. Real humans engage broadly.
 * Caller passes the count of distinct artists this fan has
 * interacted with anywhere in the platform.
 */
export function isHoneypot(distinctArtistsEngagedWith: number): boolean {
  return distinctArtistsEngagedWith <= 1
}

/**
 * Suspected-alt check: pass true when any uniqueness rail tripped
 * during the candidate's history. Wired upstream of this module
 * since it requires Prisma access.
 */
export function isSuspectedAlt(matchedFields: Array<'ip' | 'device' | 'payment' | 'email' | 'handle'>): boolean {
  // Two or more uniqueness-rail collisions counts as suspected.
  return matchedFields.length >= 2
}
