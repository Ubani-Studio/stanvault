import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ContactChannel, ContactConsentStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { upsertFanSmsContact } from '@/lib/fan-contact-points'

const updateSchema = z.object({
  phoneNumber: z.string().max(40).optional().or(z.literal('')),
  consentStatus: z
    .enum(['UNKNOWN', 'PENDING', 'SUBSCRIBED', 'UNSUBSCRIBED'])
    .default('PENDING'),
  consentSource: z.string().max(120).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fanId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fanId } = await params
    const payload = updateSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          issues: payload.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const fan = await prisma.fan.findFirst({
      where: {
        id: fanId,
        userId: session.user.id,
      },
      include: {
        contactPoints: true,
      },
    })

    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    const phoneNumber = payload.data.phoneNumber?.trim() || ''

    if (!phoneNumber) {
      await prisma.fanContactPoint.deleteMany({
        where: {
          fanId,
          channel: ContactChannel.SMS,
        },
      })

      return NextResponse.json({ contactPoints: [] })
    }

    const contactPoint = await upsertFanSmsContact(prisma, {
      fanId,
      phoneNumber,
      consentStatus: payload.data.consentStatus as ContactConsentStatus,
      consentSource: payload.data.consentSource || 'artist_manual_update',
    })

    return NextResponse.json({ contactPoint })
  } catch (error) {
    console.error('Fan contact update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
