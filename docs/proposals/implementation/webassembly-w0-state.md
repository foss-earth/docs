# W0 state and resumption handoff

Updated 2026-10-17. This is the persistent, curated W0 handoff. The original
[implementation brief](webassembly-agent.md#gate-w0-measure-against-google-earth)
and [plan](../webassembly.md#0-measure-against-google-earth) define the gate;
this page records what was implemented, what the evidence establishes, and
what a fresh agent must still resolve.

## Current truth and user direction

- **W0 is in progress. No Google Earth comparison, flight baseline, absolute
  power result, or performance gain is qualified.** The baseline table in
  `research/benchmarks/earth-compare/README.md` remains pending.
- The user deferred the exclusive measurement window and selected **0%
  brightness**, to be set by the user. No start time is scheduled. Do not
  restart live W0 collection without a newly agreed window; take a fresh idle
  baseline at that brightness when it begins.
- The user explicitly said battery testing must not block Rust conversion or
  switchable JavaScript/WASM work. The latest direction is to defer testing
  and focus on writing Rust/WASM versions. No further tests, browser checks,
  performance A/B or power runs should start during that implementation pass.
  Compiling actual artifacts was allowed; compilation is not parity proof.
- After that source-writing pass, the user requested a fresh-agent prompt to
  finish useful integration for manual A/B and preserve the context in docs.
  The [next assignment](webassembly-ab-handoff.md) includes focused functional
  checks for that purpose; it does not resume W0's deferred live campaign.
- Rust work has progressed independently: real single-worker development
  artifacts exist for raster decoding, terrain surfaces, ground BVHs, Google
  geometry, sky and projections. These are numeric slices, not completed
  whole-family gates. Only the earlier raster decoder has functional proof;
  newer cores remain unvalidated and opt-in. W0 must not be marked done to
  accommodate that progress. See the `*-WASM/` READMEs and the main
  plan's latest status for conversion details.
- Stable Rust's `wasm32-unknown-unknown` target was installed after the user
  instructed resumption. That decision is answered, not a pending approval.
  No nightly, wasm64, bindgen or toolchain upgrade was installed.
- No commits, pushes or deployments were made in this work. Existing dirty
  changes were preserved. Primary checkouts contain fixes newer than the
  detached scratch worktrees; do not copy those old worktrees over them.

## Source entry points

Local organization root: `/Users/felg/gh/foss-earth`. Fly is the separate
checkout `/Users/felg/gh/0sfs/fly`. Read each repository's `AGENTS.md` and the
shared `.github/AGENTS.md` before continuing.

| Checkout / path | Role |
| --- | --- |
| `research/benchmarks/earth-compare/README.md` | Current harness method, commands, pending baseline table |
| `research/scripts/benchmarks/earth-compare/run.mjs` | Plan, calibration, capture, watcher, quiet wait and telemetry |
| `research/scripts/benchmarks/earth-compare/analyze.mjs` | Offline qualification of exact captured artifacts |
| `research/scripts/benchmarks/earth-compare/{views,camera,metrics}.mjs` | Fixed views/motions, actual camera matching, trace and visual metrics |
| `research/scripts/benchmarks/earth-compare/{earthUi,renderGeometry,support}.mjs` | Public UI preparation, full-canvas geometry, common image policy/masks |
| `research/scripts/benchmarks/power/{battery,flight}.mjs` | Battery decoding/integration and public flight-profiler wrapper |
| `research/scripts/benchmarks/earth-compare/shared.mjs` | Shared-machine relative A/B with A/A controls; not W0 qualification |
| Fly `docs/benchmark-routes.md`, `src/flight/`, `scripts/profile-flight.mjs` | Route/control contract and headed profiler |

Source receipts and public prerequisites are declared in research's
`tools-manifest.json`. Refresh receipts when implementation bytes change;
historical source-check successes do not cover later edits.

## Comparison method that must survive resumption

The five views are Grand Canyon, UMN campus, Manhattan, KSFO approach and
orbit. Each compares signed-out Google Earth, published FOSS Earth and a
prepared local FOSS build, with three alternating repeats and adapter/battery
states. Use headed Chrome, 1280×720 CSS pixels at the display's actual DPR,
and a fresh disposable profile for each cold run. Build before timing.

Camera distance and heading map directly; FOSS pitch is `90 - Google tilt`.
Match measured vertical FOV and the **actual ECEF target height**, which follows
resolved ground plus the compass offset, zero by default. Do not assume the
target is on the ellipsoid. Orbit uses the supported **1° tilt** in both apps
because FOSS's public camera clamps pitch at 89°; no production default was
changed. Overlays must prove horizon, landmarks, scale and equal useful detail.

The collector records encoded network bytes, main-thread `TaskDuration`, JS
heap, process CPU/RSS, machine state, screenshots and trace presentation
feedback. Frame intervals use confirmed display presentations, with duplicate
events removed; no `BeginFrame`, `DrawFrame`, app FPS or RAF substitution is
accepted. Missing/ambiguous presentation evidence means unavailable.

Visual completion uses per-channel RGBA tolerance **8**, at least **99.5%** of
included pixels agreeing with the final image, and a **2 s matching final
suffix**. A last screenshot alone cannot establish that hold. Event-driven
screencasts may represent an unchanged compositor image until the next event
or collection end, provided the recording is complete. Streaming, acknowledgments
and bounded pending writes are implemented; overflow/write loss breaks visual
continuity. Final PNG decoding is streamed rather than retaining all RGBA
images. Encoded frame storage is bounded at 4 GiB per phase; plan disk space.

Geometry/mask source work is complete, but **live qualification is pending**:

- Measure one unique dominant backed world canvas. Require full visibility,
  known ancestor geometry, no unsupported transform/clipping/mask, compatible
  CSS size, backing dimensions, DPR and projection aspect across targets.
  Crop integer screenshot pixels only. Never resize/warp or crop a different
  projection to manufacture agreement. Preserve the raw artifacts.
- Declare one normalized canvas mask per view with `--masks`, shared by every
  target, phase and repeat. Exclusions explicitly identify UI, labels or
  animation. At least 10% remains included. No automatic difference/variance
  mask is allowed. Bind captures/reviews to `method.json` and the exact image
  policy hash; a changed mask needs new calibration and review.
- Public UI preparation deduplicates labels, rejects ambiguous/conflicting or
  occluded controls, reconfirms settings after cloud edits, and records UI
  rectangles and sparse open-shadow hit tests. Included UI is rejected using
  captured DPR pixels. DOM hit tests cannot prove canvas labels are absent.
  Review label and sky animation exclusion through the whole motion.
- Raw captures always remain `qualified: false`. Offline analysis requires
  review of the exact final PNG digest, landmarks/detail, render geometry and
  mask plus the original camera, source/policy, UI inventory, headed/exclusive,
  visual-continuity, disturbance and power evidence. Review booleans cannot
  repair missing evidence in older captures. Blank, failed, coarse, headless,
  shared/observe or unmatched observations cannot become qualified baselines.

Two method gaps remain explicit. Google cold/warm captures include public
Clean-style setup in the timed interval (`google-ui-preparation-in-timed-window`),
adding work FOSS does not perform. Resolve that timing method before accepting
it. Google's public address initially exposed only motion endpoints; an
endpoint match is not a matched path. Current source retains actual start/end
and interior read times, but Google still needs enough real samples: fewer than
three distinct poses, stationary/sparse updates or refused shortcuts remain
unmatched. Motion/settling now use one uninterrupted recording, not two
captures with a continuity gap.

## Flights: controller fixed in simulation, live gate still open

Both dev-only routes start at **37.91° N, 121.285° W**, heading **000° true**,
**110 kt**, in the C172, with Google required. Cruise starts 1,500 m and low
150 m above initially prepared ground, then holds that fixed MSL target.
Completion is **21,600 accepted 120 Hz steps / 180 simulated seconds**;
loading, pauses and terrain holds do not advance simulated time. The candidate
roughly 10 km Stockton track still needs whole-route Google/terrain coverage
review; `coverageValidation` remains `unverified`.

The limits were declared before live collection and remain **20 m altitude
error and 5° heading error**. The first live low route completed all steps but
reached **35.1412 m** altitude error, so the profiler correctly failed. Its
1.0979° heading error passed. Do not raise the tolerance or retroactively accept
that run.

Installed-JSBSim simulations reproduced the original 35.141192236 m failure
exactly through the actual autopilot/control boundary. The route-only altitude
loop was tuned to P=0.009 rad/m and I=0.0003 rad/(m·s), retaining
vertical-speed damping D=0.045 rad/(m/s), ±12° pitch and ±10° integral limits. Conditional
antiwindup freezes further saturation and permits unwinding. The original
placement pitch was the C172's +2.48° static stance, not trimmed flight.

| Simulation after tuning | Maximum altitude error | Maximum heading error |
| --- | ---: | ---: |
| low / 110 kt | 13.97485 m | 1.07701° |
| cruise / 110 kt | 13.36260 m | 1.01060° |
| low / 100 kt | 14.42370 m | 1.07700° |
| low / 120 kt | 12.25146 m | 1.08120° |

All finished the accepted-step route. These are controller correctness
simulations without renderer, network or wall pacing, not new live baselines.
Cruise has not run live. Recheck both routes live under unchanged limits and
review coverage before qualification.

Prebuild flights using the public profiler's `--build-only`, then power runs
use `--no-build` in a fresh real, non-symlinked fly `build/` output directory.
The research wrapper spawns that executable without a shell or private imports;
the child alone reads the key. Route timestamps correspond to first/last
accepted steps. The wrapper trims to that exact wall interval using valid
adjacent discharge readings bracketing both boundaries, no extrapolation and
no gap above 5 s. It samples at 1 Hz, allows the child's 600 s route timeout,
then SIGTERM only after 660 s and waits for cleanup/natural close. Never kill
unrelated processes or delete an owned Chrome profile before Chrome exits.

## Power evidence is diagnostic

Battery current is decoded with signed 64-bit semantics before multiplying
voltage/current. Integrate only valid discharge readings; never bridge missing,
charging or large-gap samples. Require confirmed battery source, unplugged,
Low Power Mode throughout, at least 95% route coverage and a matching idle
baseline at the same recorded brightness. `pmset -g custom` fallback is
source-specific; AC settings cannot stand in for battery settings. Power
queries are read-only. Sandboxed queries previously exposed stale AC state;
verify actual live state rather than overriding a failed reading.

The historical idle recording had 60 valid samples over 60.025 s and raw
whole-machine mean **4.0854 W**. Brightness was only labelled
`current-level-unchanged`, not numerically set. The failed low flight recorded
**4.4877 W** whole-machine / **0.4023 W** above that idle value over its route,
with 100% sampled coverage. **None is a qualified power baseline or proof of
the 15 W flight goal**: low tracking failed, map coverage is unverified, and
exclusive machine conditions were not established. Take a fresh idle baseline
at the selected 0% setting; do not carry these watts forward. The tools never
change power settings or run sudo. Optional CPU/GPU separation would require
the user's own `powermetrics` capture later.

## Deferred exclusive window and realistic duration

The proposed first window is **90 minutes for qualification**, not the complete
baseline. Begin on adapter power to qualify public UI, actual render rectangles,
camera/masks and tuned routes. Run only batches whose prerequisites pass and
whose whole duration fits the agreed window. For the battery portion, the user
must unplug, enable Low Power Mode and set 0% brightness; record it and measure
a fresh idle baseline. The user chose to schedule this later.

The default matrix has 90 target units: 5 views × 3 targets × 3 repeats × 2
power states. Each unit is cold 60 s + warm 60 s + rest 60 s + three motions
of (preload 60 s + motion 10 s + settle 60 s) = **9 min 30 s**. Therefore:

| Work | Minimum, before setup/quiet waits/review/retries |
| --- | ---: |
| Complete comparison capture | **14 h 15 min** |
| Full calibration | 47 min 30 s |
| Both 180 s flights, three repeats, both power states | 36 min |
| One view/power/repeat block, all three targets | 28 min 30 s |

Split comparison into **30 blocks**, reserving roughly **40–45 minutes per
block** with overhead. Use `--view=<id> --runs=1 --repeat-start=0`, then repeat
ids 1 and 2, to preserve alternating global order. `--plan` reports the selected
batch's minimum without running it. Aggregate only blocks with matching source
build, method/mask, power/brightness and quality evidence. Keep all three
distinct repeat ids. Thermal state, battery endurance/charging and disturbance
can require additional sessions; never promise full W0 in 90 minutes.

The shared-machine runner is a separate relative-regression tool: seeded
counterbalanced A/B, same-build A/A controls, actual-output fingerprints,
paired medians and bootstrap intervals. Noise, missing data, output disagreement
or an interval containing zero yield inconclusive. It retains disturbances
without waiting for idle. No real experiment has run with it, and it cannot
qualify W0 or absolute watts. Correlated background load can still confound it.

## Evidence, historical checks and remaining sequence

Detailed logs are **local, ignored build artifacts**, not tracked evidence
bundled with this document. If unavailable in a new checkout, do not infer the
measurements from this summary; locate the original artifacts or recollect
when authorized.

- Historical full handoff:
  `docs/build/webassembly/W0/2026-10-16/summary.md`.
- Synthetic headed Chrome smoke (81 screenshots, 80 display intervals,
  p50 about 16.67 ms; protocol proof only):
  `research/build/webassembly/W0/2026-10-16/smoke/`.
- Older campus calibration, containing labels/alignment gaps and overflow:
  `research/build/benchmarks/earth-compare/2026-10-16_233902/`.
  Later source fixes do not requalify it.
- Raw idle and low power:
  `research/build/benchmarks/power/2026-10-16_234906/power.json` and
  `research/build/benchmarks/power/flight/2026-10-16_235923/power.json`.
- Original low flight:
  `/Users/felg/gh/0sfs/fly/build/webassembly/W0/2026-10-16/flight-low/report.json`.
- Controller simulation/build logs:
  fly `build/webassembly/W0/2026-10-16/controller-{before,after,final-tests,lint,build}.log`.
- Prepared diagnostic builds, not live reports:
  fly `build/webassembly/W0/2026-10-17/flight-{low,cruise}-tuned/dist`;
  app `build/webassembly/W0/2026-10-17/dist`. Recheck source/build provenance
  before future measurement instead of assuming these remain current.

Before testing was deferred, research source tests passed 130/130, docs source
tests 15/15, fly controller/integration/autopilot focused tests 21/21 and
profiler options/lifecycle tests 6/6. Geometry and UI helpers each had nine
focused tests. These are historical checks, not live qualification or proof
covering subsequent source edits.

Historical broader-check failures were recorded separately and may need
rechecking when testing resumes: research's missing
`validation/evidence/weather/2026-10-08/source-manifest.json` and unrelated GPU
tool receipt mismatch; docs' expected recorded link in `docs/deploying.md`;
fly's two sibling-app GPU bind-group type-brand errors and 14 existing test
failures. A later F135 build timeout passed its isolated recheck. Exact logs
are `baseline-ci.log`, `after-ci.log`, `tools-check.log`, `after-typecheck.log`,
`baseline-tests.log`, `after-ci.log` and `f135-timeout-recheck.log` under the
owning repository's `build/webassembly/W0/2026-10-16/`. Do not relabel these as
current blockers or claim repairs without checking today's source.

To resume W0: honor the current testing pause first; when live work is again
authorized, agree the deferred window, confirm current source/build receipts,
qualify UI/render/camera/masks and fix the timed-preparation/path gaps, verify
tuned flights and full coverage, then collect bounded comparison/flight batches
with fresh power evidence. Review exact artifacts, fill the baseline table
with three-repeat medians/ranges, and only then update W0 to Done.

Keep Google Earth signed out and observations few; never intercept, persist or
replay its assets. Screenshots stay private in ignored `build/`, never committed
or published. Read only the named Google key from the approved environment or
ignored files, never print it or put it in URLs/diagnostics. If automation is
refused, use the documented observer/manual route and retain its qualification
limits. One heavy job at a time; do not stop the user's unrelated work.
