# Public multiplayer — Step 01 / eight walkers per room

WalkingKorea, 2026-11-01. The project remains a browser-first, zero-login
Three.js stroll in one **99m stylized** Bukchon alley.

## Included

- Public rooms, each represented by one Cloudflare Durable Object and capped
  at eight active WebSocket sessions including the local walker.
- The same Worker handles static assets and the /api/walk WebSocket route.
  The first available room is used; when full a new numbered DO is created
  on demand (upper safety limit: 64 rooms = 512 theoretical slots).
  Rooms without players require no active socket processing.
- Room state is the WebSockets' serialized attachments, compatible with DO
  hibernation. A reconnect gets a new short-lived anonymous ID.
- Messages are deliberately limited to the validated position/velocity
  protocol. No nicknames, text chat, voice, database, login or invitations.
- Player movement remains client-side for local responsiveness; server
  validates the single street and plausible speed before broadcasting.
- Same existing illustrated female walker asset and walk animation for
  remote guests; no added playable characters or new roads.
- Keep all local discoveries, night/day toggles, audio, camera and postcard
  functionality. If the WebSocket cannot connect the game remains solo.

## WebSocket protocol

Request: GET /api/walk with Upgrade: websocket, same-origin browser Origin.
Server: {t:"welcome",protocol:1,id,room,max:8,players:[...]}
Server: {t:"join",player:{id,x,z,vx,vz}}
Client: {t:"p",x,z,vx,vz} — sampled every 125ms while moving.
Server: {t:"p",id,x,z,vx,vz} (relayed after validation)
Server: {t:"leave",id}

No generic event relay; unknown packet types and oversized packets are ignored.
No peer-controlled URLs or HTML are rendered.

## Manual acceptance

1. Start two real browsers at the same Worker URL, click Start on both.
   Both should display "2 / 8" and one remote illustrated walker.
2. Move only browser A; browser B should show a smoothly moving, leg-animated
   character. Rotate B's camera and verify sprite facing.
3. With eight independent tabs in one room, the ninth joins room 2, with
   independent player lists. Test exit and room reuse.
4. Reload one player, disconnect the network, and reconnect. Remote guests
   should disappear on leave and return when connected. The local walk must
   not be blocked by a network failure.
5. Verify daytime/nighttime, E, N, P, six discoveries and mobile pad.
6. Verify /api/walk/health, that /api/unknown returns 404 and root static
   assets still load. Compare actual mobile FPS before raising capacity.

## Operational limits

Matching is deliberately sequential across at most 64 named rooms. This
simple first release is not a high-scale lobby: at greater concurrency add a
coordination DO or session directory to avoid walking many full rooms.
WebSocket connection occupancy is checked *inside* each room DO, avoiding
overfill races. This code does not claim to have been load-tested to 512
simultaneous clients. Server billing depends on actual messages and duration.
Private invitation rooms and any chat features are explicitly outside Step 01.
