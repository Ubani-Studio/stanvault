# StanVault 200-User Beta Test Plan + ICP Analysis

## Context

Previous 100-user cohort was simulated with old constraints (Dasham-only conviction scoring, $299 floor pricing). We just shipped expanded conviction scoring (Bandcamp, Ko-fi, Patreon, Merch, streaming fallback) and a $29/mo Starter tier. This changes who can get value from the product. Time to design a real 200-user beta and pressure-test the ICP.

---

## Part 1: Brutal ICP Analysis

### The Core ICP (unchanged, validated)

**Post-Algorithm African Artist: 5K-100K Spotify monthly listeners, Lagos/Nairobi/Joburg/Accra + diaspora, earning $500+/mo from music.**

This is where 81% retention lives. The scoring system, Dasham conviction data, city presence bonus, and cultural proximity all converge here. This ICP is not debatable — the data confirms it.

### The New Expansion ICP (enabled by what we just shipped)

**Direct-to-Fan Independent Artist: Any genre, 2K-50K listeners, active Bandcamp/Ko-fi/Patreon/merch store, at least SOME fans spending real money.**

The conviction scoring expansion means an artist whose fans buy albums on Bandcamp or subscribe on Ko-fi can now score up to 25/35 on conviction instead of the old 0/35. This is a real product for them now, not a broken one.

But be clear: **this is a weaker ICP than the African artist.** The scoring is less rich (25 max vs 35 max conviction), the ecosystem integration is thinner (no Dasham/Oryx data moat), and the cultural proximity signal (city presence) matters less in dispersed Western markets.

---

## Part 2: Are DJs the ICP? (No.)

Brutal answer: **DJs are structurally excluded from value in StanVault's current form.**

Here's why:

| What StanVault Measures | How DJs' Fans Actually Behave |
|---|---|
| Spotify streams per fan | Fans don't stream DJ sets on Spotify — they attend them live |
| Tips via Dasham | DJs don't receive tips through Dasham |
| Bandcamp purchases | Some DJs sell on Bandcamp, but this is a minority behavior |
| Social follows/engagement | Relevant but shallow — same as any creator |
| Email opens/clicks | DJs rarely have email lists |
| City presence (artist city match) | THIS is the one that works — DJs have home cities and resident nights |

**The core problem:** DJ-fan relationships are spatial and temporal. The fan who shows up to your Wednesday residency every week for 6 months is a superfan. StanVault has zero way to capture that signal. It would need:
- Ticket stub / attendance verification (Dice, Resident Advisor integration)
- Venue check-in data
- SoundCloud/Mixcloud play tracking
- Repeat attendance tracking

That's a different product. StanVault is built around streaming + financial signals. DJs' highest-fidelity fan signals (attendance, dance floor presence, word-of-mouth in local scenes) are invisible to the scoring system.

**Exception:** DJs who ALSO produce and release tracks on Spotify, AND sell on Bandcamp, AND have a Ko-fi/Patreon. These are producer-DJs (like Kaytranada, TSHA, Mall Grab). They're a valid secondary ICP because their fans DO stream and DO purchase. But pure selectors/DJs — no.

**Verdict:** Don't target DJs. If producer-DJs come organically, the Starter tier at $29/mo is the right entry point. But don't build for them.

---

## Part 3: Are A&Rs the ICP? (No — but they're a distribution channel.)

**A&Rs are not users of StanVault. They're consumers of StanVault data.**

| What A&Rs Need | What StanVault Offers |
|---|---|
| Compare artists side-by-side | Single-artist dashboard only |
| Portfolio view of unsigned talent | No discovery/browse interface |
| Quick evaluation (30 seconds per artist) | Requires account, onboarding, Spotify connection |
| Bulk screening of 100+ artists | No batch evaluation |
| Integration with existing A&R workflow | No CRM/pipeline integration |

An A&R would need a completely different interface: read-only artist cards with RCR, tier distribution, and hold rate — accessible without creating an account. That's a B2B API product, not the core SaaS.

**Where A&Rs matter:** They're a reason for artists to USE StanVault. "My RCR is 2.4 and I have 127 verified superfans" is a better pitch to a label than "I have 50K monthly listeners." If artists can export/share their StanVault dashboard as a pitch deck, A&Rs become indirect demand generators.

**What to build (not now, later):** A public artist profile page (`/artist/[slug]`) showing RCR, tier distribution, and drop history. Artist opts in. A&Rs can view without an account. This is Phase 2-3, not beta.

**Verdict:** Don't target A&Rs as users. Let artists use StanVault data to pitch A&Rs. The A&R play comes when StanVault has enough artists that labels want API access to the RCR data.

---

## Part 4: Are You (Sphinxy) the ICP? (Partially — and here's the honest breakdown.)

Your profile:
- **Genres:** Experimental afrobeats, afrohouse, rap, alt-r&b (FKA twigs lane)
- **Markets:** London, New York, Atlanta, LA, Lagos, Johannesburg
- **Persona:** Multi-genre, multi-city, experimental

### Where you overlap with the core ICP

| Signal | Overlap? |
|---|---|
| African music genres (afrobeats, afrohouse) | YES — this is the beachhead genre |
| Lagos and Joburg as markets | YES — city presence bonus activates |
| Multi-city presence | YES — platform independence score benefits |
| Earning from music | Presumably yes — you're building tools for this ecosystem |
| Spotify presence | YES |

### Where you diverge from the core ICP

| Signal | Problem |
|---|---|
| "Experimental" | Your fans are niche. They stream less volume per capita than mainstream afrobeats fans. A fan who listened to your track 30 times has deep conviction — but the scoring rewards 100+ streams for the behavioral proxy to kick in. Experimental = lower raw stream counts = lower engagement scores. |
| FKA twigs lane | Your aesthetic reference is a Western experimental artist. Your fan base is likely more London/NYC/LA than Lagos. Diaspora-heavy, not continental-heavy. This means less Dasham tip data (the 35-point conviction signal). |
| Multi-genre (4 genres) | Your fans are fragmented. Someone who loves your afrohouse tracks might not follow your rap output. StanVault scores individual fan-artist relationships, not fan-genre relationships. If your fans only engage with 1 of your 4 modes, their engagement scores will be lower than a single-genre artist's fans. |
| 6 cities | Your fan base is dispersed across 6 cities on 3 continents. The city presence bonus (+5 conviction) fires when a fan is in the artist's HOME city. If you list Lagos but your biggest fan is in London, they don't get the bonus. |
| Alt-r&b / rap | These genres have different fan behavior. Alt-r&b fans discover through playlists and editorial, not direct artist following. Rap fans are social-media-first. Neither behavior pattern maps perfectly to StanVault's scoring weights. |

### The honest verdict

**You are a SECONDARY ICP, not the primary.** You sit at the intersection of two cohorts from the beta analysis:

- **Diaspora Artists** (80% retention in simulation) — your Lagos/Joburg connection
- **Indie Hip-Hop/R&B** (40% retention in simulation) — your experimental/alt-r&b side

Your retention would likely be 50-65% — better than Western indie pop (0%), worse than core Afrobeats (75-81%).

**The expanded conviction scoring helps you significantly.** Before today's changes, your fans (who probably buy on Bandcamp and support on Ko-fi more than they tip on Dasham) would get 0/35 conviction. Now they can get up to 25/35. This is a meaningful improvement for your use case.

### Should you tweak StanVault for yourself?

**No. And here's why.**

If you optimize StanVault for experimental multi-genre artists in 6 cities, you weaken it for the core ICP (mainstream Afrobeats artists in concentrated African markets). Specific ways this would hurt:

1. **Diluting the city presence signal** — you'd want multi-city bonuses instead of single-city. But the single-city bonus is what makes Lagos-based artists' scores richer than generic Western artists' scores. That's the moat.

2. **Weighting streaming higher** — your experimental fans stream less but more deliberately. You'd want 50 streams to count more. But lowering the streaming threshold makes the scoring more gameable by bot farms. The 100-stream floor for behavioral proxy is a fraud prevention mechanism.

3. **Multi-genre normalization** — you'd want fans who only engage with your afrohouse output to score as high as fans who engage across all 4 genres. But breadth IS a signal. A fan who follows you across rap AND afrohouse IS more convicted than one who only knows your house tracks.

4. **Adding more Western platform signals** — Apple Music, Tidal, SoundCloud would help your fans score better. But each new platform integration is engineering effort diverted from deepening the Dasham/Oryx conviction pipeline, which is the scoring advantage for the core ICP.

**The Starter tier at $29/mo IS the tweak for you.** It lets you use StanVault without needing the full scoring richness. You get fan intelligence, drops, basic campaigns. If your fan base grows concentrated enough (say, your London or Lagos fanbase solidifies), you'll naturally graduate to Private Circle as the scoring becomes more useful.

**Lock in the core ICP. Use the Starter tier for yourself. Don't bend the product.**

---

## Part 5: Blindspots and Non-Customers

### Blindspot 1: Concert-Goers Without Digital Footprint

Fans who attend every show, buy merch at the venue, and tell their friends — but barely stream on Spotify and don't have social media. StanVault scores them as CASUAL or completely misses them. These are some of the most convicted fans in existence.

**Size:** Significant in African markets where live music culture is strong and not everyone has premium streaming.

**Fix (not now):** QR code check-in at shows. Scan → creates/updates fan record with attendance signal. This would be a powerful conviction signal (showing up in person > streaming from couch). Add to roadmap post-beta.

### Blindspot 2: WhatsApp/Telegram Communities

African music fandom runs on WhatsApp groups and Telegram channels, not Discord. StanVault has zero visibility into these. An artist might have a 500-person WhatsApp broadcast list of their most engaged fans — StanVault doesn't know they exist.

**Fix (not now):** WhatsApp Business API integration or a simple "import from WhatsApp contacts" CSV flow. Lower priority than platform integrations but culturally important for the beachhead.

### Blindspot 3: The Manager Dashboard Gap

The beta analysis showed 100% retention for managers. But StanVault has no multi-artist view. Each manager creates one account per artist. There's no "my roster" dashboard with comparative RCR, tier distributions, and cross-roster insights.

**Fix (for beta):** Not a code change — a workaround. Managers create one account and add all their artists' fans manually. Post-beta, build a proper multi-artist workspace.

### Blindspot 4: Fans Who Pay But Not Digitally

In Lagos and Joburg, fans support artists with cash at events — buying CDs, merch, paying gate fees. None of this is captured. Dasham captures mobile money tips, but cash transactions are invisible.

**This is an inherent limitation.** The scoring system requires digital signals. Accept it and don't try to solve it.

### Non-Customer: The Vanity Metrics Artist

Artists who optimize for followers, likes, and views. They want growth hacking, not fan intelligence. They'd look at StanVault and say "but where's my follower count?" These artists are NOT a blindspot — they're correctly excluded. Don't pursue them.

### Non-Customer: The Major Label Artist

Major label artists don't own their fan data — the label does. The label controls presales, merch, campaigns. StanVault's "own your fans" thesis is antithetical to the major label model. Even if a signed artist wanted StanVault, their label would likely block data sharing.

**Exception:** Artists in the 6-12 month window before signing, or post-label artists reclaiming independence. They're rare but high-value.

---

## Part 6: The 200-User Beta Plan

### Cohort Design

**Total: 200 users (80 artists, 120 fans)**

Fans outnumber artists 1.5:1 because each artist brings fans. Artists are the activation lever.

#### Artist Cohort (80 artists)

| Segment | Count | Profile | Tier Target | Purpose |
|---|---|---|---|---|
| **Core Afrobeats/Amapiano** | 30 | 5K-80K listeners, Lagos/Nairobi/Joburg/Accra, earning $500+/mo, Spotify + Dasham | Private Circle ($1,500) | Validate core ICP retention, Dasham conviction scoring |
| **Diaspora African artists** | 15 | 10K-100K listeners, London/Atlanta/Toronto/NYC, Afrobeats/Afro-fusion/Afro-R&B | Private Circle ($1,500) | Validate diaspora extension of core ICP |
| **Managers (African + diaspora roster)** | 10 | Managing 2-5 artists each, Lagos/London/Atlanta | Patron Growth ($4,000) | Validate manager ICP, multi-artist use case |
| **Direct-to-fan indie (any genre)** | 10 | 2K-30K listeners, active Bandcamp/Ko-fi/Patreon, earning $200+/mo | Starter ($29) | Validate expanded conviction scoring without Dasham |
| **Experimental / niche (your lane)** | 5 | Multi-genre, experimental, Bandcamp-heavy, 1K-20K listeners | Starter ($29) | Stress test: does scoring feel useful for niche artists? |
| **Producer-DJs** | 5 | Release tracks + DJ, Spotify + Bandcamp/SoundCloud, 2K-25K listeners | Starter ($29) | Test DJ edge case honestly |
| **Indie Hip-Hop / R&B (US)** | 5 | 5K-50K listeners, NYC/LA/Atlanta/Chicago, some merch/Bandcamp revenue | Starter ($29) | Test Western indie without African ecosystem |

#### Fan Cohort (120 fans)

| Segment | Count | Profile | Purpose |
|---|---|---|---|
| **Deep African fans** | 35 | Lagos/Nairobi/Joburg, stream daily, tip on Dasham, attend shows | Core ICP fan validation |
| **Diaspora superfans** | 25 | London/Atlanta/Toronto/NYC, heavy streamers, merch buyers | Diaspora fan behavior |
| **Bandcamp/Ko-fi supporters** | 20 | Buy albums, subscribe on Ko-fi/Patreon, any geography | Validate new conviction scoring |
| **Street team / fan club leaders** | 15 | Obsessive fans, share everything, organize fan activity | Test CTA completion + propagation |
| **Casual-but-curious** | 15 | Saw a drop link, connected Spotify, browsing | Test onboarding funnel, conversion |
| **Skeptics / cold signups** | 10 | No prior artist connection, signed up from marketing | Baseline churn measurement |

### Beta Success Metrics (90-day)

| Metric | Target | Kill Threshold |
|---|---|---|
| Core ICP artist retention (Afrobeats + diaspora + managers) | 75%+ | <50% |
| Starter tier artist retention | 40%+ | <20% |
| Fan 90-day retention | 45%+ | <25% |
| Drops created per retained artist | 3+ avg | <1 avg |
| Fan Spotify verification rate | 80%+ | <50% |
| Fan drop claim rate | 55%+ | <30% |
| Cross-artist fan verification | 20%+ | <10% |
| Starter -> Private Circle upgrade | 15%+ of Starter artists | -- |
| New conviction scoring activation | 60%+ of non-Dasham artists get >0 conviction | <30% |

### Acquisition Channels for 200 Users

| Channel | Target | Method |
|---|---|---|
| Oryx/Palmlion ecosystem | 30 artists, 40 fans | Internal referral from existing ecosystem users |
| Music Twitter/X (African music) | 15 artists, 20 fans | Targeted DMs to artists with 5K-50K followers who post about fan engagement |
| Bandcamp top sellers (African genres) | 10 artists | Direct outreach to artists actively selling on Bandcamp |
| Manager network (Lagos/London) | 10 managers | Personal intros through existing contacts |
| Discord music communities | 5 artists, 30 fans | Partner with 3-5 active music Discord servers |
| Your own network | 5 artists, 15 fans | Experimental/niche cohort from your creative circles |
| Cold signups (marketing page) | 5 artists, 15 fans | Organic from the /pricing page + social posts |

### Beta Timeline

| Week | Milestone |
|---|---|
| 1-2 | Invite first 50 users (30 core ICP artists + 20 fans). Monitor onboarding completion rate. |
| 3-4 | Invite next 50 (diaspora + managers + their fans). First drop creation push. |
| 5-6 | Invite remaining 100 (Starter tier artists, remaining fans, cold signups). Monitor scoring activation for non-Dasham artists. |
| 7-8 | First retention checkpoint (30-day). Identify churning segments. |
| 9-10 | Campaign activation push. Get artists to send first Emissar campaigns. |
| 11-12 | 90-day retention measurement. Cohort analysis. Decision: double down on core ICP or widen. |

### What to Watch For

1. **Does expanded conviction scoring make Starter tier artists feel the product works?** If non-Dasham artists still feel "my fans are all CASUAL," the scoring weights need adjustment.

2. **Do managers create significantly more drops than solo artists?** If yes, manager-specific features are the highest-ROI next build.

3. **What's the Starter -> Private Circle upgrade trigger?** Is it fan count (hitting 200 cap), drop count (hitting 5 cap), or campaign sends (hitting 500 cap)?

4. **Do fans verify across multiple artists?** This is the network effect seed. If <10%, the cross-artist graph thesis needs rethinking.

5. **Do experimental/niche artists (your lane) retain at all?** If 0/5 retain, the Starter tier isn't enough -- the scoring fundamentally doesn't serve this segment. If 2-3/5 retain, Starter is working.

---

## Part 7: Summary Verdict

| Question | Answer |
|---|---|
| Core ICP | Post-Algorithm African Artist (5K-100K listeners, Lagos/Nairobi/Joburg + diaspora). Unchanged. Lock this in. |
| DJs | Not an ICP. The scoring system can't see their fans' conviction signals (attendance, dance floor presence). Don't target them. |
| A&Rs | Not a direct ICP. They're a distribution channel. Build shareable artist profiles later so artists can pitch A&Rs using StanVault data. |
| Are you the ICP? | You're secondary ICP at best. The Starter tier at $29/mo is your entry point. Your experimental/multi-genre/multi-city profile means the scoring will be less rich for you than for a focused Lagos Afrobeats artist. |
| Should you tweak StanVault for yourself? | **No.** Every tweak toward experimental multi-genre artists weakens the core ICP's scoring advantage. The Starter tier IS the accommodation. Use it, but don't reshape the product around your edge case. |
| Biggest blindspot | Concert-goers without digital footprint + WhatsApp communities. Both are high-conviction fan behaviors invisible to the current scoring system. |
| What to build for beta | Nothing new. The product as-shipped (with expanded scoring + Starter tier) is ready. Focus on acquisition, onboarding friction, and measuring retention. |

---

## Implementation

Beta infrastructure is implemented in the codebase:

- **Schema:** `BetaInvite` model, `BetaCohort`/`FanBetaCohort`/`AcquisitionChannel` enums, beta fields on `User` and `FanUser`
- **Invite API:** `POST /api/beta/invites` (create codes), `GET /api/beta/invites` (list), `POST /api/beta/invites/validate` (check code)
- **Metrics API:** `GET /api/beta/metrics` (all 9 success metrics with targets and kill thresholds)
- **Registration:** Both artist and fan registration accept `inviteCode` parameter, auto-assign cohort/tier/channel
- **Seed script:** `scripts/seed-beta-invites.ts` generates codes for all cohorts per the plan

*Last updated: 2026-02-23*
