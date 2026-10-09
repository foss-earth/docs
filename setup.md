# Independent checkout and release preparation

`foss-earth/docs` is an independent repository. It needs no application source,
archive checkout, or sibling `node_modules` directory. A clone lives at
`<workspace>/foss-earth/docs`; the organization directory groups checkouts and
is not a Git repository. The globe application lives separately at
`<workspace>/foss-earth/foss-earth.github.io`; Flight at
`<workspace>/0sfs/simulator`; Campus at `<workspace>/UMN-VR/tour`.

The [developer installer](https://github.com/foss-earth/dev_installer) owns setup
orchestration. Applications own their manifests; Docs and Research do not create
an alternative installer. Its public `foss-earth-workspace` contract supports
source, exact-package and hybrid selections, with one actual provider checkout
and public package exports. The source/hybrid increment still needs its own
checked release. Use only an accepted installer descriptor and exact source or
archive pins; a package name/version by itself does not identify release bytes.
Keep developer-link output qualification separate from immutable archive proof.

## This owner

Docs owns user/developer navigation and broad architecture guidance. Component
specifications belong in their implementation repositories; research tools and
retained measurements belong in Research. There is no application build and no
runtime export. The [historical development page](docs/development.md) records
the original single-checkout setup and does not define the split app bootstrap.
For the current app setup, use the
[globe application](https://github.com/foss-earth/foss-earth.github.io) and its
accepted Earth-owned workspace manifest.

Install the exact reviewed common CI archive into this checkout through the
accepted setup contract. Source/document qualification after a granted slot is:

```sh
npm run check:source
npm run check:conformance
npm run check:attribution
```

`check:source` checks recorded routes, current navigation/community files and
small Node source fixtures. It fetches no links and launches no browser or
server. `check:attribution` requires the primary-prepared complete intended
publication heads/tags at `build/repository-split/intended-publication-refs.json`;
an empty scope is not a successful final audit. Docs-only edits need no app
TypeScript or bundle build. After resealing the archive, prepare `DOCS_CONSUMER_ARCHIVES`, a JSON file with
`version: 1` and one `packages` row naming Docs 0.1.0 plus its `archive`,
`sha256` and `bytes`; the archive path is relative to that JSON. Then qualify
the complete packaged byte map and independent installed documentation consumer:

```sh
DOCS_CONSUMER_ARCHIVES=build/reviewed-consumer-closure.json npm run test:consumer
```

The fixture copies the sealed archive, installs it offline with scripts disabled,
compares every installed file with the archive, checks its actual navigation and
source fixtures and proves an outside-workspace negative control. It packs no
source and reads no sibling checkout. Current fixture preparation is UNRUN.

## Release evidence and recovery

Current source preparation ran none of the commands above. Preserve every prior
log, archive and receipt with its original paths and byte seals. Relocation did
not make those receipts current-layout checks. The primary must bind the next
source commit, full packaged file map, export or document URLs, exact shared
policy/caller, installed-consumer result and remaining rights limitations before
release. The coordinator separately verifies remote admission and publication.

The original app archives are read-only recovery inputs. Restore a reviewed
source input from its recorded original revision/blob if necessary; do not reset
or clean an archive, overwrite dirty source, or discard ignored evidence.

- [Migration state](migration.md)
- [Contributing](CONTRIBUTING.md)
- [Public owner navigation](navigation.md)
