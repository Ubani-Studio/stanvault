# Post-Vanity Metrics

Every platform gives artists vanity metrics -- follower counts, stream numbers, like totals. These measure attention, not conviction. Imprint measures what actually matters.

---

## The Problem

Vanity metrics tell artists they have fans. They don't tell artists *who* those fans are, how deep the relationship goes, or whether it's growing. An artist with 100K Spotify listeners and 50 Core fans is in a stronger position than an artist with 1M listeners and zero.

## Imprint's Metrics

### Resonance Conversion Rate (RCR)

The single number that matters. RCR measures how effectively an artist converts casual listeners into Core fans -- the fans who buy merch, attend shows, tip, and eventually hold tokens on Imperium.

**RCR = (Retention × Depth × Reach) / Fade Rate**

This is the moat. No other platform measures this because no other platform has moved past follower counts. Spotify can tell you how many people listened. Imprint tells you how many people *stayed*.

**Components:**

| Metric | What it measures |
|--------|-----------------|
| **Retention** | 90-day fan hold rate. Are fans sticking around? |
| **Depth** | Time to Core. How fast are fans deepening their engagement? |
| **Reach** | Cross-platform presence. Are fans engaging across multiple surfaces? |
| **Fade Rate** | Core loss. How many fans are fading from the pipeline? |

**Interpretation scale:**

| RCR | Rating |
|-----|--------|
| 3.0+ | Exceptional -- audience builds lasting connections |
| 1.5+ | Strong -- most listeners become genuine fans |
| 0.5+ | Moderate -- room for deeper engagement |
| 0.2+ | Below average -- focus on retention and depth |
| < 0.2 | Low -- high fade rate or shallow depth |

### Resonance (0-100)

Individual fan conviction. How deep is *this* fan's relationship with the artist?

| Component | Weight | What it measures |
|-----------|--------|-----------------|
| Platform | 30 pts | How many platforms they engage on |
| Engagement | 40 pts | Depth of interaction (streams, saves, shares, comments) |
| Longevity | 20 pts | How long they've been a fan |
| Recency | 10 pts | How recently they engaged |

### Fan Tiers

Resonance scores map to tiers. The tier system is a monochrome hierarchy -- brightness equals conviction.

| Tier | Resonance Range | What it means |
|------|-------------|---------------|
| **Core** | 75-100 | The real ones. Buy merch, attend shows, evangelize. |
| **Strong** | 50-74 | Engaged and deepening. On the path to Core. |
| **Steady** | 25-49 | Regular engagement but not yet committed. |
| **Faint** | 0-24 | Casual. Might become more, might not. |

### Fan Distribution

The stacked bar showing the breakdown across tiers. At a glance: is the artist building Core fans or accumulating Faint ones? A healthy distribution skews right (toward Core). An unhealthy one is all Faint with no pipeline.

---

## What We Killed

| Vanity Metric | Why it's broken | Imprint replacement |
|---------------|----------------|---------------------|
| Follower count | Measures attention, not conviction | Resonance + Tier |
| Stream count | Passive consumption ≠ fandom | Engagement score (weighted) |
| Like count | Zero-cost action, no signal | Cross-platform Reach |
| Engagement rate | Rewards controversy, not loyalty | RCR |
| Monthly listeners | Churn-blind, no retention signal | Retention + Fade Rate |

---

## Why This Is the Moat

1. **No one else measures Core conversion.** Spotify, Apple Music, YouTube -- they measure consumption. Imprint measures conviction.
2. **The data compounds.** Every fan interaction deepens the Resonance model. The longer an artist uses Imprint, the more accurate the scoring becomes. Switching costs increase over time.
3. **It connects to revenue.** RCR isn't academic -- it directly predicts which fans will convert on Imperium (token purchases, royalty splits). Post-vanity metrics lead to post-vanity revenue.
4. **Artists can act on it.** Knowing your RCR is 0.3 tells you to focus on retention. Knowing it's 2.5 tells you to scale acquisition. Vanity metrics don't give you a next step.

---

## Moments & Attribution

Generic event logs ("Upgraded to Engaged tier") are vanity too. They tell you *what* happened but not *why*. Imprint moments are attributed and, when possible, narrated by the fan.

### Automated Attribution

Every tier upgrade, milestone, or notable event is tied to the content that triggered it. The system identifies the last significant interaction before the threshold was crossed.

Instead of:
> "Sarah upgraded to Strong tier"

Imprint shows:
> "Sarah upgraded to Strong after claiming the Gold Teeth Halo drop"

This gives artists a direct feedback loop: which drops, campaigns, and content actually convert fans? No guesswork. The data tells you what's working.

**Attribution sources:**
- Drop claims ("after claiming [drop name]")
- Campaign engagement ("after responding to [campaign name]")
- Streaming milestones ("after 100 streams this month")
- Cross-platform expansion ("after following on Instagram")
- Email engagement ("after opening 10 consecutive emails")

### Fan Context (Qualitative Layer)

After a milestone moment, fans are prompted with a single optional question:

> "What brought you here?"

One input. No form. No survey. The fan types their answer in their own words. It becomes part of their journey and surfaces in the artist's moments feed:

> *Sarah upgraded to Core -- "been listening since the Lagos show"*

This is qualitative insight no analytics platform provides. The artist learns which *moments* -- not just which metrics -- actually build Core fans.

**Rules:**
- One prompt per milestone. Not every interaction.
- Always optional. Never forced, never a gate.
- Shown only to the artist. Not public, not a comments section.
- No emoji reactions. No likes. Just the words.

**Incentive:** Fans who add context receive a small Resonance bump (2-3 points under engagement). This isn't gamification -- fans who articulate their connection are demonstrably more engaged. The score reflects reality.

### Dashboard Focus

The moments feed defaults to Core-relevant signals:
- Core fans acting (validates the base)
- Strong fans approaching Core (actionable -- the next conversions)
- Attributed upgrades (content feedback loop)

Faint fans following on Instagram is noise. The feed shows what matters and what the artist can act on.

---

## The Conviction Loop

Post-vanity metrics only work if conviction flows both ways. The fan gives conviction. The artist acknowledges it. Without acknowledgment, conviction decays silently -- the fan churns and no one knows why.

### The Loop

```
Fan gives conviction (streams, shares, tips, time)
        ↓
Artist acknowledges conviction (personalized message, unlock, title)
        ↓
Fan deepens conviction (because they were seen)
        ↓
RCR rises (retention + depth velocity increase)
        ↓
Revenue follows (higher RCR = sustainable income, not more followers)
        ↓
Fan gives more conviction (the flywheel spins)
```

The flywheel only spins if the acknowledgment step happens. Every other step is automatic -- fans engage naturally, RCR calculates itself, revenue settles on-chain. But acknowledgment requires the artist to act. Imprint's job is to make that action effortless.

### Fan Incentive

The fan's incentive is not the score. Scores are internal. The fan's incentive is being *seen*.

| Level | What the fan gets | Effort for artist |
|-------|-------------------|-------------------|
| **Acknowledge** | A message when their conviction is noticed: "Your 3.4k streams didn't go unnoticed." | Zero (auto-triggered by moments) |
| **Unlock** | Tier-gated access to drops, voice messages, early releases. The reward is earned, not bought. | Low (set tier gates once) |
| **Name** | A title tied to their action. "3.4k streams" becomes "Marathon Listener." "89 saves" becomes "Vault Keeper." | Medium (define title rules) |
| **Reflect** | A fan-facing profile showing their conviction journey. Not a leaderboard (that's vanity again), but a personal timeline. | Built into the platform |

The lightest win is Acknowledge -- hook moments into campaigns. When a TIER_UPGRADE event fires, auto-queue a personalized message using the reason data from the moment. The fan gets "I see you -- 3.4k streams, that's real" instead of silence. The campaigns infrastructure already exists. It just needs a trigger.

### Why Acknowledgment Creates Revenue

- A fan who feels seen **tips 3-4x more** than one who doesn't
- A Core fan who gets a personal voice drop **shares 6x more** than one who gets a generic newsletter
- Tier-gated drops create **artificial scarcity that's earned**, not bought -- that's the difference between post-vanity and paywall
- Acknowledged fans have **2x longer retention** -- they don't churn because the relationship feels reciprocal

### What Imprint Is Actually Selling

Not analytics. Not CRM. Imprint sells the **proof that conviction matters**.

The artist proves to the fan that their actions were counted. The fan proves to the artist that they're real. Imperium settles it on-chain.

The stack:
- **Palmlion** measures conviction
- **Imprint** proves it was noticed
- **Imperium** makes it worth something (fractional ownership, royalty splits)

Without the acknowledgment loop, Palmlion is just another analytics dashboard and Imperium is just another token platform. The loop is what connects measurement to meaning to money.

### Implementation Status

| Piece | Status | Where |
|-------|--------|-------|
| Moments with reasons | Built | `superfan-moments` component, `buildReason` API |
| Campaigns system | Built | `/campaigns` page, Emissar API |
| Tier-gated drops | Designed | Drop model supports `minTier` |
| Auto-acknowledge trigger | Not built | Wire moments → campaigns |
| Fan-facing profile | Not built | Fan sees their own journey |
| Earned titles | Not built | Title rules from moment patterns |

---

## Principles

1. **If it doesn't measure conviction, it doesn't belong.** Followers are not fans. Streams are not loyalty. Likes are not love.
2. **Every metric must be actionable.** If an artist can't change their behavior based on the number, it's decoration.
3. **Attribution over aggregation.** Don't just count events. Connect them to the content that caused them.
4. **Let fans narrate.** The best insight about why someone became a Core fan comes from the fan, not the algorithm.
5. **Default to Core.** The dashboard, the moments feed, the distribution chart -- everything orients toward the fans that matter most.
6. **Conviction must flow both ways.** If the fan gives and the artist takes without acknowledgment, the loop breaks. Every metric must eventually reach the fan who created it.
