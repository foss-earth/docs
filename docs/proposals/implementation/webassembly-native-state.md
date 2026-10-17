# Rust/WASM implementation state and next-agent handoff

Updated 17 October 2026. This records implementation progress, evidence and
known gaps in the current local checkouts. Read it with the
[implementation brief](webassembly-agent.md), [program plan](../webassembly.md)
and [optimization backlog](../../optimization-backlog.md). The separate
[W0 state](webassembly-w0-state.md) preserves live-comparison prerequisites.
This document supersedes older
handoff statements that no native Earth code existed; it does not mark the
program's performance gates complete.

## Current direction

The user explicitly separated Rust conversion and equivalent JavaScript/WASM
A/B work from W0's exclusive battery window. The later instruction was to
defer testing and focus on writing Rust/WASM implementations. Offline builds
were used to produce actual binaries; the five additional cores have not had
functional, browser, parity or performance qualification. No performance A/B
has run, and no speed, power or whole-family completion is claimed.

The next requested handoff is a fresh agent finding the largest **real** gain
with equivalent-functionality A/B. It should finish the high-value complete
worker/integration paths, using current evidence to choose their order, rather
than stopping after one isolated slice or spending the whole effort restating gate
status or requiring the complete W0 Google Earth comparison first. The
[fresh A/B assignment](webassembly-ab-handoff.md) explicitly permits the focused
functional checks needed for its chosen workload: that is a scoped override of
the earlier source-writing testing pause. It does not authorize an unrelated
full-suite campaign, W0 battery/Google qualification, or deployments. Follow
that prompt for the next task's exact scope. This documentation task ran no
tests, builds or measurements; all results recorded here are historical.

Existing JavaScript defaults remain. No unvalidated native core was enabled as
a production default. The Terrarium decoder is selectable in the existing app
workers; the larger conversions have opt-in library/worker ports, with remaining
app and renderer wiring described below. Six development packages split the
five audited CPU families because raster decoding and terrain geometry are
separate slices. This is not six shipping downloads, a settled final package
layout, or a measured percentage of total CPU time.

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
enabled, not a claim that each kernel was hand-vectorized. Only single-worker,
unshared-memory builds exist. Threaded/shared publication, atomics, TLS/rayon,
isolation and cross-core pool budgeting remain work. WASM32 describes pointer
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
| `earth-terrain`, `packages/native-terrain` | Grid and ordered direct-neighbor interpolation, antimeridian/clamping rules, WGS84 centre-relative f64 mesh positions, f32 target positions, optional f64 UVs, original indices and height bounds. Numeric parent/child grids and the reference's empty-neighbor distinction are covered. | Engine has pure TS geometry plus explicit TS/WASM geometry worker kernel/pool and `createTerrainMeshFromGeometry`. Existing raster runtime still uses its original path. Callback-only height sources are explicitly unsupported by native; preserve TS for them. Wire generation/admission/resource lifetime, initial mesh creation and later refinement separately. |
| `earth-ground`, `packages/native-ground` | Immutable median-split triangle BVH construction and finite f64 ray batches, retaining Babylon triangle arithmetic and original-face ties. | The native package exports build/query/release worker ports; there is no engine ground worker protocol yet. Runtime scene query still uses the original picker. Mesh-local rays need the original scene eligibility, transforms, submesh/mesh tie order and world-distance conversion. Raster grid traversal and per-frame ground cache are not implemented by this BVH. |
| `earth-google`, `packages/native-google` | Strict GLB2 envelope and interleaved f32 positions/UVs, u8/u16 index decoding into owned arrays. | JS profile selection retains original JSON/copyright, node matrix, names, material references, samplers and JPEG bytes. Optional bounded worker adapter decodes JPEG ImageBitmaps and transfers geometry/bitmaps with cancellation/disposal. Root handedness, transforms, materials/textures, AssetContainer lifetime, stale results and renderer publication still need the Babylon adapter. Existing app loader remains active; unsupported profiles retain their reference loader. |
| `earth-sky`, `packages/native-sky` | Atmosphere ray march, shared sightline radiance fan, 12×16 hemisphere integration, and all three precompute loops: 128×64 transmittance with 64 steps, 33×24 multiple scattering with 8×4 directions and 12 steps, and 48-sample ground irradiance. Readiness and f32 stores follow the reference. | Optional worker-only `createTables` and query-kernel injection in Sky, with runtime first-use reference comparisons and fallback/status. App sky remains JS. Astronomy, dome generation/filling, Sun/Moon discs and stars are not converted. |
| `earth-projections`, `packages/native-projections` | Full linear-RGB equirectangular-to-cube reprojection, tiled/gutter gnomonic and equi-angular regions with original supersampling/bilinear order, plus bulk direction/UV/cube coordinate and sampling kernels. | Three sphere preparation libraries accept optional ports; JS is default. Worker host, source decoding/orientation, pyramid/resizing, prefilter selection, coverage geometry and scheduling remain. Arbitrary custom JS sampler callbacks are not a native bulk source. The current ABI cannot hold an entire large tour image; see the memory follow-up below. |

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

`native.tier` offers `typescript`, `auto`, `single`, and `threaded` as a
reload-only control. Its default is **typescript**. Only the Terrarium worker
currently consumes this app setting. Auto/single perform lazy startup and
exact first-input native/reference comparison per worker; the first result is
the reference's. Compile/start/decode failure or parity mismatch selects a
permanent TS fallback for that worker, with requested/actual tier, reason and
counters in diagnostics. Threaded reports an explicit unsupported TS fallback.
The separate existing page-versus-worker first-tile readback comparison stays.

Other cores are explicit ports, not silently governed by that global selector.
Terrain replies distinguish reference and unvalidated output; mesh publication
requires explicit reference, validated-with-evidence, or experimental admission.
Ground/Google/projection wrappers report their actual backend and unvalidated
status rather than substituting JS on error. Sky's third factory argument
accepts `{ execution: "worker", createKernel, createTables?, onStatus? }`.
Each query operation checks its first output, and a first full native table set
is compared with JS before admission. Reuse the same ports object per worker
for later builds to skip JS precompute after that comparison; reference tables
are returned for the first checked atmosphere. Dispose native atmospheres/BVHs
and old worker generations explicitly.

## Artifact snapshot and evidence

These are real offline-compiled/optimized development artifacts, private version
`0.1.0`, recorded in `native/build/conversion-artifacts.json` on 17 October 2026.
Paths in this table are under `native/`. A rebuild must refresh the source and
output receipts together; hashes below describe this snapshot, not future code.

| Binary | Bytes | SHA256 |
| --- | ---: | --- |
| `packages/native-raster/single/raster.wasm` | 16,459 | `533e6afcabf60238c41cf9ea6ebeeb7e84c571b810e1428dd69ee89240b3f8c3` |
| `packages/native-terrain/single/terrain.wasm` | 29,914 | `239ecbfead95911aa6b0857bec5c285fadc006ae69b46c33eace990eec5a1eba` |
| `packages/native-ground/single/ground.wasm` | 29,910 | `9500e930e0c68adb23fc5505fbc2c17b80ca29a9d825b2f1fc13003db835bb9b` |
| `packages/native-google/single/google.wasm` | 18,316 | `f5ef0ee850a26a7bc729d9fb4aad2d7673d7d0bedcae22e1d8b765731b7e9955` |
| `packages/native-sky/single/sky.wasm` | 34,810 | `e4b03a0b594130b3bf60f60149befe934c04fe5a7539cdf9b039bf5ec33cd687` |
| `packages/native-projections/single/projections.wasm` | 28,319 | `1f6d8a31221bc36d0a00d3c77b7e6e186d90ea772b147fdede43721d2f6905b8` |

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
they do not qualify later conversion code. No new functional tests, browser
checks, parity comparisons, benchmarks or power runs were run for terrain,
ground, Google, sky or projections. No actual A/B run occurred for any core.

Historical source-check failures must be rechecked, not assumed current. The
engine's broader typecheck reported an unrelated `previousCeiling` excess field
in `tests/terrain/detailDistribution.test.ts`; its distributable build and
focused native tests passed. App typecheck, focused lint and 29 settings/policy
tests passed before the testing pause. These are recorded observations at those
revisions, not a claim that every dirty checkout currently passes or fails.

## Known blockers and useful next work

1. **Prepared terrain metadata affects picking.** Experimental prepared meshes
   write `metadata.preparationAdmission` in
   `engine/src/babylon/terrainMesh.ts`. The ground-only whitelist
   `GROUND_METADATA_KEYS` in `engine/src/sprites/picking.ts` does not include
   this key. Its current classification can mistake those meshes for content.
   Resolve the metadata contract before using the prepared-mesh path in a
   real scene; do not hide/remove admission provenance to evade the issue.

2. **Projection input memory is a real blocker.** A full 8192×4096 RGB f32 image
   is **402,653,184 bytes = 384 MiB** before output, ABI copies or allocator
   overhead. The current projection registry allows 128 MiB total live payload
   and the linked linear memory allows 256 MiB, so this input cannot fit.
   A maximum side dimension does not establish a usable image size. Design
   bounded source windows/strips/tiles or another explicit memory strategy,
   preserving wrap/clamp behavior, all bilinear taps, gutters, exact reduction
   order, source detail and output bytes. Measure copies and worker pool memory
   too. Do not silently shrink the photograph, drop precision or claim the
   original 8192-tour workload is supported by the current whole-image ABI.

3. **Current raster A/B adapters measure a batch.**
   `native/scripts/{prepare-ab,worker-measurement,node-raster-worker}.mjs`
   prepare actual TS and WASM Node workers. Each timed job performs **64 hot
   decodes of a 256×256 tile**, with one input clone and one final output
   transfer. Startup, fixture creation and warmup are outside trial timing.
   This is amortized batch throughput, not production per-tile latency or
   PNG/WebP/canvas decode time. Keep that distinction if reusing the adapter.

4. **A/B receipts and disposal need completion before trusting results.**
   `research/scripts/benchmarks/earth-compare/shared.mjs` currently hashes the
   two top-level adapter files, which import implementation code. Pin the
   actual reference build, worker/module/wrapper bytes, WASM, inputs and relevant
   settings as well, so a receipt identifies what ran. The runner does not yet
   call `measure.dispose` in `finally`; ensure both owned adapters/workers are
   disposed on success, setup failure and interrupted runs. Keep seeded paired
   order, A/A controls, real-output fingerprints and honest inconclusive noise
   results. Report kernel and complete worker/copy path separately.

5. **Integrate large kernels without changing behavior.** Terrain mesh worker
   preparation, ground BVH queries, profile-qualified Google decode, sky worker
   updates and offline panorama preparation are substantive candidates. Pick
   the largest measured current cost and preserve source, detail, settings,
   outputs, scene semantics and generation lifetime. The tiny Terrarium kernel
   alone is not proof of a worthwhile scene-level gain. User-requested maximum
   real gain takes precedence over mechanically converting the easiest line.

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
