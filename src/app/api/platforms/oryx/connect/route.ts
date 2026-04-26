// Connect Oryx — pull historical backer data from Oryx conviction API
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContactConsentStatus, Platform, EventType } from '@prisma/client'
import { calculateStanScore } from '@/lib/scoring/stan-score'
import { upsertFanSmsContact } from '@/lib/fan-contact-points'

const ORYX_API_URL = process.env.ORYX_API_URL || 'http://localhost:4000'
const ECOSYSTEM_API_SECRET = process.env.ECOSYSTEM_API_SECRET || ''

interface OryxBacker {
  fanId: string
  email: string | null
  displayName: string
  phone: string | null
  tipCount: number
  tipAmountUsd: number
  city: string
  verifiedVia: string
  firstTipAt: string
  lastTipAt: string
  conviction: {
    financial: number
    durability: number
    propagation: number
    geographic: number
    total: number
    tier: string
  } | null
}

interface OryxBackersResponse {
  artist: { id: string; email: string; displayName: string; username: string }
  backers: OryxBacker[]
  count: number
  syncedAt: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if already connected
    const existing = await prisma.platformConnection.findUnique({
      where: { userId_platform: { userId, platform: Platform.DASHAM } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Oryx already connected. Use sync to pull new data.' },
        { status: 400 }
      )
    }

    // Match Imprint creator to Oryx artist by email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, artistName: true, location: true },
    })

    if (!user?.email) {
      return NextResponse.json(
        { error: 'No email on your Imprint account. Cannot match with Oryx.' },
        { status: 400 }
      )
    }

    // Step 1: Look up the artist on Oryx by email
    let oryxArtistId: string
    try {
      const lookupRes = await fetch(
        `${ORYX_API_URL}/api/ecosystem/artist/by-email/${encodeURIComponent(user.email)}`,
        {
          headers: {
            'X-Ecosystem-Secret': ECOSYSTEM_API_SECRET,
          },
        }
      )

      if (!lookupRes.ok) {
        if (lookupRes.status === 404) {
          return NextResponse.json(
            { error: 'No Oryx creator account found for this email. Make sure you use the same email on both platforms.' },
            { status: 404 }
          )
        }
        throw new Error(`Oryx lookup failed: ${lookupRes.status}`)
      }

      const oryxArtist = await lookupRes.json()
      oryxArtistId = oryxArtist.id
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Oryx lookup failed')) throw error
      return NextResponse.json(
        { error: 'Could not reach Oryx. Is the server running?' },
        { status: 502 }
      )
    }

    // Step 2: Pull all backers from Oryx
    const backersRes = await fetch(
      `${ORYX_API_URL}/api/ecosystem/artist/${oryxArtistId}/backers`,
      {
        headers: {
          'X-Ecosystem-Secret': ECOSYSTEM_API_SECRET,
        },
      }
    )

    if (!backersRes.ok) {
      throw new Error(`Oryx backers fetch failed: ${backersRes.status}`)
    }

    const data: OryxBackersResponse = await backersRes.json()

    // Step 3: Import backers into StanVault
    const now = new Date()
    let importedCount = 0
    let updatedCount = 0

    for (const backer of data.backers) {
      // Calculate unique months from first/last tip dates
      const firstTip = new Date(backer.firstTipAt)
      const lastTip = new Date(backer.lastTipAt)
      const monthSpan = Math.max(1,
        (lastTip.getFullYear() - firstTip.getFullYear()) * 12 +
        (lastTip.getMonth() - firstTip.getMonth()) + 1
      )
      const tipFrequency = Math.min(monthSpan, backer.tipCount)

      // Check if fan already exists (from real-time tips)
      const existingFan = await prisma.fan.findFirst({
        where: {
          userId,
          OR: [
            ...(backer.email ? [{ email: backer.email }] : []),
            { displayName: backer.displayName },
          ],
        },
        include: { platformLinks: true },
      })

      if (existingFan) {
        // Update existing fan's DASHAM link with historical data
        const dashamLink = existingFan.platformLinks.find(
          (l) => l.platform === Platform.DASHAM
        )

        if (dashamLink) {
          // Only update if Oryx has more data
          if (backer.tipCount > (dashamLink.tipCount || 0)) {
            await prisma.fanPlatformLink.update({
              where: { id: dashamLink.id },
              data: {
                tipCount: backer.tipCount,
                tipAmountUsd: backer.tipAmountUsd,
                tipFrequency,
                cityAffiliation: backer.city,
                firstSeenAt: firstTip,
                lastActiveAt: lastTip,
              },
            })
          }
        } else {
          await prisma.fanPlatformLink.create({
            data: {
              fanId: existingFan.id,
              platform: Platform.DASHAM,
              tipCount: backer.tipCount,
              tipAmountUsd: backer.tipAmountUsd,
              tipFrequency,
              cityAffiliation: backer.city,
              firstSeenAt: firstTip,
              lastActiveAt: lastTip,
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
            lastActiveAt: lastTip > updatedFan.lastActiveAt ? lastTip : updatedFan.lastActiveAt,
            artistCity: user.location,
          })

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
              lastActiveAt: lastTip > updatedFan.lastActiveAt ? lastTip : updatedFan.lastActiveAt,
              city: backer.city || updatedFan.city,
            },
          })
        }

        if (backer.phone) {
          try {
            await upsertFanSmsContact(prisma, {
              fanId: existingFan.id,
              phoneNumber: backer.phone,
              consentStatus: ContactConsentStatus.PENDING,
              consentSource: 'oryx_backer_sync',
            })
          } catch (error) {
            console.warn(`[Oryx] Skipping invalid phone for fan ${existingFan.id}:`, error)
          }
        }

        updatedCount++
      } else {
        // Create new fan from Oryx backer
        const scoreResult = calculateStanScore({
          platformLinks: [{
            platform: Platform.DASHAM,
            tipCount: backer.tipCount,
            tipAmountUsd: backer.tipAmountUsd,
            tipFrequency,
            cityAffiliation: backer.city,
          }],
          firstSeenAt: firstTip,
          lastActiveAt: lastTip,
          artistCity: user.location,
        })

        const createdFan = await prisma.fan.create({
          data: {
            userId,
            displayName: backer.displayName,
            email: backer.email,
            city: backer.city,
            stanScore: scoreResult.totalScore,
            tier: scoreResult.tier,
            convictionScore: scoreResult.convictionScore,
            platformScore: scoreResult.platformScore,
            engagementScore: scoreResult.engagementScore,
            longevityScore: scoreResult.longevityScore,
            recencyScore: scoreResult.recencyScore,
            firstSeenAt: firstTip,
            lastActiveAt: lastTip,
            platformLinks: {
              create: {
                platform: Platform.DASHAM,
                tipCount: backer.tipCount,
                tipAmountUsd: backer.tipAmountUsd,
                tipFrequency,
                cityAffiliation: backer.city,
                firstSeenAt: firstTip,
                lastActiveAt: lastTip,
              },
            },
            events: {
              create: {
                eventType: EventType.FIRST_TIP,
                platform: Platform.DASHAM,
                description: `Imported from Oryx: ${backer.tipCount} tips totaling $${backer.tipAmountUsd.toFixed(2)} USD`,
                metadata: {
                  source: 'oryx_historical_sync',
                  oryxFanId: backer.fanId,
                  tipCount: backer.tipCount,
                  tipAmountUsd: backer.tipAmountUsd,
                },
                occurredAt: firstTip,
              },
            },
          },
        })

        if (backer.phone) {
          try {
            await upsertFanSmsContact(prisma, {
              fanId: createdFan.id,
              phoneNumber: backer.phone,
              consentStatus: ContactConsentStatus.PENDING,
              consentSource: 'oryx_backer_sync',
            })
          } catch (error) {
            console.warn(`[Oryx] Skipping invalid phone for fan ${createdFan.id}:`, error)
          }
        }

        importedCount++
      }
    }

    // Step 4: Create PlatformConnection
    const totalFanCount = await prisma.fan.count({
      where: {
        userId,
        platformLinks: { some: { platform: Platform.DASHAM } },
      },
    })

    await prisma.platformConnection.create({
      data: {
        userId,
        platform: Platform.DASHAM,
        status: 'CONNECTED',
        platformUserId: oryxArtistId,
        lastSyncAt: now,
        fanCount: totalFanCount,
      },
    })

    return NextResponse.json({
      success: true,
      platform: 'DASHAM',
      oryxArtistId,
      imported: importedCount,
      updated: updatedCount,
      totalFans: totalFanCount,
    })
  } catch (error: unknown) {
    console.error('[Oryx Connect] Error:', error)
    return NextResponse.json(
      { error: 'Failed to connect Oryx', message: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.platformConnection.delete({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: Platform.DASHAM,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Oryx Disconnect] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
