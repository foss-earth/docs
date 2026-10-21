# Adaptive CPU scheduling continuation

Owner: this scheduling task, 20 October 2026. No subagents. Other performance
work owns R14 and the optimization sequence. Do not edit its reserved raster
runtime, mesh refinement, seam identity test, performance state/audit/backlog.

## Starting checkouts

- engine `1e3a0a3`, app `b9a12a2`, sky `e4a3dc3`, fly `dddb895`,
  tour `7488e2da5`, docs `046ac8a`.
- Engine/app/sky/renderer/fly/tour were clean at inspection. Docs has existing
  README, optimization-backlog, WebAssembly proposal edits and an untracked
  adaptive proposal; those are inputs and must not be staged here.

## Source audit

The proposal's pool-size and cancellation claims match current workerPool.ts:
existing idle workers dispatch before excess cleanup; abort settles the caller
but leaves its worker occupied. Worker factory refusal means unavailable and
can select a page fallback. Dedicated ground/sky/height/Google clocks currently
start at submission. Sky wakes all ready helpers; its coordinator counts as a
lane. Browser policy caps live Worker objects independently of execution.

Earth browser policy is also used by the tour and the legacy Babylon host used
by flight. Host-supplied worker capabilities can carry shared admission through
the reserved raster runtime without changing that file. The owner dispatchers
must acquire after their other resource grants, start execution clocks at actual
dispatch, and retain grants past caller cancellation.

## Current commits and ownership

- engine `d27076d`, `849638a`: fixed weighted admission, pool/dedicated dispatch ownership,
  observations and settings. This is based on the other owner's R14 commits
  `6058d4f` and `b2ddff9`; neither was changed or staged by this task.
- sky `18d68ea`: whole-team admission, generation width enforcement and queued
  generation cancellation. Rebuilt offline with existing tools; both WASM
  binaries are unchanged, and wrapper receipts were refreshed.
- renderer `89ec913`: Google queue/timeout/cancellation ownership.
- app `49f8866`: host injection, module preparation, settings and reports.
- fly `2d66a88`: execution-tab and Copy report integration. Tour consumes the
  shared app without a tour source change.

Engine imageryGeometry.ts, imagerySelector.ts, surfaceQuery.ts and
surfaceQuery.test.ts acquired unrelated uncommitted performance edits later in
this session. Leave them and all other owners' work alone. No push, deployment,
toolchain installation or browser capture occurred.

## Implemented behavior

Steps 1 and 2 are implemented as an opt-in fixed experiment:

- `native.compute=legacy` remains the default. `fixed` enables one host-owned
  service across raster decode, terrain geometry, imagery height caching,
  atlas decode/preparation, ground indexing, Google preparation and sky.
  This host policy serves Earth, the UMN tour and flight's legacy Babylon host.
- `native.computeLanes` is a separate pin, 1–32, initially 32 and effectively
  bounded by the existing `native.workers` lifetime/memory budget. Existing
  worker and backend settings retain their meaning. No chip constants or E-core
  ceiling; browser topology remains logical concurrency plus unknown E count.
- A positive capacity shortage queues and wakes on releases/limit changes.
  Running work drains after shrink. Work is distributed on completion. Whole
  teams use atomic grants with coordinator included, FIFO within urgency and
  event-driven aging; the optional height cache has lower host urgency.
  `native.computeAging` exposes the experimental 1000 ms fairness interval.
- Worker promises do not own execution grants: dispatched cancellation keeps
  its grant until reply or explicit owner retirement. Retired means a requested
  Worker termination action, **not** an exit acknowledgement or measured CPU
  cessation. Atlas native input/canvas holds still require their separate
  existing retirement proofs even after compute retirement.
- Module preparation happens before numeric admission, with its own
  `native.computeInitialization` allowance (experimental default 1). Cached
  module loads have bounded results; timed-out late cores are abandoned/disposed.
  Kernel startup fallback/parity remains with the numeric owner. Initial worker
  JavaScript loading and browser-owned compilation/bitmap decoding are not a
  page-wide physical CPU cap. This conservative envelope also includes time
  descheduled or awaiting a worker's platform bitmap operation.
- Ground, sky, height and Google execution clocks start at dispatch, after
  admission. Google serializes ready jobs at its existing single worker and
  retains cancelled in-flight ownership through its actual output; it does not
  confuse the kernel's early cancel acknowledgement with completion.
- Sky has a per-evaluation admitted width. A reserved, previously unused
  control word gates which helpers may claim rows; it does not resize memory,
  stacks or a live generation. Helpers still claim useful rows dynamically.
  Off/obsolete queued sky generations cancel without selecting page fallback.
- `native.computeObserve=false` stays the default. On, bounded component totals
  distinguish shared admission wait from admitted elapsed spans, queue age,
  useful/stale/failed replies and termination actions. Pool queue-to-dispatch
  time includes its own queue/preparation and is named separately. Counters
  describe dispatcher acceptance, not proof every result was displayed.
- Copy report and Component execution expose requested/effective allowance,
  live workers, admitted lanes and topology unknown state. A bounded report
  records actual scene renders, recent render elapsed spans, input event
  dispatch delays, terrain revision, raster-detail pending and sky jobs/busy.
  These are partial progress diagnostics: render elapsed is not a GPU timer or
  inter-frame/input-to-photon tail; revision/job counts are not full required
  content readiness. Collection currently begins after host construction.
  No observer/admission timer polls a settled page.

## Not implemented or qualified

Steps 3 and 4 remain at the evidence gate. There is **no adaptive mode or chosen
adaptive policy**. Do not describe this fixed foundation as a completed adaptive
controller. No fixed width has qualified end-to-end frame/input/content targets
or power savings, and observation overhead has not been measured. No change to
default concurrency, FPS, quality, simulation frequency, backend placement,
isolation or render-on-demand policy is justified by these tests.

The shared-memory parity run compared fixed 1/2/4/8-thread outputs, not an
energy/service candidate comparison. Its printed Node timings are unqualified
shared-machine observations and must not select a concurrency winner.

## Checks

- Engine typecheck, lint, build and public consumer passed. Focused admission,
  cancellation/disposal, worker, atlas, ground and height checks passed: 100
  tests in 10 files, plus a 24-test rerun including two added pressure/loss
  cases (the other cases overlap). Tests exercise shrink/drain, pressure without
  unavailability, stale replies, whole-team fairness, aging without timers,
  unknown topology and restoration to full allowed width.
- Full engine run: 1325 passed, 3 failed plus one worker-start timeout. Isolated
  rerun cleared the timeouts; one atlas revision assertion remains, below.
- Sky full suite (134 tests in 22 files), typecheck, lint, build, consumer/validation types, WASM receipts,
  exact single/shared parity and all 15 shared-memory adversarial tests passed.
  The new real-helper test runs 4→1→2→1→4 widths, preserves exact output, and
  proves helpers outside the admitted width compute no rows.
- Renderer full suite: 427 tests in 42 files passed; typecheck, lint, build and
  public consumers passed. Google tests cover admission wait outside execution
  timeout, retained cancelled ownership, stale bitmap closure and queue progress.
- App typecheck/lint, production build/startup-chunk checks and 12 browser harness
  assertion tests passed. Full unit run had 438 passes and two timeouts; both
  timed-out files passed isolated rerun (48 tests). Final focused policy/panel/
  worker-preparation run: 38 passed. No actual browser/Android run was performed.
- Tour `npm run ci` passed: lint, 74 tests (one skipped), height-data check,
  typechecks and production build. It emitted existing TypeScript sourcemap
  notices but exited successfully.
- Fly typecheck and lint passed. Related tests: 89 passed / 10 failed. To establish
  attribution, temporarily restored only this task's tracked Engine/app/fly
  changes to their pre-task HEADs, ran the flight app test file, and restored
  the owned bytes with concurrent-edit checks. All same 10 failures reproduced
  (49 passing in that file). Logs/backups remain under the respective ignored
  build/ directories. Do not claim a clean flight test suite.

## Integration handoff for the performance owner

`engine/tests/createRasterTilesRuntime.atlas.test.ts:212`, “changes imagery level
and source without touching terrain, elevation requests or the surface”, fails
after R14: `runtime.getRevision()` is 4, expected 2. It reproduces isolated after
`b2ddff9`. Its fixture supplies no worker factories, does not register native
execution parameters, and never invokes shared admission. The geometry-write
spy and elevation-request assertions immediately before it pass. Inspect R14's
revision/publication behavior on no-upload commits; do not weaken the identity
expectation merely to get a green run. This task left the reserved runtime,
refinement and tests untouched. No scheduler integration requires their release.

## Evidence and coordination

No timed browser captures or power runs started. Shared-machine policy read;
existing battery/flight scripts are not qualified energy evidence. Continue
untimed deterministic validation. Coordinate with the performance owner before
any hardware timing; separate checkouts do not remove interference.

## Next concrete step

1. Resolve the independent R14 revision assertion with its owner. Complete real
   required terrain/imagery/sky publication readiness and frame/input deadline
   attribution, including startup, before using these diagnostics as a controller
   feedback contract. Measure observation on/off overhead at the same fixed pin.
2. Prepare identical cached-input startup, burst, motion, 360 entry/exit, flight
   and settled cases for all three hosts. Keep selected FPS, quality, backend,
   route, completed work and readiness requirements equal. Start with current
   scheduling as control and a fixed range including full allowed width; a
   reliable E count may add a candidate but cannot remove wider candidates.
3. A candidate load can use `?set.native.compute=fixed&set.native.computeLanes=2`
   and optionally `&set.native.computeObserve=true`. Retain the existing
   `native.workers` value, shared-sky thread request and all quality/FPS settings.
   Change only the lane pin for other fixed arms. Full capacity is the effective
   existing worker allowance, not the device's E count.
4. Coordinate a bounded capture slot with the performance owner. Apply research's
   shared-machine attribution policy (including supported/missing signals),
   predeclare numeric service/readiness acceptance and noise rules, randomize
   paired fixed arms with recurring A/A controls, and retain every sample.
   Existing battery/flight scripts remain partial infrastructure, not automatic
   qualification. Include catch-up/settling energy and required useful content.
5. Only after fixed candidates support it, implement an explicit opt-in adaptive
   experiment with registered windows/range, bounded probes, hysteresis, manual
   pin, safe recovery and deterministic controller tests. Restore full allowed
   width for demonstrated ready CPU demand; GPU/network waits alone cannot
   justify growth. Missing readiness/tail/memory telemetry must prevent a
   confident reduction. No permanent polling when work settles.
