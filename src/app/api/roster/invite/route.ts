// Roster Intel — manager sends an invitation to an artist for management access.
// Creates a ManagerArtistLink in PENDING state. Artist accepts or revokes via /accept or /revoke.
// Best-effort propagation to peer apps (Crucibla) via the ecosystem sync helper.
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { propagateManagerLink } from '@/lib/ecosystem/manager-link-sync'
import { sendManagerInviteEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { artistEmail, role } = body
    if (!artistEmail) {
      return NextResponse.json({ error: 'artistEmail required' }, { status: 400 })
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isManager: true, name: true, email: true },
    })
    if (!me?.isManager) {
      return NextResponse.json({ error: 'Roster Intel requires a manager account' }, { status: 403 })
    }

    const artist = await prisma.user.findUnique({
      where: { email: artistEmail },
      select: { id: true, email: true },
    })
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
    }
    if (artist.id === me.id) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 })
    }

    const link = await prisma.managerArtistLink.upsert({
      where: { managerId_artistId: { managerId: me.id, artistId: artist.id } },
      create: {
        managerId: me.id,
        artistId: artist.id,
        role: role ?? 'MANAGER',
        status: 'PENDING',
      },
      update: {
        role: role ?? 'MANAGER',
        status: 'PENDING',
        revokedAt: null,
      },
    })

    // Propagate to ecosystem peers (Crucibla, etc.). Best-effort, never blocks the user.
    if (me.email) {
      propagateManagerLink({
        managerEmail: me.email,
        artistEmail: artist.email,
        role: link.role,
        status: 'PENDING',
      }).catch((e) => console.warn('[invite] propagation error:', e))
    }

    // Send the artist a notification email with the accept link.
    if (me.email && artist.email) {
      const acceptUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3003'}/roster?accept=${link.id}`
      sendManagerInviteEmail({
        to: artist.email,
        managerName: me.name || me.email,
        managerEmail: me.email,
        artistName: artist.email,
        role: link.role,
        acceptUrl,
      }).catch((e) => console.warn('[invite] email error:', e))
    }

    return NextResponse.json({ link })
  } catch (error) {
    console.error('Roster invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
