# WalkingKorea — Multiplayer Phase 03: stability and live WebSocket acceptance

2026-11-01 · Branch: \`feature/bukchon-multiplayer-03-stability-20261101\`

## Changes

- **Private 8/8 status is now visible**. Browser WebSockets cannot read an
  HTTP 409 failed-upgrade reason, so full private rooms briefly accept a
  separate, **untracked** socket, send \`room_full\` and close it. The eight
  actual room members are not affected. Private guests keep retrying the
  *same invite*, at least 15 seconds between attempts, without joining public.
- Public room 8/8 continues responding HTTP 409 *only to matchmaking* so
  the ninth public walker joins the next available public room.
- **App heartbeat**: send \`{"type":"ping"}\` every 15 s when the game is
  connected and foregrounded. Server answers \`pong\` only to that socket;
  it rate-limits responses and does not broadcast or persist heartbeats.
- **Mobile resume and stale sockets**: watchdog checks every five seconds;
  socket that hears nothing for 45 seconds is closed and retried with
  exponential backoff (up to 20 seconds). A stuck handshake is closed after
  14 seconds. On returning to an active tab or network reconnect, the client
  checks the socket and reconnects or pings as needed; no false timeout while
  the browser is backgrounded. Timers/listeners are cleared on \`stop\`.
- Disconnects, errors and room switching dispose the remote 2.5D character
  resources and clear previous peers. Server socket errors close the socket;
  duplicate close/error events never double-send a "leave" event.
- **Mobile GPU/network efficiency**: all 1–8 illustrated female characters
  reuse *one* shared pair of decoded walking sprite atlas images; each walker
  still has an independently animated canvas/texture. Remote sprite heading
  and walk animation now use validated network velocity, avoiding incorrect
  backward-facing walk cycles during interpolation.
- Single Bukchon main street, local WASD/mobile controls, low-load day/night,
  camera, six discovery spots, and zero-chat / zero-voice design unchanged.
- This phase does not modify URL, game name, or any payment/donation system.

## Automated acceptance

The ordinary \`npm run build\` includes the existing suites plus
\`tests/bukchon-multiplayer-phase03.test.js\`, checking heartbeat rate-limit,
idempotent disconnect, mobile sleep/restore, full private room and resource
sharing. The production Worker bundle is validated by Wrangler dry-run.

**Real local Worker WebSocket test (not just mocks):**

\`\`\`bash
npm install
npm run build
npm run test:multiplayer:integration
\`\`\`

The integration script starts a local Cloudflare \`wrangler dev\` with
SQLite-backed Durable Objects, then opens actual Node 22 WebSocket clients:
- Eight public players join room 1; ninth joins public room 2.
- One player's pose is delivered to a roommate and \`ping\` receives \`pong\`.
- Disconnect frees a seat; the next player joins room 1.
- Eight private invitees share the same room, but a different token sees
  nobody from their room.
- Ninth private invitee receives \`room_full\` without joining public.
- Private motion remains isolated; disconnect and rejoin restores presence.

GitHub \`.github/workflows/build.yml\` runs this against a real local
workerd before changes can be considered ready for production.

## Manual checks that cannot be claimed from CI

Even live local WebSocket integration is not a real phone test:
1. Open the deployed game on two separate computers/phones, start walking
   and verify real animated movement, mutual visibility and counts.
2. With eight real tabs/devices in an invite room, confirm ninth shows
   "정원이 가득 찼어요"; after one leaves, check ninth eventually enters.
3. Suspend a phone (switch apps/lock screen) long enough to interrupt the
   socket, return, and verify the avatar peers recover automatically.
4. Switch from private to public and back, including day/night and touch
   joystick. Watch RAM/FPS and pay attention to touch controls/overlays.
5. Test poor/airplane-mode network and browser reload. Record actual
   device models, browser versions and server logs.

**Limitations:** No server-side account or private room ownership,
invite revocation, voice/text chat, or persisted player positions. Link
holders can still enter the private room; full rooms are never bypassed.
