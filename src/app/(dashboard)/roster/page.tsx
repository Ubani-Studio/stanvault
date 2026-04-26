'use client'

// Imprint Roster Intel — manager dashboard.
// Lists every artist this manager has ACTIVE access to with headline metrics.
// Pulls from GET /api/roster/list. Invite + revoke happen inline.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout'
import { Plus, Users } from 'lucide-react'

interface RosterRow {
  link: {
    id: string
    role: 'MANAGER' | 'LABEL' | 'ANALYST'
    status: 'PENDING' | 'ACTIVE' | 'REVOKED'
    acceptedAt: string | null
  }
  artist: {
    id: string
    artistName: string | null
    name: string | null
    email: string
    careerStage: string | null
    genre: string | null
    location: string | null
  }
  metrics: {
    fanCount: number
    avgResonance: number
    tierCounts: Record<string, number>
  }
}

export default function RosterPage() {
  const [roster, setRoster] = useState<RosterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  async function loadRoster() {
    setLoading(true)
    try {
      const res = await fetch('/api/roster/list')
      if (res.status === 403) {
        setError('not_a_manager')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error(`Failed to load roster (${res.status})`)
      const data = await res.json()
      setRoster(data.roster ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoster()
  }, [])

  function toggle(artistId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(artistId)) next.delete(artistId)
      else next.add(artistId)
      return next
    })
  }

  if (error === 'not_a_manager') {
    return (
      <div>
        <PageHeader title="Roster" />
        <div className="border border-[#1a1a1a] p-12 text-center bg-[#0a0a0a]">
          <Users className="w-10 h-10 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl mb-2 text-warm-white" style={{ fontFamily: 'Canela, serif' }}>
            Manager mode is not active
          </h2>
          <p className="text-vault-muted max-w-md mx-auto mb-6 text-sm leading-relaxed">
            Roster Intel is for managers and labels handling multiple artists. Switch your account to manager mode in settings to invite artists and see fan-health side by side.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center px-5 py-2.5 border border-[#1a1a1a] text-gray-300 hover:text-white hover:border-[#333] transition-colors text-sm"
          >
            Open settings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <PageHeader title="Roster" description={`${roster.length} active artist${roster.length === 1 ? '' : 's'}`} />
        <div className="flex items-center gap-3">
          {selected.size >= 2 && (
            <Link
              href={`/roster/compare?artistIds=${Array.from(selected).join(',')}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[#1a1a1a] text-gray-300 hover:text-white hover:border-[#333] transition-colors"
            >
              Compare {selected.size}
            </Link>
          )}
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[#1a1a1a] text-gray-300 hover:text-white hover:border-[#333] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Invite artist
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-vault-muted text-sm">Loading roster…</div>
      ) : error ? (
        <div className="border border-[#3a1414] bg-[#3a1414]/20 text-red-400 p-4 text-sm">{error}</div>
      ) : roster.length === 0 ? (
        <div className="border border-dashed border-[#1a1a1a] p-12 text-center bg-[#0a0a0a]">
          <Users className="w-10 h-10 mx-auto mb-4 text-gray-700" />
          <h2 className="text-xl mb-2 text-warm-white" style={{ fontFamily: 'Canela, serif' }}>
            No artists yet
          </h2>
          <p className="text-vault-muted max-w-md mx-auto mb-6 text-sm leading-relaxed">
            Invite an artist by email. Once they accept, you will see their fan health, Resonance, and drop performance side by side with the rest of your roster.
          </p>
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#1a1a1a] text-gray-300 hover:text-white hover:border-[#333] transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Invite first artist
          </button>
        </div>
      ) : (
        <div className="border border-[#1a1a1a]">
          <div className="grid grid-cols-[40px_1fr_120px_100px_140px_60px] gap-0 px-4 py-3 border-b border-[#1a1a1a] text-xs uppercase tracking-wider text-gray-600">
            <div></div>
            <div>Artist</div>
            <div className="text-right">Fans</div>
            <div className="text-right">Resonance</div>
            <div>Tier mix</div>
            <div></div>
          </div>
          {roster.map((row) => (
            <RosterRowCard
              key={row.link.id}
              row={row}
              selected={selected.has(row.artist.id)}
              onToggle={() => toggle(row.artist.id)}
              onChanged={loadRoster}
            />
          ))}
        </div>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={() => {
            setShowInvite(false)
            loadRoster()
          }}
        />
      )}
    </div>
  )
}

function RosterRowCard({
  row,
  selected,
  onToggle,
  onChanged,
}: {
  row: RosterRow
  selected: boolean
  onToggle: () => void
  onChanged: () => void
}) {
  const [revoking, setRevoking] = useState(false)
  const displayName = row.artist.artistName || row.artist.name || row.artist.email
  const meta = [row.artist.careerStage, row.artist.genre, row.artist.location].filter(Boolean).join(' · ')

  async function revoke(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm(`Revoke roster access for ${displayName}?`)) return
    setRevoking(true)
    try {
      const res = await fetch('/api/roster/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: row.link.id }),
      })
      if (!res.ok) throw new Error('Revoke failed')
      onChanged()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div
      className={`grid grid-cols-[40px_1fr_120px_100px_140px_60px] gap-0 px-4 py-4 border-b border-[#1a1a1a] last:border-b-0 transition-colors ${
        selected ? 'bg-[#0f0f0f]' : 'hover:bg-[#0a0a0a]'
      }`}
    >
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4 accent-white cursor-pointer"
          aria-label={`Select ${displayName}`}
        />
      </div>
      <Link href={`/roster/${row.artist.id}`} className="flex items-center min-w-0">
        <div className="min-w-0">
          <div className="text-warm-white truncate">{displayName}</div>
          {meta && <div className="text-xs text-gray-600 mt-0.5 truncate">{meta}</div>}
        </div>
      </Link>
      <div className="text-right text-warm-white font-mono text-sm flex items-center justify-end">
        {row.metrics.fanCount.toLocaleString()}
      </div>
      <div className="text-right text-warm-white font-mono text-sm flex items-center justify-end">
        {row.metrics.avgResonance}
      </div>
      <div className="flex items-center">
        <TierMix tierCounts={row.metrics.tierCounts} total={row.metrics.fanCount} />
      </div>
      <div className="flex items-center justify-end">
        <button
          onClick={revoke}
          disabled={revoking}
          className="text-xs text-gray-700 hover:text-red-400 transition-colors px-2 py-1"
          aria-label={`Revoke ${displayName}`}
        >
          {revoking ? '…' : 'Revoke'}
        </button>
      </div>
    </div>
  )
}

function TierMix({ tierCounts, total }: { tierCounts: Record<string, number>; total: number }) {
  if (total === 0) return <span className="text-xs text-gray-700">—</span>
  // Tier order from lowest to highest. Colors muted, matching diamabyl palette.
  const tiers = [
    { id: 'CASUAL', color: '#404040' },
    { id: 'ENGAGED', color: '#525252' },
    { id: 'DEDICATED', color: '#888888' },
    { id: 'SUPERFAN', color: '#a3a3a3' },
    { id: 'ELITE', color: '#e8e8e8' },
  ]
  return (
    <div className="flex h-2 w-full bg-[#0a0a0a]" aria-hidden>
      {tiers.map((t) => {
        const count = tierCounts[t.id] ?? 0
        if (count === 0) return null
        const pct = (count / total) * 100
        return (
          <div
            key={t.id}
            style={{ width: `${pct}%`, background: t.color }}
            title={`${t.id}: ${count} (${pct.toFixed(0)}%)`}
          />
        )
      })}
    </div>
  )
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'MANAGER' | 'LABEL' | 'ANALYST'>('MANAGER')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/roster/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistEmail: email, role }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Invite failed (${res.status})`)
      }
      onInvited()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a0a] border border-[#1a1a1a] w-full max-w-md p-6"
      >
        <h2 className="text-xl mb-1 text-warm-white" style={{ fontFamily: 'Canela, serif' }}>
          Invite an artist
        </h2>
        <p className="text-vault-muted text-sm mb-6">
          They will get a notification and decide whether to accept.
        </p>

        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-2">Artist email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          placeholder="artist@example.com"
          className="w-full bg-black border border-[#1a1a1a] text-warm-white px-3 py-2.5 mb-5 text-sm focus:outline-none focus:border-[#333]"
        />

        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-2">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'MANAGER' | 'LABEL' | 'ANALYST')}
          className="w-full bg-black border border-[#1a1a1a] text-warm-white px-3 py-2.5 mb-5 text-sm focus:outline-none focus:border-[#333]"
        >
          <option value="MANAGER">Manager (read fans, send drops)</option>
          <option value="LABEL">Label (broader access, multi-artist)</option>
          <option value="ANALYST">Analyst (read only)</option>
        </select>

        {err && (
          <div className="border border-[#3a1414] bg-[#3a1414]/20 text-red-400 p-3 mb-4 text-sm">{err}</div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !email}
            className="px-5 py-2 text-sm border border-[#1a1a1a] text-warm-white hover:border-[#333] transition-colors disabled:opacity-40"
          >
            {submitting ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </form>
    </div>
  )
}
