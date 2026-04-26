// Roster Intel — artist accepts a pending manager invitation.
// Best-effort propagation to peer apps (Crucibla) via the ecosystem sync helper.
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { propagateManagerLink } from '@/lib/ecosystem/manager-link-sync'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { linkId } = await request.json()
    if (!linkId) {
      return NextResponse.json({ error: 'linkId required' }, { status: 400 })
    }

    const link = await prisma.managerArtistLink.findUnique({ where: { id: linkId } })
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }
    if (link.artistId !== session.user.id) {
      return NextResponse.json({ error: 'Only the artist can accept this link' }, { status: 403 })
    }
    if (link.status !== 'PENDING') {
      return NextResponse.json({ error: `Link is ${link.status}, cannot accept` }, { status: 400 })
    }

    const updated = await prisma.managerArtistLink.update({
      where: { id: linkId },
      data: { status: 'ACTIVE', acceptedAt: new Date() },
      include: {
        manager: { select: { email: true } },
        artist: { select: { email: true } },
      },
    })

    if (updated.manager.email && updated.artist.email) {
      propagateManagerLink({
        managerEmail: updated.manager.email,
        artistEmail: updated.artist.email,
        role: updated.role,
        status: 'ACTIVE',
      }).catch((e) => console.warn('[accept] propagation error:', e))
    }

    return NextResponse.json({
      link: {
        id: updated.id,
        managerId: updated.managerId,
        artistId: updated.artistId,
        role: updated.role,
        status: updated.status,
        acceptedAt: updated.acceptedAt,
      },
    })
  } catch (error) {
    console.error('Roster accept error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
