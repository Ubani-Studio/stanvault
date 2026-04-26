// Imprint email transport.
// Uses Resend if RESEND_API_KEY is set, otherwise falls back to a no-op logger so dev
// environments do not require a key. Production deploys must set RESEND_API_KEY.
//
// Sender identity is governed by IMPRINT_FROM_EMAIL (default "Imprint <hello@imprint.fan>").
// SPF, DKIM, and DMARC must be configured for this domain. See EMAIL_DELIVERABILITY.md.

import type { ManagerRole } from '@prisma/client'

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM = process.env.IMPRINT_FROM_EMAIL ?? 'Imprint <hello@imprint.fan>'
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3003'

interface SendInput {
  to: string
  subject: string
  /** Plain text body. Required. */
  text: string
  /** Optional HTML body. Recommended for transactional emails. */
  html?: string
  /** Optional reply-to override. */
  replyTo?: string
}

interface SendResult {
  ok: boolean
  /** Provider-side message id when available. */
  id?: string
  reason?: string
}

/**
 * Generic transactional send. Use the typed helpers below for known templates.
 */
export async function sendEmail(input: SendInput): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    console.log('[email] (no RESEND_API_KEY, no-op):', {
      to: input.to,
      subject: input.subject,
      preview: input.text.slice(0, 80),
    })
    return { ok: true, reason: 'noop_no_key' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        reply_to: input.replyTo,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.warn(`[email] Resend ${res.status}: ${detail.slice(0, 200)}`)
      return { ok: false, reason: `resend_${res.status}` }
    }

    const data = (await res.json()) as { id?: string }
    return { ok: true, id: data.id }
  } catch (e) {
    console.warn('[email] threw:', e)
    return { ok: false, reason: 'exception' }
  }
}

// ============================================================================
// Typed templates
// ============================================================================

export interface ManagerInviteEmailParams {
  to: string
  managerName: string
  managerEmail: string
  artistName: string
  role: ManagerRole
  acceptUrl: string
}

export async function sendManagerInviteEmail(p: ManagerInviteEmailParams): Promise<SendResult> {
  const subject = `${p.managerName} invited you to manage your fan roster`
  const text = [
    `${p.managerName} (${p.managerEmail}) invited you on Imprint.`,
    '',
    `Role: ${p.role}.`,
    `What this means: ${p.managerName} can see your Resonance scores, fan tier mix, drop performance, and roster metrics in read-only form. They cannot send drops or change settings unless you grant it.`,
    '',
    `Accept or revoke at any time:`,
    p.acceptUrl,
    '',
    'You can revoke access in your settings whenever you like.',
    '',
    'Imprint',
    'imprint.fan',
  ].join('\n')

  const html = htmlEmail({
    title: `${p.managerName} invited you to manage your fan roster`,
    body: `
      <p>${escapeHtml(p.managerName)} (${escapeHtml(p.managerEmail)}) invited you on Imprint.</p>
      <p><strong>Role:</strong> ${p.role}</p>
      <p>What this means: ${escapeHtml(p.managerName)} can see your Resonance scores, fan tier mix, drop performance, and roster metrics in read-only form. They cannot send drops or change settings unless you grant it.</p>
      <p style="margin: 32px 0;"><a href="${p.acceptUrl}" style="background: #fff; color: #000; padding: 12px 20px; text-decoration: none; font-family: 'Helvetica', sans-serif;">Review the invitation</a></p>
      <p style="color: #888; font-size: 13px;">You can revoke access in your settings whenever you like.</p>
    `,
  })

  return sendEmail({
    to: p.to,
    subject,
    text,
    html,
    replyTo: p.managerEmail,
  })
}

export interface FanDeleteReceiptParams {
  to: string
  fanId: string
  deletedAt: string
  erasedTokens: number
  erasedArtistLinks: number
}

export async function sendFanDeleteReceipt(p: FanDeleteReceiptParams): Promise<SendResult> {
  const text = [
    'Your Imprint fan account has been deleted.',
    '',
    `Receipt id: ${p.fanId}`,
    `Deleted at: ${p.deletedAt}`,
    `Verification tokens erased: ${p.erasedTokens}`,
    `Artist links erased: ${p.erasedArtistLinks}`,
    'Backups will be scrubbed within 90 days.',
    '',
    'If you did not request this, contact privacy@imprint.fan immediately.',
    '',
    'Imprint',
  ].join('\n')

  const html = htmlEmail({
    title: 'Your Imprint fan account has been deleted',
    body: `
      <p>This is your erasure receipt. Keep it for your records.</p>
      <table cellpadding="6" cellspacing="0" style="margin: 16px 0; font-family: 'Helvetica', sans-serif; font-size: 14px;">
        <tr><td style="color: #888;">Receipt id</td><td><code>${escapeHtml(p.fanId)}</code></td></tr>
        <tr><td style="color: #888;">Deleted at</td><td>${escapeHtml(p.deletedAt)}</td></tr>
        <tr><td style="color: #888;">Verification tokens erased</td><td>${p.erasedTokens}</td></tr>
        <tr><td style="color: #888;">Artist links erased</td><td>${p.erasedArtistLinks}</td></tr>
      </table>
      <p style="color: #888; font-size: 13px;">Backups will be scrubbed within 90 days.</p>
      <p style="color: #888; font-size: 13px;">If you did not request this, contact <a href="mailto:privacy@imprint.fan" style="color: #fff;">privacy@imprint.fan</a> immediately.</p>
    `,
  })

  return sendEmail({ to: p.to, subject: 'Your Imprint account has been deleted', text, html })
}

// ============================================================================
// HTML scaffold
// ============================================================================

function htmlEmail({ title, body }: { title: string; body: string }): string {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background: #000; color: #e8e8e8; font-family: 'Helvetica', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 24px;">
    <div style="font-family: 'Georgia', serif; font-size: 28px; color: #fff; margin-bottom: 32px;">Imprint</div>
    ${body}
    <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 40px 0 16px;">
    <p style="color: #555; font-size: 12px;">
      You received this email because you have an Imprint account at <a href="${APP_URL}" style="color: #888;">${APP_URL}</a>.
      Manage your settings or unsubscribe in your account.
    </p>
  </div>
</body>
</html>
`.trim()
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
