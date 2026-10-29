# WebAssembly builds

The plan for matching or beating Google Earth's speed in FOSS Earth, 0SFS and
the UMN tour. It covers three things:

- cross-origin isolation, for shared memory;
- Rust cores compiled to WebAssembly (WASM);
- the work around them that the comparison also needs.

Shared memory is on by default, and everything still works without it.

The steps are ordered by what they should save against what they should cost.
They use the method, effort letters and IDs (P1, R3, C1, T7 and so on) of the
[Optimization backlog](../optimization-backlog.md). F IDs are 0SFS's, from
[its backlog](https://github.com/0SFS/research/blob/main/optimization-backlog.md).
[WebAssembly agent](implementation/webassembly-agent.md) is the executable
brief: the same steps as gates W0 to W12, with the files, the checks and what
to ask the user.

Written 16 October 2026 and revised 17 October 2026. Step 0's harness and flight
routes are implemented but still need qualification. Controller simulation
checks and comparison source work are complete. The user deferred the exclusive
window and selected 0% brightness; live runs await a later agreed start time.
No comparison baseline is qualified yet.
The gains are estimates to order the work; step 0 measures them.
[Status](#status) records what is done.

The next conversation's focused assignment is the
[Rust/WASM A/B handoff](implementation/webassembly-ab-handoff.md). Its retained
[WebAssembly state](implementation/webassembly-state.md) and
[W0 state](implementation/webassembly-w0-state.md) distinguish implemented
source from usable integration and qualified measurements.

User direction, 17 October: W0's battery/exclusive window does not block Rust
conversion, functionality parity tests, or switchable JavaScript/WASM A/B
work. Those proceed independently; power and whole-app performance claims
still require their own qualified measurements. The current continuation
authorizes focused functional/browser checks and shared-machine relative A/B
for the connected paths. The earlier testing pause is historical. Much of the
architecture below describes the original target. Since 19 October the app
defaults to single-threaded WebAssembly cores in workers, with shared sky on
where supported; the [current core guide](../webassembly-cores.md) records the
implemented behavior and fallbacks. This is not a measured speed or power claim.

## Goal

1. **As fast as Google Earth on the web, or faster**, on the same machine and
   the same views:
   - a complete view as soon, cold and warm;
   - frame times as steady while the view moves;
   - no more main-thread time, CPU, memory or power.

   Step 0 builds the comparison and step 12 repeats it. Whatever gap is largest
   then becomes the next step.
2. **0SFS near 15 W** on an M5 MacBook Air in Low Power Mode. On 10 September
   the pilot saw about 60 fps at 15 W aloft and 40 fps at 24 W near the ground
   ([0SFS backlog](https://github.com/0SFS/research/blob/main/optimization-backlog.md#the-15-w-goal)).
   It is a check that the work is done, not a requirement: nothing gets worse
   to reach it.
3. **Nothing changes but speed.**
   - Each WASM core reproduces the TypeScript's output bit for bit.
   - Some defaults change what is drawn: resolution, frame cap, horizon detail.
     Each is chosen from before-and-after screenshots, never adopted silently.

### Where Google Earth's lead comes from

Its internals aren't public. What is known comes from Google's
[write-up](https://web.dev/case-studies/earth-webassembly) and the backlog's
[reading](../optimization-backlog.md#why-google-earth-is-still-faster):

| Google Earth | Here | Steps |
| --- | --- | --- |
| C++ compiled to WASM with threads. Streaming and decompression on background threads. | Isolation from our service worker, and Rust cores on worker pools that share memory. Until then, the TypeScript moves into workers. | 3 to 9 |
| Tiles made for its renderer. | Google Photorealistic 3D Tiles arrive as glTF, which Babylon's loader turns into meshes on the main thread. The fix is a loader in a worker for exactly that format, with packed vertices. | 7 |
| One engine for one data set. | 3d-tiles-renderer, Babylon, our raster terrain and the sky each keep their own memory and traversal. | 5, 7, 10 |
| Less detail while moving, and little toward the horizon. | Resolution and detail while moving; horizon and haze culling. | 1, 10 |
| Nothing drawn while nothing moves. | Done ([Render on demand](../render-on-demand.md)). Step 1 checks that nothing else runs at rest. | 1 |

## Decisions

- **GitHub Pages stays the host.** Each repository is its own Pages site, so no
  one site nears the 1 GB limit. Pages can't send response headers:
  - the apps' own service worker adds the ones isolation needs;
  - the Vite dev and preview servers send them directly.
- **Shared memory is on by default.** The apps ask to be cross-origin isolated
  on every visit, the first one included. Settings → App files → Shared memory
  turns it off. Without isolation everything still works, more slowly.
- **New WASM cores are Rust.** JSBSim stays C++ built with Emscripten.
- **One binary per map family, and one per library core.** The map families are:
  - Google Photorealistic 3D Tiles;
  - raster terrain and imagery.

  A page downloads only the binaries its map and features use.
- **Each binary has a threaded and a single-threaded build.**
  - A module built for shared memory can't start without it.
  - Its threads need nightly Rust; the single-threaded build stays on stable.
  - The app stays one build and picks a binary when it starts.
- **Workers before WASM.** Each core first moves into a worker as the same
  TypeScript. That move:
  - takes its cost off the main thread, which is most of the gain;
  - proves the messages, the transfers and the fallback.

  Rust then replaces the worker's TypeScript where the worker's own time, or
  shared memory, makes it worth it.
- **The TypeScript stays the reference.**
  - Every Rust core reproduces it bit for bit. The proof is the one
    [Performance](../performance.md) uses for the JavaScript speedups.
  - At run time a core is used only after its first input matches, as the
    terrain decode worker is now.
  - On a mismatch or a failure the TypeScript runs.
- **Built on the Mac, committed, verified.** There is no hosted CI.
  - The toolchain is pinned in `toolchain.lock.json`.
  - Each package commits its binaries, their JavaScript glue and a
    `build-metadata.json`. The metadata holds the toolchain, the flags, and the
    sha256 of inputs and outputs.
  - Where the pinned toolchain is installed, the package's check rebuilds and
    compares. Elsewhere it checks the hashes, the size budget and the tests.

A page runs one of three tiers, chosen once at startup in
`engine/src/settings/catalogue/wasm.ts`:

| Tier | Chosen when | Runs |
| --- | --- | --- |
| Threaded WASM | All of: the page is cross-origin isolated; `SharedArrayBuffer` exists; SIMD and atomic-operation modules validate; the active core can create its declared shared memory and start a worker; there are at least two cores; the Shared memory setting is on | The cores in WASM with SIMD, on worker pools that share one memory per binary. The main thread reads published results in place. |
| Single-threaded WASM | A SIMD module validates | The cores in WASM with SIMD, inside each worker. Buffers are transferred, as now. |
| TypeScript | Otherwise, or a core failed its first-input check | Today's code, in the workers the steps below move it to |

The startup choice is a capability ceiling. Each core is loaded and probed
only when its feature is used, and may fall back independently. A raster map
never downloads Google's binary to decide its tier. Reserve memory for the
page as a whole, including the sky, textures and JSBSim, not just each core.

`?set.wasm.tier=threaded`, `single` or `typescript` requests a tier for A/B
runs. It cannot bypass a failed capability check. Diagnostics → Copy report
says the requested tier, the actual tier of each active core and why it ran.
Compile, startup, memory, timeout and parity failures fall back for that core
for the rest of the session; none leaves the app waiting indefinitely.

## Ranked steps

| Step | What | Gain (estimate) | Effort | After |
| ---: | --- | --- | :-: | --- |
| 0 | [Measure against Google Earth](#0-measure-against-google-earth), and power (M1, M2) | Makes every number real | M | — |
| 1 | [Cheap wins first](#1-cheap-wins-first): pixels, frames, idle, shaders (P1, P4, P7, C6, S4, T1, T2, T3, T5) | GPU fragment work −45 to −75% on 2× screens; power on battery −30 to −50% | S each | 0 |
| 2 | [JSBSim's exceptions and flags](#2-jsbsims-exceptions-and-flags) (0SFS F6) | Physics CPU −10 to −30% | S | 0 |
| 3 | [Isolation from the service worker](#3-isolation-from-the-service-worker) (C7) | Threads for steps 4 to 11; `performance.now()` to 5 µs | M | — |
| 4 | [Toolchain, packages and loader](#4-toolchain-packages-and-loader) | None by itself | M | — |
| 5 | [Raster terrain off the main thread](#5-raster-terrain-off-the-main-thread) (R2, R3, R1, R4) | 2 to 10 ms of main thread per arriving tile | M | 0; 4 for Rust |
| 6 | [Ground: height grids and BVHs](#6-ground-height-grids-and-bvhs) (C1, 0SFS F4) | Near-ground physics CPU −95% | M | 5 |
| 7 | [Google tiles off the main thread](#7-google-tiles-off-the-main-thread) (T2, T7) | Main thread under 0.5 ms per tile; geometry memory −40% | L | 0; 4 and 6 for Rust and sharing |
| 8 | [Sky binary](#8-sky-binary) | `createAtmosphere`'s 95 ms off the main thread; sky updates ÷2 to ÷5 | M–L | 4 |
| 9 | [JSBSim in a worker](#9-jsbsim-in-a-worker) (0SFS F5) | The physics loop off the main thread | L | 2, 3, 6 |
| 10 | [Startup and pacing](#10-startup-and-pacing) (S1, S2, S3, B2, P5, P8, B8, C2) | Startup JS −20 to −40%; first-use hitches; GPU during motion | M | 0 |
| 11 | [Projections binary](#11-projections-binary) | 360 preparation; photographs a visitor opens directly | M | 4 |
| 12 | [Compare again](#12-compare-again), and close the largest gap | — | S, repeated | all |

Steps 0, 1, 2, 3 and 10 need no Rust, and step 3 doesn't wait for step 0.
Steps 5 and 7 start with TypeScript in workers, which needs neither isolation
nor Rust. Step 7 comes before the sky and JSBSim steps because every
comparison view is Google's tiles.

## Status

Each gate of the [brief](implementation/webassembly-agent.md) updates its row
when it finishes: the date, what was measured, and where the evidence is.

| Step | State | Result | Evidence |
| ---: | --- | --- | --- |
| 0 | In progress, 2026-10-17 | Tuned low route passes simulation at 13.97 m versus 20 m limit; UI/geometry/mask source checks pass; user deferred live window and selected 0% brightness; baseline unqualified | [W0 evidence](../../build/webassembly/W0/2026-10-16/summary.md) |
| 1 | Not started | | |
| 2 | Not started | | |
| 3 | Built, not deployed, 2026-10-18 | The app's service worker adds COOP, COEP `require-corp` and CORP to built pages, their workers and kept files; a first visit reloads once. Earth, tour and fly builds served as Pages serves them: isolated from the first visit in Chrome 155, Firefox 158 and Safari 27, threaded sky 4/4. Every map, search, airports and the tour's photos loaded with 0 blocked requests in Chrome and Firefox. In Safari, which shows a check no requests, every map and photo drew with no tile error or COEP report, and search and airports showed results. In Chrome, the 0SFS site's landing page and phone controller also work in fly's worker's scope. A frame, no service worker and the setting off start unisolated on single WASM, with no reload loop. Carto now answers every origin with an "API key required" tile, isolated or not. Not run in Safari: Shift-reload, no service worker, the 0SFS site. Safari on the iPhone is the user's check | [Step 3, Checked](#3-isolation-from-the-service-worker) |
| 4 | In progress, 2026-10-18 | Installed stable WASM target; real raster binary and byte parity completed; bounded raw ABI packages and worker-only loading in progress. Compact Component execution UI separates implementation, placement and worker parallelism, with component inheritance and explicit Apply and reload; Components combines settings and real status in expanded titles, with name-only collapsed titles and persistent trailing ? help. Expanded titles join the control grid as its first item; expanded components sort before minimized ones. Components filter live by basemap mode while retaining hidden overrides and reports. Desktop/phone functional checks pass. UI cleanup checkpoint complete for the verified baseline. Sky shared-memory build (atomics, fixed 4 MiB shared memory) with `wasm.threads`, plan/report `threads`/`sharedMemory`/`threadedFallback`/`shared`, budgeted helpers and a reasoned threaded → single → TS ladder. Component execution, 19 October: Sky has Shared memory [Off\|On] and Shared-memory threads. The slider is disabled with "Not isolated" on an unisolated page; titles show the shared threads that ran ("WASM (4 shared threads)") and short fallbacks. Checked in Earth and the tour (isolated) and in fly (unisolated), desktop and phone ([UI](implementation/webassembly-shared-memory-ui-handoff.md#what-the-ui-shows-19-october-2026)). Full qualification remains | [WASM source](https://github.com/foss-earth/docs/blob/main/docs/proposals/implementation/webassembly-agent.md#gate-w4-toolchain-packages-and-loader) |
| 5 | In progress, 2026-10-18 | Terrain targets selectable/parity checked; paired worker placement regressed ~1.8 s, auto TS. Added sparse adopted-grid imagery batches with exact f64/cache/page fallback, 176 dense/sparse cases / 147,110 coordinates; full-grid copies removed. Whole-app A/A drift is 5–5.5 s; no imagery gain qualified, auto TS. Raster auto now TS after slower WASM evidence. | [WebAssembly state](implementation/webassembly-state.md#in-app-ab-what-exists-now) |
| 6 | In progress, 2026-10-18 | Worker TS/WASM BVH build connected to synchronous scene query adapter with immutable index export, current transforms, ties, normals, mutation invalidation and original-picker fallback. 514 actual WASM/snapshot/reference rays match; index-update invalidation tested. App fixed-ray fixture query cost −40%, both query arms TS; WASM build slower. Raster walker/flight cache retained; representative flight gate remains. | [WebAssembly state](implementation/webassembly-state.md#in-app-ab-what-exists-now) |
| 7 | In progress, 2026-10-18 | TS/WASM Google worker connected through lazy Babylon adapter; hierarchy/material/container lifetime checked. Chrome WebGL2/WebGPU 48 exact pixel cases: 36 actual WASM, 12 explicit ICC-original fallback. EXIF also original. Packing and real Google view/performance gates remain. | [WebAssembly state](implementation/webassembly-state.md#in-app-ab-what-exists-now) |
| 8 | In progress, 2026-10-18 | Selectable worker sky and exact TS star colors with synchronous billboards; full 9,096-star GPU buffers match. Final repeated app mean page task 12.04→7.37 s (−38.8%): placement gain; star batching adds observed −9.1%. WASM sky 7.44 s, no whole-app gain. Shared-memory threaded sky, exact in every arm and integrated in Earth, tour and fly: per-job worker sky work 3.05→1.73–1.83 ms (4 threads), round trip −0.2 to −0.4 ms, no page/frame gain beyond A/A, total sky CPU up. Global default since 19 October: `single` with the shared sky and shared heights, not a speed claim. | [WebAssembly state](implementation/webassembly-state.md#measured-results) |
| 9 | Not started | | |
| 10 | Not started | | |
| 11 | In progress, 2026-10-18 | Bounded exact source windows support unchanged 8192×4096 RGB through actual sphere-image CLI worker preparation. 378 cases / 2,683,584 f32 values and 264 encoded outputs match; peak WASM payload 60.5 MB / memory 95.6 MB. Observed WASM slower; no speed gate complete. Browser direct photos already sample textures on GPU. | [WebAssembly state](implementation/webassembly-state.md#known-blockers-and-useful-next-work) |
| 12 | Not started | | |

## 0. Measure against Google Earth

The step builds a harness that opens the same views in Google Earth on the web
and in FOSS Earth, in the same Chrome on the same machine, and reports the same
numbers for both. It also adds the power harness (M1) and two fixed flights (M2).

**Where.** It lives in research:

- the scripts in `scripts/benchmarks/earth-compare/`;
- the README and the summaries in `benchmarks/earth-compare/`;
- the raw output in the ignored `build/benchmarks/earth-compare/<time>/`.

It reuses what research already has:

- `scripts/benchmarks/globe-compare/run.mjs`, which compares FOSS Earth with
  CesiumJS, MapLibre and WorldWind at the Grand Canyon. Its numbers of 23
  September were discarded because the machine was in use;
- `scripts/benchmarks/ai-framegen-upscale/lib/`: CPU per process, thermal
  state, Low Power Mode, GPU utilisation and quiet-machine checks;
- `scene-ab`'s trace, `Performance` metrics, and its wait for an idle machine;
- `scripts/lib/outputDirectory.mjs`.

**Views.** Each is a camera target, a distance to it, a tilt from straight
down, and a heading:

| View | Target | Distance | Tilt | Heading |
| --- | --- | --- | --- | --- |
| `grand-canyon` | 36.1, −112.14 | 8 km | 55° | 0° |
| `umn-campus` | 44.976, −93.235 | 1.5 km | 60° | 0° |
| `manhattan` | 40.758, −73.9855 | 2 km | 65° | 0° |
| `ksfo-approach` | 37.61, −122.36 | 9 km | 80° | 284° |
| `orbit` | 30, −90 | 20,000 km | 1° | 0° |

Google Earth takes a view from its address,
`@lat,lon,{alt}a,{dist}d,{fovy}y,{heading}h,{tilt}t,{roll}r`. FOSS Earth takes
one through `setViewState` (`engine/src/view.ts`), which `?bench=1` exposes as
`window.__fossEarthBench`. Its `zoomMeters` is the distance to the target, and
its `pitchDeg` is 0 at the horizon and 90 straight down, so it is 90° minus
Google Earth's tilt. Google Earth's `y` is set to FOSS Earth's vertical field
of view. Overlaid screenshots of the same pose check the mapping between the
two cameras before any numbers are compared. The authored orbit was corrected
from 0° to 1° tilt because today's public camera clamps pitch to 89°; both apps
use this supported pose. This changes only the benchmark, not app defaults.
The target height is read from the live camera's ECEF centre: it follows
resolved ground plus the compass offset (zero by default), not a fixed
zero. The comparison sends that measured height to Google Earth.

**Motions.**

- Still: cold, then warm, then 60 s at rest.
- Moving: 10 s each of pan, orbit and zoom. Google Earth is moved with its
  keyboard shortcuts. Its address gives the camera before and after, and FOSS
  Earth replays the same path through `setViewState` every frame.

**Numbers.**

- **Visually complete**, cold and warm: the time after which the screencast
  stays within 99.5% of the final frame for 2 s.
- **Bytes downloaded.**
- **Frame intervals**, p50, p95 and p99, from the trace.
- **Main-thread busy time** (`TaskDuration`).
- **CPU time** per Chrome process.
- **Memory**: the JavaScript heap, and each process's resident memory.
- **Watts over the idle baseline**, on battery.
- **Settling**: after motion, the time until the view is complete again.

**Method.**

- Three runs each, alternating which app goes first. Report the median and
  the range.
- Headed Chrome at 1280×720 CSS px at the screen's pixel ratio, with a fresh
  profile in `build/` for each cold run.
- Timings on the power adapter.
- Power on battery in Low Power Mode, at a fixed brightness.

Define the image comparison's colour tolerance and viewport mask before the
baseline. Exclude UI, labels and animated sky in both apps; verify the final
frame actually contains the expected landmarks and detail. A stable blank or
coarse view is a failed load, not a fast completion. Record source, field of
view, render size and loaded detail, and report quality differences alongside
speed. Matching the camera does not make the two providers' tile sets equal.
Treat a run whose camera path cannot be matched as a separate observation.

FOSS Earth runs twice: as published, with Google 3D Tiles and the user's key;
and from a local build of the change under test.

**Power.**

- While unplugged, `ioreg -rn AppleSmartBattery` gives the battery's voltage
  (mV) and current (mA). The current is unsigned, so a discharge reads as
  2^64 minus the current. Their product is the whole machine's power.
- An idle baseline is taken at the same brightness, and subtracted.
- `pmset -g` says whether Low Power Mode is on.
- When the user runs `sudo powermetrics --samplers cpu_power,gpu_power`, it
  splits CPU from GPU.

**Flights.** A dev-only `?route=cruise` or `?route=low` in 0SFS fly starts at a
fixed position, holds heading and altitude through the autopilot for three
minutes, and records with `flightPerf=1`. `cruise` flies at 1,500 m, and `low`
at 150 m over flat ground. Fly's `scripts/profile-flight.mjs` already builds
the app, serves it through request interception and flies it with the frame
profiler; the routes extend it.

**Google Earth's terms.** The comparison only measures:

- nothing of Google Earth's is intercepted, cached, replayed or kept;
- its screenshots stay in `build/` and are never committed or published;
- runs are few, and signed out;
- if Google Earth refuses automation, the user drives it while the harness
  only watches, through `--remote-debugging-port`.

Done when the baseline table in the harness's README is filled for both apps
and every view, on both power states, and the two flights are measured.

## 1. Cheap wins first

The comparison is unfair to WASM until these are done. Each is small, and none
needs Rust. They are listed in backlog order.

| ID | Change | Changes pixels? |
| --- | --- | --- |
| P1 | Draw at most about 1.5 device pixels per CSS pixel by default | Yes |
| P7 | Opaque canvas. First check what shows through it today. | Only if something does |
| P4, F1, F8 | Frame cap on battery, and 60 by default on displays above 60 Hz. A cap must skip whole display refreshes. | Smoothness |
| C6 | Idle audit: at rest, count frames, timers, worker messages and CPU for 60 s, remove what runs, and compare with Google Earth at rest | No |
| S4 | Fetch only one of the GLSL and WGSL shader chunks (670 kB each) | No |
| — | WebGPU fetches glslang and twgsl (about 2.6 MB) when any GLSL shader compiles. Port that shader to WGSL. | No |
| — | Self-host Babylon's runtime files (glslang, twgsl, Draco, KTX2 and Basis) through Babylon's URL settings, so no page needs a CDN | No |
| T2 | Real byte counts for Google tiles, so `map.google.cacheBytes` means bytes | No |
| T1, T3, T5 | Horizon detail, haze culling, and holding back requests while turning | Yes |
| F2, F3 | 0SFS: write the HUD only on change, and draw the attitude indicator at a fixed rate | No |

Each is measured with step 0's harness. A change marked "Yes" ships behind its
setting at today's value; the user picks the default from before-and-after
screenshots.

D1, the JavaScript speedups for images, sky and projections, is already on
each library's `main` on GitHub (checked 16 October 2026). The published apps
get it with their next build.

## 2. JSBSim's exceptions and flags

JSBSim is already WASM: 2.4 MB, from the
[Felipegalind0/jsbsim](https://github.com/Felipegalind0/jsbsim) fork.
`wasm/CMakeLists.txt` links it at `-O3` as CMake `Release`.

**Today: JavaScript exceptions.**

- The fork's root `CMakeLists.txt` adds `-fexceptions` to every C++ compile
  when `BUILD_WASM_MODULE` is on, so the engine keeps its own `catch` blocks
  (fork.4 fixed that). The bindings target adds it again, and the link uses
  `-sNO_DISABLE_EXCEPTION_CATCHING`.
- That is Emscripten's exception handling in JavaScript. A call that may
  throw, from a function with a `catch` or a destructor to run, leaves the
  WASM through a JavaScript `invoke_*` trampoline; the glue has 45 distinct
  ones. The whole engine is compiled that way, so the cost is in every step,
  not only at the bindings.

**New.**

1. **WebAssembly exceptions.**
   - `-fwasm-exceptions` in place of `-fexceptions`, in the root
     `CMakeLists.txt`'s `add_compile_options` and in `wasm/CMakeLists.txt`'s
     `target_compile_options`. At link it replaces
     `-sNO_DISABLE_EXCEPTION_CATCHING`.
   - `-sWASM_LEGACY_EXCEPTIONS=1` at compile and link. It is Emscripten
     6.0.9's default; stating it keeps the encoding that runs on Safari 15.2,
     Chrome 95 and Firefox 100 and later if the default changes.
2. **Link-time optimization.** `-flto` at compile and link.
3. **SIMD, last.** `-msimd128` drops every browser without WASM SIMD (Safari
   before 16.4), and JSBSim has no fallback. It ships only if it measurably
   helps and the user accepts that, or with a second build.

Error paths must not change. The engine's `catch` blocks already run, and
fork.4's malformed-propulsion recovery test and the SDK's lifecycle tests must
pass unchanged.

**Measure** a matrix: baseline, then wasm exceptions, then LTO, then SIMD. Each
cell records the step time, the binary size and the start time. The step time
comes from a new `wasm/bench/step-time.mjs`: the C172 and the F-35B on fixed
scripts, in Node, Chrome and Safari.

The trajectory must match the baseline's bit for bit in every cell: every
output property, every step, compared with `Object.is`. Emscripten 6.0.9
already runs binaryen 132's `wasm-opt` at `-O3`; the metadata records both.

**Ship** as fly's [JSBSim notes](https://github.com/0SFS/fly/blob/main/docs/jsbsim.md)
say:

- from a clean, committed fork, on a branch from `master`;
- `npm run pack:build`, under the next fork number;
- the tgz goes into `0sfs/fly/deps`, beside the tarballs already there, which
  are kept for rollback;
- `fly/package.json`, its lockfile and `scripts/verify-jsbsim-artifact.test.mjs`
  are updated to match;
- an adoption receipt goes in 0SFS research's
  `validation/evidence/jsbsim/adoption/`.

Owner: 0SFS (F6), with the fork. Done when:

- the metadata lists every flag;
- the matrix is recorded;
- fly uses the fastest build whose trajectory is identical.

## 3. Isolation from the service worker

**Built, 18 October 2026, not deployed.** The changes below are built in
`ui/vite/appFilesWorker.js` (the worker), `ui/src/browser/isolation.ts` (the
first script) and `app/vite/appFiles.ts`, behind Settings → App files →
Cross-origin isolation (`app.isolation`, on by default). How it works:
[ui's app-files.md](https://github.com/foss-earth/ui/blob/main/docs/app-files.md#cross-origin-isolation).
It differs from the plan here:

- **Headers only where they count.** The worker adds them to navigations,
  including the navigation preload's answer, to the app's own worker scripts,
  and to the files it keeps. It doesn't add them to every same-origin
  response: under `require-corp` a page loads its own site's files without
  CORP. Status 0, `opaque` and `opaqueredirect` responses pass untouched.
- **Enforced from the first release.** No report-only release came first
  (item 6), because the browser check below loaded every map, search, airports
  and the tour's photos isolated, with nothing blocked.
  `FOSS_EARTH_ISOLATION=report-only` still builds a worker that sends the
  `-Report-Only` headers and doesn't reload. The page doesn't collect those
  reports (no `ReportingObserver`); the browser's console names them.
- **The build decides; there is no separate `isolation()` plugin** (items 5
  and 8). `appFiles({ isolation })` writes the policy into the worker and the
  first script into every page. FOSS Earth's `appFiles()` enforces unless
  `FOSS_EARTH_ISOLATION=report-only` or `off` is set at build time
  (`deployedIsolation()`).
- **0SFS** uses `appFiles({ keepFiles: false, isolation: deployedIsolation(),
  cacheNamespace: "0sfs-app-files" })`. Its worker keeps nothing and only
  isolates, so the page removes it when the setting is off. The `/`, `/fly/`
  and `/rc/` pages that `copyIndexToPagesPaths()` writes each start with the
  first script.
- **Development** has `crossOriginIsolation()` in `foss-earth/vite`, off
  unless `FOSS_EARTH_ISOLATION=enforce`, with COEP `credentialless` by default
  (`FOSS_EARTH_COEP=require-corp` for the deployed policy).
- **A browser that won't isolate is remembered.** If the worker answered the
  reload and the page still isn't isolated, `localStorage`
  `foss-earth.isolation-refused.v1` keeps the user agent for 7 days. That
  browser's pages start without the reload until then, or until it updates.
- **Chrome's back/forward cache.** In Chrome 155 a later reload could bring
  back the page from before the isolating reload, frozen while it waited. A
  waiting page listens on the `BroadcastChannel` `foss-earth.isolation`, and
  every page posts on it as it loads, so Chrome evicts the cached page. A page
  restored anyway asks once more, and the second time starts unisolated.
- **A Shift-reload** skips the worker in Chrome and Firefox. That page reloads
  once through the worker and is isolated again.
- **Inside another site's frame,** Chrome gives the app partitioned storage.
  The worker registers and controls the framed page there, but can't isolate
  it under a parent that isn't isolated, so the page starts at once.
- **Not measured:** the first visit's extra round trip on the published site.

**Changes.**

1. **Headers.** The worker adds these to every response it serves in its
   scope. That covers the page, including the navigation preload, and the
   app's files, workers included:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Resource-Policy: cross-origin`

   CORP is `cross-origin`, not `same-origin`, because the files are public and
   an isolated page elsewhere can then load them. COEP is `require-corp`, not
   `credentialless`, because Safari's support for `credentialless` is
   uncertain and `require-corp` works everywhere.

   Some responses pass through untouched, as coi-serviceworker does:
   - status 0 and `opaqueredirect`, since a response can't be rebuilt with
     status 0;
   - `only-if-cached` requests that aren't same-origin.

   A response gets its headers when it is served, as
   `new Response(body, { status, statusText, headers })`. They are never
   stored, so the cache keeps what the server sent. While isolating, the
   worker answers every same-origin request in its scope, not only the files
   it keeps, so workers and WASM get the headers too.
2. **Policy in the worker's address.**
   - The page registers `foss-earth-sw.js?keep=1&isolate=1`.
   - The worker reads its policy from its own `location.search`, so the policy
     survives the worker being stopped, and a policy change is a new
     update to the registration at the same scope.
   - The old "forget" message is still honoured for pages already open.
3. **Registered whenever keeping or isolation is on**, and unregistered when
   both are off. `ours()` in `keptFiles.ts` compares the worker's path, not its
   whole address.
4. **The first visit.** A short script runs first in `<head>`, before the
   browser-recovery script and the app's module. Like browser recovery's
   `ui/src/browser/browserData.ts`, it is TypeScript without imports, which
   its plugin inlines into the page. It acts when all of these are true:
   - the page isn't isolated;
   - the browser has service workers;
   - the setting allows it;
   - the page isn't in a frame or on the recovery page;
   - this tab hasn't just tried (`sessionStorage` `foss-earth.isolation.v1`).

   Then it registers the worker and waits up to 4 s for the expected worker
   to control the page. It reloads once only after that succeeds. Rejection,
   timeout or inaccessible storage releases the app into its fallback without
   reloading. During that wait:
   - the app's entry points don't start;
   - browser recovery and the session trail don't count the reload as a failed
     start.

   An isolated load clears the flag, so a later Shift-reload, which skips the
   worker, can isolate again. A reload that doesn't isolate leaves the flag set.
   That page runs the single-threaded tier, or TypeScript if WASM is unavailable,
   and the report records why. Both entry-point and recovery waits have a
   bounded exit. A storage exception must never prevent startup.

   The script must also reconcile an existing worker when Shared memory is
   turned off: update it to `isolate=0` (or unregister if keeping is off too),
   wait for the new controller and reload once to remove isolation. Merely
   skipping registration leaves the old isolating worker active. Report-only
   mode likewise replaces an old enforcing policy rather than inheriting it.

   The cost is one more round trip for the page on a first visit, about 100 to
   300 ms. Step 0's harness measures it.
5. **Development.** An `isolation()` Vite plugin sets the same headers in
   `server.headers` and `preview.headers`, so `npm run dev` and `npm run
   preview` can test the isolated tier. Server headers are not the service
   worker: when they enforce isolation, turning the setting off disables
   shared-memory use but cannot remove the response headers. Test opt-out and
   first-visit behaviour with the header-free static server below.
6. **Report first.** One release sends
   `Cross-Origin-Embedder-Policy-Report-Only: require-corp`, without an
   isolation-upgrade reload (the manifest's `isolation: "report-only"`). A
   newly installed worker's reports begin on the next controlled navigation;
   explicitly navigate in the live test before judging the report.
   Diagnostics → Copy report lists what would have been blocked where
   reporting is supported; report the observer
   as unavailable elsewhere. No reports is not proof of compatibility in a
   browser without reporting. The next release enforces
   (`isolation: "enforce"`).
7. **Say which tier ran.** The report records:
   - `crossOriginIsolated`;
   - the isolation state (pending, isolated, unavailable or off) and its
     reason;
   - the tier, and why it was chosen.
8. **Every app.**
   - The FOSS Earth app and the tour add `isolation()` beside their
     `appFiles()`.
   - 0SFS adds both. Its `copyIndexToPagesPaths()` must keep the inline script
     in every page it copies.

Where isolation can't happen, the page runs the single-threaded tier:

- browsers without service workers, such as Firefox private windows and some
  in-app browsers;
- the app framed by a site that isn't isolated itself, or that doesn't add
  `allow="cross-origin-isolated"`;
- a reload that didn't isolate.

Cross-origin loads checked on 16 October 2026, with an `Origin` header:

| Origin | `Access-Control-Allow-Origin` | `Cross-Origin-Resource-Policy` |
| --- | --- | --- |
| tiles.mapterhorn.com | `*` | — |
| basemap.nationalmap.gov | `*` | — |
| basemaps.cartocdn.com | `*` | — |
| gibs.earthdata.nasa.gov | `*` | — |
| s3.amazonaws.com (Terrarium) | `*` | — |
| tile.openstreetmap.org, nominatim.openstreetmap.org | `*` | — |
| tile.googleapis.com | the request's origin | — |
| api.freeairportdb.com | `*` | `same-origin` |
| cdn.babylonjs.com (Draco, Basis) | `*` | `cross-origin` |
| foss-earth.github.io, umn-vr.github.io | `*` | — |

**What that table means.**

- Every origin answers CORS, so loads made with CORS pass `require-corp`.
  api.freeairportdb.com's `same-origin` only matters for loads made without
  CORS.
- The apps load no third-party script or iframe.
- The one popup, the RT4KSR runner in `app/src/viewer/ExperimentTab.tsx`, is
  polled by fetch rather than through the window, so COOP doesn't affect it.
- YouTube embeds won't load in an isolated page; the tour's roadmap, item 4,
  has that.
- The table can't check `<img>`, CSS and font addresses on other origins that
  don't ask for CORS. With no report-only release, the browser check below
  did: nothing was blocked in the pages and flows it ran.

The engine's
[performance notes](https://github.com/foss-earth/engine/blob/main/docs/performance-notes.md)
already say to use `SharedArrayBuffer` only when `crossOriginIsolated` is true
and to keep the transferred-buffer path. The capture harness paragraph in
[Performance](../performance.md#capture-harness) says only the harness is
isolated; it changes when this step ships.

**Checks.**

- Vitest for the inline script and the worker.
- A browser check in Chrome, Firefox and WebKit, of a build served the way
  Pages serves it. That means a static server that sends no isolation
  headers, so the worker has to add them. `vite preview` sends them itself,
  so it can't be that server. The cases are:
  - a first visit;
  - a reload, and a Shift-reload;
  - a context without service workers;
  - the app inside another origin's iframe;
  - the setting off.
- In each case, check `crossOriginIsolated` in the page and in a worker, and
  the tier. Check also that every map loads with the network on: Google,
  Mapterhorn, USGS imagery, search, airports, and the tour's tiles. The
  app's `browser-functional` suite blocks outside requests, so it covers the
  app's own behaviour but not the maps.
- The user checks Safari on the tour's iPhone XS Max by hand.

**Checked, 18 October 2026,** on macOS, with the builds of Earth (`/app/`),
the UMN tour (`/tour/twin-cities/`) and 0SFS fly (`/fly/`), and with the
0SFS site that `0sfs.github.io`'s build makes from that fly build. Each was
served as GitHub Pages serves it: no COOP, COEP or CORP,
`Cache-Control: max-age=600`, ETag, and a folder redirected to its slash. Each
page asked for the threaded sky with 4 threads
(`set.wasm.core.sky=threaded&set.wasm.threads=4`); the sky's default stays
TypeScript. The scripts are local and not committed:
`app/build/sw-isolation/check.mjs` in FOSS Earth's checkout,
`build/sw-isolation/fly-probe.mjs` in fly's, and
`build/sw-isolation/build-site.mjs` in `0sfs.github.io`'s. Safari ran
through its own WebDriver, `safaridriver`, whose automation window starts
each session with no history or storage, like a private window.

| Case | Chrome 155 | Firefox 158 | Safari 27 |
| --- | --- | --- | --- |
| Earth, first visit | Isolated after one reload; `crossOriginIsolated` in the page and in a worker; threaded sky, 4 of 4 threads | The same | The same |
| A reload; a later visit | Isolated, without a reload; the later visit in a new tab, with the worker stopped | The same; the later visit in a new Firefox on the same profile | The same; the later visit in a new tab, the first one closed, with the worker running: WebDriver can't stop it |
| Shift-reload | Skipped the worker, reloaded once, isolated | The same; the server saw `no-cache` without navigation preload | Not run: WebDriver has no Shift-reload |
| Setting off | Reloaded once; `off`; worker `isolate=0`; single WASM sky, `not-cross-origin-isolated` | The same | The same |
| Setting on again | Reloaded once; isolated | The same | The same |
| Inside another site's frame | Started at once, `unavailable`; single WASM sky | The same | The same |
| No service worker: an `http:` address other than localhost | Started at once, `unavailable` | The same, and with service workers turned off | Not run |
| A reload the worker doesn't answer | `unavailable` after one reload, no loop | Not run | Not run |
| Keep the app's files off | Isolated | Not run | Not run |
| Every map, network on | Google 3D Tiles; USGS Imagery, Imagery Topo and Topo, OSM, both Carto styles and OpenTopoMap over Mapterhorn; USGS Imagery over AWS Terrarium. Each loaded isolated, nothing blocked | The same | The same, each map in a tab of its own: isolated, no tile error, no COEP report |
| Search and airports | Nominatim and freeairportdb answered, nothing blocked | The same | Nominatim and freeairportdb answered, and the results showed |
| Tour | Isolated after one reload; all 60 previews; 111 and 113 photo tiles in two places; Google tiles; nothing blocked | Isolated after one reload; all 60 previews; 110 photo tiles in one place; Google tiles; nothing blocked | Isolated after one reload; all 60 previews; 132 and 133 photo tiles in two places, all answered 200; Google tiles; no COEP report |
| Fly | First visit, reload, setting off (worker removed), on again: the page and every app worker that answered matched, the threaded sky's included; Mapterhorn and USGS loaded; nothing blocked | The same, read from the page and a worker | The same, read from the page and a worker, and a later visit in a new tab |
| 0SFS site: its landing page replaces fly's `/`, so fly's worker answers it too | The landing page started unisolated before the worker. Once the worker answered it, it was isolated with all 3 images and nothing blocked, also after a reload. Start flying kept the address's settings and reloaded once. `/rc/` and an old `?mode=remote` link were isolated with no reload. A phone's first visit from a QR, new or `?mode=remote`, reloaded once, and the controller still got the invitation in the address's `#` | Not run | Not run |
| Renderer, asked for auto | WebGPU | WebGL2: `WebGPUEngine.IsSupportedAsync` returned false | WebGPU |

- **Carto** answered every tile, from any origin or none, with an image that
  says "API KEY REQUIRED, carto.com/basemaps/apikey". The check counted those
  answers as loaded. This isn't caused by isolation: a request from
  `foss-earth.github.io` gets the same image. Both Carto styles need a key.
  [Carto's free key](https://carto.com/basemaps/apikey) is emailed without an
  account, allows 5 million requests a month for non-commercial use, and goes
  in each tile address as `?key=`, like the Google key, with the attribution
  "© OpenStreetMap contributors, © CARTO".
- **Switching basemap after start isn't drawn:** the view keeps the first
  basemap. The published app does the same, so each map was opened in a page
  of its own.
- **Firefox on macOS.** macOS quits an app with no windows about 31 s after it
  starts, unless it may run in the background. Headless Firefox has no
  windows, so each Firefox case ran in a session of its own, 4 to 10 s long,
  on one profile. None was quit.
- **Safari** needs `safaridriver --enable`, and `safaridriver` needs the
  `com.apple.webinspectord` agent. That agent was off on this Mac; it was
  turned on for the check and off again after it. WebDriver shows no
  requests, so in Safari a refusal could only show in the page: a tile error
  from the app, a COEP report to a `ReportingObserver`, or a map, photo or
  result missing from the case's screenshot. None did. The page's resource
  entries named the other sites it loaded from, but Safari gives them no
  status, so they can't show a refusal.
- **Safari stopped answering once.** In one run it stopped answering
  WebDriver on the seventh page opened in one tab, Carto Positron's, and
  every command after that timed out. A run of its own, 28 pages in one
  tab, didn't repeat it. The check now opens each map in a new tab, and
  starts a new session if Safari stops answering. In the last run all nine
  maps, search and airports ran in one session, and Safari never stopped.
- **Not checked:** the published sites, since they aren't deployed;
  Playwright's WebKit, which isn't installed here; and Safari on a phone.
  Nor is pairing a phone with a computer: the check's invitation names a
  computer that doesn't exist. With isolation on or off, the controller
  reached the pairing service and reported the same thing.

Done when the published apps are isolated from the first visit in Chrome,
Firefox and Safari, every map loads, and the report names the tier.
"First visit" includes the one bounded registration reload. Browsers or
contexts that cannot isolate must start successfully on a fallback, with no
reload loop. Deployment remains a separate user-approved action.

## 4. Toolchain, packages and loader

**Update, 19 October 2026.** The cores no longer live in one repository. Each
Rust twin sits beside its TypeScript reference, in `<name>-WASM/` next to
`<name>-TS/`, in the repository that owns the core. See
[WebAssembly cores](../webassembly-cores.md). The plan below is kept as written.

**Repository.** A new repository holds one Cargo
workspace. One repository keeps:

- one toolchain pin;
- one set of parity rules and lints;
- the shared crate in one place.

Each binary is still built and versioned on its own.

| Crate | Holds | Ships as |
| --- | --- | --- |
| `earth-core` | WGS84 ellipsoid, geodetic and tile math, float32 rounding as Babylon stores it, the BVH, the JavaScript-exact helpers below | Linked into each binary below |
| `earth-raster` | Raster terrain meshes and height grids | `@foss-earth/engine/raster-WASM` |
| `earth-google` | Google Photorealistic 3D Tiles: glb reading, packing, BVHs | `@foss-earth/renderer/google-WASM` |
| `earth-sky` | Atmosphere and stars | `@foss-earth/sky/sky-WASM` |
| `earth-projections` | Equirectangular, cube and tiled-cube conversions | `@foss-earth/sphere-image/projections-WASM` |

Each package holds:

- `threaded/` and `single/` builds;
- `build-metadata.json`;
- the loader glue and its types.

Versions follow `YY.MM.DD#N`. The apps link the packages the way they link the
other libraries.

**Builds.**

| | Threaded | Single-threaded |
| --- | --- | --- |
| Toolchain | Nightly, pinned by date | Stable 1.99.0 |
| Target features | `+atomics,+bulk-memory,+mutable-globals,+simd128` (as the wasm-bindgen threads example asks at the pinned version) | `+simd128` |
| Standard library | Rebuilt: `-Z build-std=panic_abort,std` | As shipped |
| Link | `--shared-memory --import-memory --max-memory=<the binary's maximum>`, and `--export=` for `__wasm_init_tls`, `__tls_size`, `__tls_align` and `__tls_base` | Default |
| Memory | Shared, imported, with a fixed maximum | Its own, growable |
| Threads | Workers initialised through the pinned wasm-bindgen thread protocol (below) | None; runs inside the existing workers |

Both builds use:

- `opt-level = 3`, `lto = "fat"`, `codegen-units = 1` and `panic = "abort"`;
- wasm-bindgen `--target web`, with the CLI at exactly the version in
  `Cargo.lock`;
- binaryen 132's `wasm-opt -O3` (the one that comes with Emscripten), with the
  build's features enabled.

Inspect `rustc --print cfg --target wasm32-unknown-unknown` and the final
binary's emitted features. Safari 16.4 is the proposed SIMD floor; selecting
`+simd128` alone does not constrain the compiler's other default features.
Validate the final binaries and glue on the supported browsers. Unsupported
features select the TypeScript fallback rather than failing the app.

wasm-bindgen moved to the [wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen)
organization when the rustwasm organization was retired.

**Threads.**

- **One owner per binary.** A coordinator worker owns its shared memory and
  initialises wasm-bindgen. Starting a second instance on that memory is not
  sufficient to create a Rust thread: stack, TLS, allocator and one-time
  initialisation must follow the pinned wasm-bindgen protocol. W4 proves
  independent stacks/TLS and concurrent allocation before a custom pool is
  accepted. Reuse existing decode workers only after that proof.
- **wasm-bindgen-rayon only for single large tasks**, where a parallel iterator
  is the simplest code: sky tables, projections, large BVHs.
  Initialise its pool from the coordinator worker and run blocking parallel
  calls there; never block the page while rayon finishes.
- **One compute budget for the whole page.** Use reported logical concurrency
  as a hint, not a chip-specific constant. Worker lifetime limits and active
  computation are separate budgets. The [adaptive CPU scheduling proposal](adaptive-cpu-scheduling.md)
  describes dynamic admission across components, optional E-core information,
  and growth through the full useful allowed range when a device needs it.
  That governor is not implemented by the current worker-object cap.

**Shared memory on the main thread.**

- **Never wait.** No `Atomics.wait`, and no Rust `Mutex`, `RwLock`, `Condvar`
  or channel. Those wait when contended, and a wait traps on the main thread.
  Do not assume an allocator or library call cannot block or spin. Keep Rust
  allocation and computation in workers; the page reads published results
  through TypeScript views.
- **Read results in place**, with TypeScript views over the shared buffer in a
  documented layout (step 6's BVH nodes).
- **Refresh views after growth.** After `memory.grow`, `memory.buffer` is a new,
  longer `SharedArrayBuffer`. Refresh views when its length changes.
- **Copy before Babylon.** Copy anything handed to Babylon into a fresh typed
  array: Babylon keeps references, and shared memory is reused.
- **Publish immutable generations.** Payloads become readable only after an
  atomic publication. A worker cannot overwrite or free one until its readers
  release it. A sequence counter does not make concurrent ordinary Rust float
  reads and writes safe. Mutable snapshots need atomic payload access or
  explicit buffer ownership; page retries are bounded and otherwise use the
  last complete snapshot.
- Workers may wait with `Atomics.wait`.

**Memory maximum.** Each binary declares initial and maximum page counts. The
lazy probe creates the real memory with those values and retains it for the
core; it does not allocate a throwaway maximum-sized buffer. iOS has
killed tabs that reserve too much, so the maximum is measured: twice the peak
across step 0's views and flights, rounded up. A failed probe means the
single-threaded tier. Do not retry a failed allocation repeatedly. Measure
combined memory when raster, Google, sky and JSBSim coexist during a switch;
dispose retired pools and their memories when no reader retains them.

**Loader**, in each core's `*-WASM/index.js`:

- `tier.ts` records the startup capability ceiling and each core's actual tier.
- `load.ts` compiles each binary once with `WebAssembly.compileStreaming`. It
  compiles from bytes when the server's type is wrong, and sends the compiled
  module to the workers.
- `pool.ts` holds the workers.
- `check.ts` runs the first-input check against the TypeScript.

The protocol records a job ID, map generation, core/version, input ownership,
output types and bounds, cancellation, timeout and disposal. Ignore stale
results after a map switch. Close unused `ImageBitmap`s and terminate failed
workers; retain or copy inputs needed for fallback before transferring them.
Synthetic tests cover worker death, failed fetch/compile, detached buffers,
cancellation and repeated create/dispose cycles. A failed WASM core must
not silently disable other cores. Library ports inject the chosen core so
`sky` and the projection libraries do not gain a dependency on `engine`.

The binaries have content-hashed names, so the service worker keeps them like
the app's other files.

**Rules for bit-identical results.** These replace the earlier plan of passing
every `Math.sin` value in as an array.

- **Number types.**
  - `f64` wherever the TypeScript uses numbers.
  - `f32` exactly where the TypeScript calls `Math.fround` or stores into a
    `Float32Array`; `as f32` rounds the same way.
- **The executing realm's `Math`.**
  - `#[wasm_bindgen(js_namespace = Math)]` imports `exp`, `log`, `sin`, `cos`,
    `tan`, `asin`, `acos`, `atan`, `atan2`, `sinh`, `pow` and `hypot`.
  - Import the built-ins from the realm where the module runs. A worker
    cannot receive the page's function objects by structured clone. Compare
    worker TypeScript and worker WASM with the page's reference on each
    browser; importing `Math` is not a proof of cross-realm parity by itself.
  - Measure the import cost on V8, JavaScriptCore and SpiderMonkey. Optimised
    imports are an engine detail, not an assumption the plan depends on.
- **Helpers in `earth-core` that copy JavaScript exactly:**

  | JavaScript | Rust |
  | --- | --- |
  | `Math.max`, `Math.min` | Explicit `js_max` and `js_min` helpers: propagate NaN, choose +0 for max and −0 for min, and preserve the reference's argument order. Do not substitute Rust's `f64::max` or `min`. |
  | `Math.round` | `js_round`: half up, keeping −0 |
  | `x \| 0` | `to_int32`: wraps, NaN gives 0 |
  | A store into a `Uint8ClampedArray` | `to_uint8_clamp`: rounds half to even. Rust's `as` saturates. |
  | Division, `Math.sqrt`, `Math.floor`, `Math.abs` | Exact everywhere, so native |

- **No reordering.**
  - No fused multiply-add (`mul_add`), relaxed SIMD or fast-math.
  - SIMD only across independent elements, with each lane in the TypeScript's
    order.
  - Sums in a fixed order, and threads combine in a fixed order.
- **A lint.** `clippy.toml` lists the native `f64` and `f32` transcendental
  functions as `disallowed-methods`, with `max`, `min`, `round`, `hypot`,
  `powi` and `mul_add`. That way a native call can't slip in.
- **Comparison.** Compare element by element with `Object.is`, including −0
  and NaN. This treats different NaN payloads as equal. Where raw output bytes
  matter (encoded images or typed buffers consumed as bytes), compare bytes
  too and specify any NaN canonicalisation separately.

**Tests.**

- A differential test against the TypeScript on fixtures.
  - Node runs the single-threaded build.
  - The threaded build runs in headless Chrome, since wasm-bindgen's threads
    need Web Workers.
- Mutants, as for the JavaScript speedups: a native `sin`, a reordered sum.
  Each must fail the differential test.
- Adversarial numeric fixtures include signed zeros, NaNs, infinities,
  subnormals, rounding ties and integer wrap boundaries. Seed the cases and
  include inputs known to distinguish each mutant; a native `sin` is not
  guaranteed to differ on an arbitrary fixture.
- A size budget for each binary.
- A rebuild compared by sha256 where the pinned toolchain is installed.

Done when an empty core runs through the single-threaded build in Node and
both builds in the three browsers, chosen by the loader, and the report names
the actual tier.

## 5. Raster terrain off the main thread

**Today.**

- The decode worker turns each elevation image into heights with
  `createImageBitmap` and a canvas.
- Then `applyGrid` in `engine/src/babylon/createRasterTilesRuntime.ts` calls
  `terrainMeshTarget` (`engine/src/babylon/terrainMesh.ts`) on the main thread.
  - It builds float64 positions relative to the tile's centre, rounds them to
    float32, and works out the height bounds.
  - At 64 segments that is 4,225 vertices, built through `number[]`.
- Each new tile's first mesh is built on the main thread too, by
  `createTerrainMesh` from `GLOBAL_TERRAIN`, the 64×64 world grid.
- `processMeshRebuilds` rebuilds meshes there when the segment count changes.

**Order.**

1. **The same TypeScript in the worker.** After decoding, the worker runs
   `terrainMeshTarget` and transfers the `Float32Array` positions and the
   height bounds; `applyGrid` uses them. The first tile is checked against the
   main thread's result bit for bit, as the heights are now (`d95411a`).
   The first mesh from `GLOBAL_TERRAIN` and the rebuilds move the same way, or
   use data prepared at build time where that is cheaper.
2. **R2.** Positions stay `Float32Array` through `meshRefinement.ts` to
   Babylon.
3. **R1.** Every tile of one segment count shares one index buffer and one UV
   buffer. Picking keeps working: test pointer picks on terrain.
4. **R4.** Skirts instead of stitching, so edges no longer depend on the order
   tiles arrive.
5. **Rust.** `earth-raster` runs in the decode workers only if the worker's own
   time shows it matters.
6. **Shared heights.** In the threaded tier, height grids are written into
   shared memory for step 6.

**Status, 19 October 2026 (built and tested, not committed).**

- Step 1: worker targets are adopted without a copy on either side. The page
  works out its own target only for the one parity check, no longer for every
  worker job. A target prepared before a segment-count change is no longer
  uploaded to the rebuilt mesh; the page path had the same race. Mesh workers
  are still opt-in.
- Step 2 (R2): done. Targets, new meshes and refinement steps are float32 from
  the start, and Babylon stores the same bits (identity digest). Stitched seams
  stay float64 on the CPU, because rounding them moves an antimeridian or
  equator seam just off its plane, where Babylon's exact box check rejects a
  ray along it.
- Step 3 (R1): partly done. The CPU indices and UVs are built once per segment
  count, with 16-bit indices up to 255 segments. The GPU buffers stay one per
  tile, because a shared Babylon index buffer loses picking's indices and is
  not rebuilt after a lost context.
- Step 6: built for isolated pages whose terrain is prepared in workers, not
  only the threaded tier. Decode workers copy heights into a
  `SharedArrayBuffer` and post it without a transfer, so mesh workers read the
  page's grids without a copy (Component execution → Terrain heights → Shared
  memory, `wasm.sharedHeights`, on by default since 19 October 2026, applies after a reload). Where targets are built on the page a transfer already
  costs nothing, so the setting does nothing there. Without isolation heights
  are transferred as before. Nothing writes a grid after decoding. The WASM
  terrain core and sampler accept shared heights and snapshot them; the binary
  is unchanged. Checked in Node, in the WASM parity checks and in headless
  Chrome on an isolated tour dev server: 114 of 114 tiles arrived shared and
  49 mesh targets were built from them.
- The decode pool now asks for no more workers than the worker budget leaves
  it. Before, a refused worker made the pool decode every later tile on the
  page. In the worker and WASM tiers that happened after the first few
  workers.

**Proof.**

- On every fixture tile, positions equal `terrainMeshTarget`'s float32 values
  bit for bit.
- Ground contact reads the same surface.
- The frame budget shows the cost of a tile's arrival gone.

Done when no terrain geometry is built on the main thread in any tier.

## 6. Ground: height grids and BVHs

- **Raster terrain.** Its heights are a regular grid, so a ray walks the grid's
  cells; no BVH is needed. The triangles must be the drawn ones: the float32
  positions, split as `a,c,b` and `b,c,d`.
- **Google tiles.** Each tile gets a BVH, built in a worker when a query first
  reaches the tile (only tiles near the aircraft or the camera), and dropped
  with the tile.
- **Ground cache** (C1, 0SFS F4). Once a frame, collect the triangles within
  reach of the aircraft: its size plus two steps of travel. Every gear and body
  ray of that frame is answered from them.

**Order.**

1. TypeScript: C1 and F4, with the BVH built in a worker and transferred.
2. Shared memory: the grids and BVHs live in shared memory, in a documented
   layout. TypeScript reads them in place on the main thread, and so does the
   physics worker in step 9.

**Proof.** Recorded rays from real flights, each with its origin, direction and
`pickWithRay`'s hit. The new path must give the same triangle and the same
distance, bit for bit.

Done when collision costs under 0.1 ms per frame on the `low` flight in both
tiers. The prototype took 0.0008 ms for five rays, against 2.25 ms.

## 7. Google tiles off the main thread

Checked on 16 October 2026, on tiles from tile.googleapis.com:

- **Format.**
  - Every content tile is glb, and requires `KHR_materials_unlit`.
  - There is no Draco: Google decodes it on its side. There are no normals.
  - `POSITION` and `TEXCOORD_0` are float32. Indices are uint16, or uint8 on
    tiny tiles.
  - Each tile has one or two primitives, each with a JPEG, and one node with a
    matrix. The sampler clamps.
- **Delivery.**
  - Gzipped on the wire, with `Cache-Control: private, max-age=14400`.
  - `Access-Control-Allow-Origin` echoes the origin; there is no CORP.

So T13's Draco workers don't apply. What costs the main thread is Babylon's
glTF loader, which parses each tile and creates its meshes, materials and
textures there.

**Stage A: a loader in a worker, in TypeScript.**

1. The tile's bytes go to a worker, transferred, when they match the profile
   above. Anything else goes to Babylon's loader, as now.
2. The worker reads the glb, decodes each JPEG with `createImageBitmap`, and
   transfers typed arrays and bitmaps back.
3. The main thread creates the meshes, the unlit material and the textures
   directly, as Babylon's glTF loader and the adapter do:
   - the root's rotation set to identity, then `adjustmentTransform` × the
     root's world matrix, decomposed;
   - `setEnabled(false)` until shown;
   - `checkCollisions` on the child meshes;
   - a `container` whose `dispose()` frees everything, for `disposeTile` and
     for an aborted load;
   - `metadata` set to the glb's JSON. `GoogleCloudAuthPlugin` reads
     `asset.copyright` from it for the attributions Google requires;
   - the real byte count for `calculateBytesUsed` (T2).
4. **Proof:** screenshots identical to Babylon's loader at the five views on
   WebGPU, WebGL2 and WebGL1, with identical vertex data, world matrices and
   attributions. Google's tiles are never committed, and stay in `build/` no
   longer than their `Cache-Control` allows. Unit tests use small glb files
   made to the same profile.

**Stage B: packed vertices (T7).**

- 20 bytes a vertex become 12: int16 normalized positions with a per-tile scale
  and offset, and uint16 UVs. Indices stay as they come.
- The source was Draco-quantized, so 16 bits may hold every position exactly.
  Check that per tile, and keep float32 for any tile where it doesn't.
- Even then the GPU's conversion can move a vertex by a rounding step. The
  change is judged on screenshots, by the user.
- `earth-google` replaces the worker's TypeScript only where the worker's time
  shows it matters, and must produce the same bytes.

**Stage C.** BVHs for step 6, in shared memory.

Mipmaps stay as Babylon makes them. Dropping them saves a quarter of the
texture memory and costs aliasing, so that is the user's choice.

Done when:

- the main thread spends under 0.5 ms per Google tile at the five views, in
  step 0's trace;
- geometry memory is down 40% after stage B;
- the pixels are identical, or the user accepted the difference.

## 8. Sky binary

**Today**, after the JavaScript speedups:

- the atmosphere march for illumination and a 32×32 dome at 16 steps takes
  2.5 ms by day, 5.6 ms at twilight, and 4.6 ms on a night with a full Moon;
- `createAtmosphere` takes 95 ms at startup;
- an update of 8,404 stars takes 1.10 ms.

**Order.**

1. `createAtmosphere` moves to a worker as TypeScript, which takes its 95 ms
   off the main thread.
2. `march` is ported first, with `Math.exp` and the rest imported from its realm
   (step 4's rules). Its bits are compared before anything else is ported.
3. The rest follows. Threads split the directions, and SIMD works across
   directions.

Importing the executing realm's `Math` avoids substituting Rust's native math
library. Cross-realm parity and call cost still have to pass the checks in
step 4 on every browser.

An earlier bake-off of languages for this kernel is scratch in
`sky/build/wasm-bakeoff/`. Its reference copy and its exactness check
(`reference/check.mjs`) are reusable. It ported fdlibm's `exp`, `log` and
`pow` instead of importing them, which matches V8 only. Its fan restructure of
the JavaScript is sky commit `f3ec16f`, one of the speedups.

Done when the sky's render check (117 of 117) and its value checks pass with
both builds.

## 9. JSBSim in a worker

0SFS F5. JSBSim moves to a worker that steps at 120 Hz on its own clock.

- **State.** The worker publishes consistent snapshots in shared memory using
  atomic payload access or buffers with explicit ownership. A sequence lock
  alone is insufficient for racing ordinary Rust float accesses. The page
  makes at most two read attempts, otherwise reuses its last complete copy;
  controls use a separate single-writer channel keyed to simulation steps.
- **Pacing.** The worker paces itself with `Atomics.wait`.
  Fixed simulation steps, bounded catch-up, pause/resume and hidden-page
  behaviour stay as today; wall-clock jitter never changes the input step.
- **Ground.** The worker reads it from step 6 directly.
- **Every SDK consumer moves to the shared copy**: autopilot, sound, g-forces,
  fuel, engines, exhaust, controls and RC. Each property read or written is
  listed.
- **Proof.** A scripted flight, with its inputs keyed to simulation steps and
  its ground recorded, gives the same trajectory bit for bit in the worker and
  on the main thread.

Without isolation, JSBSim stays on the main thread, as now.

Owner: 0SFS, with fly and the JSBSim build.

## 10. Startup and pacing

None of this needs Rust. It decides the "complete view" and "frame time while
moving" numbers.

| ID | Change |
| --- | --- |
| S1 | Import Babylon's modules, not its barrels: flight's main chunk is 4.8 MB and the tour's 5.4 MB |
| S2 | Load panels, editors and providers that aren't open on demand |
| S3, B2 | Compile likely shaders early and in parallel: `KHR_parallel_shader_compile` on WebGL, `createRenderPipelineAsync` on WebGPU |
| P5 | Lower resolution while the camera moves, restored once it rests (changes pixels) |
| P8, B8 | Dynamic resolution from GPU time; the WebGPU frame timer that reads 0 is fixed first (changes pixels) |
| C2 | Reuse vectors, arrays and matrices on hot paths |

## 11. Projections binary

**Today**, after the JavaScript speedups:

- building faces and tiles from equirectangular images takes 519 ms for a 1536
  face from an 8192 source;
- an 8192 tour prepares in 15.1 s.

The code is in the `sphere-cubemap`, `sphere-equirectangular` and
`sphere-tiled-cubemap` libraries, which [Performance](../performance.md) calls
cubemap, equirectangular and tiled-cubemap. Most of this is preparation, which
runs in Node, plus photographs a visitor opens directly.

JPEG encoding and decoding in preparation are not part of this binary. The
images library's profile, scratch in `images/build/wasm-profile/REPORT.md`,
measured native libjpeg-turbo at 6 to 12 times the speed of its optimised
JavaScript; that is a choice of preparation tool, not of WASM.

**Plan.**

- In the browser, rayon splits faces and rows.
- In Node, the single-threaded build runs in `worker_threads`, one face or tile
  range each.
- The speedups fixed the order of `atan2` and `asin`, and replicate V8 14.6's
  three-argument `hypot` in plain arithmetic. Keep both; `atan2` and `asin`
  come from the executing realm's `Math`, as in step 4.

## 12. Compare again

Rerun step 0 at every view, motion and flight, against the baseline and Google
Earth, then:

- rank what is still slower;
- propose the step that closes the largest gap;
- repeat.

The final table goes in the harness's README and in [Status](#status).

## Not compiled to WASM

- **Rendering.** Babylon stays. A Rust renderer (wgpu) would drop WebGL1 and
  replace the engine.
- **Image decoding.** The browser's `createImageBitmap`, in workers, is native
  and faster.
- **3d-tiles-renderer's traversal.** It belongs upstream. Revisit it if the
  frame budget shows it costs a lot.
- **UI, toolbar, scenes and the app shell.**

## Risks and open questions

- **iOS memory.** iOS Safari has killed tabs rather than fail to grow memory
  ([WebKit bug 221530](https://bugs.webkit.org/show_bug.cgi?id=221530)), and a
  shared memory may reserve its maximum. Each binary's maximum is measured,
  and its real memory is probed only when the core is needed. Test on the tour's iPhone XS
  Max.
- **A load that isolation blocks.** The report-only release finds it before
  enforcement does.
- **Reload loops.** The session flag allows one attempt per tab until a load is
  isolated.
- **Imported `Math` outside V8.** Where the WASM is slower than the TypeScript
  on an engine, that core stays TypeScript on that engine.
- **Nightly Rust.** It is pinned by date. A toolchain change is its own commit,
  with a rebuild and a full parity run.
- **Babylon's loader conventions.** Step 7 reproduces what Babylon 8.56.2's
  glTF loader and the 3d-tiles-renderer 0.4.24 adapter do. An upgrade of
  either reruns the pixel comparison.
- **Google's tile format.** A tile that doesn't match the checked profile goes
  to Babylon's loader.
- **Oversubscription.** The decode pool, the Google pool, rayon and Babylon's
  own workers share the cores. They are sized together, and measured.
- **Framing.** A site that frames an app without being isolated itself gets
  the single-threaded tier.
- **Google Earth's terms.** The comparison measures only. Nothing of Google
  Earth's is intercepted, kept or published.

Still open:

- whether the TypeScript cores ship in every bundle, or load only as the
  fallback;
- whether to drop browsers without WASM SIMD for JSBSim, if `-msimd128` helps;
- whether to move to `credentialless` once Safari supports it. That would let
  `<img>` loads without CORS through.

Shared memory is not itself a performance result. Measure copies avoided,
worker scheduling, synchronisation, total CPU and power as well as frame
times; keep the simpler tier on an engine where sharing costs more than it
saves. The Google Earth comparison remains a goal, not a promised outcome.

## Sources

- [How we're bringing Google Earth to the web](https://web.dev/case-studies/earth-webassembly),
  web.dev
- [Making your website "cross-origin isolated" using COOP and COEP](https://web.dev/articles/coop-coep),
  web.dev
- [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) 0.1.7: the
  service-worker pattern step 3 follows
- [wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen): threads, and
  its parallel raytracing example
- [wasm-bindgen-rayon](https://github.com/RReverser/wasm-bindgen-rayon):
  nightly toolchain, `build-std` and target features for threads
- [Rust's wasm32 target](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html):
  default features and target limitations
- [Rust: undefined behaviour](https://doc.rust-lang.org/reference/behavior-considered-undefined.html):
  data races and aliasing rules also apply to shared WASM memory
- [ECMAScript Math](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.max):
  numeric helpers must reproduce JavaScript's edge cases
- [HTML cross-origin embedder policies](https://html.spec.whatwg.org/multipage/browsers.html#coep):
  report-only policy and reporting
- [C++ exceptions support](https://emscripten.org/docs/porting/exceptions.html),
  Emscripten
- [Photorealistic 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles),
  Google Map Tiles API
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits),
  for the hosting that was considered and not chosen
