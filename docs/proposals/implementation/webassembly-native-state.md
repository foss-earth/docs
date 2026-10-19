# Rust/WASM implementation state and next-agent handoff

Updated 19 October 2026. This records implementation progress, evidence and
known gaps in the current local checkouts. Read it with the
[implementation brief](webassembly-agent.md), [program plan](../webassembly.md)
and [optimization backlog](../../optimization-backlog.md). The separate
[W0 state](webassembly-w0-state.md) preserves live-comparison prerequisites.
This document supersedes older
handoff statements that no native Earth code existed; it does not mark the
program's performance gates complete.

## Current direction

The user separated Rust conversion and equivalent JavaScript/WASM A/B from
W0's deferred exclusive battery window. The current continuation authorizes
implementation, focused parity/browser checks and shared-machine relative
measurements. The earlier source-writing testing pause is historical. Six
development binaries exist; tested integration is described below. Functional
completion, measured gains, full program gates and absolute power remain
separate claims.

The next requested handoff is a fresh agent finding the largest **real** gain
with equivalent-functionality A/B. It should finish the high-value complete
worker/integration paths, using current evidence to choose their order, rather
than stopping after one isolated slice or spending the whole effort restating gate
status or requiring the complete W0 Google Earth comparison first. The
[fresh A/B assignment](webassembly-ab-handoff.md) explicitly permits the focused
functional checks needed for its chosen workload: that is a scoped override of
the earlier source-writing testing pause. It does not authorize an unrelated
full-suite campaign, W0 battery/Google qualification, or deployments. Follow
that prompt for the next task's exact scope. A session working that prompt
on 17 October wired the sky into the apps, added the Native tab and ran the
first in-app A/B. Its results are below, and the
[resume prompt](webassembly-ab-resume.md) continues from them. Current launch
URLs, equal-work commands and evidence locations are collected in the
[18 October comparison guide](webassembly-ab-results-2026-10-18.md).

Since 19 October 2026 the global default is `single`, WebAssembly in worker
pools, with the sky's shared-memory build and shared terrain heights on
([Defaults](#defaults-webassembly-in-worker-pools-with-shared-memory-19-october-2026)).
Renderer and visual-quality settings are unchanged. Six
selectable app cores now cover raster, sky, terrain targets, imagery heights,
Google preparation and ground index construction. Six development packages split the
five audited CPU families because raster decoding and terrain geometry are
separate slices. This is not six shipping downloads, a settled final package
layout, or a measured percentage of total CPU time.

## Defaults: WebAssembly in worker pools with shared memory, 19 October 2026

The user chose these defaults after trying them on a Mac and an Android phone,
and judged that they work well enough. A visitor with no saved choice gets:

- **`native.tier` = `single`.** Every core runs its single-threaded WASM in
  background workers, with worker pools (`native.parallelism` = `auto`). Each
  core is still admitted only after its first result equals the TypeScript
  reference, and otherwise returns to TypeScript and says why.
- **`native.sharedSky` = on** (engine `src/settings/catalogue/native.ts`).
  A sky that runs WASM runs its shared-memory build, with `native.threads`
  threads. It changes only a WASM sky, so the TypeScript arms of an A/B are
  unchanged; set it off for a single-threaded WASM arm. Sky → Shared memory
  and the global Shared memory set it. They ask for `native.core.sky=threaded`
  only when the sky would not run WASM.
- **`native.sharedHeights` = on.** Terrain heights go into shared memory,
  which the terrain mesh workers that `single` starts read.
- **`native.workers`** now counts the default selection's own workers. It is
  the elevation recommendation and the imagery worker, as before, plus the
  sky, imagery heights, Google, ground, two mesh workers and the shared sky's
  helpers. Before, `single` left the elevation pool nothing on a device with
  10 or fewer hardware threads, so every elevation tile decoded on the page:
  an isolated 10-thread Mac reserved 10 of its 10 workers. That Mac now gets
  19 workers and 9 decoders, as many decoders as TypeScript gives it.
- **Where the page can't share memory** both uses fall back as before: the sky
  runs single-threaded WASM and reports the fallback, and heights are
  transferred. The switches show the default's request as Off, grayed, with ?
  saying why. A request from the URL or a saved choice shows On, so it can be
  turned off.
- **Not a speed claim.** Paired runs measured Terrain heights and Terrain
  geometry slower in WASM than in TypeScript, and the shared sky saved worker
  time without a page or frame gain ([Measured results](#measured-results)).
  Auto still takes each core's recorded choice. Google tiles are now prepared
  in a worker by default. Unit tests match the loader's hierarchy,
  transforms, materials and metadata; there is no visual qualification beyond
  the user's own use.
- **Checked.** Engine 1204 tests, app 432 and tour 75, with typecheck and lint.
  Fly's own tests have 14 failures, the same with the old defaults; they come
  from the flight panel work in progress.

## UI checkpoint: safe to close this conversation, 18 October 2026

The requested Component execution UI cleanup is complete for the existing
runtime contract. The separate shared-memory agent is still working; closing
the UI conversation does not require that agent to stop or finish. All changes
remain local and uncommitted. No UI verification browser or preview server is
left running by this conversation (latest run records normal browser exits and
an empty surviving-process list).

Retained design and behavior are in [ui-layout](../../ui-layout.md), the shared
AGENTS.md files, native/README.md and the UI source/tests. Latest evidence is
`app/build/component-execution/browser-map-mode/report.json`: desktop/phone,
compact titles and persistent ?, inline title/control flow, expanded-first
ordering, actual TS/WASM tints, live 2D/3D applicability, preserved hidden state,
pending/apply/reload, keyboard/help and both themes. Sources stayed unchanged;
no page errors; both browsers exited normally. The final slice passed 15
panel/report tests, changed TS lint, app typecheck/build and chunk checks.
Commands and earlier broader-check limitations are retained in
`app/build/component-execution/functional.md`; ignored build evidence is local.
These UI checks make no new threading or performance claim.

Next (done 19 October, see
[Component execution shared memory](#component-execution-shared-memory-19-october-2026)):
the shared-memory agent has finished; its contract and results are in
[the shared-memory UI handoff](webassembly-shared-memory-ui-handoff.md). Use
[the Component execution continuation](webassembly-ui-handoff.md) with it.
Inspect its actual plan/report/isolation/worker-budget contract before adding
thread controls, capability feedback or shared-memory status. Recheck Earth,
tour and fly against the resulting runtime, retaining all settled UI behavior.
The [other UI audit](ui-compact-controls-handoff.md) remains a separate task.
Do not redo this cleanup, interrupt the shared-memory work or interpret a new
binary on disk as completed app integration or a measured gain.

## Terrain copies and shared heights, 19 October 2026

Built and tested, not committed or deployed. Visual defaults and the default
tier are unchanged. No speed claim: nothing here has been measured in an A/B.

- **Typed positions (R2).** Terrain targets, new meshes and refinement steps
  are float32 from the start (`engine/src/babylon/terrainMesh.ts`,
  `meshRefinement.ts`), and Babylon stores the same bits
  (`tests/terrainMeshIdentity.test.ts`).
  - Stitched seams stay float64 on the CPU. Rounding them moved the
    antimeridian seam 6.7 µm off its plane, and Babylon's exact bounding-box
    check then rejected a ray along it (the `rasterSurfaceSampler` dateline
    test caught this).
- **One topology per segment count (R1, CPU half).** `terrainTopology`
  keeps the indices and UVs of the last 4 segment counts, with 16-bit indices
  up to 255 segments. GPU buffers stay one per tile: a shared Babylon index
  buffer leaves picking without its indices, and nothing rebuilds it after a
  lost context.
- **Worker targets (R3).**
  - The page no longer works out its own target for every worker job, only
    for the one parity check.
  - Worker geometry is adopted without a copy, both in the worker (TypeScript
    output only; native output may be a view the core reuses) and on the page.
  - A target prepared before a segment-count change is no longer uploaded to
    the rebuilt mesh. The page path had this race too.
    `tests/terrainMeshWorkerIntegration.test.ts` fails without the guard.
- **Shared heights (plan step 5.6).**
  - Component execution → Terrain heights → **Shared memory**
    (`native.sharedHeights`, app `terrainNativeWorkerConfig.ts`) is off until
    the user has tried it, and applies after a reload like the other
    execution choices. The policy (`app/src/app/browserPolicy.ts`) reads it. It is passed on
    only when terrain targets are prepared in mesh workers: where the page
    builds them, a transfer already costs nothing and sharing would add a
    copy. Decode workers get it in their name and
    use it only when `crossOriginIsolated`. They then copy heights into a
    `SharedArrayBuffer` and post it without a transfer. Mesh workers receive
    grids by structured clone, so on an isolated page they read the same
    memory instead of a copy.
  - Without isolation, or when allocating shared memory throws, heights are
    transferred as before.
  - The switch says "Needs geometry workers" while Terrain geometry would run
    on the page, and "Not isolated" on a page that isn't. Terrain heights'
    details report "N in shared memory".
  - Nothing writes a grid's heights after decoding. A consumer audit found no
    storage, crypto, Blob or GPU upload of heights. The only check that
    rejects shared heights is the full-grid path of the height-batch worker,
    and the page never uses it: it sends sparse copies.
  - `native-terrain` `core.js` and `heightSampler.js` accept shared heights
    and snapshot them. The rebuilt `terrain.wasm` is byte-identical (sha256
    `24e02faa…aba1`), and only its receipt changed. `npm run check:terrain`
    builds 25 cases from shared heights, and `check:height-batches` samples a
    shared grid; both match bit for bit.
- **Decode worker budget.** `terrainDecodeWorkers()` is capped at the slots
  the worker budget leaves for decoders. A worker refused by the budget made
  the pool unavailable for good, so every later tile decoded on the page.
  This happened in every worker and WASM tier once the decode count exceeded
  its slots: 3 in workers and 111 on the page before the fix, 108 and 1 after.
- **Checked.**
  - Engine: 1201 tests, typecheck and lint.
  - App: 424 tests, typecheck and lint.
  - Native: 43 tests, `check:terrain` and `check:height-batches`.
  - Headless Chrome on the user's tour dev server (localhost:5173, not
    isolated), default and `typescript-worker` arms: terrain loaded, page and
    worker heights matched, 0 exceptions, and the only console message was
    the missing Google key.
  - Headless Chrome on an isolated tour dev server (localhost:5374, started
    with `FOSS_EARTH_ISOLATION=enforce`), `typescript-worker` with the
    setting on: `crossOriginIsolated`, 114 of 114 worker tiles arrived in
    shared memory, 1 page decode (the parity tile), page and worker heights
    matched, and mesh workers built 49 targets from the shared grids, with 0
    exceptions. With the setting off, 0 tiles were shared. That run's first
    load also logged "The tour could not start": Vite bundled new
    dependencies and reloaded the page while it started.
  - After the setting moved to Component execution (`native.sharedHeights`),
    the same server: 113 of 113 tiles shared with it on, 0 with it off and 0
    in the default tier. With the tab opened from the + menu, the switch sat
    under Terrain heights: On with no status in `typescript-worker`, Off with
    "Needs geometry workers" by default. A second later the details read
    "223 in shared memory".
  - Evidence: `app/build/perf-optimizations/`. The script reuses the running
    server and never starts one.
- **Default.** On since 19 October 2026
  ([Defaults](#defaults-webassembly-in-worker-pools-with-shared-memory-19-october-2026)).
  - A paired A/B of memory and tile-arrival cost.

## Component execution shared memory, 19 October 2026

Component execution now shows the shared-memory sky (`app/src/app/nativePanel.ts`;
[what it shows, checks and commands](webassembly-shared-memory-ui-handoff.md#what-the-ui-shows-19-october-2026)):

- **The controls.** Components → Sky → **Shared memory [Off|On] ?** comes after
  Implementation. The standard **Shared-memory threads** (`native.threads`)
  shows while it is on. Both are pending until Apply and reload, and Discard
  restores them.
- **Availability** comes from the page's `crossOriginIsolated`. When the page
  isn't isolated, the slider is disabled with "Not isolated" and a reason. A
  URL's threaded request can still be turned off.
- **Running status** comes from the report:
  - "Sky: WASM (4 shared threads)";
  - "3 of 4" when fewer threads are ready;
  - "· fallback" with a short reason.

  Memory, threads, batches, rows by thread, waits and parity are behind ?.
- **Checked** in headless Chrome on dev servers:
  - Earth and the tour, isolated: TS → 4 shared threads → 2 → TS at 1280 and
    390 px, in both themes;
  - fly, unisolated: the fallback shows and the slider is disabled after Off;
  - all of them: 0 exceptions and 0 blocked loads;
  - Renderer choices: unchanged.

  Evidence: `app/build/sw-isolation/runs/`.
- **Speed.** No speed claim. The defaults changed later the same day
  ([Defaults](#defaults-webassembly-in-worker-pools-with-shared-memory-19-october-2026)).

## On a phone: twist and HTTPS, 19 October 2026

- **Two-finger twist over Google tiles.** On an Android phone, turning two
  fingers in place over Google tiles did not orbit the ground anchor in the
  tiers that prepare Google tiles in a worker
  (`nativePlans.google.placement === "worker"`). A worker-prepared tile (renderer
  `src/babylon/googleTilePreparation.ts`) put its glTF pointers in the node's
  `metadata.gltf`; Babylon's loader keeps them in `_internalMetadata`. Picking
  (engine `src/sprites/picking.ts`) takes any metadata key outside
  `GROUND_METADATA_KEYS` for a point of interest, so `beginAnchorPan` refused
  the twist.
  - Prepared tiles now record pointers and extras where the loader does.
    renderer `tests/googleTilePreparation.test.ts` compares every node's,
    mesh's and material's `metadata` and `_internalMetadata` with the
    loader's, with and without extras.
  - Picking also counts `gltf` as ground, since the loader keeps a tile's
    extras there (engine `tests/picking.test.ts`).
  - The user confirmed the twist on the phone.
- **HTTPS for other devices.** A phone that opens `http://<this machine>:<port>`
  gets a page that is not secure, so it has no WebGPU and no isolation. A dev
  server started with `--host` now serves HTTPS with a self-signed certificate
  ([how](webassembly-shared-memory-ui-handoff.md#isolation-and-deployment)).
  Component execution has a global Shared memory switch. On such a page it
  reads "Not secure", and its ? says how to fix that
  ([UI](webassembly-shared-memory-ui-handoff.md#what-the-ui-shows-19-october-2026)).
- **Checked.**
  - Tests: app 432, engine 1203, renderer 415, and ui's isolation tests.
  - Typecheck and lint pass in the app and the tour.
  - Headless Chrome opened the tour at `https://192.168.0.103:5374/tour/minneapolis/`
    and went past the warning. The page was secure and isolated, with
    `SharedArrayBuffer` and a WebGPU adapter. Evidence:
    `app/build/https-dev/runs/`.

## Shared-memory threaded sky, 18 October 2026

The sky has a real shared-memory, multithreaded Rust/WASM build. It is
integrated in Earth, the tour and fly; [contract, results and commands for the
UI agent](webassembly-shared-memory-ui-handoff.md). The program is not complete:
isolation is built and checked in Chrome, Firefox and Safari, but not
deployed. Component execution shows it
([below](#component-execution-shared-memory-19-october-2026)).

- **Build.** `native/crates/earth-sky-shared` shares
  `crates/earth-sky-kernel` with the single build.
  `npm run build:sky-shared` produces
  `packages/native-sky/shared/sky-shared.wasm`:
  - atomics and bulk memory;
  - imported shared memory, a fixed 4 MiB (64 pages), never grown;
  - 8 stack slots of 64 KiB.

  `shared-build-metadata.json` records the tools and flags. The rest of the
  runtime is in `sharedCore.js` (the coordinator), `helper.js` and
  `threads.js`.
- **Work and protocol.** The dome's fan rows are the coarse workload. Threads
  claim rows dynamically, write disjoint ranges, and the coordinator assembles
  them in row order. Publication is epoch based, through Atomics:
  - helpers block in `Atomics.wait` in their own workers;
  - the coordinator waits only in bounded slices;
  - the page never waits.

  A timeout, trap, incomplete rows or a stack canary retires the shared core
  for that worker.
- **Exactness.** It is f64 with the same operation order and the realm's
  `Math`. Each mode (solo, parallel) is compared bit for bit with the TS
  reference on its first batch. The tables, radiance and irradiance keep their
  existing comparisons.
- **App.** `native.core.sky=threaded` (or global `threaded`) with the new
  `native.threads` (1–8, default min(4, hardware threads − 1)) asks for it.
  - Helpers are workers taken from `native.workers`, and are reserved only on an
    isolated page.
  - The ladder is threaded → single → TypeScript worker. Each rung keeps its
    reason, with no reload loop.
  - Without isolation the sky reports
    `fallbackReason: "not-cross-origin-isolated"` and starts no helper.
  - The plan adds `threads`, `sharedMemory` and `threadedFallback`; the report
    adds `shared`.
  - Other cores report `threadedFallback: "no-shared-build"`, and the worker
    pools stay independent jobs.
- **Isolation.** The Vite plugin `crossOriginIsolation()` is wired into the
  app, tour and fly. It is off unless `FOSS_EARTH_ISOLATION=enforce` (or
  `report-only`); COEP is `credentialless` by default.

  Built pages are isolated by the app's service worker (plan step 3, built
  18 October 2026, not deployed): it adds COOP, COEP `require-corp` and CORP
  to the page and the app's workers, and a first visit reloads once to be
  answered by it ([step 3](../webassembly.md#3-isolation-from-the-service-worker)).
- **Evidence.** Parity is exact everywhere it ran. The worker's sky work
  halves; the page and frames do not improve; total CPU rises (see
  [Measured results](#measured-results)).
- **Checks.**
  - `native`: `npm run check:sky-shared` and `npm test`, including
    `tests/sky-shared.test.mjs`.
  - `app`: `nativePanel`, `skySharedHelpers`, `nativeReport`, `skyWorkerConfig`,
    `browserPolicy` and `vite/crossOriginIsolation` tests.
  - `engine`: `tests/nativeTier.test.ts`.

## Execution settings feedback, 18 October 2026

The user selected **Component execution** as the tab name and authorized the
redesign. The previous combined Native execution selector and six-column status
table have been replaced by **Global defaults** and **Components**. Each
component combines settings and real running status. Collapsed titles show
only the name and trailing ?; expanded titles show Name: TS/WASM (N workers/main)
?, with diagnostics in that help tooltip and no duplicate Running line. Help
stays available in either state and does not toggle the disclosure.
An expanded component's title is the first natural-width item in its paragraph
grid; controls flow beside it and wrap, without a separate title row/body gap.
Full section headings remain separate.
Expanded components sort before minimized ones via a visual order override,
retaining the original order within each group and preserving mounted controls.
Components filter immediately by map.source.basemap: raster shows Terrain
heights, Terrain geometry and Imagery heights; Google 3D Tiles shows Google tile
preparation. Sky and Ground spatial index remain shared (finite-ray surface
queries can use the ground index in both modes). Hidden controls retain their
overrides and expansion state; reports keep all components. Hidden help closes,
and focus returns to a visible control when needed.
Mode filtering evidence: `app/build/component-execution/browser-map-mode/report.json`
(desktop/phone live 2D → Google → 2D visibility, retained nodes/expansion,
closed hidden help and focus transfer, existing UI checks; stable sources,
no page errors, normal Chrome exits). This checks UI applicability without
requiring a Google API key; it is not new 3D rendering/performance qualification.
Verification: `app/build/component-execution/browser-expanded-first/report.json`
checks title/control alignment at a wide width, narrow wrapping, multiple open
items ordered first, collapse ordering, retained focus and the prior desktop/phone
TS/WASM, help, pending/reload and light/dark behavior (stable sources, no page
errors, normal Chrome exits).
Component outlines and light fills follow actual execution: blue TS, purple
WASM, both for mixed execution; unknown/not-started stays neutral. Pending
selections do not change the running tint.
Tint verification: `app/build/component-execution/browser-component-tints/report.json`
(desktop/phone, light/dark, pending keeps actual color, successful reload switches
TS/WASM tints; stable sources, no page errors, normal browser exits).
Browser evidence: `app/build/component-execution/browser-compact-status/report.json`
(desktop/phone, actual TS → WASM → component TS, stable sources, no page errors,
normal Chrome exits). The
previous separate Currently running section is folded into Components. Global Manual choices separate implementation
(TypeScript/WebAssembly), work location (component default/background workers)
and worker parallelism (one worker per component/independent-job pools).
Auto retains the measured per-component choices. Original placement remains the
default, including raster's existing decode workers.

Component settings explicitly use global defaults, Auto, or Manual. Each manual
field can inherit its corresponding global decision, so changing only sky's
implementation does not pin its placement or parallelism. Unsupported worker
pool choices for components with one worker are disabled with an explanation;
WASM's main-thread placement is unavailable. Shared-memory WASM threading is
labelled unavailable rather than offered as an operational tier.

The services still capture their plans at startup. Edits immediately show
**Changes pending**, while each component continues to show its real backend
and an **After reload** description. **Apply and reload** carries the selected
settings in the URL, replacing stale URL selections and working without saved
storage. **Discard pending changes** restores the startup choices. Timings,
parity and work scope are expandable details. The UI follows the
[settings design requirements](../../ui-layout.md#settings-describe-one-decision-and-its-current-effect).

Stable tab/section IDs and legacy `native.tier` / `native.core.<component>` URLs
are retained. `custom` selects separate manual settings:
`native.implementation=typescript|wasm`, `native.placement=original|worker`, and
`native.parallelism=auto|serial`; component fields append the same names to
`native.core.<component>` and add `inherit`. `serial` actually limits raster
and terrain pools to one worker each; Auto permits their existing pool sizes
within `native.workers`. This is per-component independent-job scheduling, not
one thread for the entire app. The default and measured backend choices remain
unchanged. Focused settings, app composition, inheritance and reload tests live
in engine/tests/nativeTier.test.ts and app/src/app/{nativePanel,browserPolicy}.test.ts.

The following describes the **last verified app/UI baseline before the active
shared-memory assignment**, not the current existence of work-in-progress build
artifacts. That agent owns the final runtime and qualification update.
Shared memory and multithreaded Rust remain part of the requested performance
work. At that baseline, `single` can run independent jobs concurrently in several workers,
but each WASM instance owns unshared memory and executes a job sequentially.
Sky, imagery, Google and ground each currently use one dedicated worker; raster
and terrain have independent-job pools. `threaded` has no implementation and
falls back to TypeScript. That placeholder is not evidence of threaded WASM or
completion of the shared-memory architecture. A usable shared build needs its
actual memory/thread runtime, bounded scheduling, browser isolation, equivalent
outputs and end-to-end measurements; extra threads alone do not establish a gain.
That baseline is now superseded for the sky: see
[Shared-memory threaded sky](#shared-memory-threaded-sky-18-october-2026).

### Compact UI follow-up and separate assignments

The user clarified the standard design on 18 October: shortest useful button
labels (Global/Auto/Manual), one connected rounded segmented track, no visible
radio glyphs, compact natural-width paragraph flow, **? last**, and the existing
source-link icon **inside help, inline at the end of its text**. Use digits for
counts (1 worker), choose text/control order by grammatical sense, enclose each
paragraph-grid group in its own compact rounded rectangle, and hide long
explanations behind help/details unless necessary to understand the current
state. Familiar action icons must not be replaced with verbose labels. The shared `createChoiceGroup`
now uses the compact parameter track; this also fixes custom Renderer choices
at their UI owner. The standards and remaining audit TODOs are in
[UI layout](../../ui-layout.md#compact-segmented-choices), and summaries are in
all three organizations' shared AGENTS.md files. No rendering/quality defaults
changed. `nativePanel.ts` imports its own `nativePanel.css`; the Earth app did
not load these styles while they lived only in the optional host shell sheet.
This makes the compact layout a property of the shared panel in all hosts.
The standard choice factory now encloses logical controls and preserves one
segmented track; renderer wrapping is checked against its actual panel bounds.
The status view also reports unavailable/stale readings visibly if its source
throws, instead of retaining a hidden error and apparently current readings.

Current focused evidence is under app/build/component-execution/ and
ui/build/component-execution-*.log. The final report and screenshots are recorded
in that directory's functional.md; earlier runs and screenshots remain diagnostic
history. UI-source receipts cover the focused inputs listed in each report,
not the 1,260-file performance-profile inventory.

Latest UI verification (18 October):
`app/build/component-execution/browser-map-mode/report.json` passes desktop
1200×1000 and phone 390×900, with no page errors, unchanged focused source receipts
and both Chrome processes exiting normally; the preview is stopped. It includes
all title/help/tint/paragraph/order refinements and live basemap filtering, plus
TS→WASM→component-TS reloads, keyboard choices, inline source help, light/dark
Renderer segments and unclipped bounds. Final focused panel/report tests: 15
pass; changed TS lint and app typecheck/build/chunk checks pass. Full commands,
screenshots and prior broader checks/limitations are retained in
`app/build/component-execution/functional.md`. Earlier app/UI/engine/docs counts
and tour compatibility checks are historical checkpoints; shared-runtime changes
need new host checks. Last broader fly check had two unrelated thumbnail WebGPU
branded-type errors. The full UI suite had seven theme/injected-widget fixture
failures, all reproduced with the original controls from HEAD without resets.
Do not assume those failures still exist; recheck when that scope is affected.

Three fresh-conversation assignments preserve scope and coordination:

- [Shared-memory WASM now](webassembly-shared-memory-handoff.md): actual shared
  computation and cooperating threads, bounded ownership/runtime, app admission
  and equivalent-work measurements; keep UI files separate. Done for the sky;
  [results and contract](webassembly-shared-memory-ui-handoff.md).
- [Component execution after the shared runtime](webassembly-ui-handoff.md):
  consume that agent's actual capabilities/results and finish the UI contract.
- [Other UI violations](ui-compact-controls-handoff.md): audit and fix all other
  panels/hosts using the shared compact-control standards, preserving behavior.

## In-app A/B: what exists now

Six app cores follow the startup selection in the Earth app, the UMN tour
(which runs the app) and 0SFS fly (which uses the app's runtime):

| Core | `typescript` | `typescript-worker` | `single` (default) |
| --- | --- | --- | --- |
| `raster`: Terrarium RGBA to heights | TS in the decode workers (its original placement) | Same as `typescript` | WASM in the same decode workers after first-tile parity |
| `sky`: atmosphere tables, illumination, dome radiance | TS on the page, as before | TS in one sky worker | WASM in that sky worker after first-use parity |
| `terrain`: mesh target preparation at `applyGrid` seam | TS on the page, synchronous (original placement) | TS in terrain mesh workers | WASM in terrain mesh workers after first-use parity |
| `imagery`: adopted-grid height batches | Original synchronous grid sampling | One TS worker populates exact immutable-grid cache; page computes misses | Same cache/worker architecture, sparse WASM grid interpolation after first-batch parity |
| `google`: supported GLB/JPEG preparation | Original Babylon loader | One TS worker plus lazy Babylon resource adapter | Same adapter/worker, WASM geometry after first-use parity; browser JPEG decode |
| `ground`: immutable spatial indices | Original Babylon picking | TS BVH construction in one worker; synchronous TS traversal | WASM BVH construction in same worker; exported indices queried synchronously in TS |

- **Selection.** `native.tier` is one of `typescript`, `typescript-worker`,
  `single`, `auto`, `custom` or legacy `threaded`. The component overrides `native.core.raster`,
  `native.core.sky`, `native.core.terrain`, `native.core.imagery`,
  `native.core.google` and `native.core.ground` take `inherit` or a tier. All need a reload; a URL
  sets them for one load:
  - `http://127.0.0.1:5173/app/?set.native.tier=typescript-worker` vs
    `?set.native.tier=single`: the equal-work A/B;
  - `?set.native.tier=typescript`: the original placement;
  - `?set.native.core.sky=single`, `?set.native.core.raster=single`, or
    `?set.native.core.terrain=single`: one core alone.

  `nativeCorePlan` in `engine/src/settings/catalogue/native.ts` resolves each
  core to `{placement: original|worker, kernel}`. `NATIVE_CORES` holds each
  core's scope and `auto` choice: sky `typescript-worker`; all others
  `typescript`. Raster auto now follows the recorded slower-WASM evidence.
  `threaded` runs the sky's shared-memory build with `native.threads`
  cooperating threads on an isolated page, and falls back to single WASM with a
  reason elsewhere. Other cores have no shared build and report
  `threadedFallback: "no-shared-build"`.
- **Sky worker.**
  - Sky owns the protocol in `sky/src/skyEvaluation.ts` (a plain-data
    request/result) and `skyEvaluationWorker.ts` (the worker installer and
    `createSkyEvaluator`). `createSkyRuntime` accepts an `evaluator`.
  - The app supplies the worker realm in `app/src/app/skyEvaluation.worker.ts`;
    its kernel travels in `Worker.name` (`skyWorkerConfig.ts`).
    `browserPolicy.ts`/`browserRuntime.ts` create it only for a worker
    placement.
  - One request is in flight and the latest waits behind it. Stale
    generations are dropped.
  - WASM is fetched and compiled only for `single`, on first use, within a 5 s
    startup bound. Its first tables and each query are compared with TS
    before being admitted. A mismatch or startup failure leaves TS running in
    the worker, with the reason.
  - A worker error or timeout (15 s for the first job, 5 s after that) retires
    the worker, and the page evaluates from the next frame. Exposure,
    night lights and drawing stay on the page. The page shows the sky lit only
    after the worker's first result: a short startup delay.
  - `sky.stars.atmosphere=page|worker` isolates star placement with the same
    sky worker. Worker mode evaluates exact atmospheric transmittance and
    final f32 colors in TypeScript in both kernel arms. It retains one
    acknowledged catalogue generation; hot requests contain no star arrays.
    Full-color results carry f32 RGB only (12 bytes/star); billboard ECEF
    products use the original arithmetic on the page and the current frame's
    world transform synchronously. Catalogue,
    illumination and exact `toValue` stamps gate color admission; changed
    FOV/exposure or a pending/stale reply uses immediate page reference colors.
- **Terrain mesh workers.**
  - Terrain mesh target preparation at the `applyGrid` seam of `engine/src/babylon/createRasterTilesRuntime.ts`
    is dispatched to a pool of terrain mesh workers when `native.tier` or `native.core.terrain` requests a worker placement.
  - The protocol in `engine/src/browser/terrainMeshWorkerProtocol.ts` and kernel in `terrainMeshWorkerKernel.ts`
    run TypeScript or single-threaded Rust/WASM (`@foss-earth/native-terrain`).
  - First-use bit-parity validation: the worker compares its first native calculation against the TypeScript reference
    (`targetPositions` and bounds) before admitting WASM. A mismatch or load failure reverts the worker to TypeScript.
  - Generation tracking: `targetSeq` checks drop stale target preparations when tile detail changes before a worker replies.
  - On worker failure, `applyGrid` automatically falls back to synchronous on-page `prepareTerrainNumericGeometry`.
  - Settle-after-target: terrain settling waits for async worker target preparation to complete and apply, preventing premature settling.
- **Worker budget.** `native.workers` bounds the combined host worker factories.
  Dedicated optional cores reserve slots before the elevation pool fills;
  terrain mesh preparation uses at most two. Queue/memory bounds remain per
  service. Budget exhaustion reports a complete reference fallback.
- **Imagery batches.** `ImagerySurface.heightsAt` accepts contiguous f64 lat/lon
  coordinates for center/east/south probes. The current checkout already uses
  adopted height grids rather than the older profiled triangle-ray path. One
  worker samples exact sparse direct-neighbor pixels in TS or WASM and fills
  a generation-keyed exact cache. Cache misses use the
  complete page reference immediately. Heights stay f64: narrowing them to
  f32 would change slopes and selection. Canonical generations include the
  source arrays and ordered direct neighbors, so wrapper replacement alone
  preserves memoized values. Immediate page results can also be memoized;
  reports separate page-memo, worker and admitted-WASM cache hits. Whole-grid
  copying was rejected after a preflight copied gigabytes during navigation.
  The replacement sends only original f32 leaf pixels and their u32 indices,
  preserving complete mixed-zoom interpolation in each worker arm: at most
  16 pixels per query, or 1 MiB sparse pixels plus 128 KiB f64 coordinates
  per 8,192-point request. Original height buffers are never cloned/detached.
  Native packed pixels add at most 1 MiB plus 1,608 bytes of descriptors per
  batch; sparse snapshots are released after the job. Every live reply is
  also bit-compared with the exact saved page answers before cache admission.
  Page numeric state holds weak source references. Pending queries are bounded
  to 16,384, cached points to 131,072 and states to 512. Timeout or
  worker failure retires the worker to page sampling. The Native report
  separates cached results, page misses, copies and retained bytes.
- **Google adapter.** Supported GLB geometry/JPEGs pass through a bounded
  worker (8 jobs/64 MiB, 15 s timeout), then a lazy renderer entry creates
  matching hierarchy, handedness, transforms, unlit materials, samplers,
  mipmaps, copyright metadata and owned AssetContainers. Aborted/stale jobs
  close bitmaps; compressed JPEGs retain restoration data. The original
  loader handles unsupported profiles, EXIF JPEGs, and ICC JPEGs on WebGL
  explicitly. WebGPU ICC support passed the synthetic pixel check.
- **Ground adapter.** Workers build indices only for eligible static indexed
  Float32 meshes. Exported immutable BVHs are queried synchronously in TS,
  using current transforms, finite lengths, original face/scene tie order and
  Babylon normals. Geometry mutation invalidates immediately; a stale build
  cannot publish. The first real query compares/returns the reference.
  Unsupported/pending meshes use Babylon. Raster latitude/longitude samples
  keep the existing cell walker; flight caches and 120 Hz physics are unchanged.
- **Inactive cores load nothing.** With `typescript`, no sky or terrain workers are created
  and no WASM is fetched.
- **Report.**
  - `app/src/app/nativeReport.ts` builds one row per core: requested (by which
    setting), resolved, placement, kernel, actual (from the core's own status,
    never the request), state, parity, fallback reason, plus jobs, round-trip
    and work time and copy bytes.
  - The runtime registers its report in a WeakMap: `earthNativeCores(runtime)`.
  - `nativePanel.ts` renders the Native tab table, refreshed each second while
    shown. The Copy report gets a `Native cores: …` line, and
    `window.__fossEarthPanoramaTest.nativeCores()` returns the rows.
  - Hosts with their own overlay import `foss-earth/native`. Fly does this in
    `src/flight/createFlightSimApp.ts` and `hud/FlightControlPanel.tsx`
    (`nativeSections`). It is a separate entry because fly's tests mock
    `foss-earth/runtime` wholesale.
- **Parity outside the browser.**
  - `npm run check:sky` in native runs the actual `sky.wasm` against the sky package's TypeScript,
    through the evaluation the worker runs. It was bit-identical over 125 requests, 5 table cases and
    1,070,250 dome values; see `native/build/sky-parity.json`.
  - `npm run check:terrain` in native runs `terrain.wasm` against `@foss-earth/engine`'s
    `prepareTerrainNumericGeometry` reference across 97 test cases. All 172,908 vertex coordinates and
    172,908 target position values were bit-identical.
- **Harness.** `app/build/wasm-profile/runtime/profile.mjs` is ignored, local,
  and reusable:
  - `--set=id=value[,…]` passes settings as `?set.`;
  - `--no-watch` serves without file watching or HMR, because concurrent edits
    otherwise reload the profiled page;
  - `run.json` pins served-source fingerprints and 1,260 per-file receipts
    at start/end (`sourceUnchanged`), including actual binaries/wrappers,
    reference/worker source, config/public inputs and harness dependencies;
  - each scenario records the native report.

  `lib/native-ab.mjs <dir>` summarizes paired arms; `lib/inclusive.mjs`
  prints inclusive time per function. The ABBA script is
  `runs/2026-10-17-native-ab/run-ab.sh`.

## Measured results

The in-app A/B runs profile the page and workers with the same scenarios and
`--no-watch`. Admit only arms whose `run.json.sourceUnchanged` is true. Some
earlier sky arms changed source; they are retained diagnostic evidence, not
valid A/A controls.

- **Shared-memory threaded sky (`app/build/shared-memory/`).** Exact parity in
  every arm. Details are in the
  [shared-memory UI handoff](webassembly-shared-memory-ui-handoff.md#results-chrome-155-macos-10-hardware-threads).
  - **Kernel, browser worker** (`browser-parity-1/result.json`): 125 equal
    requests, one SHA-256 for TS, single and threaded 1, 2, 4 and 8. Warm dome
    p50: TS 17.0, single 12.1, t1 11.9, t2 6.3, t4 3.9, t8 3.0 ms (the A/A
    t4 was 3.9).
  - **Earth A/B** (`ab-2026-10-18/ab-summary.md`): 9 arms, `C-webgpu`,
    `sourceUnchanged`, 1202 sky computations each. The order was TS, single,
    t1, t4, t4, t1, single, TS, t8.
    - Sky worker work per job: single 3.05–3.07 ms, t4 1.73–1.83, t8 1.64.
      The round trip stayed 3.3–3.7 ms in every arm.
    - Page task and frame callbacks did not improve. They lie within each
      pair's A/A spread (up to 363 ms of page task), and the TS-worker arms
      showed the lowest page task.
    - Total sky CPU rose: single 4.2 s, t4 4.4–4.7, t8 5.1. Helper blocked
      time is profiled separately from their WASM work.
    - There is no power measurement.
  - **Apps** (`apps-check-2/tour`, `apps-check-6/fly`): isolated tour and fly
    ran `threaded (worker)` with 4/4 threads, parallel batches, parity `same`,
    0 exceptions and 0 blocked loads.
  - **Fallback** (`fallback-not-isolated`): a non-isolated Earth fell back to
    `single (worker)` with `not-cross-origin-isolated`, started no helpers and
    kept parity `same`.

- **Historical sky placement.** The unchanged-source final pair
  `2026-10-17-sky-placement/p7-page` and `p8-tsw` measured page task
  7455.14→5137.58 ms (−2317.56 ms / −31.1%) and frame callback p95
  6.0→2.9 ms. Earlier p1–p6 include changing-source arms or a CDP error;
  their old A/A spread/confidence claim is not qualified. Native-ab's
  `sky-1-tsw` and `sky-6-page` also changed source. The unchanged worker
  observations show no Rust advantage over TS in the same worker. Sky auto
  retains `typescript-worker`; the global default remains `typescript`.
- **18 October integrated app results.** The final 20-arm matrix under
  `app/build/wasm-profile/runtime/runs/2026-10-17-integrated-ab/final/`
  has unchanged source, one common source version and 1,260 per-file receipts
  for every arm. Original sky mean page task was 12.043 s; TS sky worker with
  page stars 8.105 s (−32.7%); the same worker with star colors 7.369 s
  (a further observed −9.1%, combined −38.8%). Original repeat spread was
  0.348 s; page-star worker spread 0.097 s; worker-star spread 0.618 s.
  Original callback p95 was 9.5–9.8 ms; TS worker-star arms 3.9/5.5 ms.
  Star offloading alone does not uniformly improve frame tails. WASM sky
  mean page task was 7.444 s, +1.0% versus the same TS worker architecture,
  within variation: no whole-app Rust gain. No C page errors/long tasks.
  Imagery's original/TS-worker repeat drift was 5.0–5.5 s, so apparent
  whole-page WASM savings are unqualified. Late TS/WASM worker totals were
  365/581 ms; the page reference remained faster. Sparse WASM inputs were
  ~31 MB per full run, parity same, no drops/fallback and 11.9–13.4 million
  admitted native cache hits; no full-grid copies or retained snapshots.
  Imagery auto remains TS. Preliminary full-grid and larger-star-payload
  runs remain diagnostic evidence, not qualified gains.
- **Ground after index invalidation fix.** A further six-arm matrix in
  `2026-10-17-integrated-ab/ground-index-final/` has unchanged source and
  the same output hash in all 12,800-query arms. Original finite-ray totals
  were 3.242/3.194 s; TS-built indices 1.923/1.966 s; WASM-built indices
  1.924/1.910 s (~40% lower query cost). Query traversal is identical TS
  in both accelerated arms: this is an index gain, not Rust. WASM build was
  slower (20.9–21.6 ms versus TS 14.9–15.4 ms). The fixture is an actual
  app static Float32 mesh; it is not a qualified aircraft flight. Ground auto
  remains original TS. The review fixed same-length index updates that
  bypass geometry notifications, including stale pending publication; 10
  ground tests and engine typecheck/build/lint pass after the fix.
  [Comparison guide](webassembly-ab-results-2026-10-18.md) contains exact
  commands, all launch URLs, scope, detailed controls and report paths.
- **Terrain target preparation A/B (`runs/2026-10-17-terrain-ab/`).**
  A 6-arm paired ABBA comparison was run under scenario `B-webgpu` (30 s flight from 8,000 km to street level)
  comparing on-page TypeScript (`typescript`), TypeScript in workers (`typescript-worker`), and single-threaded
  WASM in workers (`single`):

  | Arm | Settings | Page task ms | Page script ms | FPS | Frame cb p95 | Terrain actual | Terrain mean ms (targets) |
  | --- | --- | ---: | ---: | ---: | ---: | --- | ---: |
  | `terrain-1-ts` | `set.native.tier=typescript` | 13792.88 | 11137.23 | 59.80 | 16.9 | typescript (page) | – (–) |
  | `terrain-2-tsw` | `set.native.tier=typescript set.native.core.terrain=typescript-worker` | 15639.61 | 11083.66 | 59.14 | 16.6 | typescript (worker) | 25.53 (1304) |
  | `terrain-3-wasm` | `set.native.tier=typescript set.native.core.terrain=single` | 15463.49 | 10940.31 | 59.14 | 16.3 | wasm-single (worker) | 33.51 (1237) |
  | `terrain-4-wasm` | `set.native.tier=typescript set.native.core.terrain=single` | 15698.55 | 11051.10 | 59.11 | 16.0 | wasm-single (worker) | 30.44 (1269) |
  | `terrain-5-tsw` | `set.native.tier=typescript set.native.core.terrain=typescript-worker` | 15733.82 | 11166.05 | 59.03 | 16.8 | typescript (worker) | 28.31 (1151) |
  | `terrain-6-ts` | `set.native.tier=typescript` | 13770.79 | 11228.80 | 59.77 | 16.9 | typescript (page) | – (–) |

  Key findings:
  1. **A/A stability:** The repeated on-page control (`terrain-1-ts` vs `terrain-6-ts`) showed only 22 ms difference in total page task duration (13792.88 vs 13770.79 ms, <0.2% variance). All arms verified `sourceUnchanged: true`.
  2. **WASM vs TypeScript in worker:** WASM single achieved bit-identical parity (`parity: "same"`) across all 1,237–1,269 targets with 0 losses, but work time was slightly higher (30.44–33.51 ms) than TypeScript in the worker (25.53–28.31 ms) due to buffer allocation/marshaling overhead for float vertex coordinates.
  3. **Page vs worker placement:** Offloading target preparation to workers increased total page task time from ~13.78 s to ~15.64 s (+1.8 s). For 1,200+ mesh chunks, the message-passing serialization (`postMessage`, `Transferable` buffers) and event loop scheduling overhead outweigh the arithmetic savings of computing the grid off-thread.
  4. **Auto decision:** `NATIVE_CORES.terrain.auto` remains `"typescript"` (on-page reference), fully justified by the measured data.
- **Raster decode.** WASM in decode workers was 11.8–14.1 ms vs 8.9–10.7 ms for TypeScript. Page task time was unaffected since decoding is already worker-side.
- **A/B tooling validation (`research/scripts/benchmarks/earth-compare/shared.mjs`).**
  Wrapped comparison execution in `try ... finally` to ensure worker disposal via `a.dispose?.() ?? a.measure?.dispose?.()`. Added `moduleReceipts` to `report.json` pinning module preparation digests and metadata. Validated with 12 paired trials in research (`candidate-faster`, -37.6% amortized batch decode throughput, clean exit 0).

## Evaluated candidate architectures

1. **Star field update (`createStarField.update`).**
   - **Profile:** In worker sky modes, `createStarField.update` is the largest remaining sky cost on the main thread (~1.23 s of 1.35 s total sky page CPU). It evaluates `sunTransmittance(altitude, muSun, transmittance)` and computes billboard corner quad coordinates for ~9,000 stars whenever the sky time advances.
   - **Lag constraint:** Moving the entire star field calculation to a worker would introduce 1 or more frames of visual latency against camera rotation: stars would visibly jitter/lag against the horizon as the camera turns.
   - **Architecture:** Billboard vertex quad coordinates depend directly on the camera/globe orientation in scene space (`toScene`) and must stay on the main thread (or move to a GPU billboard vertex shader). Star atmosphere transmittance and color evaluation depends only on observer altitude and zenith cosine `muSun` (which change with time, not camera orientation), allowing color batches or transmittance lookup tables to be updated asynchronously without position lag.

2. **Imagery selector height sampling (`imagerySelector.evaluateView` → `surfaceSample`/`heightAt`).**
   - **Profile:** Largest single page CPU consumer (~2.8 s of 4.0 s in `evaluateView`).
   - **Mechanism at the old profile:** The 3×3 grid plus nearest point uses center/east/south probes, 30 height queries per candidate. That trace used triangle rays. On resumption the current source already used adopted grid interpolation; that earlier ray cost must not be treated as a new batching gain.
   - **Implemented:** contiguous f64 coordinate batches to sparse TS/WASM grid samplers, with exact page misses/cache admission. Returning f32 heights would alter interpolated slopes, so results remain f64. This precision choice preserves complete imagery plans in differential tests.

3. **Projection tiled/windowed input (384 MiB blocker).**
   - **Issue:** An 8192×4096 Float32 RGB equirectangular source is 384 MiB (402,653,184 bytes), exceeding the 128 MiB buffer limit and 256 MiB linear memory cap of 32-bit WASM.
   - **Implemented solution:** adaptive output blocks derive exact wrapped source windows containing every bilinear tap. The wrapper targets 64 MiB windows, bounds total live payload below 128 MiB, and retains the 256 MiB linear-memory cap. It does not assume an entire polar face fits a rectangular 96 MiB bound.

## Working notes

- Other agent sessions edit these checkouts concurrently. Record git status
  first, re-read before each edit, use exact edits, and never stage, commit or
  discard others' work. Freeze served sources during an A/B, or run with
  `--no-watch` and discard arms whose fingerprints changed.
- Pre-existing failures not from this work:
  - engine's old `previousCeiling` type error is gone; full typecheck passes;
  - 14 fly tests fail in 4 files: the JSBSim property batch, flightParameters
    4096 vs 1024, the HUD "3D Tiles" label, and a sandbox `listen EPERM`
    in the stowed-gear fixture. Fly typecheck currently fails on the app
    thumbnail WebGPU bind-group type brands. Other
    sessions' in-progress edits are there.
  - docs source fixtures pass (15 tests); the global link check still fails
    because its recorded research testing link is absent from the unchanged
    `docs/deploying.md`. Logs are in `docs/build/wasm-continuation-20261018/`.

  Recheck rather than assume.
- Latest completed checks: app 68 files / 390 tests, 12 browser-harness
  assertion tests, typecheck and production build (startup lazy graph check
  included); tour typecheck and 75 tests / one skipped; sky typecheck/build/
  consumer/lint and 19 focused star tests; engine full typecheck/build and
  focused integration/parity tests. The sparse refinement passes 71 engine
  tests, full engine typecheck/build/lint and 176 actual native dense/sparse
  cases / 147,110 coordinates. RGB-only star replies pass 16 further focused
  tests, typecheck/build/lint and full-catalogue GPU byte parity. App production
  build, 19 focused app tests and tour typecheck pass after both revisions. Fly remains 14 failed / 2151 passed / one expected
  failure across 203 files; preserve these independently of native results.

## Toolchain, ABI and ownership decisions

The local workspace is `foss-earth/native`, with six crates in `Cargo.toml`.
Rust and Cargo are **1.99.0**, through the installed `stable` alias, and
Binaryen is **132**. The `wasm32-unknown-unknown` standard-library target was
installed after the user instructed resumption. The target is present; older
notes saying it is missing are historical. There was no nightly/toolchain
upgrade, wasm-bindgen installation, extra external Cargo dependency, sudo,
remote repository creation, commit, push or deployment in this pass.

`native/toolchain.lock.json`, `rust-toolchain.toml`, `Cargo.lock`, and the build
scripts pin the installed tools. Builds run offline and serially with release
LTO, `simd128`, Binaryen `-O3`, and at most **256 MiB linear memory**. SIMD is
enabled, not a claim that each kernel was hand-vectorized. The sky also has a
shared-memory build: atomics, imported fixed 4 MiB shared memory, no TLS or
rayon, with the threads coordinated by its own JS runtime. Every other core
remains single-worker with unshared memory. The app budgets its worker
factories together via `native.workers`, including a threaded sky's helpers,
which it reserves only on an isolated page. WASM32 describes pointer
width, not a ban on f64/i64; moving to memory64 is not an assumed speedup.

The raw versioned ABIs avoid wasm-bindgen. Instance-local registries own
allocations and model/result handles; calls validate kind, exact length,
ownership, bounds and aliasing before accessing them. Unknown caller pointers
are not turned into slices. Payload, element, job and object limits are
explicit and differ by core. Wrappers refresh views after memory growth, copy
inputs/outputs across the ABI, and attempt owned releases in `finally`.
Returned arrays are caller-owned copies, never WASM views whose lifetime ends
with a later allocation/free. Preserve cleanup failures, stale-generation
rejection and explicit disposal when wiring these ports into hosts.

Transcendentals are imported from the **executing worker realm's `Math`** where
the reference uses them, instead of substituting Rust libm. Terrain imports
include its rounding functions; sky imports `exp`, `log`, `sqrt`, `sin`, `cos`
and `pow`; projections preserve their `atan2`/`asin` ordering and compensated
three-term preparation hypot separately from core normalization. Preserve f64
operation/reduction order, original f32 stores, signed-zero/NaN semantics and
tie rules. Do not add fast math, lower precision, fewer samples or coarser
detail to manufacture an A/B gain. Imports must be trusted/non-throwing; treat
a trapped or blocked worker as a failed generation, not a partial result.

The five new terrain, ground, Google, sky and projection wrappers refuse browser
page execution. The original raster wrapper itself has no page guard; its actual
app loading/execution is confined to decode workers. Hosts own workers, bounded
async import/compile startup, cancellation, generations and publication. A
Promise timeout cannot interrupt synchronous WASM; bound jobs and terminate a
failed owned worker when needed. Keep engine/sky/projection ports structural:
they must not gain an implicit dependency on app code or each other.

## Six implemented cores and exact remaining integration

Source roots below are relative to `foss-earth/native`; corresponding JavaScript
references and host ports are in sibling checkouts.

| Core | Implemented Rust numerical work | Current wiring and meaningful remainder |
| --- | --- | --- |
| `earth-raster`, `packages/native-raster` | Opaque Terrarium RGBA bytes to original Float32 height formula, dimensions/alpha validation. | App `terrainDecode.worker.ts` uses the injected core. Browser image decoding/canvas readback remains native browser work. This is a decoder slice, not all raster processing. |
| `earth-terrain`, `packages/native-terrain` | Grid/ordered-neighbor interpolation, f64 geometry, f32 targets, bounds and retained batched f64 grid queries. | `native.core.terrain` targets at applyGrid; `native.core.imagery` batched adopted-grid queries/cache. Initial meshes and callback heights stay TS. Existing geometry parity plus 176 dense/sparse batch cases / 147,110 coordinates pass. |
| `earth-ground`, `packages/native-ground` | Immutable BVH build, finite f64 ray batches and exported compact indices. | `native.core.ground` TS/WASM worker build connected to scene queries. Synchronous TS traversal preserves transforms/ties/normals, first-query admission and immediate geometry invalidation. Higher-precision CPU arrays, unsupported/morph/custom meshes retain Babylon. Raster samples keep cell walker; flight cache unchanged. 514 native/reference rays pass. |
| `earth-google`, `packages/native-google` | Strict GLB2 envelope and owned positions/UV/u8/u16 index decode. | `native.core.google` TS/WASM worker connected through lazy renderer/google-preparation adapter. Matching hierarchy/material/texture/container lifetime; EXIF and WebGL ICC retain original loader explicitly. Chrome synthetic pixels pass 48 cases across WebGPU/WebGL2 (36 actual WASM, 12 original ICC fallback). |
| `earth-sky`, `packages/native-sky` | Atmosphere marching, radiance fans, irradiance and three table builders. | Selectable sky worker, exact parity and earlier placement A/B. Full star color batches are TS in that same worker; synchronous current-frame billboards and stamped page fallback. Full 9,096-star GPU buffers match the original. |
| `earth-projections`, `packages/native-projections` | Full linear-RGB reprojection, tiled/gutter regions, coordinate kernels and bounded source windows. | Actual sphere-image CLI worker consumes full 8192 sources through bounded exact windows. Codecs/pyramid/prefilter policy remain JS. 378 differential cases and 264 encoded outputs match. No Rust speedup measured. |

Useful source entry points:

- `engine/src/browser/terrainNativeDecoder.ts`, `terrainDecodeWorkerKernel.ts`,
  `terrainDecodeWorkers.ts`; `engine/src/settings/catalogue/native.ts`;
  `app/src/app/{terrainDecode.worker,terrainNativeWorkerConfig,browserPolicy}.ts`.
- `engine/src/terrain/terrainNumericGeometry.ts`;
  `engine/src/browser/terrainMeshWorker{Kernel,Protocol}.ts`,
  `terrainMeshWorkers.ts`; `engine/src/babylon/terrainMesh.ts`.
- `native/packages/native-ground/{index,worker}.{js,d.ts}` and its README, plus
  `engine/src/babylon/{surfaceQuery,rasterSurfaceSampler}.ts` for the still-active
  scene behavior.
- `native/packages/native-google/{index,worker}.js` and their declarations;
  the loader contract in the program's Google gate must govern publication.
- `sky/src/{atmosphere,atmosphereNumericKernel,skyState,stars}.ts`;
  `sky/src/babylon/{createSkyRuntime,createStarField}.ts`.
- `sphere-equirectangular/src/preparation.ts`,
  `sphere-cubemap/src/preparation.ts`,
  `sphere-tiled-cubemap/src/preparation.ts`, and `images/src/resample.ts`.

`native.tier` offers `typescript`, `typescript-worker`, `single`, `auto` and
`threaded` as a reload-only control, with per-core overrides; see
[In-app A/B](#in-app-ab-what-exists-now). Its default is **single** since 19
October 2026, with `native.sharedSky` on. For
the Terrarium worker: forced single performs lazy startup and
exact first-input native/reference comparison per worker; the first result is
the reference's. Compile/start/decode failure or parity mismatch selects a
permanent TS fallback for that worker, with requested/actual tier, reason and
counters in diagnostics. Threaded reports an explicit unsupported TS fallback.
The separate existing page-versus-worker first-tile readback comparison stays.

The app owns selection, first-use admission and complete reference fallback for
all six rows above. Raw native wrappers still report unvalidated themselves;
the host owns scoped validation evidence. Projections use an independent CLI
selection so codecs/pyramid and one worker stay identical between arms. Sky's third factory argument
accepts `{ execution: "worker", createKernel, createTables?, onStatus? }`.
Each query operation checks its first output, and a first full native table set
is compared with JS before admission. Reuse the same ports object per worker
for later builds to skip JS precompute after that comparison; reference tables
are returned for the first checked atmosphere. Dispose native atmospheres/BVHs
and old worker generations explicitly.

## Artifact snapshot and evidence

These are real offline-compiled/optimized development artifacts, private version
`0.1.0`, pinned by current per-package `build-metadata.json` on 18 October 2026.
The older ignored `conversion-artifacts.json` aggregate describes an earlier build.
Paths in this table are under `native/`. A rebuild must refresh the source and
output receipts together; hashes below describe this snapshot, not future code.

| Binary | Bytes | SHA256 |
| --- | ---: | --- |
| `packages/native-raster/single/raster.wasm` | 16,459 | `533e6afcabf60238c41cf9ea6ebeeb7e84c571b810e1428dd69ee89240b3f8c3` |
| `packages/native-terrain/single/terrain.wasm` | 33,297 | `24e02faab3dac2561ecc38a15cbaf88556ba9c9c79f743cea1dcd5ede853aba1` |
| `packages/native-ground/single/ground.wasm` | 30,911 | `1fb1c9d0145b4b02b4b07d48f001ebb7018df181457062bd9cc0e15305a00e0a` |
| `packages/native-google/single/google.wasm` | 18,316 | `f5ef0ee850a26a7bc729d9fb4aad2d7673d7d0bedcae22e1d8b765731b7e9955` |
| `packages/native-sky/single/sky.wasm` | 34,810 | `e4b03a0b594130b3bf60f60149befe934c04fe5a7539cdf9b039bf5ec33cd687` |
| `packages/native-projections/single/projections.wasm` | 33,660 | `30bf17b27df9002d00c38848cd437925e007995b883541ccbe538736bdca6aa2` |

Every package has `build-metadata.json` containing toolchain, build commands,
input source digests and output digests. `native/scripts/build-raster.mjs` and
`build-cores.mjs` implement the serial offline builds. Build logs are
`native/build/conversion-raster-build.log` and `conversion-cores-build.log`.
Successful compilation establishes an artifact, not numerical equivalence.

Before the testing pause, the exact raster digest above passed differential
checks against the engine's public TypeScript decoder: **263 cases and
17,827,205 compared pixels**, including all **16,777,216 RGB values**, unaligned
views, dimensions and alpha failures. Outputs were byte-identical and inputs
unchanged. Evidence: `native/build/raster-parity.json`, `wasm-parity.log`,
`wasm-build.log`, and `wasm-receipts.log`.

A bounded local functional fixture then bundled the actual app worker and ran
in installed **Chrome 155.0.8059.80** with generated PNGs, no Google/network-map,
power or performance measurement. TS fetched no WASM; single fetched that exact
binary, passed first-input parity, and used native output on the second tile;
threaded reported its explicit fallback. A deliberately missing owned-localhost
WASM returned permanent startup fallback without retry. Height bits, malformed
tile/alpha errors and recovery matched. Chrome/server exited and the isolated
profile was deleted. Evidence: `app/build/native-worker-check/result.json` and
`check.log` with the ignored fixture source beside them.

Prior focused engine/app/wrapper checks are recorded in the ignored handoff;
they do not qualify later conversion code. The sky has since passed
`check:sky` and the in-app A/B under [Measured results](#measured-results).
Terrain target/height, ground, Google and projection functional checks have
since passed as described below. No power qualification is claimed.

Historical source-check failures must be rechecked, not assumed current. The
engine's broader typecheck reported an unrelated `previousCeiling` excess field
in `tests/terrain/detailDistribution.test.ts`; its distributable build and
focused native tests passed. App typecheck, focused lint and 29 settings/policy
tests passed before the testing pause. These are recorded observations at those
revisions, not a claim that every dirty checkout currently passes or fails.

## Known blockers and useful next work

1. **Prepared terrain metadata and picking: resolved.**
   `GROUND_METADATA_KEYS` in `engine/src/sprites/picking.ts` now includes
   `preparationAdmission`, so a prepared tile keeps its provenance and stays
   ground. `engine/tests/spritesCompass.test.ts` covers it.

2. **Projection input memory: bounded path implemented.** An unchanged
   8192×4096 RGB f32 source remains 384 MiB in its owning Node worker. Exact
   per-output-block UV/tap bounds copy only wrapped source windows into WASM;
   adaptive blocks stay below the existing 128 MiB payload / 256 MiB memory
   caps. All original samples, gutters, wrap/clamp and reduction order remain.
   `native/scripts/check-projections.mjs --large`: 378 cases, 2,683,584 f32
   values bit-identical; peak payload 60,500,448 B, linear memory 95,551,488 B.
   `sphere-image/node/prepare-cli.mjs --native-tier typescript-worker|single`
   actually runs preparation in one owning worker; single adds
   `--projection-module ../native/packages/native-projections/index.js`.
   `prepared.json.nativeCores` records actual/parity/fallback/copies/memory and
   hashes. 264 encoded PNG outputs matched exactly in
   `sphere-image/build/projections-window/consumer-parity.json`.
   Native was slower in these observations; this is functional support, not
   a gain. Direct browser photos use rectangle textures or GPU equirectangular
   sampling, with no CPU reprojection job to accelerate.

3. **Current raster A/B adapters measure a batch.**
   `native/scripts/{prepare-ab,worker-measurement,node-raster-worker}.mjs`
   prepare actual TS and WASM Node workers. Each timed job performs **64 hot
   decodes of a 256×256 tile**, with one input clone and one final output
   transfer. Startup, fixture creation and warmup are outside trial timing.
   This is amortized batch throughput, not production per-tile latency or
   PNG/WebP/canvas decode time. Keep that distinction if reusing the adapter.

4. **A/B receipts/disposal: implemented.** The research shared runner records
   adapter module receipts and disposes both adapters/workers in `finally`.
   Native preparation exports implementation hashes and explicit disposal.
   The app profiler records source fingerprints, per-file implementation/
   config/harness receipts and its harness digest, runs `--no-watch`, and
   closes Chrome normally before its owned-process
   fallback. Keep A/A spread, actual output fingerprints and worker/copy
   overhead separate from kernel arithmetic.

5. **Qualify broader workloads from current evidence.** App sky, imagery and
   static-ground A/B now has paired/A/A evidence; actual panorama preparation
   reaches windowed projections. Sky placement and static spatial indices show
   gains; no whole-app WASM arithmetic gain is established. Qualify real Google
   views and representative flights next, retain original fallbacks, and
   distinguish architecture/cache gains from Rust arithmetic. Initial mesh generation/refinement and the full W6/W7
   packing/shared/flight gates remain beyond these integrated slices.

Additional worthwhile numeric work remains beyond the current kernels:

| Remaining numerical work | Source / boundary |
| --- | --- |
| Repeated terrain target recomputation and refinement interpolation | `engine/src/babylon/{createRasterTilesRuntime,terrainMesh,meshRefinement}.ts`; building a surface does not yet move the runtime's later refinement path. |
| Terrain/imagery selection, projection error, visibility and coverage calculations | `engine/src/terrain/terrainSelector.ts`, `engine/src/terrain/imagery/imagerySelector.ts` and `imageryGeometry.ts`; separate flat numeric jobs from request/residency state. |
| Imagery page/gutter/mip numeric loops and blank checks | `engine/src/terrain/imagery/{imageryPagePreparation,imageryAtlasLayout}.ts`; existing atlas workers still execute TS/browser code. |
| Area resizing and panorama pyramid generation | `images/src/resample.ts`, `sphere-equirectangular/src/preparation.ts`; pyramid/prefilter computation is not covered by projection reprojection. |
| Dome directions/luminances, Sun/Moon disc filling | `sky/src/skyState.ts`; the new atmosphere core supplies samples, not completed dome buffers. |
| Batched star proper motion, directions, tint/light, vertex/color filling | `sky/src/stars.ts`, `sky/src/babylon/createStarField.ts`; isolate numeric buffers from Babylon resource updates. |
| Solar/lunar series and related numeric transforms | `sky/src/{solarPosition,lunarPosition}.ts`; legitimate candidates, but often lower-frequency work than atmosphere or per-star/per-vertex loops. |
| Raster ground traversal, frame cache and transformed scene-query composition | `engine/src/babylon/{rasterSurfaceSampler,surfaceQuery}.ts`; mesh-local triangle BVH is only one piece. |

Do not count browser/renderer orchestration as missing Rust merely because it
stays JavaScript. Fetch, cancellation, storage policy, settings/DOM, browser
image decode, scene/material/AssetContainer ownership, shader/GPU resource
upload and scheduling still need host APIs. Some pure geometry inside coverage
or selection may be worth a bulk port; wrapping a browser API in WASM is not
itself a gain. GPU work will not disappear because a CPU loop moved to Rust.

## W0 context retained without blocking relative work

The latest ignored operational handoff is
`docs/build/webassembly/W0/2026-10-16/summary.md` (updated 17 October); it records
source checks, provenance, diagnostic captures and failed baselines. Earlier
`docs/build/webassembly-handoff/2026-10-16/summary.md` describes the original
documentation handoff only. Ignored evidence is local and is not a published
artifact; keep the curated implementation facts above in versioned docs.

W0's live/exclusive qualification window is still deferred. The user selected
0% brightness for a future battery run; it was not changed by the agents. A
fresh idle baseline and confirmed discharge/Low Power Mode are needed then.
Google Clean-style selectors, equal canvas/projection framing, common masks
and sufficient motion-path samples still need live qualification. The old
Google address polling supplied endpoints, not a proved continuous path;
Clean-style setup inside its timed load also invalidated that timing. No W0
Google/flight/power baseline is qualified.

The old low route failed its 20 m altitude tolerance. Subsequent deterministic
installed-JSBSim controller tuning brought low/cruise maxima to about
13.97/13.36 m without a renderer/network, but live route/map qualification has
not rerun. Those simulation results do not retroactively admit the old flight
or its diagnostic whole-machine watts. Relative interleaved A/B does not
require the full W0 battery study; absolute watts and the program's final
Google Earth comparison remain separate tasks.

The primary checkouts contain later fixes and unrelated dirty work. Do not
restore stale research/fly worktrees or discard existing edits. Native is a
local development repository, not a published remote package. Existing
JSBSim/audio C++ WASM predates these Rust cores and is unchanged. Re-read each
repository's AGENTS.md and the fresh task before continuing.
