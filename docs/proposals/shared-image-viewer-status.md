# Shared image viewer: implementation status

This records progress against the
[shared image viewer implementation specification](shared-image-viewer-implementation.md).
It keeps the local package migration and the hosted repository migration apart,
as section 3 of the specification requires. Nothing below is committed, packed
for release or published unless a line says so.

## Stage A: ownership and package names

### Local and package migration: done in the working trees, uncommitted

The table shows the current names. Stage A first used `panorama-*` and
`flat-image`; see [Naming: sphere and rectangle](#naming-sphere-and-rectangle).
The check lists of Stages A and B keep the names used when they ran.

| Repository directory | Package before | Package now |
| --- | --- | --- |
| `sphere-image` | `@foss-earth/360` | `@foss-earth/sphere-image` |
| `sphere-cubemap` | `@foss-earth/cubemap` | `@foss-earth/sphere-cubemap` |
| `sphere-equirectangular` | `@foss-earth/equirectangular` | `@foss-earth/sphere-equirectangular` |
| `sphere-tiled-cubemap` | `@foss-earth/tiled-cubemap` | `@foss-earth/sphere-tiled-cubemap` |
| `rectangle-image` (new) | none | `@foss-earth/rectangle-image` |

- No package is kept under an old name. Stage A first added `compat` packages
  under the old names that re-exported the new ones; they were removed, and the
  consumers moved to the new names instead (see
  [Consumers of the old names](#consumers-of-the-old-names)). The
  `foss-earth-prepare-panorama` command comes from `@foss-earth/sphere-image`.
- `rectangle-image` is a new local Git repository (`main`, no commits yet). It owns
  the rectangle representation record, its validator and schema, plane and texel
  conventions, the size estimate, the native-size loader, the 2D upload adapter
  and the shader fragments.
- `images` gained the `image` role, `RectangleImageAsset`, a role list on the
  common representation check (sphere roles by default, so sphere
  validators still refuse anything without a cube preview), and the
  `loadWholeImage` lifecycle shared by rectangle and equirectangular loading.
- Current consumers import the new names: `app`, `scenes`, `preview-sheets`,
  the `engine` composition fixture and the documentation in each. `app`'s
  lockfile was regenerated with `npm install`. No other repository has a
  lockfile naming these packages.
- `@foss-earth/sphere-image`'s root and `./core` entries reach no DOM,
  Babylon, renderer, ui or engine import at any depth, and import in plain
  Node.

Serialized values did not change. The asset type `panorama-image`, the projections
`equirectangular`, `cube` and `tiled-cube`, scene schemas, asset revisions and
media URLs are as before. Each sphere schema keeps its `$id`:

- `https://github.com/foss-earth/cubemap/schema/representation.json`
- `https://github.com/foss-earth/equirectangular/schema/representation.json`
- `https://github.com/foss-earth/tiled-cubemap/schema/representation.json`

The new rectangle schema's `$id` is
`https://github.com/foss-earth/rectangle-image/schema/representation.json`.

### Checks run

These ran while the `compat` packages existed; the old-name checks below
describe packages that are now removed.

- Library suites, run from source: `images` 156 tests, `flat-image` 16,
  `image-viewer` 112, `panorama-equirectangular` 34, `panorama-cubemap` 32,
  `panorama-tiled-cubemap` 73, `scenes` 122, `preview-sheets` 75, `engine` 932,
  `renderer` 313. Each matches its count before the change plus the new tests.
  `ui` has the same 7 failures it had before (in `tests/injected-widgets.test.tsx`
  and `src/browser/theme.test.ts`); Stage A does not touch `ui`.
- Lint and consumer typechecks pass in each renamed and new repository.
- `app`: typecheck, lint, 196 tests and the production `vite build` pass.
- Isolated consumers: the canonical and old-name packages were packed with
  `npm pack`. They were installed offline into two fresh workspaces, one per
  set of names, from those archives alone, with no optional peer present.
  Neither Node nor TypeScript could resolve anything outside the workspace.
  - Every pure entry imports with DOM globals trapped.
  - Every old-name entry returns the same module instances as its canonical
    entry.
  - Old and new schemas are byte-equal.
  - The preparation command runs through the canonical entry, the installed
    bin, and `@foss-earth/360/prepare-cli` resolved by path as UMN-VR does.
  - A consumer of the old-name subpaths UMN-VR imports typechecks, as does one
    of the new names.
  - Entries that need an optional peer at import (`./babylon`, `./resources`,
    `./globe`, `./globe-browser` and the tiled `./babylon`) fail in the same
    way under both names.

  The harness is `build/harness/consumer-check.mjs` in the local org checkout.
  Its receipts stay under the gitignored `build/`.

### Hosted migration: repositories renamed, unpublished

The hosted repositories and local directories now use the sphere and rectangle
names. Nothing was published or attached to a release.

- `foss-earth/360` is `foss-earth/sphere-image`. Its directory is `sphere-image`,
  its package is `@foss-earth/sphere-image`, and `repository.url` points at
  `https://github.com/foss-earth/sphere-image.git`.
- `foss-earth/cubemap` is `foss-earth/sphere-cubemap`.
- `foss-earth/equirectangular` is `foss-earth/sphere-equirectangular`.
- `foss-earth/tiled-cubemap` is `foss-earth/sphere-tiled-cubemap`.
- `foss-earth/rectangle-image` exists. Its directory is `rectangle-image`.
- Each renamed repository's `repository.url` and the app's `file:../` paths
  follow those names. GitHub redirects the old repository names.
- Nothing was published or attached to a release.

### Consumers of the old names

- **UMN-VR `tour`** builds the campus tour from the local `foss-earth` app. Its
  source imports no renamed package. Its `package-lock.json` was regenerated
  (`npm install --package-lock-only`), so the app's dependencies read
  `image-viewer`, `sphere-*` and `rectangle-image`, and its README names
  `foss-earth-prepare-panorama` from `@foss-earth/image-viewer`. Its
  typecheck, lint, 38 tests (1 skipped) and production build pass.
- **0sfs `fly`** also installs the local app. Its lockfile was regenerated the
  same way. It imports no renamed package, and its typecheck passes. Its
  tests: 2143 pass and 3 fail, and none of the 3 involves a renamed name.
  `stowedGearHitch.test.ts` is uncommitted local work, not part of this
  change. `createFlightHudBar.test.ts` expects the map label "Google 3D
  Tiles", but the engine's committed source shows the short label "3D Tiles".
  `createFlightSimApp.test.ts` expects an older imagery-limit line still in
  the log after a newer one. The log's code was not changed here. `about`
  and `dev` import no renamed package or identifier.
- **UMN-VR `app`** pinned hash-named archives of the old packages
  (`@foss-earth/360`, `cubemap`, `equirectangular`, `tiled-cubemap`). Stage E
  adopts rebuilt archives through that workflow. The old files and their
  hashes stay. The source changes are listed under
  [UMN-VR edits at adoption](#umn-vr-edits-at-adoption).
- **research** is excluded from the migration. Its own `node_modules` holds
  installed copies of `@foss-earth/cubemap` and `equirectangular` from before
  the rename, and it imports only names that did not change. It was neither
  edited nor run; moving it to the new package names is left to its owner.

### Local cleanup owed

`/Users/felg/gh/foss-earth/node_modules` holds symlinks into
`app/node_modules` so that library suites resolve their dependencies when run
from source. It is not part of any repository. Remove the symlinks when they
are no longer needed; the directory's older `.vite` and `.vitest` caches
predate them.

## Stage B: shell and surface foundation

Done in the working trees of `ui`, `app`, `engine`, `sky` and
`image-viewer` (`360`), uncommitted.

### Tabs and windows (`ui`)

- **Canonical logical state.** A committed workspace snapshot
  (`createWorkspaceSnapshotStore`) holds both logical sides with their tabs,
  selections, context-hidden tabs, explicit collapse and the focused side. It
  gets a new revision only when something changed, and its snapshots are
  frozen. The window overlay handle exposes it as `workspace`.
  - Compact folding no longer moves a tab that is opened while its side is
    folded: the tab goes to its home side, and the fold only changes what is
    shown.
  - `openTabInSlot(tabId, side)` opens a newly registered tab on the side that
    asked for it and selects it there. A tab that is already open is selected
    where it is.
- **Surface tabs.** A tab definition can declare a `surface` with an optional
  `joinGroup`. Its body has no padding, no scrolling and no preset-save footer.
- **Joined bodies.** When the selected tab on each expanded side declares the
  same join group, the two bodies become one rectangle under both tab strips.
  - The rectangle spans the gap between the columns.
  - It starts at the usable height under the strips, capped so it stays on
    screen. Resizing the group changes that height for the session.
  - Saved window sizes are left as they were.
- **Log during a join.** The floating log is hidden for the length of a join
  and the Log tab is present, on the side it last occupied or else the left.
  The Log tab is not selected and no image tab moves. The layout's
  `floatingLog: false` gives the column arrangement at every width. When the
  join ends, the arrangement that sizes alone choose comes back, including a
  floating log where one fits, with the saved log width.
- **Measured surfaces.** `observeSurfaceGeometry(body, canvas)` publishes
  `SurfaceGeometry`, the specification's shape:
  - It is clipped to the canvas, and framebuffer edges round independently,
    so neighbours share pixel edges.
  - Resizes, page resizes and scrolling commit a new revision. A frame calls
    `refresh()` once and uses that revision for drawing and conversion alike.
  - `visible` is false while the body is hidden or covers no pixel.

### One canvas, world viewport (`engine`, `app`, `sky`, `image-viewer`)

- **The canvas always covers the shell.** The CSS rule that shrank it under
  the split band is gone.
  - The app gives the engine a world viewport source
    (`app/src/app/worldViewport.ts`). In the split presentation the world is
    the part under the band, from `--foss-canvas-top` or else
    `--foss-world-top`; elsewhere it is the whole canvas.
  - World size Release/Live is unchanged as world behaviour. Under Release,
    `--foss-canvas-top` keeps the world's rectangle until the resize settles.
    A change to either property requests a frame.
- **Viewport per frame.** Before each render, and before frame preparation,
  `attachWorldViewport` gives the active camera a bottom-origin viewport with
  whole-pixel edges and records the CSS rectangle it drew. Babylon floors on
  WebGPU and truncates on WebGL, so the viewport fractions carry a 1e-3 px
  nudge. Pixels outside the world get the clear colour.
- **Every consumer uses the world's rectangle,** not the canvas's:
  - Projection and picking: `clientRay` and `projectEcefToClient` read
    Babylon's bottom-origin viewport from the top (`cameraViewportFromTop`).
    The POI button's `Vector3.Project` gets a top-origin viewport.
  - Pointer normalisation and gating: `gateWorldInput` stops any press, wheel
    or touch that lands on the canvas outside the world, and the rest of that
    gesture, before world handlers see it.
  - Mouse, wheel and touch pan; inertia and the navigation camera; the
    camera controller's grab rates: all use `worldViewportHeight`.
  - Overlay projection and the occlusion pass: `uiOcclusion` maps windows into
    the world's clip space.
  - Imagery and tiles detail: render size × camera viewport.
  - Sky light-point and star pixel angles.
  - `image-viewer`'s orb picking and projection, and its device-pixel ratio.
  - The app's pose editor and scene host heights.

### Checks run

- Suites:
  - `engine` 949 tests (932 plus 17 world viewport tests).
  - `app` 200 (196 plus 4).
  - `image-viewer` 113 (112 plus 1 viewport projection test).
  - `renderer` 313, `sky` 107, `images` 156, `flat-image` 16,
    `panorama-equirectangular` 34, `panorama-cubemap` 32,
    `panorama-tiled-cubemap` 73, `scenes` 122.
  - `ui` 342: 335 pass, and the same 7 fail as before Stage A.
  - `createTilesRuntime`'s camera fakes gained the viewport every real camera
    has.
- Typecheck and lint pass in `ui`, `app`, `engine`, `sky` and `image-viewer`.
  The app's production `vite build` passes.
- Browser check, ad hoc and not the pinned qualification run:
  - Script: `app/build/stage-b/check.mjs`, which uses `browser-testing`'s page
    helper from source. It ran headless Chrome against `vite preview` of the
    built app, at 390×844 (split) and 1280×800 (overlay).
  - Backends: actual WebGL 1 and WebGL 2 (ANGLE Metal, Apple M5) and WebGPU
    (Metal 3).
  - On each backend the canvas covered the shell, and the world's camera
    viewport started at the split band: 62 px with only the toolbar, 422 px
    with the Map window open. The camera aspect was the world's (390/422), the
    globe was centred in the world and not stretched, and overlay was
    unchanged. A drag on the world moved the camera.
  - Screenshots and `results.json` are beside the script.
- The pinned `check:browser` run was not made. It needs the installed
  `@foss-earth/browser-testing` artifact and exact compiled-archive pins, and
  its installed-helper check fails in this checkout. It also accepts only
  WebGL 1 and 2.

### Not yet exercised in a browser

No app tab declares a surface yet. Joined bodies, the Log tab during a join
and surface geometry are covered by `ui` tests here. They are exercised in the
browser with the image tabs of Stage C.

## Naming: sphere and rectangle

Code names now say which shape an image covers. A sphere image covers every
direction from one point, stored as an equirectangular image, a cube or a
tiled cube. A rectangle image is a plane photograph. "Panorama" and "flat" are
gone from package names, identifiers, file names, CSS classes and code comments
in `image-viewer` (`360`), `equirectangular`, `cubemap`, `tiled-cubemap`,
`rectangle-image`, `images`, `renderer`, `scenes`, `preview-sheets`, `app`,
`ui`, `engine`, `sky` and `toolbar`. Done in the working trees, uncommitted.

| Before | Now |
| --- | --- |
| `@foss-earth/panorama-equirectangular` | `@foss-earth/sphere-equirectangular` |
| `@foss-earth/panorama-cubemap` | `@foss-earth/sphere-cubemap` |
| `@foss-earth/panorama-tiled-cubemap` | `@foss-earth/sphere-tiled-cubemap` |
| `@foss-earth/flat-image`, directory `flat-image` | `@foss-earth/rectangle-image`, directory `rectangle-image` |

- **Identifiers.** For example `createPanoramaRenderer` became
  `createSphereRenderer`, and `ResolvedPanorama` became `ResolvedSphere`.
  `ViewerTabs.panorama` is now `ViewerTabs.sphere`, and the scenes navigation
  port's `panoramaId` is now `sphereId`. `ResolvedScene.panoramas` is now
  `spheres`. `PANORAMA_GAMEPAD_ACTIONS` and `createPanoramaProfileContribution`
  are now `SPHERE_GAMEPAD_ACTIONS` and `createSphereProfileContribution`.
  On the rectangle side, `FlatCamera` became `RectangleCamera` and
  `createFlatSurfaceRenderer` became `createRectangleSurfaceRenderer`.
- **Names outside TypeScript.** Shader defines, samplers and functions,
  Babylon resource names (`sphere-orb-*`), CSS classes (`foss-earth-sphere-*`)
  and the scene panel's `data-sphere` attribute changed too.
- **Files.** `360/src/rectangle{Camera,Renderer,Session}.ts` and their tests,
  `engine/fixtures/composition/sphereBindings.ts` and
  `app/src/styles/sphere.css`.
- **Rectangle record values.** The rectangle record has
  `type: "rectangle-image"` and `projection: "rectangle"`. Nothing was ever
  saved with the earlier values.
- **Scene-check report.** Its summary counts `spheres`.
- **The orb.** Before the rename, the image viewer's comments called the orb's
  geometry a sphere. They now say orb or ball, so "sphere" has one meaning.

No old-name aliases exist for renamed identifiers or packages.

### Kept as they were

These are saved, persisted, or read by something this work leaves alone:

- **Saved scene values:**
  - the entity type `panorama` and the asset type `panorama-image`
  - `initialPanorama`
  - the scene schema's `$defs/panorama` and `$defs/panoramaAsset`
  - the projection values
- **Settings and input ids:**
  - `scene.panorama.*`
  - `renderer.experiments.panoramaShaders` and `panoramaBookkeeping`
  - the gamepad actions `panorama.lookX`, `lookY`, `zoom` and `exit`
  - the `standard-panorama-*` bindings
- **Tab and panel ids:**
  - the tab ids `panorama` and `panorama-settings`, saved in `foss-earth.workspace`
  - the panel section ids `panorama.links`, `panorama.detail` and
    `panorama-settings.<id>`, saved in `foss-earth.panelSectionsOpen`
- **Paths and commands:** the `panorama-scenes` media path, and the
  `foss-earth-prepare-panorama` command with its script.
- **Names research uses:**
  - `window.__fossEarthPanoramaTest` and `?panoramaTest=1`, which research drives
  - its installed copies of the old packages. Research imports only names that
    did not change: `equirectDirection`, `equirectCoordinates`,
    `CUBE_FACE_NAMES`, `SOURCE_CUBE_FACES`, `createCubeUploadAdapter` and
    `createEquirectUploadAdapter`.
- **Report categories:** the GPU memory and frame profile owner `panoramas`.
- **On-screen text:** labels, descriptions and messages still say "panorama"
  and "360 image".
- **Historical references:** settings' `source` pointers to former UMN-VR
  files, and links to pinned commits.

### Checks run after the rename

- All 13 libraries were rebuilt in dependency order, and no `dist` file keeps an
  old name.
- Typecheck and lint pass in every repository above.
- Test suites:
  - `ui` 342: 335 pass, and the same 7 fail as before Stage A.
  - `images` 163, `renderer` 313, `rectangle-image` 16, `sphere-cubemap` 32,
    `sphere-equirectangular` 34, `sphere-tiled-cubemap` 73.
  - `preview-sheets` 75, `sky` 107, `scenes` 122, `toolbar` 80,
    `image-viewer` 153, `engine` 949, `app` 226.
- The app's production `vite build` passes.
- Consumer typechecks pass in `images`, `rectangle-image`, `sphere-cubemap`,
  `sphere-equirectangular`, `preview-sheets`, `sky`, `image-viewer` and
  `toolbar`. The one in `ui` needs packed archives, which come with packaging.
- The local package links in `/Users/felg/gh/foss-earth/node_modules/@foss-earth`
  now read `sphere-*` and `rectangle-image`.
- Not rerun: Stage A's isolated pack-and-install consumer check. It belongs
  with packaging.

### UMN-VR edits at adoption

UMN-VR's `app` was not edited. It pins archives named by foss-earth commit,
so these changes land together with the rebuilt archives:

- **Package names.** In `app/package.json` and every import, change
  `@foss-earth/360` to `@foss-earth/sphere-image`, `@foss-earth/cubemap` to
  `@foss-earth/sphere-cubemap`, `@foss-earth/equirectangular` to
  `@foss-earth/sphere-equirectangular`, and `@foss-earth/tiled-cubemap` to
  `@foss-earth/sphere-tiled-cubemap`. The imports are in:
  - `app/src/native/{adapters,adapters.test,host,policy}.ts`
  - `app/src/tour/{content-host,controller}.ts` and
    `app/src/tour/{shell.tsx,shell.test.ts}`
  - `app/tools/twin-cities/build-scene.mjs` and its README

  (`tour/README.md` is already updated; see
  [Consumers of the old names](#consumers-of-the-old-names).)
- **`app/src/native/host.ts`:**
  - `createPanoramaRenderer` becomes `createSphereRenderer`.
  - `createPanoramaProfileContribution` becomes `createSphereProfileContribution`.
  - `PANORAMA_GAMEPAD_ACTIONS` becomes `SPHERE_GAMEPAD_ACTIONS`.
  - In the external navigation port (lines 43–49), `input.panoramaId` becomes
    `input.sphereId`.
- **`app/src/tour/content-host.ts`:** `viewerTabs.panorama` becomes
  `viewerTabs.sphere`. The `panorama` key beside it is the tab id and stays.
- **`app/src/tour/world.ts` and `world.test.ts`:** `ResolvedPanorama` becomes
  `ResolvedSphere`.
- **`browser-testing/src/local-smoke.mjs` and `native-observations.mjs`:**
  `button[data-panorama]` becomes `button[data-sphere]`, and `dataset.panorama`
  becomes `dataset.sphere`.
- **`app/release/earth-inputs.json`:** regenerated from the new archives. It
  will list `fixtures/composition/sphereBindings.ts`.

UMN-VR's own names stay, including:

- its arrival records' and routes' `panoramaId`
- its tab ids
- the `scene.panorama.*` settings it reads

## Stage C: first usable rectangle comparison

Done in the working trees of `app`, `image-viewer` (`360`), `rectangle-image`,
`images`, `renderer` and `ui`, on Stage B's shell, uncommitted.

### What it does

- **Opening.** `+ → Open image` in either window adds the Open image tab, with
  a file chooser and an address field (`app/src/imageTabs/ImageTabs.tsx`).
  Each image opens in its own tab in that window, and Open in other window
  adds a second tab of the same image, sharing its pixels. A tab opened into a
  full strip is scrolled into view (`ui`'s `TabStrip`, tested in
  `TabStrip.test.tsx`).
  `imageDiscovery.ts` reads the bytes once, within the response limit and the
  shared encoded-bytes budget. It refuses, with a reason, what cannot be shown
  as stored. The tests that decide what can be shown are in
  `images/src/encodedFacts.ts`:
  - transparency
  - 16-bit samples
  - colour other than sRGB
  - animation
  - EXIF orientation other than upright
  - sizes over the device's texture limit
  - files over Largest image file
  - anything that is not a JPEG or PNG
- **Native-resolution pixels.** `imageSources.ts` makes one texture per
  document at its own size, shared by every tab that shows it. It goes
  through the session's broker, pools and single uploader, using the
  `loadWholeImage` lifecycle that equirectangular loading also uses
  (`images/src/browser/wholeImage.ts`). An image over the image GPU budget
  shows a failed state with its reason, not a reduced copy. A load that goes
  stale releases what it holds, and device loss puts sides in waiting until
  their textures are made again.
- **One rectangle camera.** In `image-viewer`: `rectangleCamera.ts`,
  `rectangleSession.ts` and `cameraTarget.ts`.
  - Both sides share one plane and one camera. They pair only when their
    aspect ratios are exactly equal; otherwise the surface says why.
  - Each extent keeps its own view, so a compatible tab switch keeps the
    view.
  - Resizing keeps the scale and the plane point at the centre. Zoom is
    anchored and clamped.
- **Wipe.** One handle, labelled with both titles, moved by drag or keys,
  never moving the camera. A press on the handle never reaches the surface:
  it uses a native listener, tested in `ImageTabs.test.tsx`.
- **Image pass.** `image-viewer`'s `rectangleRenderer.ts` draws one quad per
  surface into its measured rectangle of the shared canvas, after the world
  and its post-processes. It uses its own viewport and scissor, with no
  depth, lighting or tone mapping. It never clears.
- **Shared input.** The surface reads wheels with the globe's `input.mode`
  and wheel reader (`image-viewer`'s `browserInput.ts`):
  - trackpad pinch and two-axis swipe
  - mouse wheel zoom
  - mouse drag
  - touch pinch with midpoint motion
  - Safari gesture events
  - while focused: arrows, + and −
  
  Text fields keep their keys. Blur ends held keys and drags.
- **Inspection.**
  - Fit, 1:1 for the focused side, and Pixels: Smooth or Square.
  - A readout of drawn pixels per image pixel, saying whether 1:1 sits on
    pixels or between them.
  - When the render scale makes drawn pixels differ from display pixels, a
    note says so and names Renderer → Resolution.
- **Compact width.** When both windows select images and only one window
  fits, the surface says so and the sides keep their tabs. Widening restores
  the pair.
- **Density changes.** `renderer`'s `createBrowserRendererPlatform` watches a
  `(resolution: Ndppx)` media query. When the device pixel ratio changes
  without a change of CSS size, it redraws at the new density. This is tested
  in `settledResize.test.ts`.

### Checks run

- Typecheck and lint pass in `app`, `image-viewer`, `rectangle-image`, `images`,
  `renderer` and `ui`.
- Suites: `app` 227 (with `ImageTabs.test.tsx`), `image-viewer` 150,
  `rectangle-image` 16, `images` 163, `renderer` 314 (with the density test in
  `settledResize.test.ts`), `ui` 343: 336 pass, and the same 7 fail as before
  Stage A (theme and injected widgets).
- `ui` and the app were rebuilt after the `TabStrip` change.

### Flat gate in a browser

Ad hoc evidence, not the pinned `check:browser` run.

- Script: `app/build/stage-c/gate.mjs`, with `page-helper.js` (in the page) and
  `fixtures.mjs`. It serves `app/dist` with `vite preview` and drives headless
  Chrome 155 through raw CDP. Options: `BACKENDS`, `PAGES`
  (overlay, split, defaults), `PHASES`, `SUMMARY_ONLY=1` (rewrites
  `summary.md` from `results.json`). Probe phases run only when named:
  `probe-dpr`, `probe-wheel`, `probe-tabs`, `probe-late`, `probe-loss`
  (`PROBE_FIX=1` tries an awaited restore in the page).
- Machine: Apple M5. WebGL 1 and 2 through ANGLE on Metal (texture limit
  16384), WebGPU on Metal 3 (8192). Pages at 1280 × 800, DPR 2.
- Complete rerun on 2026-10-13 after the repairs below: **250 checks pass,
  0 fail, 0 notes, 0 click fallbacks** (exit 0). WebGL 1 overlay 70, split 9,
  defaults 2; WebGL 2 the same; WebGPU overlay 77, split 9, defaults 2. The
  WebGPU overlay run includes two device loss/restoration cycles, each with a
  new device, framebuffer registration, and world frame plus picking checks
  after the restore, with no GPU or frame errors. Evidence:
  `app/build/stage-c/{results.json,summary.md,shots/}` and
  `app/build/stage-c-final.log`. The earlier failed rerun (237 pass, 5 fail,
  15 click fallbacks) is archived in `app/build/stage-c-first-rerun/`.

### Follow-up repairs and remaining qualification

- `rectangleRenderer.ts` now binds a replacement texture before asking whether
  its cached material is ready. A disposed texture from before device loss
  can no longer prevent its ready replacement from being bound.
- `renderer` now owns a Babylon 8.56.2 WebGPU restore adapter in
  `src/babylon/recoverableWebGpuEngine.ts`. It awaits device initialization,
  resets pipeline caches before the new helpers are constructed, rebuilds
  retained scene and virtual-scene geometry, and preserves depth/stencil
  settings. Repeated losses are serialized; disposal retires a late device.
  Presentation and readiness polling stop while the device is lost.
- Checks: renderer's full suite passes 324 tests, image-viewer's full suite
  passes 151 tests, and typecheck/lint pass in both. All 13 libraries were
  rebuilt in the requested dependency order.
- A standalone renderer browser fixture passes 16 checks on actual Chrome
  155 WebGPU, Apple M5, texture limit 8192, DPR 1, at 640 × 480. Two real device
  losses produce device generations 1 → 2 → 3. Indexed world and image
  geometry get new GPU buffers, world colour and four texture quadrants stay
  exact, camera picking works, and no GPU, shader or frame errors are seen.
  Evidence: `renderer/build/webgpu-restore-browser/{results.json,summary.md,
  restore.log,shots/}`. This proves the standalone restore, **not** the app's
  Stage C gate or sphere comparison.
- The corrected app gate uses only real pointer clicks, fractional trackpad
  motion for native alignment, and two WebGPU restore cycles with framebuffer
  registration and world checks. It exits nonzero on any failure. The original
  failed rerun is retained in `app/build/stage-c-first-rerun/`.
- The concurrent browser-recovery integration is now available: the other
  agent finished the `ui` exports (`createBrowserDataPanel`,
  `isBrowserRecoveryPage`, `markBrowserAppReady`, `reportBrowserAppFailure`,
  and the `browserRecovery` Vite plugin). Its edits were preserved. All 13
  libraries were rebuilt in dependency order and then the app
  (`stage-c-final-build.log` in each `build/`). The isolated WebGPU restore
  probe passed with 0 failures before the full gate ran.
- At the user's request, the remaining gate execution and status cleanup are
  handed to a cheaper-model conversation through
  `app/build/shared-image-viewer-handoff.md`. That handoff prepared the
  Stage D camera and renderer design. Stage D's result is recorded below.

### Limits of the harness

- CDP's emulated DPR fires neither a resize nor a media-query change, so the gate
  sends the resize and labels those checks emulated.
- A key held through CDP (`rawKeyDown` without `keyUp`) stops animation frames in
  headless Chrome on any page, and wheels are then never acknowledged
  (`probe-arrow.mjs`). The gate releases its key after the blur.
- After a strip scrolls, Chrome's overlay scrollbar can cover the centres of
  its buttons. `press()` scrolls once and hit-tests the centre and inset
  points, using an exposed point for a real CDP pointer click. It fails if no
  point is clickable; it no longer calls the element's own click. An isolated
  pointer/native probe passes 28 checks on WebGL 2 and 28 on WebGPU, with no
  failures or click fallbacks.
- Native-pixel free-motion evidence uses a fractional two-axis trackpad swipe
  instead of held CDP keys. At DPR 2, 0.25 CSS pixel on each axis moves texel
  centres by half a framebuffer pixel and makes the readout say between pixels.
- A Babylon scene pick finds nothing offline, because the globe mesh is not
  pickable. The gate uses Pick point (`navigationAnchors.armPick`).
- On WebGPU, `readPixels` needs `flushRenderer=true` and returns BGRA. Image
  textures are bare internal textures, missing from
  `getLoadedTexturesCache`, so the helper also lists `scene.textures`.

### Not passed or not exercised

- **App restore after a WebGPU device loss: passes.** The original
  restore failed for the whole app, with no image open too. Babylon
  8.56.2's `_restoreEngineAfterContextLost` calls WebGPU's async `initEngine`
  without awaiting it, so it rebuilds on the lost device. The world draw then
  throws in `getBindGroups`. With the restore awaited, every geometry's index
  buffer still belongs to the lost device because WebGPU omits the scene
  geometry rebuild. The renderer workaround above addresses both causes, and
  the corrected full browser gate now passes item 8's app restore clause with
  two restore cycles.
- Safari gestures were not run in Safari. All input was synthesised through CDP.
- The pinned `check:browser` run was not made.

### Readiness

The flat gate passes on 2026-10-13: 250 checks, 0 failures, 0 click
fallbacks, on actual WebGL 1, WebGL 2 and WebGPU (Apple M5, headless Chrome
155 through CDP, 1280 x 800, DPR 2), run ad hoc; the pinned `check:browser`
run was not made. WebGPU restore is resolved by the renderer workaround, not
accepted as a limit, and passes with two restore cycles. The flat gate is the
study's prerequisite, now met; the frame-generation study itself stays
stopped, since a passed prerequisite does not authorize running research.
Nothing here shows sphere comparison (Stage D).

## Stage D: panorama pair and shared live behavior

### Done in the working trees, uncommitted

The shared sphere camera and the comparison surface are in
`@foss-earth/sphere-image`. Nothing here is committed. Stage E is not started.
The Open-image rectangle path is unchanged, and no product file picker opens a
sphere source.

- `sphereCamera.ts` is the pure camera: `SphereCamera`, `SphereViewport`,
  `sphereViewBasis`, `sphereRay`, `projectSphereRay`, and `anchorSphereCamera`.
  The common frame is X right, Y forward, Z up. The solver follows the nearest
  continuous heading and pitch branch, clamps the requested field of view
  before solving, and bisects back to the last feasible pose. Near a pole it
  does not jump to another legal branch, add roll, or clamp pitch after the
  solve. `createSphereCameraTarget` and the live look model both call that
  solver. Drag and swipe stay sensitivity-based. Wheel, pinch, and a touch
  pinch move the captured ray only when a measured viewport is supplied;
  a centre zoom changes field of view alone.
- `createSphereSurfaceRenderer` draws one or two sphere sources into a
  framebuffer rectangle with a caller-supplied view basis and wipe. A source
  is the current viewer source fields plus `contentFromCommon`, applied once.
  Equirectangular, cube, and tiled sources share the live sampling primitives.
  A tiled/tiled draw binds six samplers. Refinement is published as one
  source through `createSphereSlot`; a stale or cleared token does not
  publish. The surface does not take a globe lease or a geographic placement.
  Live immersion still draws through the existing sphere renderer. The app
  passes the measured world viewport into that live camera and into the globe
  pointer conversion.
- The tiled lookup compiles for the surface's `LEFT_TILES` and `RIGHT_TILES`
  defines as well as the live source and next defines.

### Qualification

Ad hoc, not the pinned `check:browser` run. Safari was not used. Input was
synthesised through CDP. The page is
`360/fixtures/sphere-gate/`, and the record is
`360/build/stage-d/{results.json,summary.md,shots/,gate.log}`.

On 2026-10-13 (gate log `2026-10-14T03:11:43Z`), headless Chrome 155.0.8059.80
on Apple M5, 1280 x 800 CSS pixels, device pixel ratio 2, framebuffer
2560 x 1600:

| Backend | Checks | Failures |
| --- | --- | --- |
| WebGL 1 | 55 | 0 |
| WebGL 2 | 55 | 0 |
| WebGPU | 55 | 0 |
| Total | 165 | 0 |

The checks cover every ordered equirectangular, cube, and tiled pair, the
orientation, seam, and pole fixtures, a feasible anchored zoom, the heading
wrap, the pole bisection, tiled preview fallback, an in-place tile update,
atomic and cancelled publication, and the shared look model. A CDP wheel at
the prepared point kept the marker pixel and moved its projected ray by about
5e-13 CSS pixels. Shader error lists were empty. WebGL reported 16 texture
image units; the tiled/tiled variant binds 6.

The image-viewer suite is 173 tests, 0 failures, including the existing live
flight, orb, refinement, cancellation, and input tests plus the new sphere
tests. Its lint and build pass. The tiled-cubemap suite is 70 tests, 0
failures. The app typecheck passes with the new optional viewport. The
renderer package was not changed in this stage, and the Stage C app gate was
not re-run.

### Limits of the harness

- WebGL and WebGPU `readPixels` run inside the frame. The WebGPU gate also
  calls `beginFrame` and `endFrame`, because this page's scene has no other
  color pass. WebGPU bytes are BGRA and are swapped before the check.
  `preserveDrawingBuffer` is on so the read sees the drawn frame.
- Nearest sampling snaps equirectangular lookups to texel centres. Cube faces
  keep the existing cube sampler. The cube fixtures are solid faces, so they
  do not show a sub-texel cube snap.
- The live browser check is the shared look model and one CDP wheel. It is
  not a full globe session. Existing live regressions are the image-viewer
  unit suite above.

### Not passed or not exercised

- Safari gestures were not run in Safari.
- The pinned `check:browser` run was not made.
- The app does not yet present sphere sources in comparison slots. That
  presentation, the renamed-package consumer adoption, and the UMN artifacts
  are Stage E.

### Readiness

The panorama gate passes on the three backends above. That meets the study's
remaining prerequisite. The study stays stopped: a passed gate is not
authorization to run research.

## Stage E: compact presentation and artifact adoption

Done in the working trees, uncommitted. Stage C and Stage D browser gates were not re-run. Their evidence stays in `app/build/stage-c` and `360/build/stage-d`.

### Compact presentation

While an image tab is the selected tab on an expanded logical side, a narrow shell no longer folds the other side and no longer shows the Stage C "only one window fits" limitation.

- Both occupied sides stay labelled compact rows (`Left` and `Right`). Two images put those rows above one shared body. An image beside ordinary content is two stacked strip-and-body groups. One occupied side has one body, and the empty side keeps its labelled launcher. A collapsed side keeps its strip, close, and add.
- Resizing does not move tabs. The height grip of a stacked row sits inside that row, so it does not cover the next strip. Ordinary folding returns only when no image is the selected tab on an expanded side. Above the stacked breakpoint the joined comparison is unchanged.
- The shell work is in `ui`: `WindowOverlay.tsx`, `imageCompact.ts`, `DockPanel.tsx`, `WorkspaceDockSlot.tsx`, and `windowing.css`. The app no longer has a compact-limitation branch (`imageParticipation.ts`, `imageSurfaceHost.ts`, `ImageTabs.tsx`).

### Browser check

Ad hoc, headless Chrome 155.0.8059.80 through CDP, 1280×800 then 390×844, device pixel ratio 2. The page asked for WebGL 2. This is not a Safari run and not a sphere-comparison run.

`app/build/stage-e/compact.mjs` opened two same-aspect rectangle fixtures, then checked:

- wide: one joined body beside both strips, and the tabs did not move when narrowed
- narrow pair: both labelled strips above one body, with close and add on each
- image plus Location: two stacked groups, Location staying on its side
- collapsed right strip still labelled, with close and add, and clear of the resize grip
- close on that strip removes only that side's tab
- one occupied side: one body plus the Open right panel launcher, also clear of the grip
- selecting Location and emptying the other side returns to ordinary folding, and the image tab stays on its logical side
- widening restores that side

15 checks, 0 failures. `results.json` and `shots/` are beside the script.

### Artifact adoption

UMN-VR `app` now pins rebuilt archives. The old hash-named files are still in `app/deps` and their recorded sha256 values are unchanged. Nothing was published. The archive names below are the names those packs were built under.

| Package | Archive | sha256 | bytes |
| --- | --- | --- | --- |
| `@foss-earth/image-viewer` | `deps/foss-earth-image-viewer-f5664b6a446eda52095fa716778932ca7da71d4b.tgz` | `191ff2945e894d4ec7634fa82307825b403eaa5bf68987dbfc49fc3c4363de01` | 139773 |
| `@foss-earth/rectangle-image` | `deps/foss-earth-rectangle-image-044085ac8b6594e573a0d1be7c5ac2361fd8061ee51d264566d14dc85d11e4f2.tgz` | `044085ac8b6594e573a0d1be7c5ac2361fd8061ee51d264566d14dc85d11e4f2` | 20293 |
| `@foss-earth/sphere-cubemap` | `deps/foss-earth-sphere-cubemap-357d4dee7d4a827f2b62db68bacdd0c571044562.tgz` | `70d0717c70b8875462d451d93a36fef51200ea9e60dd03229d6e296b44fe7efe` | 45338 |
| `@foss-earth/sphere-equirectangular` | `deps/foss-earth-sphere-equirectangular-18b76dc641dd9f2853516aff22bb5612b8f61b4c.tgz` | `ca90e5d8d071ca6d9e4e8207e2c7aefd7532d8b233b81d75859ee7e3d0f606de` | 44633 |
| `@foss-earth/sphere-tiled-cubemap` | `deps/foss-earth-sphere-tiled-cubemap-96c7f3ff14011b418c8d1790d8c656ed3ff5ec72.tgz` | `c51c74a81b0e25b9e56ebf2a5d08f1792c22b87004e7f93f322212cdb9ec9188` | 47472 |
| `@foss-earth/scenes` | `deps/foss-earth-scenes-797a0f3f8829d153f552999f6fcc4573f9c25ab4.tgz` | `458ef494a4359df560eb58d344e40d0186e6e4f24137a8708da351e67898553e` | 205571 |
| `@foss-earth/engine` | `deps/foss-earth-engine-3e2c223f96e241b67c04d47273219fac244d7363.tgz` | `3ac2a5141a0a3e8c33ea6fa37e7ff4e0c1216ec0c28479e46cf8364e4de70b48` | 2797017 |
| `@foss-earth/preview-sheets` | `deps/foss-earth-preview-sheets-d1dac5eae5938130bbf4c78022bcb062f2afbae3.tgz` | `0e8a5c77946397b51c6b1d5228f58e1d09fd3343ef4767db9a976cdce131f62b` | 50069 |

`rectangle-image` has no commit. Its archive name is the archive sha256. `foss-earth/rectangle-image` still does not exist on the host. The other names use the checkout's `HEAD`, and every packed tree was dirty. `preview-sheets` was packed because the previous pin required `@foss-earth/cubemap`; the current source depends on `@foss-earth/sphere-cubemap`. `scenes` was packed because its navigation port now says `sphereId` and its resolved type is `ResolvedSphere`. `engine` was packed because the rebuilt file map lists `fixtures/composition/sphereBindings.ts`. The previous engine map, still listing `panoramaBindings.ts`, is retained with the old archive.

`app/release/earth-inputs.json` keeps each replaced provider, unchanged, under `retainedProviderArchivesBeforeCanonicalNames`. The new providers record the archive sha256, size, public exports, and full file map of these packs. Their source identity state is `REBUILT_NPM_PACK_MAPPED_TO_ARCHIVE_BYTES`. `qualifiedIdentityDescriptorSha256`, `sourceClosureSha256`, and `publicationAuditSha256` were not produced: the sealer that wrote those for the older pins is not in this checkout, and those hashes were not invented.

The source edits under [UMN-VR edits at adoption](#umn-vr-edits-at-adoption) are applied, including `browser-testing`'s `button[data-sphere]` and `dataset.sphere`. Campus arrival records and route fields still say `panoramaId`. Tab ids `panorama` and `panorama-settings` stay. No compatibility package was added back.

### Checks

- UMN-VR `app` typecheck passes against the new pins. Its test suite is 91 tests, 0 failures.
- Plain Node imports of the installed image-viewer, sphere, and rectangle packages succeed from that app, including `createSphereRenderer`, `createSphereProfileContribution`, and `SPHERE_GAMEPAD_ACTIONS`.
- The installed-consumer check is `build/harness/consumer-check.mjs`. It packs the canonical working trees, installs only those archives offline, imports the public entries, runs `foss-earth-prepare-panorama --help`, and typechecks a consumer of the new names. Receipt: `build/harness/consumer/2026-10-14T03-49-59.562Z/receipt.json`. Entries that need Babylon or the engine fail the same way as before when those peers are absent. No old-name package is installed in that workspace.

### Still out of this stage

- Hosted repository names are unchanged: `foss-earth/360`, `cubemap`, `equirectangular`, and `tiled-cubemap`. No release was published.
- **research** is the compatibility exception. It still has its pre-rename `@foss-earth/cubemap` and `equirectangular` installs, imports only names that did not change, and was not edited or run.
- UMN-VR `tour` and 0sfs `fly` already consume the local app. They were not redone.
- The study stays stopped. A passed compact check is not authorization to run research.

## Close-out

Stages A–E are implemented in the working trees and are not committed. The study stays stopped. Hosted repository renames and a release are still an owner step, not part of this implementation.

### What the compact shell actually does

An image participates when its tab is selected on an expanded side. Logical visibility is context policy and explicit collapse. Responsive folding is not membership. `open-image` is not a surface; the join group is `image`.

Below the stacked breakpoint (`320 + 160 + 12 * 3` pixels), and only when the host passed `surfaces`, the overlay sets `data-image-compact` and presents both logical sides. A width-made fold is undone from compact memory before paint. That restore is not a user tab move. `snapshot.compact` stays true at a narrow width, including during this presentation, so canonical sides can be recovered. The log-join effect runs before the fold effect, and the fold reads the state the log left.

Flow panels are `position: relative`, full width, and resize by height only. On a phone each body is at most half the screen (`50dvh`). The lifted height grip sits inside its own panel (`rect.bottom - 24`) so it does not cover the next strip. Above the breakpoint there is no flow and no side label, and the joined comparison is the one Stage C qualified.

An application that does not pass `surfaces` still folds. Ordinary tabs keep their persisted home sides.

### Archives

Pack with `npm pack` from the dirty working tree after `npm run build`. Name the file `foss-earth-<package>-<HEAD>.tgz`. `rectangle-image` has no commit, so its name is the archive sha256. Never replace an existing hash-named archive or edit its recorded sha256. Put the previous provider object, unchanged, in `retainedProviderArchivesBeforeCanonicalNames`, and write the new provider from the new bytes: sha256, size, public exports, and a full file map. The private sealer that produced `qualifiedIdentityDescriptorSha256`, `sourceClosureSha256`, and `publicationAuditSha256` is not in these checkouts. Do not invent those hashes. The new state string is `REBUILT_NPM_PACK_MAPPED_TO_ARCHIVE_BYTES`.

`preview-sheets` was repacked because the previous pin depended on `@foss-earth/cubemap` and the current source depends on `@foss-earth/sphere-cubemap`. `scenes` was repacked because the navigation port says `sphereId` and the resolved type is `ResolvedSphere`. `engine` was repacked so the file map lists `fixtures/composition/sphereBindings.ts`. The old engine archive still lists `panoramaBindings.ts`.

Campus arrival records, route fields, tab ids `panorama` and `panorama-settings`, and `scene.panorama.*` keep that spelling. On-screen text still says panorama and 360 image. No compatibility package was added back.

### Left for an owner

- The hosted repositories are renamed: `sphere-image`, `sphere-cubemap`, `sphere-equirectangular`, `sphere-tiled-cubemap`, and `rectangle-image`. Do not publish or attach a release from this work.
- Research keeps its pre-rename `@foss-earth/cubemap` and `equirectangular` installs. It imports `equirectDirection`, `equirectCoordinates`, `CUBE_FACE_NAMES`, `SOURCE_CUBE_FACES`, `createCubeUploadAdapter`, and `createEquirectUploadAdapter`. It was not edited or run. Moving it is its owner's work.
- UMN-VR `tour` and 0sfs `fly` install the local `foss-earth` app and were not rebuilt for Stage E. The tour dev server is `npm run dev` in `UMN-VR/tour`, which serves `http://localhost:5173/tour/` from that app's source.
- The Stage C browser gate's compact check still expects the removed "only one window fits" limitation. Leave `app/build/stage-c` and `360/build/stage-d` as the pinned records.
- Safari was not run. Rectangle compact checks are not sphere-comparison evidence. The Open-image path still opens rectangle photographs; sphere pairs were qualified in `360/fixtures/sphere-gate/`, not in the app's file picker.
