# Bukchon Art Direction — Phase 01 / Street composition

Scope: upper 40m of the existing walking route, not an exact surveyed Bukchon map.

## Design targets

- Viewed from the high start point, two offset hanok rows frame the descending main lane.
- Main asphalt lane varies gently from 3.35m at junctions to 2.95m midblock.
- Local upper grade adjustment adds 1.35m at the lookout and blends out without a hard height seam; net sample descent approximately 4m over the 40m.
- Eight hand-placed sites replace automatic houses **only in the first 40m**. Rooflines alternate; blank corridors remain at the two side-road junctions.
- All scenic homes sit level on simple foundation pads rather than deforming each wall vertex with the hill profile.
- Collision, road mesh, and minimap keep sharing the same primary walkable routes. Decorative house models, textures, shader, lighting, UI and avatar behavior remain unchanged.
- Existing lanes and discoveries outside this design slice remain.

## Ownership

- `src/world/BukchonStreetLayout.js` — width, grade, curated house sites
- `src/world/BukchonWorld.js` — applies the route shape and house positions
- `src/world/BukchonPaving.js` — samples lane width at each paving segment
- `src/main.js` — uses identical width function in player collision
- `tests/bukchon-street-composition.test.js` — invariants

## Follow-up boundaries

Phase 02 is **building silhouette & structure**: roofs, gates, continuous walls, true stepped foundations. Phase 03 is materials/textures; Phase 04 is lighting/shadows. Do not confuse these with Phase 01 composition.

## Review

Use the currently deployed Cloudflare build from the upper outlook. Compare view from spawn, 10m, 20m, and 35m downhill. Judge road-to-front-wall gap, visible junctions, skyline gap and walkability; code/CI tests alone do not establish visual approval.
