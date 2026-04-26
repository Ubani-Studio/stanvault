// Roster Intel — list all artists this manager has active access to.
// Returns each artist's headline metrics (Resonance avg, RCR, tier mix, fan count) for
// the manager dashboard side-by-side comparison view.
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isManager: true },
    })
    if (!me?.isManager) {
      return NextResponse.json({ error: 'Roster Intel requires a manager account' }, { status: 403 })
    }

    const links = await prisma.managerArtistLink.findMany({
      where: { managerId: me.id, status: 'ACTIVE' },
      include: {
        artist: {
          select: {
            id: true,
            artistName: true,
            name: true,
            email: true,
            careerStage: true,
            genre: true,
            location: true,
          },
        },
      },
      orderBy: { acceptedAt: 'desc' },
    })

    // For each managed artist, compute roster-view headline metrics.
    const roster = await Promise.all(
      links.map(async (link) => {
        const fans = await prisma.fan.findMany({
          where: { userId: link.artistId },
          select: { stanScore: true, tier: true },
        })
        const total = fans.length
        const avgResonance = total > 0
          ? Math.round(fans.reduce((sum, f) => sum + f.stanScore, 0) / total)
          : 0
        const tierCounts = fans.reduce<Record<string, number>>((acc, f) => {
          acc[f.tier] = (acc[f.tier] ?? 0) + 1
          return acc
        }, {})
        return {
          link: {
            id: link.id,
            role: link.role,
            status: link.status,
            acceptedAt: link.acceptedAt,
          },
          artist: link.artist,
          metrics: {
            fanCount: total,
            avgResonance,
            tierCounts,
          },
        }
      })
    )

    return NextResponse.json({ roster })
  } catch (error) {
    console.error('Roster list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
