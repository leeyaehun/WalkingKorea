# Bukchon Art Direction — Phase 03 / Surface material system

The first 40m street and Phase 02 roof/gate/retaining-wall silhouettes stay fixed.
This phase is about identifiable surfaces rather than extra props or new lights.

## Material language
| Surface | Readable characteristic | Implementation |
| --- | --- | --- |
| Charcoal giwa | weathered slate variation, glaze streaks, muted cool grey | GPU procedural texture |
| Old timber | directional wood fibres and warm dark resin lines | GPU procedural texture |
| Lime plaster | soft warm mineral clouding and a fine sand grain | GPU procedural texture |
| Granite and paving | salt-and-pepper aggregate and subtle stone mottling | GPU procedural texture |
| Terracotta brick | fired-clay pores and uneven firing patina | GPU procedural texture |
| Asphalt | fine irregular bitumen aggregate, no fake grid | GPU procedural texture |
| Hanji paper | restrained warm fibre variation | GPU procedural texture |

No external photos, purchased materials, texture downloads, shader packs,
or extra materials/draw calls were added.

## Architecture
- `src/world/BukchonMaterials.js`: pure surface class mapping, planar UV
  projection and a single reusable GLSL library.
- `src/world/BukchonWorld.js`: emits `materialId` float and
  `surfaceUV` vec2 attributes for every triangle in its existing
  shared BufferGeometry. Sign atlas remains unchanged.
- Shader samples the ORIGINAL colour/label atlas first, applies a bounded
  material-specific RGB finish, then uses the original day/night and distance
  haze calculation. This is a procedural *appearance* texture, not a PBR
  roughness/normal map.
- Local metres control pattern scale, including rotated houses. Material
  grain falls off with distance to mitigate aliasing/shimmer on mobile.

## Review criteria
- In the upper-lane view, roof, brick, lime and granite have distinct
  surface character rather than looking painted in flat primary colours.
- Viewed close-up, old timber grain follows a plausible local direction.
- The mini-map/labels remain readable and intact.
- Three roads and playable avatars work unchanged.
- GPU performance is still acceptable on a phone.
- Phase 04: actual direct lighting, contact occlusion, cast shadows and
  tone mapping. Phase 05: drains/cables/planters/lived-in props.
