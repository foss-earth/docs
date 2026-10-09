# FOSS Earth split: implementation agent

Status: executable implementation brief, 2026-10-08. This document does not
claim that extraction or repository creation has happened. Assign one primary
agent to the current FOSS Earth checkout. That agent is the sole integration
writer for it and owns the FOSS Earth extraction lane.

Start from the [parallel execution index](../../../navigation.md#retained-local-and-host-evidence).
The [coordinator](../../../navigation.md#retained-local-and-host-evidence)
assigns destinations and release gates. The separate
[platform agent](platform-agent.md) owns generic CI, installer and scaffold
implementation; this lane owns their use in Earth components.

## Assignment to give the agent

Implement the FOSS Earth portion of the repository split described below.
Keep globe, flight and campus behavior working as separately pinned consumers.
Publish small dependency-ordered component releases through the coordinator's
repository and history cutover procedure. Complete the shared contracts first
so the flight and UMN agents can integrate against concrete artifacts.

Read the current [AGENTS.md](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/AGENTS.md),
[tab inventory](../tab-inventory.md),
[image repository specification](../image-repositories.md),
[graph ownership notes](../repository-graphs.md),
[graph data](../repository-split-graph.json), and the cross-project
[split specification](../../../navigation.md#retained-local-and-host-evidence).
The image specification replaces the old single-panorama-repository proposal:
the top-level viewer is `foss-earth/360`.

The coordinator owns repository provisioning, writer assignments, identity
policy configuration, backups, publication of cleaned histories, protection
rules and any deletion/recreation decision. Deliver this lane's code, proposed
workflow callers, release candidates, provenance and audit results to that
process. Do not independently rewrite published histories, delete repositories
or push old refs into a new repository.

## Exclusive write scope and coordination

- Own the canonical FOSS Earth checkout (`../foss-earth` relative to the current
  0sfs checkout) and the new FOSS Earth
  component repositories assigned to this lane. The platform agent exclusively
  owns `foss-earth/ci`, `foss-earth/dev_installer` and generic policy/scaffold
  templates. Record the exact destination checkout
  before writing a module. New destinations must be provisioned or assigned by
  the coordinator; the current checkout is not a permanent staging monorepo.
- The flight agent owns changes inside 0sfs, including its imports and lockfile.
  The UMN agent owns changes inside UMN, including its imports and lockfile.
  Send export changes, migration instructions and candidate pins to those
  agents; do not edit their files concurrently. Shared defects are fixed here.
- Before editing, record `git status --short`, branch, HEAD, remotes, current
  exports and installed dependency identities. Preserve unrelated work. At
  drafting, `package.json`, `package-lock.json`, `src/diagnostics/index.ts` and
  untracked `src/diagnostics/drawing.ts` contained existing changes; recheck
  rather than assuming their content or staging them with this work.
- A child agent may implement an assigned destination after its interface is
  fixed, following the [component assignment template](../../../navigation.md#retained-local-and-host-evidence).
  Record one writer per checkout, branch and shared integration file.
  Child agents cannot all edit the old package's `package.json`, barrels,
  settings catalogue, app composition or lockfile. The primary agent integrates
  those edits. Use canonical checkouts; worktrees only for actual concurrency.
- Share a handoff for each gate: repository and package identities, exact
  candidate revision/artifact digest, exports and types, compatibility table,
  fixtures, migration steps, commands and retained check results. State which
  consumer can proceed and what is still incomplete.

## Repositories this lane must deliver

Repository slugs below are ownership decisions. npm package names, versions,
registry/release transport and local checkout paths must be recorded in the
coordinator's package map before adoption; a GitHub slug is not an npm import.

| Repository | Concrete first release |
| --- | --- |
| `foss-earth/engine` | Globe library: world coordinates, camera/input, terrain and map sources, surface queries, navigation, Map and Location integration. It composes renderer and optional scene/world features through public contracts. |
| `foss-earth/foss-earth.github.io` | Standalone globe composition, host settings/presets, scene selection, build/workspace manifests, deployment and Earth branding. It imports engine and other packages; it contains no second engine implementation. |
| `foss-earth/ui` | Window/tab lifecycle, widgets, settings registry and persistence/migrations, generic log/diagnostic/report presentation, Settings and Bug report views. Feature catalogues and concrete panels remain in their owner. |
| `foss-earth/renderer` | Device/backend/scene lifecycle, generic GPU resources, readiness and render scheduling; optional Renderer panel. No globe, scene-document or aircraft import. |
| `foss-earth/toolbar` | Bottom HUD layout, registered launchers/readouts and its Interface sections. Hosts supply values/actions; world navigation, geoid calculations and feature state stay outside. |
| `foss-earth/about` | Generic About presentation, graph/provenance schema, validator and accessible viewer. Adapt the existing graph generator/template into public tools. Each app supplies its own data. |
| `foss-earth/dev` | Shared `?dev=1` activation and diagnostic contribution lifecycle. Host-owned panels are registered explicitly. Activation does not start a server, capture, benchmark or simulation. |
| `foss-earth/sky` | Existing astronomy, clear atmosphere, stars, physical lighting and Sky/Date and time panels; renderer and terrain integration through supplied ports. Preserve current capability limits. |
| `foss-earth/weather` | Shared owner/contracts and extraction of existing manual wind settings/model with the flight agent. Do not interpret the weather proposal as implemented cloud, turbulence or provider functionality. |
| `foss-earth/images` | Common image records, JPEG/PNG helpers, orientation/color, transport/decode/cache and one session resource broker; pure core and separate browser/Node adapters. |
| `foss-earth/equirectangular` | Full 2:1 image schema/math, seam/pole behavior, estimates, loading, preparation and format GPU adapter. |
| `foss-earth/cubemap` | Whole six-face schema, pure face conventions/math, loading/preparation and GPU adapter. |
| `foss-earth/tiled-cubemap` | Six-face quadtrees, EAC and gnomonic warps, tile selection/cancellation/residency, gutters, atlas/display table, preparation and backend adapters. |
| `foss-earth/preview-sheets` | Sheet schema/packing/extraction, verification and shared source adapter with original-face fallback; consumes cubemap's pure conventions. |
| `foss-earth/360` | Built-in representation registration, selection, orb/immersion rendering and transitions, active-image and image-settings tabs, composition preparation CLI. |
| `foss-earth/scenes` | Version-1 envelope/schema, asset/entity references, placements/groups/links, scene replacement/history/navigation and Scenes tab; validation/tool composition uses representation hooks. |
| `foss-earth/docs` | Earth user/developer navigation, architecture, onboarding and cross-repository documentation index. Keep implementation contracts and runnable checks with their owners. |
| `foss-earth/research` | Earth research sources, hypotheses and experiment records, linked to exact implementation/evidence revisions. No runtime dependency. |
| `foss-earth/.github` | Earth contribution/agent policy and community defaults, instantiated from platform templates and coordinated with the actual per-repository workflows and rules. Defaults alone do not enable a required check. |

Consume `foss-earth/ci` and `foss-earth/dev_installer` from the platform lane.
Supply its Earth fixtures and requirements; own Earth workflow callers and the
Earth workspace manifest. Do not implement a second checker or installer.

Every current tab must still appear in the inventory after migration, with its
owner and preserved ID/context rules. Location and Map remain provisionally in
engine. Controls composes engine input and gamepad-tools; Interface composes UI
and toolbar; Settings and Bug report belong to UI; Date and time belongs to sky.
These recorded exceptions are not permission to omit their implementation.

Deferred TODO only: `foss-earth/search` is a proposed shared Search tab for all
hosts. Its search bar will index other registered tabs, settings and content,
and open each result's existing home. Search is not a current tab and must not
be added to the current tab count. Its implementation, contracts and extraction
are outside this assignment; retain the TODO without engineering it now.

[`foss-earth/vr`](../vr.md) is also deferred: shared VR will serve Earth,
UMN and flight, with aircraft-specific behavior in `0sfs/vr`. Neither VR repo
is part of this extraction/provisioning assignment or its acceptance criteria.
See the [Search TODO](../search.md) for the similarly deferred Search scope.

## Gate E0: inventory and shared contracts

Do this before consumers switch to extracted packages. Produce a checked-in
file/export ownership map, including scripts, shaders, CSS, assets, tests and
fixtures. A mixed file is split by responsibility; moving it whole must not
introduce a reverse dependency. Record every current package export and CLI
with a destination and temporary compatibility route.

Agree the following minimum interfaces with the flight and UMN agents. Exact
TypeScript identifiers may follow the existing implementation; publish their
actual declarations and fixtures rather than leaving consumers to invent them.

| Contract and owner | Required behavior | Consumers unblocked |
| --- | --- | --- |
| UI contributions, `ui` | Register stable tab/section/parameter IDs; inject one host settings registry, visibility/context lifecycle, commands and diagnostics; preserve saved workspace/presets and settings migrations. No app singleton or eager import of every panel. | Every feature panel in flight, globe and tour. |
| Scene/resources, `renderer` | One host renderer/device/backend and frame scheduler; create/dispose generic resources, request a frame, await mesh/resource readiness, reject stale generation completions. Optional panel is a separate entry point. Preserve actual supported WebGPU/WebGL paths. | Engine, sky, 360, image GPU adapters and flight visuals. |
| World/camera, `engine` | Coordinates and declared height datum, surface readiness/revision, navigation lease/camera state with momentum and user-input interruption, floating-origin adaptation where needed. Missing surface data stays explicit. | Flight ground/visual adapters, scenes, 360 host adapters and tour. |
| Clock/lighting, `sky` | Host-supplied scene time and lighting/ground-probe ports, explicit units and update generation. Terrain implements its own lighting adapter. | Globe assembly, flight instruments/weather, renderer adapters. |
| Image/plugin/broker, `images` | Asset/revision identity, representation validation/file enumeration/estimation hooks, source sampler, cancellation, reservations and release. One session broker accounts for aggregate encoded, decoded, GPU, staging and replacement overlap. | All four representations, 360 and scenes. |
| Viewer, `360` | Image inputs plus placement/camera/frame/action ports; readiness, enter/exit/current-image lifecycle; title/credits/link callbacks arrive as data. No scene entity resolver or globe import. | Scenes and UMN tour integration. |
| Scene document, `scenes` | Preserve version-1 schema and validators, unknown-projection handling, extension fallback, scene replacement/disposal and registered representation hooks. | Existing UMN content, import/preparation tools and globe examples. |
| About/release data, `about` | Typed consumer-to-dependency edges, installed versions/revisions/artifacts and licensing; distinguish runtime/content/tool/reference and optional availability. Exclude local paths, credentials and personal data. | Earth site, `0sfs/about`, `UMN-VR/about`. |
| Dev contribution, `dev` | Explicit URL activation, mount/unmount/dispose and host-injected observations/actions. Features retain their diagnostics. | Different flight, globe and campus Dev content. |
| Workspace, `dev_installer` | Versioned repo/artifact pins, safe relative paths, prerequisites/build order, optional content and exact selected package set; build-manifest projection shares assembly inputs with About. | Earth onboarding, flight wrapper and UMN caller. |
| Policy/checks, `ci` | Local/CI parity, full published-history and proposed commit-range modes, shallow-history failure, raw identity/trailer inspection, immutable caller revision. | All current and extracted repositories. |

Core contracts must load without React, DOM globals or renderer initialization.
Use separate optional entry points for panels, backend adapters and Node tools.
Do not replace circular imports with a giant shared mutable state object. Shared
Earth packages have no runtime, build or setup dependency on 0sfs or UMN.

Publish E0 candidate types, fixtures and a compiling minimal consumer before
calling a contract ready. Flight and UMN can extract their own domain/content
code concurrently; they must not guess unpublished Earth interfaces.
While the platform or another package is being prepared, keep making useful
progress on pure-code isolation, import maps, fixtures and compatibility
adapters in the existing checkout. Dependency readiness gates adoption, not
all independent work in this lane.

## Gate E1: consume policy and tooling foundations

Request an early checker candidate from the platform agent so newly created
repos start with enforcement. Use the coordinator's identity policy; all
contribution/agent instructions carry:

> YOU CANNOT HAVE AI AS A CO-AUTHOR, OR YOUR CONTRIBUTIONS WILL BE REJECTED.

Consume the shared checker for authors, committers and identity-bearing
attribution trailers, including co-authors. Give the platform agent Earth
history/merge fixtures without publishing personal data. Technical discussion
of an AI product is not an attribution error. Preserve genuine human authorship
and upstream/asset provenance. Report the configured identity mode and the
refs actually checked rather than claiming universal recognition of AI aliases.

Create per-repo workflow callers pinned to a reviewed immutable CI revision,
with component commands, explicit permissions and stable required check names.
Coordinate pre-integration enforcement and final merge-commit checking with the
coordinator. A post-push audit alone cannot reject a commit before integration.
Every Earth destination runs the shared consumer-conformance command through
its installed validation entry point, including docs, research, assets,
installers, CI and `.github`. Hand off policy/caller pins and positive/negative
attribution results for the coordinator's per-remote enforcement receipt.
Do not duplicate the validator or skip metadata jobs with changed-path filters.
Dirty legacy history may make the full audit fail: report it, and resolve it
through the coordinated cutoff; do not weaken the check to get a green badge.

Deliver the Earth workspace manifest to the platform installer: exact package
set/pins, prerequisites/build order, optional content and checks. Validate it
against the platform schema; test clean setup and resumption using that public
CLI. Include an Earth dirty-checkout fixture and verify no user work or evidence
is overwritten. `doctor` remains read-only diagnosis; system-tool installation
and servers are explicit actions. Report only tested OS support. Flight's
JSBSim default/native paths belong to the flight agent, not Earth's manifest.

## Gate E2: renderer, UI and globe composition

1. Extract UI settings/window primitives and renderer contracts. Split
   `src/settings/appSettings.ts` host construction from reusable registry;
   panels receive settings instead of falling back to `getAppSettings()`.
2. Separate generic device/scene/resources/readiness/scheduling from
   `src/engine/babylon/createBabylonRuntime.ts` and related terrain ownership.
   Engine adapts terrain/maps to renderer; renderer never imports engine.
   Keep one backend instance and frame scheduler across the application.
3. Split `src/shell/index.ts` feature exports and `WindowOverlay.tsx`
   composition. Inject Location providers, generic context/tab lifecycle and
   diagnostic contributions. Do not make UI import scenes, sky or flight.
4. Extract the bottom HUD into toolbar. Inject readouts/actions; preserve
   paragraph-grid wrapping, key ownership and input propagation to the world.
5. Move the globe library into engine and keep standalone app composition in
   the existing site. Establish engine/site package builds and public exports.
6. Extract About and Dev. About consumes supplied metadata, including each
   app's own graph; it never imports all the packages it describes. The globe
   host supplies Earth content, while other agents implement their About data
   adapters. Add `?dev=1` as specified and test activation/disposal.

E2 handoff: exact foundation package candidates, compatibility facade, tab and
settings fixtures, renderer/world adapter examples and evidence from the globe
host. Flight and UMN each validate their own consuming changes before E2 is
accepted across the workspace. Preserve runtime/resource identity: old and new
imports must resolve to the same registry/renderer implementation while the
facade exists, not initialize duplicate copies.

## Gate E3: image structures, 360 and scenes

Follow the [file-by-file image routing](../image-repositories.md#current-files-to-split).
Extract in dependency order: images and pure cubemap conventions;
equirectangular/cubemap implementations; tiled-cubemap and preview-sheets; 360
composition; scenes and document tooling. Renderer adapters consume E2.

Keep the following dependency direction explicit:

```text
scenes -> 360 -> representations -> images
scenes -> images
tiled-cubemap -> cubemap/core
preview-sheets -> cubemap/core
360 and representation GPU adapters -> renderer
```

Representation cores never import scenes, 360, engine or a backend. Pure schema
validation and CPU preparation do not create a GPU device. `images` owns the
broker, not a concrete representation catalogue. Preview sheets reuse cubemap
upload and have no independent GPU scheduler. EAC and gnomonic use the same
tiled structure with distinct tested coordinate mappings.

Split mixed resource/math/shader/tool files using the image spec. Preserve the
current CLI arguments for preparation and scene checking through compatibility
entry points. Keep source orientation applied once, linear-light resampling,
asset revision changes, face conventions, gutters and schema version semantics.
Application photographs, placements and YouVisit conversion stay UMN-owned.

Provide fixtures for every current representation and both tiled warps; include
preview-sheet fallback, unknown representations, seams/poles, orientation,
mixed LOD/ancestor fallback, failed sharper source, concurrent reservations,
late decode/upload after replacement and complete disposal. Move existing
behavior tests with their owners and retain composition tests that cross new
package boundaries. Do not discard a mixed test because its old path disappears.

E3 handoff to UMN: packaged viewer/scenes/preparation candidates, version-1
fixtures, exact asset/base-URL behavior, preserved tab IDs/context and saved
settings, and clean-consumer checks. Tour entry/interruption/exit must preserve
camera momentum and immediate input; closing the active-image tab still exits.

## Gate E4: sky and existing weather

Extract current sky code and the Sky/Date and time panels. Break the sky-to-
terrain-lighting import using injected lighting/ground-probe/render-request
ports; keep the terrain adapter in engine. One host clock drives both tabs.
Retain the existing illumination units, display normalization and capability
claims. Package extraction does not qualify an untested rendering tier.

For weather, agree a minimal shared field/settings contract with the flight
agent, then transfer the existing manual-wind definitions and shared panel to
this owner. The flight agent retains conversion to JSBSim and accepted-step
application. The current
[weather specification](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/docs/proposals/weather.md) contains separate future functionality
and validation stages; clouds, live providers, humidity qualification, hazards
and new turbulence are outside this extraction. If shared weather has only a
small implemented subset, label it explicitly and test that subset. Preserve
saved wind values and one settings home; no package gets an independent physics
loop or weather redraw timer.

## Gate E5: pins, docs and retirement of compatibility paths

For each package, deliver license/notices, asset provenance, source revision,
version/compatibility metadata, documented clean build and meaningful checks.
Use the coordinator's exact package/artifact pins and lockfiles. Local sibling
links are a development option; a release cannot depend on whichever branch a
developer happens to have checked out.

Maintain a compatibility ledger for today's `foss-earth` root/subpath/CSS
exports and script commands. Temporary facades forward to canonical owners and
declare removal conditions. A facade must not make a new leaf package depend
on the old umbrella package. Remove each compatibility route only after all
known consumers have migrated and validated. Verify packed artifacts include
declarations, CSS, shaders, schemas and data at usable URLs; no checkout-relative
deep imports or unpublished files may be required.

Move broad Earth guidance/indexes into docs and research material into research;
keep component contracts, implementation tests and evidence with their owners.
Preserve source/evidence links and add redirects/index entries when paths move.
Update the tab inventory and dependency data to distinguish shipped packages
from pending proposals. Generate graph artifacts through the shared tool;
coordinate app-owned dataset changes with their writers.

## Validation and completion

Follow each owner's AGENTS and existing check commands. In the current checkout,
after source changes run `npm run typecheck`,
`npx vitest related --run <changed files> --maxWorkers=50%`, and `npm run lint`.
Run `npm run ci` once when the lane's completed change is ready. Record output
under dated `build/` folders; coordinate the machine-wide full-suite slot and
rerun only a failing test when investigating. New owners need equivalent
documented checks; do not use `--passWithNoTests` as evidence of extraction
coverage. Fixtures read from disk must be in the appropriate rerun triggers.

Required behavioral checks include settings/workspace migration, all tab IDs
and context rules, UI input propagation, renderer readiness and idle scheduling,
camera handover, resource cancellation/disposal, image contracts, CLI output
and package-only consumer builds. Have the flight and UMN owners run their
consumer checks against exact candidates and return their results. Coordinate
app integration rather than starting three competing full suites on the Mac.
Do not start servers or run GPU benchmarks/WASM builds solely for a split.
Use existing bounded/headless harnesses when an authorized integration check
needs them; follow clean browser shutdown and evidence policies.

Completion means every assigned package has a usable first release, the globe
site builds from pins, both downstream consumers have accepted their necessary
interfaces, and no duplicate implementation or reverse ownership dependency
remains. Report unresolved behavior failures and pending cutover separately;
neither a successful directory move nor an empty repository counts as delivery.
The final handoff includes source-to-owner map, actual pins, compatibility
ledger, test/evidence paths, authorship audit scope/results and remaining
coordinator publication actions. Commit only intended changes with genuine
human metadata and no AI attribution trailers.

Writing or reviewing this brief alone is documentation-only work: check links
and formatting; it does not require app tests or builds.
