'use client'

import type { CampaignHistoryItem } from './campaign-constants'

interface CampaignHistoryProps {
  history: CampaignHistoryItem[]
  loading: boolean
}

export function CampaignHistory({ history, loading }: CampaignHistoryProps) {
  if (loading) {
    return <p className="text-caption text-gray-500">Loading...</p>
  }

  if (history.length === 0) {
    return <p className="text-caption text-gray-500">No campaigns yet. Compose your first one above.</p>
  }

  return (
    <div className="space-y-0.5">
      {history.map((run) => (
        <div
          key={run.id}
          className="flex items-center gap-4 py-2 text-caption border-b border-[#111] last:border-0"
        >
          <span className="text-gray-500 tabular-nums w-36 shrink-0">
            {new Date(run.createdAt).toLocaleString()}
          </span>
          <span className="text-gray-400 w-16 shrink-0">{run.status}</span>
          {run.deliveryChannel && (
            <span className="text-gray-500 w-14 shrink-0">{run.deliveryChannel}</span>
          )}
          <span className="text-gray-300 truncate flex-1">{run.subject || '-'}</span>
          <span className="text-gray-400 tabular-nums">{run.sentCount} sent</span>
          {run.failedCount > 0 && (
            <span className="text-status-error tabular-nums">{run.failedCount} failed</span>
          )}
        </div>
      ))}
    </div>
  )
}
