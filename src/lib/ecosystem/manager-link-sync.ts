// Cross-app manager-link propagation.
// When Imprint creates / accepts / revokes a ManagerArtistLink, this fires the same
// state change to Crucibla. Best-effort. Logs on failure, does not block the user.
//
// Crucibla (or any other ecosystem peer) is configured via env:
//   CRUCIBLA_API_URL    - default http://localhost:3055/api
//   ECOSYSTEM_API_SECRET - shared secret with Crucibla
//
// Identity bridge is email. The peer resolves its own user IDs.

import type { ManagerLinkStatus, ManagerRole } from '@prisma/client'

const CRUCIBLA_API_URL = process.env.CRUCIBLA_API_URL ?? 'http://localhost:3055/api'
const ECOSYSTEM_API_SECRET = process.env.ECOSYSTEM_API_SECRET ?? ''

type PeerApp = 'crucibla'

const PEERS: Record<PeerApp, string> = {
  crucibla: CRUCIBLA_API_URL,
}

interface PropagateInput {
  managerEmail: string
  artistEmail: string
  role: ManagerRole
  status: ManagerLinkStatus
}

interface PropagateResult {
  peer: PeerApp
  ok: boolean
  reason?: string
  detail?: string
}

/**
 * Fire the same link state change to every configured peer app. Resolves with one entry
 * per peer. Failures are logged but never thrown; the caller continues regardless.
 */
export async function propagateManagerLink(input: PropagateInput): Promise<PropagateResult[]> {
  if (!ECOSYSTEM_API_SECRET) {
    console.warn('[manager-link-sync] ECOSYSTEM_API_SECRET not set, skipping propagation')
    return []
  }

  const peers = Object.entries(PEERS) as Array<[PeerApp, string]>
  const results = await Promise.all(
    peers.map(async ([peer, baseUrl]): Promise<PropagateResult> => {
      try {
        const res = await fetch(`${baseUrl}/ecosystem/manager-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-ecosystem-secret': ECOSYSTEM_API_SECRET,
          },
          body: JSON.stringify(input),
        })

        if (!res.ok) {
          const detail = await res.text().catch(() => '')
          console.warn(
            `[manager-link-sync] ${peer} returned ${res.status}: ${detail.slice(0, 200)}`
          )
          return { peer, ok: false, reason: `http_${res.status}`, detail: detail.slice(0, 300) }
        }

        const data = (await res.json()) as { synced?: boolean; reason?: string }
        return {
          peer,
          ok: data.synced !== false,
          reason: data.reason,
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'unknown'
        console.warn(`[manager-link-sync] ${peer} threw: ${message}`)
        return { peer, ok: false, reason: 'exception', detail: message }
      }
    })
  )
  return results
}
