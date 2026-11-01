# Weather improvements — Step 01: clear daytime sky and atmosphere

2026-11-01 · WalkingKorea / Three.js / Cloudflare Workers

## What changed

- The existing peach-pink horizon and hazy purple-blue sky were replaced
  with an intentionally **clear Seoul daytime palette**:
  - pale azure #D4E9F6 at the horizon;
  - airy blue #91C9EF in the middle atmosphere;
  - clean, deeper blue #4E9BDC overhead.
- The old vertex-colored 3D sky sphere is replaced by a single
  camera-centered `ShaderMaterial` dome. Five sparse, feathered procedural
  high-altitude cloud wisps are shaded on that dome: **no extra cloud meshes,
  texture downloads, or draw calls**.
- The ten large low-poly white cloud blobs formerly placed behind Namsan
  were removed so the skyline does not resemble floating white blocks.
- Distant **day** atmospheric color moves from muddy grey-brown to pale
  cool blue, matching the new horizon. Fog still begins only at significant
  distance and does not obscure nearby architecture.
- The previous night palette is intentionally retained by recomputing
  its exact old horizon/zenith/tint values. Night lighting, street lamps,
  skyline, apartment geometry and Namsan Tower are **not** modified.
- The 25 existing hanoks, three paths, avatar controls, shadow-map,
  materials and Phase 06 vegetation removal remain unchanged.

## Files

- `src/world/BukchonSky.js`: daylight palette, procedural cloud wisps,
  night-sky fallback and camera-follow update.
- `src/main.js`: replace old sky sphere and drive daytime/cold-night fog.
- `src/world/BukchonWorld.js`: remove crude cloud sphere meshes and blend
  day/night atmospheric fog strength at the existing shader location.
- `tests/bukchon-weather-sky-phase01.test.js`: palette, cloud shader,
  night preservation, update and scene invariants.

## Acceptance

- From the spawn viewpoint the sky is blue, not peach or grey;
  the atmosphere is clear but not a flat neon-blue fill.
- A small number of pale cloud wisps add softness without obstructing Namsan.
- The dark evening sky is not unintentionally converted to daylight colors.
- No loss of Hanok geometry, street movement or original sunlight/shadow mapping.
- Node tests and Vite/Cloudflare build pass. Screenshot is a visual check;
  mobile daytime/night switching still warrants real-device testing.

## Next steps (not included)

02 Namsan terrain & tower silhouette
03 Seoul apartment architecture
04 separate nighttime sky treatment
05 street/window/city night lights
06 performance and cross-scene integration
