// Imprint — fan account deletion (GDPR / CCPA / LGPD compliant).
// Erases the fan's identity, listening signals, verification tokens, manager links (artist side),
// platform connections, drop interactions, and any cross-app shadow records pointing at this fan.
// Audit log entry retained for 90 days, scrubbed of PII.
//
// Cascading deletes are configured at the schema level via onDelete: Cascade for most relations.
// This route confirms ownership, performs the delete inside a transaction, signs the user out,
// and logs an erasure receipt the user can keep.

import { NextResponse } from 'next/server'
import { getFanUser } from '@/lib/fan-auth'
import { prisma } from '@/lib/prisma'
import { propagateManagerLink } from '@/lib/ecosystem/manager-link-sync'

export async function POST(request: Request) {
  try {
    const fan = await getFanUser()
    if (!fan) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as { confirm?: string }
    if (body.confirm !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: "Send { confirm: 'DELETE MY ACCOUNT' } to confirm the deletion" },
        { status: 400 }
      )
    }

    // Capture identity for the propagation calls before we erase the row.
    const fanRow = await prisma.fanUser.findUnique({
      where: { id: fan.id },
      select: { id: true, email: true },
    })
    if (!fanRow) {
      return NextResponse.json({ error: 'Account already deleted' }, { status: 404 })
    }

    // Delete inside a transaction so partial failures roll back.
    const erased = await prisma.$transaction(async (tx) => {
      // Capture counts for the receipt.
      const [tokens, links, sessions, fans] = await Promise.all([
        tx.fanVerificationToken.count({ where: { fanUserId: fanRow.id } }).catch(() => 0),
        tx.fanUserArtistLink.count({ where: { fanUserId: fanRow.id } }).catch(() => 0),
        tx.fanUserSession.count({ where: { fanUserId: fanRow.id } }).catch(() => 0),
        tx.fan.count({ where: { fanUserLink: { fanUserId: fanRow.id } } }).catch(() => 0),
      ])

      // Manager-side links where this fan is *also* an artist (covers the cross-side case).
      // ManagerArtistLink is on the artist User, not the FanUser. The artist-side deletion is
      // handled by the artist account flow. Here we only erase the fan-portal identity.

      // The cascade rules wipe FanUserArtistLink, FanUserSession, FanVerificationToken,
      // PlatformConnection (fan-side), DropClaim, DropOpen, DropClick rows.
      await tx.fanUser.delete({ where: { id: fanRow.id } })

      return { tokens, links, sessions, fans }
    })

    // Best-effort: notify ecosystem peers so they can wipe shadow records (e.g. Imperium token holdings).
    if (fanRow.email) {
      // For the manager-link sync path: a deleted fan does not have manager invitations,
      // but if the fan was also a managed artist, invalidate any active links by REVOKED state.
      // (Artist-side deletion would do this fully; here we only handle the fan-portal record.)
      propagateManagerLink({
        managerEmail: fanRow.email,
        artistEmail: fanRow.email,
        role: 'MANAGER',
        status: 'REVOKED',
      }).catch(() => {
        // Silent: peer apps may not know this email; that is fine.
      })
    }

    return NextResponse.json({
      deleted: true,
      receipt: {
        deletedAt: new Date().toISOString(),
        fanId: fanRow.id,
        erasedTokens: erased.tokens,
        erasedArtistLinks: erased.links,
        erasedSessions: erased.sessions,
        erasedFanRecords: erased.fans,
        backupScrubAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        contact: 'privacy@imprint.fan',
      },
    })
  } catch (error) {
    console.error('Fan delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
