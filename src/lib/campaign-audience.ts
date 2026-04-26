import { ContactChannel, ContactConsentStatus, FanTier, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getPrimarySmsContact, hasSmsConsent } from '@/lib/fan-contact-points'

const TIER_ORDER: FanTier[] = ['CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN']

export interface CampaignAudienceFilter {
  userId: string
  minTier?: FanTier
  minStanScore?: number | null
  limit?: number | null
}

export type CampaignTargetFan = Awaited<ReturnType<typeof getCampaignTargetFans>>[number]

export function buildCampaignAudienceWhere(
  filter: CampaignAudienceFilter
): Prisma.FanWhereInput {
  return {
    userId: filter.userId,
    tier: {
      in: getEligibleTiers(filter.minTier || 'CASUAL'),
    },
    ...(typeof filter.minStanScore === 'number'
      ? {
          stanScore: {
            gte: filter.minStanScore,
          },
        }
      : {}),
  }
}

export async function getCampaignTargetFans(filter: CampaignAudienceFilter) {
  const take = normalizeLimit(filter.limit)

  return prisma.fan.findMany({
    where: buildCampaignAudienceWhere(filter),
    orderBy: [{ stanScore: 'desc' }, { lastActiveAt: 'desc' }],
    take,
    include: {
      platformLinks: true,
      contactPoints: {
        where: {
          channel: ContactChannel.SMS,
        },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
      },
    },
  })
}

export async function getCampaignAudienceSnapshot(filter: CampaignAudienceFilter) {
  const [matchingFans, targetFans] = await Promise.all([
    prisma.fan.count({
      where: buildCampaignAudienceWhere(filter),
    }),
    getCampaignTargetFans(filter),
  ])

  let emailEligibleFans = 0
  let smsEligibleFans = 0
  let smsKnownFans = 0
  let smsPendingFans = 0
  let smsUnsubscribedFans = 0

  for (const fan of targetFans) {
    if (fan.email) emailEligibleFans++

    const smsContact = getPrimarySmsContact(fan.contactPoints)
    if (!smsContact) continue

    smsKnownFans++
    if (hasSmsConsent(smsContact)) smsEligibleFans++
    else if (
      smsContact.consentStatus === ContactConsentStatus.PENDING ||
      smsContact.consentStatus === ContactConsentStatus.UNKNOWN
    ) {
      smsPendingFans++
    } else if (smsContact.consentStatus === ContactConsentStatus.UNSUBSCRIBED) {
      smsUnsubscribedFans++
    }
  }

  return {
    matchingFans,
    selectedFans: targetFans.length,
    emailEligibleFans,
    smsEligibleFans,
    smsKnownFans,
    smsPendingFans,
    smsUnsubscribedFans,
  }
}

export function getPrimarySmsContactValue(
  contactPoints: Array<{
    channel: ContactChannel
    value: string
    normalizedValue: string
    isPrimary: boolean
    consentStatus: ContactConsentStatus
    consentCapturedAt: Date | null
    consentRevokedAt: Date | null
    verifiedAt: Date | null
  }>
) {
  const contactPoint = getPrimarySmsContact(contactPoints)
  return contactPoint ? { contactPoint, canSend: hasSmsConsent(contactPoint) } : null
}

function getEligibleTiers(minTier: FanTier): FanTier[] {
  const startIndex = Math.max(TIER_ORDER.indexOf(minTier), 0)
  return TIER_ORDER.slice(startIndex)
}

function normalizeLimit(limit?: number | null): number {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return 100
  return Math.min(Math.max(limit, 1), 1000)
}
