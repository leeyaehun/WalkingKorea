# Bukchon Art Direction — Phase 05 / Lived-in details

This stage adds human-scale Korean residential alley details to the existing
Phase 01–04 40m showcase street. It does **not** add more homes, change lane
geometry, redo materials, or alter the camera/input/shadow system.

## Spatial placement rules

- Details must be attached to a house facade or authored overhead wire
  crossing, rather than using per-frame or per-load random scattering.
- House signs are short **fictional** poetic names (솔향, 온기, 새봄, 다온).
  They are not real addresses, do not imply an actual residential building,
  and must not display names or private addresses of residents.
- Front steps are physically beyond the carriageway edge. Nearest outer
  step is 9cm or more past the road half-width at the tightest showcase site.
  Existing road walk/collision is untouched.
- Meter boxes sit on the street-facing wall wings; rain pipes attach to the
  side walls; pots sit beside facades away from entrances.
- Only two understated crossing-wire locations; poles are 4.12m from the
  centerline and lines remain more than 7m above world origin at their lowest.
  Do not block the view at branching roads with new ground objects.
- Two benches and two clustered onggi storage areas are tied to specific
  houses instead of duplicated on every street corner.
- Existing paving's drains and stone kerbs remain unchanged; avoid a second
  duplicate drain generator.

## Implementation
- `src/world/BukchonStreetLife.js`: deterministic house-attached facade
  props and two high street wire crossings. Shares the existing
  `box`, `cylinder`, `sphere`, `face`, and `textured` primitives.
- `src/world/BukchonWorld.js`: four fictional sign atlas tiles and one
  street-life build pass after houses and frontage assembly.
- `src/main.js`: exposes counts through the existing opt-in `?qa=1`
  telemetry, not in the normal UI.
- `tests/bukchon-street-life-phase05.test.js`: placement, count, curb clearance,
  deterministic geometry and original shader/scene invariants.

## Review criteria
The beginning of the scenic street should feel occupied and functional,
without stalls of props or colorful clutter. Look closely at the first
house's threshold and nameplate, rain pipe and planter groups; walk downhill
to inspect two wire crossings. Existing character movement must still work.
The district is a stylized reconstruction, **not** a precise street survey.

## Next task, Phase 06
Scale the *approved* geometry, layout logic, materials, lighting and prop
language to the remaining village, with performance and LOD review.
