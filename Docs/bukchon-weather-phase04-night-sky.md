# Weather / Background Step 04 — Seoul's moonlit night sky

2026-11-01 · WalkingKorea · Three.js + Cloudflare

## Goal
Give the 25-house Bukchon alley and the 39-building Seoul backdrop a coherent
nighttime atmosphere **without inventing street lamps or lit apartment windows**
until planned Step 05. A simple dimming of the daytime shader was not sufficient.

## Implemented
- A true midnight-navy sky with three vertical atmosphere bands:
  - #456789 — light-polluted, blue-grey urban horizon
  - #2A456C — middle nighttime sky
  - #1B2B4E — deep navy zenith
- A quiet waning-style crescent moon with a localized halo, computed directly
  from a fixed skyward direction in the existing single sky-dome shader.
- Deterministic, tiny **sparse** stars via hashed angular grid with a
  horizon light-pollution fade; no random re-scattering at each camera update.
- Weak, warm city horizon scattering without pretending there are already
  street lamps or glowing windows.
- Browser QA exposure fix: dark-blue sky had looked almost black while the city ground was too bright; lifted night sky blues, slightly reduced ground moonlight contrast.\n- Cool, blue atmospheric distance fog for distant Namsan/Seoul. The main
  world shader receives gentle slate-blue moonlit fill; eaves and paths
  remain legible rather than becoming featureless black.
- Existing day-sky palette, high clouds, sunlight, hanok shadows, houses,
  paths, Namsan, skyline, plants-removal preference and walking controls
  are unchanged.
- No additional lights, textures, image assets, scene objects or draw calls.

## Preview and acceptance
- Normal: `/` opens in day mode, all ordinary controls unchanged.
- Night QA: `/?night=1` starts the night mode immediately.
- Moon QA: `/?night=1&view=night-sky` raises the initial camera framing.
  These are opt-in QA URL parameters; the existing time-toggle remains.
- Night sky must not turn uniformly black or saturated purple.
- Moon and stars are visually subtle, and night haze shouldn't bleach
  N Seoul Tower into white.
- Cloudflare runs tests and Vite build; review both night and day browser
  screenshots before reporting visual success.

## Deferred
- Step 05: actual cast light pools from street lamps, Hanok lanterns, warm
  interiors, balcony/window light, nighttime wayfinding and illuminated
  Seoul apartments.
- Step 06: holistic QA (day/night comparisons, accessible contrast, mobile
  frame times, atmospheric seams and overall art direction).
