# Fresh-agent prompt: finish the useful Rust/WASM paths for A/B

Prepared 17 October 2026. A session has since worked this prompt: to continue
from where it stopped, use the [resume prompt](webassembly-ab-resume.md)
instead. This assignment's scope and constraints still apply.

Start the new conversation in
`/Users/felg/gh/foss-earth` or `/Users/felg/gh/0sfs`, then paste the prompt below.
The linked state documents preserve the implementation knowledge; the previous
chat is not required. These are local working-tree documents, not committed or
published changes.

```text
Bring the existing FOSS Earth Rust/WASM work to a state where I can compare
JavaScript and WASM in the actual apps and get the largest reasonable
performance gain while preserving functionality and visual quality.

Do the implementation and integration. Do not stop at a proposal, isolated
Rust kernels, compiled binaries, or a toggle that only changes a label.
Finish the high-value paths below, using the current code and evidence to
choose their order. Keep the JavaScript implementations as selectable
references. This is a continuation of substantial uncommitted work.

Read first:
- ~/gh/foss-earth/.github/AGENTS.md and each affected repository's AGENTS.md.
- ~/gh/foss-earth/docs/docs/proposals/implementation/webassembly-native-state.md
- ~/gh/foss-earth/docs/docs/proposals/implementation/webassembly-w0-state.md
- ~/gh/foss-earth/native/README.md
- ~/gh/foss-earth/docs/docs/proposals/webassembly.md
- ~/gh/foss-earth/docs/docs/proposals/implementation/webassembly-agent.md

This task's priorities supersede old instructions to work the first unfinished
gate or wait for W0. W0's exclusive battery window is deferred. Do not gate
Rust conversion, integration, functional checks, or shared-machine relative
A/B readiness on battery tests or an idle machine. The earlier testing pause
was for the source-writing pass. This assignment includes the focused parity
and browser correctness checks necessary to make my A/B comparison meaningful;
it does not request the full W0/Google Earth/power campaign.

Starting state to verify, not redo:
- Six real single-worker development binaries and ESM wrappers exist in
  ~/gh/foss-earth/native: native-raster, native-terrain, native-ground,
  native-google, native-sky, native-projections. They are not complete shipping
  family replacements. Sources have no external Cargo dependencies.
- Rust/cargo1.99.0, wasm32-unknown-unknown and Binaryen132 are installed. Use
  the existing offline pinned build scripts. No nightly/threaded build or
  wasm-bindgen installation exists; do not reinstall tools already available.
- Only Terrarium RGBA-to-height decoding is currently wired into the app's
  native.tier selector. Its actual binary passed exhaustive RGB parity and a
  bounded Chrome worker check before the testing pause. The five other
  development binaries were compiled, not functionally validated.
- The app still defaults to TypeScript. Optional terrain geometry worker/
  renderer ports, Sky numeric/table ports, sphere preparation ports and a
  Google geometry/JPEG worker exist but need real consumer integration.
- JSBSim and audio already use C++/WASM. Keep them; a Rust rewrite is not the
  objective. Efficient worker/state/ground integration may still be useful.

Before editing, record git status, branch and HEAD in every affected checkout.
There are multiple independent Git repositories, pre-existing dirty files and
possibly concurrent work. Preserve all of it; never stage or discard unrelated
changes. Use subagents for independent work with explicit file ownership.

Work that matters most:

1. Finish useful end-to-end terrain and Google tile preparation paths.
   - Raster: move first mesh generation, decoded-grid updates and segment
     rebuilds into the preparation workers. Use the existing Rust mesh core;
     include substantial morph/inheritance/seam work still on the page where
     it is beneficial. Preserve current stitching and drawn/queried geometry.
   - Google: connect the supported-profile geometry/JPEG worker to the renderer
     adapter. Preserve Babylon handedness, matrix decomposition/order, node
     names, materials, sampler/colour conventions, attribution copyright,
     AssetContainer ownership, disabled-until-ready behavior and abort/dispose.
     Keep unsupported profiles on the original loader with an explicit reason.
   - Add lossless packing and remove redundant copies where useful. Do not
     silently quantize positions/UVs/normals, drop mipmaps, reduce detail or
     change pixels to produce a speedup.

2. Complete accelerated ground use, not just BVH construction.
   - Integrate generation-aware geometry snapshots, transforms, raster cell
     walking and the aircraft's per-frame ground cache where applicable.
   - Preserve exact finite-ray semantics, first-face/mesh tie ordering, world
     distances/normals, ground timing and contact behavior. Ground must query
     the same displayed Float32 triangles. Do not introduce a frame of stale
     ground or asynchronous GPU readback into a synchronous physics step.
   - Build acceleration data off the page; keep the reference until the correct
     generation is ready. Put synchronous Rust work in an owning worker; do not
     move a long blocking export onto the main page to claim integration.
   - If an effective flight path needs the planned physics worker/shared state,
     implement its bounded deterministic state/control/lifetime contract. Keep
     JSBSim's120Hz steps and inputs keyed to simulation steps. Do not rewrite
     JSBSim or reduce fidelity.

3. Connect the already-written Sky and projection kernels to actual consumers.
   - Sky: native atmosphere tables, marching, radiance fans and irradiance in
     workers; add useful bulk star/dome calculations if they remain important.
   - Projections: actual panorama preparation and directly opened photographs,
     including normal large inputs. The current128MiB payload/256MiB linear
     caps cannot hold an8192x4096 RGB Float32 source (384MiB) in one allocation.
     Implement a bounded tiled/streamed input strategy or another justified
     memory design; do not lower image dimensions or simply multiply copies.
     Avoid copying the whole source for every sample, row, face or worker.
   - Complete material numeric gaps such as pyramid filtering when worthwhile.
     Keep library ports independent of engine; do not disturb unrelated
     sphere-image edits.

4. Address further substantive CPU work when it materially helps these paths:
   terrain/imagery visibility and screen-space-detail calculations, imagery
   gutter/mip generation, and imagery patch-table fills. Prefer bulk kernels
   and retained buffers over tiny WASM calls per element. Use focused local
   traces or representative relative measurements to choose additional work;
   do not blindly port every helper or expand into a renderer rewrite.
   Browser-native image codecs, networking, DOM/settings/input, Babylon GPU
   objects/uploads and resource scheduling generally remain JavaScript.

Make A/B real and easy:
- Extend the existing native.tier startup selection so the active converted
  cores actually follow it in Earth app, affected flight/tour consumers and
  panorama preparation. Provide equivalent JS and single-worker WASM modes;
  a reload is acceptable. Keep TypeScript as the default until I choose a
  default change. Add per-core overrides if needed to attribute gains.
- JS and WASM comparisons must use the same worker architecture/count,
  inputs, cache policy, geometry, images, simulation steps and quality settings.
  A separate legacy baseline may show gains from moving work off the page,
  but do not attribute those worker gains solely to Rust.
- In the existing Native tab and Copy report, expose requested and actual
  backend per core, scope, first-use parity, fallback reason and useful job/
  copy/memory timings. Forced-but-unavailable tiers remain usable and explicit.
  A JS fallback is not a successful WASM sample. Inactive cores load nothing.
- Keep the original complete JS path. First-use comparison precedes acceptance;
  compile/fetch/startup/parity/timeout failures retire the affected native path
  cleanly. Bound startup, queue lengths, memory, cancellation and teardown.
  Discard stale map generations and close every unconsumed ImageBitmap.
- Budget all pools together. Start with the installed single-worker builds and
  multiple independent workers where appropriate. Add shared/threaded execution
  where a material benefit justifies it; never assume sharing is a speedup.
  Unsupported contexts keep a complete transfer/JS path.

Known issues to carry forward:
- The optional prepared terrain helper adds preparationAdmission metadata;
  sprites/picking.ts's ground metadata whitelist needs to handle it so ground
  does not become a POI.
- The existing decoder A/B adapter batches64 decodes with one input clone and
  one final output transfer. It is not production per-tile latency. Supply
  representative per-job/end-to-end scenarios and label batching honestly.
- A/B evidence must pin the real WASM, JS reference, wrapper and worker bytes,
  not only adapter stubs. Make the shared runner dispose adapters/workers in
  finally, including failure paths.
- The current six packages are development artifacts. Consolidate/reuse cores
  according to the per-family design when useful; do not force all binaries
  to download on every map or let independent memory caps oversubscribe a page.

Verification and completion:
- First validate equivalence and ownership for each integrated path against
  the retained JS. Keep operation/reduction order, executing-realm Math,
  f64 arithmetic and exact f32 stores; no fast math or relaxed precision.
  Cover actual consumers, transforms, edge tiles, replacement/disposal,
  picking/ground behavior and deterministic flights where changed.
- Run relevant checks after integration. Existing historical failures are
  recorded in the state docs; recheck rather than assume they still exist.
  Do not hide new failures behind old baselines. One heavy job at a time.
- Provide paired shared-machine relative A/B with A/A noise controls where
  useful. No exclusive-machine prerequisite, discarded slow trials or blanket
  idle waits. Record disturbances and report inconclusive when noisy. Measure
  whole-path latency/copies/worker overhead as well as kernel time, frame-time
  distributions, long tasks and memory. Do not claim unmeasured watts or speed.
- Final delivery must include working exact launch URLs/commands for JS and
  WASM, repeatable equal-work scenarios, what is actually native in each,
  report locations, known fallbacks and remaining limitations. Make it easy
  for me to run the A/B myself, rather than handing me another porting plan.
- Keep the state docs, native README and implementation Status current. Report
  functional completion separately from measured gains. A core that is slower
  after overhead keeps JS in auto mode; it may remain force-selectable for A/B.

Proceed autonomously with reversible implementation and necessary checks.
Do not ask me whether to continue between routine steps. Do not commit, push,
deploy, create external repositories, use sudo, install new toolchains/tools/
browsers, or change visual defaults without my authorization. If a specific
new tool is essential, prepare the concrete need and ask once; continue
independent work while waiting. Existing authorization/installed tools need
not be requested again. Keep all scratch/logs/screenshots under the owning
repository's ignored build/ and never expose credentials. No AI attribution.
```

Retained context:

- [Native implementation and remaining work](webassembly-native-state.md)
- [W0, flight controller and deferred live measurements](webassembly-w0-state.md)
- [Program plan](../webassembly.md)
- [Original executable brief](webassembly-agent.md)
