# Signal API Plan

Connector strategy for Imprint. What feeds Resonance, in what order, and at what weight.

## Decision principle

Two questions, asked of every platform:

1. Does the API expose data Resonance can use?
2. How hard is access?

Not all platforms are equal on either axis. The connector list is not a wishlist, it is a signal model.

## Verdict per platform

| Platform | API access | Data exposed | Verdict | When |
| --- | --- | --- | --- | --- |
| **Spotify** | OAuth, mature | Top tracks, top artists, recent listening (fan consent). No top-listener identity to artist | **v1** | Already wired |
| **YouTube** | OAuth, mature | Subscriptions, watch history, comments (with consent). Artist Studio data for own channel | **v1** | Already wired |
| **Discord** | OAuth, mature | Guild membership, roles | **v1** | Already wired |
| **Email** | ESP integrations | Open, click, list source | **v1** | Stub exists, finish import for Mailchimp, ConvertKit, Beehiiv |
| **WhatsApp** | Meta Cloud API | Direct messaging, delivery and read receipts | **v1** | Critical for African beachhead per Connect strategy |
| **Apple Music** | MusicKit OAuth, mature | Top songs, playlists, library (fan consent). No top-listener identity to artist | **v2** | Mirror of Spotify, copy the implementation |
| **Boomplay** | Partner-only, gated | Strong analytics for artists in Boomplay for Artists. No public OAuth | **v1 manual CSV import. v2 partner API** | Strategy doc already says this |
| **Audiomack** | Limited dev API | Artist analytics, weaker fan OAuth | **v1 manual CSV import. v2 partner integration** | Same shape as Boomplay |
| **Instagram** | Meta Graph plus Basic Display | Fan OAuth gives followed accounts and own posts. Cannot read engagement on artist's posts at fan-level | **v2 fan-side OAuth only** | Weaker signal, do not over-promise |
| **TikTok** | Developer API plus Login Kit | Fan OAuth gives followed accounts and own videos. Sounds-used data partial | **v2 fan-side OAuth only** | Weaker signal, same caveat |
| **SoundCloud** | Mostly closed since 2014, partner-gated | Insights dashboard shows top-listener usernames to artist (uniquely good). API access slow and silent | **v1 manual CSV import. v3 partner API** | Genre fit is wrong for African beachhead. Strong for US/UK underground hip-hop and electronic |
| **Bandcamp** | Limited | Commerce data, fan profiles | **v3** | When commerce signal becomes interesting |

## Why not add them all at once

Three structural reasons.

**One: signal quality is not equal.** Streaming platforms measure time spent. Social platforms measure cheap actions like a follow or a like. If a TikTok follow weights the same as a thousand Spotify streams, Resonance becomes meaningless. Each connector is a model question, not an integration question.

**Two: API friction varies wildly.** Spotify, Apple, YouTube, Discord OAuth are quick. Boomplay, Audiomack, SoundCloud require partner conversations. Instagram and TikTok require Meta and ByteDance app review, which is slow and gets stricter every year. Adding all of them in v1 means none of them work well.

**Three: the moat is the protocol, not the connector count.** Every connector is plumbing, not a moat. Spotify plus YouTube plus Discord plus Email plus a verified token already covers more fan reality than Laylo's entire product. More connectors deepen Resonance precision over time, but they do not unlock a new lane.

## Resonance signal weighting

Each connector feeds Resonance with a weight that reflects its actual signal quality.

| Source class | Weight | Why |
| --- | --- | --- |
| **Conviction** (Oryx tips, drop claims, presale buys) | Highest | Money and committed action |
| **Listening** (Spotify, Apple, Boomplay, Audiomack, YouTube Music, SoundCloud) | High | Time spent, hard to fake |
| **Direct** (Discord role, Email open and click, WhatsApp delivery) | Mid | Opt-in, low effort, repeatable |
| **Social** (Instagram follow, TikTok follow, video like) | Low | Cheap, easy to gamify |

If a connector cannot increase signal quality at the right weight, it should not ship.

## Phasing

### v1 (now to beta, by week eight)

- Spotify, YouTube, Discord, Email (already planned and partially wired)
- Boomplay, Audiomack, SoundCloud manual CSV import (one form, one parser, one weekend)
- WhatsApp Business API for messaging (Meta Cloud API direct, not Twilio)

### v2 (post-beta, three to six months in)

- Apple Music fan OAuth (Spotify mirror, low-cost addition)
- Instagram fan-side OAuth (followed-accounts signal only, low weight)
- TikTok fan-side OAuth (followed-accounts signal only, low weight)
- Boomplay and Audiomack partner API once volume justifies the conversation

### v3 (year two)

- SoundCloud partner API once US and UK underground markets are a focus
- Bandcamp when commerce data becomes interesting
- Apple Music for Artists API if Apple opens it further

## The one-line position

Add Apple in v2 because it is free signal. Add Instagram and TikTok in v2 with low weight because they are weak signal. Do Boomplay, Audiomack, and SoundCloud as manual CSV in v1 and proper API in v2 or v3. Never let "more connectors" become the roadmap.

**Resonance with four good signals beats Laylo with one. Resonance with twelve bad signals beats nothing.**
