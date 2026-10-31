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
