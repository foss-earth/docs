# Performance agent state

Closeout note, 20 October 2026: the separate terrain proximity task is now
committed as engine `33e897e`; its [retained implementation and measurements](../../validation/terrain-proximity-lod.md)
cover the completed work. The ownership exclusions below describe the earlier
parallel work period, not a continuing lock on those files. The measurement
cache and residency stats described below are now engine commits `4b75363`
and `ac1dd19`; their descriptions of pending checks are historical. The broader
floor, memory and startup work in this handoff remains a separate task.

Updated 20 October 2026. This file holds the performance agent's progress
against the 19 October [performance audit](../../performance-audit.md). A
resumed session should be able to continue from this file alone. The brief is
the user's: make the UMN tour (`/tour/minneapolis/`), the FOSS Earth app
(`/app/`) and 0SFS (`/fly/`) as fast as they can be made, runtime first. For
each target, derive a floor and close the gap to within noise (~10 %) or
explain why the rest is necessary. Any pixel-changing option goes behind a
setting that defaults to current behaviour, and waits for the user's decision.

The terrain proximity-LOD agent owns these files; leave them alone:
`engine/src/terrain/terrainSelector.ts`, `terrainLoader.ts`,
`engine/src/babylon/createRasterTilesRuntime.ts`, `createTilesRuntime.ts`,
`createGlobeRuntime.ts`, `cameraState.ts`, `rasterSurfaceSampler.ts`,
`engine/src/map/mapSourcePanel.ts`, `engine/src/settings/catalogue/loading.ts`
and `engine/src/surface/contracts.ts`. Also leave alone
`app/vite/appFiles.test.ts` (another agent's uncommitted update), and
`engine/src/terrain/imagery/imageryGeometry.ts` with its new test (another
agent's uncommitted horizon change), and
`engine/src/browser/terrainHeightBatches.ts` with its test (another agent's
uncommitted generation memo). Check `git status` before staging: other
agents also have uncommitted edits in `globeBindings.ts`, `vitest.config.ts`
and `tests/googleTileViewSnapshot.test.ts`.

## How to measure

All runs so far are indicative: the machine is shared, with load averages of
1.5–2.5. No exclusive run has been made.

- **Flight A/B:** `~/gh/0sfs/fly/build/perf/ab-build.sh <name> <engine files…>`
  builds `<name>-a` with the HEAD versions of the named engine files and
  `<name>-b` with the working ones, back to back. Other agents' uncommitted
  engine edits are in both. It records `git diff | shasum` per side in
  `engine-state-<name>-{a,b}.txt`.
- **A/B across all three apps:** `~/gh/foss-earth/engine/build/perf/ab-build.sh <name> app,tour,fly <engine files…>`
  does the same for each target, into `app/build/perf`,
  `UMN-VR/tour/build/perf` and `0sfs/fly/build/perf`.
  `research/build/benchmarks/ab-measure/run.sh` then profiles app and tour
  (drag) and fly (flight), in the order a, b, then b, a; edit its build names
  for a new pair.
- **Profile:** from `research/`, run
  `node scripts/benchmarks/startup-audit/profile.mjs --target fly --root ../../0sfs/fly/build/perf/<build> --label <label> --rates 1,4 --seconds 8`.
  Interleave the sides a/b/a/b. It reports fps, frame-time percentiles,
  main-thread busy share and self time per source-mapped function, and writes
  the `.cpuprofile` under `research/build/benchmarks/startup-audit/`. Pass
  `--probe '<expression>'` to evaluate an expression before and after each
  stretch, for counters patched into a bundle.
- **Call tree:** `node scripts/benchmarks/startup-audit/profile-tree.mjs --profile <cpuprofile> --root <dist> --focus "<name file:line>" --depth 4 --min 2`.
- **Bit identity of imagery selection:**
  `engine/tests/terrain/imagery/imagerySelectionIdentity.test.ts` pins the
  digest of the shipped selector's plans and measurements (`b2a7e123…`, taken
  from a clean HEAD copy). The mutant runner is
  `engine/build/mutants/imageryHeights.mjs` (gitignored scratch); it must catch
  every mutant except the equivalent ones listed below.

## Baseline (19 October, before any change)

0SFS flight, indicative, same profiler:

| Rate | fps | p95 frame | Main thread busy | Script |
|---|---|---|---|---|
| 1× | 58.4 | — | 76 % | 68 % |
| 4× | 11.5 | 116.7 ms | — | — |

At 1×, the imagery runtime's update took 505 ms/s. heightsAt ran 60,000
calls/s at 759,000 coordinates/s. The surface revision changed about 3.5 times
a second.

The rest of the baseline is the 19 October audit: drag main thread 63 % (app)
and 36 % (tour) at 1×; renderer memory 987 MiB (tour) and 1,529–1,588 MiB
(app, flight); GPU process 656–722 MiB; 17 workers per page; 300–360 ms of
blocking before the first 3D frame; 41–55 MiB of tiles to settle.

## Changes

### dadbbcd: reuse imagery heights within a surface revision (engine)

`engine/src/terrain/imagery/imagerySelector.ts` gains an optional
`ImagerySurface.getRevision()`. With it, a tile's 3×3 grid heights, samples and
hull positions are kept until the revision changes. An edge bisection's four
lines are walked in lockstep, so each step makes one height batch rather than
four. The rays inside a tile are sent as one batch too.

This is bit-identical by construction and by test. A height depends only on
the point and the surface, never on the rest of its batch. Heights and bounds
are fixed within a revision: `commitTerrain()` bumps it before the imagery
update in the same `update()`. Samples and hull positions are kept with the
fallback and bounds they were taken at. The tests pin the shipped digest and
check scalar, packed and reused paths against each other, plus a revision bump
and a bounds change without one. Mutants caught: 14/14.

Interleaved A/B, flight (`hull-a` against `hull-b`):

| Rate | Measure | Before | After |
|---|---|---|---|
| 1× | Main thread busy | 75–76 % | 51 % |
| 1× | Script | 68 % | 43 % |
| 4× | fps | 12.4–12.7 | 15.5–16.2 |
| 1× | heightsAt calls/s | 60,000 | 20,600 |
| 1× | heightsAt coordinates/s | 759,000 | 207,000 |

### a034920: reuse heights on a 65×65 lattice (engine)

This change generalises the 3×3 grid cache to every point on a 65×65 lattice
over the tile. It covers the grid's corners as nearest points and the
grid-to-grid bisection probes, which fall on multiples of 1/64. It is capped
at 2^17 kept points per surface, after which the cache is reset.

In one traversal of the identity cases, it asks for 39.7 % of the heights the
uncached path asks for; the 3×3 cache asked for 57 %. The test now requires
less than 45 %. The pinned digest holds. Mutants caught: 14/15. The missed
mutant drops the row's integer check; it is near-equivalent, because
`row·65 + column` is unique for any integer column in 0–64, so it can collide
only when two non-integer rows differ by exactly k/65.

Interleaved A/B, flight (`lattice-a` = dadbbcd, `lattice-b`), two pairs:

| Rate | Measure | Before | After |
|---|---|---|---|
| 1× | Main thread busy | 53 %, 53 % | 49 %, 49 % |
| 1× | Script | 45 %, 45 % | 41 %, 41 % |
| 4× | fps | 15.8, 16.2 | 16.6, 17.4 |

After a034920 (probe build of `lattice-b`, load 5.2), `heightsAt` runs
11,000 calls/s with 34,000 points/s. 59 % of calls carry a single point (the
nearest point once the grid is cached). 18 % carry the whole 10-point hull
after a revision bump. `heightsAt` costs 40.5 ms/s inclusive, of which the
height lookups (`sampleTerrainGrid`) are 1.9 ms/s; the rest is per-call and
per-point overhead in `heightsAt` (off-limits) and in
`terrainHeightBatches.sample` (21.5 ms/s).

### Rejected: prefetch a group's points in one batch

The traversal evaluates a node's four children together, and a measurement
evaluates its whole region list. The trial asked, before either, in one
batch, for each tile's 3×3 grid and nearest points, and kept any exact point
for the revision. In the identity cases, calls dropped by 33 % while heights
rose by 17 %; the digest held. In the flight it lost: 1× main thread 39 %,
39 % (a034920) against 44 %, 41 %, and 4× within noise. `heightsAt` did not
get cheaper (28–37 → 37–44 ms/s) and the prefetch added 35–45 ms/s, so its
cost is per point, not per call. The attempt is kept in
`engine/build/attempts/imagerySelector.prefetch.ts`.

### a3b213c: collect a height batch's worker pixels faster (engine)

`collectTerrainHeightPixels` (the pixels the `single` tier's parity check
sends to its worker) now sorts the indices as a `Uint32Array` instead of an
array with a comparator, and copies the heights in a loop. This is the same
output by construction; a test checks ascending indices and bit-equal heights
against the source grids, and three mutants are caught. Micro-benchmark:
2.1 → 1.2 µs (3 points), 12 → 5 µs (30 points), 61 → 21 µs (300 points). It
cost 15–22 ms/s of the flight's main thread before.

### Uncommitted: share a view's region measurements (engine)

`measureImageryView` takes an optional `ImageryMeasurementCache`. The
imagery runtime passes one cache to both its measurements: the plan's
regions, every 100 ms while the view moves, and the loaded pages, whenever
the page key, view or revision changes. They are mostly the same tiles at the
same view. A kept measurement is given again only when all of these are
unchanged:

- the surface object, its revision and the camera's ground height;
- every number in the view and the source, compared with `Object.is`;
- the tile's own bounds, min and max.

Otherwise the tile is measured again. The cache is reset at 2^14 tiles.

This is bit-identical by construction, because a measurement is a function of
exactly those inputs. The test in `imagerySelectionIdentity.test.ts` checks:

- cached results against uncached, by digest;
- a one-ulp change to each number in the view, more than 100 cases;
- a revision bump, a ground shift, a source change and a copied surface;
- a widened min on one tile and a raised max on another;
- an unrevised surface.

Mutants caught: 15/15 (`engine/build/mutants/measurementCache.mjs`). In the
running app, a differential probe (`engine/build/probe/diff-patch.mjs`)
measured every region both ways. Over 263,621 regions in a drag and its
settle, there were 0 mismatches, comparing tiles by z/x/y, and 51 % of the
regions were reused. Interleaved A/B: pending, `measure-a` against
`measure-b`.

### Uncommitted: residency stats in one pass (engine)

`imageryResidency.stats()` walked the entries about ten times, each walk a
`filter` or `reduce` over a fresh array, and one update calls it up to four
times. It now counts in one loop, in the same order. `missing` is still
computed as before: `isMissing` may expire an entry, which bumps the
revision and requests a render, so its order relative to the rest is kept.
It gives the same values by construction. Tests and A/B pending.

### Baseline drift

The terrain agent's uncommitted engine changes moved the flight's baseline
between runs: the same a034920 code read 49 % at 1× at 23:45 and 39 % at
07:31. Only A/B pairs built back to back from the same engine state compare.

## Floors

### Flight frame (target 1)

The 1× frame rate is already at the 60 fps vsync cap, so the floor is on
main-thread time per second. It is the work that must happen each frame:

- Babylon render: ~55 ms/s;
- physics and simulation: ~15 ms/s;
- HUD: ~6 ms/s;
- imagery selection that must run as the view moves: ~10 ms/s, i.e. one
  traversal per 100 ms at its time-sliced budget, with heights reused;
- residency and publish: ~45 ms/s.

The sum is about 130 ms/s, or 13 % of a core at 1×. After dadbbcd the frame
tick is 391 ms/s. Of that:

- the raster update in `prepareFrame`: 201 ms/s, of which the imagery update
  is 193:
  - `refreshLoadedDetail`: 107 ms/s;
  - select: 38;
  - publish: 25;
  - pump: 7;
  - feedback: 7;
  - stats: 5;
- the second raster update via `setExternalViewState`: 86.5 ms/s;
- Babylon render: 54 ms/s;
- physics: 15 ms/s;
- HUD: 6 ms/s.

### Dragging (target 2)

Baselines, 20 October, indicative, with the profiler's drag motion:

- app (`app-base`, load 3.8): 1× 59.2 fps, main thread 34 %, script 28 %;
  4× 53 fps;
- tour (`tour-base`): 1× main thread 24 %; 4× 57 fps.

This is already below the audit's 63 % and 36 %. The drop comes from
dadbbcd, a034920 and other agents' work since then.

At 1× in the app, imagery measurement leads the self time:

| ms/s | Function |
| ---: | --- |
| 18.8 | `evaluateView` |
| 18.1 | `surfaceSamples` |
| 15.2 | `heightsAt` |
| 9.7 | `terrainHeightBatches.sample` |
| 6.1 | `sampleTileSurface` |

This is the work the shared measurement cache removes. The rest of the self
time:

- `applyWorldViewport`, 9.2 ms/s, and `getBoundingClientRect`, 4.3 ms/s.
  Both are forced layouts: they read `clientWidth` and `clientHeight` after
  the frame's DOM writes.
- residency `stats()`, 3.7 + 1.8 ms/s (the single pass).
- the anchor markers' occlusion raycast, about 7 ms/s in Babylon's
  `intersectsTriangle` and `_intersectTriangles`, plus BVH preparation churn.
- `refreshFeedback`, 2.2 ms/s. Caching the previous JSON would save about
  half of that, but it would be correct only if nothing outside the runtime
  ever mutates the feedback object, and nothing enforces that. Not pursued.

The floor for a drag frame is the Babylon render, the camera update, and the
imagery and terrain selection that must run as the view moves, once per
100 ms. Using the flight's terms, that is about 120–130 ms/s at 1×, about
12–13 % of a core.

## Left to do

1. **Flight and dragging:**
   - finish the measurement-cache A/B, then commit it if it wins;
   - test, A/B and commit the single-pass residency `stats()`;
   - then profile again and take the next largest item. The worker parity
     path (`collectTerrainHeightPixels`, ~24 ms/s before a3b213c) is still on
     the list.
2. **Renderer memory:** `profile.mjs --memory` (macOS footprint plus a
   memory-infra dump). It is written but has not been run yet; add a heap
   snapshot.
3. **GPU memory:** split tile textures from render targets.
4. **Workers:** check whether each pool's size and memory pay off, with
   `?set.native.workers=`.
5. **Startup blocking:** check `crossOriginIsolated` after any change.
6. **Tile bytes:** formats, compression, request order and caching only.
7. **Write-up:**
   - a dated section in `performance-audit.md` with before/after and a
     floor/gap table;
   - mark finished items in `optimization-backlog.md`;
   - commit `profile.mjs`/`profile-tree.mjs` to research after checking the
     `check:tools` manifest.

## Waiting on the user

- **Double raster update in sim mode** (off-limits file, pixel-changing).
  In 0SFS, `prepareFrame` in `createGlobeRuntime.ts` runs
  `rasterTilesRuntime.update()` with the previous frame's view (118 ms/s at
  1×). Then the sim tick sets the new view through `setExternalViewState`,
  which runs `update()` again (87.5 ms/s). Each run gives imagery selection
  its own 2 ms slice, so the traversal gets 4 ms a frame. Running only the
  second would save about 100 ms/s, but the traversal would then finish later
  after a move: tiles would arrive at different moments, though the settled
  view would be the same. It would need a setting that defaults to the
  current behaviour, and the file belongs to the terrain LOD agent.
- **Per-point overhead in `heightsAt`** (off-limits file): done by the
  terrain agent. Its uncommitted `rasterSurfaceSampler.ts` now keys cells by
  number per level, and `terrainHeightBatches.ts` memoises a grid wrapper's
  generation key and keeps its WeakRef. Re-profile once those are committed.
- **Throttling the page re-measurement (pixel-changing).**
  `syncDistribution` could re-measure pages at the selector's 100 ms cadence
  rather than on every publish. That changes when the loaded-detail readout
  updates, so it would go behind a setting that defaults to the current
  behaviour. The setting would sit in the map settings, since `loading.ts` is
  off-limits. Not built yet. The shared measurement cache reduces what is
  left to gain from it.
- **Anchor-marker occlusion as an any-hit query** (off-limits file).
  `showAnchorMarkers` in `createGlobeRuntime.ts` (around l.1031) casts a
  closest-hit ray per marker to decide whether the ground hides it. That
  question needs only an any-hit query, which can stop at the first triangle
  closer than the marker. The fallback goes through Babylon's
  `intersectsTriangle`, about 7 ms/s while dragging, and the ground BVH
  preparation (`groundAcceleration.ts`, one preparation in flight, at most 64
  meshes) churns as tiles change. Pixel-identical, but it belongs to the
  terrain LOD agent's file.
- **Forced layouts while dragging** (pixel-changing on resize frames).
  `applyWorldViewport` reads `canvas.clientWidth` and `clientHeight` each
  frame, and `uiOcclusion` reads `getBoundingClientRect`, after the frame's
  DOM writes: 9.2 and 4.3 ms/s of self time at 1×. A `ResizeObserver` cache
  would remove the reads, but a resized frame would draw at the previous
  size. Only part of the cost can be removed at all: one layout per frame is
  needed whenever the DOM changes, so the gain is only any repeated layout. A
  timeline trace must show which writers force it before this is worth a
  setting.
