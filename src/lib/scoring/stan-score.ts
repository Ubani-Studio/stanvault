import { FanTier, Platform } from '@prisma/client'

interface PlatformMetrics {
  platform: Platform
  streams?: number | null
  playlistAdds?: number | null
  saves?: number | null
  follows?: boolean | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  subscribed?: boolean | null
  videoViews?: number | null
  watchTime?: number | null
  emailOpens?: number | null
  emailClicks?: number | null
  // Dasham conviction metrics
  tipCount?: number | null
  tipAmountUsd?: number | null
  tipFrequency?: number | null
  momentSaves?: number | null
  cityAffiliation?: string | null
  // Generic conviction signals
  purchaseCount?: number | null
  purchaseAmountUsd?: number | null
  subscriptionMonths?: number | null
}

interface ScoreInput {
  platformLinks: PlatformMetrics[]
  firstSeenAt: Date
  lastActiveAt: Date
  artistCity?: string | null // Artist's home city for city presence bonus
}

interface ScoreBreakdown {
  convictionScore: number
  platformScore: number
  engagementScore: number
  longevityScore: number
  recencyScore: number
  totalScore: number
  tier: FanTier
}

// Conviction score: max 35 points (money = highest signal in the ecosystem)
// Money is harder to fake than streams. A $5 tip from Lagos means more than 1000 bot streams.
// Dasham can reach 35 alone (ecosystem-native). Other purchase sources max at 25 individually.
// Behavioral proxy (streaming-only) maxes at 10 and only activates when zero financial signals exist.
function calculateConvictionScore(
  platformLinks: PlatformMetrics[],
  artistCity?: string | null
): number {
  let score = 0

  // 1. Dasham tips (highest fidelity — ecosystem native)
  const dashamLink = platformLinks.find((l) => l.platform === 'DASHAM')
  if (dashamLink) {
    if (dashamLink.tipCount) score += Math.min(dashamLink.tipCount * 3, 10)
    if (dashamLink.tipAmountUsd) score += Math.min(dashamLink.tipAmountUsd / 5, 10)
    if (dashamLink.tipFrequency) score += Math.min(dashamLink.tipFrequency * 2, 5)
    if (dashamLink.momentSaves) score += Math.min(dashamLink.momentSaves, 5)
  }

  // 2. Direct purchases (Bandcamp, merch, Ko-fi, Patreon)
  const purchaseLinks = platformLinks.filter((l) =>
    ['BANDCAMP', 'KOFI', 'PATREON', 'MERCH'].includes(l.platform)
  )
  for (const link of purchaseLinks) {
    if (link.purchaseCount) score += Math.min(link.purchaseCount * 2, 8)
    if (link.purchaseAmountUsd) score += Math.min(link.purchaseAmountUsd / 5, 10)
    if (link.subscriptionMonths) score += Math.min(link.subscriptionMonths * 1.5, 7)
  }

  // 3. City presence bonus (from ANY platform with city data)
  if (artistCity) {
    const hasLocalPresence = platformLinks.some(
      (l) => l.cityAffiliation && l.cityAffiliation === artistCity
    )
    if (hasLocalPresence) score += 5
  }

  // 4. Behavioral conviction proxy — FALLBACK ONLY
  // Only activates when zero financial signals exist across all platforms.
  // A fan streaming daily for 90+ days shows conviction, but capped at 10.
  if (score === 0) {
    const streamingLinks = platformLinks.filter(
      (l) => l.platform === 'SPOTIFY' && l.streams && l.streams > 0
    )
    for (const link of streamingLinks) {
      const streams = link.streams || 0
      if (streams >= 100) score += Math.min(Math.floor(streams / 50), 10)
    }
  }

  return Math.min(Math.round(score), 35)
}

// Platform breadth: max 10 points (replaces old 30-point platform score)
// Breadth still matters but is no longer the dominant signal
function calculatePlatformScore(platformLinks: PlatformMetrics[]): number {
  const activePlatforms = platformLinks.filter((link) => {
    return (
      link.follows ||
      link.subscribed ||
      (link.streams && link.streams > 0) ||
      (link.likes && link.likes > 0) ||
      (link.emailOpens && link.emailOpens > 0) ||
      (link.tipCount && link.tipCount > 0) ||
      (link.purchaseCount && link.purchaseCount > 0) ||
      (link.subscriptionMonths && link.subscriptionMonths > 0)
    )
  })

  // 5 per platform, capped at 2 platforms = 10
  return Math.min(activePlatforms.length * 5, 10)
}

// Engagement depth: max 30 points (reduced from 40 to make room for conviction)
function calculateEngagementScore(platformLinks: PlatformMetrics[]): number {
  let score = 0

  for (const link of platformLinks) {
    // Skip conviction platforms — scored separately in calculateConvictionScore
    if (['DASHAM', 'BANDCAMP', 'KOFI', 'PATREON', 'MERCH'].includes(link.platform)) continue

    // Spotify engagement
    if (link.streams) {
      score += Math.min(link.streams / 10, 8) // 8 points max for 80+ streams
    }
    if (link.playlistAdds) {
      score += Math.min(link.playlistAdds * 2, 4) // 4 points max
    }
    if (link.saves) {
      score += Math.min(link.saves, 4) // 4 points max
    }

    // Social engagement
    if (link.follows) {
      score += 2
    }
    if (link.likes) {
      score += Math.min(link.likes / 5, 4) // 4 points max
    }
    if (link.comments) {
      score += Math.min(link.comments * 2, 4) // 4 points max
    }
    if (link.shares) {
      score += Math.min(link.shares * 3, 4) // 4 points max
    }

    // YouTube engagement
    if (link.subscribed) {
      score += 2
    }
    if (link.videoViews) {
      score += Math.min(link.videoViews / 20, 4) // 4 points max
    }

    // Email engagement
    if (link.emailOpens) {
      score += Math.min(link.emailOpens / 2, 4) // 4 points max
    }
    if (link.emailClicks) {
      score += Math.min(link.emailClicks * 2, 4) // 4 points max
    }
  }

  return Math.min(Math.round(score), 30)
}

// Longevity: max 15 points (reduced from 20)
function calculateLongevityScore(firstSeenAt: Date): number {
  const now = new Date()
  const daysSinceFirstSeen = Math.floor(
    (now.getTime() - firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceFirstSeen < 30) {
    return Math.round((daysSinceFirstSeen / 30) * 4)
  } else if (daysSinceFirstSeen < 90) {
    return Math.round(4 + ((daysSinceFirstSeen - 30) / 60) * 4)
  } else if (daysSinceFirstSeen < 180) {
    return Math.round(8 + ((daysSinceFirstSeen - 90) / 90) * 4)
  } else {
    return Math.min(12 + Math.round((daysSinceFirstSeen - 180) / 180) * 3, 15)
  }
}

// Recency: max 10 points (unchanged)
function calculateRecencyScore(lastActiveAt: Date): number {
  const now = new Date()
  const daysSinceLastActive = Math.floor(
    (now.getTime() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceLastActive <= 1) return 10
  if (daysSinceLastActive <= 7) return 8
  if (daysSinceLastActive <= 14) return 6
  if (daysSinceLastActive <= 30) return 4
  if (daysSinceLastActive <= 60) return 2
  return 0
}

// Determine tier based on total score.
// ELITE is reserved for the top 1% by Resonance (folded from Convicta — see ARCHIVE_LOG.md).
// Threshold is intentionally high (>=92) so it stays scarce by construction; the percentile-true
// "top 1%" calculation is upgraded later when a global cohort distribution is available.
function determineTier(score: number): FanTier {
  if (score >= 92) return 'ELITE'
  if (score >= 75) return 'SUPERFAN'
  if (score >= 50) return 'DEDICATED'
  if (score >= 25) return 'ENGAGED'
  return 'CASUAL'
}

// Stan Score breakdown (100 points total):
//   Conviction:  35 pts (financial signals — Dasham tips, Bandcamp/Ko-fi/Patreon/Merch purchases, streaming fallback)
//   Engagement:  30 pts (streams, saves, social — existing platform behavior)
//   Platform:    10 pts (breadth across platforms)
//   Longevity:   15 pts (how long the fan-artist relationship has existed)
//   Recency:     10 pts (how recently the fan was active)
export function calculateStanScore(input: ScoreInput): ScoreBreakdown {
  const convictionScore = calculateConvictionScore(input.platformLinks, input.artistCity)
  const platformScore = calculatePlatformScore(input.platformLinks)
  const engagementScore = calculateEngagementScore(input.platformLinks)
  const longevityScore = calculateLongevityScore(input.firstSeenAt)
  const recencyScore = calculateRecencyScore(input.lastActiveAt)

  const totalScore = convictionScore + platformScore + engagementScore + longevityScore + recencyScore
  const tier = determineTier(totalScore)

  return {
    convictionScore,
    platformScore,
    engagementScore,
    longevityScore,
    recencyScore,
    totalScore: Math.min(totalScore, 100),
    tier,
  }
}

export function getTierFromScore(score: number): FanTier {
  return determineTier(score)
}
