import { Avatar, TierBadge, StanScoreBadge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar, Mail, Smartphone } from 'lucide-react'

interface FanProfileHeaderProps {
  fan: {
    displayName: string
    email?: string
    avatarUrl?: string
    location?: string
    contactPoints?: Array<{
      channel: 'EMAIL' | 'SMS'
      value: string
      isPrimary: boolean
      consentStatus: 'UNKNOWN' | 'PENDING' | 'SUBSCRIBED' | 'UNSUBSCRIBED'
    }>
    tier: string
    stanScore: number
    firstSeenAt: string
  }
}

export function FanProfileHeader({ fan }: FanProfileHeaderProps) {
  const primarySmsContact =
    fan.contactPoints?.find((contactPoint) => contactPoint.channel === 'SMS' && contactPoint.isPrimary) ||
    fan.contactPoints?.find((contactPoint) => contactPoint.channel === 'SMS')

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
      <div className="flex items-start gap-6">
        <Avatar src={fan.avatarUrl} name={fan.displayName} size="xl" />

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-medium text-warm-white" style={{ fontFamily: 'Canela, serif' }}>
              {fan.displayName}
            </h1>
            <TierBadge tier={fan.tier} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            {fan.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {fan.email}
              </div>
            )}
            {primarySmsContact && (
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                {primarySmsContact.value}
                <span className="text-gray-700">
                  ({primarySmsContact.consentStatus.toLowerCase()})
                </span>
              </div>
            )}
            {fan.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {fan.location}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Fan since {formatDate(fan.firstSeenAt)}
            </div>
          </div>

          <StanScoreBadge score={fan.stanScore} />
        </div>
      </div>
    </div>
  )
}
