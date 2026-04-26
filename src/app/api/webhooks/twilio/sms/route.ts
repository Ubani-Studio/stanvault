import { NextRequest, NextResponse } from 'next/server'
import { ContactChannel, ContactConsentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { normalizePhoneNumber } from '@/lib/fan-contact-points'

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
const UNSUBSCRIBE_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'])
const RESUBSCRIBE_KEYWORDS = new Set(['START', 'UNSTOP', 'YES'])

function xmlResponse() {
  return new NextResponse(EMPTY_TWIML, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function readStringField(value: FormDataEntryValue | null | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const now = new Date()

    const from = normalizePhoneNumber(readStringField(form.get('From')) || '')
    const to = normalizePhoneNumber(readStringField(form.get('To')) || '')
    const rawBody = readStringField(form.get('Body'))
    const messageStatus =
      readStringField(form.get('MessageStatus')) || readStringField(form.get('SmsStatus'))

    if (to && messageStatus) {
      await prisma.fanContactPoint.updateMany({
        where: {
          channel: ContactChannel.SMS,
          normalizedValue: to,
        },
        data: {
          lastDeliveryAt: now,
          lastDeliveryStatus: messageStatus.toLowerCase(),
        },
      })
    }

    if (from && rawBody) {
      const keyword = rawBody.toUpperCase()

      if (UNSUBSCRIBE_KEYWORDS.has(keyword)) {
        await prisma.fanContactPoint.updateMany({
          where: {
            channel: ContactChannel.SMS,
            normalizedValue: from,
          },
          data: {
            consentStatus: ContactConsentStatus.UNSUBSCRIBED,
            consentSource: 'twilio_inbound_stop',
            consentRevokedAt: now,
            lastDeliveryStatus: 'opted_out',
          },
        })
      } else if (RESUBSCRIBE_KEYWORDS.has(keyword)) {
        await prisma.fanContactPoint.updateMany({
          where: {
            channel: ContactChannel.SMS,
            normalizedValue: from,
          },
          data: {
            consentStatus: ContactConsentStatus.SUBSCRIBED,
            consentSource: 'twilio_inbound_start',
            consentCapturedAt: now,
            consentRevokedAt: null,
            lastDeliveryStatus: 'resubscribed',
          },
        })
      }
    }

    return xmlResponse()
  } catch (error) {
    console.error('[Twilio SMS webhook] Error:', error)
    return xmlResponse()
  }
}
