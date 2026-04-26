'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import {
  moodPresets,
  tokenGroups,
  messageTemplateSuggestions,
  formatTierLabel,
  type CampaignAudienceSummary,
  type CampaignEntitlements,
} from './campaign-constants'

export interface ComposeFormRef {
  getMessageTemplateRef: () => HTMLTextAreaElement | null
}

interface ComposeFormProps {
  subject: string
  onSubjectChange: (v: string) => void
  minTier: string
  onMinTierChange: (v: string) => void
  messageTemplate: string
  onMessageTemplateChange: (v: string) => void
  mood: string
  onMoodChange: (v: string) => void
  deliveryMode: 'TEXT' | 'VOICE'
  onDeliveryModeChange: (v: 'TEXT' | 'VOICE') => void
  textChannel: 'EMAIL' | 'SMS'
  onTextChannelChange: (v: 'EMAIL' | 'SMS') => void
  entitlements: CampaignEntitlements | null
  audienceSummary: CampaignAudienceSummary | null

  // Targeting
  fromEmail: string
  onFromEmailChange: (v: string) => void
  replyTo: string
  onReplyToChange: (v: string) => void
  minStanScore: string
  onMinStanScoreChange: (v: string) => void
  limit: string
  onLimitChange: (v: string) => void

  // Send
  dryRun: boolean
  onDryRunChange: (v: boolean) => void
  loading: boolean
  testSending: boolean
  error: string | null
  onSubmit: () => void
  onTestVoice: () => void

  // Slots for collapsed sections
  voiceSlot: React.ReactNode
  templatesSlot: React.ReactNode
  variablesSlot: React.ReactNode
}

export const ComposeForm = forwardRef<ComposeFormRef, ComposeFormProps>(function ComposeForm(
  {
    subject,
    onSubjectChange,
    minTier,
    onMinTierChange,
    messageTemplate,
    onMessageTemplateChange,
    mood,
    onMoodChange,
    deliveryMode,
    onDeliveryModeChange,
    textChannel,
    onTextChannelChange,
    entitlements,
    audienceSummary,
    fromEmail,
    onFromEmailChange,
    replyTo,
    onReplyToChange,
    minStanScore,
    onMinStanScoreChange,
    limit,
    onLimitChange,
    dryRun,
    onDryRunChange,
    loading,
    testSending,
    error,
    onSubmit,
    onTestVoice,
    voiceSlot,
    templatesSlot,
    variablesSlot,
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [showTokens, setShowTokens] = useState(false)

  useImperativeHandle(ref, () => ({
    getMessageTemplateRef: () => textareaRef.current,
  }))

  function insertToken(token: string) {
    const textarea = textareaRef.current
    if (!textarea) {
      onMessageTemplateChange(
        `${messageTemplate}${messageTemplate.endsWith(' ') ? '' : ' '}${token}`
      )
      return
    }
    const start = textarea.selectionStart ?? messageTemplate.length
    const end = textarea.selectionEnd ?? messageTemplate.length
    const before = messageTemplate.slice(0, start)
    const after = messageTemplate.slice(end)
    onMessageTemplateChange(`${before}${token}${after}`)
    requestAnimationFrame(() => {
      textarea.focus()
      const caret = start + token.length
      textarea.setSelectionRange(caret, caret)
    })
  }

  return (
    <div className="space-y-5">
      {/* Subject + Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          variant="boxed"
          placeholder="VIP Fan Drop"
        />
        <Select
          label="Minimum Tier"
          value={minTier}
          onChange={(e) => onMinTierChange(e.target.value)}
          options={[
            { value: 'CASUAL', label: 'Faint+' },
            { value: 'ENGAGED', label: 'Steady+' },
            { value: 'DEDICATED', label: 'Strong+' },
            { value: 'SUPERFAN', label: 'Core only' },
          ]}
          variant="boxed"
        />
      </div>

      {/* Message textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-caption text-gray-500">Message</label>
          <button
            type="button"
            onClick={() => setShowTokens((p) => !p)}
            className="text-caption text-gray-600 hover:text-gray-300 transition-colors"
          >
            {showTokens ? 'Hide tokens' : 'Insert token'}
          </button>
        </div>
        <textarea
          ref={textareaRef}
          className="w-full bg-[#0d0d0d] border border-[#1a1a1a] px-4 py-3 text-white font-light text-body-sm focus:outline-none focus:border-[#2a2a2a] transition-colors min-h-[120px] resize-y placeholder:text-gray-700"
          value={messageTemplate}
          onChange={(e) => onMessageTemplateChange(e.target.value)}
          placeholder="Write your message to fans..."
        />
        {!messageTemplate.trim() && (
          <div className="flex items-center gap-2">
            <span className="text-caption text-gray-600">Start from</span>
            {messageTemplateSuggestions.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSubjectChange(t.subject)
                  onMessageTemplateChange(t.body)
                }}
                className="px-2.5 py-1 text-caption text-gray-400 border border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a] transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        {showTokens && (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {tokenGroups.map((group) => (
              <div key={group.label} className="flex items-center gap-1">
                <span className="text-caption text-gray-600 mr-0.5">{group.label}</span>
                {group.tokens.map((t) => (
                  <button
                    type="button"
                    key={t.token}
                    onClick={() => insertToken(t.token)}
                    className="px-1.5 py-0.5 text-caption text-gray-500 hover:text-white hover:bg-[#141414] transition-colors"
                  >
                    {t.display}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mood pills + Delivery toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-caption text-gray-500">Mood</label>
          <div className="flex flex-wrap gap-1.5">
            {moodPresets.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMoodChange(m)}
                className={`px-3 py-1.5 text-caption border transition-colors ${
                  mood === m
                    ? 'text-white border-[#333] bg-[#141414]'
                    : 'text-gray-500 border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-caption text-gray-500">Delivery</label>
          <div className="inline-flex border border-[#1a1a1a]">
            <button
              type="button"
              onClick={() => onDeliveryModeChange('TEXT')}
              className={`px-4 py-2 text-caption transition-colors ${
                deliveryMode === 'TEXT'
                  ? 'text-white bg-[#141414]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => {
                if (entitlements && !entitlements.allowVoiceCampaigns) return
                onDeliveryModeChange('VOICE')
              }}
              className={`px-4 py-2 text-caption border-l border-[#1a1a1a] transition-colors ${
                deliveryMode === 'VOICE'
                  ? 'text-white bg-[#141414]'
                  : entitlements && !entitlements.allowVoiceCampaigns
                    ? 'text-gray-700 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Voice
            </button>
          </div>
          {entitlements && !entitlements.allowVoiceCampaigns && (
            <p className="text-caption text-gray-700">Requires tier upgrade</p>
          )}
          {deliveryMode === 'TEXT' && (
            <div className="space-y-2">
              <div className="inline-flex border border-[#1a1a1a]">
                <button
                  type="button"
                  onClick={() => onTextChannelChange('EMAIL')}
                  className={`px-3 py-1.5 text-caption transition-colors ${
                    textChannel === 'EMAIL'
                      ? 'text-white bg-[#141414]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => onTextChannelChange('SMS')}
                  className={`px-3 py-1.5 text-caption border-l border-[#1a1a1a] transition-colors ${
                    textChannel === 'SMS'
                      ? 'text-white bg-[#141414]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  SMS
                </button>
              </div>
              <p className="text-caption text-gray-600">
                {textChannel === 'SMS'
                  ? 'SMS sends from Imprint via Twilio and only targets opted-in phone numbers.'
                  : 'Email uses the existing Emissar campaign flow.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible sections */}
      {deliveryMode === 'VOICE' && (
        <Disclosure label="Voice" defaultOpen>
          {voiceSlot}
        </Disclosure>
      )}

      <Disclosure label="Quick Start">{templatesSlot}</Disclosure>

      <Disclosure label="Personalize">{variablesSlot}</Disclosure>

      <Disclosure label="Audience">
        {audienceSummary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
              <p className="text-caption text-gray-600">Matched</p>
              <p className="text-lg text-white">{audienceSummary.matchingFans}</p>
            </div>
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
              <p className="text-caption text-gray-600">Selected</p>
              <p className="text-lg text-white">{audienceSummary.selectedFans}</p>
            </div>
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
              <p className="text-caption text-gray-600">Email Ready</p>
              <p className="text-lg text-white">{audienceSummary.emailEligibleFans}</p>
            </div>
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
              <p className="text-caption text-gray-600">SMS Ready</p>
              <p className="text-lg text-white">{audienceSummary.smsEligibleFans}</p>
            </div>
          </div>
        )}

        {audienceSummary && textChannel === 'SMS' && (
          <div className="mb-4 text-caption text-gray-600 space-y-1">
            <p>
              {audienceSummary.smsKnownFans} fans have phone numbers.{' '}
              {audienceSummary.smsPendingFans} are still pending consent.
            </p>
            {!audienceSummary.smsConfigured && (
              <p className="text-status-error">
                Twilio is not configured yet, so SMS live sends will be blocked.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input
            label="From Email"
            value={fromEmail}
            onChange={(e) => onFromEmailChange(e.target.value)}
            variant="boxed"
            placeholder="Artist <campaigns@yourdomain.com>"
            disabled={textChannel === 'SMS' || (entitlements ? !entitlements.allowCustomFromEmail : false)}
            hint={
              textChannel === 'SMS'
                ? 'Not used for SMS campaigns.'
                : entitlements && !entitlements.allowCustomFromEmail
                  ? 'Upgrade to Patron Growth or Sovereign.'
                  : undefined
            }
          />
          <Input
            label="Reply-To"
            value={replyTo}
            onChange={(e) => onReplyToChange(e.target.value)}
            variant="boxed"
            placeholder="team@yourdomain.com"
            disabled={textChannel === 'SMS'}
            hint={textChannel === 'SMS' ? 'Not used for SMS campaigns.' : undefined}
          />
          <Input
            label="Min Pulse Score"
            type="number"
            value={minStanScore}
            onChange={(e) => onMinStanScoreChange(e.target.value)}
            variant="boxed"
            min={0}
            max={100}
          />
          <Input
            label="Recipient Limit"
            type="number"
            value={limit}
            onChange={(e) => onLimitChange(e.target.value)}
            variant="boxed"
            min={1}
            max={1000}
          />
        </div>
      </Disclosure>

      {/* Send row */}
      <div className="flex items-center gap-4 pt-3 border-t border-[#1a1a1a]">
        {/* Toggle switch for dry run */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={dryRun}
            onClick={() => onDryRunChange(!dryRun)}
            className={`relative w-8 h-[18px] transition-colors ${
              dryRun ? 'bg-gray-400' : 'bg-[#222]'
            }`}
          >
            <span
              className={`absolute top-[2px] left-[2px] h-[14px] w-[14px] bg-black transition-transform ${
                dryRun ? 'translate-x-[14px]' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-caption text-gray-400">Dry run</span>
        </label>

        <Button
          variant="outline"
          size="sm"
          onClick={onSubmit}
          disabled={
            loading ||
            !messageTemplate.trim() ||
            (!dryRun &&
              deliveryMode === 'TEXT' &&
              textChannel === 'SMS' &&
              audienceSummary !== null &&
              (!audienceSummary.smsConfigured || audienceSummary.smsEligibleFans === 0))
          }
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Running...
            </>
          ) : dryRun ? (
            'Preview'
          ) : (
            'Send'
          )}
        </Button>

        {deliveryMode === 'VOICE' && (
          <button
            type="button"
            onClick={onTestVoice}
            disabled={
              testSending ||
              loading ||
              !messageTemplate.trim() ||
              (entitlements ? !entitlements.allowVoiceCampaigns : false)
            }
            className="text-caption text-gray-500 hover:text-white transition-colors disabled:opacity-40"
          >
            {testSending ? 'Sending...' : 'Test Voice'}
          </button>
        )}

        {error && <p className="text-caption text-status-error ml-2">{error}</p>}
      </div>

      {/* Entitlements footer */}
      {entitlements && (
        <div className="flex items-center gap-4 text-caption text-gray-600 pt-2">
          <span>{formatTierLabel(entitlements.pricingTier)}</span>
          <span>
            {entitlements.monthSentSoFar.toLocaleString()} /{' '}
            {entitlements.monthlyLiveSendLimit === null
              ? '\u221E'
              : entitlements.monthlyLiveSendLimit.toLocaleString()}{' '}
            sent
          </span>
          {entitlements.allowVoiceCampaigns && (
            <span>
              Voice {entitlements.monthVoiceSentSoFar.toLocaleString()} /{' '}
              {entitlements.monthlyVoiceSendLimit === null
                ? '\u221E'
                : entitlements.monthlyVoiceSendLimit.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  )
})
