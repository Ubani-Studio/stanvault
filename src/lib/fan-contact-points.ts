import { ContactChannel, ContactConsentStatus, type PrismaClient } from '@prisma/client'

type FanContactPointClient = Pick<PrismaClient, 'fanContactPoint' | '$transaction'>

interface UpsertFanSmsContactInput {
  fanId: string
  phoneNumber: string
  consentStatus?: ContactConsentStatus
  consentSource?: string | null
  consentCapturedAt?: Date | null
  consentRevokedAt?: Date | null
  verifiedAt?: Date | null
  label?: string | null
}

type FanSmsContactLike = {
  channel: ContactChannel
  value: string
  normalizedValue: string
  isPrimary: boolean
  consentStatus: ContactConsentStatus
  consentCapturedAt: Date | null
  consentRevokedAt: Date | null
  verifiedAt: Date | null
}

export function normalizePhoneNumber(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('+')) {
    const digits = `+${trimmed.slice(1).replace(/\D/g, '')}`
    return /^\+\d{8,15}$/.test(digits) ? digits : null
  }

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`

  return null
}

export function normalizeEmailAddress(input: string): string | null {
  const trimmed = input.trim().toLowerCase()
  return trimmed ? trimmed : null
}

export function hasSmsConsent(contactPoint: FanSmsContactLike | null | undefined): boolean {
  if (!contactPoint || contactPoint.channel !== ContactChannel.SMS) return false
  return (
    contactPoint.consentStatus === ContactConsentStatus.SUBSCRIBED &&
    contactPoint.consentRevokedAt === null
  )
}

export function getPrimarySmsContact<T extends FanSmsContactLike>(contactPoints: T[]): T | null {
  const smsContacts = contactPoints.filter((contactPoint) => contactPoint.channel === ContactChannel.SMS)
  if (smsContacts.length === 0) return null

  const primary = smsContacts.find((contactPoint) => contactPoint.isPrimary)
  if (primary) return primary

  const subscribed = smsContacts.find((contactPoint) => hasSmsConsent(contactPoint))
  return subscribed || smsContacts[0] || null
}

export async function upsertFanSmsContact(
  prisma: FanContactPointClient,
  input: UpsertFanSmsContactInput
) {
  const normalizedValue = normalizePhoneNumber(input.phoneNumber)
  if (!normalizedValue) {
    throw new Error('Invalid phone number. Use a real mobile number or E.164 format.')
  }

  const existing = await prisma.fanContactPoint.findFirst({
    where: {
      fanId: input.fanId,
      channel: ContactChannel.SMS,
      normalizedValue,
    },
  })

  const consentStatus = mergeConsentStatus(existing?.consentStatus, input.consentStatus)
  const now = new Date()
  const consentCapturedAt =
    consentStatus === ContactConsentStatus.SUBSCRIBED
      ? input.consentCapturedAt || existing?.consentCapturedAt || now
      : existing?.consentCapturedAt || null
  const consentRevokedAt =
    consentStatus === ContactConsentStatus.UNSUBSCRIBED
      ? input.consentRevokedAt || now
      : null

  return prisma.$transaction(async (tx) => {
    await tx.fanContactPoint.updateMany({
      where: {
        fanId: input.fanId,
        channel: ContactChannel.SMS,
      },
      data: {
        isPrimary: false,
      },
    })

    if (existing) {
      return tx.fanContactPoint.update({
        where: { id: existing.id },
        data: {
          value: input.phoneNumber.trim(),
          normalizedValue,
          label: input.label ?? existing.label,
          isPrimary: true,
          consentStatus,
          consentSource: input.consentSource ?? existing.consentSource,
          consentCapturedAt,
          consentRevokedAt,
          verifiedAt: input.verifiedAt ?? existing.verifiedAt,
        },
      })
    }

    return tx.fanContactPoint.create({
      data: {
        fanId: input.fanId,
        channel: ContactChannel.SMS,
        value: input.phoneNumber.trim(),
        normalizedValue,
        label: input.label ?? 'Mobile',
        isPrimary: true,
        consentStatus,
        consentSource: input.consentSource ?? null,
        consentCapturedAt,
        consentRevokedAt,
        verifiedAt: input.verifiedAt ?? null,
      },
    })
  })
}

function mergeConsentStatus(
  existing: ContactConsentStatus | undefined,
  incoming: ContactConsentStatus | undefined
): ContactConsentStatus {
  if (!incoming) return existing || ContactConsentStatus.UNKNOWN

  if (incoming === ContactConsentStatus.SUBSCRIBED) return incoming
  if (incoming === ContactConsentStatus.UNSUBSCRIBED) return incoming

  if (existing === ContactConsentStatus.SUBSCRIBED) return existing
  if (existing === ContactConsentStatus.UNSUBSCRIBED) return existing

  return incoming
}
