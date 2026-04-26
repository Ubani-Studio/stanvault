// Imprint — cross-app manager-link sync endpoint.
// Crucibla (or any ecosystem peer) calls this to propagate ManagerArtistLink state.
// Identity bridge: email. We resolve both manager and artist by email via the User table.
//
// POST body: {
//   managerEmail: string,
//   artistEmail: string,
//   role: "MANAGER" | "LABEL" | "ANALYST",
//   status: "PENDING" | "ACTIVE" | "REVOKED"
// }
// GET ?managerEmail=&artistEmail=  -> { link } | { link: null }

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ManagerLinkStatus, ManagerRole } from '@prisma/client'

interface PeerLinkBody {
  managerEmail?: string
  artistEmail?: string
  role?: ManagerRole
  status?: ManagerLinkStatus
}

function ecosystemAuth(request: Request): { ok: true } | { ok: false; res: NextResponse } {
  const secret = request.headers.get('x-ecosystem-secret')
  if (!process.env.ECOSYSTEM_API_SECRET || secret !== process.env.ECOSYSTEM_API_SECRET) {
    return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true }
}

async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, isManager: true },
  })
}

export async function POST(request: Request) {
  const auth = ecosystemAuth(request)
  if (!auth.ok) return auth.res

  const body = (await request.json().catch(() => ({}))) as PeerLinkBody
  const { managerEmail, artistEmail, role = 'MANAGER', status = 'PENDING' } = body

  if (!managerEmail || !artistEmail) {
    return NextResponse.json(
      { error: 'managerEmail and artistEmail required' },
      { status: 400 }
    )
  }

  const [manager, artist] = await Promise.all([
    findUserByEmail(managerEmail),
    findUserByEmail(artistEmail),
  ])

  // If either party is not in Imprint yet, defer (peer app keeps its own record).
  if (!manager || !artist) {
    return NextResponse.json({
      synced: false,
      reason: !manager ? 'manager_not_in_imprint' : 'artist_not_in_imprint',
    })
  }

  // Promote manager flag if not already set.
  if (!manager.isManager) {
    await prisma.user.update({
      where: { id: manager.id },
      data: { isManager: true },
    })
  }

  const now = new Date()
  const updateData: Record<string, unknown> = { role, status }
  if (status === 'ACTIVE') updateData.acceptedAt = now
  if (status === 'REVOKED') updateData.revokedAt = now

  const link = await prisma.managerArtistLink.upsert({
    where: { managerId_artistId: { managerId: manager.id, artistId: artist.id } },
    create: {
      managerId: manager.id,
      artistId: artist.id,
      role,
      status,
      ...(status === 'ACTIVE' ? { acceptedAt: now } : {}),
    },
    update: updateData,
  })

  return NextResponse.json({
    synced: true,
    link: {
      id: link.id,
      role: link.role,
      status: link.status,
      acceptedAt: link.acceptedAt,
      revokedAt: link.revokedAt,
    },
  })
}

export async function GET(request: Request) {
  const auth = ecosystemAuth(request)
  if (!auth.ok) return auth.res

  const { searchParams } = new URL(request.url)
  const managerEmail = searchParams.get('managerEmail')
  const artistEmail = searchParams.get('artistEmail')

  if (!managerEmail || !artistEmail) {
    return NextResponse.json(
      { error: 'managerEmail and artistEmail query params required' },
      { status: 400 }
    )
  }

  const [manager, artist] = await Promise.all([
    findUserByEmail(managerEmail),
    findUserByEmail(artistEmail),
  ])

  if (!manager || !artist) {
    return NextResponse.json({ link: null })
  }

  const link = await prisma.managerArtistLink.findUnique({
    where: { managerId_artistId: { managerId: manager.id, artistId: artist.id } },
    select: {
      id: true,
      role: true,
      status: true,
      acceptedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ link })
}
