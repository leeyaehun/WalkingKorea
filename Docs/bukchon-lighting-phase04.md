# Bukchon — Phase 04 / Actual lighting and directional shadows

## Scope

First 40m street architecture from Phase 01–03 remains unchanged.
This phase changes only the sun, contact darkening and renderer lighting.
No added props, no new buildings, no new external textures.

### Daylight
- Warm sun direction (-0.47, 0.81, 0.35), strong raking light on roof slopes.
- A cooler hemispheric ambient contribution keeps all surfaces readable.
- Three.js real directional shadow-map casting and receiving on the existing
  world mesh (PCFSoft desktop and basic 1024 mobile).
- Local contact AO values at high wall/eave joints and near foundations.
- 78m-diameter shadow camera centered on the walking player. Shadow map is
  refreshed only after 2.4m travel or day/evening toggles because buildings
  are static; avoids a full second render pass every frame.
- Day/night button dims and cools the sun and reduces shadow contrast.

### Code ownership
- `src/world/BukchonLighting.js`: sun, shadow camera and renderer controls.
- `src/world/BukchonWorld.js`: receives Three.js native shadow-map chunks,
  ambient/directional light response, lightweight vertex contact AO.
- `src/main.js`: sets up sun and updates the shadow view around the player.
- `tests/bukchon-lighting-phase04.test.js`: checks real shadow-map setup,
  shadow frustum update cadence, material shader integration and mobile settings.

### Visual QA
Inspect first spawn overlook, then left/right eaves, lower stone wall and
mid-street curb. On screen, look for a *directional* difference in sunlight
and true occlusion on ground and building surfaces. If shadow acne, aliasing,
or WebGL compilation errors appear, fix the renderer/shader before proceeding
to decorative Phase 05.

### Limitations
The existing world is one large non-indexed shared BufferGeometry, so
shadow-map rendering costs more memory/time than a future mesh separation
would. Mobile shadows are lower-resolution and may appear sharper.
This is a true directional depth shadow, not full global illumination or
physically based environment reflections. Phase 05 introduces lived-in props.
