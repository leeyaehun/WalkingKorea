# Seoul Stroll — Bukchon (Hanok Set v0.5)

This is the actual Three.js + Vite version of the previously single-file WebGL Seoul Stroll v0.3. The walking routes, procedural hanok geometry, input controls, map, day/night, 6 discovery points, screenshots, and local vote UI were retained.

## Local development

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (typically http://localhost:5173). Do not open `index.html` with `file://`: ES modules and Vite dependencies require a web server.

## Production

```bash
npm run build
npm run preview
```

Output: `dist/`. Deploy the `dist/` folder to static hosting (Vercel, Cloudflare Pages, Netlify, etc.).

## GitHub / Codex workflow

1. Use the `leeyaehun/WalkingKorea` GitHub repository, separate from the Octo Galaxy repository.
2. Push the project files excluding `node_modules` and `dist`.
3. Open this repository in Codex. Ask Codex to read `README.md`, inspect `src/world/BukchonWorld.js` and `src/main.js`, and work on one scoped change per branch/PR.
4. Use `npm run build` as a basic verification gate.

## Organization

- `index.html`: structural HTML UI
- `src/style.css`: UI styling
- `src/main.js`: input, UI, game loop, Three renderer
- `src/world/BukchonWorld.js`: procedural lanes, terrain, site layout, geometry/texture atlas, Three.js mesh
- `src/world/HanokKit.js`: approved Bukchon Hanok Set v1; wall-and-gate (A), front-facing (B), café/atelier (C), roof tiles, wooden columns, paper lattice windows, gate and courtyard details

## Hanok visual pass v0.5

- Replaced uniform house facades with three distinct building archetypes. A uses plaster walls and a timber gate, B exposes lattice doors and a porch, and C has a small Korean shop sign, warm entrance, planters and bench.
- Shared roof geometry uses thin rolled charcoal-gray tile courses, raised seams and exposed wooden eaves.
- All 25 existing hanok sites and routes, input controls, minimap and discoveries remain in place; houseSites now records an `archetype` for inspection.
- Reference art is a **concept direction**, not a pixel-identical render. Exact architectural photography, per-building texture and roof silhouettes are not yet finished.
- Browser visual verification remains necessary before public release.

## Notes

- Existing geometry is imported as a Three.js BufferGeometry rendered by a Three.js ShaderMaterial. In future, Codex can split houses and roads into separate `THREE.Mesh` objects for easier changes and culling.
- The map is inspired by Bukchon and is **not** an exact GIS reconstruction.
- The distant Seoul tower is an early low-detail silhouette. It has not been redesigned.
- The 'next neighborhood' vote persists locally, not to a server. Support URL is still blank.
- Browser screenshot output uses `preserveDrawingBuffer`, which may cost performance.
- Full visual verification and performance testing on actual Mac/mobile devices are still needed.


## v0.6 — Dami companion

- Added **담이**, a friendly calico guardian cat based on the approved character C design direction.
- `public/guide-cat.svg`: the light-weight illustrated companion portrait.
- `src/characters/DamiCompanion.js`: original, procedural 3D cat that accompanies the walker in first-person view; no external model/texture dependency.
- New introduction portrait, in-game guide card, and context-sensitive hints for the six discoverable locations.
- No changes to the original lanes, exploration movement, the six locations, or the existing hanok meshes.

### Cloudflare Workers deployment

The public Worker is named `walkingkorea` (not a Cloudflare Pages project).
The repository includes `wrangler.jsonc` with static asset directory `./dist`.

From a local checkout, run:

```bash
npm install
npm run build
npx wrangler login
npx wrangler deploy
```

To deploy automatically on pushes, go to **Cloudflare → Workers & Pages → walkingkorea → Settings → Builds → Connect**, authorize `leeyaehun/WalkingKorea`, use the `main` branch, set **build command** `npm run build` and **deploy command** `npx wrangler deploy`. Cloudflare Workers Builds is separate from the GitHub Actions build-only workflow. Until this connection is made (or Wrangler deploy is run), GitHub changes do **not** update the public `workers.dev` site.


## Dami v0.7 — 3D character and turnaround

- `src/characters/DamiCompanion.js` is now a **fully 3D procedural sculpt** (not billboard art): cheek-shaped head, curved calico face patches, ear depth, eyes, separate cloth kerchief, leather satchel, gold charm, animated feet, and striped curved tail.
- The same sculpt is used both in the world and in a separate **3D character studio** at `/character.html`. The studio provides front / 45° / side / back-45° / back presets and orbit zoom. It is a close procedural interpretation of the approved character-art direction, not an automatic exact reconstruction of its concept image.
- In the main world, Dami follows ahead and to the side, leaving the centre of the walking lane visible.
- `vite.config.js` builds both site pages.
- The bespoke custom shader for streets and houses remains untouched; scene lights were added for Dami's PBR materials.
- Source branches and GitHub CI build output are not live until a separate Cloudflare Worker deployment is completed and verified.
