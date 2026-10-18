# Fresh-agent prompt: implement shared-memory multithreaded WASM

Prepared 18 October 2026. Start a fresh conversation in
`/Users/felg/gh/foss-earth`, with `/Users/felg/gh/0sfs` and
`/Users/felg/gh/UMN-VR` available. Paste the prompt below. The Component
execution UI is being cleaned up concurrently; this assignment owns the
execution architecture, not its visual design.

Coordination update, 18 October: the parallel UI cleanup is now complete for the
baseline runtime. Its conversation can close while this runtime work continues.
Preserve the current panel design; follow ui-layout.md and the post-runtime UI
handoff when reporting the final contract. Facts below describe the assignment's
starting baseline, not a prohibition on or verdict about current WIP builds.
This update does not change the active runtime assignment's scope or acceptance
criteria. Latest UI evidence: `app/build/component-execution/browser-map-mode/report.json`.

```text
Implement real shared-memory, multithreaded Rust/WASM in the actual FOSS Earth
apps. The user explicitly wants this next, ASAP. Do not stop at planning,
compiler flags, a feature probe, a synthetic shared counter, or several private
single-threaded WASM instances. Deliver a supported app component actually
computing useful work concurrently through shared WASM linear memory, with
retained equivalent TypeScript and single-instance WASM comparisons. Continue
through integration and focused end-to-end evidence.

Read first, in order:
1. ~/gh/foss-earth/.github/AGENTS.md and each affected repository's AGENTS.md.
2. docs/docs/proposals/implementation/webassembly-native-state.md, especially
   execution-settings feedback, measurements and ownership/toolchain sections.
3. docs/docs/proposals/implementation/webassembly-ab-handoff.md and the program
   plan docs/docs/proposals/webassembly.md, especially isolation, worker
   ownership, shared-memory publication, toolchain and pool budgeting.
4. native/README.md, native/toolchain.lock.json, actual Rust/wrapper/worker code.
5. docs/docs/proposals/implementation/webassembly-ab-results-2026-10-18.md and
   the raw evidence relevant to your selected workload.
6. docs/docs/ui-layout.md. The UI requirements are settled; do not redesign it.

Current facts, to verify rather than redo:
- Six app components: raster decoding, sky, terrain targets, imagery heights,
  Google preparation and ground BVH construction. Projections also run in the
  actual sphere preparation CLI with bounded windows for a 384 MiB source.
- All built WASM instances currently have private, unshared memories. SIMD
  flags exist; atomics/shared builds and a cooperating Rust thread runtime do
  not. Multiple existing workers provide independent-job parallelism only.
- Legacy native.tier=threaded currently falls back to TypeScript; it is NOT an
  implemented threaded backend. Never report it as one.
- The actual app's coarse sky placement and TS star batching reduce page task
  time; Rust arithmetic in the same worker has no established whole-app gain.
  Imagery sparse uploads removed gigabyte copies, but no speedup qualified.
  Terrain's many small jobs regressed from dispatch overhead. Ground's ~40%
  fixture query gain is spatial indexing; both query arms use TypeScript and
  WASM construction was slower. Shared memory/threads are not assumed faster.
- Native target preparation parity is exact; heights retain f64 interpolation
  because f32 changes slopes/plans. Keep reduction and operation order, realm
  Math behavior and exact f32 stores. No fast math or visual-quality reductions.
- Global default remains original TypeScript. Auto currently chooses TS sky
  workers and original TS elsewhere. Keep those choices until fresh evidence
  qualifies a change; do not change visual defaults.

Execution-settings contract (coordinate with the concurrently edited files):
- User-facing tab: Component execution. Sections: Global defaults and Components (settings plus real running
  state, diagnostics behind a trailing ? in both expanded/collapsed titles). Internal native tab/section IDs remain stable.
- native.tier retains legacy typescript|typescript-worker|single|auto|threaded;
  custom selects independent manual fields native.implementation=typescript|wasm,
  native.placement=original|worker, native.parallelism=auto|serial.
- Component mode is native.core.<component>=inherit|auto|custom, with legacy
  tiers still accepted. Its .implementation/.placement/.parallelism fields
  each accept inherit as well as the corresponding global values.
- Today serial limits raster/terrain independent-job pools to one worker each;
  auto permits their existing pools. These are NOT shared-memory thread counts.
  native.workers bounds the combined preparation-worker factories.
- nativeCorePlan() and componentExecution* helpers live in
  engine/src/settings/catalogue/native.ts; actual reports live separately in
  app/src/app/nativeReport.ts and the public foss-earth/native entry.
- When adding shared execution, extend the actual plan/report/capability
  contract explicitly. Distinguish requested/actual implementation, independent
  workers, cooperating thread count, shared memory, startup/pending work and
  fallback reasons. Do not relabel current worker pools as threaded WASM.
- UI appearance is being edited in ui/src/shell/choiceGroup.ts,
  ui/src/styles/ui.css, app/src/app/nativePanel.ts and app/src/app/nativePanel.css.
  Avoid those files during this parallel assignment. Document the new contract
  and integration point for the follow-on UI agent instead. Shared numeric
  runtime, engine worker protocols, app worker factories/budgeting and scoped
  isolation support are in your scope. Communicate if a boundary truly needs
  a shared file; never overwrite another session's edits.

Implement the architecture:
- Inspect installed tools and existing isolation/service-worker support before
  choosing a runtime. No toolchain/tool/browser installation is authorized.
  The recorded toolchain is stable Rust/cargo 1.99.0 and Binaryen 132; verify
  current installed state rather than assuming nightly/wasm-bindgen exists.
  If a new tool is essential, prepare the exact need and ask once; continue
  all useful work supported by installed tools. A doc saying threading is not
  implemented is current state, not a prohibition on implementing it.
- Choose a real coarse workload from current evidence (sky is a strong first
  candidate), with fixed disjoint work ranges and deterministic assembly.
  Preserve synchronous current-frame billboard positions and exact fallback.
  Avoid adding dispatch overhead to already tiny jobs.
- Supply a real shared WebAssembly.Memory/module build and bounded coordinator
  and cooperating workers. Correctly establish each worker's independent
  stack/TLS/runtime initialization and shared allocator/handle ownership; do
  not instantiate unsafely against overlapping globals or stacks. A thread
  feature flag alone does not provide a thread runtime.
- Define bounded input/output arenas and an atomic publication/ownership
  protocol. Publish only complete matching generations; prevent readers from
  observing partial writes or reused storage. Prove cancellation, retirement,
  stale replies, allocation limits and worker loss cannot corrupt or deadlock
  the remaining app. Never block the page with Atomics.wait or Rust locks.
- Use one host scheduling budget across existing workers and cooperating WASM
  threads; avoid a pool per component each taking all hardware threads. Record
  memory limits, copies avoided and copies still needed for renderer ownership.
- Establish required local isolation/capability checks and deployment-ready
  configuration without deploying. A browser that cannot share memory, failed
  startup/parity or worker loss must retain a usable bounded single/TS fallback
  and report why. Do not silently call fallback a threaded result. Avoid
  isolation reload loops and preserve cross-origin resource compatibility.
- Run the actual app integration in Earth, and verify shared composition in
  tour/fly. Keep fly-compatible exports out of foss-earth/runtime, which fly
  tests mock wholesale. Test only necessary changed paths, one heavy job at a
  time. Add adversarial ownership/concurrency checks before accepting results.

Evidence and delivery:
- Compare exact equivalent work: TS worker, private single WASM worker and
  actual shared threaded WASM. Include 1 vs multiple cooperating threads where
  useful; same source data, resolution, quality, batches and camera/time path.
- Assert parity first. Report requested and actual backend/thread counts,
  memory sharing, output hashes, startup, main-thread work, total latency,
  worker work, serialization/copies, memory and frame-time distributions.
  Use A/A controls; no unmeasured watts or assumed Rust/shared-memory speedup.
- Profile --no-watch, pin served source/artifacts and check sourceUnchanged.
  Do not edit any served code during a run. Dispose workers and normally close
  browsers in finally, including failures.
- Record exact launch URLs/harness commands, fallbacks and limitations. Keep
  native README, native state and the plan Status table current. Clearly mark
  what now runs threaded, what remains private/single, and any unqualified gains.
- Write a concise contract/results handoff for the UI follow-on agent and link
  it from the state document. Do not mark the full program complete after one
  component; a real integrated first component is the immediate milestone.

Working constraints:
- Shared dirty checkouts are edited concurrently. Record git status per repo
  before editing, re-read immediately before exact-string edits, and preserve
  all other work. Never stage, commit, push, deploy, discard others' work,
  create external repositories, use sudo, install tools or expose credentials.
- Scratch/logs/screenshots/profiles belong only in the owning ignored build/.
- Proceed autonomously through reversible implementation and necessary checks;
  do not stop to ask whether to continue between routine steps.
```
