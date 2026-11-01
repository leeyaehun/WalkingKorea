# WalkingKorea C — Bukchon 7-gyeong loop road (November 1, 2026)

A stylized game-road extension, **not** a surveyed reconstruction of Gahoe-dong.

- The original 99m 5/6-gyeong road is completely preserved in paths[0].
- A narrow 2.56m west-side 7-gyeong residential lane branches at
  approximately z=+1.5, arcs northwest of the existing hanok roofs,
  and rejoins the upper main-road overlook at z=-44.
- All segments follow the same terrain height, are closely sampled,
  and use the existing granite/stone paving and nighttime shader.
- Real low stone/brick/plaster enclosing walls line the new alley. Both
  junctions stay open; the original west-frontage has exactly one reserved
  gap at the branch mouth.
- Client movement/collision, minimap, and server-authoritative 8-player
  WebSocket road validation all use the same pair of walkable routes.
- The remaining terrain outside the two paths is not walkable.
- No new house types, character models, map regions, chat, domains, or
  Buy Me a Coffee features in this milestone.

Unit QA: npm run build. Existing live local WebSocket integration
from multiplayer Phase 03: npm run test:multiplayer:integration.
Cloudflare deploy: npx wrangler deploy (after successful CI review).

Manual QA required: walk clockwise/counter-clockwise and look for curb
seams or facade overlaps at both junctions, visit the narrow section on
a phone, and test two avatars in the 7-gyeong loop at the same time.
Real physical device FPS and photographic accuracy are not established
by automated checks.
