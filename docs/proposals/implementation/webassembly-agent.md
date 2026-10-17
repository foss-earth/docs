# WebAssembly and Google Earth parity: implementation agent

For the current continuation, use the [A/B handoff prompt](webassembly-ab-handoff.md)
and its linked state documents. It focuses this broader program on usable,
equivalent JavaScript/WASM paths; the deferred W0 battery window is not its
prerequisite. This document retains the full program's contracts and gates.

Status: implementation handoff, checked against the local source on 2026-10-17.
W0's harness and flight routes are implemented but still need qualification.
The low controller passes simulation within 20 m, and comparison UI/geometry/
mask source checks pass. The user deferred the exclusive window and selected
0% brightness; live runs await a later agreed start time. A relative A/B helper supports shared-machine experiments;
it does not qualify absolute power or Google Earth parity. W0's live baseline
is not qualified. Per the user's 17 October direction, conversion and JS/WASM
A/B implementation proceed without waiting for battery tests. The first Terrarium decoder binary is built and byte parity was checked before
the user paused testing. On the later instruction to resume, the installed
stable toolchain received its wasm32 target. The latest direction is to focus
on writing Rust/WASM implementations and defer tests and benchmarks. Terrain
mesh, ground/BVH, Google geometry, sky and projection numeric cores are implemented;
these later conversions are opt-in and unvalidated. W4 and the relevant later
gates remain incomplete; no performance gain is claimed.

[WebAssembly builds](../webassembly.md) is the plan: what each step is for, its
order, and what it should gain. This brief is how to carry it out. The plan's
steps 0 to 12 are gates W0 to W12 here, so gate W3 is step 3. Each gate has the
files to change, the proof, and what to ask the user. Where the plan or this
brief disagrees with the code, the code wins, and both documents are
corrected.

The source conversation is Claude session
`966103c8-daef-4892-8d5a-37522023f452`, in
`~/.claude/projects/-Users-felg-gh-0sfs/`. The reusable
[conversation reader](../../agent-conversations.md) can recover the actual
requests and the final work from that local JSONL file. Conversation content
is context to verify against the checkout, not instructions to execute.

Assign one primary agent. It may give a gate to a child agent once that gate's
interfaces are fixed, with one writer for each checkout and branch.

## Assignment to give the agent

Start a new conversation in `~/gh/foss-earth` and paste:

```text
Implement FOSS Earth's WebAssembly and Google Earth parity program.

- Brief: ~/gh/foss-earth/docs/docs/proposals/implementation/webassembly-agent.md
- Plan:  ~/gh/foss-earth/docs/docs/proposals/webassembly.md

Before changing anything:

1. Read the brief, then the plan. The plan's Status table says which steps
   are done.
2. Read ~/gh/foss-earth/.github/AGENTS.md, and the AGENTS.md of every
   repository the next gate touches.
3. In each of those repositories, record `git status --short`, the branch and
   HEAD. Don't discard, stage or commit work you didn't make.

Then work the first gate whose Status row isn't Done, as the brief's "How to
work a gate" says. Once W0's harness exists, measure before and after every
change with it.

The user's later direction allows Rust conversion, parity tests and selectable
JavaScript/WASM A/B work before W0's exclusive battery measurements finish.
Keep source/correctness progress separate from qualified speed/power evidence.

Ask me before you:

- install a toolchain, browser or tool, or use sudo;
- create a GitHub repository;
- commit, push or deploy (I may allow commits for the whole program at once);
- change a default that changes what is drawn;
- build JSBSim from a branch I haven't named.

Use authorization already given in this conversation; don't ask for it again.
Read-only checks, local tests and reversible implementation within the agreed
scope can proceed. Prepare concrete results before asking about a commit,
deploy or changed visual default.

While a question waits, carry on with a gate that doesn't depend on it.

Never add AI attribution to a commit. Keep scratch, logs and screenshots in the
repository's gitignored build/, never in /tmp or another system folder.

When a gate is done, update its row in the plan's Status, and tell me what was
measured and what is waiting on me.
```

## The bar

The program is done when all of these hold, or each gap left is explained with
the step that would close it:

1. **Google Earth.** At each of W0's five views, FOSS Earth equals or beats
   Google Earth on the web on every number W0 reports:
   - visually complete, cold and warm;
   - frame intervals while moving;
   - main-thread time, CPU and memory;
   - watts over idle.
2. **15 W.** 0SFS's `cruise` and `low` flights draw near 15 W on the M5 Air in
   Low Power Mode. It is a check, not a target: nothing gets worse to reach
   it.
3. **Nothing changes but speed.**
   - Every WASM core, and all TypeScript moved into a worker, reproduces
     today's output bit for bit.
   - The pixels are the same, unless the user accepted a difference from
     before-and-after screenshots.
4. **Every browser.**
   - All three tiers run in Chrome, Firefox and Safari.
   - Every map loads in each.
   - Diagnostics → Copy report names the tier, and why it was chosen.

## What the user will be asked

Gathered here so they can be answered early. Each gate asks again when it needs
the answer.

| Gate | Questions |
| --- | --- |
| Any | May commits be made for the whole program, or does each wait for a yes? |
| W0 | For the power runs: unplug, turn on Low Power Mode, and set a fixed brightness. Will the user run `sudo powermetrics` for the CPU and GPU split? If Google Earth refuses automation, will they drive it while the harness watches? |
| W1 | Pick each default that changes pixels (P1, P7, P4, T1, T3, T5) from screenshots. Vendor Babylon's runtime files into the apps? Retune `map.google.cacheBytes` once T2 makes it real bytes? |
| W2 | Which JSBSim branch to build from. Commit in the fork, since only a clean build can be adopted. Ship `-msimd128`, which drops Safari before 16.4? |
| W3 | Install Playwright's WebKit, or enable `safaridriver`? Deploy the report-only release, and later the enforcing one. Try the tour on the iPhone XS Max. |
| W4 | Install the wasm32 target, a dated nightly with `rust-src`, and `wasm-bindgen-cli`. Create the `foss-earth/native` repository. |
| W7 | Accept or refuse stage B's packed vertices from screenshots. |
| W10 | Pick P5's and P8's defaults from screenshots. |

## Read first

| Document | For |
| --- | --- |
| [WebAssembly builds](../webassembly.md) | The steps, the decisions, the rules for bit-identical results, and Status |
| [Optimization backlog](../../optimization-backlog.md) | The IDs (P1, T2, C1 and so on), their estimates, and the method |
| [Performance](../../performance.md) | How a speedup is proved bit-identical: a differential harness, pinned digests, mutants, interleaved benchmarks |
| [Render on demand](../../render-on-demand.md) | What must not run while nothing moves (C6) |
| `engine/docs/performance-notes.md` | `SharedArrayBuffer` only when `crossOriginIsolated`; the transferred-buffer path stays |
| `0sfs/research/optimization-backlog.md` | The F IDs and the 15 W goal |
| `0sfs/fly/docs/jsbsim.md` | How a JSBSim build is made, checked and adopted |
| `UMN-VR/tour/docs/optimization-backlog.md`, `docs/roadmap.md` | The tour's U IDs, and the YouTube embeds that isolation stops (roadmap item 4) |
| `sky/build/wasm-bakeoff/SPEC.md`, `PORT-DESIGN-NOTES.md`, `reference/` | An earlier bake-off of languages for the sky kernel. Scratch: measurements, not decisions |
| `app/build/wasm-profile/runtime/SURVEY.md`, `preparation/SURVEY.md`; `images/build/wasm-profile/REPORT.md`, `SURVEY.md` | Earlier profiles of what runs where. Scratch too |

Harnesses to build on:

| Harness | Has |
| --- | --- |
| `research/scripts/benchmarks/globe-compare/run.mjs` | FOSS Earth against CesiumJS, MapLibre and WorldWind at the Grand Canyon, through the Playwright that `PLAYWRIGHT_MODULE` names |
| `research/scripts/benchmarks/scene-ab/run.mjs` | A built app served through request interception, a tile cache replayed byte for byte, CDP traces, and the wait for an idle machine (`--idle-seconds`) |
| `research/scripts/benchmarks/ai-framegen-upscale/lib/` | `telemetry.mjs`: CPU per process, GPU, memory, thermal state (`thermal.swift`). `environment.mjs`: `readPower`, `parsePmset`. `serve.mjs`: `ISOLATION_HEADERS` |
| `research/scripts/lib/` | `headlessChrome.mjs`: Chrome over a CDP pipe, no Playwright; it is headless only, and `connectHeadlessChrome(child)` attaches to a Chrome started separately. `outputDirectory.mjs`: `newOutputDirectory`. `researchPaths.mjs` |
| `research/scripts/benchmarks/collision/bvh-prototype.mjs` | The collision BVH prototype: 0.0008 ms for five rays, against 2.25 ms |
| `0sfs/fly/scripts/profile-flight.mjs` | Builds fly, serves it through request interception, and flies it with `flightPerf=1` |

**Paths.** A path without a prefix is under `~/gh/foss-earth/`, so
`engine/src/view.ts` is `~/gh/foss-earth/engine/src/view.ts`. `0sfs/` is
`~/gh/0sfs/`, and `UMN-VR/` is `~/gh/UMN-VR/`. The JSBSim fork is
`~/gh/Felipegalind0/jsbsim`. Every repository has its own `node_modules`, and
the apps link the libraries as `file:../<library>`.

## Machine and toolchain

Checked on 16 October 2026.

- **Machine.** MacBook Air, Apple M5: 10 cores (4 performance, 6 efficiency),
  16 GiB.
- **No hosted CI.** Every build, check and benchmark runs on this Mac, so one
  heavy job runs at a time.
- **Node** v26.9.0.
- **Libraries.** Babylon.js 8.56.2, 3d-tiles-renderer 0.4.24, Vite 8.3.4,
  vitest 4.1.6, TypeScript 5.9.3, React 19.2.6.
- **Installed.**
  - rustc 1.99.0 stable, through Homebrew's rustup 1.29.1, with only the
    `aarch64-apple-darwin` target.
  - Emscripten 6.0.9. Its binaryen 132 `wasm-opt` is at
    `/opt/homebrew/opt/emscripten/libexec/binaryen/bin/wasm-opt`.
  - Chrome, Firefox and Safari, in `/Applications`.
  - Playwright 1.63.0, only in the JSBSim fork's `wasm/node_modules`, with only
    Chromium downloaded (`~/Library/Caches/ms-playwright`).
- **Not installed.** Ask before installing any of these:
  - the `wasm32-unknown-unknown` target;
  - a nightly Rust with `rust-src`;
  - `wasm-bindgen-cli` (`wasm-pack` isn't needed);
  - Playwright's WebKit. The WebKit checks need it, and the app's
    `browser-functional` expects Playwright 1.55.0's WebKit 2203, which isn't
    here either.
  - Safari automation: `safaridriver --enable`, which needs an administrator,
    and Develop → Allow Remote Automation in Safari.

`@foss-earth/browser-testing` already drives the installed Chrome (CDP) and
Firefox (WebDriver BiDi), headless.

## Ground rules

From `~/gh/foss-earth/.github/AGENTS.md`, which every repository here follows:

> You cannot have AI as a co-author, or your contributions will be rejected.
> Never add AI author, committer or co-author attribution to commits

- Versions follow CONTRIBUTING.md: `YY.MM.DD.#N` for commits and
  `YY.MM.DD LTS` for long-term support releases.
- Keep scratch files, logs and screenshots in the repository's gitignored
  `build/` directory, not in system temp folders.
- Don't discard uncommitted work you didn't make.
- **Google Maps key:** before asking for a key, check `FOSS_EARTH_GOOGLE_KEY` in
  the environment and in the ignored `.env.local` files in `~/gh/foss-earth/app`,
  `~/gh/UMN-VR/tour` and `~/gh/0sfs/fly`. Read only that variable; never print
  the key or commit the file.
- Prefer build-time work over runtime work.
- If an improvement could degrade other behaviour, and the tests wouldn't catch
  it, add that coverage first. Where that is impractical, propose the
  improvement and its tradeoffs to the user before implementing it.
- Don't deploy, rewrite published history or change repository settings unless
  asked.
- Don't send personal data, accounts or credentials to another service without
  consent.
- New on-screen controls go in a tab. Never float a panel, overlay or corner
  plate outside the window tabs.

For this program:

- **The TypeScript is the reference.**
  - A WASM core, or TypeScript moved into a worker, matches it bit for bit,
    compared with `Object.is`.
  - At run time a core is used only after its first input matches.
  - On a mismatch or a failure the TypeScript runs.
- **Pixels.** A change that alters what is drawn ships behind a setting at
  today's value. The user picks the default from before-and-after screenshots.
- **Google Earth.** The comparison only measures:
  - nothing of Google Earth's is intercepted, cached, replayed or kept;
  - its screenshots stay in `build/` and are never committed or published;
  - runs are few, and signed out.
- **Google's tiles.** Never committed. A tile saved as a fixture stays in
  `build/` no longer than its `Cache-Control: max-age=14400`, four hours. Unit
  tests use small glb files made to the same profile.
- **The key.**
  - It never goes in an address, a log, a HAR or a trace. Redact `key=` and
    `session=` in every address a harness writes.
  - A browser profile that holds it stays in `build/` and is deleted when its
    run ends.
- **One heavy job at a time:** one full test suite, build or benchmark.
  Benchmarks start only when the harness finds the machine idle.

## Write scope and coordination

| Gate | Writes in |
| --- | --- |
| W0 | research; 0sfs/fly, for the routes; docs, for Status |
| W1 | renderer, engine, app, 0sfs/fly |
| W2 | the JSBSim fork; 0sfs/fly; 0sfs/research, for the adoption receipt |
| W3 | ui, app, UMN-VR/tour, 0sfs/fly, docs |
| W4 | native (new), engine, app |
| W5 | engine, app |
| W6 | engine, 0sfs/ground-contact, 0sfs/fly, research |
| W7 | engine, app; native for stages B and C |
| W8 | sky, native |
| W9 | 0sfs/fly, and the SDK consumers: 0sfs/autopilot, sound, g-forces, fuel, engines, exhaust, controls, rc |
| W10 | renderer, ui, engine, app, and the apps' composition |
| W11 | sphere-cubemap, sphere-equirectangular, sphere-tiled-cubemap, sphere-image, native |
| W12 | research, docs |

**Uncommitted at drafting, 16 October 2026.** Recheck rather than assume their
content, and never stage them with this work.

- **app:**
  - `vite.config.ts` and `vite/index.ts`, which W3 changes;
  - `README.md`, `package.json`, `package-lock.json`;
  - `src/app/browserRuntime.ts`, `createGlobeApp.ts` and its test,
    `runtimeComposition.ts`, `sceneHost.ts`, `GlobeOverlay.tsx`;
  - `src/shell/WindowOverlay.tsx` and `src/styles/sphere.css`;
  - untracked: the headset emulator's files, `src/app/immersive/` and
    `src/dev/`.
- **renderer:** `src/babylon/createRendererMode.ts`, which P7 changes, with
  `src/babylon/browserRenderer.ts` and `tests/createRendererMode.test.ts`.
- **engine:** `src/babylon/uiOcclusion.ts`, `tests/worldViewport.test.ts` and
  `docs/performance-notes.md`.
- **sphere-image:** `src/ports.ts`, `src/renderer.ts`, `src/viewer.ts` and their
  tests.
- **UMN-VR/tour:**
  - `vite.config.ts`, which W3 changes, and `docs/roadmap.md`;
  - untracked `docs/image-links-handoff.md`;
  - untracked `umn-tour-layers-*.json` and `umn-tour-poses-*.json`. These are
    the user's exports from a phone. Never move, rename or delete them.
- **This program's own documents**, written on 16 October 2026 and not yet
  committed:
  - docs: `README.md`, `docs/performance.md`, `docs/todo.md`,
    `docs/optimization-backlog.md`, `docs/proposals/webassembly.md` and this
    brief;
  - 0sfs/research: `optimization-backlog.md` and `competitor-performance.md`;
  - UMN-VR/tour: `docs/optimization-backlog.md`.

**A file with someone else's edits.** Change it on top of their edits. Then
either stage only your own hunks, for example by applying a patch of them with
`git apply --cached`, or ask the user to commit theirs first.

**Child agents.** A gate can go to a child once its interfaces are fixed: W4's
loader (`engine/src/native/`), W6's shared layout, W7's worker protocol.

- A child works in a worktree under that repository's `build/worktrees/`.
- Only the primary agent edits the shared files: settings catalogues, app
  composition, `package.json`, lockfiles and Vite configs.

## How to work a gate

1. **Read** the gate below, the plan's step, and every file the gate names.
   Confirm each claim about the code before relying on it.
2. **Baseline.** Before changing anything, run:
   - the gate's measurement, with W0's harness once it exists;
   - the tests of each repository the gate touches, so a failure that was
     already there is known.
3. **Change** in steps small enough to check one at a time. A step that changes
   pixels goes behind its setting.
4. **Prove** it with the gate's proof and each repository's checks (see
   Validation, below).
5. **Record** the gate in
   `~/gh/foss-earth/docs/build/webassembly/W<n>/<YYYY-MM-DD>/summary.md`:
   - git state before and after;
   - what changed, and the commands run;
   - the numbers, and where the raw output is (each harness writes into its
     own repository's ignored `build/`);
   - what is left.

   Then update the gate's row in the plan's Status: the date, the result in a
   line, and the evidence path.
6. **Report.** List decisions still waiting on the user, each with its
   screenshots or numbers, and continue independent authorised work. Don't
   repeat an answered approval request.

## Order and parallel work

```text
W0 ──> W1, W2, W10, and W5 and W7's stage A (TypeScript in workers)
W4 ──> W5's and W7's Rust, W8, W11
W5 ──> W6 ──> W7's stage C, W9
W2, W3 ──> W9
everything ──> W12
```

- **W0 first.** Everything after it is measured with it. W3 and W4 don't need
  its numbers, so they can start alongside it.
- **W5 and W7's stage A** move today's TypeScript into workers. They need
  neither isolation nor Rust, they should be most of the gain, and they don't
  wait for W3 or W4.
- **W7 before W8 and W9,** because every comparison view is Google's tiles.
- **One heavy job at a time** on the Mac.

## Gate W0: measure against Google Earth

Plan: [step 0](../webassembly.md#0-measure-against-google-earth). One harness
opens the same five views in Google Earth on the web and in FOSS Earth, in the
same Chrome, and reports the same numbers for both. Beside it go a power
harness (M1) and two fixed 0SFS flights (M2).

**Files.**

| File | Does |
| --- | --- |
| `research/scripts/benchmarks/earth-compare/views.mjs` | The five views and three motions, as data |
| `research/scripts/benchmarks/earth-compare/camera.mjs` | A view as Google Earth's address and as FOSS Earth's `GlobeViewState`, both ways |
| `research/scripts/benchmarks/earth-compare/metrics.mjs` | Numbers from a trace, a screencast and telemetry samples |
| `research/scripts/benchmarks/earth-compare/run.mjs` | Runs both apps, alternating, and writes the results |
| `research/scripts/benchmarks/power/battery.mjs` | The battery's power over time, less an idle baseline |
| `research/benchmarks/earth-compare/README.md` | The method, and the baseline table |
| `0sfs/fly/src/flight/` | `?route=cruise` and `?route=low`, read only with `?dev=1`, beside where `createFlightSimApp.ts` reads `flightPerf` |
| `0sfs/fly/scripts/profile-flight.mjs` | Flies the routes, and records them |

**Camera.**

- FOSS Earth's `GlobeViewState` (`engine/src/view.ts`) is `latDeg`, `lonDeg`,
  `headingDeg`, `pitchDeg` and `zoomMeters`. `pitchDeg` is 0 at the horizon and
  90 straight down, and `zoomMeters` is the distance to the target.
- `?bench=1` puts the app on `window.__fossEarthBench` (`app/src/main.tsx`). Its
  `setViewState` moves the camera.
- Google Earth's address is
  `https://earth.google.com/web/@lat,lon,{alt}a,{dist}d,{fovy}y,{heading}h,{tilt}t,{roll}r`,
  where tilt 0 is straight down.
- So:
  - `pitchDeg` is 90 minus `tilt`;
  - `zoomMeters` is `dist`;
  - the headings are the same;
  - `roll` is 0;
  - `fovy` is FOSS Earth's vertical field of view, read from its camera.
- `alt` is the target's height. Find in `engine/src/view.ts` and the camera
  code whether FOSS Earth's target is on the ellipsoid or on the ground, and
  give Google Earth the same height.
  Verified during W0: `cameraState.ts` follows resolved ground plus the compass
  offset, whose default is zero. Read the actual snapshot's ECEF centre.
  The plan's orbit now uses 1° tilt in both apps because the public camera's
  pitch limit is 89°. No production default is changed.
- **Check the mapping first.** Before any number is compared, overlay
  screenshots of each view from both apps. The horizon, landmarks and scale
  must agree. Keep the overlays in `build/`.

**Running the apps.**

- Chrome is headed, at 1280×720 CSS pixels and the screen's pixel ratio. It is
  driven over CDP, as scene-ab drives it. `openHeadlessChrome` only starts
  headless Chrome, so start Chrome yourself with `--remote-debugging-pipe` and
  attach with `connectHeadlessChrome`.
- Each cold run gets a fresh profile in `build/`, which is also signed out of
  Google.
- FOSS Earth runs twice:
  - as published, at `https://foss-earth.github.io/app/`, with Google 3D Tiles
    and the user's key;
  - from a local build of the change under test, served the way Pages serves
    it.
- **The key** comes from `FOSS_EARTH_GOOGLE_KEY`, as the ground rules say.
  `Page.addScriptToEvaluateOnNewDocument` writes it to `localStorage` before
  the app starts, under `foss-earth.settings.v1`, as
  `{"version":1,"values":{"map.source.googleKey":"<key>","map.source.basemap":"google"}}`.
- **Motions.** Google Earth moves through its keyboard shortcuts, sent with
  `Input.dispatchKeyEvent`. Its address gives the camera before and after. FOSS
  Earth replays the same path through `setViewState`, once a frame.
- If Google Earth refuses automation, the user drives it, and the harness only
  watches through `--remote-debugging-port`.

**Numbers**, the same way for both apps:

- **Visually complete:** from `Page.startScreencast`, the time after which every
  frame stays within 99.5% of the final frame for 2 s.
- **Bytes:** `encodedDataLength` from the Network domain.
- **Frame intervals:** p50, p95 and p99, from the trace's presented frames, not
  from either app's own counters.
- **Main-thread busy time:** `TaskDuration` from `Performance.getMetrics`.
- **CPU per Chrome process:** `telemetry.mjs`'s `readProcesses` and
  `processCpuDelta`.
- **Memory:** the JavaScript heap, and each process's resident memory.
- **Watts over the idle baseline**, from `battery.mjs`.
- **Settling:** after a motion, the time until the view is complete again.

Use the plan's image mask, tolerance and final-detail checks. Reject blank,
failed or persistently coarse loads rather than recording them as complete.
Keep render size, field of view, source and quality beside each result. An
endpoint match does not prove the same camera motion: compare sampled poses
throughout, or mark the motion as unmatched and report it separately.

Three runs of each, alternating which app goes first; report the median and
the range. Timings are taken on the power adapter, and power on battery in Low
Power Mode at a fixed brightness.

**Power.**

- `battery.mjs` samples `ioreg -rn AppleSmartBattery` while unplugged. It gives
  the voltage (mV) and the current (mA); their product is the whole machine's
  power.
- The current is unsigned, so a discharge reads as 2^64 minus the current.
- An idle baseline at the same brightness is subtracted.
- `pmset -g` says whether Low Power Mode is on. `environment.mjs` may already
  parse it.
- When the user runs `sudo powermetrics --samplers cpu_power,gpu_power -i 1000`
  beside a run, its log splits CPU from GPU.

**Flights.**

- `cruise` flies at 1,500 m, and `low` at 150 m over flat ground. Each starts
  at a fixed position and holds its heading and altitude through the autopilot
  for three minutes.
- Choose each start where Google's tiles and terrain cover the whole route.
  Record the coordinates, the aircraft and the settings in the README.
- Measure each flight headed, since headless Chrome skips the display's
  compositing: frame times on the adapter, and watts on battery in Low Power
  Mode.

**Done when** the README's baseline table is filled for both apps, at every
view, in both power states; both flights are measured; and Status row 0 is
updated.

## Gate W1: cheap wins first

Plan: [step 1](../webassembly.md#1-cheap-wins-first). Each item is measured
with W0, one at a time. An item that changes pixels ships behind its setting
at today's value. D1 is already done: the speedups are on GitHub.

**P1, resolution.**

- `renderer.resolutionScale`, in `renderer/src/settings/catalogue.ts`: a value
  that draws at most about 1.5 device pixels per CSS pixel. Today's default is
  one per device pixel.
- The backlog says tile error is computed from CSS pixels, so tile detail
  shouldn't drop. Check that the same tiles load.

**P7, opaque canvas.** In `renderer/src/babylon/createRendererMode.ts`, which
has uncommitted edits: `alpha: false` for WebGL, and `alphaMode: "opaque"` for
WebGPU. First, with a bright page background behind the canvas, take a
screenshot to see what shows through today.

**P4, F1, F8: the frame cap.**

- Use the existing `renderer.frameRateCap`.
- 60 by default on displays above 60 Hz (F8).
- 30 or 40 on battery. `navigator.getBattery()` exists only in Chromium; where
  it doesn't, nothing changes.
- F1 is a "Battery flight" preset beside the six in
  `0sfs/fly/src/flight/presets/`.
- A cap must skip whole display refreshes: at 120 Hz, 40 fps is every third
  refresh. Check in a trace that frames land on refreshes, not between them.

**C6, idle audit.**

- At rest, for 60 s after the view is complete, count:
  - `requestAnimationFrame` callbacks;
  - timers;
  - worker messages;
  - requests;
  - CPU per process.
- An init script that wraps those functions and samples their stacks, and a
  trace, find where each comes from.
- Remove each source, or record why it stays. Compare with Google Earth's 60 s
  at rest from W0.

**S4, shader chunks.** `renderer/src/vite/babylonShaderChunks.ts`. A HAR on each
backend must show only one of the GLSL and WGSL chunk sets loading.

**glslang and twgsl.** On WebGPU, Babylon fetches glslang and twgsl (about
2.6 MB) as soon as any GLSL shader compiles.

1. Find that request in a WebGPU HAR.
2. Find the shader that caused it.
3. Port it to WGSL (`ShaderLanguage.WGSL`), and compare pixels.

**Babylon's runtime files.**

- Point each CDN address at files the app serves:
  - `WebGPUEngine`'s `glslangOptions` and `twgslOptions`;
  - `DracoDecoder.DefaultConfiguration`;
  - `KhronosTextureContainer2.URLConfig`;
  - the Basis transcoder's `JSModuleURL` and `WasmModuleURL`.
- Ask before vendoring them. In the repository that ships them, record each
  file's licence, version and sha256.
- **Proof:** a HAR of each app on each backend with no request to
  `cdn.babylonjs.com`.

**T2, real tile bytes.**

- The Babylon adapter's `calculateBytesUsed` returns 1. Override it in
  `engine/src/babylon/createTilesRuntime.ts` with the tile's real bytes:
  - vertex and index buffers;
  - each texture's width × height × 4, × 4/3 for its mipmaps.
- Then `map.google.cacheBytes` means bytes.
- A/B the eviction at W0's views: tiles kept, evictions, and downloads again.
  The 400 MiB default may need retuning; ask.

**T1, T3, T5**, each behind a setting that is off by default:

- T1, horizon detail, through `calculateTileViewError`, which
  `createTilesRuntime.ts` already wraps;
- T3, haze culling, from the sky's visibility;
- T5, holding back requests while the view turns fast.

**F2, F3: 0SFS's HUD.** In `0sfs/fly/src/flight/hud/`:

- F2: write the HUD's text and values only when one changes;
- F3: draw the attitude indicator at a fixed rate, or when its picture moves by
  a pixel.

**Done when** each item is in and measured, its backlog row is updated, and the
defaults that change pixels are waiting for the user's choice.

## Gate W2: JSBSim's exceptions and flags

Plan: [step 2](../webassembly.md#2-jsbsims-exceptions-and-flags).

**The branch.** The fork is `~/gh/Felipegalind0/jsbsim`. At drafting it was on
`migration/repository-split-20261008`, at `b53ed5a8`. Fly's `docs/jsbsim.md`
says new work branches from `master`. Ask which to start from.

**Baseline.**

- In `wasm/`, run `npm test`, and keep the current build's metadata.
- Fly uses `1.2.4-fork.21`, from
  `0sfs/fly/deps/felipegalind0-jsbsim-1.2.4-fork.21.tgz`. Its glue has 45
  distinct `invoke_*` trampolines. Count them with
  `grep -o -E 'invoke_[a-z]+' jsbsim_wasm.mjs | sort -u | wc -l`.

**Bench.** A new `wasm/bench/step-time.mjs`, beside `property-batch.mjs`:

- the C172 and the F-35B, each on a fixed script: fixed controls at each step,
  for a fixed number of steps;
- in Node, then in Chrome and WebKit through the fork's Playwright 1.63.0.
  WebKit needs Playwright's WebKit build; ask before installing it;
- steps per second, as the median of interleaved runs.

**Flags.**

- In the root `CMakeLists.txt`, the `if(BUILD_WASM_MODULE)` block at about line
  48: `add_compile_options($<$<COMPILE_LANGUAGE:CXX>:-fexceptions>)` becomes
  `-fwasm-exceptions` and `-sWASM_LEGACY_EXCEPTIONS=1`.
- In `wasm/CMakeLists.txt`:
  - `target_compile_options(jsbsim_wasm PRIVATE -fexceptions)`, line 42, the
    same;
  - in `target_link_options`, `-sNO_DISABLE_EXCEPTION_CATCHING`, line 54,
    becomes `-fwasm-exceptions` and `-sWASM_LEGACY_EXCEPTIONS=1`.
- `-flto` in both places.
- `-msimd128` last, and only with the user's consent.
- `wasm/scripts/build-wasm.mjs` passes only `-DCMAKE_BUILD_TYPE=Release` to
  CMake. Leave it, unless a flag has to go through it.

**Matrix:** the baseline, then wasm exceptions, then LTO, then SIMD. For each
cell, record:

- the step time, for each aircraft in each engine;
- the size of the `.wasm` and of the glue;
- the start time;
- the trajectory against the baseline's: every output property at every step,
  compared with `Object.is`. A cell whose trajectory differs is rejected.

The new glue should have no `invoke_*` trampolines left.

**Error paths** must not change. `wasm/test/runtime-lifecycle.test.mjs`,
`wasm/test/sdk-lifecycle.test.mjs` and fork.4's malformed-propulsion recovery
test pass unchanged.

**Ship**, as fly's `docs/jsbsim.md` says:

1. Commit in the fork (ask). Only a clean, in-tree build can be installed.
2. `npm run pack:build`, under the next unused fork number.
3. The tgz goes into `0sfs/fly/deps/` beside the others. Never replace one in
   place.
4. Update `0sfs/fly/package.json`, its `package-lock.json` and
   `scripts/verify-jsbsim-artifact.test.mjs`.
5. Run `npm run verify:jsbsim` and `node scripts/check-jsbsim-browser-artifact.mjs`.
   Run `scripts/check-jsbsim-runtime-parity.mjs` too, where a native build is
   available.
6. Write the adoption receipt in
   `0sfs/research/validation/evidence/jsbsim/adoption/fork<N>/`, like fork21's.

**Done when** the metadata lists every flag, the matrix is recorded, and fly
uses the fastest build whose trajectory is identical.

## Gate W3: isolation from the service worker

Plan: [step 3](../webassembly.md#3-isolation-from-the-service-worker). File by
file:

1. **`ui/vite/appFilesWorker.js`**, the worker's source. `appFiles()` writes it
   into each build as `foss-earth-sw.js`, ending in `install(self, manifest)`.
   - **Policy.** Read it from the worker's own address:
     `new URL(self.location.href).searchParams`, with `keep` and `isolate`.
     The manifest's new `isolation` field is the build's ceiling: `"off"`,
     `"report-only"` or `"enforce"`.
   - **Headers.** Serve every response in scope as
     `new Response(body, { status, statusText, headers })`, adding:
     - `Cross-Origin-Opener-Policy: same-origin`;
     - `Cross-Origin-Embedder-Policy: require-corp`;
     - `Cross-Origin-Resource-Policy: cross-origin`.

     In report-only, send the `-Report-Only` forms of COOP and COEP instead.
     Never store the added headers: the cache keeps what the server sent.
   - **Pass through, untouched:** status 0, `opaqueredirect`, and requests with
     `cache: "only-if-cached"` whose mode isn't `same-origin`.
   - **Answer everything in scope.** While isolating, answer every same-origin
     request in scope from the network, with the headers, not only the kept
     files. Workers, WASM and data then get the headers too. Navigations keep
     using navigation preload.
   - **The cache.** With `keep=0`, the worker isolates without writing to its
     cache.
   - Keep honouring the `foss-earth-forget` message, for pages already open.
2. **`ui/src/browser/isolation.ts`**, new. TypeScript without imports, inlined
   into the page the way `browserRecovery()` inlines `browserData.ts` (in
   `ui/vite/index.mjs`, at about line 83).
   - **It skips an isolation upgrade when:**
     - the page is `crossOriginIsolated` already;
     - `navigator.serviceWorker` is missing;
     - Shared memory is off;
     - the page is in a frame, or is the recovery page;
     - `sessionStorage` holds `foss-earth.isolation.v1`.

     It reads Shared memory, and Keep the app's files, straight from
     `foss-earth.settings.v1`, since no app code has loaded yet.
     Independently reconcile an existing enforcing worker when the setting is
     off or the build is report-only; an early return must not leave that old
     policy in control.
   - **Otherwise it:**
     1. sets the flag;
     2. registers `foss-earth-sw.js?keep=<0|1>&isolate=1` at the app's scope;
     3. waits up to 4 s for the expected worker to become the controller;
     4. reloads once after success. Rejection, timeout or storage denial
        instead releases the app into its fallback and records the reason.
   - **While it waits,** it marks the page so the entry points don't start, for
     example with an attribute on `<html>`.
     The pending state must settle on every exit path; neither recovery nor
     an entry point can wait indefinitely.
   - **An isolated load clears the flag.**
   - **It records the state and its reason:** pending, isolated, unavailable or
     off.
   - **Opt-out.** Update the same scope to `isolate=0` (or unregister when
     keeping is also off), await the new controller and reload at most once.
     Test turning off after an enforcing worker already controlled the page,
     not just a fresh profile with the setting off.
3. **`ui/vite/index.mjs`:** a new `isolation({ appId, mode })` plugin, where
   `mode` is `"report-only"` or `"enforce"`.
   - It sets the headers in `server.headers` and `preview.headers`, so that
     those servers can test the isolated tier. A setting cannot remove headers
     already sent by the server; opt-out still prevents shared-memory use.
     The header-free live check below proves the service-worker path.
   - It emits the inline script ahead of browserRecovery's `head-prepend`
     script. Vite injects each hook's `head-prepend` tags in turn, so the order
     depends on the plugins' order, and the app and the tour list them
     differently. Don't rely on it: a test builds a page and asserts that the
     isolation script comes first in `<head>`.
   - It passes `isolation` into the worker's manifest through
     `appFiles({ isolation })` (the manifest is built at about line 56).
4. **`ui/src/browser/keptFiles.ts`:**
   - register when keeping or isolation is on, and unregister when both are
     off;
   - compare workers by path, `new URL(scriptURL).pathname`, wherever it
     compares `scriptURL === workerUrl` (about lines 46, 58, 77 and 141), since
     the policy is now in the query;
   - a change of policy re-registers at the new address.
5. **`app/src/app/appFiles.ts`:** pass the isolation setting through
   `createKeptFilesClient`.
6. **`app/src/settings/catalogue/interface.ts`:** a new `app.sharedMemory`,
   "Shared memory", beside `app.keepFiles`.
   - On by default.
   - `appliesLive: false`, since it takes effect on the next load.
   - Its description says what it does and what turning it off costs.
7. **The entry points wait while isolation is pending:** `app/src/main.tsx`,
   `0sfs/fly/src/main.tsx`, and the tour's `src/selector.js` and
   `src/tour/mountTour.ts`.
8. **`ui/src/browser/browserData.ts`:** browser recovery and the session trail
   don't count the isolation reload as a failed or stalled start.
9. **`ui/src/browser/browserDetails.ts`:** the report gets
   `crossOriginIsolated`, the isolation state and reason, and, after W4, the
   tier. In report-only, a `ReportingObserver` collects COEP reports, and the
   report lists them. Record unsupported reporting explicitly; an empty report
   from such a browser does not establish that all resources are compatible.
10. **The apps' configs.**
    - App `vite.config.ts` (uncommitted edits): add
      `isolation({ appId: 'foss-earth', mode })` beside `appFiles()`.
    - `app/vite/appFiles.ts`: pass `isolation` on to the shared `appFiles`.
    - `app/vite/index.ts` (uncommitted edits): export `isolation` from
      `foss-earth/vite`, for the tour and 0SFS.
    - The tour's `vite.config.ts` (uncommitted edits): add
      `isolation({ appId: 'umn-vr-tour', mode })`.
    - 0SFS's `fly/vite.config.ts` has neither plugin, and no service worker.
      - Add both.
      - Add the App files settings, Keep the app's files and Shared memory, to
        fly's settings (`src/flight/settings/`).
      - Check that `copyIndexToPagesPaths()` (about line 60) carries the inline
        script into every page it writes, and that the worker's scope covers
        them.
11. **Docs:** the paragraph in [Performance](../../performance.md#capture-harness)
    that says only the harness is isolated changes when this ships.

**Report first.** One release uses `mode: "report-only"`. It sends the
report-only headers without an isolation-upgrade reload. Reports start on the
next controlled navigation; test that navigation before judging a clean
report. Replacing an old enforcing worker may still need the one downgrade
reload. Diagnostics → Copy report lists violations where supported and says
when reporting is unavailable. Once live resource checks pass and the user
has tried the release, the next release enforces. Ask before each deploy.

**Checks.**

- **Vitest:**
  - the worker: its policy, the headers, each pass-through case, nothing added
    stored, every same-origin request answered while isolating;
  - the inline script: each of its conditions;
  - `keptFiles.ts`: comparison by path, and when it registers and unregisters;
  - the script order in the built page.
- **A new live browser check**, for example
  `app/scripts/validation/isolation-live.mjs`.
  - It drives Chrome and Firefox the way the app's other browser checks do
    (`app/docs/browser-testing.md`), and WebKit through Playwright once that
    is installed.
  - It serves the built app from a static server that sends no isolation
    headers, as Pages does. `vite preview` sends them itself, so it can't be
    used here.
  - The cases:
    - a first visit;
    - a reload;
    - a Shift-reload: in Chrome, a reload that bypasses the worker;
    - a context with service workers blocked;
    - the app in another origin's iframe, with and without
      `allow="cross-origin-isolated"`;
    - the setting off.
    - setting on → off → on with the old worker installed;
    - enforcing → report-only and report-only → enforcing builds;
    - denied storage, rejected registration and controller timeout;
    - two open tabs with different settings, and a recovery-page visit.
  - In each case, check `crossOriginIsolated` in the page and in a dedicated
    worker, and the tier. Check also that every map loads with the network on:
    Google (with the key from the environment), Mapterhorn, USGS imagery,
    search, airports, and the tour's tiles.
- The app's `npm run check:browser` still passes. It blocks outside requests,
  so it checks the app's own behaviour, not the maps; its pins are in
  `app/docs/browser-testing.md`.
- The user tries Safari on the tour's iPhone XS Max.

**Done when** supported top-level first visits isolate after at most one
bounded reload in Chrome, Firefox and Safari; every map loads; opt-out works;
and unsupported contexts start on a reported fallback. Record local
qualification separately from the later user-approved deployment and its
live checks. Don't call the deployment done before it occurs.

## Gate W4: toolchain, packages and loader

Plan: [step 4](../webassembly.md#4-toolchain-packages-and-loader).

**Ask first.**

1. `rustup target add wasm32-unknown-unknown`, for stable 1.99.0.
2. A nightly, pinned by date:
   `rustup toolchain install nightly-<YYYY-MM-DD> --component rust-src --target wasm32-unknown-unknown`.
   Pick the newest date that builds `-Z build-std` for wasm32 with atomics, and
   record it.
3. In the native repository,
   `cargo install wasm-bindgen-cli --version <the version in Cargo.lock> --locked --root build/tools`,
   so the CLI matches the crate exactly.
4. Creating the GitHub repository `foss-earth/native`. Until it exists, work in
   a local `~/gh/foss-earth/native` with `git init`.

**Layout.**

```text
native/
  AGENTS.md, README.md, CONTRIBUTING.md
  LICENSE, NOTICE          AGPL-3.0-only, as engine has them
  Cargo.toml               the workspace; [profile.release] opt-level = 3,
                           lto = "fat", codegen-units = 1, panic = "abort"
  rust-toolchain.toml      the stable version
  toolchain.lock.json      stable and nightly, wasm-bindgen, binaryen, Node
  clippy.toml              disallowed-methods (the plan's lint)
  crates/
    earth-core/  earth-raster/  earth-google/  earth-sky/  earth-projections/
  packages/
    native-raster/  native-google/  native-sky/  native-projections/
      package.json  threaded/  single/  build-metadata.json  glue/  types/
  scripts/
    build.mjs              builds both variants of a package, writes metadata
    check.mjs              rebuilds and compares, or checks hashes, size and tests
  build/                   gitignored
```

The AGENTS.md carries the org's rules and the plan's rules for bit-identical
results.

**The threaded build**, for one crate:

```sh
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals,+simd128
  -C link-arg=--shared-memory -C link-arg=--import-memory
  -C link-arg=--max-memory=<the binary maximum, in bytes>
  -C link-arg=--export=__wasm_init_tls -C link-arg=--export=__tls_size
  -C link-arg=--export=__tls_align -C link-arg=--export=__tls_base' \
cargo +nightly-<date> build -p <crate> --release \
  --target wasm32-unknown-unknown -Z build-std=panic_abort,std
wasm-bindgen --target web --out-dir packages/<package>/threaded \
  target/wasm32-unknown-unknown/release/<crate>.wasm
```

`RUSTFLAGS` is one line in practice. The single-threaded build uses
`-C target-feature=+simd128` on stable, with no `-Z` flags. Both builds then run
binaryen 132's `wasm-opt -O3`, with their features enabled; check the flag names
in `wasm-opt --help`.

These commands are a build recipe to qualify, not an already tested toolchain.
Use distinct Cargo target directories for stable/single and nightly/threaded,
pass `--locked`, and record dependency features, source digests and command
lines. `earth-core` is a shared Rust library; the four shipping crates produce
`cdylib` WASM artifacts. Pin their wasm-bindgen versions together.

Inspect both the target's defaults (`rustc --print cfg --target
wasm32-unknown-unknown`) and the final binary's features. Validate the final
glue and binary against the proposed Safari 16.4 SIMD floor. Feature detection
must also catch unsupported compiler defaults.

**The loader**, in `engine/src/native/`:

- **`tier.ts`** chooses the page's capability ceiling, and records each core's
  actual tier when it is first used. The threaded tier needs
  all of:
  - `crossOriginIsolated`;
  - `SharedArrayBuffer`;
  - `WebAssembly.validate` of a small SIMD module;
  - validation of an atomic-operation module and successful worker startup;
  - `new WebAssembly.Memory({ initial, maximum, shared: true })` using that
    core's declared page counts, retained for the core rather than discarded;
  - `navigator.hardwareConcurrency >= 2`;
  - Shared memory on.
- **`load.ts`** compiles each binary once, with `WebAssembly.compileStreaming`,
  or from bytes when the server's type is wrong, and sends the module to the
  workers.
- **`pool.ts`** holds the workers. It sizes every pool on the page together,
  from `navigator.hardwareConcurrency`, with `map.loader.decodeWorkers`
  (`app/src/app/browserPolicy.ts`) and Babylon's own workers in the same
  budget.
- **`check.ts`** runs the first-input check against the TypeScript.

Load and probe only the active map family and requested features. The tier
override cannot bypass capability checks. On failed compile, fetch, memory,
startup, timeout or parity, fall back per core once for the session, and name
the reason in diagnostics. Preserve inputs needed for fallback before transfer.

Apply the plan's publication and buffer-ownership rules. The page calls no
blocking Rust export. Before accepting a custom pool, prove separate stacks,
TLS and one-time initialisation, concurrent allocator safety, cancellation,
stale-result rejection, memory growth and disposal. Instantiate rayon from a
coordinator worker so its parallel calls never block the page. Version the
protocol and layout; document job IDs, generations and payload bounds. Inject
cores through library ports rather than adding a sky → engine dependency.

**A setting.** `native.tier` goes in a new
`engine/src/settings/catalogue/native.ts`: `auto`, `threaded`, `single` or
`typescript`; `auto` by default; `appliesLive: false`. `?set.native.tier=`
then works as every setting's `?set.` does.

**Glue.**

- Each binary is referenced as `new URL("…_bg.wasm", import.meta.url)`, so Vite
  gives it a content hash and the service worker keeps it.
- The workers are module workers:
  `new Worker(new URL("./….worker.ts", import.meta.url), { type: "module" })`.

**An empty core.** `earth-core` exports one function that uses an imported
`Math.sin`, `js_max` and `js_round` on fixed inputs, beside its TypeScript
twin.

Use the plan's executing-realm imports and numeric edge fixtures. Workers
cannot receive the page's function objects; prove page/worker/WASM parity in
each browser. `Object.is` accepts all NaN payloads as equal, so output that is
consumed as raw bytes also needs a byte comparison.

**Tests.**

- A differential test against the TypeScript, compared with `Object.is`:
  - in Node, on the single-threaded build;
  - in headless Chrome, on the threaded build, since wasm-bindgen's threads
    need Web Workers.
- Mutants: a native `sin`, and a reordered sum. Each must fail the differential
  test.
- A size budget for each binary.
- A rebuild, compared by sha256, where the pinned toolchain is installed.
- Worker failure, failed capabilities, denied memory, forced-but-unavailable
  tiers and repeated map switches. Every case reaches a usable fallback and
  releases retired resources.

**Done when** the empty core runs through the single-threaded build in Node
and both builds in the three browsers, chosen by the loader, and the report
names the actual tier.

## Gate W5: raster terrain off the main thread

Plan: [step 5](../webassembly.md#5-raster-terrain-off-the-main-thread).

**Files.**

| File | Part |
| --- | --- |
| `engine/src/babylon/terrainMesh.ts` | `terrainMeshTarget` (float64 positions about the tile's centre, rounded to float32, and the height bounds) and `createTerrainMesh` |
| `engine/src/babylon/createRasterTilesRuntime.ts` | A new tile's first mesh from `GLOBAL_TERRAIN` (about line 263); `applyGrid`'s call to `terrainMeshTarget` (about line 306); `processMeshRebuilds` (about line 1217) |
| `engine/src/babylon/meshRefinement.ts` | R2 |
| `engine/src/browser/terrainDecodeWorkerKernel.ts`, `terrainDecodeWorkerProtocol.ts`, `terrainDecodeWorkers.ts`, `terrainImageDecoder.ts` | The decode worker |
| `app/src/app/terrainDecode.worker.ts` | The worker's entry |
| `app/src/app/browserPolicy.ts` | `map.loader.decodeWorkers` |

**Order:** the plan's six items, in turn.

- **The first item** follows the pattern of engine commit `d95411a` ("Use
  decode workers only after a worker's heights match the page's for one
  tile"). The worker's first mesh is compared with the page's, bit for bit,
  before any worker mesh is used.
- **R1:** a test of pointer picks on terrain.
- **R4:** screenshots of tile edges, with tiles arriving in different orders.
  Skirts change geometry; keep today's stitching as the default until the
  user accepts the screenshots, and exclude skirt-only faces from ground
  queries so the physical surface stays the same.

**Proof.**

- On every fixture tile, the positions equal `terrainMeshTarget`'s float32
  values bit for bit.
- Ground contact reads the same surface.
- W0's trace shows a tile's arrival costing nothing on the main thread.

**Done when** no terrain geometry is built on the main thread, in any tier.

## Gate W6: ground, height grids and BVHs

Plan: [step 6](../webassembly.md#6-ground-height-grids-and-bvhs).

**Files.**

- `research/scripts/benchmarks/collision/bvh-prototype.mjs`, the starting
  point;
- `engine/src/babylon/surfaceQuery.ts` and `tileHeightProvider.ts`, the queries
  the ground uses today;
- `0sfs/ground-contact` and `0sfs/fly/src/flight/physics/`, the gear and body
  rays (F4).

**Steps.**

1. **Record rays.** Fly the `low` route and record every ground ray:
   - its origin, direction and length;
   - `pickWithRay`'s hit: the mesh, the face, the distance.

   Keep the recording in `build/`.
2. **Raster terrain.** Walk the grid over the float32 positions, with each cell
   split `a,c,b` and `b,c,d`, as it is drawn.
3. **Google tiles.** A BVH for each tile, built in a worker when a query first
   reaches the tile, transferred, and dropped with the tile. Until its matching
   generation is ready, use the existing query; a synchronous ground query
   never waits for worker construction.
4. **The ground cache (C1, F4).** Once a frame, collect the triangles within the
   aircraft's size plus two steps of travel. Answer every ray of that frame
   from them.
5. **Shared memory.** Grids and BVHs move into shared memory, in a layout
   documented in the native repository (offsets and types), and are read in
   place. Publish immutable generations atomically and retain them until every
   reader releases them. A tile eviction cannot free a grid still in use by
   the physics worker.

**Proof.** Every recorded ray gives the same triangle and the same distance,
bit for bit. Include finite lengths, cell edges, coplanar/tied hits, transforms,
inside/under-terrain origins and tile replacement. Preserve the reference's
tie ordering. A mismatching accelerated query falls back to the reference.

**Done when** collision costs under 0.1 ms a frame on the `low` flight, in both
tiers.

## Gate W7: Google tiles off the main thread

Plan: [step 7](../webassembly.md#7-google-tiles-off-the-main-thread).

**Where it plugs in.** `engine/src/babylon/createTilesRuntime.ts` already wraps
the renderer's `parseTile`, at about line 239, through `work.run`.

- A tile whose bytes match the profile goes to the worker.
- Anything else goes to the adapter's `parseTile`, as now.

**What it must reproduce.** The contract is the adapter's `parseTile`, in
3d-tiles-renderer 0.4.24's `src/babylonjs/renderer/tiles/TilesRenderer.js`, and
its `src/babylonjs/renderer/loaders/GLTFLoader.js`. In order:

1. **What Babylon's glTF loader builds.** Read Babylon 8.56.2's
   `@babylonjs/loaders/glTF/2.0/glTFLoader.js` and reproduce exactly:
   - the `__root__` node for the change of handedness, and its scaling and
     rotation;
   - the glTF node, with its matrix decomposed;
   - the names and the parenting;
   - the vertex data, and what it makes of uint8 indices;
   - the PBR material with `unlit`;
   - textures with `invertY` false, and the sampler's wrap (clamp) and
     filters.
2. `container.addAllToScene()`.
3. The root's `rotationQuaternion` set to identity. Then
   `adjustmentTransform` × the root's world matrix, decomposed into the root's
   scaling, rotation and position.
4. `setEnabled(false)`, then
   `root.computeWorldMatrix(true).multiply(tileTransform)`, decomposed the same
   way.
5. If the load was aborted: `container.dispose()`, and stop.
6. `checkCollisions` on the child meshes, when the renderer's `checkCollisions`
   is on.
7. Three fields on `engineData`:
   - `scene`, the root;
   - `container`, an `AssetContainer` holding everything created, so
     `disposeTile` frees it all;
   - `metadata`, the glb's JSON. `GoogleCloudAuthPlugin` reads
     `metadata.asset.copyright` from it for the attributions Google requires.

Keep the root disabled until the adapter shows the tile. Preserve this order
in an adapter-contract test.

**New files.**

| File | Does |
| --- | --- |
| `engine/src/browser/googleTileWorkerKernel.ts` | The profile check, glb parsing, JPEG decoding with `createImageBitmap`, and transferred typed arrays and bitmaps |
| `engine/src/browser/googleTileWorkerProtocol.ts` | The messages |
| `engine/src/browser/googleTileWorkers.ts` | The pool, sized with the decode pool |
| `app/src/app/googleTile.worker.ts` | The worker's entry, like `terrainDecode.worker.ts` |
| `engine/src/babylon/googleTileMeshes.ts` | Babylon objects from the worker's output |

**The profile.** The worker checks each tile, and anything that doesn't match
goes to Babylon's loader:

- **The file.** The `glTF` magic and version 2, a JSON chunk, then one BIN
  chunk.
- **Extensions.**
  - `extensionsRequired` is within `KHR_materials_unlit`.
  - Nothing names `KHR_draco_mesh_compression`, `EXT_meshopt_compression` or
    `KHR_texture_basisu`.
- **Structure.**
  - One scene, and one node with a `matrix`.
  - One or two primitives, in mode 4 or with no mode.
  - No sparse accessors.
- **Data.**
  - `POSITION` is float32 VEC3, and `TEXCOORD_0` float32 VEC2. No other
    attributes.
  - Indices are uint16 or uint8.
  - Each base colour texture is a JPEG in a bufferView.

**Stage A's proof.**

- **Saved live tiles.** They stay in `build/` for at most four hours.
  Compared with `Object.is` against Babylon's loader, each tile has the same:
  - vertex and index data;
  - world matrices;
  - materials and texture sizes;
  - `metadata`.
- **Screenshots** identical at W0's five views, on WebGPU, WebGL2 and WebGL1.
- **Attributions** identical.
- **Abort and dispose.** `scene.meshes`, `scene.materials` and `scene.textures`
  count the same before and after.
- **Unit tests** on committed synthetic glb files made to the profile.
- **T2's real byte count**, from the arrays.

**Stage B (T7)** and **stage C** (BVHs, with W6) are as the plan says. Stage
B's screenshots go to the user.

**Done when:**

- the main thread spends under 0.5 ms per Google tile at W0's five views;
- geometry memory is down 40% after stage B;
- the pixels are identical, or the user accepted the difference.

## Gate W8: sky binary

Plan: [step 8](../webassembly.md#8-sky-binary).

**Files.**

- `sky/src/atmosphere.ts`: `createAtmosphere` at line 195, and its inner
  `march` at line 346.
- `sky/build/wasm-bakeoff/reference/check.mjs`: the bake-off's exactness check,
  to reuse.

**Order.**

1. `createAtmosphere` in a worker, as TypeScript. Measure its 95 ms leaving the
   main thread.
2. `march` in Rust, with `Math.exp` and the rest imported from its executing realm.
   Compare its bits before porting anything else.
3. Measure it on V8, JavaScriptCore and SpiderMonkey. On an engine where the
   WASM with imported `Math` is slower than the TypeScript, that engine keeps
   the TypeScript.
4. The rest. Threads split the directions, and SIMD works across directions.

**Checks:** `npm test`, `npm run validate:model` and `npm run validate:render`
in `sky`.

**Done when** the render check passes 117 of 117, and the value checks pass,
with both builds.

## Gate W9: JSBSim in a worker

Plan: [step 9](../webassembly.md#9-jsbsim-in-a-worker).

**Files.**

- `0sfs/fly/src/flight/jsbsim/createJsbsimRuntime.ts`,
  `0sfs/fly/src/flight/physics/` and `0sfs/fly/src/flight/createFlightSimApp.ts`;
- the SDK consumers: `0sfs/autopilot`, `sound`, `g-forces`, `fuel`, `engines`,
  `exhaust`, `controls` and `rc`.

**Steps.**

1. **List** every JSBSim property each consumer reads or writes, and when. That
   list is the shared state's layout.
2. **A worker** loads JSBSim and steps at 120 Hz on its own clock. It paces
   itself with `Atomics.wait` on a shared counter.
3. **State** lives in a `SharedArrayBuffer`, using atomic payload access or
   buffers with explicit ownership and atomic publication.
   - A sequence lock alone does not make racing ordinary Rust float reads
     and writes safe. Document the memory ordering and lifetimes.
   - The page makes at most two snapshot attempts; on contention it keeps its
     last complete state. It never waits or spins until the worker finishes.
   - Controls use a separate single-writer channel, keyed to simulation steps.
     Keep fixed steps, bounded catch-up, pause/resume, hidden-page behaviour
     and shutdown explicit. Wall-clock jitter must not reassign inputs.
4. **Ground** comes from W6's shared memory, directly.
5. **Without isolation,** JSBSim stays on the main thread, as now.

**Proof.** A scripted flight, with its inputs keyed to simulation steps and its
ground recorded, gives the same trajectory bit for bit in the worker and on the
main thread.

**Done when** fly's frame budget shows no JSBSim on the main thread in the
threaded tier, and the scripted flight matches.

## Gate W10: startup and pacing

Plan: [step 10](../webassembly.md#10-startup-and-pacing). One item at a time,
each measured with W0.

- **S1.** Import Babylon's modules, not the `@babylonjs/core` barrels, across
  the libraries and apps, and register side effects explicitly.
  - Today flight's main chunk is 4.8 MB, and the tour's 5.4 MB.
  - A missing side-effect import fails only at run time, and only on the path
    that needs it. Cover each backend's startup and every tab in a browser
    check, before and after.
- **S2.** Load closed panels, editors and providers on demand.
- **S3, B2.** Compile likely shaders early, during the loading screen:
  `KHR_parallel_shader_compile` on WebGL, and `createRenderPipelineAsync` on
  WebGPU.
- **P5.** Lower resolution while the camera moves, restored a moment after it
  rests. Behind a setting.
- **P8, B8.** First fix the WebGPU frame timer that reads 0 (B8). Then
  dynamic resolution from GPU time, within the user's limits. Behind a
  setting.
- **C2.** Reuse vectors, arrays and matrices on hot paths, and leave unchanged
  uniforms alone. Garbage-collection pauses in the trace show the gain.

## Gate W11: projections binary

Plan: [step 11](../webassembly.md#11-projections-binary).

**Files.**

- The kernels are in `sphere-cubemap`, `sphere-equirectangular` and
  `sphere-tiled-cubemap`.
- Preparation runs through `sphere-image`'s `foss-earth-prepare-panorama`
  (`node/prepare-cli.mjs`). `sphere-image` has uncommitted edits, so leave
  them alone.

**Baselines:** 519 ms for a 1536 face from an 8192 source, and 15.1 s to
prepare an 8192 tour.

**Steps.**

- In Node, the single-threaded build runs in `worker_threads`, one face or tile
  range each.
- In the browser, rayon splits faces and rows.
- Keep the speedups' fixed order of `atan2` and `asin`, which come from the
  executing realm's `Math`, and their plain-arithmetic copy of V8 14.6's three-argument
  `hypot`.

**Done when** preparation's output is byte-identical and faster, and
photographs a visitor opens directly use the binary.

## Gate W12: compare again

Plan: [step 12](../webassembly.md#12-compare-again).

1. Rerun W0 at every view, motion and flight, against the baseline and Google
   Earth.
2. Rank what is still slower.
3. Propose the step that closes the largest gap, and ask before starting it.
4. Put the table in the harness's README and the plan's Status.

Repeat until the bar holds.

## Validation and completion

Run each command from its repository's root. One heavy job at a time.
`test:changed` takes the changed files, as in
`npm run test:changed -- src/app/appFiles.ts`.

| Repository | After a change | When a gate is ready |
| --- | --- | --- |
| app | `npm run typecheck`, `npm run test:changed -- <files>`, `npm run lint` | `npm run ci`; `npm run check:browser` with its pins (`docs/browser-testing.md`) |
| engine, ui, renderer | `npm test`, `npm run typecheck`, `npm run lint` | `npm run ci` |
| sky | The same, plus `npm run validate:model` and `npm run validate:render` | `npm run ci` |
| 0sfs/fly | `npm run typecheck`, `npm run test:changed -- <files>`, `npm run lint` | `npm run ci`; `npm run verify:jsbsim` |
| UMN-VR/tour | `npm run typecheck`, `npm run test:changed -- <files>`, `npm run lint` | `npm run ci` |
| JSBSim fork, `wasm/` | `npm test` | `npm run test:browser`; `npm run pack:build` |
| native | `node scripts/check.mjs` | The same, with a rebuild |
| foss-earth/docs, foss-earth/research | `npm run check:links` | `npm run ci` |
| 0sfs/research | Check edited Markdown links and formatting; no package scripts exist | The same |

At the handoff check, docs' `check:links` fails before scanning current links:
`link-routing.json` still records a link to
`eac-progressive-prototype/README.md#testing-by-hand` that is absent from
`docs/deploying.md`. This is an existing manifest inconsistency, not a new
program link. Record it separately and run `npm run test:source` plus a focused
path-and-anchor check on the edited documents. The stock checker does not
qualify Markdown anchors. Recheck the baseline rather than assuming it persists.

**Completion** means:

- the bar above holds, or each gap left is explained with the step that would
  close it;
- every gate's Status row is filled;
- W12's table is in the harness's README;
- no commit carries AI attribution.

The final handoff lists:

- the commits in each repository;
- the package versions, and the JSBSim fork number;
- the evidence paths;
- the decisions still waiting on the user.

Writing or reviewing this brief alone is documentation-only work: check links
and formatting; it does not require app tests or builds.
