# Stanvault - Project Summary

## What is Stanvault?

A **fan verification protocol** for artists. Not another analytics dashboard — a way to **prove** fan relationships and gate access to exclusive content.

**Core insight:** Platforms like Spotify have all the data but artists can't access it. Stanvault lets fans verify their listening history and prove their fandom to artists.

---

## Current State (January 2026)

### What's Built

#### 1. Artist Portal (`/dashboard`, `/fans`, `/drops`, etc.)
- Artist authentication (email/password, Google)
- Platform connections (Spotify OAuth)
- Fan database with tier system (Casual → Engaged → Dedicated → Superfan)
- Resonance Conversion Rate (RCR) analytics
- **Verification-gated drops** — create exclusive content with tier/score requirements

#### 2. Fan Portal (`/fan/*`)
- Fan authentication (separate from artist auth)
- Spotify OAuth for verification
- Auto-sync listening data to verify artist relationships
- Self-service verification tokens
- Portable fan identity export

#### 3. Public Verification (`/drop/[slug]`, `/verify`)
- Public drop pages with gating requirements
- Token-based verification (HMAC-signed, tamper-proof)
- Claim tracking with deduplication

### Database Schema
- `User` (Artist) — with Spotify Artist ID for matching
- `Fan` — artist's view of their fans
- `FanUser` — fans with their own accounts
- `FanUserArtistLink` — verified relationships (tier, score, streams)
- `Drop` — gated content with requirements
- `DropClaim` — who claimed what

### Design System
- "Bourgeois Twitch meets Balenciaga meets Napster"
- Pure black (#000) + white + hot pink (#FF2D92) + purple accent
- Brutal typography (Helvetica Neue)
- Virgil-style `[SV]` logo mark

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         ARTIST SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Artist signs up, connects Spotify                           │
│  2. Sets Spotify Artist ID in Settings                          │
│  3. Creates a Drop with gating rules:                           │
│     - Minimum tier (e.g., DEDICATED+)                           │
│     - Minimum Resonance (e.g., 50+)                            │
│     - Max claims (scarcity)                                     │
│  4. Shares drop link: /drop/[slug]                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                          FAN SIDE                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Fan visits drop link                                        │
│  2. Sees requirements, clicks "Claim"                           │
│  3. If not logged in → redirects to fan login → returns         │
│  4. If Spotify not connected → onboarding to connect            │
│  5. Spotify sync runs:                                          │
│     - Fetches recently played, saved tracks, followed artists   │
│     - Matches against Stanvault artists (by Spotify ID)         │
│     - Creates FanUserArtistLink with tier + score               │
│  6. Drop access check:                                          │
│     - Verified relationship exists? ✓                           │
│     - Meets tier requirement? ✓                                 │
│     - Meets score requirement? ✓                                │
│  7. Content unlocked → claim recorded                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Routes

| Route | Purpose |
|-------|---------|
| `/login` | Artist login |
| `/dashboard` | Artist dashboard |
| `/drops` | Create/manage gated drops |
| `/settings` | Set Spotify Artist ID |
| `/fan/login` | Fan login |
| `/fan/dashboard` | Fan's verified relationships |
| `/fan/onboarding` | Connect Spotify |
| `/drop/[slug]` | Public drop claim page |

---

## Testing the Flow

### As Artist:
1. Login at `/login`
2. Go to `/settings` → Add your Spotify Artist ID
3. Go to `/drops` → Create a drop
4. Copy the drop link

### As Fan:
1. Register at `/fan/register`
2. Connect Spotify at `/fan/onboarding`
3. Visit the drop link
4. Click "Claim Drop"

---

## Next Steps

### Immediate (MVP Validation)

- [ ] **Test with real artist + fans** — You + musician friends
- [ ] **Add Spotify Artist ID lookup** — Search by name instead of manual ID entry
- [ ] **Improve sync depth** — Fetch more listening history (currently 50 recent tracks)
- [ ] **Drop analytics** — Who claimed, when, what tier

### Short-term (Product)

- [ ] **Discord bot** — Verification in Discord servers (wedge strategy)
- [ ] **Presale windows** — Time-gated access (superfans get early access)
- [ ] **File uploads** — Upload content directly instead of external URLs
- [ ] **Email notifications** — Alert artists when drops are claimed

### Medium-term (Growth)

- [ ] **Public artist profiles** — `/artist/[slug]` with verified fan count
- [ ] **Cross-artist fan graph** — Fans verified across multiple artists
- [ ] **Venue/promoter API** — Ticket presale verification
- [ ] **Mobile app** — Fan wallet for verification tokens

### Long-term (Blue Ocean)

- [ ] **Verification protocol standard** — Other platforms can verify Stanvault tokens
- [ ] **Artist-to-artist recommendations** — "Fans of X also verified for Y"
- [ ] **Label dashboards** — Aggregate verification across roster
- [ ] **API monetization** — Charge venues/promoters per verification (like Plaid)

---

## Blue Ocean Strategy

### Red Ocean (Avoid)
- Fan analytics (Spotify for Artists, Chartmetric)
- Social media management (Later, Hootsuite)
- Email marketing (Mailchimp, Klaviyo)

### Blue Ocean (Our Territory)
- **Fan verification protocol** — Prove fan status, not just track it
- **Gated access infrastructure** — The Plaid of fan identity
- **Anti-scalping for tickets** — Verified fans only

### Key Differentiator
> "Not 'know your fans' — **prove** your fans."

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite (Prisma ORM) — easy switch to Postgres for prod
- **Auth:** NextAuth v5 (artists), custom session (fans)
- **Styling:** Tailwind CSS
- **APIs:** Spotify Web API

---

## Files Changed (Recent)

| File | Description |
|------|-------------|
| `prisma/schema.prisma` | Added Drop, DropClaim models |
| `src/app/(dashboard)/drops/page.tsx` | Artist drop management |
| `src/app/api/drops/route.ts` | Create/list drops API |
| `src/app/api/drops/[slug]/route.ts` | Public drop access API |
| `src/app/drop/[slug]/page.tsx` | Public drop claim page |
| `src/app/api/fan/sync/route.ts` | Fan Spotify sync |
| `src/app/(dashboard)/settings/page.tsx` | Added Spotify Artist ID field |
| `src/lib/auth.ts` | Added spotifyArtistId to session |

---

## Running Locally

```bash
# Install dependencies
npm install

# Set up database
npx prisma db push

# Start dev server
npm run dev

# Open
http://localhost:3003
```

### Environment Variables
```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret"
SPOTIFY_CLIENT_ID="..."
SPOTIFY_CLIENT_SECRET="..."
SPOTIFY_ARTIST_REDIRECT_URI="http://localhost:3003/api/auth/spotify/callback"
SPOTIFY_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/spotify/callback"
```

---

## Questions?

This is a verification protocol, not another dashboard. The value is in **proving** fan relationships exist — for presales, exclusive access, and eventually, a portable fan identity that works across platforms.
