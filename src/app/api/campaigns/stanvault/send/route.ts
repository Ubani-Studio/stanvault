import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FanTier, Prisma } from '@prisma/client'
import { tierPolicies } from '@/lib/campaign-entitlements'
import { callEmissarCampaign, type EmissarCampaignResponse } from '@/lib/emissar'
import { getCampaignTargetFans, getPrimarySmsContactValue } from '@/lib/campaign-audience'
import { resolveTokens } from '@/lib/events/resolve-tokens'
import { isTwilioConfigured, sendTwilioSmsBatch } from '@/lib/twilio'

const requestSchema = z.object({
  artistName: z.string().optional(),
  artistId: z.string().optional(),
  subject: z.string().min(1).max(200).optional(),
  fromEmail: z.string().min(3).max(320).optional(),
  replyTo: z.string().email().optional(),
  fanClubName: z.string().min(1).max(120).optional(),
  customVariables: z.record(z.union([z.string(), z.number()])).optional(),
  messageTemplate: z.string().min(1).max(5000),
  minStanScore: z.number().int().min(0).max(100).optional(),
  minTier: z.enum(['CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN']).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  mood: z.string().optional(),
  deliveryMode: z.enum(['TEXT', 'VOICE']).optional(),
  textChannel: z.enum(['EMAIL', 'SMS']).optional(),
  voiceConfigMode: z.enum(['SIMPLE', 'ADVANCED']).optional(),
  voiceModelId: z.string().min(1).max(200).optional(),
  voiceProvider: z.enum(['fish-audio', 'resemble-ai', 'chatterbox']).optional(),
  voiceStyle: z.enum(['natural', 'whisper', 'singing', 'shouting']).optional(),
  voiceEmotion: z.enum(['neutral', 'grateful', 'excited', 'playful', 'heartfelt']).optional(),
  voiceCtaLabel: z.string().min(1).max(120).optional(),
  ctaKey: z.string().max(80).optional(),
  ctaLabel: z.string().max(120).optional(),
  ctaDeadline: z.string().max(80).optional(),
  ctaProofInstruction: z.string().max(240).optional(),
  testOnly: z.boolean().optional(),
  testRecipientEmail: z.string().email().optional(),
  dryRun: z.boolean().optional(),
})

type CampaignRequest = z.infer<typeof requestSchema>

function resolveDeliveryChannel(payload: CampaignRequest): 'EMAIL' | 'SMS' | 'VOICE' {
  if (payload.deliveryMode === 'VOICE') return 'VOICE'
  return payload.textChannel || 'EMAIL'
}

async function createCampaignRunRecord(input: {
  userId: string
  payload: CampaignRequest
  requestPayload: Record<string, unknown>
  deliveryChannel: 'EMAIL' | 'SMS' | 'VOICE'
  dryRun: boolean
  status: string
  dispatchMode?: string | null
  provider?: string | null
  externalCampaignId?: string | null
  subject?: string | null
  segmentCount?: number
  queuedRecipients?: number
  skippedNoEmail?: number
  skippedNoChannel?: number
  sentCount?: number
  failedCount?: number
  previewOnlyCount?: number
  voiceSentCount?: number
  responsePayload?: Prisma.JsonValue
  errorMessage?: string | null
}) {
  return prisma.campaignRun.create({
    data: {
      userId: input.userId,
      externalCampaignId: input.externalCampaignId || null,
      status: input.status,
      dispatchMode: input.dispatchMode || null,
      provider: input.provider || null,
      deliveryChannel: input.deliveryChannel,
      subject: input.subject || input.payload.subject || null,
      messageTemplate: input.payload.messageTemplate,
      minTier: (input.payload.minTier as FanTier | undefined) || null,
      minStanScore: input.payload.minStanScore || null,
      recipientLimit: input.payload.limit || null,
      dryRun: input.dryRun,
      segmentCount: input.segmentCount || 0,
      queuedRecipients: input.queuedRecipients || 0,
      skippedNoEmail: input.skippedNoEmail || 0,
      skippedNoChannel: input.skippedNoChannel || 0,
      sentCount: input.sentCount || 0,
      failedCount: input.failedCount || 0,
      previewOnlyCount: input.previewOnlyCount || 0,
      voiceSentCount: input.voiceSentCount || 0,
      requestPayload: input.requestPayload as unknown as Prisma.JsonValue,
      responsePayload: input.responsePayload,
      errorMessage: input.errorMessage || null,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

    const runs = await prisma.campaignRun.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: Number.isNaN(limit) ? 20 : limit,
    })

    return NextResponse.json({ runs })
  } catch (error) {
    console.error('Stanvault campaign history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = requestSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          issues: payload.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        artistName: true,
        name: true,
        pricingTier: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Artist account not found' }, { status: 404 })
    }

    const tierPolicy = tierPolicies[user.pricingTier]
    const deliveryChannel = resolveDeliveryChannel(payload.data)
    const customVariablesCount = Object.keys(payload.data.customVariables || {}).length

    if (customVariablesCount > tierPolicy.maxCustomVariables) {
      return NextResponse.json(
        {
          error: `Your ${user.pricingTier} tier supports up to ${tierPolicy.maxCustomVariables} custom variables per campaign.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (deliveryChannel !== 'SMS' && payload.data.fromEmail && !tierPolicy.allowCustomFromEmail) {
      return NextResponse.json(
        {
          error: 'Custom fromEmail is available on Patron Growth and Sovereign tiers.',
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (payload.data.deliveryMode === 'VOICE' && !tierPolicy.allowVoiceCampaigns) {
      return NextResponse.json(
        {
          error: `Voice campaigns are not available on ${user.pricingTier}.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (payload.data.deliveryMode === 'VOICE' && !payload.data.voiceModelId) {
      return NextResponse.json(
        {
          error: 'voiceModelId is required for VOICE delivery mode.',
        },
        { status: 400 }
      )
    }

    if (
      payload.data.deliveryMode === 'VOICE' &&
      payload.data.voiceConfigMode === 'ADVANCED' &&
      !tierPolicy.allowAdvancedVoiceConfig
    ) {
      return NextResponse.json(
        {
          error: `Advanced voice configuration is not available on ${user.pricingTier}.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    const effectiveVoiceProvider = payload.data.voiceProvider || 'fish-audio'
    if (
      payload.data.deliveryMode === 'VOICE' &&
      !tierPolicy.allowedVoiceProviders.includes(effectiveVoiceProvider)
    ) {
      return NextResponse.json(
        {
          error: `${effectiveVoiceProvider} is not available on ${user.pricingTier}.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (deliveryChannel !== 'SMS' && payload.data.testOnly && !session.user.email) {
      return NextResponse.json(
        {
          error: 'No email on your account. Add one in profile before using Test Voice to Me.',
        },
        { status: 400 }
      )
    }

    if (deliveryChannel === 'SMS' && payload.data.testOnly) {
      return NextResponse.json(
        {
          error: 'SMS test sends are not wired yet. Use a live SMS send with a consented fan segment.',
        },
        { status: 400 }
      )
    }

    if (payload.data.deliveryMode === 'VOICE' && payload.data.ctaDeadline && !payload.data.ctaProofInstruction) {
      return NextResponse.json(
        {
          error: 'CTA proof instruction is required when CTA deadline is set for voice campaigns.',
        },
        { status: 400 }
      )
    }

    const body = {
      ...payload.data,
      deliveryChannel,
      pricingTier: user.pricingTier,
      artistId: payload.data.artistId || user.id,
      artistName: payload.data.artistName || user.artistName || user.name || undefined,
      testRecipientEmail:
        payload.data.testOnly && session.user.email ? session.user.email : payload.data.testRecipientEmail,
    }

    if (deliveryChannel === 'SMS') {
      const targetFans = await getCampaignTargetFans({
        userId: user.id,
        minTier: (payload.data.minTier as FanTier | undefined) || 'CASUAL',
        minStanScore: payload.data.minStanScore,
        limit: payload.data.limit,
      })

      const smsRecipients = targetFans
        .map((fan) => {
          const smsContact = getPrimarySmsContactValue(fan.contactPoints)
          return smsContact?.canSend ? { fan, contact: smsContact.contactPoint } : null
        })
        .filter(Boolean) as Array<{
        fan: Awaited<ReturnType<typeof getCampaignTargetFans>>[number]
        contact: {
          id: string
          value: string
          normalizedValue: string
        }
      }>

      const plannedRecipients = smsRecipients.length
      const skippedNoChannel = targetFans.length - plannedRecipients
      const dryRun = payload.data.dryRun ?? true
      const previewPayload = {
        campaignId: `sms_${Date.now()}`,
        status: dryRun ? 'preview' : plannedRecipients > 0 ? 'queued' : 'empty',
        note:
          plannedRecipients > 0
            ? 'SMS audience prepared from consented phone contacts.'
            : 'No SMS-eligible fans match this segment yet.',
        dispatch: {
          mode: dryRun ? 'preview_only' : 'live',
          provider: isTwilioConfigured() ? 'twilio' : 'twilio_not_configured',
          deliveryMode: 'TEXT' as const,
          deliveryChannel: 'SMS' as const,
          fromEmail: process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID || 'sms',
          subject: payload.data.subject || 'SMS campaign',
        },
        totals: {
          segmentCount: targetFans.length,
          queuedRecipients: plannedRecipients,
          skippedNoEmail: 0,
          skippedNoChannel,
          sent: 0,
          failed: 0,
          previewOnly: plannedRecipients,
        },
        deliveryResultsPreview: smsRecipients.slice(0, 10).map(({ fan, contact }) => ({
          fanId: fan.id,
          target: contact.normalizedValue,
          status: dryRun ? 'preview' : 'queued',
        })),
      }

      if (dryRun) {
        await createCampaignRunRecord({
          userId: user.id,
          payload: payload.data,
          requestPayload: body,
          deliveryChannel,
          dryRun: true,
          status: previewPayload.status,
          dispatchMode: previewPayload.dispatch.mode,
          provider: previewPayload.dispatch.provider,
          externalCampaignId: previewPayload.campaignId,
          subject: previewPayload.dispatch.subject,
          segmentCount: previewPayload.totals.segmentCount,
          queuedRecipients: previewPayload.totals.queuedRecipients,
          skippedNoChannel: previewPayload.totals.skippedNoChannel,
          previewOnlyCount: previewPayload.totals.previewOnly,
          responsePayload: previewPayload as unknown as Prisma.JsonValue,
        })

        return NextResponse.json({
          ...previewPayload,
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        })
      }

      if (!isTwilioConfigured()) {
        return NextResponse.json(
          {
            error: 'Twilio SMS is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER.',
          },
          { status: 400 }
        )
      }

      if (plannedRecipients === 0) {
        return NextResponse.json(
          {
            error: 'No SMS-eligible fans match this segment. Add opted-in phone numbers first.',
          },
          { status: 400 }
        )
      }

      const monthStart = new Date()
      monthStart.setUTCDate(1)
      monthStart.setUTCHours(0, 0, 0, 0)
      const monthAggregate = await prisma.campaignRun.aggregate({
        where: {
          userId: user.id,
          dryRun: false,
          createdAt: { gte: monthStart },
        },
        _sum: {
          sentCount: true,
          voiceSentCount: true,
        },
      })
      const monthSentSoFar = monthAggregate._sum.sentCount || 0

      if (
        tierPolicy.monthlyLiveSendLimit !== null &&
        monthSentSoFar + plannedRecipients > tierPolicy.monthlyLiveSendLimit
      ) {
        return NextResponse.json(
          {
            error: `Monthly live send cap exceeded for ${user.pricingTier}.`,
            limits: {
              monthlyLiveSendLimit: tierPolicy.monthlyLiveSendLimit,
              monthSentSoFar,
              plannedRecipients,
              remaining: Math.max(tierPolicy.monthlyLiveSendLimit - monthSentSoFar, 0),
            },
            entitlements: {
              pricingTier: user.pricingTier,
              ...tierPolicy,
            },
          },
          { status: 402 }
        )
      }

      const smsMessages = smsRecipients.map(({ fan, contact }) => ({
        fanId: fan.id,
        contactId: contact.id,
        to: contact.normalizedValue,
        body: resolveTokens(payload.data.messageTemplate, fan, {
          stanClubName: payload.data.fanClubName,
          customVariables: payload.data.customVariables,
        }),
      }))

      const smsResults = await sendTwilioSmsBatch(
        smsMessages.map((message) => ({
          to: message.to,
          body: message.body,
        }))
      )

      const sentCount = smsResults.filter((result) => result.status === 'sent').length
      const failedCount = smsResults.length - sentCount
      const now = new Date()

      await Promise.all(
        smsResults.map((result, index) =>
          prisma.fanContactPoint.update({
            where: { id: smsMessages[index].contactId },
            data: {
              lastDeliveryAt: now,
              lastDeliveryStatus: result.status === 'sent' ? result.providerStatus || 'queued' : result.error || 'failed',
            },
          })
        )
      )

      const livePayload = {
        campaignId: `sms_${Date.now()}`,
        status: failedCount > 0 ? 'partial' : 'sent',
        note:
          failedCount > 0
            ? `${sentCount} SMS delivered or queued, ${failedCount} failed.`
            : 'SMS campaign delivered or queued successfully.',
        dispatch: {
          mode: 'live',
          provider: 'twilio',
          deliveryMode: 'TEXT' as const,
          deliveryChannel: 'SMS' as const,
          fromEmail: process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID || 'sms',
          subject: payload.data.subject || 'SMS campaign',
        },
        totals: {
          segmentCount: targetFans.length,
          queuedRecipients: plannedRecipients,
          skippedNoEmail: 0,
          skippedNoChannel,
          sent: sentCount,
          failed: failedCount,
          previewOnly: 0,
        },
        deliveryResultsPreview: smsResults.slice(0, 10).map((result, index) => ({
          fanId: smsMessages[index].fanId,
          target: result.to,
          status: result.status,
          messageId: result.messageId || null,
          error: result.error,
        })),
      }

      await createCampaignRunRecord({
        userId: user.id,
        payload: payload.data,
        requestPayload: body,
        deliveryChannel,
        dryRun: false,
        status: livePayload.status,
        dispatchMode: livePayload.dispatch.mode,
        provider: livePayload.dispatch.provider,
        externalCampaignId: livePayload.campaignId,
        subject: livePayload.dispatch.subject,
        segmentCount: livePayload.totals.segmentCount,
        queuedRecipients: livePayload.totals.queuedRecipients,
        skippedNoChannel: livePayload.totals.skippedNoChannel,
        sentCount: livePayload.totals.sent,
        failedCount: livePayload.totals.failed,
        responsePayload: livePayload as unknown as Prisma.JsonValue,
      })

      return NextResponse.json({
        ...livePayload,
        entitlements: {
          pricingTier: user.pricingTier,
          ...tierPolicy,
        },
      })
    }

    const preflightBody = {
      ...body,
      dryRun: true,
    }
    const preflight = await callEmissarCampaign(preflightBody)
    if (!preflight.ok) {
      await createCampaignRunRecord({
        userId: user.id,
        payload: payload.data,
        requestPayload: body,
        deliveryChannel,
        dryRun: true,
        status: 'failed',
        errorMessage: `Emissar preflight returned ${preflight.status}: ${preflight.responseText}`,
      })

      return NextResponse.json(
        {
          error: 'Emissar campaign preflight failed',
          status: preflight.status,
          details: preflight.responseText,
        },
        { status: 502 }
      )
    }

    const preflightData = JSON.parse(preflight.responseText) as EmissarCampaignResponse
    const plannedRecipients = preflightData.totals?.queuedRecipients || 0
    const isTestOnly = Boolean(payload.data.testOnly)

    if (payload.data.dryRun ?? true) {
      await createCampaignRunRecord({
        userId: user.id,
        payload: payload.data,
        requestPayload: body,
        deliveryChannel,
        dryRun: true,
        status: preflightData.status || 'queued',
        dispatchMode: preflightData.dispatch?.mode || 'preview_only',
        provider: preflightData.dispatch?.provider || null,
        externalCampaignId: preflightData.campaignId || null,
        subject: preflightData.dispatch?.subject || payload.data.subject || null,
        segmentCount: preflightData.totals?.segmentCount || 0,
        queuedRecipients: preflightData.totals?.queuedRecipients || 0,
        skippedNoEmail: preflightData.totals?.skippedNoEmail || 0,
        skippedNoChannel: preflightData.totals?.skippedNoEmail || 0,
        sentCount: preflightData.totals?.sent || 0,
        voiceSentCount: payload.data.deliveryMode === 'VOICE' ? preflightData.totals?.sent || 0 : 0,
        failedCount: preflightData.totals?.failed || 0,
        previewOnlyCount: preflightData.totals?.previewOnly || 0,
        responsePayload: preflightData as unknown as Prisma.JsonValue,
      })

      return NextResponse.json({
        ...preflightData,
        dispatch: {
          ...preflightData.dispatch,
          deliveryChannel,
        },
        totals: {
          ...preflightData.totals,
          skippedNoChannel: preflightData.totals?.skippedNoEmail || 0,
        },
        entitlements: {
          pricingTier: user.pricingTier,
          ...tierPolicy,
        },
      })
    }

    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)
    const monthAggregate = await prisma.campaignRun.aggregate({
      where: {
        userId: user.id,
        dryRun: false,
        createdAt: { gte: monthStart },
      },
      _sum: {
        sentCount: true,
        voiceSentCount: true,
      },
    })
    const monthSentSoFar = monthAggregate._sum.sentCount || 0
    const monthVoiceSentSoFar = monthAggregate._sum.voiceSentCount || 0
    const isVoiceCampaign = payload.data.deliveryMode === 'VOICE'

    if (
      !isTestOnly &&
      tierPolicy.monthlyLiveSendLimit !== null &&
      monthSentSoFar + plannedRecipients > tierPolicy.monthlyLiveSendLimit
    ) {
      return NextResponse.json(
        {
          error: `Monthly live send cap exceeded for ${user.pricingTier}.`,
          limits: {
            monthlyLiveSendLimit: tierPolicy.monthlyLiveSendLimit,
            monthSentSoFar,
            plannedRecipients,
            remaining: Math.max(tierPolicy.monthlyLiveSendLimit - monthSentSoFar, 0),
          },
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (
      !isTestOnly &&
      isVoiceCampaign &&
      tierPolicy.monthlyVoiceSendLimit !== null &&
      monthVoiceSentSoFar + plannedRecipients > tierPolicy.monthlyVoiceSendLimit
    ) {
      return NextResponse.json(
        {
          error: `Monthly voice send cap exceeded for ${user.pricingTier}.`,
          limits: {
            monthlyVoiceSendLimit: tierPolicy.monthlyVoiceSendLimit,
            monthVoiceSentSoFar,
            plannedRecipients,
            remaining: Math.max(tierPolicy.monthlyVoiceSendLimit - monthVoiceSentSoFar, 0),
          },
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    const liveBody = {
      ...body,
      dryRun: false,
    }
    const liveResponse = await callEmissarCampaign(liveBody)
    if (!liveResponse.ok) {
      await createCampaignRunRecord({
        userId: user.id,
        payload: payload.data,
        requestPayload: liveBody,
        deliveryChannel,
        dryRun: false,
        status: 'failed',
        errorMessage: `Emissar live send returned ${liveResponse.status}: ${liveResponse.responseText}`,
      })

      return NextResponse.json(
        {
          error: 'Emissar campaign live send failed',
          status: liveResponse.status,
          details: liveResponse.responseText,
        },
        { status: 502 }
      )
    }

    const data = JSON.parse(liveResponse.responseText) as EmissarCampaignResponse

    await createCampaignRunRecord({
      userId: user.id,
      payload: payload.data,
      requestPayload: liveBody,
      deliveryChannel,
      dryRun: false,
      status: data.status || 'unknown',
      dispatchMode: data.dispatch?.mode || null,
      provider: data.dispatch?.provider || null,
      externalCampaignId: data.campaignId || null,
      subject: data.dispatch?.subject || payload.data.subject || null,
      segmentCount: data.totals?.segmentCount || 0,
      queuedRecipients: data.totals?.queuedRecipients || 0,
      skippedNoEmail: data.totals?.skippedNoEmail || 0,
      skippedNoChannel: data.totals?.skippedNoEmail || 0,
      sentCount: data.totals?.sent || 0,
      voiceSentCount: payload.data.deliveryMode === 'VOICE' ? data.totals?.sent || 0 : 0,
      failedCount: data.totals?.failed || 0,
      previewOnlyCount: data.totals?.previewOnly || 0,
      responsePayload: data as unknown as Prisma.JsonValue,
    })

    return NextResponse.json({
      ...data,
      dispatch: {
        ...data.dispatch,
        deliveryChannel,
      },
      totals: {
        ...data.totals,
        skippedNoChannel: data.totals?.skippedNoEmail || 0,
      },
      entitlements: {
        pricingTier: user.pricingTier,
        ...tierPolicy,
      },
    })
  } catch (error) {
    console.error('Stanvault campaign proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
