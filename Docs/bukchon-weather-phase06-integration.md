# Weather / Background — Phase 06: Integrated Day/Night QA & Render Budget

2026-11-01 · WalkingKorea / Three.js / Cloudflare Worker

## Final six-stage review

1. Daytime sky: clean pale-to-deep-blue sky, sparse cloud wisps and cool distance haze.
2. Namsan: faceted continuous ridge and landmark tower (shaft / observatory / antenna).
3. Seoul skyline: 39 depth-layered mixed, office and apartment buildings with Namsan sightline preserved.
4. Night atmosphere: navy three-tone sky, sparse stars, slim crescent and blue distance fog.
5. Night lights: 25 house sconces and 3 road lamps; independent warm light spill for the eight nearest lamp locations, chosen as the player walks, lit hanji and sparse occupied apartment windows. These are stylized analytic local illumination, **not** shadow-casting dynamic point lights.
6. Integrated performance and exposure balancing — this change.

## Stage 06 changes

- **Automatic frame-rate-responsive render resolution**: desktop output DPR capped at 1.6, coarse-pointer devices at 1.2. After *120 valid active game frames* above 23.5 ms/frame, adjust down in 0.15 steps (touch floor 0.8, desktop floor 1.0). If sustained frames stay below 17.2 ms and at least 8 sec elapsed since the last quality change, rise carefully by 0.1. A hitch, hidden tab or intro overlay is ignored. Responsive canvas sizing and touch controls remain unchanged.
- Keep the **existing screenshot/postcard** feature, which needs WebGL `preserveDrawingBuffer:true`; do not optimize it away.
- **Reduce GPU fragment work**: at daytime the sky shader returns after day-cloud calculations (no crescent trigonometry or stars); at night the world shader avoids its unused directional sun-shadow depth lookup. All eight analytic local lights use squared distance, eliminating eight per-fragment `sqrt` operations.
- **Night lighting exposure**: make windows and lantern emissive surfaces modestly less bright to avoid hard golden/white squares against the quiet street. Warm spill on nearby stones and walls stays.
- Avoid a new `THREE.Color()` allocation every render frame.
- `?qa=1` now exposes render calls / triangles, current WebGL DPR, adaptive quality sampling/fps estimate, day/night, shadow refreshes and local light updates. The quality's FPS estimate is a **RAF cadence heuristic**, not a GPU timer. Tests and screenshots alone do not substantiate real phone hardware performance.

## Regression and acceptance

The completed environment should still have:
- 25 hanoks, 3 connected walkable routes and 39 Seoul backdrop structures;
- Namsan/Seoul Tower still legible beyond the authored roofline;
- no pots or decorative street vegetation reintroduced;
- no movement, character-switching or postcard regression;
- no new draw-call-heavy PointLights, external textures or new user-facing controls;
- shared world mesh under the 850,000 vertex reference budget.

`tests/bukchon-weather-final-phase06.test.js` covers DPR hysteresis, ignored frame stalls, current scene invariants, daytime shader shortcut, squared night light falloff and postcard/QA compatibility.

### Browser comparison checklist

1. Default `/`: blue sky and readable roof material; warm window emission **off**.
2. `/?night=1`: warm lamp pools and scattered windows; no blown-out gold rectangles.
3. `/?view=namsan`: skyline still frames tower; distance haze remains subtle.
4. `/?night=1&view=namsan`: recognizable dark tower/silhouette with irregular apartment lights.
5. Local device: walk with WASD, turn camera, toggle night/day, save a PNG postcard; test real phone FPS separately. Automated screenshot checks alone are not equivalent to a mobile device benchmark.

## Project status

Six weather/background phases are **implemented**, but any future native-device GPU frame times, new hand-modeled architecture or photographic reference matching are separate tasks. Do not claim measured real-device FPS without benchmarking on that device.
