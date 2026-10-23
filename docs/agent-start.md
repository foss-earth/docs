# Agent task index

Read the target repository's `AGENTS.md` and its organization's `.github/AGENTS.md`.
Then inspect README headings, `package.json` scripts/exports, and relevant source.
Open only the guides selected by the task. This index covers all three organizations;
the checked-out code and package exports are authoritative over historical proposals.

| Need | Start here |
| --- | --- |
| A small index of any local repo | `node ~/gh/foss-earth/docs/scripts/agent-context.mjs <repo-path>` |
| Local checkout setup / source vs packages | [setup](../setup.md), target README's Development section |
| Globe component ownership | [repository navigation](../navigation.md#component-owners) |
| UI / layout | [UI layout](ui-layout.md) (select the relevant heading) |
| Camera / navigation / touch | [physical UX](physical-ux.md), [camera motion](camera-motion.md) |
| Scheduling / performance | [render on demand](render-on-demand.md), [performance](performance.md) |
| TypeScript / Rust / WASM twins | [core index](webassembly-cores.md), target repo's twin instructions |
| Custom test link / returned feedback file | [test feedback](test-feedback.md) |
| Browser screenshots | [screenshot guide](https://github.com/foss-earth/browser-testing/blob/main/docs/screenshots.md) |
| Publish explicitly requested | [deployment](deploying.md), target README |
| Previous agent conversation supplied | [conversation reader](agent-conversations.md) |
| Recorded incidents / failures | [incident index](incidents/README.md) |

Local layout is `~/gh/<organization>/<repository>`; 0SFS is normally `~/gh/0sfs`.
Sibling paths are conveniences, not required dependencies. If a checkout is missing,
use the corresponding GitHub repo's README and public exports. Do not read every repo.

| Task / responsibility | Owning repository (under the named organization) |
| --- | --- |
| Organization-wide instructions and contribution policy | `0SFS/.github`, `foss-earth/.github`, `UMN-VR/.github` |
| Earth app / shared application composition | [foss-earth/app](https://github.com/foss-earth/app) |
| Earth website assembly / hosting | [foss-earth/foss-earth.github.io](https://github.com/foss-earth/foss-earth.github.io) |
| Geography, maps, terrain, globe camera and input | [foss-earth/engine](https://github.com/foss-earth/engine) |
| GPU, renderer, resources and frame scheduling | [foss-earth/renderer](https://github.com/foss-earth/renderer) |
| Settings, windows, shared controls, diagnostics and test feedback | [foss-earth/ui](https://github.com/foss-earth/ui) |
| HUD and toolbar | [foss-earth/toolbar](https://github.com/foss-earth/toolbar) |
| Build versions, provenance and About | [foss-earth/about](https://github.com/foss-earth/about) |
| Dev tab and injected diagnostic views | [foss-earth/dev](https://github.com/foss-earth/dev) |
| Scenes, placements and image navigation | [foss-earth/scenes](https://github.com/foss-earth/scenes) |
| Image viewer, structures, previews and common services | `foss-earth/sphere-image`, `sphere-equirectangular`, `sphere-cubemap`, `sphere-tiled-cubemap`, `rectangle-image`, `preview-sheets`, `images` |
| Atmosphere / astronomy / manual wind | `foss-earth/sky`, `foss-earth/weather` |
| Native/WASM integration | `foss-earth/native`; individual cores stay with their component owners |
| Reusable browser automation / screenshots | [foss-earth/browser-testing](https://github.com/foss-earth/browser-testing) |
| Shared CI / install tools | `foss-earth/ci`, `foss-earth/dev_installer`; other orgs have their own wrappers |
| Cross-repository guides / research | `foss-earth/docs`, `foss-earth/research`, `foss-earth/experiments` |
| Flight app, routes, JSBSim composition and HUD | [0SFS/fly](https://github.com/0SFS/fly) |
| Aircraft systems / aircraft assets | `0SFS/aircraft`; `C172`, `F-35B`, `SF-50` |
| Engines and their assets | `0SFS/engines`; `F135`, `FJ33`, `IO320` |
| Flight feature libraries | `0SFS/autopilot`, `controls`, `engine-sound`, `exhaust`, `fuel`, `g-forces`, `ground-contact`, `logging`, `rc`, `sound`, `wind-noise` |
| Flight site / guides / research | `0SFS/0sfs.github.io`, `0SFS/docs`, `0SFS/research` |
| JPEG codec fork | `0SFS/jpeg-js` (keep upstream API/attribution) |
| Campus tour app and pages | [UMN-VR/tour](https://github.com/UMN-VR/tour) |
| Independent campus runtime / content | `UMN-VR/app`, `minneapolis`, `st-paul`, `twin-cities` |
| Club site | [UMN-VR/UMN-VR.github.io](https://github.com/UMN-VR/UMN-VR.github.io) |
| Org-specific About / tooling / branding | Each org's `about`, `browser-testing`, `dev_installer`; `0SFS/dev`, `ci`, `logo` |

For an unfamiliar repo, the context command below lists its README headings, scripts,
exports and documentation filenames without loading document bodies. Search relevant
source with `rg`; consult dependencies only when the task crosses their public contract.

When extending this system, keep universal rules in the small entry point and detailed
rules with their owning code or linked guide. Add a trigger row when adding a guide.
Preserve unique repo safeguards (for example, the tour's private backup and generated
scene rules). Do not replace them with a generic template.
