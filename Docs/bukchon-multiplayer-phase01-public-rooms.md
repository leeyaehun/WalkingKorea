# WalkingKorea multiplayer — Phase 01: public strolling rooms

2026-11-01 · Three.js/Vite · Cloudflare Workers + Durable Objects

## Scope delivered

- Up to **8 simultaneous WebSocket connections per public room**.
- Public matchmaking tries the first room and fills it; if full it tries the
  next one. Each room is an individual named SQLite-backed Durable Object.
  New rooms are created on demand. The routing scan is currently limited to
  256 rooms (2,048 theoretical concurrent players, **not** a tested load claim).
- No external login; only people who click **Start walking** connect.
- Remote players use the **same illustrated female sprite atlas** as the
  local player. The local movement is authoritative for the visual pose;
  the server validates the main-street lane, speed bounds and message rate.
- Local rendering smoothly interpolates updates. Remote avatars cannot
  block the single navigable lane.
- Presence changes show lobby occupancy beneath the title; disconnect
  removes remote models. The client retries with capped backoff.
- **No public or private text messages, voice chat or chat UI**.
  Private invite-only rooms are reserved for phase 02.
- Day/night lighting, six discoveries, walking and photography are still
  client-local. Night/day choices do not change other players' views.

## Protocol

Endpoint: same-origin \`wss://<host>/api/walk/join\`.
The server checks WebSocket upgrade and request Origin.

Client -> server (at most ~9 sends/sec):
\`{"type":"pose","x":-3,"z":-42,"vx":0,"vz":0}\`

Server -> client:
- \`welcome\`: server-assigned ID, public room number and current peers.
- \`enter\`: another player joins, with initial position.
- \`pose\`: sanitized live position/velocity and the ID assigned by the server.
- \`leave\`: player disconnects.
- \`count\`: current occupancy (1 to 8).

All other client message types are ignored. No room ID, nickname or free-form
user input is accepted from the client. WebSocket attachments survive
Durable Object hibernation without storing walk history. The server sends
no transcript and keeps no accounts.

## Development and QA

\`npm run build\` executes all previous art tests and this phase's tests.
\`npx wrangler dev\` serves the production-style Worker and WebSocket API;
\`npm run dev\` alone starts the **static Vite frontend only**, so the
multiplayer client will correctly show reconnection/offline status.

For real multiplayer acceptance: open the deployed URL in two separate
browser tabs/devices, start both and verify they share a room and see each
other move. Check with eight clients in one room, then connect a ninth;
verify it appears in room 2. Close a tab and check the occupancy drops.
Repeat on a phone and with night mode. Browser/mock tests cannot prove
live WebSocket capacity or real device FPS; perform those checks separately.

## Deployment

The existing \`walkingkorea\` Cloudflare Worker now combines static assets
and Worker \`main\`. Binding \`PUBLIC_WALK_ROOMS\` has a versioned
\`new_sqlite_classes\` migration; preserve it on future deploys.
GitHub/Cloudflare build configuration remains \`npm run build\` and
\`npx wrangler deploy\`.

Do not change the public domain or add Buy Me a Coffee in this phase;
those are scheduled separately after game naming.
