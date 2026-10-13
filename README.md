# foss-earth/docs

Cross-repository documentation for FOSS Earth: navigation, architecture notes,
UI and camera rules, development and deployment guidance, proposals and
validation notes. Component specifications live in the repository that
implements the component. This repository has no application build and no
runtime exports.

See the other repositories at https://github.com/foss-earth.

## Documents

Start here:

- [Follow-ups](docs/todo.md): work across the Earth repositories that isn't done yet, including WebAssembly builds.
- [Performance](docs/performance.md): the bit-identical JavaScript speedups, the frame-budget streamgraphs, and what is left.
- [Incident reports](docs/incidents/README.md): failures, observed evidence, recovery actions and unresolved causes.
- [Repository navigation](navigation.md)
- [Checkout setup](setup.md)
- [Migration notes](migration.md)

Guides and rules:

- [Camera motion](docs/camera-motion.md)
- [UI layout](docs/ui-layout.md)
- [Render on demand](docs/render-on-demand.md)
- [Development](docs/development.md)
- [Deploying](docs/deploying.md)
- [CI/CD](docs/ci-cd.md)
- [Manual QA](docs/manual-qa.md)
- [Checks on a real GPU](docs/validation/README.md)
- [Chrome code-sign clones](docs/validation/chrome-code-sign-clones.md)

Proposals:

- [Image repositories](docs/proposals/image-repositories.md)
- [Repository graphs](docs/proposals/repository-graphs.md), with the [graph](docs/proposals/repository-split-graph.html) and its [JSON data](docs/proposals/repository-split-graph.json)
- [Search](docs/proposals/search.md)
- [Settings](docs/proposals/settings.md)
- [Tab inventory](docs/proposals/tab-inventory.md)
- [VR](docs/proposals/vr.md)
- [Implementation brief: Earth agent](docs/proposals/implementation/earth-agent.md)
- [Implementation brief: platform agent](docs/proposals/implementation/platform-agent.md)

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
