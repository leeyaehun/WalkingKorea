# Bukchon main street — Step 03: fill vacant property edges

2026-11-01 | Three.js / Cloudflare | WalkingKorea

## User goal
One high-quality, linear Bukchon-ro 11-gil-inspired walk, **without visible empty
land beside the main asphalt**. The game is a stylized reconstruction, not a
georeferenced survey of Bukchon properties. Existing street Step 02 width,
slope, centreline, collision and woman's WASD movement must not change.

## Actual edits
- Build **one new real low-poly hanok** at the former west branch opening,
  approximately route z=-15.15, not a decorative cutout. It uses the same
  pitched tiled roof, carved gate, masonry and existing night window setup.
  The unchanged eight showcased homes and eleven district homes remain,
  bringing the visible street total from 19 to **20**.
- Cover missing property frontage by deriving real gaps directly from every
  house's occupied 7.16m length along the **single current street centreline**.
  Draw about 47m of new boundary wall in 22 gap runs, on both sides:
  granite plinth, pale rendered masonry, brick motif, and shallow pitched
  dark tiled coping. Long runs are broken with stone piers.
- A **small roofed timber gateway** closes the former east-side branch
  (around z=-23.6). It uses a framed wood double door and pitched black
  ceramic canopy, but does **not** open a side route.
- The new module `src/world/BukchonContinuousFrontage.js` uses the same
  `sampleMainLaneAtZ`, `mainLaneWidth`, `hill` and actual home positions
  as paving, street collision and house placement. New walls are at least
  ~0.79 game metres beyond the walkable road edge.
- Existing short-gap frontage connectors remain; continuous frontage infill
  covers the larger previously exposed gaps. No pots, grass, random planted
  trees or filler apartments were introduced; no new draw calls or dynamic
  lights were introduced.
- Street life, doors, attached night sconces and material shading now include
  the new house. The one-road minimap, six discoveries, Namsan, city skyline
  and daytime/nighttime controls remain unchanged.

## Acceptance criteria
- Visually read as a connected narrow street: road, low walls, gate entries
  and hanok rooflines rather than flat beige undeveloped ground.
- No colliders/spawn points or side-route pavements added.
- Both former intersections no longer show an unobstructed large bare lot.
- The new facade edges do not overlap actual house front gates, and all wall
  sample points remain outside the road + safety buffer.
- Existing district models, roof geometry, interactive places and movement
  pass automated regressions; combined world stays below 850k vertices.
- Cloudflare production tests / build and actual browser screenshots checked.

## Deliberately deferred
Step 04 repairs remaining near-camera material transitions, edge stones,
doorstep-to-asphalt seams, bare terrain in unoccupied space beyond the
enclosure, and exposed entrance/exit end caps. Step 05 finalizes long-distance
Namsan composition, lighting and whole-street visual acceptance.
