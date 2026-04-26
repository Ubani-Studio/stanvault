import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { FanTier } from '@prisma/client'
import { auth } from '@/lib/auth'
import { getCampaignAudienceSnapshot } from '@/lib/campaign-audience'
import { isTwilioConfigured } from '@/lib/twilio'

const querySchema = z.object({
  minTier: z.enum(['CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN']).optional(),
  minStanScore: z.coerce.number().int().min(0).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      minTier: searchParams.get('minTier') || undefined,
      minStanScore: searchParams.get('minStanScore') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          issues: parsed.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const audience = await getCampaignAudienceSnapshot({
      userId: session.user.id,
      minTier: (parsed.data.minTier as FanTier | undefined) || 'CASUAL',
      minStanScore: parsed.data.minStanScore,
      limit: parsed.data.limit,
    })

    return NextResponse.json({
      ...audience,
      smsConfigured: isTwilioConfigured(),
    })
  } catch (error) {
    console.error('Campaign audience error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
