# Main Bukchon Alley — Step 02 / Photographic road shape and grade

2026-11-01 · WalkingKorea · Three.js / Cloudflare

## Reference-based intent

Real Bukchon-ro 11-gil photographs, Seoul official hanok walking guides,
and publicly captioned Commons photos show an extended narrow lane:
dark asphalt between thin pale granite kerbs and close-set traditional
roofs, gently bending but fundamentally reading as ONE straight,
visibly descending corridor toward the Seoul skyline.

This is a deliberate **99m playable compression and photo-guided art
reconstruction**. It is NOT GPS-traced geometry, a surveyed real-world
street map, an exact house-site reconstruction or a claimed precise
real street width/slope in meters.

Useful reference sources:
- Seoul city official Bukchon preview:
  https://hanok.seoul.go.kr/front/util/bcgPreview.do?bpvLang=ENG
- Seoul Metropolitan Government Gahoe-dong hanok alley:
  https://world.seoul.go.kr/service/amusement/traditional-culture/hanok-village-walking-tour-map/
- Wiki Commons Bukchon-ro 11-gil 02, 2019 street photograph:
  https://commons.wikimedia.org/wiki/File:Bukchon-ro_11-gil_02.jpg

## Implemented in this step

1. The main centerline's unnatural -5.5/+0.5 x zigzags were replaced
   with a nearly straight, very softly offset 99m photographic corridor.
   The road's entire horizontal shift is only ~2m, retaining a slight
   live-in village bend rather than a mechanically perfect ruler line.
2. 11 manual control points are converted into ~90 samples by a
   monotone-Z cubic Hermite interpolation with continuous longitudinal
   tangents and no backward movement. One shared sample sequence powers
   paving, collision, gate orientations, lamp positions and minimap.
3. Visual road-width profile is gently varied: ~3.24 design meters at
   upper lookout, ~3.03 at the scenic narrowest portion and ~3.32 near
   the lower street. **These are not surveyed real-world street
   measurements.** Same function controls drivable road and kerb edges.
4. Road grade replaced the old conspicuous short-wave sinusoidal humps
   with a smooth northward rise and a continuous scenic 40m crest.
   About 7.9 design-meters across 99m; the scenic section raises by
   about 4m across 40m. Keep crossfall visually negligible; preserve
   local slab fitting.
5. House positions, lamp brackets, road crossing wires and six tour
   markers follow the newly curved road and grade. Existing eight
   scenic houses retain their archetypes, eleven district houses remain
   (19 total), no houses are added to the protected former side-road
   gaps yet. All fixtures and Namsan/Seoul backdrop remain active.
6. New regression tests cover tangent continuity, path length, road
   width, monotonically increasing hill slope, house-gate distance
   clearances, tour marker reachability, mesh data, and visual-budget
   invariants. Legacy tests updated for new road fit.

## Deliberately deferred to later tasks

- Step 03: The bare former branch openings around z=-14/-24 and other
  empty plots are still obvious. Fill them with visually authentic
  fronting gates / attached walls / coordinated home facades. This
  is the user's primary complaint but NOT a reason to insert random
  geometry into Step 02.
- Step 04: Final asphalt, granite shoulders and seams, especially
  exposed road ends, lateral joins and ground plate intersections.
- Step 05: Correct Seoul skyline sightline, atmospheric continuity,
  visual quality and mobile/desktop acceptance.

## QA instructions

Review the world at `/`, `?view=namsan` and `?night=1`. Use
WASD from the upper spawn and inspect the first / last 20m. Compare
street rhythm with photographs, not cartographic routing. Report
remaining bare earth explicitly rather than falsely claiming no
gaps before Step 03.
