# Non-gameable signals for Imprint

The premise. Every existing creator-economy platform tracks signals
that bots and farms can fake: views, likes, follows, comments, even
"engagement rate." Inflation is rampant. Bots harvest creator-pay
pools by gaming the easy signals. Artists optimise for vanity and
end up with audiences that don't actually buy anything.

Imprint exists to make a different signal-set the truth: the kind
of thing a bot fundamentally cannot do at scale. The composite of
those signals is the Conviction Score that Slayt, Oryx, Imperium,
and every other ecosystem surface consume.

A high Conviction Score means: this person is real, has paid real
attention, has made real commitments, and is exactly the human the
artist would want at their kitchen table.

## Signal tiers

Ranked by how expensive it is to fake at scale. Tier 1 is what we
weight most. Tier 4 is what every other platform weights most; we
explicitly discount it.

### Tier 1: physical-world signals (cannot be faked)

Bots have no body, no address, no plane ticket. These are the
asymptotically un-gameable layer.

- Verified concert attendance. Ticket scanned at the door,
  geofenced to the venue's coordinates, timestamped within the
  show window. Each verified attendance = +20 conviction.
- Physical merch shipping. Address-of-record verified by the
  shipping carrier (DHL / FedEx / national postal), name matches
  payment instrument. +12 per shipment.
- In-person meet. Photo-with-artist at a verified event, signed
  on by the artist or venue manager. +25.
- Off-platform witness. Tattoo, fan-art submitted to a verified
  art channel, real-world flyer with the artist's name. +30 with
  human review.

### Tier 2: identity + tenure (very expensive to fake)

Cross-checking identity claims across platforms and time. A bot can
spin up alts, but maintaining consistent multi-platform behaviour
over years is an order of magnitude harder than spinning up likes.

- Proof-of-personhood. World ID, BrightID, Gitcoin Passport, or a
  Civic-style attestation. +15 once, never re-counted.
- Cross-platform handle match. Same person verifiably on three+
  platforms (Instagram + Bluesky + Discord + Spotify) with the
  same handle and consistent post timing. +8 once, refreshed every
  6 months.
- Recurring payment tenure. Monthly subscription that has run for
  N months. +N (caps at 24). A two-year subscriber earns 24
  points; a one-month flip earns 1.
- Account age + behavioural consistency. Account older than 2y
  with continuous posting, replies in the same timezone, language
  fingerprint stable. +5.

### Tier 3: money commitment (expensive but not impossible to fake)

Money is honest because it costs something. The catch is artists
themselves can wash through alt-accounts to inflate their numbers,
or a wealthy fan can buy false volume. So money is weighted but
capped per-account-per-week.

- Donations / tips, capped at $50/week per fan from a single
  payment method. Each $1 = +0.5 conviction.
- Album / merch purchase. Each verified purchase = +5 + (price /
  $10).
- Membership tier. Free = 0, Engaged = 2, Dedicated = 5,
  Superfan = 10. Updated nightly.

Anti-gaming: velocity cap, payment-method KYC tier, and identity
uniqueness check across the recipient artist's whole catalogue.
Artist cannot inflate their own fans by funnelling money to
themselves: the system flags same-IP, same-card, or known-alt
patterns and zeros the contribution.

### Tier 4: behavioural depth (moderate gameability)

A bot can like and comment cheaply. A bot cannot easily produce a
2-minute voice note explaining what the song meant. Behavioural
depth is the analogue of "show, don't tell" applied to fans.

- Voice / video response. Fan records and submits a reply. +3
  with human or LLM review.
- Detailed text response. 100+ characters, language-coherent,
  semantically related to the work. +1 per qualifying response,
  capped at 20 per month per fan.
- Sustained listening behaviour. Re-plays, save-and-return,
  finishing a long-form piece > 80%. +0.2 per qualifying session.
- Off-platform mention. Bio link, story mention in a verified
  account. +2.

### Tier 0 (the deliberately discounted layer)

Raw views, likes, follow counts, comment counts without content
analysis, share counts. These get a flat 0.05 weight on the
composite. Visible in the UI but explicitly de-emphasised. Bots
can mass-produce these and they tell artists nothing about who
their actual audience is.

## The Conviction Score

  conviction = clamp(0, 100,
    physical    * 0.40 +    // Tier 1
    identity    * 0.20 +    // Tier 2
    money       * 0.20 +    // Tier 3
    behavioural * 0.15 +    // Tier 4
    vanity      * 0.05      // Tier 0
  )

Tiers are themselves normalised against the artist's catalogue
ceiling, so a casual artist's superfan and a global artist's
superfan share the same scale.

Threshold tiers for surfacing:

- 0-29     Casual (visible, low weight on artist's signal feed)
- 30-59    Engaged (counted as a real reader)
- 60-79    Dedicated (eligible for paid drops + invites)
- 80-100   Superfan (the artist's actual people)

The Superfan tier (80+) is what gates everything valuable in the
ecosystem: pre-sale tickets, private Discord, signed merch, one-
on-one calls, co-creation invites, in-person retreats.

## Anti-gaming mechanics

Built into the scoring engine, not optional features:

1. Velocity caps per signal. No single signal can contribute more
   than X per week from one fan. Money capped at $50/week. Voice
   notes capped at 20/month. Likes / views uncapped but at 0.05
   weight.
2. Identity uniqueness check. A fan can only count once per artist.
   Alt-detection runs continuously: same IP, same device
   fingerprint, same payment instrument, same email-root, same
   handle stem with one-character diff, same writing fingerprint.
3. Honeypot detection. Real humans engage broadly. An account that
   ONLY engages with one artist, and never anyone else, is flagged
   as a probable alt or paid follower. Their conviction caps at 30.
4. Inviter chain. Each new fan inherits 10% trust from the verified
   human who invited them. Bot-spawned chains lose trust quickly.
   The chain is auditable.
5. Periodic re-attestation. Tier 2 identity signals expire after
   6 months unless re-verified. Prevents stale World ID
   attestations from being purchased and recycled.
6. Behavioural-consistency model. Per-fan model that flags
   sudden behaviour changes (account that posted at 9am EST for
   three years suddenly switching to 3am PST). Such accounts get
   their conviction capped pending review.
7. Token-gated escalation. Moving from Dedicated to Superfan
   requires at least one Tier 1 signal (physical attendance, merch
   shipment, in-person meet, or off-platform witness). No amount
   of Tier 3/4 signals alone can promote a fan to Superfan.

## What this unlocks economically

The Kevin Kelly "1000 true fans" essay assumes the artist can FIND
those 1000. Imprint makes that finding accurate.

A creator with 1000 verified Superfans (conviction >= 80) can
sustainably earn $100k-$1M/year because:

- 1000 fans × $100/yr in direct support = $100k floor.
- Top decile of those 1000 will pay $500-$5k/yr in tickets,
  merch, signed drops, in-person retreats.
- The bottom of the Superfan distribution still buys two albums
  and a t-shirt a year.

This is the Patreon math, except every fan in the count is
verified-real. No bot inflation, no churn from people who never
existed, no engagement-pool laundering.

## What this unlocks relationally

The list of Superfans is small enough (typically 200-2000) that the
artist can know them by name. Imprint's UI surfaces:

- Per-fan dossier: who they are, where they live, when they joined,
  which works moved them, what they've bought, what they've said.
- Direct messaging that opens by Superfan tier (Imprint won't
  surface every random DM; only Dedicated+ get a direct line).
- Annual retreat invites. The artist invites their top N fans to a
  real-world gathering. Imprint handles logistics + visa support.
- Co-creation invites. Specific superfans can be invited to co-
  write, co-produce, or co-curate. Imprint tracks the
  collaboration record.

This is the core promise: the artist's actual community becomes
visible, contactable, and economically active. Not a follower count.
A village.

## Build sequencing

Phase 0 (now). Tier 3 money signals and Tier 4 behavioural depth
are already partly tracked via existing StanVault tier logic. Add
the velocity caps + identity uniqueness check.

Phase 1. Tier 2 identity layer. Wire World ID or Privy proof-of-
personhood. Add cross-platform handle verification.

Phase 2. Tier 1 physical-world signals. Build the ticket-scan +
shipping verification + photo-with-artist verification flows.
Partner with one venue for the first end-to-end test.

Phase 3. Honeypot detection + inviter chain + periodic re-
attestation. The defensive layer. Always runs.

Phase 4. Token-gated escalation as policy enforcement. No fan
becomes Superfan without Tier 1 signal.

After Phase 4 the conviction score is genuinely non-gameable at
scale. Bots can still farm Tier 0 numbers; those just don't
matter. The economic gating happens at Tier 1 + 2, which they
cannot cheaply forge.

## What Imprint surfaces vs hides

Surface, prominently: Conviction Score, tier, top three signals
behind the score (e.g. "attended 3 shows, two-year subscriber,
bought signed vinyl").

Hide, or relegate to a debug panel: vanity metrics (views, likes,
follows), raw counts.

The UX rule: an artist looking at a fan should immediately see why
they matter, not how popular they look in aggregate.

## What does NOT count toward conviction (explicitly)

- Imprint's own marketing reach.
- Slayt-shipped content view counts.
- Bot follower batches.
- Engagement-pool participation.
- "Boost" services or paid amplification.
- Self-promoted hashtag campaigns.

If a signal can be bought at scale on Fiverr, it does not feed the
conviction model. Ever.

## Update log

- 2026-05-21. First draft. Triggered by the conversation about
  non-gameable metrics, 1000-true-fans economics, and how Imprint
  needs to be the verification authority for the entire ecosystem.
