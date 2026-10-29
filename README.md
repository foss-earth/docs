# foss-earth/docs

Cross-repository documentation for FOSS Earth: navigation, architecture notes,
UI and camera rules, development and deployment guidance, proposals and
validation notes. Component specifications live in the repository that
implements the component. This repository has no application build and no
runtime exports.

See the other repositories at https://github.com/foss-earth.

## Documents

Pages are grouped below into Current guides, open Proposals, and an Archive of session briefs and records.

Start here:

- [Documentation layout](docs/documentation-layout.md): where a page belongs among Current guides, Proposals, and Archive records.
- [Agent task index](docs/agent-start.md): concise navigation across all three organizations; inspect a repo with `node scripts/agent-context.mjs <path>`.
- [Custom test links and feedback](docs/test-feedback.md): checklist, notes and selected diagnostics in one downloadable file.

Current:

Durable guides and rules.

- [Repository navigation](navigation.md)
- [Checkout setup](setup.md)
- [Migration notes](migration.md)
- [Physical UX](docs/physical-ux.md): direct grabs vs. two-finger impulses, exponential pan and zoom inertia, and FOV-tangent scaling across the globe and 360 spheres
- [Camera motion](docs/camera-motion.md)
- [UI layout](docs/ui-layout.md)
- [Render on demand](docs/render-on-demand.md)
- [Development](docs/development.md)
- [Testing as an agent](docs/agent-testing.md): desktop, phone and tablet shots with touch steps, and the VR headset emulator and its checks
- [WebAssembly cores](docs/webassembly-cores.md): the TypeScript and Rust twins, where each lives, the apps' execution settings and the toolchain
- [Read previous agent conversations](docs/agent-conversations.md): local Claude/Codex JSONL reader, session discovery, search and bounded excerpts
- [Deploying](docs/deploying.md)
- [CI/CD](docs/ci-cd.md)
- [Manual QA](docs/manual-qa.md)
- [Checks on a real GPU](docs/validation/README.md)
- [Chrome code-sign clones](docs/validation/chrome-code-sign-clones.md)
- [Terrain proximity LOD](docs/validation/terrain-proximity-lod.md): shipped proximity and line-of-sight behavior, with the 20 October 2026 measurements. Retained numbers are in [validation/evidence](validation/evidence/terrain-proximity-lod/2026-10-20/summary.json).
- [Performance](docs/performance.md): the bit-identical JavaScript speedups, the frame-budget streamgraphs, and what is left.
- [Performance audit](docs/performance-audit.md): what the tour, the app and 0SFS cost to start and to run, in frames, CPU and memory, and how to measure it again.
- [Optimization backlog](docs/optimization-backlog.md): every optimization not done yet, for FOSS Earth, 0SFS and the UMN tour, ranked by estimated gain against effort, by backend.
- Dated runs: [engine/docs/performance](https://github.com/foss-earth/engine/tree/main/docs/performance), one folder per day.
- Benchmark reports: [research/benchmarks](https://github.com/foss-earth/research/tree/main/benchmarks).
- [Incident reports](docs/incidents/README.md): failures, observed evidence, recovery actions and unresolved causes.
- [Follow-ups](docs/todo.md): work across the Earth repositories that isn't done yet, including WebAssembly builds.

Proposals:

Design records. A page stays here until a Current guide describes the behavior. Session briefs that implement these designs are in the Archive.

- [Human and agent documentation system](docs/proposals/documentation-system.md): shared generation, scripted images/animations, agent reference and rollout across Earth, 0SFS and UMN-VR
- [Shared image viewer implementation specification](docs/proposals/shared-image-viewer-implementation.md)
- [Shared image viewer implementation status](docs/proposals/shared-image-viewer-status.md)
- [Image repositories](docs/proposals/image-repositories.md)
- [Repository graphs](docs/proposals/repository-graphs.md), with the [graph](docs/proposals/repository-split-graph.html) and its [JSON data](docs/proposals/repository-split-graph.json)
- [Search](docs/proposals/search.md)
- [Settings](docs/proposals/settings.md)
- [Startup loading](docs/proposals/startup-loading.md): instant feedback, a boot terminal, code on demand, renderer advice
- [WebAssembly builds](docs/proposals/webassembly.md): shared memory, Rust cores per map family, ranked steps
- [Adaptive CPU scheduling](docs/proposals/adaptive-cpu-scheduling.md): shared compute admission, optional topology hints, full-capacity recovery and energy qualification
- [Tab inventory](docs/proposals/tab-inventory.md)
- [VR](docs/proposals/vr.md)
- [Accounts and hosted basemaps](docs/proposals/accounts-and-hosted-basemaps.md): shared sign-in for Earth, the tour, and flight, and Google 3D Tiles without a device key
- [JIT code download](docs/proposals/jit-code-download.md): bandwidth-gated download and prefetch that keeps the first frame ahead of later features; the canonical spec
- [Scenes photograph grid](docs/proposals/scenes-photograph-grid.md): one photograph grid, a mini 360 viewer, and the opening look for the Scenes tab
- [Terrain view, proximity, and priority LOD](docs/proposals/terrain-view-proximity-priority-lod.md): view-direction detail separated from proximity detail; proximity and line-of-sight are implemented, and the weighted-priority architecture remains proposed

Archive:

Session briefs and records, not current procedure.

Implementation briefs in [docs/proposals/implementation/](docs/proposals/implementation/):

- [Earth agent](docs/proposals/implementation/earth-agent.md): extraction lane for the FOSS Earth split, 8 October 2026
- [Platform agent](docs/proposals/implementation/platform-agent.md): shared CI and the developer installer for that split
- [Startup loading agent](docs/proposals/implementation/startup-loading-agent.md): answer a click at once and reach the 3D scene sooner
- [WebAssembly agent](docs/proposals/implementation/webassembly-agent.md): gates W0–W12, repository ownership, proof and acceptance checks
- [W0 state](docs/proposals/implementation/webassembly-w0-state.md): what the Google Earth comparison gate implemented, and what a fresh session still has to resolve
- [WebAssembly A/B handoff](docs/proposals/implementation/webassembly-ab-handoff.md): finish the useful Rust and WebAssembly paths for comparison, 17 October 2026
- [WebAssembly A/B resume](docs/proposals/implementation/webassembly-ab-resume.md): continue from the measured Rust and WebAssembly integration, 18 October 2026
- [WebAssembly A/B results, 18 October 2026](docs/proposals/implementation/webassembly-ab-results-2026-10-18.md): WASM app comparison, with launch URLs, commands, and evidence
- [WebAssembly state](docs/proposals/implementation/webassembly-state.md): Rust and WebAssembly progress, evidence, and known gaps, updated 19 October 2026
- [Shared-memory handoff](docs/proposals/implementation/webassembly-shared-memory-handoff.md): implement shared-memory multithreaded WebAssembly, 18 October 2026
- [WebAssembly UI handoff](docs/proposals/implementation/webassembly-ui-handoff.md): finish Component execution after the shared-memory integration; marked done 19 October 2026
- [Shared-memory UI handoff](docs/proposals/implementation/webassembly-shared-memory-ui-handoff.md): contract and results for the Component execution UI
- [Adaptive CPU scheduling state](docs/proposals/implementation/adaptive-cpu-scheduling-state.md): continuation for the scheduling task, 20 October 2026
- [Terrain proximity LOD agent](docs/proposals/implementation/terrain-proximity-lod-agent.md): line-of-sight and proximity workhorse spec; implemented 20 October 2026
- [Performance agent state](docs/proposals/implementation/performance-agent-state.md): resume a performance session from this file, updated 22 October 2026
- [Performance cloud runs](docs/proposals/implementation/performance-cloud-runs.md): timed browser runs for a cloud VM
- [Headset suites](docs/proposals/implementation/headset-suites.md): contract for the automated Quest and Vision Pro visits
- [Compact controls handoff](docs/proposals/implementation/ui-compact-controls-handoff.md): fix compact-control violations across the UI, 18 October 2026
- [Slider handle field handoff](docs/proposals/implementation/slider-handle-field-handoff.md): help last, tracks on demand, and a field for the handle, 19 October 2026
- [Sky lens flare handoff](docs/proposals/implementation/sky-lens-flare-handoff.md): opt-in glare, starburst, and ghosts for the Sun, 25 October 2026

Other records:

- [CI correctness and performance follow-up prompt](docs/ci-correctness-performance-followup-prompt.md): complete CI dependency coverage and reduce expensive test setup, 8 October 2026
- [Performance ledger](docs/performance-ledger.md): every optimization shipped, rejected, held, waiting, or still open from 12 October 2026 on
- [VS Code ripgrep saturated the CPU](docs/incidents/2026-10-11-vscode-ripgrep-cpu.md): package discovery, 11 October 2026; recovered, trigger unresolved
- [Map loading recovered after clearing browser data](docs/incidents/2026-10-11-map-loading-browser-data.md): 11 October 2026; cause unconfirmed
- [npm install looped in about](docs/incidents/2026-10-11-npm-install-loop.md): resolver loop from inconsistent cached versions, 11 October 2026

Other:

- [link-routing.json](link-routing.json): maps document links that point at other repositories.

## Development

This package has no dependencies. Its npm scripts are:

```sh
npm run check:links   # check relative links in the documents
npm run test:source   # node --test on fixtures/*.test.mjs
npm run check:source  # both of the above
```

## Project policies

- [Code of conduct](https://github.com/foss-earth/.github/blob/main/CODE_OF_CONDUCT.md)
- [Contributing](https://github.com/foss-earth/.github/blob/main/CONTRIBUTING.md)
- [AGPL-3.0 license](LICENSE)
- [Security](https://github.com/foss-earth/.github/blob/main/SECURITY.md)
