# Spotify OAuth code review

End-to-end manual test requires a deployed app and a real Spotify developer app with the right redirect URI registered. This doc records what the code does, what looks correct, and what to verify the moment you deploy.

## Architecture in code

Two parallel OAuth flows: artist-side and fan-side. They use different scopes, different redirect URIs, and different storage targets.

### Artist flow

- Initiate: `GET /api/auth/spotify` — generates a state token, redirects to Spotify with `SPOTIFY_ARTIST_REDIRECT_URI`.
- Callback: `GET /api/auth/spotify/callback` — exchanges code, persists `PlatformConnection` row with provider tokens, looks up the artist's Spotify Artist ID, writes it to `User.spotifyArtistId`.
- Sync: `POST /api/platforms/spotify/sync` — refreshes the artist's own profile and triggers fan discovery.

### Fan flow

- Initiate: `GET /api/fan/auth/spotify` — gated by `getFanUser()` (fan-portal session), generates state with fan user id, redirects to Spotify with `SPOTIFY_FAN_REDIRECT_URI` and `FAN_SPOTIFY_SCOPES`.
- Callback: `GET /api/fan/auth/spotify/callback` — exchanges code, persists fan-side platform connection, runs sync to compute Resonance against artists with a known Spotify Artist ID.

### Sync engine

`src/lib/spotify/sync.ts` exports two paths:

- `syncArtistSpotifyProfile(userId)` for the artist-own profile lookup.
- `syncFanSpotifyData(fanUserId)` for fan listening signals: top tracks, top artists, recently played, saved tracks, playlists. Computes Resonance via `calculateStanScore`.

## What looks correct

1. Two redirect URIs are configured separately, so artist and fan flows do not collide.
2. State token is generated server-side with `randomBytes` and validated on callback. Defends against CSRF.
3. Fan session is required at the initiate step, so unauthenticated users cannot start a flow that gets attached to someone else's account.
4. Tokens stored encrypted at rest? Check: `PlatformConnection.accessToken` and `refreshToken` are `String?` columns. They are not currently encrypted at the DB level. See "Hardening" below.
5. Scope constants are centralized in `lib/fan-auth/index.ts` (`FAN_SPOTIFY_SCOPES`).
6. Error paths redirect to `/fan/onboarding?error=token_exchange_failed` with a useful query param the UI surfaces. Good UX.

## What to verify on first deploy

| Item | How |
| --- | --- |
| Redirect URIs registered | Spotify dashboard → App settings → "Redirect URIs" must include the literal value of `SPOTIFY_ARTIST_REDIRECT_URI` and `SPOTIFY_FAN_REDIRECT_URI` from your production env |
| Scopes granted match `FAN_SPOTIFY_SCOPES` | Open the Spotify consent screen during a real flow, verify the scopes shown |
| Token refresh works | Wait an hour after first connection, then trigger a sync. The sync helper should refresh transparently |
| State validation | Tamper with the `state` query param on callback, expect a redirect with `error=invalid_state` |
| Listener-to-artist matching | Pick a real artist, set `User.spotifyArtistId`, connect a fan account that listens to that artist. Resonance score should populate |
| Quota handling | Spotify's API limit is roughly 30 calls per 30 seconds for the free Web API tier. Sync should batch and back off |
| Race on first connect | Connect Spotify twice in rapid succession (refresh during callback). Should not duplicate `PlatformConnection` rows |

## Hardening recommended before opening to public beta

1. **Encrypt provider tokens at rest.** `PlatformConnection.accessToken` and `refreshToken` should be encrypted with an app-side key (or stored in a secrets vault rather than a DB column). Currently plaintext. Treat as a known debt.
2. **Webhook for revocation.** Spotify does not webhook on revocation. Add a periodic check: if a refresh fails with `invalid_grant`, mark the connection `EXPIRED` and surface a re-connect prompt to the user.
3. **Tighten the redirect URI.** Currently configurable via env. For prod, lock it to the known canonical host so a misconfigured staging build cannot redirect to a malicious host.
4. **Rate-limit the initiate endpoint.** Spinning up state tokens is cheap; spinning up many per second is a DoS vector against your DB. Use `lib/rate-limit.ts` (already exists for other routes).
5. **Audit log every token exchange.** Capture user id, timestamp, scopes, and a client IP. Useful for fraud investigation later.

## What can be tested without a deploy

- Static unit checks (state generation, scope list, redirect URL builder) are amenable to vitest. None exists today; worth adding.
- `next build` will catch import errors and basic compile mistakes.

## What needs a real deploy and real Spotify accounts

- Token exchange (the OAuth flow itself).
- Real-world latency and quota behavior.
- Listener-to-artist matching against actual top tracks.

Open beta cannot proceed without exercising those three at least once with a real cohort.
