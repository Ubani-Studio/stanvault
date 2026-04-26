'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { CampaignResponse } from './campaign-constants'

interface CampaignResultProps {
  result: CampaignResponse
}

export function CampaignResult({ result }: CampaignResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Result</CardTitle>
        <p className="text-caption text-gray-500 mt-0.5">
          {result.campaignId} · {result.status}
          {result.dispatch
            ? ` · ${result.dispatch.deliveryChannel || result.dispatch.deliveryMode || 'TEXT'} via ${result.dispatch.provider}`
            : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.totals && (
          <div className="flex items-center gap-6 text-body-sm">
            <span className="text-gray-400">
              Segment <span className="text-white">{result.totals.segmentCount}</span>
            </span>
            <span className="text-gray-400">
              Sent <span className="text-white">{result.totals.sent}</span>
            </span>
            <span className="text-gray-400">
              Failed <span className="text-white">{result.totals.failed}</span>
            </span>
            <span className="text-gray-400">
              Preview <span className="text-white">{result.totals.previewOnly}</span>
            </span>
            {!!result.totals.skippedNoChannel && (
              <span className="text-gray-400">
                Skipped <span className="text-white">{result.totals.skippedNoChannel}</span>
              </span>
            )}
          </div>
        )}

        {result.note && <p className="text-caption text-gray-500">{result.note}</p>}

        {result.deliveryResultsPreview && result.deliveryResultsPreview.length > 0 && (
          <div className="space-y-1 pt-2">
            {result.deliveryResultsPreview.map((item) => (
              <div
                key={`${item.fanId}-${item.target || item.email || 'recipient'}`}
                className="flex items-center gap-4 py-1 text-caption"
              >
                <span className="text-gray-300 min-w-0 truncate">{item.target || item.email}</span>
                <span className="text-gray-500">{item.status}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
