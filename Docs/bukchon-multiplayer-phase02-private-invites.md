# Bukchon multiplayer — Phase 02 / Private invite rooms

2026-11-01 · WalkingKorea · GitHub + Cloudflare Workers

## Behaviour

- The ordinary **산책 시작하기** button continues to join the first available
  *public* room, eight players maximum.
- **친구와 비공개 방 만들기** makes a cryptographically random v4 UUID on
  the server, then offers a copyable invite URL:
  \`https://<game-host>/?room=<unpredictable-uuid>\`.
- Visiting the URL selects that private room before gameplay begins.
  Clicking the start button connects directly to it. All people with the
  **same exact link** see one another, up to the same 8-player capacity.
- The room menu (♧) works after walking starts. Players may create a new
  private room, copy its link, or switch back to a public room at any time.
- No account, passwords, nickname requirement, text/voice chat, moderation
  input, or persistent room directory is introduced.
- A private room that is full, temporarily unreachable, or disconnected
  **never automatically falls back to a public room**. The WebSocket client
  retries that same private room. Because browser WebSocket APIs do not
  expose unsuccessful handshake status codes, a full room may display
  the same reconnecting status as network trouble.
- The URL is a *bearer capability*: **anyone holding it can enter**, including
  people with whom the link is later forwarded. It is not a strong
  identity-based access control system. The link is reusable, even after
  its last occupant leaves; there is no revocation in this phase.
- An invalid invite token disables the Start button with a clear
  explanation and a way back to public rooms, rather than silently
  placing an invited player with strangers.

## Server

- \`POST /api/walk/private/create\`: same-origin only, server-issued UUID,
  no-store response. Does not persist an account or start a DO yet.
- \`GET /api/walk/join?room=<uuid>\` WebSocket: verifies token shape and
  resolves \`PUBLIC_WALK_ROOMS.idFromName('bukchon-private-v1-'+uuid)\`.
  This namespace is separate *by prefix* from the existing public rooms,
  but deliberately reuses the same \`PublicWalkRoom\` class and DO binding.
  No additional Wrangler migration is needed.
- The Durable Object retains the atomic 8-client capacity check and existing
  location/rate validation, scene updates and hibernation-safe attachments.
  Public capacity matching behavior is unaffected.
- The invite page sets \`Referrer-Policy: no-referrer\`; copied links contain
  only the invite token rather than QA, day/night or other query parameters.
- Cloudflare routing remains \`/api/*\` Worker-first with \`dist/\` static
  assets. Client-side render/gameplay stays local.

## Tests and handoff

Run \`npm run build\` and \`npx wrangler deploy --dry-run\`.
\`tests/bukchon-multiplayer-phase02.test.js\` covers creation and CSRF
constraints, correct UUID validation and link sanitization, private room
namespacing, no fallback on 8/8, two-friend lobby and departure/re-entry,
and UI presence with zero chat/voice elements.

Manual acceptance after deployment: open the same invite on two physical
devices; confirm the two characters are visible in the same room, that
another public visitor is *not* visible, then fill to eight and test a ninth
invitee. Switch to public and verify room peer lists reset cleanly. Test
mobile copy-link permission/clipboard fallback. Automated checks and a
successful Cloudflare build do not establish actual real-device FPS or a
human-observed multiplayer walkthrough.
