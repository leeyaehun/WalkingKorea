# Bukchon — Phase 06 / Full district propagation and vegetation removal

2026-11-01 · Three.js + Cloudflare Worker

## User art correction — remove all temporary potted plants and vegetation

- All spherical fake shrubs, flower blobs, trellised blossoms and plant pots have been removed from **HanokKit**, including A01, courtyard/gate, open-front and cafe variants.
- Phase 05's 19 potted plants have been **deleted**, not replaced with differently styled pots. No house planters are generated anywhere in the 25-house village.
- The scattered trees and ornamental bushes from `laneDecoration` are also gone; local terrain now uses subdued stone colors rather than bright green lawns.
- The abstract far-distance Namsan hill silhouette remains as a landscape backdrop; it is **not** a near-house shrub or gameplay plant.

## Phase 06 — first-street production rules applied citywide

- Eight curated scenic residences remain unchanged in placement. On the other routes, 17 houses now use the same level foundation pads and street-facing gates, rather than warping the roofs to the slope.
- All 25 homes retain common curved giwa roofs, red brick, granite and lime plaster material language, timber gates, sun-cast shadows and the same stylized camera.
- Existing house variants retain **roof colours and architectural joinery**; removal of flowers does not remove tile styles, patterned lattice or timber lanterns.
- Three new real 3D wall connectors join appropriate houses farther down the main route. The two original branch junctions remain open. No walls are allowed to cross another road.
- Phase 05 architectural accents (thresholds, fictional house plaques, gutter downspouts, meters, benches, onggi and overhead wires) now apply to the rest of the district, with no potted plants.
- Cafes preserve their shop signs and do not get fake residential doorsteps or nameplates.
- Existing paths and keyboard, camera, avatar, sounds, discoveries, night/day controls and mini-map are preserved.

## Geometry budget / performance

- The first 8 flagship houses use the original `hero` roof subdivision.
- Houses outside the authored scenic street use a lighter `district` roof profile (12x7 underlying tile grid, 8x6 variant overlay instead of 16x9 and 12x9). This is **build-time geometry LOD**, not runtime distance swapping.
- Shared non-indexed world mesh stays one rendering object with the existing GPU materials and sun shadow map.
- Predeployment generated world: **25 homes, 17 district homes, 3 routes, ~724k vertices**, compared to ~899k before the vegetation removal and district LOD. Actual memory/GPU FPS still requires device QA; a successful static mesh test is not proof of mobile speed.
- The shadow map remains 2048 desktop / 1024 touch with distance-triggered updates as implemented in Phase 04.

## Acceptance tests

- No pot/plant generator or fake roadside trees remains.
- House gates on every route stay beyond the roadway and no frontage wall cuts a junction.
- All detail counts and vertex attributes are finite and consistent on reload.
- Under 850k single-mesh vertices; first street stays fully detailed, remote buildings use lower cost.
- Node tests, Vite build, Cloudflare deployed version and screenshot QA must be checked separately.

## Follow-up art decisions

The game still has a stylized procedural low-poly appearance. Achieving Coastal World-level authored forms may require handcrafted roof-wood/stone textures and more carefully modeled house archetypes. Do not reintroduce pots until a deliberate visual design is approved.
