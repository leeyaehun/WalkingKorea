# WalkingKorea — 2.5D character integration (v0.11 preview)

The girl's playable model now uses illustrated **directional sprites** instead of the old procedural 3D sculpt. Dami, roads, houses, movement, exploration, camera, UI, and existing 3D girl model viewer are unchanged.

## Assets
- `public/sprites/girl_idle_5x2.webp`: 5 directions (columns: front, front45, side, back45, back) × 2 idle frames (rows), frame 256×320.
- `public/sprites/girl_walk_5x4.webp`: 5 directions (rows) × 4 walking frames (columns), frame 256×320.
- `public/sprites/girl_portrait.webp`: character-picker portrait.

## Runtime
`src/characters/GirlSprite.js` uses a transparent `THREE.Sprite` with a foot pivot at pixel (128,304), slight contact shadow, mirrored left viewpoints, and frame selection from the player's heading relative to the actual follow-camera position.

**Walk frames advance by real distance travelled**, not just elapsed time, so collisions or stopping do not cause feet to keep sliding. Two idle frames play while stopped. The original 3D scene, stone paving and path collider remain unchanged.

Choose **서울 산책자** from the intro. Use `/sprite.html` for a standalone **Three.js sprite preview** with angle, Idle/Walk, and mirroring controls.

## Check
- `npm install && npm run dev`
- `npm run build`
- GitHub Actions workflow `Preview WalkingKorea girl 2.5D sprites` verifies the real game, load states, WASD, frame advances, idle transition and independent studio UI, and saves screenshots.

## Release status
**Preview branch only.** The public Cloudflare Workers site and GitHub `main` have NOT been changed by this work.

Limitations: The illustration's original walk source contains some similar poses, so while the 4-frame system is technically working, future hand-illustrated contact/passing frames would noticeably improve the walk cycle.
