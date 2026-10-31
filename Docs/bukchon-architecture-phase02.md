# Bukchon Art Direction — Phase 02 / Building silhouettes & structure

Based on Phase 01's authored 40m street layout. No texture or lighting redesign.

## Problem fixed

The previous gabled house roof was essentially a flat two-sided roof plane and each front gate had a rectangular shelf instead of a canopy. Side walls were extremely simple blocks and some houses had no real portal; adjacent homes read as detached props. Another directional bug was found in the street composition: positive-x rotation for a local -Z vector was reversed. The gate-facing tests also encoded this wrong sign.

## Structural changes

- Every hanok type now has a four-corner hipped roof profile with a shorter ridge, visible deep edge fascia and soffit, repeated substantial rafters, raised hip ribs and ridge end caps.
- Entrance gates use two physically pitched roof planes and visible supporting timber brackets, not a single flat rectangular roof.
- Street walls gain a ridge-and-two-slope tiled coping. Long courtyard side walls also get a continuous pitched coping.
- Open-porch archetypes use a real open timber entrance with two front wall wings instead of two tiny end blocks.
- Exactly three narrow, sloping facade connectors now bridge adjacent same-side houses in the upper street, preserving east and west side-road junction gaps.
- Replace the oversized upper-house stone plate with a narrower foundation and front skirting.
- Correct both scripted and authored house orientation math so each true local -Z gate faces the road.

## Technical constraints

- Preserve existing renderer, toon palette, shader, camera, minigame/avatar state, route and interaction data.
- Procedural deterministic Three.js mesh geometry only. No external images, no Blender, no purchased content.
- `src/world/BukchonArchitecture.js`: roof, gate and wall 3D geometry
- `src/world/BukchonFrontage.js`: connected street-side wall bridges
- `tests/bukchon-architecture-phase02.test.js`: roof height profile, real pitched gate canopy, frontage and finite geometry
- Existing road geometry and collision remain unchanged.

## Art gate before Phase 03

At upper overlook, ensure roofs dominate the wall mass rather than seeming like floating dark tiles; the wall/courtyard edge reads as one street; the gabled entry roof, real timber bracket depth and architectural roof silhouette are recognizable. Phase 03 must address wood/plaster/stone/tile surface quality and UV textures. Phase 04 addresses depth via actual shadows and contact occlusion; this phase cannot manufacture realistic shadow casting within the existing one-shader renderer.
