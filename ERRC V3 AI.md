# Imprint ERRC V3 — The AI and Authenticity Lens

Strategic update to ERRC V2 in light of the next five years of music industry pain points: AI flooding, bot-stream fraud, human-fan verification, and the geographic shift to Africa, India, and Latin America.

## The five-year through-line

The music industry is moving from **attention economy to authenticity economy**. Whoever owns the proof of authenticity wins. Imprint's verification protocol is currently scoped to "tier proof," which is the right MVP framing. The next-decade framing is **"human proof"** — verifying that a fan is a real human with real listening intent, not a bot, not an AI, not a paid stream-farm account.

## Music industry pain points

### Now (2026)

1. **Algorithm risk.** Artists rent audiences from Spotify, Meta, TikTok. One algorithm change vaporizes years of work.
2. **Identity fragmentation.** Audience exists as four sealed CRMs (Spotify, YouTube, TikTok, Instagram). No unified view.
3. **Vanity-metric paralysis.** Decisions made on follower counts that mean nothing. 100K monthly listeners and 50 real fans is stronger than 1M and zero.
4. **Creator burnout.** Artists forced to be content creators, social managers, brand strategists. Labor demand killing creative output.
5. **Royalty opacity.** Streaming pays roughly $0.003 per play, reported 3 to 6 months late, gamed by aggregators.

### Next 5 years (2026 to 2031)

1. **AI flooding becomes existential.** Generative AI music already roughly 30% of new uploads. Could exceed 50% by 2030. Royalty pools shrink for humans.
2. **Bot-stream and fake-fan cleanup becomes infrastructure.** DSPs already penalize stream fraud. Every DSP, label, and sync house will pay for verified-human-fan signal by 2028.
3. **Verification becomes the moat for the industry.** Deepfakes, voice clones, AI artists, fake fans, fake streams. Whoever owns the protocol that proves "real human fan with real intent" owns the rail.
4. **Geographic center of gravity shifts.** Africa, Latin America, India become primary growth markets. African music is the fastest-growing global genre. Whoever owns African fan data has the next decade.
5. **Post-streaming economy compounds.** Fan tokens, fractional ownership, direct-to-fan commerce, superfan apps eat the middle ground. New question is not "how many streams" but "who is your real audience and what will they pay for."

## ICP pain points

| Pain | Severity |
| --- | --- |
| "I have fans but I do not know them." | Severe |
| "My superfans cannot prove they are superfans." | Severe |
| "I do not know which content converts fans." | High |
| "Algorithm changes vaporized my reach." | High |
| "Streams pay nothing but my fans tip on WhatsApp." | Severe (African beachhead specific) |
| "I am exhausted from being a content creator." | High |
| "I cannot compare fan health across my roster." | High (manager-specific) |
| "I cannot tell which fans are real humans." | Rising fast (severe by 2028) |

## Does Imprint solve them

| Pain | Coverage | Notes |
| --- | --- | --- |
| Do not know my fans | **Solved** | Resonance plus verified identity |
| Superfans cannot prove status | **Solved** | Verification protocol is the moat |
| Content attribution | **Solved** | POST-VANITY-METRICS attribution loop documented |
| Algorithm risk | **Partial** | Direct messaging reduces dependency, acquisition still rented from Spotify |
| Streams pay nothing | **Out of lane** | Oryx and Imperium own this |
| Creator burnout | **Indirect** | Reduces vanity-metric games, does not fix content treadmill |
| Manager roster view | **Not built** | Strategic gap. High leverage, small build |
| Real-human verification | **Adjacent, unclaimed** | Imprint's protocol could extend here. Currently framed as "verify a tier," should be reframed as "verify the human" |

## Could Imprint do it better

Three specific upgrades, low cost, high leverage.

1. **Claim the human-verification lane explicitly.** Same signed token, broader claim. Positions Imprint for the next-five-year wave instead of just the current cycle.
2. **Ship the manager roster view.** Closes the 100% retention manager cohort gap. Comparative Resonance, RCR, tier distribution across roster.
3. **Anti-bot-stream signal as a future product.** Imprint's verified-human-fan dataset is structurally adjacent to what DSPs and labels need to detect stream fraud. Year-two product, claim the adjacency now.

## ERRC V3 changes

### Add to CREATE

| Factor | What is new |
| --- | --- |
| **Human-vs-bot fan verification** | Reframe public verifier endpoint to verify human-fan, not just tier. Claims the next-decade lane |
| **Manager roster view** | Comparative Resonance, RCR, tier distribution across an artist roster. Closes the highest-retention ICP gap |
| **Stream-fraud signal for DSPs and labels (year 2)** | Verified-human-fan dataset becomes a fraud-detection API for DSPs, labels, sync houses, royalty buyers |
| **Catalog-valuation metric (RCR as CapEx)** | RCR becomes the metric Hipgnosis-style royalty buyers price catalogs against |

### Sharpen RAISE

| Factor | Update |
| --- | --- |
| **Verification protocol visibility** | Upgrade language from "tier proof" to "human proof." Marketing and partner-pitch shift |

The rest of ERRC V2 carries forward unchanged.

## New direct competitor clusters

Three threat clusters surface when zooming out.

| Cluster | Players | Threat shape |
| --- | --- | --- |
| **Stream-fraud detection** | Beatdapp ($20M raised), Pex, Audible Magic | Sell to DSPs/labels today. Could expand into artist-side fan verification. Worth a partnership conversation |
| **Human-artist verification (AI defense)** | Audius, Royal, Catalog, possibly Bandcamp | None has claimed this lane yet. Imprint can land first if it moves now |
| **WhatsApp-first creator tools (African market)** | Klear, Smartcredit, possibly Audiomack creator tools | Could compete on the messaging layer, not the protocol layer |

The biggest strategic risk is not Laylo. It is **Beatdapp expanding from DSP-side fraud detection into artist-side fan verification**. They have the infrastructure, the audio fingerprinting, the DSP relationships. If they pivot, they own the rail Imprint is trying to build.

Defense: ship public verifier and cross-artist graph fast, before any of them claim the lane.

## New TAM (non-customers)

Today's customer (indie artists at $15 per month) is the wedge. Non-customers Imprint could eventually serve are a 100x TAM expansion.

| Non-customer | What they need | What Imprint could sell |
| --- | --- | --- |
| **DSPs (Spotify, Apple, YouTube)** | Clean up AI-generated and bot streams | Verified-human-fan signal as an API |
| **Labels (Sony, Warner, indie groups)** | Due diligence on indie artists before signing | Verified fan-base count plus RCR as scouting metric |
| **Sync licensing (Songtradr, Musicbed)** | Real-audience verification before licensing | RCR plus tier distribution as licensing data |
| **Ticket primary market (Live Nation, AEG, Dice)** | Kill scalpers at scale | Verified-fan presale APIs |
| **Hipgnosis-style royalty buyers** | Real fan-base data for catalog valuation | RCR as catalog-CapEx metric |
| **PROs (PRS, ASCAP, BMI)** | Fraud detection in royalty distribution | Stream-fraud and fake-fan signal |

This is the **Plaid pattern**: pitch the artist-friendly wedge today, become industry infrastructure later.

## Strategic stance

**Expand the ERRC and positioning. Do NOT expand the MVP scope.**

| Layer | Action |
| --- | --- |
| **ERRC doc** | Add the four CREATE items above. Reframe verification to "human-fan." One day of work |
| **Positioning and marketing** | Lead with "human-fan verification protocol" not "fan CRM." Zero build cost, large pitch shift |
| **MVP scope (8 weeks)** | **Unchanged.** Ship the same plan. Validate with real artists |
| **Post-beta roadmap** | Add label intel API, DSP partnership conversations, anti-bot-stream pilot. Year 2 work |

Why this split is correct:

1. Beta validates the artist-side product. Without that, none of the larger TAM matters.
2. Expanded ERRC costs nothing in build time. It is positioning. Changes how Imprint pitches investors, partners, beta candidates.
3. Bigger lane is real, but the wedge is artists. Plaid did not pitch "bank-data infrastructure." It pitched "easy bank login for fintech apps." Then it became infrastructure.

## The one-sentence answer

**Imprint is currently positioned as a fan CRM that survives the next five years. With a small ERRC update and a positioning sharpening, it is positioned as the human-fan verification protocol that defines the next decade of music infrastructure.** Same MVP, different ceiling. Take the upgrade. Then ship the eight-week beta unchanged.
