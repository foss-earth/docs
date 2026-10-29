# Terrain proximity LOD implementation and runtime measurements

20 October 2026. Implemented in engine commit
[`33e897e`](https://github.com/foss-earth/engine/commit/33e897eb1818ee87a018e8f2a73e50fbd5e6fba2).
This records the completed [implementation assignment](../proposals/implementation/terrain-proximity-lod-agent.md)
and its performance follow-up. The broader [proposal](../proposals/terrain-view-proximity-priority-lod.md)
also contains future architecture ideas; those are not all implemented.

## Behavior and controls

`map.terrain.robustOrbitLOD` remains **off by default**. Enable it with
`?set.map.terrain.robustOrbitLOD=true` on an app route, for example
`https://localhost:5173/app/?set.map.terrain.robustOrbitLOD=true`.
The older proposal's `?settings={...}` example was invalid: registry URL
overrides use `set.<setting-id>=<value>`.

When enabled, raster selection measures line-of-sight detail independently
from nearby terrain around the eye, focus, or both. Prediction follows anchor
velocity, capped at 1,000 m/s, and resets for a displacement over 2,000 m in one
step. The proximity core retains its minimum requested level independently of
the view weight and detail target, within the selector's level and tile limits.
Google tiles use volume distance and a core geometric-error floor; their
hierarchy does not have the raster provider's zoom levels.

The live controls are in Map's terrain-selection section. Starting values are
both anchors, maximum blending, view/proximity weights 1, gaze exponent 0,
200 m core, 1,500 m radius, 600 m raster vertical range, 1.5 s lookahead,
minimum raster proximity zoom 14, and Google core error limit 8. The
[catalogue](https://github.com/foss-earth/engine/blob/33e897eb1818ee87a018e8f2a73e50fbd5e6fba2/src/settings/catalogue/loading.ts)
is the source of truth for units, ranges and defaults.

Fine decoded elevation can answer contact queries before its worker-built
mesh is adopted, including shared height buffers. A coarse stand-in while
finer terrain is pending does not drive the robust eye-contact upward spring.
Off-frustum proximity tiles still prepare elevation and geometry, with core
work prioritized; legacy imagery acquisition and atlas visibility wait until
the tile enters the view. Geometry preparation was not deferred.

## Runtime changes and invariants

- **Selector:** scalar scratch storage, conservative early culling, duplicate
  trajectory removal and bounded exact geometry reuse. The 8,192-slot cache is
  initialized lazily and holds about 3.17 MiB of numeric storage plus bounded
  tile keys. Same-input comparisons covered 608 robust and 54 legacy selections
  and matched the saved implementation byte for byte.
- **Google volume distances:** an affine box's clamped point varies linearly
  between its segment's box-face crossings. Minimize squared distance over at
  most seven intervals instead of repeatedly minimizing point queries. The
  result follows the installed adapter's clamping convention, including scaled
  and sheared transforms. Spheres retain exact projection; unknown custom
  volumes retain the existing numerical fallback. Independent geometric
  oracles cover rotated, sheared, degenerate and moving cases. The new box
  solution is more accurate than the previous numerical search, so bit identity
  to that approximation is not its correctness criterion.
- **Google view preparation:** camera projection, tile-group inverse and
  transformed frustum planes are prepared once per traversal, using the
  installed adapter's arithmetic. The browser factory opts in explicitly with
  `nativeViewSnapshot`, adapter `babylonjs-0.4.24`, and the calculator's function
  identity. Replaced/custom calculators and calls outside a traversal delegate
  to their original calculation. On a dependency update, rerun the installed
  adapter oracle and review this capability before changing its version. The
  test also covers perspective/orthographic views, transformed groups, camera
  swaps, render sizes, exceptions and a supplied camera getter that changes
  state during capture.
- **Raster ownership:** update decoded-grid indexes incrementally. Shared grid
  owners retain their grid until the last owner leaves. Removal uses the
  registered tile address, so mutating a reused wrapper's metadata cannot leave
  its old cell indexed. Numeric cell keys are used only while exact; larger
  levels retain string keys. Height-only eye contact avoids point/normal work.
- **Raster revisions:** contact revision includes decoded data; imagery reads
  adopted `record.grid` and bounds. Keep `imageryRevision` separate. A visible
  grid/bounds adoption invalidates imagery before upload, while an unrelated
  hidden decode or an unchanged mesh commit does not invalidate every imagery
  height lattice.
- **Async lifetime:** a recreated tile can have the same key and a new owner;
  refresh cached visible records, coverage and numeric lookup in that case.
  New records inherit the current terrain-source generation. Late coarse
  stand-ins cannot cancel a finer pending mesh job. Core priority remains
  promoted for an outstanding job instead of repeated abort/resubmit churn.
  Late callbacks after record/runtime disposal cannot resurrect sampled data,
  even when a disposer throws. Idle updates avoid repeated cache scans.
- **Height batches:** generation keys depend on tile metadata, immutable height
  array identities and ordered direct neighbors. Wrapper reuse checks all those
  inputs. Stamps retain weak-array IDs rather than strong height-array
  references; unchanged wrappers reuse their existing weak reference. Height
  buffers must remain immutable, as required by the existing sampler contract.

## Browser measurements

The baseline is a saved copy of the implemented proximity feature **before
this optimization pass**, not the engine's earlier Git HEAD. Browser builds
also include independently developed imagery optimizations present at each
capture; do not attribute every difference to one function or commit.

Chrome 155.0.8059.85 on this desktop used actual WebGPU, no renderer fallback,
cross-origin isolation, 1280 × 800 at DPR 1, and the same requested detail
settings. Automatic imagery/terrain adjustment and the frame cap were disabled.
The view was Minneapolis, 600 m orbit distance, pitch 23.1 degrees. Motion
turned 45 degrees/s. Each block sampled eight seconds after a 15-second raster
or 30-second Google warmup and six seconds of settling per LOD toggle. Final
Google repeats reset test-profile app storage. CPU sampling ran on both sides.
All accepted runs rendered frames, had zero uncaught page exceptions and closed
their isolated Chrome process normally.

These are **map update milliseconds**, not whole-frame CPU time:

| Map | Proximity | Motion | Before mean | After mean | Before p95 | After p95 |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Google | off | still | 1.29 | 1.31 | 1.42 | 1.50 |
| Google | off | moving | 2.85 | 2.13 | 3.50 | 2.63 |
| Google | on | still | 6.72 | 3.83 | 7.36 | 4.52 |
| Google | on | moving | 32.65 | 10.48 | 36.02 | 12.18 |
| Raster | off | still | 3.82 | 0.75 | 26.13 | 1.79 |
| Raster | off | moving | 7.96 | 4.42 | 20.56 | 12.61 |
| Raster | on | still | 0.64 | 1.01 | 0.42 | 4.17 |
| Raster | on | moving | 10.29 | 4.73 | 24.90 | 12.35 |

Live provider loading varies. Moving Google ended with 660/793 visible/active
tiles before and 661/790 after. Its requested error target was 20 in both;
observed loaded error was 94.25 before and 60.36 after. Mean frame intervals
were 45.67 and 20.48 ms. Raster ended with 157/327 tiles before and 98/232
after. Its still robust block was slower in this run, so these results do not
establish an improvement in every workload. They do not establish phone or
power improvements, nor pixel identity between different live streaming runs.

Nine alternating component rounds checked exact warmed height outputs with
`Object.is` before timing. Median registration for 256 decoded grids fell from
3.809 to 0.083 ms; height-only contact from 0.401 to 0.116 microseconds/query;
warmed batched sampling from 1.927 to 1.362 microseconds/call. These component
figures are not whole-app speedups.

The retained [summary](../../validation/evidence/terrain-proximity-lod/2026-10-20/summary.json)
contains frame statistics, tile counts, all update blocks, component timings
and backend/fallback observations. The Google tile preparation worker reported
`wasm-single`, parity `same`, with the existing fallback
`Unsupported Google profile: primitive count` for unsupported tiles; ground
indexing reported a single worker build with TypeScript queries and matching
build/scene parity. The Google run did not start raster geometry or imagery
height cores. This change introduces no new numeric WASM kernel.

## Verification and reproduction

The final pre-commit engine gate passed 1,285 tests across 120 files, typecheck,
lint, build and the public consumer fixture. App checks passed 434 tests,
12 browser assertion tests, typecheck, lint, production build and startup/chunk
checks. The Fly consumer typecheck and WASM parity checks passed. The running
development link was also checked: WebGPU, isolated, robust mode enabled,
visible terrain, no exceptions. The accompanying isolation asset test is app
commit [`ceb308a`](https://github.com/foss-earth/app/commit/ceb308a).

```sh
cd ~/gh/foss-earth/engine
npm run check:implementation
npm run check:parity
cd ../app
npm run lint
npm test
npm run test:browser-assertions
npm run build
cd ~/gh/0sfs/fly
npm run typecheck
```

Reusable lessons for a new measurement:

1. Use the installed `@foss-earth/browser-testing/chrome` helper with a separate
   profile. Validate actual renderer, isolation, rendered frame count and page
   exceptions; a zero-frame result cannot count as a fast frame.
2. Compare production bundles. A dev Google capture was rejected after Vite
   re-optimization caused a duplicate-React startup failure. Saved source must
   override all engine imports in the baseline build, and each bundle needs
   its own base URL and cache directory.
3. Keep viewport, settings, view trajectory, warmup and profiler identical.
   Reset saved app settings between repeats. Record loaded detail and tile
   counts; use fixed-workload tests to qualify equivalence separately.
4. Do not run full tests/builds during timing. Retain paired results, including
   regressions. Small CPU kernel timings cannot establish end-to-end or power
   gains.
5. Use the `set.<id>` URL form. Read a Google key only from its named ignored
   variable, never print it or copy browser profiles into evidence. Close
   Chrome normally and follow the [clone cleanup guidance](chrome-code-sign-clones.md)
   after a stopped or crashed browser.

Local scratch is under `app/build/proximity-runtime-performance/`: saved
baseline engine sources, isolated production build configs, HTTPS comparison
server, `profile-browser.mjs`, CPU profiles and screenshots,
`benchmark-sampling.mjs`, reports and gate logs. Additional selector and
runtime fixtures are under `engine/build/terrain-proximity-lod/` and
`engine/build/proximity-runtime-performance/`. Those ignored files are useful
on this checkout but are not required to understand the retained results.

The auxiliary comparison servers were stopped. The user's development server
was left on port 5173. Restart it if needed with
`FOSS_EARTH_ISOLATION=enforce npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`
from the app. Nothing was deployed. Broader flight, startup, memory and mobile
performance work remains separate from this completed proximity assignment.
