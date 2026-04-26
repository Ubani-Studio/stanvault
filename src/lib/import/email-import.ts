import { prisma } from '@/lib/prisma'
import { parseEmailCSV, ParsedEmailSubscriber, detectEmailProvider } from './email-parser'
import { calculateStanScore } from '@/lib/scoring/stan-score'
import { ContactConsentStatus, Platform, EventType } from '@prisma/client'
import { recordFanEvent } from '@/lib/events'
import { upsertFanSmsContact } from '@/lib/fan-contact-points'

interface ImportResult {
  success: boolean
  provider: string
  totalRows: number
  imported: number
  updated: number
  skipped: number
  errors: string[]
}

/**
 * Import email subscribers from CSV content
 */
export async function importEmailSubscribers(
  userId: string,
  csvContent: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    provider: detectEmailProvider(csvContent),
    totalRows: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  // Parse CSV
  const parseResult = parseEmailCSV(csvContent)
  result.totalRows = parseResult.subscribers.length + parseResult.skipped
  result.skipped = parseResult.skipped
  result.errors = parseResult.errors

  if (parseResult.subscribers.length === 0) {
    result.errors.push('No valid subscribers found in CSV')
    return result
  }

  // Process subscribers in batches
  const batchSize = 100
  const subscribers = parseResult.subscribers

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)

    for (const subscriber of batch) {
      try {
        const { isNew } = await processEmailSubscriber(userId, subscriber, result.provider)
        if (isNew) {
          result.imported++
        } else {
          result.updated++
        }
      } catch (error) {
        result.errors.push(
          `${subscriber.email}: ${error instanceof Error ? error.message : 'Import failed'}`
        )
        result.skipped++
      }
    }
  }

  // Update platform connection fan count
  const totalEmailFans = await prisma.fanPlatformLink.count({
    where: {
      platform: Platform.EMAIL,
      fan: { userId },
    },
  })

  await prisma.platformConnection.upsert({
    where: {
      userId_platform: {
        userId,
        platform: Platform.EMAIL,
      },
    },
    update: {
      fanCount: totalEmailFans,
      lastSyncAt: new Date(),
      status: 'CONNECTED',
    },
    create: {
      userId,
      platform: Platform.EMAIL,
      fanCount: totalEmailFans,
      lastSyncAt: new Date(),
      status: 'CONNECTED',
    },
  })

  result.success = result.errors.length < subscribers.length
  return result
}

async function processEmailSubscriber(
  userId: string,
  subscriber: ParsedEmailSubscriber,
  provider: string
): Promise<{ fanId: string; isNew: boolean }> {
  // Check for existing fan by email
  const existingFan = await prisma.fan.findFirst({
    where: {
      userId,
      email: subscriber.email,
    },
    include: {
      platformLinks: true,
    },
  })

  if (existingFan) {
    // Check if already has email link
    const hasEmailLink = existingFan.platformLinks.some(
      link => link.platform === Platform.EMAIL
    )

    if (hasEmailLink) {
      // Update existing email link
      await prisma.fanPlatformLink.update({
        where: {
          fanId_platform: {
            fanId: existingFan.id,
            platform: Platform.EMAIL,
          },
        },
        data: {
          emailOpens: subscriber.emailsOpened,
          emailClicks: subscriber.emailsClicked,
          lastActiveAt: new Date(),
        },
      })
    } else {
      // Add email link to existing fan
      await prisma.fanPlatformLink.create({
        data: {
          fanId: existingFan.id,
          platform: Platform.EMAIL,
          emailOpens: subscriber.emailsOpened,
          emailClicks: subscriber.emailsClicked,
          firstSeenAt: subscriber.subscribedAt || new Date(),
          lastActiveAt: new Date(),
        },
      })

      await recordFanEvent({
        fanId: existingFan.id,
        eventType: EventType.EMAIL_SUBSCRIBE,
        platform: Platform.EMAIL,
        description: 'Connected via email import',
        occurredAt: subscriber.subscribedAt || new Date(),
      })
    }

    // Recalculate score
    await recalculateFanScore(existingFan.id)
    await upsertImportedSmsContact(existingFan.id, subscriber, provider)

    return { fanId: existingFan.id, isNew: false }
  }

  // Create new fan
  const firstSeenAt = subscriber.subscribedAt || new Date()

  const scoreResult = calculateStanScore({
    platformLinks: [
      {
        platform: Platform.EMAIL,
        emailOpens: subscriber.emailsOpened,
        emailClicks: subscriber.emailsClicked,
      },
    ],
    firstSeenAt,
    lastActiveAt: new Date(),
  })

  const newFan = await prisma.fan.create({
    data: {
      userId,
      displayName: subscriber.displayName,
      email: subscriber.email,
      location: subscriber.location,
      city: subscriber.city,
      country: subscriber.country,
      stanScore: scoreResult.totalScore,
      tier: scoreResult.tier,
      convictionScore: scoreResult.convictionScore,
      platformScore: scoreResult.platformScore,
      engagementScore: scoreResult.engagementScore,
      longevityScore: scoreResult.longevityScore,
      recencyScore: scoreResult.recencyScore,
      firstSeenAt,
      lastActiveAt: new Date(),
      platformLinks: {
        create: {
          platform: Platform.EMAIL,
          emailOpens: subscriber.emailsOpened,
          emailClicks: subscriber.emailsClicked,
          firstSeenAt,
          lastActiveAt: new Date(),
        },
      },
    },
  })

  await recordFanEvent({
    fanId: newFan.id,
    eventType: EventType.EMAIL_SUBSCRIBE,
    platform: Platform.EMAIL,
    description: 'Imported from email list',
    occurredAt: firstSeenAt,
  })

  await upsertImportedSmsContact(newFan.id, subscriber, provider)

  return { fanId: newFan.id, isNew: true }
}

async function upsertImportedSmsContact(
  fanId: string,
  subscriber: ParsedEmailSubscriber,
  provider: string
) {
  if (!subscriber.phoneNumber) return

  await upsertFanSmsContact(prisma, {
    fanId,
    phoneNumber: subscriber.phoneNumber,
    consentStatus: mapSmsConsent(subscriber.smsConsent),
    consentSource: `csv_import:${provider.toLowerCase()}`,
    consentCapturedAt: subscriber.smsOptInAt || subscriber.subscribedAt || null,
  })
}

function mapSmsConsent(
  smsConsent: ParsedEmailSubscriber['smsConsent']
): ContactConsentStatus {
  switch (smsConsent) {
    case 'SUBSCRIBED':
      return ContactConsentStatus.SUBSCRIBED
    case 'UNSUBSCRIBED':
      return ContactConsentStatus.UNSUBSCRIBED
    case 'PENDING':
      return ContactConsentStatus.PENDING
    default:
      return ContactConsentStatus.PENDING
  }
}

async function recalculateFanScore(fanId: string) {
  const fan = await prisma.fan.findUnique({
    where: { id: fanId },
    include: { platformLinks: true },
  })

  if (!fan) return

  const scoreResult = calculateStanScore({
    platformLinks: fan.platformLinks.map(link => ({
      platform: link.platform,
      streams: link.streams,
      playlistAdds: link.playlistAdds,
      saves: link.saves,
      follows: link.follows,
      likes: link.likes,
      comments: link.comments,
      shares: link.shares,
      subscribed: link.subscribed,
      videoViews: link.videoViews,
      watchTime: link.watchTime,
      emailOpens: link.emailOpens,
      emailClicks: link.emailClicks,
      tipCount: link.tipCount,
      tipAmountUsd: link.tipAmountUsd,
      tipFrequency: link.tipFrequency,
      momentSaves: link.momentSaves,
      cityAffiliation: link.cityAffiliation,
    })),
    firstSeenAt: fan.firstSeenAt,
    lastActiveAt: fan.lastActiveAt,
  })

  await prisma.fan.update({
    where: { id: fanId },
    data: {
      stanScore: scoreResult.totalScore,
      tier: scoreResult.tier,
      convictionScore: scoreResult.convictionScore,
      platformScore: scoreResult.platformScore,
      engagementScore: scoreResult.engagementScore,
      longevityScore: scoreResult.longevityScore,
      recencyScore: scoreResult.recencyScore,
    },
  })
}
