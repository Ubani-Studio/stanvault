// Ecosystem endpoint: External platforms → StanVault fan import
// Receives conviction events (tips, purchases, subscriptions) and creates/updates fan records
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateStanScore } from '@/lib/scoring/stan-score'
import { ContactConsentStatus, Platform, EventType, FanTier } from '@prisma/client'
import { recordFanEvent } from '@/lib/events'
import { upsertFanSmsContact } from '@/lib/fan-contact-points'

const ECOSYSTEM_API_SECRET = process.env.ECOSYSTEM_API_SECRET || ''

interface DashTipEvent {
  fanEmail?: string
  fanPhone?: string
  fanDisplayName: string
  fanId: string
  artistId: string
  artistName: string
  tipAmountMinor: number
  tipCurrency: string
  tipAmountUsd: number
  momentId: string
  momentTitle: string
  city: string
  dashId: string
  completedAt: string
  // Mobile money verification — real money = real identity
  verifiedVia?: 'mobile_money' | 'card'
  provider?: string
}

// Generic purchase event for Bandcamp, Ko-fi, Patreon, Merch
interface PurchaseEvent {
  fanEmail?: string
  fanDisplayName: string
  fanId: string
  artistId: string
  artistName: string
  purchaseAmountUsd: number
  purchaseCount?: number          // Number of items in this event (default 1)
  subscriptionMonths?: number     // For Ko-fi/Patreon recurring support
  itemTitle?: string              // Album name, merch item, etc.
  city?: string
  completedAt: string
}

type ValidSource = 'dasham' | 'bandcamp' | 'kofi' | 'patreon' | 'merch'

const SOURCE_TO_PLATFORM: Record<ValidSource, Platform> = {
  dasham: Platform.DASHAM,
  bandcamp: Platform.BANDCAMP,
  kofi: Platform.KOFI,
  patreon: Platform.PATREON,
  merch: Platform.MERCH,
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

// Validate ecosystem secret
function validateRequest(request: NextRequest): boolean {
  if (!ECOSYSTEM_API_SECRET) return true // Allow in dev when no secret configured
  const secret = request.headers.get('X-Ecosystem-Secret')
  return secret === ECOSYSTEM_API_SECRET
}

export async function POST(request: NextRequest) {
  // Verify ecosystem auth
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const source = request.headers.get('X-Source') as ValidSource | null
  if (!source || !SOURCE_TO_PLATFORM[source]) {
    return NextResponse.json(
      { error: 'Unknown source. Valid: dasham, bandcamp, kofi, patreon, merch' },
      { status: 400 }
    )
  }

  // Route to purchase handler for non-Dasham sources
  if (source !== 'dasham') {
    return handlePurchaseImport(request, source)
  }

  let body: DashTipEvent
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.artistId || !body.fanId || !body.tipAmountUsd) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Find the artist in StanVault by matching on dasham ID stored in location or name
    // For now, we match by artistName or create a mapping
    // In production, this would use a shared ecosystem user ID
    const artist = await prisma.user.findFirst({
      where: {
        OR: [
          { artistName: body.artistName },
          { name: body.artistName },
        ],
      },
    })

    if (!artist) {
      // Artist not on StanVault yet — store event for later reconciliation
      console.log(`[Ecosystem] Artist "${body.artistName}" not found in StanVault, skipping tip import`)
      return NextResponse.json({
        imported: false,
        reason: 'artist_not_found',
        message: `Artist "${body.artistName}" not registered on StanVault`,
      })
    }

    // Auto-connect: ensure PlatformConnection exists for DASHAM
    // When the first tip arrives from Oryx, auto-create the connection
    const existingConnection = await prisma.platformConnection.findUnique({
      where: {
        userId_platform: { userId: artist.id, platform: Platform.DASHAM },
      },
    })

    if (!existingConnection) {
      await prisma.platformConnection.create({
        data: {
          userId: artist.id,
          platform: Platform.DASHAM,
          status: 'CONNECTED',
          platformUserId: body.artistId, // Oryx artist ID
          lastSyncAt: new Date(),
          fanCount: 1,
        },
      })
      console.log(`[Ecosystem] Auto-connected DASHAM for artist "${body.artistName}"`)
    }

    // Find or create fan record
    const existingFan = await prisma.fan.findFirst({
      where: {
        userId: artist.id,
        OR: [
          ...(body.fanEmail ? [{ email: body.fanEmail }] : []),
          { displayName: body.fanDisplayName },
        ],
      },
      include: { platformLinks: true },
    })

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    if (existingFan) {
      // Update existing fan — increment Dasham metrics
      const dashamLink = existingFan.platformLinks.find(
        (l) => l.platform === Platform.DASHAM
      )

      if (dashamLink) {
        // Update existing DASHAM platform link
        const newTipCount = (dashamLink.tipCount || 0) + 1
        const newTipAmountUsd = (dashamLink.tipAmountUsd || 0) + body.tipAmountUsd

        // Track unique months for frequency
        const metadata = dashamLink.platformFanId
          ? JSON.parse(dashamLink.platformFanId)
          : { months: [] }
        if (!metadata.months.includes(currentMonth)) {
          metadata.months.push(currentMonth)
        }

        await prisma.fanPlatformLink.update({
          where: { id: dashamLink.id },
          data: {
            tipCount: newTipCount,
            tipAmountUsd: newTipAmountUsd,
            tipFrequency: metadata.months.length,
            cityAffiliation: body.city,
            platformFanId: JSON.stringify(metadata),
            lastActiveAt: now,
          },
        })
      } else {
        // Create DASHAM platform link for existing fan
        await prisma.fanPlatformLink.create({
          data: {
            fanId: existingFan.id,
            platform: Platform.DASHAM,
            platformFanId: JSON.stringify({ months: [currentMonth], dashamUserId: body.fanId }),
            tipCount: 1,
            tipAmountUsd: body.tipAmountUsd,
            tipFrequency: 1,
            cityAffiliation: body.city,
            firstSeenAt: now,
            lastActiveAt: now,
          },
        })

        // Record FIRST_TIP event
        await recordFanEvent({
          fanId: existingFan.id,
          eventType: EventType.FIRST_TIP,
          platform: Platform.DASHAM,
          description: `First tip via Dasham: $${body.tipAmountUsd.toFixed(2)} USD for "${body.momentTitle}"`,
          metadata: {
            dashId: body.dashId,
            momentId: body.momentId,
            tipAmountUsd: body.tipAmountUsd,
            city: body.city,
          },
          occurredAt: now,
        })
      }

      // Check for tip milestones
      const totalTips = (existingFan.platformLinks.find(l => l.platform === Platform.DASHAM)?.tipCount || 0) + 1
      if ([5, 10, 25, 50, 100].includes(totalTips)) {
        await recordFanEvent({
          fanId: existingFan.id,
          eventType: EventType.MILESTONE_TIPS,
          platform: Platform.DASHAM,
          description: `Reached ${totalTips} tips milestone`,
          metadata: { milestone: totalTips },
          occurredAt: now,
        })
      }

      // Recalculate score with all platform links
      const updatedFan = await prisma.fan.findUnique({
        where: { id: existingFan.id },
        include: { platformLinks: true },
      })

      if (updatedFan) {
        const scoreResult = calculateStanScore({
          platformLinks: updatedFan.platformLinks.map((link) => ({
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
            purchaseCount: link.purchaseCount,
            purchaseAmountUsd: link.purchaseAmountUsd,
            subscriptionMonths: link.subscriptionMonths,
          })),
          firstSeenAt: updatedFan.firstSeenAt,
          lastActiveAt: now,
          artistCity: artist.location,
        })

        const oldTier = updatedFan.tier

        await prisma.fan.update({
          where: { id: updatedFan.id },
          data: {
            stanScore: scoreResult.totalScore,
            tier: scoreResult.tier,
            convictionScore: scoreResult.convictionScore,
            platformScore: scoreResult.platformScore,
            engagementScore: scoreResult.engagementScore,
            longevityScore: scoreResult.longevityScore,
            recencyScore: scoreResult.recencyScore,
            lastActiveAt: now,
            city: body.city,
          },
        })

        if (body.fanPhone) {
          await upsertFanSmsContact(prisma, {
            fanId: updatedFan.id,
            phoneNumber: body.fanPhone,
            consentStatus: ContactConsentStatus.PENDING,
            consentSource: 'dasham_tip_import',
          })
        }

        // Track tier changes
        if (oldTier !== scoreResult.tier) {
          const tierOrder: FanTier[] = ['CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN']
          const oldIndex = tierOrder.indexOf(oldTier)
          const newIndex = tierOrder.indexOf(scoreResult.tier)

          await recordFanEvent({
            fanId: updatedFan.id,
            eventType: newIndex > oldIndex ? EventType.TIER_UPGRADE : EventType.TIER_DOWNGRADE,
            platform: Platform.DASHAM,
            description: `Tier ${newIndex > oldIndex ? 'upgraded' : 'downgraded'}: ${oldTier} → ${scoreResult.tier}`,
            metadata: {
              oldTier,
              newTier: scoreResult.tier,
              trigger: 'dasham_tip',
            },
            occurredAt: now,
          })

          if (scoreResult.tier === 'SUPERFAN') {
            await recordFanEvent({
              fanId: updatedFan.id,
              eventType: EventType.BECAME_SUPERFAN,
              platform: Platform.DASHAM,
              description: `Became SUPERFAN through Dasham conviction`,
              occurredAt: now,
            })
          }
        }

        // Mobile money verification for existing fans
        if (body.verifiedVia === 'mobile_money' && (body.fanEmail || existingFan.email)) {
          const email = body.fanEmail || existingFan.email
          if (email) {
            const fanUser = await prisma.fanUser.findUnique({ where: { email } })
            if (fanUser) {
              await prisma.fanUserArtistLink.upsert({
                where: {
                  fanUserId_artistId: { fanUserId: fanUser.id, artistId: artist.id },
                },
                update: {
                  verified: true,
                  verifiedAt: now,
                  verifiedVia: 'mobile_money',
                  fanRecordId: updatedFan.id,
                  tier: scoreResult.tier,
                  stanScore: scoreResult.totalScore,
                },
                create: {
                  fanUserId: fanUser.id,
                  artistId: artist.id,
                  fanRecordId: updatedFan.id,
                  verified: true,
                  verifiedAt: now,
                  verifiedVia: 'mobile_money',
                  tier: scoreResult.tier,
                  stanScore: scoreResult.totalScore,
                },
              })
            }
          }
        }

        return NextResponse.json({
          imported: true,
          fanId: updatedFan.id,
          stanScore: scoreResult.totalScore,
          tier: scoreResult.tier,
          convictionScore: scoreResult.convictionScore,
          isNew: false,
          verified: body.verifiedVia === 'mobile_money',
        })
      }
    } else {
      // Create new fan from Dasham tip
      const scoreResult = calculateStanScore({
        platformLinks: [
          {
            platform: Platform.DASHAM,
            tipCount: 1,
            tipAmountUsd: body.tipAmountUsd,
            tipFrequency: 1,
            cityAffiliation: body.city,
          },
        ],
        firstSeenAt: now,
        lastActiveAt: now,
        artistCity: artist.location,
      })

      const newFan = await prisma.fan.create({
        data: {
          userId: artist.id,
          displayName: body.fanDisplayName,
          email: body.fanEmail,
          city: body.city,
          stanScore: scoreResult.totalScore,
          tier: scoreResult.tier,
          convictionScore: scoreResult.convictionScore,
          platformScore: scoreResult.platformScore,
          engagementScore: scoreResult.engagementScore,
          longevityScore: scoreResult.longevityScore,
          recencyScore: scoreResult.recencyScore,
          firstSeenAt: now,
          lastActiveAt: now,
          platformLinks: {
            create: {
              platform: Platform.DASHAM,
              platformFanId: JSON.stringify({ months: [currentMonth], dashamUserId: body.fanId }),
              tipCount: 1,
              tipAmountUsd: body.tipAmountUsd,
              tipFrequency: 1,
              cityAffiliation: body.city,
              firstSeenAt: now,
              lastActiveAt: now,
            },
          },
        },
      })

      if (body.fanPhone) {
        await upsertFanSmsContact(prisma, {
          fanId: newFan.id,
          phoneNumber: body.fanPhone,
          consentStatus: ContactConsentStatus.PENDING,
          consentSource: 'dasham_tip_import',
        })
      }

      await recordFanEvent({
        fanId: newFan.id,
        eventType: EventType.FIRST_TIP,
        platform: Platform.DASHAM,
        description: `First tip via Dasham: $${body.tipAmountUsd.toFixed(2)} USD for "${body.momentTitle}"`,
        metadata: {
          dashId: body.dashId,
          momentId: body.momentId,
          momentTitle: body.momentTitle,
          tipAmountUsd: body.tipAmountUsd,
          tipCurrency: body.tipCurrency,
          city: body.city,
        },
        occurredAt: now,
      })

      // Mobile money verification for new fans
      if (body.verifiedVia === 'mobile_money' && body.fanEmail) {
        // Check if a fan portal user exists with this email
        const fanUser = await prisma.fanUser.findUnique({
          where: { email: body.fanEmail },
        })

        if (fanUser) {
          // Update or create the artist relationship as verified
          await prisma.fanUserArtistLink.upsert({
            where: {
              fanUserId_artistId: { fanUserId: fanUser.id, artistId: artist.id },
            },
            update: {
              verified: true,
              verifiedAt: now,
              verifiedVia: 'mobile_money',
              fanRecordId: newFan.id,
              tier: scoreResult.tier,
              stanScore: scoreResult.totalScore,
            },
            create: {
              fanUserId: fanUser.id,
              artistId: artist.id,
              fanRecordId: newFan.id,
              verified: true,
              verifiedAt: now,
              verifiedVia: 'mobile_money',
              tier: scoreResult.tier,
              stanScore: scoreResult.totalScore,
            },
          })
        }
      }

      // Update fan count on PlatformConnection
      await prisma.platformConnection.updateMany({
        where: { userId: artist.id, platform: Platform.DASHAM },
        data: {
          fanCount: { increment: 1 },
          lastSyncAt: now,
        },
      })

      return NextResponse.json({
        imported: true,
        fanId: newFan.id,
        stanScore: scoreResult.totalScore,
        tier: scoreResult.tier,
        convictionScore: scoreResult.convictionScore,
        isNew: true,
        verified: body.verifiedVia === 'mobile_money',
      })
    }

    return NextResponse.json({ imported: true })
  } catch (error: unknown) {
    console.error('[Ecosystem] Fan import error:', error)
    return NextResponse.json(
      { error: 'Internal error', message: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// Helper: map FanPlatformLink DB records to scoring interface
function mapLinksForScoring(links: Array<{
  platform: Platform
  streams: number | null
  playlistAdds: number | null
  saves: number | null
  follows: boolean | null
  likes: number | null
  comments: number | null
  shares: number | null
  subscribed: boolean | null
  videoViews: number | null
  watchTime: number | null
  emailOpens: number | null
  emailClicks: number | null
  tipCount: number | null
  tipAmountUsd: number | null
  tipFrequency: number | null
  momentSaves: number | null
  cityAffiliation: string | null
  purchaseCount: number | null
  purchaseAmountUsd: number | null
  subscriptionMonths: number | null
}>) {
  return links.map((link) => ({
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
    purchaseCount: link.purchaseCount,
    purchaseAmountUsd: link.purchaseAmountUsd,
    subscriptionMonths: link.subscriptionMonths,
  }))
}

// Handle purchase imports from Bandcamp, Ko-fi, Patreon, Merch
async function handlePurchaseImport(request: NextRequest, source: ValidSource) {
  let body: PurchaseEvent
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.artistId || !body.fanId || !body.purchaseAmountUsd) {
    return NextResponse.json(
      { error: 'Missing required fields: artistId, fanId, purchaseAmountUsd' },
      { status: 400 }
    )
  }

  const platform = SOURCE_TO_PLATFORM[source]

  try {
    const artist = await prisma.user.findFirst({
      where: {
        OR: [
          { artistName: body.artistName },
          { name: body.artistName },
        ],
      },
    })

    if (!artist) {
      console.log(`[Ecosystem] Artist "${body.artistName}" not found in StanVault, skipping ${source} import`)
      return NextResponse.json({
        imported: false,
        reason: 'artist_not_found',
        message: `Artist "${body.artistName}" not registered on StanVault`,
      })
    }

    const now = new Date()
    const purchaseCount = body.purchaseCount || 1

    // Find or create fan
    const existingFan = await prisma.fan.findFirst({
      where: {
        userId: artist.id,
        OR: [
          ...(body.fanEmail ? [{ email: body.fanEmail }] : []),
          { displayName: body.fanDisplayName },
        ],
      },
      include: { platformLinks: true },
    })

    if (existingFan) {
      // Update existing fan — increment purchase metrics on this platform
      const existingLink = existingFan.platformLinks.find((l) => l.platform === platform)

      if (existingLink) {
        await prisma.fanPlatformLink.update({
          where: { id: existingLink.id },
          data: {
            purchaseCount: (existingLink.purchaseCount || 0) + purchaseCount,
            purchaseAmountUsd: (existingLink.purchaseAmountUsd || 0) + body.purchaseAmountUsd,
            subscriptionMonths: body.subscriptionMonths ?? existingLink.subscriptionMonths,
            cityAffiliation: body.city || existingLink.cityAffiliation,
            lastActiveAt: now,
          },
        })
      } else {
        await prisma.fanPlatformLink.create({
          data: {
            fanId: existingFan.id,
            platform,
            purchaseCount,
            purchaseAmountUsd: body.purchaseAmountUsd,
            subscriptionMonths: body.subscriptionMonths,
            cityAffiliation: body.city,
            firstSeenAt: now,
            lastActiveAt: now,
          },
        })
      }

      // Recalculate score
      const updatedFan = await prisma.fan.findUnique({
        where: { id: existingFan.id },
        include: { platformLinks: true },
      })

      if (updatedFan) {
        const scoreResult = calculateStanScore({
          platformLinks: mapLinksForScoring(updatedFan.platformLinks),
          firstSeenAt: updatedFan.firstSeenAt,
          lastActiveAt: now,
          artistCity: artist.location,
        })

        const oldTier = updatedFan.tier
        await prisma.fan.update({
          where: { id: updatedFan.id },
          data: {
            stanScore: scoreResult.totalScore,
            tier: scoreResult.tier,
            convictionScore: scoreResult.convictionScore,
            platformScore: scoreResult.platformScore,
            engagementScore: scoreResult.engagementScore,
            longevityScore: scoreResult.longevityScore,
            recencyScore: scoreResult.recencyScore,
            lastActiveAt: now,
            city: body.city || updatedFan.city,
          },
        })

        if (oldTier !== scoreResult.tier) {
          const tierOrder: FanTier[] = ['CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN']
          const oldIndex = tierOrder.indexOf(oldTier)
          const newIndex = tierOrder.indexOf(scoreResult.tier)

          await recordFanEvent({
            fanId: updatedFan.id,
            eventType: newIndex > oldIndex ? EventType.TIER_UPGRADE : EventType.TIER_DOWNGRADE,
            platform,
            description: `Tier ${newIndex > oldIndex ? 'upgraded' : 'downgraded'}: ${oldTier} → ${scoreResult.tier} (via ${source})`,
            metadata: { oldTier, newTier: scoreResult.tier, trigger: `${source}_purchase` },
            occurredAt: now,
          })
        }

        return NextResponse.json({
          imported: true,
          fanId: updatedFan.id,
          stanScore: scoreResult.totalScore,
          tier: scoreResult.tier,
          convictionScore: scoreResult.convictionScore,
          isNew: false,
          source,
        })
      }
    } else {
      // Create new fan from purchase event
      const scoreResult = calculateStanScore({
        platformLinks: [{
          platform,
          purchaseCount,
          purchaseAmountUsd: body.purchaseAmountUsd,
          subscriptionMonths: body.subscriptionMonths,
          cityAffiliation: body.city,
        }],
        firstSeenAt: now,
        lastActiveAt: now,
        artistCity: artist.location,
      })

      const newFan = await prisma.fan.create({
        data: {
          userId: artist.id,
          displayName: body.fanDisplayName,
          email: body.fanEmail,
          city: body.city,
          stanScore: scoreResult.totalScore,
          tier: scoreResult.tier,
          convictionScore: scoreResult.convictionScore,
          platformScore: scoreResult.platformScore,
          engagementScore: scoreResult.engagementScore,
          longevityScore: scoreResult.longevityScore,
          recencyScore: scoreResult.recencyScore,
          firstSeenAt: now,
          lastActiveAt: now,
          platformLinks: {
            create: {
              platform,
              purchaseCount,
              purchaseAmountUsd: body.purchaseAmountUsd,
              subscriptionMonths: body.subscriptionMonths,
              cityAffiliation: body.city,
              firstSeenAt: now,
              lastActiveAt: now,
            },
          },
        },
      })

      return NextResponse.json({
        imported: true,
        fanId: newFan.id,
        stanScore: scoreResult.totalScore,
        tier: scoreResult.tier,
        convictionScore: scoreResult.convictionScore,
        isNew: true,
        source,
      })
    }

    return NextResponse.json({ imported: true, source })
  } catch (error: unknown) {
    console.error(`[Ecosystem] ${source} import error:`, error)
    return NextResponse.json(
      { error: 'Internal error', message: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
