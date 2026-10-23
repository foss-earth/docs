# foss-earth/docs

Cross-repository documentation for FOSS Earth: navigation, architecture notes,
UI and camera rules, development and deployment guidance, proposals and
validation notes. Component specifications live in the repository that
implements the component. This repository has no application build and no
runtime exports.

See the other repositories at https://github.com/foss-earth.

## Documents

Start here:

- [Agent task index](docs/agent-start.md): concise navigation across all three organizations; inspect a repo with `node scripts/agent-context.mjs <path>`.
- [Custom test links and feedback](docs/test-feedback.md): checklist, notes and selected diagnostics in one downloadable file.

- [Follow-ups](docs/todo.md): work across the Earth repositories that isn't done yet, including WebAssembly builds.
- [Performance](docs/performance.md): the bit-identical JavaScript speedups, the frame-budget streamgraphs, and what is left.
- [Performance audit](docs/performance-audit.md): what the tour, the app and 0SFS cost to start and to run, in frames, CPU and memory, and how to measure it again.
- [Optimization backlog](docs/optimization-backlog.md): every optimization not done yet, for FOSS Earth, 0SFS and the UMN tour, ranked by estimated gain against effort, by backend.
- [Incident reports](docs/incidents/README.md): failures, observed evidence, recovery actions and unresolved causes.
- [Repository navigation](navigation.md)
- [Checkout setup](setup.md)
- [Migration notes](migration.md)

Guides and rules:

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

Proposals:

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
- [Implementation brief: Earth agent](docs/proposals/implementation/earth-agent.md)
- [Implementation brief: platform agent](docs/proposals/implementation/platform-agent.md)
- [Implementation brief: startup loading agent](docs/proposals/implementation/startup-loading-agent.md)
- [Implementation brief: WebAssembly agent](docs/proposals/implementation/webassembly-agent.md): gates W0–W12, repository ownership, proof and acceptance checks

Other:

- [CI correctness and performance follow-up prompt](docs/ci-correctness-performance-followup-prompt.md)
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
