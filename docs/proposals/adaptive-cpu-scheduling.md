# Adaptive CPU scheduling for energy efficiency

Status: proposed, 20 October 2026. No runtime changes or energy savings have
been established by this review. Applies to FOSS Earth, the UMN tour and 0SFS.

## Objective

Meet the host's selected frame rate, input and simulation deadlines, visual
quality and content-readiness targets with the lowest measured energy use.
Efficiency cores are useful capacity when present, but an E-only policy or an
E-count concurrency ceiling can make a slower device unusable. The controller
must be able to use the full allowed CPU concurrency when that improves useful
progress. Other limits, including memory and the user's explicit limits, remain
in force.

Core count is a capacity hint. Runtime frame and queue measurements guide
adaptation; they do not measure energy or establish which physical cores ran.
Lower concurrency is a candidate to test, not proof of lower power. Completing
work in parallel and then idling may also save energy.

This work complements the current speed optimizations. It must preserve their
output, the host's quality choices, backend fallbacks, physics and render on
demand. Lowering resolution, LOD, simulation frequency or the selected FPS is a
separate, visible user choice, not a scheduling-controller action.

## What exists and what is missing

Reviewed against the local sources on 20 October; other agents are changing
these repositories. The [current core guide](../webassembly-cores.md) describes
implemented execution settings; [WebAssembly builds](webassembly.md) also
contains historical targets.

| Area | Current state | Consequence |
| --- | --- | --- |
| Device discovery | `ui/src/browser/deviceContext.ts` reads logical concurrency, approximate memory, display scale and touch. There is no CPU-model or E-count field. | Chip discovery cannot be assumed. |
| Worker lifetime | `app/src/app/browserPolicy.ts` shares a limit on live Worker objects and reserves component slots. | This limits memory/lifetime, not simultaneous computation. Reducing it can move terrain decoding back onto the page. |
| Job distribution | `engine/src/browser/workerPool.ts` sends the next job to an idle worker. Sky helpers independently claim rows. | Keep dynamic dispatch within work groups; add shared compute admission across groups. |
| Resizing | The pool's size limits spawning; already-created idle workers may still receive jobs before excess-worker cleanup. Factory refusal can mark the pool unavailable. | Neither the size callback nor a null worker factory is a live compute throttle. |
| Cancellation | A caller can be rejected while its dispatched worker is still computing. | Caller settlement cannot release the compute allowance. |
| Shared sky | `sky/sky-WASM/sharedCore.js` wakes its ready helpers for a generation. The thread count includes the coordinator. | All participating execution lanes need admission before dispatch. |
| Frame lifecycle | The renderer already owns frame/work scheduling and pauses presentation when hidden. A presentation cap can still permit preparation between draws. | Reuse that lifecycle; do not add a permanent tuning timer or a second render loop. |
| Existing budgets | `createGlobeRuntimeBudgets` provides timeouts and other settings. The image broker has operation limiters. Neither is a page-wide numeric-compute governor. | Follow the existing admission pattern and inject one shared CPU admission service from the host. |
| Measurement | Frame streams and scripted interaction/flight harnesses exist. Workers are not all attributed. The battery harness measures machine discharge, not CPU/GPU power separately, and flight qualification remains false. | Complete attribution and qualification before claiming an energy win. |

Relevant source entry points:
[browser policy](https://github.com/foss-earth/app/blob/main/src/app/browserPolicy.ts),
[worker pool](https://github.com/foss-earth/engine/blob/main/src/browser/workerPool.ts),
[host composition](https://github.com/foss-earth/app/blob/main/src/app/runtimeComposition.ts),
[image operation limiter](https://github.com/foss-earth/images/blob/main/src/session.ts),
[shared sky](https://github.com/foss-earth/sky/blob/main/sky-WASM/sharedCore.js).

## Hardware information is optional

Keep topology observations separate from policy: reported logical concurrency,
optional core classes/counts, their source, and whether identification is
reported, inferred or unknown. Unknown E count is not zero E cores.

The [HTML worker API](https://html.spec.whatwg.org/multipage/workers.html#navigatorconcurrenthardware)
reports logical processor availability without core types, and permits reduced
counts. GPU descriptions and architecture hints do not reliably identify CPU
topology. An exact, unambiguous chip/SKU lookup may supply a documented hint;
ambiguous names must stay unknown. Do not require a chip database, fingerprint
the CPU with timing probes, or infer E counts from a guessed performance ratio.

An existing native host could inject topology using APIs such as Apple's
[performance-level queries](https://developer.apple.com/documentation/kernel/1387446-sysctlbyname/determining_system_capabilities).
A native helper is not a prerequisite for the browser implementation. Native
QoS can influence placement; browser task priority and worker count provide
no guarantee of E/P/S placement. A known E count can seed a qualified candidate,
never the maximum. Homogeneous CPUs and unknown devices use the same controller.

## Separate worker lifetime from compute admission

The host creates one admission service per runtime and injects a small port into
component dispatchers. Existing component pools and WASM memories retain their
owners. A pure implementation can live under `engine/src/browser/`; structural
ports keep sky and renderer from acquiring a new dependency on engine. This is
not cross-tab or machine-wide coordination: the OS still schedules all apps.

Keep separate limits for live workers/memory, active compute lanes, queued
bytes/jobs, network requests and GPU uploads. An idle worker costs memory but
does not consume a compute allowance. Admit ready numeric work after required
I/O and before dispatch; bound initialization and copies separately rather
than allowing a startup stampede. A dispatched task's allowance conservatively
covers its execution interval, including unobservable descheduling.
Do not hold CPU grants while queuing for network, memory or GPU capacity; define
resource ordering with existing image/decode limiters before adding nested
admission. Report which preparation paths participate. Browser-owned image
decoding, compilation, compositing and other apps remain outside this service's
control, so its allowance is not a limit on total machine CPU use.

Admission must have these semantics:

- Temporary capacity pressure queues a cancellable request and arranges a wake
  on a grant or release. It never reports an unsupported worker, fails parity,
  or invokes a main-thread fallback. Genuine capability failures keep the
  existing explicit fallback and diagnostics.
- Distinguish queued, dispatched, executing/completing and retired work. Release
  exactly once after a worker reply or an explicit completion acknowledgement.
  Browser `Worker.terminate()` has no exit acknowledgement: record the owned
  termination/retirement action separately, and quarantine abandoned shared
  generations instead of reusing their state. The allowance bounds admitted
  work, not instantaneous physical CPU activity. Cancelling a queued request
  removes it; rejecting a caller after dispatch does not release its grant.
- Measure admission wait separately. Existing execution timeout clocks start
  after dispatch; a separate end-to-end deadline can include admission wait.
  Otherwise waiting intentionally would falsely retire sky or Google workers.
- Reducing the allowance stops new dispatch until running work drains; it
  neither kills workers nor preempts a synchronous kernel. Dispose, failure and
  source/view epochs cancel obsolete demand and settle every queued request.
- Shared-memory teams acquire their whole participating allowance before a
  generation is published. Include the coordinator and helpers; never hold a
  coordinator grant while waiting for helpers to acquire more. A smaller team
  or serial implementation must be a supported, parity-checked path. Never
  resize a live WASM generation or shared memory underneath its readers.
- Use urgency, bounded aging and host reservations so required coverage and
  ground preparation progress while optional refinement waits. Avoid starvation
  of larger teams; do not hold incomplete grants. Keep the page nonblocking.

Distribute independent bounded jobs by completion, not an equal number of tiles
per worker. Balance useful execution and queue age; a worker may migrate among
physical cores. Splitting jobs must preserve reference results, reduction order
where significant, publication generations and transfer ownership. Choose job
sizes from measured cancellation latency and dispatch overhead, not one task
per tiny calculation.

## Adapt to demand with bounded probes

The host supplies the selected FPS, deadline/headroom policy and content-progress
requirements. Track actual completed scene renders separately from RAF callbacks
and cap-skipped preparation. Physics and audio have independent deadlines; frame
rate is not proof those deadlines were met. Do not gate their critical loops on
an asynchronous preparation allowance.

Collect per-component runnable queue length/bytes, oldest required-job age,
admission wait, completed useful/stale jobs, execution elapsed time, participating
lanes and fallback state. Supply frame/input tail latency, CPU/GPU frame sections,
required-view readiness, and memory/admission pressure where observed. Worker
wall duration is not thread CPU time; compare durations in their own clock domain
or explicitly align clocks. Missing GPU, thermal or topology data stays missing.

Start the experiment at the existing throughput policy. First qualify fixed
concurrency candidates; then try an adaptive policy behind an explicit setting.
Do not slow cold startup merely to learn that a weak device needs more workers.
An observed CPU burst may restore a previously qualified wider allowance
immediately; new candidates use bounded probes and a measured fallback.

| Observation | Proposed response |
| --- | --- |
| Stable frame/input headroom and required preparation finishes within its bound | Probe a smaller allowance; keep it only if responsiveness and content progress remain acceptable. |
| Old required work waits, ready CPU jobs are queued and compute allowance is saturated | Probe a larger allowance, up to the full allowed range. Keep growth only when useful completion/readiness improves without unacceptable contention. |
| FPS drops while GPU or network waits dominate, or no parallel CPU-ready work exists | Do not blindly add workers. Hold or undo the probe; report the observed limiting stage, or unknown cause. |
| A wider probe worsens main-thread tails, memory pressure or progress | Restore the qualified allowance; defer optional work within explicit readiness limits. |
| Even full useful concurrency cannot meet the selected targets | Report unmet targets and the observed bottleneck. Preserve required work and quality; offer existing user-controlled quality/FPS choices separately. |
| Work finishes or the page settles | Drain and sleep. Reconsider on real demand, not a recurring measurement wakeup. |

Use separate promotion/demotion conditions, minimum observation windows, dwell
time and cooldown to prevent oscillation. A fixed selected frame cap is a valid
comparison condition; cap-limited FPS is not evidence of CPU pressure. Exclude
cap changes, browser throttling, startup compilation and changing view demand
from steady comparisons.
Bound trials and reset stale history on material backend/workload changes.
Evaluate on existing host work callbacks and completion signals. Any delayed
wake must have a specific pending-work reason and be cancelled when it disappears.

No browser signal here identifies the minimum-energy allowance. Runtime feedback
enforces service targets using a heuristic qualified by offline power trials.
Record why it changes direction; do not call frame-time feedback a watt meter.

## Settings and reporting

Follow the [settings contract](settings.md): automatic behavior has a visible
allowed range and can be pinned. Keep `wasm.workers` as its existing worker
lifetime limit; add a separately named active-compute allowance. Do not silently
reinterpret saved values. Controller windows, headroom, queue-age limits,
cooldowns and probe bounds are registered parameters with units and provenance;
their defaults require experiments rather than chip-specific constants.

Use the existing Component execution tab. Show requested range, current allowance,
live workers, admitted lanes, topology source/unknown state and adjustment reason.
Put supplementary explanation behind the existing compact help pattern. Preserve
the requested/actual backend, parity and fallback report. A Manual pin overrides
adaptation within real resource limits; expose any limit that prevents it.

## Implementation order and ownership

1. **Attribute current work** (research, app, engine, sky, renderer): instrument
   admission wait, useful completions, worker elapsed spans, readiness and actual
   frame closure with measuring disabled by default. Check observation overhead.
2. **Add fixed shared admission** (engine with host composition in app): integrate
   every numeric dispatcher, cancellation, timeouts and shared-sky teams. Retain
   current worker-object guards and test fixed allowances first. In 0SFS, wire
   the same service through its host composition while keeping simulation and
   audio ownership unchanged; the tour uses the app composition.
3. **Qualify fixed candidates** (research): compare the current policy, a small
   range of allowances, and single/multi-lane team variants at identical quality.
   Include sufficient width to use all useful reported CPU capacity, within
   explicit memory/user limits. E count is one optional candidate, not a cap.
4. **Implement and qualify adaptation** (engine/app, then the three hosts): use
   deterministic fake-clock/controller tests and paired end-to-end trials. Keep
   it opt-in until the required device/workload matrix passes. Native topology
   injection is an optional follow-up, not a gate.

Acceptance tests cover temporary refusal without page fallback, cancellation
after dispatch, permit leaks, resize/drain, pool reuse after a lower allowance,
worker loss, team admission without deadlock, fair progress, epoch replacement,
unknown/no-E topology, genuine worker fallback and completely settled idle.
Controller scenarios include a weak device needing the full range, bursts after
idle, GPU/network-bound misses, memory refusal, missing telemetry, manual pins
and bounded recovery from a harmful probe. Preserve existing parity and output
checks. App changes also require the consuming 0SFS typecheck.

## Evidence and acceptance

Use [performance measurement](../performance.md), the
[optimization backlog](../optimization-backlog.md#measurement-first), and research's
[shared-machine policy](https://github.com/foss-earth/research/blob/main/docs/validation/benchmark-interference.md).
That policy distinguishes useful functional work from qualified timing and power
claims; merely linking it does not qualify a harness.

The [shared-sky comparison](implementation/webassembly-shared-memory-ui-handoff.md#integrated-earth-ab)
already illustrates why wider execution needs an end-to-end check: four to
eight threads improved sky worker time only slightly, showed no page/frame gain
in those trials, and increased reported total sky CPU. That result establishes
neither a universal thread count nor a power saving.

The existing
[battery sampler](https://github.com/foss-earth/research/blob/main/scripts/benchmarks/power/battery.mjs)
integrates machine battery discharge. The
[flight wrapper](https://github.com/foss-earth/research/blob/main/scripts/benchmarks/power/flight.mjs)
aligns it to route time but explicitly retains `qualified: false` while route
coverage is unverified. Complete that qualification and interference accounting;
do not rename machine-discharge watts as CPU/package watts. CPU/GPU breakdown
and physical-core residency require their own supported telemetry.

Predeclare targets, acceptable regressions and noise criteria. Compare identical
cached-input idle, startup, burst, steady-motion and settled intervals for globe,
360 entry/exit and flight. Keep quality, route, completed useful work, settings
and target FPS equal. Randomize paired short blocks with recurring A/A controls
for responsiveness; additionally use matched sustained blocks long enough for
the power instrument and thermal drift, with recorded order and state. Retain
all samples, exclusions, accepted pair counts and uncertainty. Include controller
and measurement overhead and catch-up/settling energy after the interaction.

Record total interval joules, observed average watts, actual scene-frame counts,
frame/input tails and deadline misses, required-view readiness, queue age,
completed useful/stale jobs, main/worker activity and memory pressure. Joules per
actual frame is supplementary: idle needs watts/wakeups, and delayed or omitted
content must not masquerade as efficiency. Machine temperature, thermal pressure,
frequency and core residency are useful where available; temperature alone does
not establish energy use or attribution. Missing data limits the claim.

Test low-end and homogeneous CPUs as well as heterogeneous ones, unknown topology,
supported Chrome/Firefox/Safari paths, isolation on/off, relevant render backends,
battery/adapter modes and sustained operation. A throttled main thread on an M5
is not a whole slower device: workers remain unthrottled in existing CDP trials.

Promote the policy only with qualified energy savings for named workloads and
no unacceptable responsiveness/readiness regression on the required matrix.
The low-end case must demonstrate growth beyond an E-count seed to the full
useful allowed width when needed. If no such policy is supported by evidence,
keep the existing scheduler and the new observability; do not claim an energy win.
