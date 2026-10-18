# Fresh-agent prompt: continue from the measured Rust/WASM integration

Prepared 18 October 2026, after the final app A/B and ground invalidation fix.
Start in `/Users/felg/gh/foss-earth`, with `/Users/felg/gh/0sfs` and
`/Users/felg/gh/UMN-VR` as additional directories, then paste the prompt.
The [original assignment](webassembly-ab-handoff.md) retains its scope,
constraints and completion criteria. The [native state](webassembly-native-state.md)
records implementation detail; the [comparison guide](webassembly-ab-results-2026-10-18.md)
contains exact launch URLs, commands, scenarios and evidence. All work remains
local and uncommitted.

The latest UI requirements and coordination now have three separate handoffs:
[shared-memory runtime](webassembly-shared-memory-handoff.md),
[Component execution afterward](webassembly-ui-handoff.md), and
[other UI violations](ui-compact-controls-handoff.md). Read the current
[compact control spec](../../ui-layout.md#compact-segmented-choices) before
changing any UI. Button labels are terse, **?** is last, and source is an
inline icon at the end of its help text.

UI conversation checkpoint (18 October): this UI slice is complete and safe to
close. The shared-memory agent is still active; let it finish independently.
Use [the post-runtime UI handoff](webassembly-ui-handoff.md) after its final
results, rather than redoing the cleanup. The [state checkpoint](webassembly-native-state.md#ui-checkpoint-safe-to-close-this-conversation-18-october-2026)
records current evidence, retained decisions and the remaining integration work.
Baseline statements below predate that agent's in-progress runtime artifacts.

```text
Continue from the implemented and measured FOSS Earth Rust/WASM A/B paths.
Pursue the largest real performance gain in actual apps while preserving
functionality and visual quality. Continue through useful implementation and
measurement; do not repeat completed work or stop at isolated kernels.

Read first, in this order:
- ~/gh/foss-earth/.github/AGENTS.md and each affected repository's AGENTS.md.
- ~/gh/foss-earth/docs/docs/proposals/implementation/webassembly-native-state.md,
  especially current integration, measured results and remaining work.
- ~/gh/foss-earth/docs/docs/proposals/implementation/webassembly-ab-handoff.md:
  the original scope, constraints and completion criteria still apply.
- ~/gh/foss-earth/native/README.md and the plan's current Status table in
  ~/gh/foss-earth/docs/docs/proposals/webassembly.md.
- ~/gh/foss-earth/docs/docs/proposals/implementation/webassembly-ab-results-2026-10-18.md:
  use its exact Earth/tour/fly URLs, component overrides and harness commands.
- Final evidence under app/build/wasm-profile/runtime/runs/2026-10-17-integrated-ab/:
  final/integrated-summary.{json,md}, final/comparisons.json, and
  ground-index-final/integrated-summary.{json,md}. Inspect relevant raw arms.

Implemented and checked (verify, do not redo):
- Six app cores follow native.tier and native.core.<core> overrides in Earth,
  the UMN tour and 0SFS fly: raster, sky, terrain, imagery, google and ground.
  Legacy URL choices: typescript | typescript-worker | single | auto | threaded;
  custom selects the separate manual settings. The tab is Component execution.
  Global defaults and Components (settings plus real running state) separate
  implementation, placement
  and independent-job parallelism. Changes pending / Apply and reload / Discard
  make startup-only application explicit; each component retains real status.
  See the state document for the fields and compatibility behavior.
  Global default remains typescript. Sky auto is typescript-worker; other
  cores auto remain typescript at this verified baseline. Shared-memory runtime
  work is active in another conversation; verify its final app contract and
  evidence instead of treating these baseline notes as its completion status.
- Raster Terrarium decoding runs in the existing decode workers. Terrain
  target preparation runs at applyGrid with parity, generation rejection,
  synchronous fallback and settle-after-target synchronization. Initial mesh
  generation, refinement and morph application remain TS.
- Imagery sparse upload is COMPLETE. Both worker arms receive only the exact
  original leaf pixels needed for batched adopted-grid interpolation, preserving
  ordered mixed-zoom/direct-neighbor semantics. Heights remain f64. Exact
  page misses are immediate and memoized; worker replies are compared with
  saved page answers before cache admission. Original height buffers are never
  cloned/detached; sparse snapshots are released after jobs. Validation:
  176 actual native dense/sparse cases / 147,110 coordinates and 71 engine
  tests, plus typecheck/build/lint. Do not restore whole-grid uploads.
- Sky tables, illumination and dome evaluation use one selectable TS/WASM
  worker. Star atmosphere and final colors use TypeScript in that same worker
  in both arms. Full-color replies carry RGB only (12 bytes/star); the page
  computes the original ECEF products and current-frame billboard transforms
  synchronously. Retained catalogue/current-illumination/presentation checks
  preserve exact stale/exposure/FOV fallback. The 16 focused tests include
  9,096-star GPU position/color byte parity under world rotation and changed
  presentation. Default C result payload is 169,344 bytes/job, formerly 371,040.
- Google supported GLB/JPEG preparation reaches a lazy Babylon adapter with
  hierarchy, handedness, materials/samplers/mipmaps, attribution and container
  lifetime preserved. Chrome WebGL2/WebGPU synthetic pixels passed 48 cases:
  36 actual WASM and 12 explicit WebGL ICC original-loader fallbacks. EXIF
  and unsupported profiles also use the original loader. Real-view performance
  remains unqualified.
- Ground workers build immutable BVHs for eligible static indexed Float32
  meshes. Queries synchronously traverse exported indices in TS, using current
  transforms, finite lengths, original ties/normals and first-query admission.
  Mutation invalidates before queries; stale builds cannot publish. The final
  fix handles same-length Geometry.updateIndices() identity changes that bypass
  Babylon notifications; 10 ground tests and engine typecheck/build/lint pass.
  Earlier 514 native/snapshot/reference rays also matched. Raster cell walking,
  flight ground caches and 120 Hz physics remain unchanged.
- Projections handle unchanged 8192x4096 RGB f32 sources (384 MiB) through exact
  bounded source windows in actual sphere-image CLI worker preparation.
  378 differential cases / 2,683,584 f32 values and 264 encoded outputs matched;
  tested WASM payload/memory peaks were 60.5/95.6 MB within 128/256 MiB caps.
  Codecs/pyramid remain JS; direct browser photos already sample textures on GPU.
  prepared.json records native status and resolved component/module hashes.
- UI refinement is complete for this slice: compact shared segmented choices,
  short labels/digits, natural reading order, ? last, inline source icon in help,
  rounded paragraph groups and explanation on demand. Components folds real
  running status into each component's settings. Collapsed titles show Name ?;
  expanded titles show Name: TS/WASM (N workers/main) ?. The trailing ? stays
  visible in both states and opens diagnostics without toggling the component.
  Expanded titles are the first item of their controls' paragraph grid, not a
  separate header row. Expanded components sort before minimized ones, with
  original relative order retained in each group. Full section headings remain
  separate.
  Components filter live by selected basemap: raster/terrain/imagery for 2D,
  Google preparation for 3D; Sky and ground stay shared. Hidden overrides,
  expansion and full reports persist; hidden help closes safely.
  There is no duplicate Running line or wordy Details action. Latest desktop/phone
  evidence: app/build/component-execution/browser-map-mode/report.json;
  app/build/component-execution/functional.md has commands and test limitations.
- Component execution tab and Copy report expose actual scope/backend, parity, fallback,
  timings/copies/cache counters in all three apps. Earth/tour additionally
  provide window.__fossEarthPanoramaTest.nativeCores() with ?panoramaTest=1;
  fly does not install that hook. native.workers budgets host factories together.
  Keep app exports in foss-earth/native because fly mocks runtime wholesale.

Measured results to retain:
- The final matrix has 20 source-stable arms with one common served-source
  version and 1,260 per-file receipts, including actual native/reference/worker
  artifacts and harness inputs. Six further source-stable ground arms follow
  the index-identity fix. Earlier preliminary runs are diagnostic history.
- Sky mean page task: original 12.043 s -> TS sky worker with page stars
  8.105 s (-32.7%) -> the same worker with worker stars 7.369 s (an additional
  observed -9.1%, combined -38.8%). Worker-star repeat spread was 0.618 s;
  star offloading alone did not uniformly improve frame tails. All C arms
  stayed about 60 FPS, with no page errors or long tasks. These are worker
  architecture gains with TS stars. WASM sky mean was 7.444 s (+1.0% versus
  the same TS worker architecture, within variation): no whole-app Rust gain.
- Imagery original/TS-worker repeat drift was 5.0-5.5 s, so no whole-app gain
  is qualified. Native arms admitted parity-same results without drops/fallback;
  sparse input was about 31 MB per run, with no retained snapshot bytes after
  jobs. Exact memoized page misses are common to both worker arms. Late TS/WASM
  worker totals were 365/581 ms; the page reference was faster. Keep auto TS.
- Final ground fixture: 12,800 finite queries have one identical output hash
  across all six arms. Mean totals: original 3.218 s, TS-built index 1.945 s,
  WASM-built index 1.917 s (40.4% lower than original). Both accelerated arms
  query in TS; this is a spatial-index gain. WASM construction was slower:
  20.9-21.6 ms versus TS 14.9-15.4 ms. This static app fixture is not an
  aircraft-flight qualification. Ground auto remains original TS.
- Earlier terrain worker placement added about 1.8 s across 1,200+ chunks;
  WASM work was 30-34 ms versus TS 25-28 ms. Raster WASM was also slower in
  its existing workers; bounded projection observations were slower. Preserve
  these results. The old imagery triangle-ray trace predates current grid
  interpolation and cannot be claimed as a new batching gain. No watts claim.

Next work:
1. Use the comparison guide to review/run the existing choices. Do not redo
   sparse imagery, RGB-only stars, the ground identity fix or the full final
   matrix merely to resume. Repeat a workload when new code or a specific
   unresolved concern warrants it, keeping prior directories intact.
2. Profile representative supported Google views and actual flight ground
   queries; these broader workloads remain unqualified. Use existing keys only
   as the shared instructions specify, without printing credentials. Preserve
   transforms, displayed triangles, contact timing and synchronous queries.
   Distinguish static fixture gains from actual flight/frame behavior.
3. Choose the largest remaining measured cost. Candidate areas include initial
   terrain meshes/refinement, selection/coverage, imagery page/gutter/mip loops
   and offline pyramid filtering. Prefer retained/batched numeric work; do not
   port tiny per-element calls or assume Rust/threads/shared memory is faster.
   Keep complete JS references and fallback, and preserve visual defaults.

Working rules:
- Other sessions edit the same checkouts concurrently. Record git status,
  branch and HEAD per affected repo; re-read before exact edits. Never stage,
  commit or discard others' work. Give agents non-overlapping ownership.
- One heavy job at a time; inspect active jobs before starting another.
  Use --no-watch and freeze served sources during A/B. Admit only
  sourceUnchanged=true arms with actual implementation receipts and matching
  outputs; retain disturbances and report inconclusive when noisy.
- Scratch/logs/profiles/screenshots stay in the owning repo's ignored build/.
  Existing tools only; offline pinned builds. Dispose workers/Chrome on every exit.
- First-use parity precedes native admission. Preserve executing-realm Math,
  f64 operation order and exact f32 stores; no fast math, reduced samples or
  lower detail. Bound startup/jobs/memory/cancellation/generation lifetime.
- Consult current state/check logs for historical failures and recheck them
  when relevant. Engine's previousCeiling error is gone; fly's recorded
  unrelated 14 failures in 4 files must not hide a new regression.
- W0's exclusive battery/Google Earth qualification remains deferred; it does
  not block focused correctness or shared-machine relative A/B.

Final delivery: working exact launch URLs/commands, equal-work scenarios,
actual native scope, report locations, fallbacks and limits. Keep native state,
native/README.md, comparison guide and plan Status current. Separate functional
completion, architecture gains, Rust gains and unmeasured power/program gates.

Proceed autonomously with reversible implementation and necessary checks.
Do not ask whether to continue between routine steps. Do not commit, push,
deploy, create external repositories, use sudo, install new toolchains/tools/
browsers, or change visual defaults without authorization. Never expose
credentials. No AI attribution.
```
