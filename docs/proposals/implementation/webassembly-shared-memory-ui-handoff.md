# Shared-memory threaded sky: contract and results for the UI agent

18 October 2026. This is the result of
[the shared-memory assignment](webassembly-shared-memory-handoff.md), written for
the agent finishing Component execution from
[its prompt](webassembly-ui-handoff.md). It covers what now runs, what the
settings, plan and report say about it, and how Component execution shows it
([What the UI shows](#what-the-ui-shows-19-october-2026)). The program is not
complete: isolation is built but not deployed.

## What runs

Only the **sky** has a shared build (`@foss-earth/native-sky/shared`). With
`native.core.sky=threaded` (or a global `native.tier=threaded`), the sky worker
becomes the coordinator of N cooperating threads over one fixed
`WebAssembly.Memory`:

- the memory is shared, 4 MiB, and never grows;
- the N−1 helpers are dedicated workers (`skySharedHelper.worker.ts`, named
  `earth-sky-helper-N`);
- each dome fan batch's rows are claimed dynamically, written to disjoint
  ranges, and assembled in row order.

The numbers are exact: f64, the same operation order and the realm's `Math`.
Every mode (one thread, several) is compared bit for bit against the TypeScript
reference on its first batch before it is trusted.

Helpers block in `Atomics.wait` in their own workers. The page never waits;
the coordinator waits only in bounded slices.

**Fallback ladder:** threaded → single-instance WASM → TypeScript worker. Each
step records its reason, with no reload and no loop. Without cross-origin
isolation the shared core does not start, no helper worker is created, and the
sky runs `single (worker)` with
`fallbackReason: "not-cross-origin-isolated"`.

Defaults are unchanged: global TypeScript, and `auto` is the TypeScript sky
worker. Nothing is threaded unless a URL or the settings ask for it, and only
then on an isolated page.

Other cores have no shared build. A threaded request for them reports
`threadedFallback: "no-shared-build"`, `sharedMemory: false` and `threads: 1`.
Their `actual` says what really ran. The raster and terrain worker pools are
**independent jobs**, not threads, and are never reported as threaded.

## Settings

| Setting | Values | Notes |
|---|---|---|
| `native.tier` / `native.core.sky` | adds `threaded`, labelled "Shared-memory threaded WASM (sky only)" | Legacy tiers and URLs keep working. Custom mode has no threaded path: `implementation=wasm` resolves to `single`. |
| `native.threads` (new) | 1–8, default `max(1, min(4, hardwareConcurrency − 1))` | Label "Shared-memory threads". Home native → selection, level `all`. `appliesLive: false`, so it needs Apply/reload like the other execution settings. It counts the coordinator, so 1 means no helpers. |
| `native.workers` | unchanged meaning: one total worker budget | A threaded sky's helpers come from it. They are reserved (threads − 1) **only** on an isolated page; otherwise the slots stay with decoding. |
| `native.sharedHeights` (new, app `terrainNativeWorkerConfig.ts`) | boolean, default off | Label "Terrain heights in shared memory". Home native → cores, level `all`; registered by the app, so only its hosts draw it. Decode workers publish each elevation tile once in a `SharedArrayBuffer`, and the policy asks for it only when Terrain geometry runs in workers. `appliesLive: false`. |

## Plan (`nativeCorePlan`, engine `settings/catalogue/native.ts`)

These are the existing fields, plus:

- `threads: number`: cooperating threads asked for, including the coordinator.
  It is 1 unless `sharedMemory`.
- `sharedMemory: boolean`: a threaded request for a core with a shared build.
- `threadedFallback: "no-shared-build" | null`: known before startup.

## Report (`NativeCoreReport`, app `nativeReport.ts`; the Copy report line "Component execution: [...]")

These are the plan's fields, plus:

- `actual`: what ran, from the core's own status. For the sky it is one of:
  - `threaded (worker)`
  - `single (worker)`
  - `typescript (worker)`
  - `typescript (page)`
  - `not started`
  - `starting`
- `state`: `checking`, `ready`, `fallback`, `retired` or `idle`.
- `fallbackReason`: why a rung was left. Reasons include:
  - `not-cross-origin-isolated`
  - `shared-array-buffer-unavailable`
  - `atomics-wait-unavailable`
  - `shared-memory-unavailable`
  - `threaded-startup-failed`
  - `shared-core-retired: <reason>`, where the reason is one of `helper-timeout`, `helper-leave-timeout`, `helper-trapped`, `coordinator-trapped`, `rows-incomplete` or `stack-canary`
  - `fan-rows-*`
  - `fan-parity-mismatch`
  - `table-parity-mismatch`
  - `startup-timeout`
  - `worker-*`
- `parity`: for the sky, `{ tables, radiance, irradiance, fan, fanRows: { solo, parallel } }`. Each is `same`, `unchecked` or a mismatch. `fan` is the single core's fan path; `fanRows` is the batched path the threaded core uses.
- `shared: NativeSharedReport | null`: the shared core as it ran, null when none started. It has:
  - `actual`: `threaded` or `retired`, with `retiredReason`;
  - `crossOriginIsolated`;
  - `memoryBytes` and `memoryGrows: false`;
  - `threads`: `{ requested, limit, connected, ready, helpers: [{ thread, state, reason }] }`. **Show `ready` of `requested`**: fewer may start if the worker budget or the browser refuses;
  - `batches`: `{ total, parallel, solo, rows, directions, rowsByThread, waitMs, maxWaitMs }`;
  - `copies`: `{ inBytes, outBytes }`;
  - `lastBatch`.
- `detail` (sky): `worker`, `jobs`, `startupMs`, `nativeCalls`, `fanRows`, `lastJob`, `totals`, `meanRoundTripMs` and `meanWorkMs`.

The sky worker's name is JSON, e.g.
`{"kind":"earth-sky","kernel":"threaded","threads":4}`. That is what was asked
for, not what ran. Use the report for status.

## What the UI shows (19 October 2026)

In `app/src/app/nativePanel.ts`, under Components → Sky. Sky is the only
component with a shared build, so no other component shows these controls.
Terrain heights has its own Shared memory switch, for the decoded tiles
rather than threads; see the end of this list. A global switch at the top of
the tab turns both on at once; see the first item.

- **Global Shared memory [Off|On] ?** (`global.shared`) comes right after
  Parallelism, outside every component, so it shows without opening one, on
  every page. On turns on each use: the sky's shared-memory build and Terrain
  heights' shared tiles. Off turns both off. Each component's switch still
  changes one use. While only some are on, the status reads "Partly on". It is
  pending, applied and discarded like the others. On a page that can't share
  memory it is grayed out with the same status, title and help as the
  components' switches (below). It stays enabled while the URL already asks for
  a shared use, so that can be turned off.
- **Sky → Shared memory [Off|On] ?** comes right after the sky's Implementation
  (after Mode while Mode is Global). It is the shared two-position slider.
  On sets `native.core.sky=threaded`. Off restores the sky's earlier choice,
  or single WASM if that choice was itself threaded.
- **Shared-memory threads** (`native.threads`, the standard count control)
  shows beside it only while Shared memory is on. Global's Show all
  parameters still lists it.
- **On a page that isn't cross-origin isolated** the slider is disabled. It
  shows the status "Not isolated" and the title "Shared memory needs a
  cross-origin isolated page." Its help gives `__fossEarthIsolation`'s reason,
  or in development says the server's headers decide
  (`FOSS_EARTH_ISOLATION=enforce`). If the URL already asks for threaded, the
  slider stays On and enabled, so it can be turned off. After reload then
  reads "WebAssembly, 1 thread (page not cross-origin isolated)".
- **On a page that isn't secure** (http from a network address, such as a
  phone's `http://192.168.0.103:5374/`), the browser isolates nothing, so every
  shared-memory switch reads "Not secure" instead, with the title "Shared
  memory needs a secure (HTTPS) page." Its help names the page's address and
  says how to fix it: open it over HTTPS. A development server started with
  `--host` serves HTTPS ([Isolation and deployment](#isolation-and-deployment)).
  `__fossEarthIsolation` is `unavailable` with the reason "Only a secure page
  (HTTPS or localhost) can be isolated, and this one is not: open it over
  HTTPS."
- **The title** comes from `shared.threads`: "Sky: WASM (4 shared threads)",
  or "WASM (3 of 4 shared threads)" when fewer are ready. A fallback line is
  short:
  - "Fallback: page not cross-origin isolated";
  - "shared threads did not start";
  - "no shared-memory build";
  - "shared threads stopped (helper timeout)".

  Help keeps the raw reason ID.
- **Help (?)** adds, for example:
  - "Shared memory: 4 MiB, fixed · 4 of 4 threads ready (4 connected, limit 4)";
  - "3 batches (3 parallel, 0 solo) · rows by thread 40/27/29/30";
  - "coordinator waited 0 ms (max 0 ms)";
  - nested parity, "fanRows (solo unchecked, parallel same)".
- **After reload** names the plan: "Shared-memory WASM, 4 threads", or
  "TypeScript (no shared-memory build)" for another core asked for threaded.
- **Pending.** A change to Shared memory or threads alone is pending in the
  panel's one Changes pending box. Apply & reload carries it into the URL, and
  Discard restores it. Host sections get the panel's Apply through
  `section(…, { reload })`, and their own pending box is hidden. Before this
  change, their box repeated the panel's and reloaded without the edits.
- **Terrain heights → Shared memory [Off|On] ?** (`native.sharedHeights`)
  follows Terrain heights' manual choices and shows in every mode. It uses
  the same slider, pending mark, Apply & reload and Discard.
  - The status "Needs geometry workers" shows while Terrain geometry would
    run on the page after reload, where a transfer already costs nothing.
  - "Not isolated" and the disabled slider behave as the sky's do.
  - Help says how many tiles arrived "in shared memory".

Unit tests: `app/src/app/nativePanel.test.ts`, 21 tests. They cover:

- placement and the single instance;
- the global switch: all on, "Partly on", and its reload URL;
- the disabled state, its title and its help, isolated or not, secure or not;
- the threads control showing and hiding;
- pending and Discard;
- the host section's reload;
- the status and fallback text.

### Checked (Chrome, headless, 19 October 2026)

| App | Result | Evidence (`app/build/sw-isolation/runs/`) |
|---|---|---|
| Earth, isolated dev `:5174` | "TS (main)" → On, Apply → "WASM (4 shared threads)" → threads 2, Apply → "WASM (2 shared threads)" → Off, Apply → "TS (main)". One pending box at each step, no overflow, at 1280 and 390 px, light and dark. 0 exceptions, 0 blocked loads. | `execution-3` |
| Tour, isolated dev `:5176` | The same sequence. Help: 4 of 4 ready, rows by thread 40/27/29/30, parity same. 0 exceptions, 0 blocked loads. | `tour-1` |
| Fly, not isolated, dev `:5175` | "Sky: WASM (1 worker) · fallback", "Fallback: page not cross-origin isolated". The URL's request leaves the slider On and enabled, with "Not isolated". Off disables it with its title. One pending box. The row is one line, 36 px, at 1280 and 390 px. | `fly-2`, `fly-4`, `fly-5-phone` |
| Renderer, Earth | One choice group, one selected, radios focusable (not `display:none`), no overflow, at 1280 and 390 px. | `renderer-1`, `renderer-2-phone` |
| Tour from a network address, isolated dev `https://192.168.0.103:5374` | Past the certificate warning (Advanced, then Proceed): secure, cross-origin isolated, `SharedArrayBuffer`, a WebGPU adapter. Global Shared memory shows before any component is opened, after Parallelism; it and both components' switches are enabled, and its help says the page is cross-origin isolated. | `app/build/https-dev/runs/2026-10-19T22-34-14-425Z` |

These checks are functional. They make no speed claim (see
[Results](#results-chrome-155-macos-10-hardware-threads)). Since 19 October
2026 the defaults are WebAssembly in worker pools with both uses of shared
memory on (`native.sharedSky` and `native.sharedHeights`; see the
[native state](webassembly-native-state.md#defaults-webassembly-in-worker-pools-with-shared-memory-19-october-2026)).
Where the page can't share memory, the switches show that default as Off,
grayed, and only a request from the URL or a saved choice as On.

### Commands

From `app/`:

```sh
FOSS_EARTH_ISOLATION=enforce FOSS_EARTH_COEP=require-corp npm run dev -- --port 5174 --strictPort
# http://localhost:5174/app/?set.native.threads=4, then Components → Sky → Shared memory
npx vitest run --configLoader native src/app/nativePanel.test.ts src/app/nativeReport.test.ts
node build/sw-isolation/execution-check.mjs <run> [base URL] [--phone-only]   # QUERY= sets the query
node build/sw-isolation/probe.mjs <run> <url> <expression>…                   # WIDTH, HEIGHT, SETTLE
```

The other apps' servers, which `execution-check.mjs` doesn't start:

- tour: in `~/gh/UMN-VR/tour`, the same dev command on `--port 5176`. Check
  with `QUERY='panoramaTest=1&set.native.threads=4'` and base
  `http://localhost:5176/tour/minneapolis/`.
- fly: in `~/gh/0sfs/fly`, `npm run dev -- --port 5175 --strictPort`
  (not isolated). Open
  `http://localhost:5175/fly/?set.native.core.sky=threaded&set.native.threads=4`.

### Remaining TODOs

- **Deploy** (needs approval), then check the published apps, including
  Safari on the iPhone.
- **The shared factories' own tests**: container structure, one selected
  segment, keyboard access, narrow wrapping and contrast. These belong to
  the [compact-controls audit](ui-compact-controls-handoff.md), which owns
  `ui/src/shell`.
- **Shorter Apply URLs.** Apply & reload writes every Component execution
  value into the URL (`componentExecutionReloadUrl`). That carries edits even
  when storage is unavailable, but the URLs get long. Writing only the values
  that differ from the defaults would shorten them.
- **Fly's game log.** At 1280 × 800, the game log's Delete all button (ui
  `createGameLog.ts`) floats over the bottom line of fly's panel. It is not
  part of this panel.

## Isolation and deployment

Dev and preview servers: the Vite plugin `crossOriginIsolation()` (in
`app/vite/crossOriginIsolation.ts`, exported from `foss-earth/vite`) is wired
into the app, tour and fly configs. It is off unless asked:

- `FOSS_EARTH_ISOLATION=off|report-only|enforce`;
- `FOSS_EARTH_COEP=credentialless` (the default) or `require-corp`.

With `enforce` plus `credentialless`, all three apps load their map, terrain
and imagery with no blocked requests.

**A phone needs HTTPS.** A browser treats `http://localhost` as a secure page
but not `http://192.168.0.103`. A page from a network address is therefore never
isolated, whatever headers it gets, and it has no WebGPU. The Vite plugin
`networkHttps()` (`app/vite/networkHttps.ts`, exported from `foss-earth/vite`)
is wired into the same three configs. With it, a dev or preview server started
with `--host` serves HTTPS with a self-signed certificate:

- The system's openssl makes the certificate. It names localhost, this
  machine's name and its network addresses.
- It is kept in `node_modules/.cache/foss-earth-dev-https/` and lasts 90 days.
  It is replaced a week before it expires, or when an address is new. A new one
  keeps the old addresses.
- The browser warns once per address. Past the warning (Chrome: Advanced, then
  Proceed) the page is secure, so `FOSS_EARTH_ISOLATION=enforce` isolates it.
- A server only on this machine stays http, and a config's own `https` wins.
- `FOSS_EARTH_DEV_HTTPS=off` keeps http. Without openssl the server warns and
  stays on http.

Dev servers register no service worker, so Chrome's refusal of workers on a
page with a certificate error doesn't matter here.

**Built pages are isolated by the app's service worker** (plan
[step 3](../webassembly.md#3-isolation-from-the-service-worker), built
18 October 2026, **not deployed**). GitHub Pages cannot send headers, so the
worker adds COOP `same-origin`, COEP `require-corp` and CORP `cross-origin` to
the page and the app's workers, and the page's first script reloads a first
visit once so the worker answers it. How it works:
[ui's app-files.md](https://github.com/foss-earth/ui/blob/main/docs/app-files.md#cross-origin-isolation).
A build enforces unless `FOSS_EARTH_ISOLATION=report-only` or `off` is set
when it is built. Builds of Earth, the tour and fly, served as Pages serves
them, were checked in Chrome 155, Firefox 158 and Safari 27 on 18 October
2026; the results are in step 3's
[Checked](../webassembly.md#3-isolation-from-the-service-worker).

For the UI:

- **The setting** is Settings → App files → Cross-origin isolation
  (`app.isolation`, on by default). It takes effect at the next load: off
  reloads once to end the isolation.
- **Whether threads are possible** is the page's `crossOriginIsolated`, not
  the build or the setting. `window.__fossEarthIsolation` holds the page's
  state (`isolated`, `pending`, `unavailable`, `off` or `report-only`) and
  reason; `describeIsolation(window)` from `@foss-earth/ui/browser` is the
  Copy report's `Isolation:` line.
- **Unisolated pages still start.** Inside another site's frame, without
  service workers, or after a reload that did not isolate, the page starts at
  once and a threaded request falls back to single WASM with
  `not-cross-origin-isolated`, as before.
- The worker files (`ui/vite/appFilesWorker.js`, `app/vite/appFiles.ts`,
  `app/vite/crossOriginIsolation.ts`) and the worker's registration are not
  the UI's to change.

## Results (Chrome 155, macOS, 10 hardware threads)

Every result below matched bit for bit before it was timed. There is no power
measurement and no watts claim.

### Kernel in a browser worker, same 125 requests

Evidence: `app/build/shared-memory/browser-parity-1/result.json`. The isolated
page gave every arm the same SHA-256 (`ba265bd3…`). Warm 96×64×48 dome:

| Arm | p50 ms | p95 ms |
|---|---|---|
| TS | 17.0 | 42.4 |
| single | 12.1 | 29.9 |
| threaded 1 | 11.9 | 29.3 |
| threaded 2 | 6.3 | 19.2 |
| threaded 4 | 3.9 | 19.8 |
| threaded 8 | 3.0 | 18.7 |
| threaded 4 (A/A) | 3.9 | 19.7 |

### Integrated Earth A/B

Evidence: `app/build/shared-memory/ab-2026-10-18/ab-summary.md`. 9 arms with
A/A pairs, `C-webgpu`, `sourceUnchanged`, 1202 sky computations in each window.

- **Sky worker:** threads cut its work per job from about 3.0 ms (single) to
  1.7–1.8 ms (4 threads) and 1.64 ms (8 threads).
- **Round trip:** it improves only 0.2–0.4 ms (3.4–3.7 ms in every arm).
- **Page:** there is **no page or frame gain**. Page task and frame callbacks
  stay within the A/A spread. TS-worker arms showed the lowest page task, which
  is observed, not qualified.
- **Total sky CPU:** it rises, from 4.2–4.6 s (TS and single) to 4.4–4.7 s
  (4 threads) and 5.1 s (8 threads).

The helpers spend most of their life blocked in `Atomics.wait`, which the
profiles separate from their WASM work.

### Apps

Isolated dev servers with
`set.native.tier=typescript&set.native.core.sky=threaded&set.native.threads=4&set.native.workers=10&set.map.loader.decodeWorkers=2`.

| App | Result | Evidence |
|---|---|---|
| Tour (Minneapolis) | `threaded (worker)` ready, 4/4 threads. A clock sweep gave 304 jobs and 346 parallel batches, with every fanRows/table/radiance/irradiance parity `same`. 0 exceptions, 0 blocked loads. | `app/build/shared-memory/apps-check-2/tour/result.json` |
| Fly | `threaded (worker)` ready, 4/4 threads, 6 parallel batches, parity `same`. Flying at about 59 fps on WebGPU. 0 exceptions, 0 blocked loads. | `app/build/shared-memory/apps-check-6/fly/result.json` |
| Earth, not isolated | `single (worker)`, `fallbackReason: "not-cross-origin-isolated"`, `shared: null`, no helper workers, parity `same`. | `app/build/shared-memory/fallback-not-isolated/` |

Fly's `foss-earth/runtime` exports are unchanged.

## Commands

From `app/`:

```sh
FOSS_EARTH_ISOLATION=enforce npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# http://127.0.0.1:5173/app/?set.native.tier=typescript&set.native.core.sky=threaded&set.native.threads=4&set.native.workers=10&set.map.loader.decodeWorkers=2

node build/shared-memory/browser-parity.mjs                 # kernel parity and timing, browser worker
# A/B arms 1-9 (or one arm prefix); a used --out is refused, to keep its evidence
node build/shared-memory/run-ab.mjs --out=build/shared-memory/ab-NEW && node build/shared-memory/summarize-ab.mjs build/shared-memory/ab-NEW
node build/shared-memory/apps-check.mjs --out=build/shared-memory/apps-check-N [tour|fly]   # both without a name
```

The tour and fly checks start each app's own dev server with
`FOSS_EARTH_ISOLATION=enforce`:

- tour: `~/gh/UMN-VR/tour`, `/tour/minneapolis/?panoramaTest=1&…`;
- fly: `~/gh/0sfs/fly`, `/?…` (served as `/fly/?…`).

All of these scripts are gitignored scratch and run from `app/`. Each closes its
browser and server in `finally`. After a killed run, use
`browser-testing/scripts/chrome-clones.sh --clean`.

From `native/`:

```sh
npm run build:sky-shared
npm run check:sky-shared
npm test
```
