# Weather / Background Step 05 — Warm inhabited Seoul night lighting

2026-11-01 · WalkingKorea · Three.js + Cloudflare

## Goal

Night should feel like a **lived-in Bukchon alley** rather than daylight tinted dark.
Keep the Stage 04 deep blue sky, crescent and sparse stars, but introduce
physically placed warm light accents and locally brighter ground and wall
surfaces. Retain daytime colors and every street / housing position.

## Actual implementation

- **25 small wall lantern sconces**, one per hanok, modeled as a bracket,
  small covered paper lantern and roof. Existing hanging lanterns from
  earlier architectural work also emit at night.
- **3 restrained black street lamps** at authored positions along the main
  route. All are outside the walkable road including branch intersections.
- **House-specific paper window light**: some houses are dark, some show
  warm interior light through the existing wood-frame lattice windows.
- **39-building distant city**: a fixed uneven set of warm and cold glowing
  apartment windows; same original daytime glass color, no full lit grids.
- **Local warm illumination on actual street and wall fragments**:
  8 nearest fixtures are passed as vec4 positions/radius into the ORIGINAL
  shared world ShaderMaterial. Per-fragment analytical radial attenuation
  brightens actual paving, nearby wood and stone, and softens at distance.
  There are **no extra scene PointLights or shadow maps**, so these lights
  do NOT produce physically cast dynamic shadows. Existing daylight
  directional shadows are preserved.
- **Emission vertex attribute** identifies apartment glazing, hanji,
  lantern cores and shop glass. Emission bypasses ambient surface shadow
  but respects the existing distant fog.
- House lamps always have geometric housings. At day, both windows and
  glass keep their original material appearance; night emission is applied
  only under `uNight`.
- Light positions are fixed and collision-independent; nearest 8 positions
  only update after the avatar travels >1.5m or switches night/day.
- Expected world size under the 850k vertex acceptance budget, with no
  new vegetation, image downloads, animation loops, WebGL draw calls or
  external lighting assets.

## QA

- Day: `/`; existing sun and moonless blue atmosphere unchanged.
- Night: `/?night=1`; inspect first 40m paved lane and paper window glow.
- Skyline: `/?night=1&view=namsan`; inspect staggered apartment lights.
- Tests check counts, safe road offsets, emission classes, complete scene
  geometry, local light pool update and night/day disable state.
- Browser screenshots in day and night should verify warm pools and distant
  city lighting, and guard against white-glowing roofs or bright wash.
- The Step 06 cross-device QA still needs *real* mobile GPU frame timing.

## Boundary

Step 05 does not redesign sky / Namsan / housing / apartments,
add props unrelated to light fixtures, or bring back any potted plants.
