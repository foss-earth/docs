# Performance agent state

Updated 21 October 2026, during the third performance session (below, "Third
session"). Long runs now go to [the cloud runs](performance-cloud-runs.md). A resumed session should be able to continue from this file alone.
The results are in the audit: the
[first session](../../performance-audit.md#20-october-2026) and the
[second](../../performance-audit.md#21-october-2026).

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

Everything is committed and pushed to `main`, on 21 October at the user's
request: this work's commits, the scheduling agent's and the terrain
proximity agent's. Nothing has been deployed since the user deployed the tour
at 16:25 on 20 October, from tour `7488e2da5`, built on engine `90c0ef6`.

| Repo | Commits from this work, pushed |
| --- | --- |
| engine | `dadbbcd`, `a034920`, `a3b213c`, `4b75363`, `ac1dd19`, `5d1b132`, `97a6ae1`, `329dc6c`, `90c0ef6`, `545c5cb`, `0600ad3`, `1afb938`, `f11a819`, `1e3a0a3`; second session `6058d4f`, `b2ddff9`, `497e013`, `f647f96`, `5a7880e` |
| renderer | `24b6a6d` |
| sphere-image | `b2f0ec9`; second session `61d04a2` |
| app | `529fc65`, `550b10d`, `b9a12a2`; second session `9904178` |
| toolbar | `4c1d7ee`, `1872be5` |
| sky | `e4a3dc3` |
| fly | `dddb895` |
| research | `a26ca32`, `207cd61`, `8dcfb02`, `4f5bd62` |
| docs | this file, and the 20 and 21 October audits (`046ac8a`, `333cff7`, `990d4b3`, and the push record `2e39b5c`) |

The first session's final runs, base against HEAD, are in the
[20 October audit](../../performance-audit.md#before-and-after). The second
session's, three interleaved pairs per target of `s2-start` (this session's
files as at its start) against `s2-end` (HEAD), medians:

| Stretch | `s2-start` | `s2-end` |
| --- | --- | --- |
| Phone drag 4× | 74.1 %; 55.0 fps; 13.4 ms a frame | 71.6 %; 56.2 fps; 12.8 ms a frame (fps and ms a frame separate) |
| Flight 1×, main thread | 37.9 % | 36.6 % (separate) |
| Tour drag 1×, main thread | 22.8 % | 22.3 % (separate) |
| Phone drag 4×, raster update | 230.9 ms/s | 198.3 ms/s (separate) |
| App 1× and 4×, tour 4×, flight 4× | | totals within noise, except the tour's 57.8 → 58.1 fps at 4×; most changed parts separate |

Pushed with them, from other agents:

- the terrain proximity LOD: engine `33e897e`, app `ceb308a` and docs `6772725`;
- the scheduling agent (below): engine `d27076d`, `849638a` and `f9326e1`,
  renderer `89ec913`, sky `18d68ea`, app `49f8866`, fly `2d66a88`, docs
  `8d0509f` and `e2ebd7f`, and its proposal, docs `e23599d`.

The terrain proximity task and the scheduling agent have both finished, so
the file ownership locks of the parallel periods no longer apply.

Left alone at the push, and still uncommitted at 12:02 on 21 October:

- another task's aircraft-switching work, which was being edited then, so its
  agent was still running:
  - fly's `FlightControlPanel.tsx`, `createFlightSimApp.ts`,
    `floatingOrigin.ts`, `flightParameters.ts` and its test, `flight.css`, and
    the new, untracked `hud/createAircraftSwitchOverlay.ts` and its test;
  - aircraft's `AircraftSelectionPanel.tsx`;
  - app's `settings/appSettings.ts` and ui's `settings/registry.ts`, each with
    its test, edited in the same minutes and probably part of it;
- an untracked screenshot in research's root;
- `native`, which has no remote.

None of these belong to this work or to the scheduling agent. Don't commit
them without asking the user.

### Third session

Started 21 October after the push, with this brief: lower the floors, measure
what nobody has measured (memory, GPU memory, startup blocking, tile bytes,
orb culling X2, the 360 experiments X1), and settle the FNV table signature.
0SFS (`/fly/`, `~/gh/0sfs`) belongs to another agent: nothing under
`~/gh/0sfs` is edited, and a flight check of an engine change is built into
`~/gh/0sfs/fly/build/perf/fe-*`. Worker scheduling, thread counts and compute
admission stay out of scope.

Committed, not pushed. All are pixel-identical by construction and test.

| Repo | Commit | Change |
| --- | --- | --- |
| engine | `b7e4e05` | Exact table comparison, one reused build block (item 4 below) |
| sphere-image | `c0422ef` | The orb draws read the canvas height once per camera pass, not once per draw, and trim the draw records in batches |
| sphere-image | `d1ed7ef` | A frozen asset's preview candidates are ranked once per preview range and texture limit, not filtered and sorted for every orb in every frame |
| renderer | `af7505e` | The frame-time window is kept sorted as samples come and go, instead of being copied and sorted every frame for the p95 |
| engine | `fd52dd7` | The published imagery feedback's JSON is kept for the next comparison |
| engine | `be3f60a` | All the UI covers are drawn in one draw, not one draw per cover (C14) |
| research | `d1e8eb6`, `c91c10f` | `profile.mjs --heap` and `--gpu`; `pixels.mjs` committed; `CHROME_EXTRA_ARGS` |

**How to test from now on (the user's instruction, 21 October).** The user
works on a fanless laptop that heats up under long runs, and wants the most
performance shipped per hour of work:

- Prove changes locally with unit tests and identity proofs, and pick targets
  from the profiles already saved.
- Don't run long timed sessions locally. A single short indicative run is the
  most to do here.
- Put every long A/B, pixel run or measurement into
  [performance-cloud-runs.md](performance-cloud-runs.md), for a cloud agent to
  run.
- Leave room for the user to test on their own devices, and say what to try.

The run list (R1 to R5) covers:

- the flight check of this session's engine and renderer commits;
- X1's pixels and timing;
- X2's off-screen orb count;
- memory, heap and GPU memory;
- startup blocking and bytes.

The cloud agent clones from GitHub, so it needs the commits above pushed.

Measured locally (research `build/s3`, `bt-a` = the files before `d1ed7ef`,
`af7505e`, `fd52dd7` and `be3f60a`, against `bt-b` = after; three interleaved
pairs):

- At the phone drag at 4×:
  - sphere-image `selection.ts` self time went from 10.6 to below the
    readers' cut (separate);
  - whole frames were 14.16 → 14.09 ms a frame, within noise.
- The app at 1× and 4× is within noise.
- Probes of the single occlusion draw (`bt-p`) drew once per frame with
  covers, with no failure:
  - the tour, on WebGPU: 451 draws in 451 frames;
  - the app, on WebGPU: 760 in 760;
  - the app, on WebGL2: 767 in 768, the other frame's material not yet ready.
- Every visit was isolated, with shared memory.
- `c0422ef`'s pairs (`or`) were within noise on the phone. The app at 4× read
  worse in one set of pairs and within noise in the repeat. That is the app's
  known 4× noise.

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

The second session's before/after is in research's `build/session/`:

- `build.sh` builds `s2-start` (this session's files as they were at its
  start, across engine, sphere-image and app) and `s2-end` (HEAD) back to
  back for each app. It records every library checkout's state per arm in
  `state-<app>-<arm>.txt` and restores the files on exit. To reuse it for
  another set of commits, change its `refs` and `files`.
- `run.sh` runs three interleaved pairs per target. It waits while any other
  `profile.mjs` or `abn.sh` runs, and records in `status` whether one
  overlapped.
- `table.sh` and `parts.sh` read its logs, as the final runs' do. `parts.sh`
  takes the profile's file name with its extension
  (`tour-drag-4x.cpuprofile`); without it, every part prints as a dash.
- `frames.mjs` prints each run's main-thread share, frames per second and
  main-thread ms per frame (`mainThread × 1000 / fps`, from each output
  folder's `stretches.json`), with arm medians.
- `rows.sh` writes every run's per-function rows (`bysource-wide.mjs` over the
  session's sources) into `rows/`, and `compare.mjs <target> <profile>` prints
  per-arm medians and runs of the named functions from them.

The third session's A/B tools are in research's gitignored `build/s3/`. They
build arms without writing any checkout, which other agents edit and build
from at the same time:

- `fe-arm.config.ts` wraps an app's own `vite.config.ts` with a pre-plugin
  `load` hook (also in the worker plugins) that serves chosen source files
  from elsewhere: a file at a git ref, or a patched copy.
- `spec.mjs <name> <repo>:<ref>:<path>|<repo>:@<file>:<path> …` writes
  `arms/<name>/spec.json`; a spec maps each source path to the file to serve.
- `arm.sh <tour|app|fly> <name> [spec.json]` builds one arm with source maps
  into the app's `build/perf/<name>` and records every checkout's HEAD, diff
  hash and dirty count, and each served file's hash, in
  `state/<app>-<name>.txt`, warning if a checkout changed during the build.
  Diff two arms' state files before comparing them. Flight arms must be named
  `fe-*`.
- `run.sh <label> <profile.mjs arguments…>` is one run under `caffeinate -i`.
  It waits while another `profile.mjs` or `abn.sh` runs and writes
  `<label> exit <code> overlap <0|1>` to `status`, with the overlapping
  command. A shell's one-line command that only names `profile.mjs`, such as
  an agent's `pgrep` check, does not count: before that fix, those flagged
  most runs with no culprit.
- `pairs.sh <name> <arm a> <arm b> [phone app tour]` runs a b b a a b per
  target: the tour's phone drag at 4×, the app's drag at 1× and 4×.
- `frames.mjs <name> <a> <b>` prints the main-thread share, fps, main-thread
  ms a frame and script share per arm, medians and runs, marking "sep" where
  the arms do not overlap.
- `samecode.sh <dist A> <dist B>` compares two builds' JavaScript with
  content hashes and build stamps masked.
- `probe/patch-counts.mjs` writes counting copies of the imagery runtime and
  the orb renderer, for `--probe 'JSON.stringify(globalThis.__fe ?? null)'`.
  `probe/patch-meshes.mjs` writes a counting copy of Babylon's `scene.js`
  (where each active-mesh candidate leaves the loop, and one evaluation's
  candidates by name), and `probe/uiOcclusion-count.ts` counts the UI
  occlusion's covers; `arms/am-p` serves both.
- `selfdiff.mjs <name> <a> <b> <target> <rate> [function|file] [top]` gives
  per-arm medians of each function's (or file's) self time from the runs'
  `summary.md`, sorted by B − A, marking "sep" where the arms do not overlap.

Engine scratch from the second session:

- `build/perf/ab-build-ref.sh <name> <targets> <ref> <files…>` builds arm
  `a` with the named engine files as at `<ref>`, then arm `b` with the working
  ones, and records every checkout's state per arm;
- `build/seam/mutants/run.py`, the terrain commit's mutants;
- `build/evalview/mutants2/run.py`, `evaluateView`'s mutants, and
  `build/evalview/fuzz/`, random views through the shipped selector (a copy
  in `bench/head`) and the working one;
- `build/evalview/bench/`, whole selections and view measurements timed,
  HEAD against the working copy, interleaved in one process;
- `build/atlas/`, the atlas test's timing investigation.

research's `build/heights/summarize.sh` rows now include
`measureImageryView`, `projectedPixelFootprint`, `intersectsSegmentBounds`
and `publishManaged`. The marker raycast shows as `surfaceQuery.ts:NN raycast`.

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
With the wrong base the readers print zeros. They name a frame
`<function> <file>:<line>`, such as `update createRasterTilesRuntime.ts:1821`,
so a pattern like `'^update$'` matches nothing: use
`'^update createRasterTilesRuntime'`. The committed
`scripts/benchmarks/startup-audit/profile-tree.mjs` does what `tree.mjs` does,
with `--focus` as a substring. The other readers exist only in gitignored
`build/`. Commit them beside `profile.mjs` if they need to outlive these
checkouts. Research's `tools-manifest.json` then needs a receipt for each one.

| Script | What it prints |
| --- | --- |
| `tree.mjs … '<root name regex>' [depth] [min]` | The top-down tree under matching frames, merged by name, inclusive ms/s |
| `callers.mjs … '<name regex>' [depth] [min]` | Bottom-up callers of matching frames |
| `bysource.mjs … '<source regex>'` | Inclusive and self ms/s per function of the matching sources |
| `lines.mjs … '<source regex>' '<name regex>'` | Self ms/s per original source line |
| `longtasks.mjs … [over ms] [show] [top] ['<frame regex>']` | The longest main-thread stretches and what filled them |
| `errorlines.mjs … ['<text regex>']` | Self ms/s on lines that build an Error, which finds stack captures |
| `bysource-wide.mjs … '<source regex>'` | As `bysource.mjs`, one row per `source:line` function, which the session's `rows.sh` uses |
| `rawticks.mjs <profile> <name>` | The raw position ticks (generated lines) of one function |

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

**Pitfalls met so far.**

- **zsh:** `echo ======` fails with "= not found", because `=word` expands
  to a command's path. Quote it, or print dashes.
- **macOS has no `timeout`.** Run the command directly.
- **Vitest hides the console output of passing tests.**
  - Use `--reporter=verbose`, or append to a file in `build/`.
  - A grep for logged lines can miss them, because vitest prefixes stdout
    blocks.
  - A probe's vitest config with `root: "../.."` resolves against the working
    directory. Use `new URL("../..", import.meta.url).pathname`.
- **`toBe` is `Object.is`, so `-0` is not `0`.** Flat tiles' `-0` positions
  give `-0` world-matrix entries.
- **A test file can take 60–70 s while other agents' node processes load the
  machine,** against about 3.4 s alone. Rerun before suspecting the change.
- **Auto mode refuses to kill another process's vitest worker,** even a slow
  mutant's. Wait for it to finish.
- **A mutant runner given one mutant's name overwrites its `results.json`**
  (`build/evalview/mutants2/run.py`). Keep the full run's results elsewhere
  first.
- **sphere-image's `npm run test:consumer` fails with ENOENT** on
  `build/artifacts/consumer-dependencies.json` unless that has been built. It
  is not part of `check:implementation`. Run typecheck, lint, build, test and
  `typecheck:consumer` instead.

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
| engine `497e013` | `evaluateView` keeps one record per lattice point, reuses the last tile's entry, and computes clip points, footprints and bisection probes without per-call objects | `evaluateView` 84.3 → 61.3; `surfaceSamples` 36.4 → 25.7; select 51.0 → 41.5; `measureImageryView` 51.9 → 39.4 (with `f647f96`: raster update 216.0 → 193.6, main thread 75 → 67 %) |
| engine `f647f96` | The surface query rejects meshes by their bounds with each axis read by name, not through Vector3's computed-key path | Marker raycast 16.4 → 10.5 |
| sphere-image `61d04a2`, app `9904178` | The orbs are tested on screen by projection alone, without reading the canvas box once per orb; the scene host keeps one reduced-motion media query | About 1.9 and 1.2, by construction |
| engine `5a7880e` | The atlas test's clock spans the terrain reselection interval | A test fix (below) |

The proofs for this session's changes:

- **`497e013`.** The selector's pinned digest over the fixed views, plus 400
  random views, sources, grounds and focus points, and `footprintFrom`
  against the shipped function for random matrices, samples and viewports.
  22 mutants (engine `build/evalview/mutants2/run.py`): 20 are killed. Two
  are equivalent: not recording a point's fallback only recomputes the same
  sample, and counting a lattice point once when one call names it twice
  changes only the cache's size accounting.
- **`f647f96`.** The shipped loop's answers over 200,000 random rays and
  boxes, with zeros of both signs, infinities and NaNs; 6 mutants killed.
- **`61d04a2`.** `onScreen` agrees with `project(…) !== null` over 40 seeded
  views of 250 directions, with several viewports and no canvas, and reads no
  element box; 3 mutants killed in the renderer test and 1 in the viewer's.
  `viewportRect` is null exactly when there is no canvas, so the box was never
  needed for the answer.
- **`9904178`.** `MediaQueryList.matches` is live, so a kept query reads the
  same as a new one.

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

The table is in the [21 October audit](../../performance-audit.md#floors-and-gaps-now)
(the first session's is in the [20 October one](../../performance-audit.md#floors-and-gaps)).
A floor is what is left when every cost we know how to remove is taken out,
with every other part counted at its measured cost. So it is an upper bound.
Each target has two floors: same behaviour, and with the decisions.

| Target | HEAD | Same behaviour | With the decisions |
| --- | --- | --- | --- |
| Flight 1× | 36.6 % | about 36.4 % | about 30 % |
| App drag 1× | 25.6 % | about 25.1 % | about 21 % |
| Tour drag 1× | 22.3 % | about 21.8 % | about 19 % |
| Phone drag 4× | 71.6 % | about 69 % | about 60 % |

Every target is within about 4 % of its same-behaviour floor. The evenings'
levels differ (the tour's drag at 4× read 56 % before this session, against
53–55 % on 20 October), so compare gaps across sessions, not floors.

The same-behaviour costs left on the phone are the forced style and layout
after mid-frame HUD writes (about 17, parked), height batches and uniforms
(about 6), and patch tables built when unchanged (up to about 3). To lower a
floor further, show that one of the parts counted whole can be cheaper:

- Babylon's render (209–219 on the phone), with its active-mesh evaluation
  (29–32) and UI occlusion pass (17–18);
- imagery selection (42–44) and publish (24–29);
- the 360 orbs' frame (30–31);
- terrain selection (23–25);
- the workers' replies.

Correction (third session): the `prepare` (31) that this list used to name
beside the orbs' frame is the same cost. It is the frame's prepare section,
filled by the viewer's `onFrame`. The orbs have a second cost inside the
render: their draw observers, 28–34 at the phone drag (about 49 draws a
frame), of which reading the canvas height costs about 9 and trimming the
draw records about 5.

At 4×, a saving buys frames as well as idle time, so compare main-thread ms
per frame between arms, not only the main-thread share.

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

These are inclusive ms/s at the phone drag at 4× unless stated, from the
`iv-b` runs (engine `f647f96`), and all are pixel-identical candidates. Items
1 to 4 and 8 were measured in the second session; the others are older.

1. **What is left of `evaluateView`** (61.3 inclusive, 12.4 self, after
   `497e013`): `surfaceSamples` 22.3 (`heightsAt` 14.1, its `sample` 9.9),
   `clipOutcode` 5.1, `footprintFrom` 4.9, `boundsFor` 2.9, `tileSurface` 2.8.
   No per-call objects are left. What remains is arithmetic the answer needs
   and height lookups.
2. **`terrainHeightBatches`.** The flush costs 11.8, of which `add` 8.0, about
   6 of it self: the native sort and the emission loop. `sample` costs
   9.8–11.6. An insertion sort of the small key arrays gives the same order,
   but would save about 2 at most. Not pursued.
3. **The marker raycast**: 10.5 after `f647f96` (16.4 before). Not broken down
   further.
4. **`publishManaged`** (26): done in engine `b7e4e05` (third session).
   - Counted first, with `--probe` over the phone drag: of 2,881 tables built,
     2,642 (92 %) were unchanged, and none of those was an FNV collision (the
     bytes were compared too).
   - Each table is now built into one reused block, under the same admission
     as before (reserved first, released when unchanged), compared with the
     bound table, and copied out only when it changed. The depth is computed
     once.
   - **The FNV signature.** A collision is possible: a birthday search finds
     pairs of tables with the same 32-bit FNV-1a hash in seconds (one is in
     `imageryBinding.test.ts`). In use the odds are about 2^-32 per changed
     table, at about 24 changed tables a second while dragging. A collision
     would leave a stale or coarser table bound until the next change, which
     on a still view could be indefinitely. The comparison is now exact: the
     signature names only the depth, and the used cells are compared byte for
     byte. `buildPatchTable` leaves every cell outside them empty, so comparing
     them at equal depth is full equality. Byte equality implies FNV equality,
     so uploads differ from before only where FNV collided, and none did in
     the counted drag.
   - Tests: the colliding pair; 300 random tables, built into a dirty reused
     block and into a new one; every byte at every depth; the managed path's
     admission, release, refusal and errors; a depth change and a new atlas
     upload even where the cells compare equal. 14 of 15 mutants are killed
     (engine `build/fnv/mutants/run.py`). The survivor ignores the bound
     source. The check is kept: a source change reallocates the atlas whenever
     a patch is bound, so the atlas check catches it, except where that
     reallocation is refused, a path no test reaches.
   - Three interleaved pairs (`pt-a`, the three files at `5a7880e`, against
     `pt-b`): `prepareManagedPatchTable` 4.8–5.4 → 2.9–3.7 at the phone drag;
     in the app at 4×, `publishManaged` 34.2–40.2 → 24.6–29.8 and
     `prepareManagedPatchTable` 10.4–12.9 → 5.7–8.7; at 1×, `publishManaged`
     11.2–11.9 → 9.1–10.1. Every arm separates. Whole-frame figures are
     within noise.
5. **Uniform writes.** Babylon's `uniformBuffer._buffersEqual` costs about 4.0.
6. **Entering a 360 image at 4×:** the sphere-image record about 12.4, and the
   sky's atmosphere transmittance about 13.
7. **The UI occlusion pass** (backlog C14), inside the render at
   `uiOcclusion.ts:134`: 16.7–19 on the phone. Each frame, `coveredWorldClips`
   reads element boxes (`worldBoxOf` 7.1) and runs `querySelectorAll` (2.6).
   The draws are now one per frame (engine `be3f60a`; `directRender` was about
   4.2). The boxes could still be cached until the layout changes, if that is
   proved never to miss a change. `worldBoxOf`'s first read is the frame's
   first forced layout, so removing it would move that cost, not save it.
8. **The 360 orbs' frame** (sphere-image `viewer.ts` `onFrame`), 31.9:
   - `preview` 11.8: `chooseRepresentation` 5.7 and `current()` about 3.0.
     Done in `d1ed7ef`: a frozen asset's candidates are ranked once per range
     and texture limit (a `WeakMap` on the frozen array; unfrozen ones are
     ranked every time), `current()` is read only when a candidate is chosen,
     and `selection.ts`'s self time fell from 10.6 to below the cut. The proof
     is in `tests/previewRanking.test.ts`: 10,000 calls against the shipped
     code, with the admission calls in order, mixed projections and an edited
     unfrozen asset;
   - `drawFrame`'s `cameraKey` → `viewportHeightCssPx` → `getBoundingClientRect`
     3.6, a forced layout (parked, below);
   - the candidates loop 4.3, of which the canvas box read (1.9) is gone in
     `61d04a2`;
   - `viewerSettings` 2.7, of which `matchMedia` (1.2) is gone in app
     `9904178`;
   - `keyed`/`keyFor` 1.7, skipped: removing it would change the public
     `ViewerResources` API.
9. **Handed to the cloud runs** ([performance-cloud-runs.md](performance-cloud-runs.md)):
   - orb culling (backlog X2), R3. Culling is exact only for an orb whose
     quad lies wholly outside one clip half-space; R3 counts those. Below the
     horizon is not exact: the terrain may not cover the orb while tiles load.
   - verifying the four 360 experiments (X1), R2. The earlier pixel run never
     became ready (it hit the 240 s limit), so most moments were unsteady, and
     it proved nothing.
   - memory, heap and GPU memory, R4 (`profile.mjs --memory --heap --gpu`);
   - startup blocking and bytes, R5 (`run.mjs`, which reports blocking time,
     long tasks, isolation and each request's bytes).
10. **`getLoadingDiagnostics`** (2.8 self). Two callers only ask whether any
    tile is pending (the eye contact's `pending`, and resuming after a lease),
    yet each call also scans every needed key for failures and the whole
    cache for pending replacements. A `hasPendingTiles` that stops at the
    first one would do less work by construction. The callers' frequency has
    not been read from a profile yet.

   The worker pools' sizes now belong to the scheduling agent (C13).

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
- ~~`refreshFeedback`'s JSON comparison~~: done in engine `fd52dd7`. `feedback`
  is assigned only in `refreshFeedback` and at its start, each refresh builds a
  new object, and every consumer copies or only reads it, so the kept string
  always matches the published object.

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
- **The loaded-detail readout** (`refreshLoadedDetail`, 53.4 ms/s at the
  phone drag at 4× after `497e013`, 64–68 before it; 38–54 in the flight at
  1× before it). Re-measuring the pages at the selector's 100 ms cadence, or
  at the throttled view, changes when the readout moves. Of the 53.4,
  `measureImageryView` costs 26.2 and `syncDistribution` 21.3. The latter
  measures the loaded pages with its own `measureImageryView` (13.2). Those
  are other tiles than the plan's, sharing one cache, so the two calls cannot
  be merged without changing what is measured.
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
