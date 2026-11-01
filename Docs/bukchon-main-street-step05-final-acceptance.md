# Bukchon Main Street — Step 05 / Final one-road acceptance

2026-11-01 · WalkingKorea · Three.js / Vite

## Objective

Finish the 99m Bukchon-ro 11-gil-inspired one-road stroll with a clean downhill
Namsan composition and no long bare frontage runs. This stylized miniature
is not a GPS or cadastral reconstruction of the real neighborhood.

## Implemented

- Tune the **default** starting pitch to include the N Seoul Tower in the
  downhill first impression. Keep the existing mouse and touch camera movement,
  and the more elevated \`?view=namsan\` and \`?view=night-sky\` options.
- Automatically audit both full frontage edges from z=-44 to z=+55.
  Combine existing houses, original small connector walls, newly filled
  runs and the roofed east gate. Reject long uncovered longitudinal gaps
  over 0.35 design metres; small material joints remain allowed.
- Fix portrait phone controls: move the character info card above the
  left movement pad, respect the phone's safe-area inset and respond to
  short landscape screens without overlapping the analog joystick.
- New Step 05 regression tests: tower tip projected into the camera for
  16:9 and 390x844 viewport shapes, main-alley full-span frontage audit,
  six discoveries, 20 houses, 39 skyline buildings, 23 night fixtures,
  two road caps, geometry budget and mobile CSS control separation.

## Manual visual acceptance — still required

1. On desktop default day, check the opening downhill composition, the
   Namsan tower silhouette above hanok roofs, the asphalt width and
   continuous granite shoulders.
2. Walk the full alley from z=-42 toward z=+55. Inspect frontages
   on both sides for exposed beige lots, holes, missing roofline joins,
   detached kerbs and signs of side-road openings.
3. Pause near z=-24 and z=-14 at day and night and rotate the camera
   to verify the earlier grey wall foundation flicker is gone.
4. On a phone, check portrait and landscape: joystick, camera swipe,
   on-screen interaction and clickable character card. Check
   safe-area/notch and visual roof rendering at actual device FPS.
5. Verify N to change daytime, E to interact, P to export a postcard,
   six map discoveries, and alternative scenic/night query views.

## Evidence boundaries

The geometry audit catches long *interval* gaps, not every short
camera-dependent seam or visual obstruction. Mathematical projection
of the tower does not substitute for screenshots or human art review.
CI runs cannot establish real-device GPU frame times. These checks
should be complemented by a deployed-browser walkthrough before
declaring the art visually production-perfect. Existing one-road,
female-only gameplay and lighting are otherwise preserved.
