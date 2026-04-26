'use client'

// Imprint Roster Intel — side-by-side compare of selected artists.
// Reads ?artistIds=a,b,c from the URL, calls /api/roster/compare.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout'

interface CompareRow {
  artist: {
    id: string
    artistName: string | null
    name: string | null
    careerStage: string | null
    genre: string | null
  }
  metrics: {
    fanCount: number
    avgResonance: number
    tierCounts: Record<string, number>
    eliteCount: number
    superfanCount: number
    resonanceShare: number
  }
}

export default function CompareRosterPage() {
  const params = useSearchParams()
  const artistIds = params.get('artistIds') ?? ''
  const [rows, setRows] = useState<CompareRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!artistIds) {
      setErr('No artists selected')
      setLoading(false)
      return
    }
    fetch(`/api/roster/compare?artistIds=${encodeURIComponent(artistIds)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Compare failed (${res.status})`)
        }
        const data = await res.json()
        setRows(data.comparison ?? [])
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [artistIds])

  return (
    <div>
      <Link href="/roster" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        Roster
      </Link>

      <PageHeader title="Compare" description={`${rows.length} artist${rows.length === 1 ? '' : 's'} side by side`} />

      {loading ? (
        <div className="text-vault-muted text-sm">Loading…</div>
      ) : err ? (
        <div className="border border-[#3a1414] bg-[#3a1414]/20 text-red-400 p-4 text-sm">{err}</div>
      ) : rows.length === 0 ? (
        <div className="text-vault-muted text-sm">No artists to compare. Pick at least two from the roster.</div>
      ) : (
        <div className="border border-[#1a1a1a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-xs uppercase tracking-wider text-gray-600">
                <th className="text-left px-4 py-3 font-normal">Artist</th>
                <th className="text-right px-4 py-3 font-normal">Fans</th>
                <th className="text-right px-4 py-3 font-normal">Average Resonance</th>
                <th className="text-right px-4 py-3 font-normal">Elite</th>
                <th className="text-right px-4 py-3 font-normal">Superfan</th>
                <th className="text-right px-4 py-3 font-normal">Resonance share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const displayName = r.artist.artistName || r.artist.name || r.artist.id
                return (
                  <tr key={r.artist.id} className="border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#0a0a0a]">
                    <td className="px-4 py-4">
                      <Link href={`/roster/${r.artist.id}`} className="text-warm-white hover:underline">
                        {displayName}
                      </Link>
                      {(r.artist.careerStage || r.artist.genre) && (
                        <div className="text-xs text-gray-600 mt-0.5">
                          {[r.artist.careerStage, r.artist.genre].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right text-warm-white font-mono">{r.metrics.fanCount.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right text-warm-white font-mono">{r.metrics.avgResonance}</td>
                    <td className="px-4 py-4 text-right text-warm-white font-mono">{r.metrics.eliteCount}</td>
                    <td className="px-4 py-4 text-right text-warm-white font-mono">{r.metrics.superfanCount}</td>
                    <td className="px-4 py-4 text-right text-warm-white font-mono">{r.metrics.resonanceShare}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-vault-muted text-xs leading-relaxed">
        Resonance share = the percentage of fans at Superfan or Elite tier. Higher means more loyal core, deeper presale conversion, more durable artist.
      </p>
    </div>
  )
}
