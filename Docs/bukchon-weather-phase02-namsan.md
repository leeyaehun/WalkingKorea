# Weather / Skyline Phase 02 — Namsan Terrain & N Seoul Tower

2026-11-01 · Three.js · WalkingKorea

## Visual objective
Replace the old artificial globe-shaped green hill and stacked cylindrical
tower with a recognizable, proportionally layered Seoul landmark seen above
Bukchon's roofs. Reference imagery shows a forest-covered undulating ridge,
a relatively slender white tower shaft, a wide glazed horizontal observatory,
and a red-and-white tapered transmitting mast.

This is **stylized scene geometry**, not a surveyed digital elevation map,
purchased asset, photograph, or photogrammetric reproduction.

## Implemented
- `src/world/NamsanLandmark.js`: 44 lateral x 5 slope bands create a continuous
  mountain profile instead of intersecting ellipsoid spheres; a low-cost
  faceted canopy band suggests distant evergreen coverage, without re-adding
  plants to streets (user explicitly removed roadside vegetation).
- Radial 16-sided rings form the white tower shaft, observation platform
  and clearly defined deep-blue glazing strip. Vertical division ribs,
  pale white concrete trim and a fine multi-stage red/white antenna make
  the silhouette distinct.
- A nearby secondary slender mast creates distance and a plausible hilltop
  telecommunications profile without overpowering the main tower.
- All terrain/tower vertices are generated in the ORIGINAL shared mesh and
  use the existing day/night shading, fog and shadow renderer. No new
  textures, materials, external API, glTF model, draw call, user interaction,
  plant pot or screen-space sprite.
- Existing stage 01 clear day sky, Bukchon architecture, routes, housing,
  street details and camera controls remain unchanged.
- Existing simple rectangular apartment skyline will be redesigned in
  stage 03, not in this stage.

## Geography/accuracy caveat
The scene's fictional path coordinates place Namsan around x=17,z=158.
The ridge is stylized and exaggerated for visual recognition. Actual
site plan, mountain height, distance and tower proportions do not use
real-world Seoul survey coordinates.

## Acceptance checks
- No original globe-shaped mountain or cylindrical placeholder tower exists.
- Geometric heightfield is finite and continuous; no skyline seam at its
  midpoint.
- N Seoul Tower is visibly distinguished by contrasting narrow shaft,
  blue-glass observation disc, cap bands and tall antenna.
- All 25 houses / 3 paths are preserved; runtime mesh remains within the
  850k vertex budget.
- Cloudflare Node/Vite build and browser screenshot must pass.
- For full observation-deck inspection, aim camera upward while looking
  toward Namsan; a downhill third-person walking view can obscure its tip
  behind the top of the frame.
