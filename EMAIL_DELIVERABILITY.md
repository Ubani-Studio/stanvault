# Imprint email deliverability

The transport is Resend. The brand sender is `Imprint <hello@imprint.fan>`. Three DNS records make the difference between landing in inbox and spam.

## What you need

1. A domain you own (default: `imprint.fan`).
2. A Resend account at https://resend.com with the sending domain verified.
3. DNS access (Cloudflare, Route 53, or wherever the domain is hosted).
4. The following env vars set in production:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
IMPRINT_FROM_EMAIL="Imprint <hello@imprint.fan>"
NEXTAUTH_URL=https://imprint.fan
```

If `RESEND_API_KEY` is not set, the transport logs to console and returns `ok: true, reason: "noop_no_key"`. Safe for dev, broken for prod.

## DNS records

Add all three to the apex domain (`imprint.fan`). Resend's dashboard generates the exact CNAMEs for SPF and DKIM; the values below are the structure, not the literal strings.

### 1. SPF (TXT record at root)

```
imprint.fan.  TXT  "v=spf1 include:amazonses.com include:_spf.resend.com ~all"
```

The `include:amazonses.com` is because Resend ships through SES under the hood. Add other includes (Google Workspace `_spf.google.com`, etc.) if you also send from those.

### 2. DKIM (CNAME records)

Resend issues two or three CNAMEs in the dashboard. They look like:

```
resend._domainkey.imprint.fan.  CNAME  resend.dkim.amazonses.com.
```

Add all of them exactly as shown in the dashboard. Verification typically completes within 30 minutes of DNS propagation.

### 3. DMARC (TXT record at `_dmarc`)

```
_dmarc.imprint.fan.  TXT  "v=DMARC1; p=quarantine; rua=mailto:postmaster@imprint.fan; pct=100; adkim=s; aspf=s"
```

Start with `p=quarantine` so that bad actors get quarantined rather than rejected. Move to `p=reject` after a week of clean sends. The `rua` mailbox receives aggregate DMARC reports.

## MX (only if you receive replies)

If `hello@imprint.fan` should accept replies, point MX records at your inbox provider (Google Workspace, Fastmail, Resend Inbound, ProtonMail, etc.). Without MX records, replies bounce.

```
imprint.fan.  MX  10 aspmx.l.google.com.
```

## Verification checklist after DNS propagation

```bash
# SPF
dig TXT imprint.fan +short

# DKIM
dig CNAME resend._domainkey.imprint.fan +short

# DMARC
dig TXT _dmarc.imprint.fan +short
```

Then open Resend → Domains → imprint.fan and confirm all three are green.

## Test send

After deployment, trigger a real send from staging:

```bash
curl -X POST https://staging.imprint.fan/api/roster/invite \
  -H "Cookie: <a manager session cookie>" \
  -H "Content-Type: application/json" \
  -d '{"artistEmail":"test@example.com","role":"MANAGER"}'
```

The Resend dashboard shows the message status. Check the actual recipient inbox plus spam folder.

## Templates and helpers

- Manager invitation: `sendManagerInviteEmail(...)` from `src/lib/email`. Wired in `/api/roster/invite`.
- Fan delete receipt: `sendFanDeleteReceipt(...)` from `src/lib/email`. Available; not yet wired (the fan delete route already returns the receipt JSON; emailing it is a one-line addition when desired).

## Common deliverability traps

1. Sending from a fresh, unwarmed domain. Send fewer than 50 emails in the first 48 hours; ramp slowly.
2. Mixing transactional and marketing on one domain. If you ever start a newsletter, use a subdomain (e.g., `mail.imprint.fan`) so a bad newsletter does not poison the transactional reputation.
3. No List-Unsubscribe header on bulk sends. Resend adds this automatically.
4. Plain-text-only messages. Always send both HTML and plain text (the helper already does).
5. Body too short or too generic. Spam filters dislike 2-line emails; the manager-invite template is intentionally substantive.

## Switching providers

If you swap Resend for Postmark or SES later, the only file that changes is `src/lib/email/index.ts`. The typed helpers (`sendManagerInviteEmail`, `sendFanDeleteReceipt`) keep their signatures.
