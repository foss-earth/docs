# Handoff: Scenes photograph grid, mini 360 viewer, opening look

Implement this in FOSS Earth. The UMN Twin Cities tour is the scene that
exercises it; globe behavior belongs here, not in the tour. Do the work in a
fresh conversation. Do not commit, deploy, or run `npm run build:scene` unless
asked. Do not add empty Gopher-tunnel or bus-route layers. Do not edit
markdown the user did not ask for besides finishing this feature.

The user stopped a previous thread after reviewing the Scenes tab. Finish the
UI they asked for. Partial code is already on disk and uncommitted; keep what
matches this document, replace what does not.

## What the user asked for

Settings → Scenes is one catalog of photographs, not a tree of pills plus a
second copy of the same names.

- **One grid of photographs.** Each photograph appears once. A control picks
  how the same cards are grouped. One grouping is indoor/outdoor (map layers:
  Outdoor → 360 images, Indoor → 360 images). Another is tour stops: the
  numbered groups such as "20. The Twin Cities (Our Location & Opportunities)".
- **No duplicate chips.** The old list of group headings with a pill per
  member (Welcome, Libraries, …, Thank You) must not sit under or beside the
  grid. That list is the duplication the user pasted.
- **Cards start collapsed.** A collapsed card is the 64 px preview-sheet still
  (green check or loading circle on the top-right of the image, no "Ready"
  text). Click expands that one card into a mini 360 viewer.
- **Expanded title** sits on the **top-right of the image**, not under it. The
  title button still enters the full panorama. The still's status mark can
  move so it does not cover the title.
- **Mini 360 viewer**, built properly:
  - Same look navigation as the full panorama: pan (drag) and zoom (wheel /
    pinch). Gains come from the existing panorama look settings
    (`dragSensitivity`, `zoomPerNotch`, `pinchGain`, pitch and FOV ranges).
  - Follow [camera-motion.md](../camera-motion.md): the look has mass and
    momentum; it does not jump or ignore a gesture that cuts another motion
    short. Match the full viewer's drag/zoom feel, including look-glide
    (`scene.panorama.inertiaHalfLife`) unless a measured reason says a mini
    cannot.
  - **No UI overlays inside the viewer** (no hotspots, HUD, north button,
    credits, or chrome on the iframe). The card around it may show title and
    status.
  - **Performant.** Do not give every photograph its own WebGL context or its
    own iframe. Collapsed cards stay CSS stills from the shared preview sheet.
    At most one live mini at a time, for the expanded card. An iframe is
    allowed so pointer events stay off the globe canvas; that is why the
    current sketch uses one iframe.
  - The mini is a **preview**. Sampling the 64 px cube sheet on a small canvas
    is acceptable. Do not load immersion tiles into the grid. Entering still
    uses the full sphere viewer.
- **Opening look** is a setting, not a one-shot "make them all look up"
  without memory:
  1. Remember where we were looking last time we opened **any** image.
  2. Remember where we were looking **in that image**.
  3. Always reset to a **specific** heading/pitch (and FOV as already stored).
  4. A **Look up** button sets that specific position to the top of the pitch
     range (zenith) and selects "always that position".
  The same setting applies when entering a panorama from the map **and** when
  opening the mini viewer.

## What is already on disk (keep unless it fights the above)

Uncommitted work spans FOSS Earth and a little tour wiring. Inspect the files;
do not assume this list is complete.

### Map layers (done enough; do not regress)

Nested scene layers: grouping Outdoor/Indoor, each with a panoramas child
`*-360` titled "360 images". Visibility is own checkbox AND all ancestors.
Map orbs hide via `setMapVisibility`; `enter()` still works when a layer is
off. Feature-kind layers are kept, not drawn.

- `foss-earth/scenes/src/format.ts`, `validateScene.ts`, `schema/scene-1.json`
- `sceneHandle.ts`: `setLayerVisible`, `movePanorama`, `layerStatus.members`
- Tour: `UMN-VR/tour/tools/twin-cities/build-scene.mjs` `mapLayers`,
  `campus-scenes.mjs` `filterLayer`, placements `"layer": "indoor"|"outdoor"`,
  Twin Cities scene revision `390caad2f0d6` (60 photographs: 25 outdoor, 35
  indoor). Campus scenes were regenerated from that.

### Layer recategorization (keep)

Drag a card from Indoor to Outdoor (and the reverse) while arrangement is on:
`import.meta.env.DEV` always, published site only with exactly `?dev=1`. Live
`movePanorama`, localStorage `foss-earth.layer-overrides.v1`, format
`foss-earth-layer-overrides` v1, Download / Copy JSON / Reset in the Scenes
panel. Tour prefix `umn-tour-layers`. Importer:

```sh
cd ~/gh/UMN-VR/tour
node tools/twin-cities/import-layers.mjs --input path/to/umn-tour-layers.json
node tools/twin-cities/import-layers.mjs --input path/to/umn-tour-layers.json --write
```

`--write` updates tour `placements.json`, Twin Cities `scene.json` members and
revision, campus scenes, and the app placements copy if present. Dry run is
the default. It refuses a 360 layer that would be empty (schema `minItems: 1`)
and refuses targets that are not indoor/outdoor. Pose overrides stay a
separate store; do not mix them. Pose editing itself stays `?dev=1` only.

### Opening look (started; finish)

- `foss-earth/app/src/app/openingView.ts`: localStorage
  `foss-earth.opening-view.v1`, modes `enter` | `last` | `image` | `fixed`.
- Settings in `foss-earth/sphere-image/src/settings.ts`:
  `scene.panorama.openingView`, `openingHeading`, `openingPitch`. Look up in
  `sceneHost.ts` writes heading 0, pitch = max of `pitchRange`, mode `fixed`.
- `viewer.enter` is wrapped so a remembered/fixed look is passed as `view`
  unless the caller already supplied one.
- Scenes panel has Opening view pills and a Look up button when `opening` is
  passed in.

Finish so the four modes match the user's wording, Look up only sets the
stored zenith (it must not leave mode unset), mini and full enter share it,
and tests cover wrap + storage + Look up.

### Photograph cards and mini viewer (started; rebuild until it matches)

- `foss-earth/scenes/src/panel.ts`: `grouping` `layers` | `stops`,
  `expandedId` starts `null`, cards not `<details>`, Group / Opening view
  toolbars, drag still on layer grouping.
- `foss-earth/scenes/src/miniViewer.ts`: one iframe, canvas samples the
  preview sheet with `sourceCubeLookup`. Pointer pan/zoom/pinch. **Not yet**
  the full viewer's inertia. **Not** a real sphere renderer.
- `previewFace` on `SceneEntryStatus` includes still face `x,y,size`,
  `originX` of the six-face strip, and `content` rotation. Heading 0 / pitch 0
  look along +Y after that rotation (`sceneHandle.ts` `previewFaceOf`).
- Collapsed still is CSS `background-image` on the sheet. Status is
  `.foss-earth-scene-entry__mark` (`data-state` ready | loading), not the
  word Ready.
- CSS tries to put `.foss-earth-scene-entry__title` at top-right; the user
  still saw the title under the image. Fix stacking (title `z-index` above
  the iframe, title not in a following flow row).
- `panel.test.ts` already expects unique cards and Tour stops grouping
  (`garden` only in the first stop that lists it). If chips still render,
  delete that path.

Tour stops may list the same photograph more than once in the scene file.
The grid still shows it **once**. Current code keeps the first stop in
authored group order. If a better rule is obvious (featured stop vs later
mention), use it and test it; do not show two cards.

Map layer **checkboxes** stay in Scenes when grouping by tour stops: they
hide orbs, they are not a second photograph list. Photograph cards live
only in the chosen grouping.

## Constraints

- Tour-only work stays in `UMN-VR/tour`. Globe/Scenes UI stays in FOSS Earth
  (`scenes` panel, `sphere-image` settings, `app` host).
- Do not copy FOSS Earth into the tour. The tour already passes
  `layerExportPrefix: "umn-tour-layers"` from `mountTour.ts`.
- `check-content.mjs` will fail against the old published baseline revision
  `4b89d4e2af09` until a new baseline is published. Do not rewrite those docs.
- Vite `conditions: ['source', …]` means tour `npm run dev` loads FOSS Earth
  TypeScript. Do not publish dist.
- Globe canvas intercepts coordinate clicks in the browser tools; use DOM
  `.click()` / dispatched drag events. Lock the browser tab for verification.
- Follow camera-motion, render-on-demand, and UI-layout docs before adding
  controls.

## Tests and verification

- Scenes: `panel.test.ts`, `miniViewer.test.ts`, `sceneHandle.test.ts`.
- App: `openingView.test.ts`, layer store/overrides tests if touched.
- Tour: `twinCitiesScene.test.ts`, `import-layers.test.mjs`, `mountTour.test.ts`.
- Typecheck the packages you change.
- Browser: `cd ~/gh/UMN-VR/tour && npm run dev` (a server may already be on
  5174). Open `/tour/twin-cities/`, Settings → + → Scenes.
  - One photograph grid; Group Indoor and outdoor vs Tour stops; no chip
    list of the 23 stops under the grid.
  - All cards collapsed until click; expanded title on the image top-right;
    pan and zoom the mini with no overlays; click title enters the full
    panorama; collapse again.
  - Opening view: last / each photograph / one position / Look up; reload
    and confirm the look; enter from the map uses the same setting.
  - Drag one photograph Indoor ↔ Outdoor, Download/Copy exist, Reset restores.
    Do not leave the session with a dirty layer override.

## Out of scope unless the user asks

Commit, deploy, `build:scene`, drawing feature lines, empty tunnel/bus
layers, loading full-res tiles in the grid, a second globe renderer in the
panel.
