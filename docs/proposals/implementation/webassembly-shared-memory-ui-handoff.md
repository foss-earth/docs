# Shared-memory threaded sky: contract and results for the UI agent

18 October 2026. This is the result of
[the shared-memory assignment](webassembly-shared-memory-handoff.md), written for
the agent finishing Component execution from
[its prompt](webassembly-ui-handoff.md). It covers what now runs, what the
settings, plan and report say about it, and what the UI does not show yet. The
program is not complete: deployment isolation and the UI work below remain.

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

## What the UI must still do (not done by this work)

- **Expose `native.threads`.** It belongs beside the sky's implementation, and
  only matters for a threaded sky request. Its own help can say it is unused
  otherwise.
- **Show the shared status.** Show `shared.threads.ready`/`requested`, whether
  memory is shared, and the fallback reason (for example "Not cross-origin
  isolated: running single WASM"). Keep it terse; put detail behind the `?`
  help.
- **Don't offer threaded as working where it can't run.** Mark it unavailable
  for cores with `threadedFallback`, and unavailable on a page where
  `crossOriginIsolated` is false. Today both still run, and report the fallback
  truthfully.
- Files left untouched for the UI agent: `ui/src/shell/choiceGroup.ts`,
  `ui/src/styles/ui.css`, `app/src/app/nativePanel.ts`, `nativePanel.css`.

## Isolation and deployment

Dev and preview servers: the Vite plugin `crossOriginIsolation()` (in
`app/vite/crossOriginIsolation.ts`, exported from `foss-earth/vite`) is wired
into the app, tour and fly configs. It is off unless asked:

- `FOSS_EARTH_ISOLATION=off|report-only|enforce`;
- `FOSS_EARTH_COEP=credentialless` (the default) or `require-corp`.

With `enforce` plus `credentialless`, all three apps load their map, terrain
and imagery with no blocked requests.

**Built pages are isolated by the app's service worker** (plan
[step 3](../webassembly.md#3-isolation-from-the-service-worker), built
18 October 2026, **not deployed**). GitHub Pages cannot send headers, so the
worker adds COOP `same-origin`, COEP `require-corp` and CORP `cross-origin` to
the page and the app's workers, and the page's first script reloads a first
visit once so the worker answers it. How it works:
[ui's app-files.md](https://github.com/foss-earth/ui/blob/main/docs/app-files.md#cross-origin-isolation).
A build enforces unless `FOSS_EARTH_ISOLATION=report-only` or `off` is set
when it is built.

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
