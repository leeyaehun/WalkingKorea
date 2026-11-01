# Bukchon main-street reconstruction — Step 01 / One walkable corridor

2026-11-01 · WalkingKorea / Three.js / Cloudflare

## Goal & scope
Replace the multi-route fictional maze with ONE walkable main Bukchon lane
so the next steps can concentrate assets and manual architectural work
along a single recognizable street, rather than diluting them across side
streets. The provided photos are art direction for the eventual
Bukchonro 11-gil look. **No claim of map-accurate GPS road tracing**.

## Implemented
- Only one road centerline (z -44 to +55, current stylized soft curves)
  remains. A shared `BukchonMainStreet.js` definition drives the world
  and the HUD discovery list.
- Removed two branch road centerlines, their polygonal pavement,
  off-road houses, decorative standalone retaining walls, and alternative
  walking collision corridors. The remaining road has continuous
  pavement and matching movement collision width.
- 8 deliberately authored hero hanoks remain near the upper scenic
  40m; 10 district houses remain along the lower main street, for 18
  existing homes total. The 7 houses that belonged only to branches
  and their attached house lights are removed.
- Updated the six optional discovery locations to positions on the
  single walkable route. A new browser-local save key avoids applying
  out-of-route discoveries stored by the previous 3-lane experience.
- One minimap polyline, not the former 3-route graph. Female player,
  walking, WASD, camera, day/night, Namsan, skyline, screenshots and
  lighting remain active. No plants or planter art is reintroduced.
- Legacy multi-route regression assertions were updated to test the
  new one-road requirement. A dedicated regression suite tests that
  former east/west shortcuts are now inaccessible and every discovery
  is reachable.

## Known remaining visual gaps (intentionally deferred, not solved)
- Step 02 — refine road alignment, slope, pavement and overall width
  against Bukchonro 11-gil visual references; current main centerline
  is still a stylized approximation.
- Step 03 — fill two former branch openings near z=-14/-24 and other
  between-house voids with properly oriented houses / gates / brick walls.
- Step 04 — unify asphalt, edge stones, house thresholds and small
  patches so no raw terrain is visible from playable camera angles.
- Step 05 — polish downhill Namsan view, roof rhythm, day/night balance,
  final integrated browser QA and mobile device benchmark.

## QA
- One graph path, continuous samples and the entire path rendered.
- Old side-road positions must be off the collision road.
- All six in-world discovery points accessible.
- Geometry attributes finite, no more than 850k non-indexed vertices.
- Cloudflare Build (Node tests and Vite), deployed-browser screenshot
  of start and lower main street required; mobile real-device FPS not
  inferred from the build.
