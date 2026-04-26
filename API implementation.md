# API Implementation

## Goal

Make `imprint` on `http://localhost:3003` the source of truth for:

- Artist and manager platform connections
- Fan-side verification connections
- Server-to-server revenue and conviction imports
- Reach-channel orchestration for campaigns
- Future provider adapters without adding one-off schema debt

## Current State

- Real now: Spotify artist auth, Spotify fan auth/sync, Oryx server-to-server import, email import.
- Partially real now: YouTube artist auth and sync, Discord artist auth and sync.
- Placeholder now: Twitch, Apple Music, Bandcamp, Boomplay.
- Current blocker: only Spotify has a fan-side verification flow wired through the new generic connection model.

## Product Split

### Imprint Owns

- Audience-source connections: Spotify, YouTube, Discord, Email List, Oryx, future Bandcamp imports.
- Reach-channel setup: WhatsApp, SMS, LINE, Kakao.
- Fan identity graph, consent, segmentation, campaigns, and CTA tracking.

### Oryx Owns

- Conviction and payment rails.
- Paystack, Flutterwave, M-Pesa, MTN MoMo, and future mobile-money verification.
- Revenue events, referrals, and proof-backed fan actions that feed Imprint.

### Do Not Put In Imprint Connect

- Raw payment processors as artist-facing buttons.
- Mobile-money rails as standalone artist OAuth cards.
- Market rails that are purely infrastructure for Oryx.

## Implementation Order

1. Normalize app URLs for `localhost:3003`.
2. Split artist and fan OAuth callback config per provider.
3. Add a generic `FanPlatformConnection` model.
4. Move fan-side Spotify reads onto the generic connection model.
5. Keep legacy Spotify fields temporarily for backward compatibility.
6. Implement real provider adapters in this order:
   - YouTube
   - Discord
   - WhatsApp / SMS campaign delivery
   - Apple Music
   - Bandcamp import path
   - Boomplay partner or manual import
   - Twitch only if a real customer segment justifies it

## Environment Variables

```bash
APP_URL="http://localhost:3003"
NEXTAUTH_URL="http://localhost:3003"
AUTH_SECRET="..."

SPOTIFY_CLIENT_ID="..."
SPOTIFY_CLIENT_SECRET="..."
SPOTIFY_ARTIST_REDIRECT_URI="http://localhost:3003/api/auth/spotify/callback"
SPOTIFY_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/spotify/callback"

YOUTUBE_CLIENT_ID=""
YOUTUBE_CLIENT_SECRET=""
YOUTUBE_ARTIST_REDIRECT_URI="http://localhost:3003/api/auth/youtube/callback"
YOUTUBE_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/youtube/callback"

TWITCH_CLIENT_ID=""
TWITCH_CLIENT_SECRET=""
TWITCH_ARTIST_REDIRECT_URI="http://localhost:3003/api/auth/twitch/callback"
TWITCH_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/twitch/callback"

DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
DISCORD_ARTIST_REDIRECT_URI="http://localhost:3003/api/auth/discord/callback"
DISCORD_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/discord/callback"

APPLE_MUSIC_KEY_ID=""
APPLE_MUSIC_TEAM_ID=""
APPLE_MUSIC_PRIVATE_KEY=""
APPLE_MUSIC_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/apple-music/callback"

ORYX_API_URL="http://localhost:4000"
ECOSYSTEM_API_SECRET=""

TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_MESSAGING_SERVICE_SID=""
TWILIO_FROM_NUMBER=""
TWILIO_STATUS_CALLBACK_URL="http://localhost:3003/api/webhooks/twilio/sms"
```

## Data Model Direction

### Artist Side

Keep using `PlatformConnection` on the artist `User` model.

### Fan Side

Add `FanPlatformConnection`:

- `fanUserId`
- `platform`
- `platformUserId`
- `accessToken`
- `refreshToken`
- `tokenExpiresAt`
- `platformScope`
- `status`
- `lastSyncAt`
- `syncError`

This replaces future provider-specific token columns on `FanUser`.

## Provider Notes

### Spotify

- Artist side: connect account, store tokens, resolve `spotifyArtistId`.
- Fan side: connect fan Spotify, sync listening signals against registered artists.
- Status in repo: partially implemented.

### Oryx

- Server-to-server only.
- Match by shared artist email.
- Import historical backers and ongoing conviction events.
- Status in repo: implemented.
- Keep payment rails and mobile-money verification behind Oryx.

### YouTube

- Artist side: YouTube Analytics API + YouTube Data API.
- Fan side: Google OAuth, subscription/comment/engagement matching where available.
- Status in repo: artist-side auth/sync implemented and public subscriber import added. Private subscribers and deeper engagement signals are still pending.

### Discord

- Use for identity, guild joins, roles, and activity.
- Do not treat it as a substitute for streaming analytics.
- Status in repo: artist-side OAuth and guild/member-count sync implemented.

### WhatsApp / SMS

- These belong to campaign delivery, not audience analytics.
- WhatsApp and SMS matter more than another DSP connector in phone-first markets.
- Build them as reach channels on top of Imprint consent and segmentation.
- Status in repo: SMS fan contacts, audience summaries, live Twilio delivery, and STOP/START webhook handling are now implemented. WhatsApp is still pending.

### Twitch

- Use Helix/EventSub for follows, subs, bits, and live activity.
- Only build if a real music-adjacent cohort proves it matters.

### Apple Music

- Fan side first via MusicKit / Apple Music API.
- Artist-facing analytics likely remain export or partner territory.

### Bandcamp

- Prefer API access if approved.
- Fallback path already exists via server-to-server purchase import.

### Boomplay

- Treat as partner/export/manual import until official access is secured.

## Market Priority

### Africa

- Core market now.
- Highest product fit for Afrohouse, Afrobeats, Amapiano, and manager-led teams.
- API priority: YouTube, Spotify, Email List, Oryx, WhatsApp, SMS.

### Europe

- Expand next through diaspora artist-managers and community-led collectives.
- API priority: YouTube, Spotify, Email List, Discord, WhatsApp.

### America

- Expand after Europe through diaspora teams that already capture owned contact paths.
- API priority: YouTube, Spotify, Email List, Discord, WhatsApp, SMS.

### Asia

- Selective only until LINE and Kakao exist.
- Best fit is fan-club-heavy micro-label or street-team workflows, not broad rollout.
- API priority: YouTube, LINE, Kakao, Email List.

## Immediate Deliverables In This Pass

- `3003` URL normalization
- Separate Spotify artist/fan redirect handling
- Generic fan platform connections
- Spotify fan flow migrated onto the generic connection layer
- YouTube artist OAuth callback and sync wiring
- Discord artist OAuth callback and sync wiring
- Admin beta stress-test preview with 30 ICPs, 10 non-customers, and 10 haters
- Connections UI split into audience sources and reach channels
- UI corrected so unsupported platforms are not shown as ready
