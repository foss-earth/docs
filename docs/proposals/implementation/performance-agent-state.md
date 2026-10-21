# Performance agent state

Updated 20 October 2026, during the second performance session. A resumed
session should be able to continue from this file alone. The results
so far are in the [20 October audit](../../performance-audit.md#20-october-2026).

## The brief

The user's brief:

- Make the UMN tour (`/tour/minneapolis/`), the FOSS Earth app (`/app/`) and
  0SFS (`/fly/`) as fast as they can be made, runtime first, with WebGPU
  Android phones (WebAssembly, shared memory) as the demo device.
- For each target, derive a floor and close the gap to within noise (~10 %),
  or explain why the rest is necessary.
- Measure before and after with the same tool. Keep only wins beyond noise, or
  wins by construction. Add tests, and prove bit identity wherever it is
  claimed.

These must not regress:

- `crossOriginIsolated` and `SharedArrayBuffer`;
- pixel-identical output, unless the user approves a change;
- render on demand;
- the WebGPU to WebGL fallback;
- existing settings.

A pixel-changing option goes behind a setting that defaults to the current
behaviour, and onto the list for the user's decision. New on-screen controls go
in a settings tab.

Process rules:

- Other agents may be working in the same checkouts. Run `git status` first,
  and stage only your own paths or hunks (`git apply --cached`).
- Scratch, logs, profiles and screenshots go in each repository's gitignored
  `build/`, never in `/tmp`.
- Commits are one descriptive sentence, straight to `main`. Don't push, deploy
  or leave servers running unless the user asks. Short servers inside a
  benchmark run are fine.
- Indicative benchmark runs are fine. An exclusive run needs the user to say
  the machine is free.
- Prefer build-time work to run-time work.
- `FOSS_EARTH_GOOGLE_KEY` lives in the environment or `.env.local`. Read only
  that variable, never print or commit it, and never log a Google tile URI,
  which can carry the key or the session.
- After a Chrome run that was killed, timed out or crashed, run
  `~/gh/foss-earth/browser-testing/scripts/chrome-clones.sh --clean`.

## Where things stand

Everything is committed and nothing is pushed. The user deployed the tour at
16:25 on 20 October from tour `7488e2da5`, which was built on engine
`90c0ef6`. The engine commits after that one are not deployed yet.

| Repo | Unpushed commits from this work |
| --- | --- |
| engine | `dadbbcd`, `a034920`, `a3b213c`, `4b75363`, `ac1dd19`, `5d1b132`, `97a6ae1`, `329dc6c`, `90c0ef6`, `545c5cb`, `0600ad3`, `1afb938`, `f11a819`, `1e3a0a3`; second session `6058d4f`, `b2ddff9`, `497e013`, `f647f96`, `5a7880e` |
| renderer | `24b6a6d` |
| sphere-image | `b2f0ec9` |
| app | `529fc65`, `550b10d`, `b9a12a2` |
| toolbar | `4c1d7ee`, `1872be5` |
| sky | `e4a3dc3` |
| fly | `dddb895` |
| research | `a26ca32`, `207cd61`, `8dcfb02`, `4f5bd62` |
| docs | this file and the 20 October audit |

The final interleaved runs, base against HEAD (details in the audit):

| Stretch | Base | HEAD |
| --- | --- | --- |
| Flight 1×, main thread | 79 %, 69 % | 30 %, 36 % |
| App drag 4×, frames/s | 47.9, 51.1 | 56.8, 57.6 |
| Tour drag 4×, main thread | 71 %, 76 % | 53 %, 55 % |
| Phone drag 4×, afternoon changes only | 84 %, 82 %; 52.6 and 53.0 fps | 73 %, 72 %; 55.3 and 55.8 fps |

Engine `33e897e` (terrain proximity LOD), app `ceb308a` and docs `6772725`
belong to other agents and are unpushed too. So do engine `d27076d`,
`849638a` and `f9326e1`, from the scheduling agent (below). The terrain proximity task has
finished, so the file ownership locks of the earlier parallel period no longer
apply.

The tour's `npm run deploy` builds from the local checkouts, so the next deploy
picks up every engine commit above. The deploy fix (tour `811a076a5`) removed
the publisher's fixed list of allowed files. That list stopped stray files from
reaching the append-only `gh-pages` branch for good. It was the wrong guard:
the build already guarantees clean output (`copyPublicDir: false`, Vite empties
`dist`, and deploy builds first). It also duplicated what the build knows, and
it broke on the first new file.

Known failures that predate this work:

- ui: 7 localStorage tests;
- research: `check:links`, which stops at a missing
  `validation/evidence/weather/2026-10-08/source-manifest.json` (docs' passes);
- research receipts for `gpu.mjs`, `parity.mjs`, `preview.html`, `preview.mjs`,
  `preview-server.mjs` and `earth-compare/shared.mjs`;
- app: `appFiles.test.ts`;
- fly: 10 tests in `src/flight/createFlightSimApp.test.ts`;

The engine's atlas test "changes imagery level and source without touching
terrain, elevation requests or the surface" is fixed in `5a7880e` (below).

**The scheduling agent (C13)** owns adaptive CPU concurrency, worker-pool
sizing, shared compute admission and shared-sky scheduling, with its own
[state document](adaptive-cpu-scheduling-state.md). This work keeps the
numerical, data and DOM optimisations, and this file, the audit and the
backlog. Neither runs hardware timing while the other does: check
`pgrep -fl 'profile.mjs|abn.sh'` and that document before a timed run.

The atlas test it handed over failed in whole-file runs, at `6058d4f` (before
R14, through the `updateTerrainPositions` spy) and after it (through the
revision), and passed alone. The cause is time: heights that arrive are
selected for again only once `map.terrain.reselectWhileMoving` (100 ms) has
passed. A warm 40-frame settle takes about 4 ms, so that reselection, and its
two terrain commits, landed during the imagery changes. A cold settle takes
over 100 ms. R14 only hid the commits from the spy, because a commit now
stages its writes. `5a7880e` steps the clock 50 ms per frame and spies on
`stageTerrainPositions` too. The identity expectations are unchanged, and two
mutants fail it (1 ms frames: 2 staged writes; a detail change that recommits
terrain: 515).

Checks before a step counts as done:

| Repo | Checks |
| --- | --- |
| engine | `npm run typecheck`, `npm run lint`, `npm test`, eslint on changed files; after `npm run build`, `node terrain-WASM/scripts/check-height-batches.mjs` for height-batch changes |
| renderer, sky | `npm run typecheck`, `npm run lint`, `npm test` |
| tour | `npm run typecheck`, `npm run test:changed -- <files>`, `npm run lint` |
| app | `npm run test:changed -- <files>`, typecheck, eslint |
| toolbar | `npm run typecheck`, eslint, vitest |
| fly | `npm run typecheck`, `npx vitest run --configLoader native <file>`, eslint on changed files |
| research, docs | `npm run test:source` |

## How to measure

**The profiler** is research's
`scripts/benchmarks/startup-audit/profile.mjs`, committed. It runs the audit's
cold and warm visits under Fast 4G, then one stretch per rate with the V8 CPU
profiler on. It names the time by source function through the build's source
maps.

```sh
cd ~/gh/foss-earth/research
node scripts/benchmarks/startup-audit/profile.mjs --target tour \
  --root ../../UMN-VR/tour/build/perf/<build> --phone --motion drag \
  --rates 4 --seconds 8 --label <label>
```

- `--motion still|drag|enter`: `enter` flies into a 360 image and out again.
  The flight always flies.
- `--phone` uses a 412 × 915 viewport at 2.625 device pixels per CSS pixel,
  with touch.
- `--layout` traces style and layout and names the script that forced each.
  `--reduced-motion` prices the CSS animations.
- `--probe '<expr>'` evaluates an expression before and after each stretch,
  for counters patched into a bundle.
- The last line of the log is the output folder. It holds `summary.md` and
  `<target>-<motion>-<rate>x.cpuprofile`.
- A run takes about 1.6 minutes for one rate. An app run takes about
  3 minutes, because its cold visit waits about 95 s to settle.

The **phone drag at 4× CPU** is the workload most of the 20 October wins were
measured on, since a phone runs out of main thread first.

**Builds.** Build every arm with source maps into the app's own `build/perf/`:

```sh
cd ~/gh/UMN-VR/tour && npx vite build --configLoader native --sourcemap --outDir build/perf/<name> --emptyOutDir
cd ~/gh/foss-earth/app && npx vite build --configLoader native --manifest --sourcemap --outDir build/perf/<name> --emptyOutDir
cd ~/gh/0sfs/fly && npx vite build --configLoader native --sourcemap --outDir build/perf/<name> --emptyOutDir
```

The apps resolve the libraries from the local checkouts. To build the
committed state against working edits, `~/gh/foss-earth/engine/build/perf/ab-build.sh <name> app,tour,fly <engine files…>`
builds `<name>-a` with the HEAD versions of the named files and `<name>-b`
with the working ones. Otherwise build the "before" arm, make the change, and
build the "after" arm. The baselines kept for comparison are:

- fly `build/perf/dist-base` (19 October, before any change);
- app `build/perf/app-base` and tour `build/perf/tour-base` (20 October
  morning);
- tour `build/perf/layout-base` (before the layout guards).

**A/B.** These scratch scripts are in research's gitignored `build/heights/`:

- `abn.sh <name> <armA> <armB> [pairs]` interleaves phone drags at 4× over
  tour builds;
- `summarize.sh <name> <armA> <armB> [pairs]` prints per-run values and
  medians of the imagery and terrain functions.

The final runs of 20 October are in research's gitignored `build/final/`:

- `run.sh` builds each app at HEAD and runs the interleaved pairs against the
  kept baselines;
- `table.sh` prints each run's visit check and stretch figures;
- `parts.sh <tour|app|fly> <dist> <profile file> <run>…` prints the inclusive
  ms/s of the parts the floors are built from (`BASE=/` for 0SFS).

Rules for an A/B:

- Run under `caffeinate -i`. The machine runs on battery, and one whole A/B was
  lost to idle sleep.
- Use at least three pairs.
- Check that every log reads "isolated true" and has a content time.
- Claim a win only when the arms do not overlap, or when the win holds by
  construction.
- Build both arms back to back from one engine state. The same code read 49 %
  and 39 % of the main thread on different evenings.

**Profile readers** in research's `build/heights/` each take
`<profile> <dist root> <base>`. The base is `/tour/` or `/app/`, or `/` for
0SFS: its page is `/fly/`, but its build serves the scripts from `/assets/`.
With the wrong base the readers print zeros.

| Script | What it prints |
| --- | --- |
| `tree.mjs … '<root name regex>' [depth] [min]` | The top-down tree under matching frames, merged by name, inclusive ms/s |
| `callers.mjs … '<name regex>' [depth] [min]` | Bottom-up callers of matching frames |
| `bysource.mjs … '<source regex>'` | Inclusive and self ms/s per function of the matching sources |
| `lines.mjs … '<source regex>' '<name regex>'` | Self ms/s per original source line |
| `longtasks.mjs … [over ms] [show] [top] ['<frame regex>']` | The longest main-thread stretches and what filled them |
| `errorlines.mjs … ['<text regex>']` | Self ms/s on lines that build an Error, which finds stack captures |

**Other scratch tools**:

- research `build/phone/passes.mjs` counts WebGPU render passes per frame, with
  their loads and stores.
- research `build/phone/gpu-ab.mjs` measures GPU time per frame.
- research `build/phone/pixels.mjs` compares pixels with a setting on and off,
  with the page's clock stopped.
- research `build/tiles-bug/probe.mjs` is the Google 3D Tiles stand-in probe.
  It counts drawn meshes by geometric error, coarse tiles over finer ones and
  eye pushes, and it never logs tile URIs.
- Mutation runners are in engine `build/mutants/`, `build/mutants-2/`,
  `build/evalview/mutants.py`, `build/lattice/` and `build/heights/`.
- engine `build/probe/diff-patch.mjs` patches a differential check into a
  bundle.

**Proving identity.** Three patterns, used together:

1. **A digest test pinned from the shipped code.**
   `engine/tests/terrain/imagery/imagerySelectionIdentity.test.ts` pins the
   selector's plans and measurements (`createHash` over seeded cases, with a
   `SHIPPED_DIGEST` taken from a clean HEAD copy).
2. **Mutants.** Each hand-made mutant must make the tests fail. List the ones
   that are equivalent, and say why.
3. **A differential probe in the running app**, where the code paths are
   hard to reach in tests.

**Where things live.**

- Babylon 8.56.2's source is in `~/gh/foss-earth/app/node_modules/@babylonjs/core`.
  The engine has no `node_modules` of its own.
- 3d-tiles-renderer is in `~/gh/foss-earth/node_modules/3d-tiles-renderer`.
- In zsh, quote globs such as `--include='*.ts'`.

## What changed

All changes are pixel-identical by construction and test, unless the entry
says otherwise. The figures are interleaved A/B medians, indicative, in ms of
main thread per second at the phone drag at 4× CPU, unless the entry says
otherwise.

| Commit | Change | Result |
| --- | --- | --- |
| engine `dadbbcd` | Reuse imagery grid heights, samples and hulls within a surface revision | Flight 1× main thread 75–76 → 51 %; 4× 12.4–12.7 → 15.5–16.2 fps |
| engine `a034920` | The same over a 65 × 65 lattice per tile | Flight 1× 53 → 49 %; 4× 15.8/16.2 → 16.6/17.4 fps |
| engine `a3b213c` | Collect the parity check's pixels with a typed sort | 2–3× faster, by micro-benchmark |
| engine `4b75363` | One view's measurements shared between the plan and the loaded pages | App 4× 50.6 → 56.7/56.0 fps (main 88 → 83/82 %); fly 4× 19.5 → 23.7/28.4 fps; 0 mismatches over 263,621 regions in the running app |
| engine `ac1dd19` | Residency `stats()` in one pass | Same values by construction |
| renderer `24b6a6d` | Hold a depth or stencil-only canvas clear until a draw needs it (`deferDepthClears`) | GPU inside a 360 image 3.62 → 1.61 ms per frame (−56 %, M5, phone viewport); one main pass per frame in every tour state, against up to 3; pixel-identical in 9 states |
| sphere-image `b2f0ec9`, app `529fc65` | Fly into and out of 360 images as one spring-paced motion; `scene.panorama.flightGrowth` (Orb growth); entry view 120° | A feature fix the user asked for |
| engine `5d1b132` | Google 3D Tiles stand-ins: the ground gives way to finer tiles, and `map.terrain.hideCoarseStandIns` (default on) hides far-too-coarse ones | The bug fix; see below |
| engine `97a6ae1`, app `550b10d`, toolbar `4c1d7ee` | Skip DOM writes of unchanged values: the detail rail, the POI exit button, the download rate | Style recalcs 2.75 → 2.07 per frame, layouts 1.32 → 0.84 per frame; 49.8 → 50.5 fps |
| toolbar `1872be5`, app `b9a12a2`, fly `dddb895` | Activity outline setting (`interface.toolbar.activityOutline`, Spinning by default, or Still) | Still saves about 47 ms/s of style and paint at 4× (50.5 → 52.7 fps, main 89 → 85 %); the default is unchanged |
| sky `e4a3dc3` | Skip the star field's update when no star could be drawn at the exposure | Enter at 4×: main 29 → 25 %, script 20 → 16 %, by day |
| engine `329dc6c` | Index stitched (float64 array) ground meshes for the anchor markers' ray | Marker raycast 40.5 → 14.6 ms/s; brute force 26.4 → 4.3 |
| engine `90c0ef6` | Build the hidden-patch withdrawal Error only when a table is uploading | About 22 ms/s at 4×, by construction |
| engine `545c5cb` | Packed transport for the worker's height double-check | Height work 58.5 → 35.1 ms/s |
| engine `0600ad3` | Open-addressed typed point table for memoised heights | Height work 48.7 → 41.0 ms/s; lookup 32.4 → 13.5 ns |
| engine `1afb938` | `heightsAt` leaf shortcut, no boxed-coordinate Maps | `heightsAt` self 13.1 → 9.9, inclusive 27.3 → 23.9 |
| engine `f11a819` | Keep lattice heights across revisions for tiles that touch no changed terrain | Raster update 251.5 → 233.2; `surfaceSamples` 46.8 → 34.7; `heightsAt` 24.9 → 17.3 |
| engine `1e3a0a3` | `evaluateView` without per-call objects; the off-screen hull test reuses the sampled heights | `evaluateView` 91.7 → 80.6; select 55.9 → 49.5; raster update 238.8 → 225.3 |
| engine `6058d4f`, `b2ddff9` | The terrain commit uploads each tile once with its seams, skips uploads of arrays a mesh already holds (still moving its world bounds), and searches only the levels present | `commitTerrain` 24.2 → 10.5; `stitchTerrainEdges` 15.8 → 5.8; raster update 237.2 → 214.6 |

Rejected after measuring: prefetching a group's heights in one batch (more
heights for fewer calls, a loss in the flight; kept in engine
`build/attempts/imagerySelector.prefetch.ts`); discarding the MSAA store
(no GPU gain on the M5); horizon culling of the main camera's tiles (13–15 %
of drawn tiles but about 1 % of vertices, and pixel identity is not airtight).

### The Google 3D Tiles stand-ins (engine `5d1b132`)

3d-tiles-renderer 0.4.24 keeps a loaded tile drawn while its descendants load.
Google's octree boxes overlap, so a coarse tile can stand in far from home. A
depth-3 tile with an error of 263 km, centred in the Yukon, contains a camera
at Minneapolis, and its mesh lies 6.5–6.8 km above the campus. The vertical
ground sample hit it first. Eye contact then pushed the eye up, a higher eye
picked coarser tiles, and the camera floated.

The fix has two parts:

1. The ground sample walks down to a finer Google mesh whenever
   `coarser.height − finer.height ≤ coarser.error`.
2. With `map.terrain.hideCoarseStandIns` on (the Map tab, on by default), a
   tile with children is not drawn when its error exceeds both its distance
   from the eye and 16 × max(100 m, the eye's height).

On cold caches, in the "low" view:

| Build | Eye height | Pushes |
| --- | --- | ---: |
| Base | 276 → 435 m | 14 |
| Fix, setting off | 276 → 282.5 m | 2 |
| Fix, default | 276 m throughout | 0 |

Settled views draw the same pixels, but the setting changes what is drawn while
tiles load. That is the requested behaviour. The "one LOD per tile" option the
user suggested would not have helped: the overlapping tiles are siblings, not
ancestors. 0SFS's terrain-contact guard against kilometre jumps is probably
redundant now, and was left in place.

## Floors and gaps

The table is in the [20 October audit](../../performance-audit.md#floors-and-gaps).
A floor there is what is left when every cost we know how to remove is taken
out, with every other part counted at its measured cost. So it is an upper
bound. Each target has two floors: same behaviour, and with the decisions.

| Target | HEAD | Same behaviour | With the decisions |
| --- | --- | --- | --- |
| Flight 1× | 30 %, 36 % | the same | about 23–27 % |
| App drag 1× | 26 % | about 25 % | about 21 % |
| Tour drag 1× | 21 % | about 21 % | about 18 % |
| Phone drag 4× | 72–73 % | about 68 % | about 58 % |

Every target is within 10 % of its same-behaviour floor only because the
unexamined parts are counted whole. To lower a floor, show that one of these
parts can be cheaper:

- imagery selection (50 ms/s on the phone, 51–59 in the flight);
- Babylon's render, with its UI occlusion pass and HUD observers;
- the 360 orbs' frame (34 on the phone);
- residency and publish;
- the workers' replies.

Of the known pixel-identical costs, the terrain commit is the largest (below).

## The terrain commit (engine `b2ddff9`, done)

`commitTerrain` uploads each committed tile once, with its seams, and skips an
upload of the array a mesh already holds. `patchesForGeometryCommit` and the
seam searches look only at the levels present, with numeric keys per level.
Steps A to E of the design are in; F is rejected (below).

At the phone drag at 4×, three interleaved pairs, `r14-a` (the two files at
`6058d4f`) against `r14-b` (`b2ddff9`), built back to back from one state of
every other repository:

| ms/s | `r14-a`, median (runs) | `r14-b`, median (runs) |
| --- | --- | --- |
| `commitTerrain` | 24.2 (24.2, 27.5, 21.0) | 10.5 (10.5, 10.1, 12.3) |
| `stitchTerrainEdges` | 15.8 (15.8, 18.7, 13.1) | 5.8 (4.5, 5.8, 6.9) |
| `updateTerrainPositions` | 11.6 | 5.7 |
| `patchesForGeometryCommit` | 4.5 | under the readers' 0.5 cut-off |
| Raster update | 237.2 (232.2, 281.6, 237.2) | 214.6 (214.6, 212.8, 222.3) |
| Main thread | 80 % (76, 90, 80) | 75 % (75, 73, 75) |

The arms do not overlap on the commit. Every visit was isolated, with content
in 1.8–3.2 s. The raw logs are in research's `build/heights/r14/`.

The proof:

- `engine/tests/terrainSeamIdentity.test.ts` pins `SHIPPED_DIGEST`, taken at
  `6058d4f` before the change. It covers seeded quadtrees across the
  antimeridian, mixed segment counts, Earth-radius origins, `Float32Array`
  targets, and frozen and parented placement. The digest holds for the commit
  one write at a time, staged, and with string keys forced.
- The digest workload's uploads fell from 14,391 to 9,542 (−34 %).
- 17 mutants are killed (engine `build/seam/mutants/run.py`). Three are
  equivalent: searching levels above the tile (a finer neighbour sorts later
  and is skipped), the first pass at the visible levels (the extra keys cannot
  be dirty), and string keys always (the exact fallback).

What the design got wrong:

- **The skip is not safe "because a parented mesh refreshes its bounds at
  render".** `isInFrustum` reads the world bounds between commits, and
  0SFS's `worldRoot` moves every frame. A skipped upload therefore still
  refreshes the world bounds (`refreshWorldBounds`: the bounding info and each
  non-global submesh, from the current world matrix). The final state depends
  only on the last array uploaded and the world matrix, so this matches an
  upload of the same array bit for bit.
- **The existing tests' write counts did not change.** `seamPasses.max` stays
  1, and "uploads only corners needing repair" still expects 1, 0, 1.
- **Only arrays Babylon hands back as given are staged.** `GetFloatData`
  returns the stored array only for an updatable float buffer, stride 12,
  offset 0, a plain array or `Float32Array`, and exactly 3 numbers per vertex.
  Anything else is uploaded at once, as before.
- **The stored type is observable.** The ground BVH refits float64 boxes for
  a `number[]`. So a stitched tile stays a `number[]` even when its seam
  already fits, and an unstitched one keeps the `Float32Array` it was given.
- **F, computing the bounds ourselves, is rejected.** It writes Babylon's
  private state and still scans every vertex.

A failure mid-commit still uploads what was staged before it, as the
one-write-at-a-time code did (`createRasterTilesRuntime.test.ts`, the error
path).

## Then, by measured cost

These are inclusive ms/s at the phone drag at 4× unless stated, and all are
pixel-identical candidates:

1. **What is left of `evaluateView`** (80.6 inclusive, 16.1 self).
   `surfaceSamples` (33.9) builds arrays per call. The hull loop and `outcode`
   cost about 12, `footprintFrom` about 5.6 and `boundsFor` about 3.2.
2. **`terrainHeightBatches`.** `generation()` costs about 2.4, and the per-call
   LRU and result arrays 1–2 each. The flush's `add` costs about 6.5: its sort
   2.3, for which an insertion sort of small key arrays gives the same order,
   and its emission loop 2.4.
3. **The rest of the marker raycast** (14.6): the predicate over every scene
   mesh (`surfaceQuery.ts:49`) 2.2, `intersectsSegmentBounds` 1.5, a brute
   force of about 4 on each mesh's first query, `isEnabled` 0.6.
4. **`publishManaged`**: 27–29 at HEAD (about 45 before `90c0ef6`).
   `prepareManagedPatchTable` costs 5.4 of it, `buildImageryDisplay` 3.8 and
   `syncManagedPins` 2.1.
5. **Uniform writes.** Babylon's `uniformBuffer._buffersEqual` costs about 4.0.
6. **Entering a 360 image at 4×:** the sphere-image record about 12.4, and the
   sky's atmosphere transmittance about 13.
7. **The UI occlusion pass** (backlog C14), inside the render at
   `uiOcclusion.ts:134`: 17–19 on the phone. Each frame, `coveredWorldClips` reads element boxes
   (`getBoundingClientRect` 6.7) and runs `querySelectorAll` (2.6). The boxes
   could be cached until the layout changes, if that is proved never to miss
   a change.
8. **The 360 orbs' frame** (sphere-image `viewer.ts` `onFrame`), 34 on the
   phone. Not looked at yet.
9. **Not looked at yet:**
   - orb culling (backlog X2);
   - verifying the four 360 experiments (X1); a pixel run with them was
     started and stopped;
   - memory (`profile.mjs --memory`, plus a heap snapshot);
   - GPU memory, tile textures against render targets;
   - the worker pools' sizes;
   - startup blocking (check `crossOriginIsolated` after any change);
   - tile bytes.

Parked:

- The **forced layouts**:
  - `applyWorldViewport`'s first style recalc is paid for the CSS animations
    (see Still).
  - About 17 ms/s at 4× of later forced style and layout comes from reads
    after mid-frame HUD writes. It could be removed by snapshotting the
    canvas box at the start of the frame, or by deferring the HUD writes
    until after the render's reads. Either needs a proof that those writes
    never move the canvas.
  - sphere-image's `viewportHeightCssPx` is about 0.5 %.
- **`refreshFeedback`'s JSON comparison** (3.3). The feedback object is exposed
  outside the runtime, so caching the string is not provably safe.

## Waiting on the user

Each of these changes pixels or behaviour, so each needs a setting that
defaults to today and the user's decision:

- **Activity outline Still by default**, or a composited comet. The spinning
  outline costs about 47 ms/s of style and paint at 4× (the setting exists).
- **One raster update per frame in 0SFS.** `prepareFrame` runs the update with
  the previous view, and `setExternalViewState` runs it again. The second call
  costs 58–60 ms/s at 1× at HEAD. Of that, 24–26 is selection, which would
  move to the remaining call, so dropping it probably saves about 32–35 ms/s.
  Tiles would arrive at different moments during a move. Measure it as an A/B
  before quoting a saving.
- **The loaded-detail readout** (`refreshLoadedDetail`, 64–68 ms/s at the
  phone drag at 4×, 38–54 in the flight at 1×). Re-measuring the pages at the
  selector's 100 ms cadence, or at the throttled view, changes when the
  readout moves.
- **Verify imagery heights only at admission.** The worker's double check
  never feeds the output. It is the WebAssembly design's safety net.
- **Horizon culling of far-side Google tiles**, behind a setting: about
  15 ms/s of CPU at 4×.
- **Phones:**
  - `renderer.resolutionScale` below 1 (P1);
  - antialias off (P3);
  - an opaque canvas (P7), wherever alpha is below 1;
  - the four 360 experiments (X1).
- **`map.terrain.hideCoarseStandIns`** is already on by default, as the
  requested bug fix. It changes what is drawn while tiles load.
