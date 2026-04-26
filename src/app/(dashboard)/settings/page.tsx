'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PageHeader } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Select } from '@/components/ui'
import { Check, Loader2, ExternalLink } from 'lucide-react'
import ProfilePhotoUpload from '@/components/profile/ProfilePhotoUpload'
import { useProfileImage } from '@/hooks/use-profile-image'

export default function SettingsPage() {
  const { data: session, update } = useSession()

  const [artistName, setArtistName] = useState('')
  const [email, setEmail] = useState('')
  const [spotifyArtistId, setSpotifyArtistId] = useState('')
  const [pricingTier, setPricingTier] = useState('PRIVATE_CIRCLE')
  const [canOverrideTier, setCanOverrideTier] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Auto-Acknowledge state
  interface AckTemplate {
    eventType: string
    enabled: boolean
    subject: string
    messageBody: string
    isCustomized: boolean
  }
  const [ackTemplates, setAckTemplates] = useState<AckTemplate[]>([])
  const [ackSaving, setAckSaving] = useState<string | null>(null)
  const [ackSaved, setAckSaved] = useState<string | null>(null)
  const { profileImage, setOptimistic: setProfileImage } = useProfileImage()

  useEffect(() => {
    if (session?.user) {
      setArtistName(session.user.artistName || '')
      setEmail(session.user.email || '')
      setSpotifyArtistId(session.user.spotifyArtistId || '')
    }
  }, [session])

  useEffect(() => {
    const loadProfileSettings = async () => {
      try {
        const res = await fetch('/api/settings/profile', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) {
          setPricingTier(data?.user?.pricingTier || 'PRIVATE_CIRCLE')
          setCanOverrideTier(Boolean(data?.controls?.canOverrideTier))
        }
      } catch (err) {
        console.error('Failed to load settings profile:', err)
      }
    }
    loadProfileSettings()
  }, [])

  // Load acknowledgment templates
  useEffect(() => {
    const loadAckTemplates = async () => {
      try {
        const res = await fetch('/api/settings/acknowledgments', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok && data.templates) {
          setAckTemplates(data.templates)
        }
      } catch (err) {
        console.error('Failed to load ack templates:', err)
      }
    }
    loadAckTemplates()
  }, [])

  const handleSaveAckTemplate = async (template: AckTemplate) => {
    setAckSaving(template.eventType)
    setAckSaved(null)
    try {
      const res = await fetch('/api/settings/acknowledgments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })
      if (res.ok) {
        setAckSaved(template.eventType)
        setTimeout(() => setAckSaved(null), 3000)
      }
    } catch (err) {
      console.error('Failed to save ack template:', err)
    } finally {
      setAckSaving(null)
    }
  }

  const updateAckTemplate = (eventType: string, updates: Partial<AckTemplate>) => {
    setAckTemplates((prev) =>
      prev.map((t) => (t.eventType === eventType ? { ...t, ...updates } : t))
    )
  }

  const ackEventLabels: Record<string, string> = {
    TIER_UPGRADE: 'Tier Upgrade',
    BECAME_SUPERFAN: 'Reached Core',
    FIRST_TIP: 'First Tip',
    MILESTONE_TIPS: 'Tip Milestone',
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName,
          email,
          spotifyArtistId,
          ...(canOverrideTier ? { pricingTier } : {}),
        }),
      })

      if (res.ok) {
        setSaved(true)
        await update() // Refresh session
        const data = await res.json()
        if (data?.user?.pricingTier) {
          setPricingTier(data.user.pricingTier)
        }
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6 pb-2">
              <ProfilePhotoUpload
                currentPhoto={profileImage}
                onPhotoChange={async (dataUrl) => {
                  const res = await fetch('/api/settings/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: dataUrl }),
                  })
                  if (!res.ok) throw new Error('Failed to upload')
                  setProfileImage(dataUrl) // Updates React Query cache — Header picks it up instantly
                }}
                size="md"
              />
              <p className="text-body-sm text-gray-500 font-light">
                Hover to change photo
              </p>
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <Input
              label="Creator Name"
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your name or brand"
              className="bg-[#111] border border-[#2a2a2a]"
            />
            <Button
              variant="outline"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Spotify Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Spotify ID (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body-sm text-gray-500 font-light">
              Your Spotify Artist ID allows fans to verify their listening history with you.
              Find it in your Spotify for Artists dashboard or from your artist profile URL.
            </p>
            <Input
              label="Spotify Artist ID"
              type="text"
              value={spotifyArtistId}
              onChange={(e) => setSpotifyArtistId(e.target.value)}
              placeholder="e.g., 4Z8W4fKeB5YxbusRsdQVPb"
              hint="From spotify.com/artist/[THIS_ID] or Spotify for Artists"
            />
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  'Save Spotify ID'
                )}
              </Button>
              <a
                href="https://artists.spotify.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-caption text-gray-500 hover:text-accent flex items-center gap-1 transition-colors"
              >
                Open Spotify for Artists
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Tier (Admin/Test Control) */}
        {canOverrideTier && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Tier Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body-sm text-gray-500 font-light">
                Admin control for testing entitlements and campaign gating behavior.
              </p>
              <Select
                label="Current Pricing Tier"
                value={pricingTier}
                onChange={(e) => setPricingTier(e.target.value)}
                variant="boxed"
                options={[
                  { value: 'STARTER', label: 'Starter' },
                  { value: 'PRIVATE_CIRCLE', label: 'Private Circle' },
                  { value: 'PATRON_GROWTH', label: 'Patron Growth' },
                  { value: 'SOVEREIGN', label: 'Sovereign' },
                ]}
              />
              <Button
                variant="outline"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  'Save Tier'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
            />
            <Button variant="outline">Update Password</Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'New Core fan alerts', description: 'Get notified when a fan reaches Core status' },
                { label: 'Weekly digest', description: 'Receive a weekly summary of your fan growth' },
                { label: 'Platform sync alerts', description: 'Notifications when platform connections need attention' },
              ].map((item, index) => (
                <label key={index} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-body-sm font-medium text-white">{item.label}</p>
                    <p className="text-caption text-gray-500">{item.description}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-6 bg-[#1a1a1a] rounded-full peer peer-checked:bg-accent transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Auto-Acknowledge Section */}
        <Card>
          <CardHeader>
            <CardTitle>Auto-Acknowledge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-body-sm text-gray-500 font-light">
              When a fan hits a milestone, automatically send them a personalized message.
              These are transactional and don&apos;t count against campaign limits.
            </p>
            <p className="text-caption text-gray-600">
              Tokens: {'{fan_name}'} {'{fan_tier}'} {'{stan_score}'} {'{tip_count}'} {'{tip_amount_usd}'} {'{city}'} {'{stan_club_name}'}
            </p>

            {ackTemplates.map((template) => (
              <div key={template.eventType} className="border border-[#1a1a1a] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium text-white">
                    {ackEventLabels[template.eventType] || template.eventType}
                  </span>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={template.enabled}
                        onChange={(e) => updateAckTemplate(template.eventType, { enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-[#1a1a1a] rounded-full peer peer-checked:bg-accent transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
                    </div>
                  </label>
                </div>
                {template.enabled && (
                  <>
                    <Input
                      label="Subject"
                      type="text"
                      value={template.subject}
                      onChange={(e) => updateAckTemplate(template.eventType, { subject: e.target.value })}
                      placeholder="Subject line"
                    />
                    <div>
                      <label className="block text-caption text-gray-400 mb-1">Message</label>
                      <textarea
                        value={template.messageBody}
                        onChange={(e) => updateAckTemplate(template.eventType, { messageBody: e.target.value })}
                        rows={3}
                        className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-3 py-2 text-body-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent resize-none"
                        placeholder="Message body with {tokens}"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleSaveAckTemplate(template)}
                      disabled={ackSaving === template.eventType}
                    >
                      {ackSaving === template.eventType ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : ackSaved === template.eventType ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Saved
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-gray-500 font-light">
              Imprint uses a dark theme optimized for long sessions. More themes coming soon.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-status-error/30">
          <CardHeader>
            <CardTitle className="text-status-error">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-gray-500 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="danger">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
