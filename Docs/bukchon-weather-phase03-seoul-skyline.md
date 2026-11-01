# Weather / Background Step 03 — Seoul Urban Skyline

2026-11-01 · WalkingKorea · Three.js / Cloudflare

## Design brief
The first two background steps established a clear blue sky and a
recognizable Namsan/N Seoul Tower 3D silhouette. Previously, 57 almost
identical cuboids in three straight rows made Seoul look like an untextured
apartment wall and hid the mountain.

Reference direction: the Bukchon overlook juxtaposes traditional hanok
eaves, varied modern concrete and glass buildings, and N Seoul Tower.
**This is a stylized fictional arrangement**, not georeferenced architecture.

## Implementation
- `src/world/SeoulSkyline.js` builds **39 different structures** in three
  staggered depth layers (15 near, 14 middle, 10 far):
  - 15 pale concrete residential slab apartments with **real projecting 3D
    balcony shelves and rails**.
  - 7 subdued glass offices with vertical window mullions.
  - 17 smaller mixed-use blocks creating the stepped lower city edge.
- Every building has differing height, width, facade width rhythm and
  deterministic window color variation. Distant rows use lower-density
  window grids, without LOD pop-in.
- Layered flat roofs gain rooftop stairwell/lift housings, AC cabinets,
  podium trims, parapets and visible glazing. Windows are desaturated
  blue grey rather than arbitrary colorful neon rectangles.
- Preserve a lower irregular skyline around the sightline from the upper
  Bukchon lookout to the N Seoul Tower. The nearby city remains visible
  but does not form a tall concrete wall across the mountain.
- New surfaces use the same single world BufferGeometry with the existing
  color-material/shadow shader. Concrete gets the Phase 03 subtle plaster
  grain; glass is muted rather than falsely emissive. **No new light sources**.
- This step does NOT add plants, roads, housing, move the player, or change
  Namsan geometry or the blue sky.

## Performance and testing
- Static generated scene: 25 hanoks, 39 urban backdrop structures, ~803k
  vertices, under the 850k city budget (prior build ~720k).
- 1,081 window panels, 144 balcony pairs, 188 rooftop elements.
- No additional meshes/draw calls or external models.
- The distance layering is static build-time detail; this is not
  a fully dynamic runtime LOD system. Actual mobile frame-time testing
  remains essential.
- Automated tests cover horizon height variety, Namsan sightline gap,
  finite shapes, the 850k vertex budget, material continuity and existing
  street/landmark invariants.

## Acceptance criteria
From upper lookout with `?view=namsan`, roofs should frame a believable
multi-layer city with the landmark still legible. Buildings should not
look like 39 duplicated cubes: balconies, windows, vertical slab lines,
height variety and rooftop enclosures should break up the profiles.
From the normal walking pitch, the city should be a quiet background.

## Remaining background-weather schedule
4. Deliberately designed night sky
5. Warm on-street lamps, apartment window light and ambient night readability
6. Day/night, mobile performance and final integration
