import { Fan, FanPlatformLink } from '@prisma/client'

type FanWithLinks = Fan & { platformLinks: FanPlatformLink[] }

/**
 * Resolve template tokens like {fan_name}, {fan_tier}, {stan_score} etc.
 * Uses the same token vocabulary as campaign-constants.ts tokenGroups.
 */
export function resolveTokens(
  template: string,
  fan: FanWithLinks,
  extra?: {
    stanClubName?: string
    customVariables?: Record<string, string | number>
  }
): string {
  // Aggregate tip stats across all platform links
  let totalTipCount = 0
  let totalTipAmountUsd = 0
  let totalShares = 0
  let totalMomentSaves = 0
  let totalTipFrequency = 0

  for (const link of fan.platformLinks) {
    totalTipCount += link.tipCount || 0
    totalTipAmountUsd += link.tipAmountUsd || 0
    totalShares += link.shares || 0
    totalMomentSaves += link.momentSaves || 0
    totalTipFrequency += link.tipFrequency || 0
  }

  // Tier display names
  const tierDisplay: Record<string, string> = {
    CASUAL: 'Casual',
    ENGAGED: 'Strong',
    DEDICATED: 'Dedicated',
    SUPERFAN: 'Core',
  }

  const tokens: Record<string, string> = {
    '{fan_name}': fan.displayName,
    '{city}': fan.city || '',
    '{country}': fan.country || '',
    '{fan_tier}': tierDisplay[fan.tier] || fan.tier,
    '{stan_score}': String(fan.stanScore),
    '{conviction_score}': String(fan.convictionScore),
    '{engagement_score}': String(fan.engagementScore),
    '{longevity_score}': String(fan.longevityScore),
    '{recency_score}': String(fan.recencyScore),
    '{platform_score}': String(fan.platformScore),
    '{tip_count}': String(totalTipCount),
    '{tip_amount_usd}': totalTipAmountUsd.toFixed(2),
    '{tip_frequency}': String(totalTipFrequency),
    '{propagation_count}': String(totalShares),
    '{moment_saves}': String(totalMomentSaves),
    '{stan_club_name}': extra?.stanClubName || 'inner circle',
    '{stan_name}': fan.displayName,
  }

  for (const [key, value] of Object.entries(extra?.customVariables || {})) {
    tokens[`{${key}}`] = String(value)
  }

  let result = template
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replaceAll(token, value)
  }

  return result
}
