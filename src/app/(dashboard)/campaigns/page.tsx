'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Disclosure } from '@/components/ui/disclosure'
import {
  ComposeForm,
  VoiceSetup,
  CampaignTemplates,
  CampaignVariables,
  CampaignResult,
  CampaignHistory,
  CampaignAnalytics,
  type ComposeFormRef,
  type CampaignResponse,
  type VoiceCloneResponse,
  type VoiceTake,
  type SavedVoiceModel,
  type CampaignHistoryItem,
  type VariablePreset,
  type CampaignEntitlements,
  type CampaignAnalytics as CampaignAnalyticsType,
  type CampaignAudienceSummary,
  type VoiceProvider,
  defaultVoiceProviders,
  suggestedVariableFields,
  messageTemplateSuggestions,
  actionCtaPresets,
  voiceDefaults,
  getTieredActionCtaPresets,
  getRecommendedActionCtaPresets,
} from '@/components/campaigns'

export default function CampaignsPage() {
  // ── Core compose state ───────────────────────────────────────────────────
  const [subject, setSubject] = useState('VIP Fan Drop')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [minTier, setMinTier] = useState('SUPERFAN')
  const [mood, setMood] = useState('excited')
  const [deliveryMode, setDeliveryMode] = useState<'TEXT' | 'VOICE'>('TEXT')
  const [textChannel, setTextChannel] = useState<'EMAIL' | 'SMS'>('EMAIL')
  const [dryRun, setDryRun] = useState(true)

  // ── Targeting ────────────────────────────────────────────────────────────
  const [fromEmail, setFromEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [minStanScore, setMinStanScore] = useState('70')
  const [limit, setLimit] = useState('100')

  // ── Variables ────────────────────────────────────────────────────────────
  const [variableMode, setVariableMode] = useState<'simple' | 'advanced'>('simple')
  const [fanClubName, setFanClubName] = useState('Cherubs')
  const [suggestedVariables, setSuggestedVariables] = useState<Record<string, string>>({
    oryx_phase: 'Propagation',
    propagation_goal: '12',
    campaign_theme: '',
    call_to_action: '',
    reward_name: '',
  })
  const [customVariables, setCustomVariables] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ])

  // ── Presets ──────────────────────────────────────────────────────────────
  const [presets, setPresets] = useState<VariablePreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [presetName, setPresetName] = useState('')
  const [presetActionLoading, setPresetActionLoading] = useState(false)
  const [presetError, setPresetError] = useState<string | null>(null)
  const [presetMessage, setPresetMessage] = useState<string | null>(null)

  // ── Voice ────────────────────────────────────────────────────────────────
  const [voiceSetupMode, setVoiceSetupMode] = useState<'simple' | 'advanced'>('simple')
  const [voiceModelId, setVoiceModelId] = useState('')
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>('fish-audio')
  const [voiceStyle, setVoiceStyle] = useState<'natural' | 'whisper' | 'singing' | 'shouting'>('natural')
  const [voiceEmotion, setVoiceEmotion] = useState<'neutral' | 'grateful' | 'excited' | 'playful' | 'heartfelt'>('grateful')
  const [voiceCtaLabel, setVoiceCtaLabel] = useState('Your personal voice note')
  const [voiceName, setVoiceName] = useState('Main Artist Voice')
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [voiceDurationMs, setVoiceDurationMs] = useState(0)
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [voiceTakes, setVoiceTakes] = useState<VoiceTake[]>([])
  const [selectedVoiceTakeId, setSelectedVoiceTakeId] = useState<string | null>(null)
  const [voiceCloneLoading, setVoiceCloneLoading] = useState(false)
  const [voiceCloneError, setVoiceCloneError] = useState<string | null>(null)
  const [voiceCloneMessage, setVoiceCloneMessage] = useState<string | null>(null)
  const [savedVoices, setSavedVoices] = useState<SavedVoiceModel[]>([])

  // ── Action CTAs ──────────────────────────────────────────────────────────
  const [ctaDeadline, setCtaDeadline] = useState('')
  const [ctaProofInstruction, setCtaProofInstruction] = useState('')

  // ── Send / result ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CampaignResponse | null>(null)

  // ── History / analytics / entitlements ────────────────────────────────────
  const [history, setHistory] = useState<CampaignHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [entitlements, setEntitlements] = useState<CampaignEntitlements | null>(null)
  const [analytics, setAnalytics] = useState<CampaignAnalyticsType | null>(null)
  const [audienceSummary, setAudienceSummary] = useState<CampaignAudienceSummary | null>(null)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const composeFormRef = useRef<ComposeFormRef | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingStartRef = useRef<number | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Derived ───────────────────────────────────────────────────────────────
  const allowedVoiceProviders = useMemo(
    () => entitlements?.allowedVoiceProviders || defaultVoiceProviders,
    [entitlements?.allowedVoiceProviders]
  )

  const effectiveVoiceProvider = useMemo(() => {
    if (allowedVoiceProviders.includes(voiceProvider)) return voiceProvider
    return allowedVoiceProviders[0] || 'fish-audio'
  }, [allowedVoiceProviders, voiceProvider])

  const tieredActionCtaPresets = useMemo(
    () => getTieredActionCtaPresets(entitlements?.pricingTier || 'STARTER'),
    [entitlements?.pricingTier]
  )

  const recommendedActionCtaPresets = useMemo(
    () => getRecommendedActionCtaPresets(entitlements?.pricingTier || 'STARTER', tieredActionCtaPresets),
    [entitlements?.pricingTier, tieredActionCtaPresets]
  )

  const additionalActionCtaPresets = useMemo(
    () =>
      tieredActionCtaPresets.filter(
        (p) => !recommendedActionCtaPresets.some((r) => r.id === p.id)
      ),
    [tieredActionCtaPresets, recommendedActionCtaPresets]
  )

  // ── Variable helpers ──────────────────────────────────────────────────────
  function getActiveCustomVariablesMap() {
    if (variableMode === 'simple') {
      return Object.entries(suggestedVariables).reduce((acc, [key, value]) => {
        const trimmed = value.trim()
        if (trimmed.length > 0) acc[key] = trimmed
        return acc
      }, {} as Record<string, string>)
    }
    return customVariables
      .filter((item) => item.key.trim().length > 0)
      .reduce((acc, item) => {
        acc[item.key.trim()] = item.value
        return acc
      }, {} as Record<string, string>)
  }

  function setCallToActionValue(value: string) {
    if (variableMode === 'simple') {
      setSuggestedVariables((prev) => ({ ...prev, call_to_action: value }))
      return
    }
    setCustomVariables((prev) => {
      const existingIndex = prev.findIndex((item) => item.key.trim() === 'call_to_action')
      if (existingIndex >= 0) {
        return prev.map((item, idx) => (idx === existingIndex ? { ...item, value } : item))
      }
      return [...prev, { key: 'call_to_action', value }]
    })
  }

  function getCurrentCallToActionValue() {
    if (variableMode === 'simple') return suggestedVariables.call_to_action || ''
    return customVariables.find((item) => item.key.trim() === 'call_to_action')?.value || ''
  }

  function getSelectedActionCtaPresetId() {
    const current = getCurrentCallToActionValue().trim()
    return tieredActionCtaPresets.find((p) => p.cta === current)?.id || ''
  }

  // ── Template / CTA handlers ───────────────────────────────────────────────
  function applyMessageTemplateSuggestion(templateId: string) {
    const suggestion = messageTemplateSuggestions.find((t) => t.id === templateId)
    if (!suggestion) return
    setSubject(suggestion.subject)
    setMessageTemplate(suggestion.body)
  }

  function applyActionCtaPreset(presetId: string) {
    const preset = actionCtaPresets.find((p) => p.id === presetId)
    if (!preset) return
    setCallToActionValue(preset.cta)
    if (preset.oryxPhase) {
      setSuggestedVariables((prev) => ({ ...prev, oryx_phase: preset.oryxPhase as string }))
    }
    const pair = voiceDefaults[preset.id]
    if (pair) {
      setVoiceStyle(pair.style)
      setVoiceEmotion(pair.emotion)
      setMood(pair.mood)
    }
    if (!messageTemplate.includes('{call_to_action}')) {
      setMessageTemplate((prev) =>
        `${prev.trim()}${prev.trim().endsWith('.') ? '' : '.'} Mission: {call_to_action}`
      )
    }
  }

  // ── Preset handlers ───────────────────────────────────────────────────────
  function applyPreset(preset: VariablePreset) {
    setFanClubName(preset.fanClubName || '')
    setPresetName(preset.name)
    const variables = preset.customVariables || {}
    const suggestedKeys = new Set(suggestedVariableFields.map((f) => f.key))
    const nextSuggested = {
      oryx_phase: '',
      propagation_goal: '',
      campaign_theme: '',
      call_to_action: '',
      reward_name: '',
    }
    const advancedRows: Array<{ key: string; value: string }> = []
    for (const [key, value] of Object.entries(variables)) {
      if (suggestedKeys.has(key)) {
        nextSuggested[key as keyof typeof nextSuggested] = String(value)
      } else {
        advancedRows.push({ key, value: String(value) })
      }
    }
    setSuggestedVariables(nextSuggested)
    setCustomVariables(advancedRows.length > 0 ? advancedRows : [{ key: '', value: '' }])
    setVariableMode(advancedRows.length > 0 ? 'advanced' : 'simple')
    setPresetMessage(`Loaded preset "${preset.name}"`)
  }

  function handlePresetSelect(presetId: string) {
    setSelectedPresetId(presetId)
    const selected = presets.find((p) => p.id === presetId)
    if (selected) applyPreset(selected)
  }

  async function savePreset() {
    const trimmedName = presetName.trim()
    if (!trimmedName) { setPresetError('Preset name is required'); return }
    setPresetActionLoading(true)
    setPresetError(null)
    setPresetMessage(null)
    try {
      const response = await fetch('/api/campaigns/stanvault/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          fanClubName: fanClubName || undefined,
          customVariables: getActiveCustomVariablesMap(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to save preset')
      setPresetMessage(`Saved preset "${trimmedName}"`)
      setPresetName('')
      await fetchPresets()
      if (data?.preset?.id) setSelectedPresetId(data.preset.id)
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to save preset')
    } finally {
      setPresetActionLoading(false)
    }
  }

  async function deletePreset() {
    if (!selectedPresetId) { setPresetError('Select a preset to delete'); return }
    setPresetActionLoading(true)
    setPresetError(null)
    setPresetMessage(null)
    try {
      const response = await fetch(`/api/campaigns/stanvault/presets/${selectedPresetId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to delete preset')
      setPresetMessage('Preset deleted')
      setSelectedPresetId('')
      await fetchPresets()
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to delete preset')
    } finally {
      setPresetActionLoading(false)
    }
  }

  // ── Voice recording ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!allowedVoiceProviders.includes(voiceProvider)) {
      setVoiceProvider(allowedVoiceProviders[0] || 'fish-audio')
    }
  }, [allowedVoiceProviders, voiceProvider])

  useEffect(() => {
    if (entitlements && !entitlements.allowVoiceCampaigns && deliveryMode === 'VOICE') {
      setDeliveryMode('TEXT')
    }
  }, [entitlements, deliveryMode])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function addVoiceTake(blob: Blob, durationMs: number, source: 'recorded' | 'uploaded') {
    const take: VoiceTake = {
      id: `take_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      blob,
      durationMs,
      source,
    }
    setVoiceTakes((prev) => [take, ...prev].slice(0, 6))
    setSelectedVoiceTakeId(take.id)
    setVoiceBlob(blob)
    setVoiceDurationMs(durationMs)
  }

  function selectVoiceTake(take: VoiceTake) {
    setSelectedVoiceTakeId(take.id)
    setVoiceBlob(take.blob)
    setVoiceDurationMs(take.durationMs)
  }

  function removeVoiceTake(takeId: string) {
    setVoiceTakes((prev) => {
      const next = prev.filter((t) => t.id !== takeId)
      if (selectedVoiceTakeId === takeId) {
        const fallback = next[0] || null
        setSelectedVoiceTakeId(fallback?.id || null)
        setVoiceBlob(fallback?.blob || null)
        setVoiceDurationMs(fallback?.durationMs || 0)
      }
      return next
    })
  }

  async function startVoiceRecording() {
    setVoiceCloneError(null)
    setVoiceCloneMessage(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      })
      mediaStreamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = recorder
      recordingChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' })
        const finalDuration = recordingStartRef.current
          ? Date.now() - recordingStartRef.current
          : recordingElapsedMs
        addVoiceTake(blob, finalDuration, 'recorded')
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
        recordingStartRef.current = null
      }

      recordingStartRef.current = Date.now()
      setVoiceDurationMs(0)
      setRecordingElapsedMs(0)
      setIsRecordingVoice(true)
      recorder.start(250)

      recordingTimerRef.current = setInterval(() => {
        if (!recordingStartRef.current) return
        setRecordingElapsedMs(Date.now() - recordingStartRef.current)
      }, 200)
    } catch (err) {
      setVoiceCloneError(
        err instanceof Error ? err.message : 'Could not access microphone. Check browser permissions.'
      )
    }
  }

  function stopVoiceRecording() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    setIsRecordingVoice(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  function onVoiceFilePicked(file: File | null) {
    if (!file) return
    setVoiceCloneError(null)
    setVoiceCloneMessage(null)
    addVoiceTake(file, 0, 'uploaded')
  }

  async function cloneVoiceFromSample() {
    if (!voiceBlob) { setVoiceCloneError('Record or upload a voice sample first.'); return }
    if (!voiceName.trim()) { setVoiceCloneError('Voice name is required.'); return }

    setVoiceCloneLoading(true)
    setVoiceCloneError(null)
    setVoiceCloneMessage(null)
    try {
      const form = new FormData()
      const file = new File([voiceBlob], 'voice-sample.webm', { type: voiceBlob.type || 'audio/webm' })
      form.append('audio', file)
      form.append('name', voiceName.trim())
      form.append('duration', String(Math.round(voiceDurationMs / 1000)))
      form.append('provider', effectiveVoiceProvider)

      const response = await fetch('/api/campaigns/stanvault/voice/clone', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || data?.details || 'Voice clone failed')

      const clone = data as VoiceCloneResponse
      if (clone.externalId) setVoiceModelId(clone.externalId)
      if (clone.provider && allowedVoiceProviders.includes(clone.provider)) {
        setVoiceProvider(clone.provider)
      }
      await fetchSavedVoices()
      setVoiceCloneMessage(
        clone.externalId
          ? `Voice cloned: ${clone.name || 'New Voice'} (${clone.externalId})`
          : 'Voice cloned successfully.'
      )
    } catch (err) {
      setVoiceCloneError(err instanceof Error ? err.message : 'Voice clone failed')
    } finally {
      setVoiceCloneLoading(false)
    }
  }

  async function activateSavedVoice(modelId: string) {
    try {
      await fetch('/api/campaigns/stanvault/voice/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      })
      await fetchSavedVoices()
    } catch {
      // non-blocking
    }
  }

  // ── Fetchers ──────────────────────────────────────────────────────────────
  async function fetchHistory() {
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/campaigns/stanvault/send?limit=20', { cache: 'no-store' })
      const data = await response.json()
      if (response.ok) setHistory(data.runs || [])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function fetchPresets() {
    setPresetError(null)
    try {
      const response = await fetch('/api/campaigns/stanvault/presets', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to fetch presets')
      setPresets(data.presets || [])
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to fetch presets')
    }
  }

  async function fetchEntitlements() {
    try {
      const response = await fetch('/api/campaigns/stanvault/entitlements', { cache: 'no-store' })
      const data = await response.json()
      if (response.ok) setEntitlements(data)
    } catch {
      // Non-blocking
    }
  }

  const fetchSavedVoices = useCallback(async () => {
    try {
      const response = await fetch('/api/campaigns/stanvault/voice/models', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) return
      const models = (data.models || []) as SavedVoiceModel[]
      setSavedVoices(models)
      const active = models.find((m) => m.isActive)
      if (active) {
        setVoiceModelId(active.externalId)
        if (allowedVoiceProviders.includes(active.provider)) setVoiceProvider(active.provider)
      }
    } catch {
      // Non-blocking
    }
  }, [allowedVoiceProviders])

  async function fetchAnalytics() {
    try {
      const response = await fetch('/api/campaigns/stanvault/analytics', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) return
      setAnalytics({ ctaByKey: data.ctaByKey || [], completionByStatus: data.completionByStatus || [] })
    } catch {
      // non-blocking
    }
  }

  const fetchAudience = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        minTier,
        minStanScore: Number.isNaN(parseInt(minStanScore, 10)) ? '70' : String(parseInt(minStanScore, 10)),
        limit: Number.isNaN(parseInt(limit, 10)) ? '100' : String(parseInt(limit, 10)),
      })
      const response = await fetch(`/api/campaigns/stanvault/audience?${params}`, {
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok) return
      setAudienceSummary(data)
    } catch {
      // Non-blocking
    }
  }, [limit, minStanScore, minTier])

  useEffect(() => {
    void fetchHistory()
    void fetchPresets()
    void fetchEntitlements()
    void fetchSavedVoices()
    void fetchAnalytics()
  }, [fetchSavedVoices])

  useEffect(() => {
    void fetchAudience()
  }, [fetchAudience, minTier, minStanScore, limit])

  // ── CTA completion ────────────────────────────────────────────────────────
  async function handleLogCompletion(proofUrl: string, proofNote: string): Promise<string | null> {
    const ctaKey = getSelectedActionCtaPresetId()
    const ctaLabel = actionCtaPresets.find((p) => p.id === ctaKey)?.label
    if (!ctaKey || !ctaLabel) return 'Choose a CTA preset before logging completion.'
    if (!proofUrl.trim() && !proofNote.trim()) return 'Add proof URL or note before logging.'

    try {
      const response = await fetch('/api/campaigns/stanvault/cta/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ctaKey,
          ctaLabel,
          proofUrl: proofUrl || undefined,
          proofNote: proofNote || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to log completion')
      await fetchAnalytics()
      return 'CTA completion logged.'
    } catch (err) {
      return err instanceof Error ? err.message : 'Failed to log completion'
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submitCampaign() {
    setLoading(true)
    setError(null)
    try {
      if (deliveryMode === 'VOICE' && entitlements && !entitlements.allowVoiceCampaigns) {
        throw new Error(`Voice campaigns are not available on ${entitlements.pricingTier}.`)
      }
      if (deliveryMode === 'VOICE' && !voiceModelId.trim()) {
        throw new Error('Please set your Emissar voice before sending a voice campaign.')
      }
      const selectedCta = getSelectedActionCtaPresetId()
      if (selectedCta && (!ctaDeadline.trim() || !ctaProofInstruction.trim())) {
        throw new Error('For action CTAs, set both a deadline and proof instruction before sending.')
      }
      const customVariableCount = Object.keys(getActiveCustomVariablesMap()).length
      if (entitlements && customVariableCount > entitlements.maxCustomVariables) {
        throw new Error(
          `Your ${entitlements.pricingTier} tier allows up to ${entitlements.maxCustomVariables} custom variables.`
        )
      }

      const response = await fetch('/api/campaigns/stanvault/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          fromEmail: fromEmail || undefined,
          replyTo: replyTo || undefined,
          fanClubName,
          customVariables: getActiveCustomVariablesMap(),
          messageTemplate,
          minTier,
          minStanScore: Number.isNaN(parseInt(minStanScore, 10)) ? 70 : parseInt(minStanScore, 10),
          limit: Number.isNaN(parseInt(limit, 10)) ? 100 : parseInt(limit, 10),
          mood,
          deliveryMode,
          textChannel,
          voiceConfigMode: deliveryMode === 'VOICE' ? (voiceSetupMode === 'advanced' ? 'ADVANCED' : 'SIMPLE') : undefined,
          voiceModelId: deliveryMode === 'VOICE' ? voiceModelId || undefined : undefined,
          voiceProvider: deliveryMode === 'VOICE' ? effectiveVoiceProvider : undefined,
          voiceStyle: deliveryMode === 'VOICE' ? voiceStyle : undefined,
          voiceEmotion: deliveryMode === 'VOICE' ? voiceEmotion : undefined,
          voiceCtaLabel: deliveryMode === 'VOICE' ? voiceCtaLabel || undefined : undefined,
          ctaKey: getSelectedActionCtaPresetId() || undefined,
          ctaLabel: actionCtaPresets.find((p) => p.id === getSelectedActionCtaPresetId())?.label || undefined,
          ctaDeadline: ctaDeadline || undefined,
          ctaProofInstruction: ctaProofInstruction || undefined,
          textChannel: deliveryMode === 'TEXT' ? textChannel : undefined,
          dryRun,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to run campaign')
      setResult(data)
      void fetchHistory()
      void fetchEntitlements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  async function sendTestVoiceToMe() {
    setTestSending(true)
    setError(null)
    try {
      if (!voiceModelId.trim()) throw new Error('Please set your Emissar voice before sending a test.')
      const selectedCta = getSelectedActionCtaPresetId()
      if (selectedCta && (!ctaDeadline.trim() || !ctaProofInstruction.trim())) {
        throw new Error('Set CTA deadline and proof instruction before running a voice test.')
      }

      const response = await fetch('/api/campaigns/stanvault/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject || 'Voice Test',
          fromEmail: fromEmail || undefined,
          replyTo: replyTo || undefined,
          fanClubName,
          customVariables: getActiveCustomVariablesMap(),
          messageTemplate,
          minTier,
          minStanScore: Number.isNaN(parseInt(minStanScore, 10)) ? 70 : parseInt(minStanScore, 10),
          limit: 1,
          mood,
          deliveryMode: 'VOICE',
          voiceConfigMode: voiceSetupMode === 'advanced' ? 'ADVANCED' : 'SIMPLE',
          voiceModelId,
          voiceProvider: effectiveVoiceProvider,
          voiceStyle,
          voiceEmotion,
          voiceCtaLabel: voiceCtaLabel || undefined,
          ctaKey: getSelectedActionCtaPresetId() || undefined,
          ctaLabel: actionCtaPresets.find((p) => p.id === getSelectedActionCtaPresetId())?.label || undefined,
          ctaDeadline: ctaDeadline || undefined,
          ctaProofInstruction: ctaProofInstruction || undefined,
          dryRun: false,
          testOnly: true,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to send test voice email')
      setResult(data)
      void fetchHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setTestSending(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader title="Campaigns" />

      {/* ── Compose Card ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>
        <CardContent>
          <ComposeForm
            ref={composeFormRef}
            subject={subject}
            onSubjectChange={setSubject}
            minTier={minTier}
            onMinTierChange={setMinTier}
            messageTemplate={messageTemplate}
            onMessageTemplateChange={setMessageTemplate}
            mood={mood}
            onMoodChange={setMood}
            deliveryMode={deliveryMode}
            onDeliveryModeChange={setDeliveryMode}
            textChannel={textChannel}
            onTextChannelChange={setTextChannel}
            entitlements={entitlements}
            audienceSummary={audienceSummary}
            fromEmail={fromEmail}
            onFromEmailChange={setFromEmail}
            replyTo={replyTo}
            onReplyToChange={setReplyTo}
            minStanScore={minStanScore}
            onMinStanScoreChange={setMinStanScore}
            limit={limit}
            onLimitChange={setLimit}
            dryRun={dryRun}
            onDryRunChange={setDryRun}
            loading={loading}
            testSending={testSending}
            error={error}
            onSubmit={submitCampaign}
            onTestVoice={sendTestVoiceToMe}
            voiceSlot={
              <VoiceSetup
                voiceSetupMode={voiceSetupMode}
                onVoiceSetupModeChange={setVoiceSetupMode}
                allowAdvancedVoiceConfig={entitlements?.allowAdvancedVoiceConfig ?? true}
                onError={setError}
                voiceName={voiceName}
                onVoiceNameChange={setVoiceName}
                voiceModelId={voiceModelId}
                onVoiceModelIdChange={setVoiceModelId}
                effectiveVoiceProvider={effectiveVoiceProvider}
                onVoiceProviderChange={setVoiceProvider}
                allowedVoiceProviders={allowedVoiceProviders}
                savedVoices={savedVoices}
                onActivateSavedVoice={activateSavedVoice}
                isRecording={isRecordingVoice}
                recordingElapsedMs={recordingElapsedMs}
                voiceDurationMs={voiceDurationMs}
                onStartRecording={startVoiceRecording}
                onStopRecording={stopVoiceRecording}
                onFilePicked={onVoiceFilePicked}
                voiceTakes={voiceTakes}
                selectedVoiceTakeId={selectedVoiceTakeId}
                onSelectTake={selectVoiceTake}
                onRemoveTake={removeVoiceTake}
                voiceCloneLoading={voiceCloneLoading}
                voiceCloneError={voiceCloneError}
                voiceCloneMessage={voiceCloneMessage}
                onCloneVoice={cloneVoiceFromSample}
                voiceStyle={voiceStyle}
                onVoiceStyleChange={setVoiceStyle}
                voiceEmotion={voiceEmotion}
                onVoiceEmotionChange={setVoiceEmotion}
                voiceCtaLabel={voiceCtaLabel}
                onVoiceCtaLabelChange={setVoiceCtaLabel}
              />
            }
            templatesSlot={
              <CampaignTemplates
                onApplyTemplate={applyMessageTemplateSuggestion}
                onApplyActionCta={applyActionCtaPreset}
                selectedCtaId={getSelectedActionCtaPresetId()}
                recommendedPresets={recommendedActionCtaPresets}
                additionalPresets={additionalActionCtaPresets}
                ctaDeadline={ctaDeadline}
                onCtaDeadlineChange={setCtaDeadline}
                ctaProofInstruction={ctaProofInstruction}
                onCtaProofInstructionChange={setCtaProofInstruction}
              />
            }
            variablesSlot={
              <CampaignVariables
                fanClubName={fanClubName}
                onFanClubNameChange={setFanClubName}
                variableMode={variableMode}
                onVariableModeChange={setVariableMode}
                suggestedVariables={suggestedVariables}
                onSuggestedVariableChange={(key, value) =>
                  setSuggestedVariables((prev) => ({ ...prev, [key]: value }))
                }
                customVariables={customVariables}
                onCustomVariableUpdate={(index, field, value) =>
                  setCustomVariables((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
                  )
                }
                onCustomVariableAdd={() =>
                  setCustomVariables((prev) => [...prev, { key: '', value: '' }])
                }
                onCustomVariableRemove={(index) =>
                  setCustomVariables((prev) => prev.filter((_, i) => i !== index))
                }
                presets={presets}
                selectedPresetId={selectedPresetId}
                onPresetSelect={handlePresetSelect}
                presetName={presetName}
                onPresetNameChange={setPresetName}
                onPresetSave={savePreset}
                onPresetDelete={deletePreset}
                presetActionLoading={presetActionLoading}
                presetError={presetError}
                presetMessage={presetMessage}
              />
            }
          />
        </CardContent>
      </Card>

      {/* ── Result Card (conditional) ─────────────────────────────────── */}
      {result && <CampaignResult result={result} />}

      {/* ── Analytics (collapsed) ─────────────────────────────────────── */}
      <Card>
        <CardContent>
          <Disclosure label="Analytics" className="border-t-0">
            <CampaignAnalytics
              analytics={analytics}
              onRefresh={() => { void fetchAnalytics(); void fetchSavedVoices() }}
              onLogCompletion={handleLogCompletion}
            />
          </Disclosure>
        </CardContent>
      </Card>

      {/* ── History (collapsed) ───────────────────────────────────────── */}
      <Card>
        <CardContent>
          <Disclosure label="History" badge={history.length || undefined} className="border-t-0">
            <CampaignHistory history={history} loading={historyLoading} />
          </Disclosure>
        </CardContent>
      </Card>
    </div>
  )
}
