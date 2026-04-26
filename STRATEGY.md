# StanVault — Strategic Direction

## Core Thesis
"Own Your Fans. Own Your Future."
Artists don't own their fan relationships. Spotify knows your superfans better than you do — and won't tell you. StanVault fixes this.

## Product Lane
**Fan identity + relationship protocol.**
Core question: "Who are my real fans and how do I own that relationship?"

If a feature doesn't answer that question, it doesn't belong here.

---

## Ecosystem Separation (No Overlap)

| Project | Lane | Core Question |
|---------|------|---------------|
| **StanVault** | Fan identity + relationship protocol | "Who are my real fans and how do I own that relationship?" |
| **Subtaste** | Taste classification engine | "What do people actually like and why?" |
| **Boveda** | Character/persona creation | "How do I express a creative identity?" |

### Integration Points (API, not merging)
- StanVault exposes a fan API — other tools query "is this person a verified superfan?"
- Subtaste exposes a taste API — other tools query "what archetype is this user?"
- Boveda exposes a character API — other tools query "generate content in this persona's voice"

---

## What StanVault Already Has (Keep & Deepen)

1. **Two-sided marketplace** — artist portal + fan portal (network effect moat)
2. **Resonance** (0-100) — platform (30pts), engagement (40pts), longevity (20pts), recency (10pts)
3. **RCR (Resonance Conversion Rate)** — Hold Rate x Depth Velocity x Platform Independence / Churn Drag
4. **Cryptographic verification tokens** — fans carry proof of superfan status
5. **W3C Verifiable Credentials export** — decentralized identity standard
6. **Spotify OAuth fan discovery** — automatic fan ingestion from listening data
7. **Verification-gated Drops** — presale codes, downloads, links, messages
8. **Predictive superfan signals** — ML-weighted conversion probability
9. **Fan event timeline** — 13 event types (FIRST_STREAM → BECAME_SUPERFAN)
10. **Daily snapshots** — historical RCR/hold rate/tier trends

## What NOT to Port from Tessera

- Taste Genome (belongs in Subtaste)
- Boveda characters (belongs in Boveda)
- Content Studio / social posting / scheduling (commodity bloat)
- Rights & licensing (belongs with Boveda)
- Workspaces / approval queues (commodity)
- Halo aesthetic presets (commodity)

## Post-Vanity Metrics Decision

These were built for Tessera but some map to StanVault's lane:

| Metric | Belongs in StanVault? | Reasoning |
|--------|----------------------|-----------|
| MES (Meaningful Engagement Score) | YES | Measures depth of fan engagement — core to relationship scoring |
| Good Churn (graduated vs disengaged) | YES | Distinguishes positive exits from abandonment |
| Cultural Half-Life | YES | How long fan cohorts retain — relationship durability |
| ARI (Archetype Resonance Index) | NO | Taste classification — belongs in Subtaste |
| AOI (Authenticity & Originality Index) | NO | Content analysis — belongs in Subtaste |
| TWSI (Time Well Spent Index) | MAYBE | Platform health metric, not fan-specific |
| Taste Drift Alert | NO | Requires archetype data — belongs in Subtaste |

---

## Roadmap Priority (Build Next)

### Phase 1 — Platform Expansion
- Instagram fan discovery (OAuth + engagement tracking)
- TikTok fan discovery
- YouTube fan discovery
- Email list import

### Phase 2 — Network Effects
- Fan-to-fan referral tracking (which fans bring new fans?)
- Cross-artist fan graph ("fans of Artist A also became superfans of Artist B")
- Artist collective benchmarks by genre/size

### Phase 3 — Verification Economy
- Anti-scalper ticket verification (ticket vendors check StanVault tokens)
- Discord bot for role assignment based on verified fan status
- Merch shop integration (superfan-only products)

### Phase 4 — Fan Labor
- Superfan services marketplace (street team, UGC, translations)
- Direct artist-fan economic relationships

---

## Target Psychodemographic

### Primary: "The Post-Algorithm Artist"
- Age 22-38
- Independent or semi-indie musicians, visual artists, podcasters
- 1K-500K followers
- Disillusioned with vanity metrics, suspicious of algorithms
- Already using Spotify for Artists, tried Linktree/Patreon, feels tools are shallow
- Income $20K-$150K from creative work
- Pain: "I have fans but I don't KNOW them"

### Secondary: "The Superfan" (fan-side portal)
- Age 18-34
- Follows 3-8 artists deeply
- Identity tied to taste, wants recognition for loyalty
- Pain: "I've supported this artist since day one and I can't prove it"

---

## Revenue Model

| Stream | Pricing | TAM Segment |
|--------|---------|-------------|
| Artist subscriptions | $15-30/mo | 2.1M earning artists = ~$378M/yr |
| Fan premium features | $3/mo | 50M superfans x 5% conversion = ~$90M/yr |
| Platform take on drops/presales | 3% | $4.5B superfan economy = ~$135M/yr |
| **Total addressable** | | **~$600M/yr** |
| **Year 1-2 SOM** | | **~$28.8M ARR** (200K users x $12/mo) |

## Competitive Position

No competitor combines:
- Algorithmic fan discovery from platform data
- Portable cryptographic fan identity
- Two-sided marketplace (artist + fan value)
- Verification economy (tickets, merch, Discord, presales)

Spotify won't do this (they lock data in). Labels don't have direct fan relationships. CRMs are single-artist. Discord has no verification protocol. Patreon requires manual tier management.

---

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM + SQLite (migrate to PostgreSQL at scale)
- NextAuth.js 5.0
- Spotify OAuth
- HMAC-SHA256 token signing
- TanStack React Query
- Tailwind CSS + Framer Motion
