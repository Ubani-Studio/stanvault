import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fanId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fanId } = await params

    const fan = await prisma.fan.findFirst({
      where: {
        id: fanId,
        userId: session.user.id,
      },
      include: {
        platformLinks: true,
        contactPoints: {
          orderBy: [{ channel: 'asc' }, { isPrimary: 'desc' }, { updatedAt: 'desc' }],
        },
      },
    })

    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    return NextResponse.json(fan)
  } catch (error) {
    console.error('Fan fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fanId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fanId } = await params
    const body = await req.json()

    // Check fan belongs to user
    const existingFan = await prisma.fan.findFirst({
      where: {
        id: fanId,
        userId: session.user.id,
      },
    })

    if (!existingFan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    // Only allow updating notes for now
    const fan = await prisma.fan.update({
      where: { id: fanId },
      data: { notes: body.notes },
    })

    return NextResponse.json(fan)
  } catch (error) {
    console.error('Fan update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
