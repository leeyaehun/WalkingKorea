# Seoul Stroll — Bukchon (Three.js migration v0.4)

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
- `src/world/BukchonWorld.js`: procedural lanes, terrain, detailed hanok, geometry/texture atlas, Three.js mesh

## Notes

- Existing geometry is imported as a Three.js BufferGeometry rendered by a Three.js ShaderMaterial. In future, Codex can split houses and roads into separate `THREE.Mesh` objects for easier changes and culling.
- The map is inspired by Bukchon and is **not** an exact GIS reconstruction.
- The distant Seoul tower is an early low-detail silhouette. It has not been redesigned.
- The 'next neighborhood' vote persists locally, not to a server. Support URL is still blank.
- Browser screenshot output uses `preserveDrawingBuffer`, which may cost performance.
- Full visual verification and performance testing on actual Mac/mobile devices are still needed.
