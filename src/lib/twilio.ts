import { buildAppUrl } from '@/lib/app-url'

export interface SmsMessageInput {
  to: string
  body: string
}

export interface SmsDispatchResult {
  to: string
  status: 'sent' | 'failed'
  messageId?: string | null
  providerStatus?: string | null
  error?: string
}

function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    statusCallbackUrl:
      process.env.TWILIO_STATUS_CALLBACK_URL || buildAppUrl('/api/webhooks/twilio/sms'),
  }
}

export function isTwilioConfigured(): boolean {
  const config = getTwilioConfig()
  return Boolean(
    config.accountSid &&
      config.authToken &&
      (config.messagingServiceSid || config.fromNumber)
  )
}

export async function sendTwilioSms(message: SmsMessageInput): Promise<SmsDispatchResult> {
  const config = getTwilioConfig()
  if (!isTwilioConfigured()) {
    throw new Error(
      'Twilio SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER.'
    )
  }

  const body = new URLSearchParams({
    To: message.to,
    Body: message.body,
  })

  if (config.messagingServiceSid) body.set('MessagingServiceSid', config.messagingServiceSid)
  else if (config.fromNumber) body.set('From', config.fromNumber)

  if (config.statusCallbackUrl) body.set('StatusCallback', config.statusCallbackUrl)

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${config.accountSid}:${config.authToken}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: body.toString(),
      cache: 'no-store',
    }
  )

  const data = (await response.json().catch(() => null)) as
    | { sid?: string; status?: string; message?: string; error_message?: string }
    | null

  if (!response.ok) {
    return {
      to: message.to,
      status: 'failed',
      messageId: data?.sid || null,
      providerStatus: data?.status || null,
      error: data?.message || data?.error_message || `Twilio returned ${response.status}`,
    }
  }

  return {
    to: message.to,
    status: 'sent',
    messageId: data?.sid || null,
    providerStatus: data?.status || null,
  }
}

export async function sendTwilioSmsBatch(messages: SmsMessageInput[]): Promise<SmsDispatchResult[]> {
  const concurrency = 10
  const queue = [...messages]
  const results: SmsDispatchResult[] = []

  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length > 0) {
        const nextMessage = queue.shift()
        if (!nextMessage) return
        try {
          results.push(await sendTwilioSms(nextMessage))
        } catch (error) {
          results.push({
            to: nextMessage.to,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown SMS send error',
          })
        }
      }
    })
  )

  return results
}
