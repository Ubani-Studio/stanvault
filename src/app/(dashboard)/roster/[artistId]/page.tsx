'use client'

// Imprint Roster Intel — single-artist drill-down for managers.
// Pulls the same /api/roster/list response and filters to the requested artist for now.
// Future: dedicated /api/roster/artist/[id] endpoint with deeper signal (RCR delta, drop history, recent fan trajectory).

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout'

interface RosterDetail {
  link: { id: string; role: string; status: string; acceptedAt: string | null }
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

export default function ArtistRosterPage({ params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = use(params)
  const [detail, setDetail] = useState<RosterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/roster/list')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load roster (${res.status})`)
        const data = await res.json()
        const match = (data.roster as RosterDetail[]).find((r) => r.artist.id === artistId)
        if (!match) throw new Error('Artist not found in your roster')
        setDetail(match)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [artistId])

  if (loading) {
    return <div className="text-vault-muted text-sm">Loading…</div>
  }
  if (err || !detail) {
    return (
      <div>
        <Link href="/roster" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to roster
        </Link>
        <div className="border border-[#3a1414] bg-[#3a1414]/20 text-red-400 p-4 text-sm">{err}</div>
      </div>
    )
  }

  const displayName = detail.artist.artistName || detail.artist.name || detail.artist.email
  const meta = [detail.artist.careerStage, detail.artist.genre, detail.artist.location].filter(Boolean).join(' · ')

  return (
    <div>
      <Link href="/roster" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        Roster
      </Link>

      <PageHeader title={displayName} description={meta || undefined} />

      <div className="grid grid-cols-3 gap-4 mb-10">
        <Stat label="Fans" value={detail.metrics.fanCount.toLocaleString()} />
        <Stat label="Average Resonance" value={String(detail.metrics.avgResonance)} suffix="/100" />
        <Stat
          label="Top tier"
          value={
            (detail.metrics.tierCounts.ELITE ?? 0) + (detail.metrics.tierCounts.SUPERFAN ?? 0) > 0
              ? `${(detail.metrics.tierCounts.ELITE ?? 0) + (detail.metrics.tierCounts.SUPERFAN ?? 0)}`
              : '0'
          }
          suffix={detail.metrics.fanCount > 0 ? ` of ${detail.metrics.fanCount}` : ''}
        />
      </div>

      <h2 className="text-sm uppercase tracking-wider text-gray-600 mb-4">Tier distribution</h2>
      <TierBar tierCounts={detail.metrics.tierCounts} total={detail.metrics.fanCount} />

      <p className="mt-12 text-vault-muted text-sm leading-relaxed max-w-prose">
        Drop history, RCR trend, recent fan trajectory, and content attribution will land here as the deeper roster API ships. For now, this page mirrors the roster list view filtered to one artist.
      </p>
    </div>
  )
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="border border-[#1a1a1a] p-5 bg-[#0a0a0a]">
      <div className="text-xs uppercase tracking-wider text-gray-600 mb-2">{label}</div>
      <div className="text-2xl text-warm-white" style={{ fontFamily: 'Canela, serif' }}>
        {value}
        {suffix && <span className="text-sm text-gray-600 ml-2">{suffix}</span>}
      </div>
    </div>
  )
}

function TierBar({ tierCounts, total }: { tierCounts: Record<string, number>; total: number }) {
  if (total === 0) return <div className="text-vault-muted text-sm">No fans yet</div>

  const tiers = [
    { id: 'CASUAL', label: 'Casual', color: '#404040' },
    { id: 'ENGAGED', label: 'Engaged', color: '#525252' },
    { id: 'DEDICATED', label: 'Dedicated', color: '#888888' },
    { id: 'SUPERFAN', label: 'Superfan', color: '#a3a3a3' },
    { id: 'ELITE', label: 'Elite', color: '#e8e8e8' },
  ]

  return (
    <div>
      <div className="flex h-3 w-full bg-[#0a0a0a] mb-3">
        {tiers.map((t) => {
          const count = tierCounts[t.id] ?? 0
          if (count === 0) return null
          const pct = (count / total) * 100
          return <div key={t.id} style={{ width: `${pct}%`, background: t.color }} />
        })}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {tiers.map((t) => {
          const count = tierCounts[t.id] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={t.id} className="border-l border-[#1a1a1a] pl-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5" style={{ background: t.color }} />
                <span className="text-xs uppercase tracking-wider text-gray-500">{t.label}</span>
              </div>
              <div className="text-warm-white">
                {count} <span className="text-xs text-gray-600">({pct}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
