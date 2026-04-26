# Imprint ERRC V2

Strategic positioning, competitor map, and Eliminate / Reduce / Raise / Create grid for Imprint (StanVault).

## Red ocean or blue ocean

Both, on different axes. The strategic problem is making sure the blue axis stays primary.

| Axis | Color | Why |
| --- | --- | --- |
| Fan messaging plus drops plus contact list | **Red** | Laylo, Subtext, Community.com, Mailchimp, ConvertKit, Klaviyo all do this. Crowded, commodity, race to feature parity |
| Resonance plus verification protocol plus cross-artist graph | **Blue** | Empty slot. Last.fm faded, Spotify will not expose, Discogs is releases not fans, Audius and Royal are token-based not behavior-based. Resonance is a new metric category |
| Fan-side portable identity | **Blue** | No incumbent. Patreon is paywall-as-identity, which is not the same thing |
| Anti-scalper plus presale gating plus merch verification | **Blue tinted red** | A few point solutions exist (Token, Verifyfan, basic Shopify gates), none are protocol-grade |

The trap: Imprint feels red ocean to the artist (looks like Laylo with extra steps) but is blue ocean to everyone downstream (Discord servers, ticket vendors, merch sites that need a way to verify a fan). Position around the second audience, sell to the first.

## Direct competitors

| Tier | Competitor | Overlap | Why Imprint is different |
| --- | --- | --- | --- |
| **Direct** | **Laylo** | Drops, fan list, artist messaging | No score, no verification, no fan-side identity, no graph. Walled per artist |
| **Direct** | **Subtext** | Two-way SMS for creators | SMS only, no listening signal, no protocol layer |
| **Direct** | **Community.com** | Celebrity SMS at scale | Enterprise priced, opaque, no fan ownership claim |
| **Adjacent** | **Patreon** | Paid fan tier | Paywall is the relationship, not signal of fandom. Cannot prove a non-paying superfan |
| **Adjacent** | **Single Music plus Shopify Audiences** | Fan data via merch | Commerce-bound. No listening, no verification, no graph |
| **Adjacent** | **Bandzoogle, artist.tools** | Artist site plus fan capture | Static capture. No scoring. No protocol |
| **Protocol-flavored** | **Audius** | Web3 music plus token-gated fan tiers | Token-gated, not behavior-scored. Different proof model. Tiny adoption outside crypto |
| **Protocol-flavored** | **Royal, Catalog** | Fan ownership via NFTs | Royalty fractions and collectibles, not fan identity. Different problem |
| **Adjacent** | **Bandsintown for Artists** | Concert audience capture | Event-bound, not relationship-bound |
| **Defensive watch** | **Spotify For Artists "Fan Insights" (rumored)** | Artist-side fan data | If Spotify ships, the defense is owning verification off-platform so the credential lives with the fan |

Real direct competitors: **Laylo, Subtext, Community.com**. Everyone else is one zoom level off.

## ERRC Grid

### ELIMINATE

| Factor | Why |
| --- | --- |
| **Social media broadcasting and scheduling** | Do not become Buffer or Later. Drops must tie to a Resonance signal, never become generic post scheduling |
| **Public follower or like counts** | Post-vanity thesis. Showing followers makes Imprint into Spotify For Artists Lite |
| **Manual contact list import without listening signal** | A row of emails is not a fan. If Imprint accepts cold lists, it becomes Mailchimp |
| **Payments and tipping inside Imprint** | Already deferred to Oryx per the Connect strategy doc. Hold the line |
| **Non-music verticals** | Podcasters and Twitch creators surface in sigma sims, but the moat is the music fan graph. Verticalize first, generalize never (or much later) |
| **Drop or message features without verification ties** | If a drop does not respect tier or score, Imprint is Laylo with extra menus |
| **Per-artist data silos** | The whole point is the cross-artist graph. Any feature that walls data per artist (even if requested) breaks the moat |

### REDUCE

| Factor | How |
| --- | --- |
| **Number of platform connectors at v1** | Spotify, YouTube, Discord, Email. Skip Apple, TikTok, Instagram, Bandcamp until v2 |
| **Artist-side analytics that mimic Spotify For Artists** | Imprint is fan-relationship intelligence, not stream analytics. Stay in lane |
| **Onboarding configuration** | Fan: connect Spotify, done. Artist: paste Spotify Artist ID, done. Everything else surfaces when relevant |
| **Pricing tiers** | Currently four (STARTER, PRIVATE_CIRCLE, PATRON_GROWTH, SOVEREIGN). Cut to two until product-market fit clarifies. Tier proliferation hides positioning ambiguity |
| **Template and copy complexity for messages** | Fan-relationship UX matters more than email-builder polish. Keep templating minimal |
| **Visible feature surface for artists** | Fewer screens, denser. The artist dashboard should feel like Linear, not Mailchimp |

### RAISE

| Factor | How |
| --- | --- |
| **Verification protocol visibility** | Public verifier endpoint, signed tokens, partner SDK should be top-level surface, not buried in settings |
| **Resonance precision** | Score quality is the moat. Invest in the model: time decay, cross-platform breadth, recency, longevity, anti-gaming |
| **Fan-side identity ownership** | Fan portal should feel like a real account (Last.fm style), with their listening history, badges, exportable identity |
| **Cross-artist graph features (anonymized)** | "Your fans cluster around X" must be in the artist dashboard from week one. This is the moat made visible |
| **Trust posture** | Privacy policy, GDPR data deletion, signed-token audit log, key rotation should be visible and reassuring, not hidden |
| **Partner-facing surface area** | Treat Discord, Shopify, ticket vendors as a second user class. Docs, SDK, examples, Slack support |

### CREATE

| Factor | What is new |
| --- | --- |
| **Public verifier endpoint** | The canonical rail any system can call to ask "is this person a verified fan?" Stripe-grade reliability is the goal |
| **Cross-artist conversion graph** | "Fans of Tyla become superfans of Tems within 3 months at 31%." Data nobody else can produce |
| **Resonance Delta** | Time-series fan trajectory. A fan rising from 50 to 80 is more valuable than a static 80. Mirrors Crucibla's Conviction Delta |
| **Partner SDK plus reference integrations** | Open-source Discord bot, Shopify app, ticket vendor adapter. Lower the cost of integration to near zero |
| **Anti-scalper verification** | Token plus expiry plus optional geofence plus fan ID. Solves a real industry problem nobody else can credibly solve |
| **Predictive superfan signals** | ML on listening patterns to flag fans before Resonance crosses threshold. Tells artists who is about to convert |
| **Fan-to-fan referral with attribution** | Imprint can prove who brought who across artists, because it owns the graph |
| **Decentralized identity export** | DID or on-chain optional layer so fans keep identity even if Imprint shuts down. Strengthens the fan ownership promise |
| **RCR benchmarks by genre and size** | Aggregate Resonance Conversion Rate becomes an industry metric. Owning the metric definition is the durable position |

## The strategic line

**Compete in the blue lane (protocol, score, graph). Sell in the red lane (drops, lists, dashboards).**

Every red-lane feature you ship must reinforce a blue-lane primitive. A drop only goes to fans above a score threshold. A list only includes verified identities. A dashboard only ranks by Resonance, never by raw count. If a feature can be lifted into Laylo without changing Laylo's data model, it is the wrong feature.
