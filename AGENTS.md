# Codex notes — Seoul Stroll

## Scope

This repository is a **web-only** project (Three.js + Vite). It is independent of Octo Galaxy / Unity.

## Before editing

1. Read `README.md`.
2. For environment/hanok/paths: see `src/world/BukchonWorld.js`.
3. For player, camera, UI and map: see `src/main.js`.
4. For styling: see `src/style.css`.

## Keep working

- Preserve browser-first deployment and zero-login experience.
- Keep the walking route, hanok, mini-map, discoveries, keyboard and mobile controls functional.
- Do not expand to Seoul-wide map or add monetization before user asks.
- Prefer small commits and describe changes and manual test steps.
- Verify `npm run build`; test in a real browser when possible.

## Known migration tradeoff

Geometry is currently produced as one procedural buffer and rendered by Three.js. It is not yet a set of editable per-building `THREE.Mesh` instances. Split gradually when that work is useful, preserving coordinates and visual direction.
