// ── Types ────────────────────────────────────────────────────────────────────

export type CampaignResponse = {
  campaignId: string
  status: string
  note?: string
  dispatch?: {
    mode: string
    provider: string
    deliveryMode?: 'TEXT' | 'VOICE'
    deliveryChannel?: 'EMAIL' | 'SMS' | 'VOICE'
    voiceProvider?: string
    fromEmail: string
    subject: string
  }
  variables?: {
    builtIn: string[]
    custom: string[]
  }
  totals?: {
    segmentCount: number
    queuedRecipients: number
    skippedNoEmail: number
    skippedNoChannel?: number
    sent: number
    failed: number
    previewOnly: number
  }
  reliability?: {
    retries?: number
    timedOutAttempts?: number
    providerErrors?: number
  }
  deliveryResultsPreview?: Array<{
    fanId: string
    email?: string
    target?: string
    status: string
    messageId?: string | null
    error?: string
  }>
}

export type VoiceCloneResponse = {
  id?: string
  externalId?: string
  provider?: 'fish-audio' | 'resemble-ai' | 'chatterbox'
  name?: string
  previewUrl?: string
}

export type VoiceTake = {
  id: string
  blob: Blob
  durationMs: number
  source: 'recorded' | 'uploaded'
}

export type SavedVoiceModel = {
  id: string
  externalId: string
  provider: 'fish-audio' | 'resemble-ai' | 'chatterbox'
  name: string
  previewUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CampaignHistoryItem = {
  id: string
  externalCampaignId: string | null
  status: string
  dispatchMode: string | null
  provider: string | null
  deliveryChannel?: string | null
  subject: string | null
  minTier: string | null
  minStanScore: number | null
  recipientLimit: number | null
  dryRun: boolean
  segmentCount: number
  queuedRecipients: number
  sentCount: number
  failedCount: number
  previewOnlyCount: number
  createdAt: string
}

export type CampaignAudienceSummary = {
  matchingFans: number
  selectedFans: number
  emailEligibleFans: number
  smsEligibleFans: number
  smsKnownFans: number
  smsPendingFans: number
  smsUnsubscribedFans: number
  smsConfigured: boolean
}

export type VariablePreset = {
  id: string
  name: string
  fanClubName: string | null
  customVariables: Record<string, string | number> | null
  createdAt: string
  updatedAt: string
}

export type CampaignEntitlements = {
  pricingTier: 'STARTER' | 'PRIVATE_CIRCLE' | 'PATRON_GROWTH' | 'SOVEREIGN'
  monthlyLiveSendLimit: number | null
  monthlyVoiceSendLimit: number | null
  maxCustomVariables: number
  allowCustomFromEmail: boolean
  prioritySupport: boolean
  allowVoiceCampaigns: boolean
  allowAdvancedVoiceConfig: boolean
  allowedVoiceProviders: Array<'fish-audio' | 'resemble-ai' | 'chatterbox'>
  monthSentSoFar: number
  monthVoiceSentSoFar: number
  remaining: number | null
  voiceRemaining: number | null
}

export type CampaignAnalytics = {
  ctaByKey: Array<{ ctaKey: string; count: number }>
  completionByStatus: Array<{ status: string; count: number }>
}

export type VoiceProvider = 'fish-audio' | 'resemble-ai' | 'chatterbox'

// ── Constants ────────────────────────────────────────────────────────────────

export const suggestedVariableFields = [
  {
    key: 'oryx_phase',
    label: 'Oryx Phase',
    placeholder: 'Propagation',
    hint: 'Token: {oryx_phase}',
  },
  {
    key: 'propagation_goal',
    label: 'Propagation Goal',
    placeholder: '12',
    hint: 'Token: {propagation_goal}',
  },
  {
    key: 'campaign_theme',
    label: 'Campaign Theme',
    placeholder: 'Core Fan Summer',
    hint: 'Token: {campaign_theme}',
  },
  {
    key: 'call_to_action',
    label: 'Call To Action',
    placeholder: 'Share this with your circle',
    hint: 'Token: {call_to_action}',
  },
  {
    key: 'reward_name',
    label: 'Reward Name',
    placeholder: 'Backstage Voice Drop',
    hint: 'Token: {reward_name}',
  },
] as const

export const messageTemplateSuggestions = [
  {
    id: 'welcome',
    label: 'Welcome Core Fan',
    subject: 'You are officially in my inner circle',
    body: 'Hey {fan_name} - I see you. Welcome to the {stan_club_name}. Your pulse is {stan_score}, and that support means everything to me.',
  },
  {
    id: 'share-push',
    label: 'Share Push',
    subject: 'Can you help me push this one out?',
    body: '{fan_name}, you already drove {propagation_count} shares for me. We are aiming for {propagation_goal} this round. If you are in, {call_to_action}.',
  },
  {
    id: 'tip-reward',
    label: 'Tip Reward',
    subject: 'I made this for my real supporters',
    body: 'Hey {fan_name}, you have tipped {tip_count} times (${tip_amount_usd}) and held me down for real. I unlocked {reward_name} for you.',
  },
] as const

export const actionCtaPresets = [
  {
    id: 'share',
    label: 'Share This',
    action: 'Send this to 3 people who will actually listen, not just scroll past.',
    cta: 'Share this with 3 people who will actually listen.',
    oryxPhase: 'Propagation',
  },
  {
    id: 'back',
    label: 'Back This',
    action: 'Tip, pledge, or pre-order right now.',
    cta: 'Back this with one real action right now.',
    oryxPhase: 'Conviction',
  },
  {
    id: 'host-listen',
    label: 'Host a Listen',
    action: 'Run a listening session with 5-10 people and report what landed.',
    cta: 'Host a listen with 5-10 people and send me what landed.',
  },
  {
    id: 'go-local',
    label: 'Go Local',
    action: 'Make one real move in your city: DJ handoff, campus share, venue intro, playlist placement.',
    cta: 'Make one real local move this week and report it.',
    oryxPhase: 'Propagation',
  },
  {
    id: 'bring-in',
    label: 'Bring Someone In',
    action: 'Bring one new fan in and guide them to their first real action.',
    cta: 'Bring one person in and guide their first action.',
  },
  {
    id: 'archive',
    label: 'Archive This',
    action: 'Add one story, clip, or memory that defines this era.',
    cta: 'Archive one story or clip from this era.',
  },
] as const

export const defaultVoiceProviders: VoiceProvider[] = ['fish-audio']

export const moodPresets = [
  'excited',
  'grateful',
  'heartfelt',
  'playful',
  'direct',
] as const

export const tokenGroups = [
  {
    label: 'Fan',
    tokens: [
      { token: '{fan_name}', display: 'name' },
      { token: '{city}', display: 'city' },
      { token: '{country}', display: 'country' },
      { token: '{fan_tier}', display: 'tier' },
    ],
  },
  {
    label: 'Scores',
    tokens: [
      { token: '{stan_score}', display: 'pulse' },
      { token: '{conviction_score}', display: 'conviction' },
      { token: '{engagement_score}', display: 'engagement' },
      { token: '{longevity_score}', display: 'longevity' },
      { token: '{recency_score}', display: 'recency' },
      { token: '{platform_score}', display: 'platform' },
    ],
  },
  {
    label: 'Activity',
    tokens: [
      { token: '{propagation_count}', display: 'shares' },
      { token: '{tip_count}', display: 'tips' },
      { token: '{tip_amount_usd}', display: 'tip $' },
      { token: '{tip_frequency}', display: 'tip freq' },
      { token: '{moment_saves}', display: 'saves' },
    ],
  },
  {
    label: 'Identity',
    tokens: [
      { token: '{stan_club_name}', display: 'fan circle' },
      { token: '{stan_name}', display: 'fan name' },
    ],
  },
] as const

export const voiceDefaults: Record<
  string,
  {
    style: 'natural' | 'whisper' | 'singing' | 'shouting'
    emotion: 'neutral' | 'grateful' | 'excited' | 'playful' | 'heartfelt'
    mood: string
  }
> = {
  share: { style: 'shouting', emotion: 'excited', mood: 'excited' },
  back: { style: 'natural', emotion: 'heartfelt', mood: 'heartfelt' },
  'host-listen': { style: 'natural', emotion: 'playful', mood: 'playful' },
  'go-local': { style: 'natural', emotion: 'excited', mood: 'excited' },
  'bring-in': { style: 'natural', emotion: 'grateful', mood: 'grateful' },
  archive: { style: 'whisper', emotion: 'heartfelt', mood: 'heartfelt' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const PRICING_TIER_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PRIVATE_CIRCLE: 'Private Circle',
  PATRON_GROWTH: 'Patron Growth',
  SOVEREIGN: 'Sovereign',
}

export function formatTierLabel(tier: string): string {
  return PRICING_TIER_LABELS[tier] || tier
}

export function formatVoiceDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function getVoiceDurationGuidance(ms: number) {
  const seconds = Math.floor(ms / 1000)
  if (seconds <= 0) return { label: 'No duration yet', tone: 'text-gray-500' }
  if (seconds < 45) return { label: 'Too short: aim for 90-180s', tone: 'text-status-error' }
  if (seconds < 90) return { label: 'Usable, longer is better', tone: 'text-gray-400' }
  if (seconds <= 180) return { label: 'Ideal range', tone: 'text-green-400' }
  if (seconds <= 300) return { label: 'Great depth', tone: 'text-green-400' }
  return { label: 'Long sample, trim pauses if possible', tone: 'text-gray-400' }
}

export function getTieredActionCtaPresets(pricingTier: string) {
  if (pricingTier === 'STARTER') {
    return actionCtaPresets.filter((p) => ['share', 'bring-in'].includes(p.id))
  }
  if (pricingTier === 'PRIVATE_CIRCLE') {
    return actionCtaPresets.filter((p) =>
      ['share', 'back', 'bring-in'].includes(p.id)
    )
  }
  if (pricingTier === 'PATRON_GROWTH') {
    return actionCtaPresets.filter((p) =>
      ['share', 'back', 'host-listen', 'go-local', 'bring-in'].includes(p.id)
    )
  }
  return [...actionCtaPresets]
}

export function getRecommendedActionCtaPresets(
  pricingTier: string,
  tiered: readonly (typeof actionCtaPresets)[number][]
) {
  const orderByTier: Record<string, string[]> = {
    STARTER: ['share', 'bring-in'],
    PRIVATE_CIRCLE: ['share', 'back', 'bring-in'],
    PATRON_GROWTH: ['share', 'back', 'go-local'],
    SOVEREIGN: ['go-local', 'back', 'archive'],
  }
  const order = orderByTier[pricingTier] || orderByTier.PRIVATE_CIRCLE
  return order
    .map((id) => tiered.find((p) => p.id === id))
    .filter((p): p is (typeof actionCtaPresets)[number] => Boolean(p))
}
