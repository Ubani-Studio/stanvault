// Roster Intel — side-by-side comparison of multiple managed artists.
// Accepts ?artistIds=a,b,c and returns matching headline metrics for the manager dashboard.
// Verifies the manager has ACTIVE access to every requested artist before returning data.
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const artistIdsParam = url.searchParams.get('artistIds')
    if (!artistIdsParam) {
      return NextResponse.json({ error: 'artistIds query param required (comma-separated)' }, { status: 400 })
    }

    const artistIds = artistIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
    if (artistIds.length < 2) {
      return NextResponse.json({ error: 'compare requires at least 2 artistIds' }, { status: 400 })
    }
    if (artistIds.length > 10) {
      return NextResponse.json({ error: 'compare supports up to 10 artists' }, { status: 400 })
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isManager: true },
    })
    if (!me?.isManager) {
      return NextResponse.json({ error: 'Roster Intel requires a manager account' }, { status: 403 })
    }

    // Verify ACTIVE links for each requested artist.
    const links = await prisma.managerArtistLink.findMany({
      where: {
        managerId: me.id,
        status: 'ACTIVE',
        artistId: { in: artistIds },
      },
      select: { artistId: true },
    })
    const accessibleIds = new Set(links.map((l) => l.artistId))
    const missing = artistIds.filter((id) => !accessibleIds.has(id))
    if (missing.length > 0) {
      return NextResponse.json({ error: 'No active access to artists', missing }, { status: 403 })
    }

    const rows = await Promise.all(
      artistIds.map(async (artistId) => {
        const artist = await prisma.user.findUnique({
          where: { id: artistId },
          select: { id: true, artistName: true, name: true, careerStage: true, genre: true },
        })
        const fans = await prisma.fan.findMany({
          where: { userId: artistId },
          select: { stanScore: true, tier: true, lastActiveAt: true, firstSeenAt: true },
        })
        const total = fans.length
        const avgResonance = total > 0
          ? Math.round(fans.reduce((sum, f) => sum + f.stanScore, 0) / total)
          : 0
        const tierCounts = fans.reduce<Record<string, number>>((acc, f) => {
          acc[f.tier] = (acc[f.tier] ?? 0) + 1
          return acc
        }, {})
        const eliteCount = tierCounts.ELITE ?? 0
        const superfanCount = tierCounts.SUPERFAN ?? 0
        const resonanceShare =
          total > 0 ? Math.round(((eliteCount + superfanCount) / total) * 100) : 0

        return {
          artist,
          metrics: {
            fanCount: total,
            avgResonance,
            tierCounts,
            eliteCount,
            superfanCount,
            resonanceShare, // % of fans at SUPERFAN or ELITE — single roster-comparison signal
          },
        }
      })
    )

    return NextResponse.json({ comparison: rows })
  } catch (error) {
    console.error('Roster compare error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
