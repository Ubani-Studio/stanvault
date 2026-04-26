'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface FanContactPoint {
  id: string
  channel: 'EMAIL' | 'SMS'
  value: string
  normalizedValue: string
  isPrimary: boolean
  consentStatus: 'UNKNOWN' | 'PENDING' | 'SUBSCRIBED' | 'UNSUBSCRIBED'
  consentSource?: string | null
  consentCapturedAt?: string | null
  consentRevokedAt?: string | null
}

interface FanContactsProps {
  fanId: string
  contactPoints: FanContactPoint[]
  onSaved: () => void
}

export function FanContacts({ fanId, contactPoints, onSaved }: FanContactsProps) {
  const primarySmsContact =
    contactPoints.find((contactPoint) => contactPoint.channel === 'SMS' && contactPoint.isPrimary) ||
    contactPoints.find((contactPoint) => contactPoint.channel === 'SMS') ||
    null

  const [phoneNumber, setPhoneNumber] = useState(primarySmsContact?.value || '')
  const [consentStatus, setConsentStatus] = useState<
    'UNKNOWN' | 'PENDING' | 'SUBSCRIBED' | 'UNSUBSCRIBED'
  >(primarySmsContact?.consentStatus || 'PENDING')
  const [consentSource, setConsentSource] = useState(primarySmsContact?.consentSource || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPhoneNumber(primarySmsContact?.value || '')
    setConsentStatus(primarySmsContact?.consentStatus || 'PENDING')
    setConsentSource(primarySmsContact?.consentSource || '')
  }, [primarySmsContact?.value, primarySmsContact?.consentStatus, primarySmsContact?.consentSource])

  async function saveContact() {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`/api/fans/${fanId}/contacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          consentStatus,
          consentSource: consentSource || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to save contact')

      setMessage(phoneNumber.trim() ? 'SMS contact saved.' : 'SMS contact removed.')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 space-y-4">
      <div>
        <h2 className="text-sm font-medium text-white">SMS Contact</h2>
        <p className="text-caption text-gray-600 mt-1">
          Only send campaign SMS to numbers with clear marketing consent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Input
          label="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          variant="boxed"
          placeholder="+1 555 123 4567"
          hint="Use the real mobile number or E.164 format."
        />
        <Select
          label="Consent Status"
          value={consentStatus}
          onChange={(e) =>
            setConsentStatus(
              e.target.value as 'UNKNOWN' | 'PENDING' | 'SUBSCRIBED' | 'UNSUBSCRIBED'
            )
          }
          options={[
            { value: 'SUBSCRIBED', label: 'Subscribed' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'UNSUBSCRIBED', label: 'Unsubscribed' },
            { value: 'UNKNOWN', label: 'Unknown' },
          ]}
          variant="boxed"
        />
      </div>

      <Input
        label="Consent Source"
        value={consentSource}
        onChange={(e) => setConsentSource(e.target.value)}
        variant="boxed"
        placeholder="checkout opt-in, backstage signup, csv import"
      />

      {primarySmsContact && (
        <div className="text-caption text-gray-600 space-y-1">
          {primarySmsContact.consentCapturedAt && (
            <p>Opted in: {new Date(primarySmsContact.consentCapturedAt).toLocaleString()}</p>
          )}
          {primarySmsContact.consentRevokedAt && (
            <p>Opted out: {new Date(primarySmsContact.consentRevokedAt).toLocaleString()}</p>
          )}
          <p>Primary SMS route: {primarySmsContact.normalizedValue}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={saveContact} disabled={saving}>
          {saving ? 'Saving...' : 'Save SMS Contact'}
        </Button>
        {message && <p className="text-caption text-status-success">{message}</p>}
        {error && <p className="text-caption text-status-error">{error}</p>}
      </div>
    </div>
  )
}
