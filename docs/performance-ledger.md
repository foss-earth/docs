# Performance ledger

Every optimization shipped, rejected, held, waiting on a decision or still
open, across FOSS Earth, 0SFS and the UMN tour, from 12 October 2026 on. Read
it before choosing work, so that nothing is retried by accident. The current
handoff is [28 October][e-resume]. The October 22
[agent state](proposals/implementation/performance-agent-state.md) is history.

Each item has a permanent ID. When an item changes status, move its row to the
new section and keep its ID. Give a new item the next free ID (the last one
used is P-119). Cite commits as `repo sha`. Numbers are the ranges from the
named report, before → after, in ms/s of main-thread CPU unless the row says
otherwise. Numbers from different methods are not comparable: see
[Units and methods](#units-and-methods).

Fly commits made before the 22 October rebase have new IDs. The table in
[Rewritten commit IDs](#rewritten-commit-ids) maps the old IDs, which older
reports still cite, to the current ones.

## Shipped

Newest first. "Unpushed" means local `main` was ahead of `origin/main` when
the row was written. As of 28 October, engine `main` is ahead by `deed8b5`
only. P-101, P-102 and P-106 are still uncommitted.

| ID | Date | Commits | Change | Measured | Report |
| --- | --- | --- | --- | --- | --- |
| P-119 | 7 Nov | engines `7cebc17`, unpushed | The engine monitor, updated once a frame for the HUD's engine chip whether or not its panel is open, fills each update's shared read cache with one native property batch read of the engine sample's properties the model lists, instead of 11 (C172) to 17 (jets) single reads; made again for a new reader or after a model load, properties the batch reports missing still read alone (audit 0SFS 5 Nov, prompt 04 step 3). Exact: reads have no side effects and nothing writes during an update | jsdom harness, old and new monitor on two real JSBSim instances, C172, Vision Jet, G3, F-35B both engine models × 4 seeds, half with details open: 24,000 updates, 553 engine events, 39 reloads, readings `Object.is`-equal and HUD and panel HTML identical; A/A passes; 10 of 10 mutants caught. Single reads per update, details closed: C172 11.17 → 0.17, jets 17.25–19.43 → 0.25–2.43. Node, whole update, 9 interleaved rounds: C172 10.22 → 1.58 µs, Vision Jet 17.65 → 2.14, F-35B 18.57 → 2.36, about 0.52–0.97 ms/s at 60 fps. Not a frame-rate claim; not measured in the browser or on a phone | [engine sample][n-engine-sample] |
| P-118 | 7 Nov | controls `72fc160`, fly `8d656a9`, unpushed (push together: fly's app tests need the mock's `write`) | `applyFlightControls`, called before every physics step, writes its eleven commands (stick, rudder, throttle, trims, flaps, brakes, gear lever) through one native property batch per SDK, slots in the order of the old single sets, with `create` as a single set has; the conditional writes (control law, automatic flaps, roll rate, STOVL) stay single sets in their places (audit 0SFS 5 Nov, prompt 04 step 2). Made again after a model load disposes it; single sets where an SDK has no batches. Exact | Differential harness on real JSBSim, C172, three Vision Jets, F-35B with both engine models × 4 seeds, air and ground: 35,682 calls and steps and 71 model loads with every command, conditional property and 24 state properties `Object.is`-equal; A/A passes; 13 of 14 mutants caught, 1 equivalent (order-only mutants are caught by unit tests, not by state). Node, 9 interleaved rounds: C172 7.11 → 0.19 µs a call, Vision Jet 8.95 → 0.22, F-35B 13.07 → 4.21 µs, about 0.42–0.53 ms/s at 60 Hz. Not a frame-rate claim; not measured in the browser or on a phone | [command batch][c-command-batch] |
| P-117 | 7 Nov | fly `cd75573`, `6a97ee1`, unpushed | fly's once-a-frame rest check tests whether an engine turns before reading every contact's weight on wheels, and passes an aircraft that cannot rest to the rest tracker without reading its motion (audit 0SFS 5 Nov, prompt 04). In flight that drops 15 scalar reads a frame on the C172 and 19 on the F-35B (which adds 2 for its engine test). Exact: every test only reads, and an ineligible sample already reset the still period | 2 new app tests (the still period restarts after one ineligible frame; no `WOW` or motion read in flight, both read when parked); 3 of 3 mutants caught. Node, 9 interleaved rounds, airborne: C172 7.44 → 0.01 µs a frame, F-35B 13.3 → 1.87 µs, about 0.45 and 0.69 ms/s at 60 fps. Chrome recount with P-116 (counts only, per step, from fly `cbc90e2`): C172 in flight 81.5 → 52.7 scalar reads, F-35B 100.3 → 69.4, C172 on the ground 77.5 → 56.5. Not a frame-rate claim; not measured on a phone | [rest check][f-rest-order] |
| P-116 | 7 Nov | ground-contact `2f1b707`, fly `ce8c850`, unpushed | `terrainContact.update`, which fly calls twice a frame, reads the aircraft's pose (latitude, longitude, height, roll, pitch, heading, JSBSim's terrain elevation) through one native property batch instead of 8 scalar reads; the height read after the floor write stays scalar, so no read moves across a write (audit 0SFS 5 Nov, prompt 04). Made again after a model load disposes it. Exact | Differential harness, old and new module in lockstep on two real JSBSim instances, C172, Vision Jet, F-35B × 6 seeds with a moving, missing and jumping surface: 26,003 updates, 16,044 writes, 17,301 stepped states, 37 proposals identical under `Object.is`; A/A passes; 8 of 9 mutants caught, 1 equivalent. Node, 9 interleaved rounds: C172 5.20 → 1.59 µs an update, F-35B 6.91 → 2.03 µs, about 0.43 and 0.59 ms/s at two updates a frame and 60 fps. Not a frame-rate claim; not measured on a phone | [pose batch][g-pose-batch] |
| P-115 | 7 Nov | ground-contact `556b6b3`, fly `cbc90e2`, unpushed | The ground contact clearance (`groundContactClearanceMeters`, `lowestGroundContact`), which fly's fixed-step loop measures before every physics step, reads the gear position, the CG and each contact's position through one native property batch per model instead of 4 + 3 per active contact scalar reads (31 on the C172), as `terrainContact` already reads them (audit 0SFS 5 Nov, prompt 04). Made again when the contact list changes or a model load disposes it. Exact | Real JSBSim, C172, Vision Jet, F-35B: clearance and lowest contact `Object.is`-equal to the scalar measure over 5 gear positions × 200 attitudes, again after 240 steps, after a reload and a model change; 7 of 7 mutants caught. Node, 9 interleaved rounds: C172 19.7 → 0.71 µs a call, F-35B 29.6 → 0.99 µs (the C172's JSBSim step is 12.2 µs), about 1.2–1.8 → 0.04–0.06 ms/s at 60 Hz. Not a frame-rate claim; not measured in the browser or on a phone | [clearance batch][g-clearance-batch] |
| P-114 | 7 Nov | engine `381f8d5`, app `1de4f46`, unpushed | Elevation memory (audit L6). A patch keeps, of each same-size neighbour, a band 1/2^n of a tile wide along the shared edge as sub-tiles of the same pixels, and 2 × 2 pixels of each corner, so a record no longer holds 8 whole 1 MiB neighbours. The loader cache is bounded by bytes as well as tiles, and keeps downloads to decode again. Every reader takes 68 neighbours (WebAssembly core rebuilt), and the TypeScript and Rust scans try the last 4 covering neighbours first when none overlap. App settings (Map → Loading, live): `map.loader.neighborBandLevels` 4 (0 = whole), `map.loader.cacheMiB` 64, `map.loader.encodedMiB` 32 (0 = none). Exact: heights and meshes are bit for bit the same | Differential tests at levels 2–4: heights, the renderer mesh, both cores' meshes and the WebAssembly sampler against whole neighbours, across sizes, the antimeridian, poles, missing and coarser neighbours; check:parity passes. Mutants: loader 41 of 43 caught (2 equivalent), lookup 4 of 8 TypeScript ones caught (4 change speed only) and the Rust one. Browser census, default map, WebGPU, settled / after a 40 s tour, one run each: heights 255/308 → 154/212 MiB, plus 26/31 MiB of kept downloads; downloads read 271/343 → 261/313; decodes 270/342 → 282/423. Node, 512-pixel patch: serialized 9.4 → 1.3 MB, structuredClone 0.84 → 0.10 ms, WebAssembly mesh 0.99 → 0.77 ms (renderer mesh without workers 0.12 → 0.19 ms). Not measured: Google mode, a phone, frame-profiler time | [elevation memory][e-elevation-memory] |
| P-112 | 7 Nov | renderer `adf340f`, engine `fab3b6a`, app `74b3d92`, unpushed | While maps load, their updates run in the host's work passes, once per host frame, and a frame is drawn only when what is drawn changed: the map runtime, the fallback globe, the surface, the raster map's shown tiles and imagery, or Google's tiles (audit L19). Frames drawn anyway (moves, glides, requests) update the maps after the camera, as before; a load's end still draws one frame; a frame-rate cap paces the updates. The scheduler tells work whether its frame presents, and the renderer settles when presentations stop. `map.loading.drawOnlyChanges` (Map → Loading, on) draws every frame again, live. Hosts without work passes, and terrain captures, keep drawing every frame | Differential harness at the globe runtime, one 2D load both ways on the same frames, clock and loader answers: the same picture and the same requests on every host frame, still, moved, gliding and with another elevation source; frames drawn 51 → 34 for 34 picture changes in the still load. 9 mutants caught, 4 survive as signals another covers. Browser (M-6), app cold load with a still camera, Fast 4G and 4×, six interleaved runs: frames drawn 3,385–3,398 → 864–874, so at least 74% repeated the frame before; `boot:content` unchanged (57.5–57.8 s both ways); render 8,680–9,505 → 2,857–2,997 ms, GPU 8,078–8,799 → 2,053–2,294 ms, all measured sections 19,055–19,965 → 11,857–12,538 ms over the load (about 120 ms/s). Not measured: a keyed Google load, a phone | [draw only changes][e-draw-changes] |
| P-074 | 7 Nov | engine `9708e31`, unpushed | The loaded-detail readout (`refreshLoadedDetail`, with `syncDistribution`) is measured at the imagery selector's cadence while tiles stream in, as decided: a publication alone, within `map.imagery.reselectWhileMoving` (100 ms) of the last readout, waits for a wake that measures the last one. A new plan or a due region measure is measured at once, as before. The detail rail can trail the map by one interval while tiles arrive and shows the same once they stop; nothing drawn reads it. `map.imagery.loadedDetailEveryPublish` (Map → Loading) measures on every publication again | Differential test, both readouts on one clock under a drag, steps and a still view: every frame chooses, loads and publishes the same, every new plan reads the same, feedback equal at rest; readouts while streaming 111 → 17 of 120 frames under the drag; 11 of 11 mutants caught. App phone drag at 4×, six interleaved pairs, one build: `refreshLoadedDetail` 55.8–66.5 → 48.3–54.8 ms/s (medians 59.7 → 49.5), `syncDistribution` 19.0–21.0 → 9.7–11.6, lower in every pair with disjoint ranges; frame profiler, map/raster tiles 3.96–4.43 → 3.84–3.95 ms a frame; frames/s unchanged at the display's rate. Far below the audit's estimate of about 45 ms/s: 34 of the 50 ms/s left is the view's region measure, which already ran at this cadence | [loaded-detail cadence][e-readout-cadence] |
| P-071 | 7 Nov | toolbar `d1d76a8`, app `70cad71`, unpushed | The Still activity outline is the default, as decided: the chips at work keep a steady outline instead of a light running around it, so the page no longer restyles and repaints them every frame. Spinning stays a choice under Interface → Toolbar (`interface.toolbar.activityOutline`). Changes the toolbar's pixels, not the globe's | Not re-measured: nothing under it changed since. The audit (app `eaa82c9`, 5 Nov), phone drag at 4×: about 47 ms/s of style and paint, 50.5 → 52.7 frames/s. 20 Oct, flight frame: style 1× 9.5–9.8 → 3.2–3.3; `applyWorldViewport` 1× 14.8–16.0 → 6.9–7.6; frames/s 4× 27.3–28.2 → 28.3–29.8. Tests: toolbar settings and the app's smoke test expect Still by default and Spinning one change away | [flight frame][f-frame] |
| P-111 | 7 Nov | ui `fb69a89`, app `d9ab634`, unpushed | The app files worker adds a static route per map tile host at install (`InstallEvent.addRoutes`, `source: "network"`), so tile requests no longer pass through its fetch handler and do not wake it (audit L26). ui's `networkHosts` option, none by default; the app names its nine tile hosts in `MAP_TILE_HOSTS`. Without the API, or if the browser refuses the rules, the worker installs as before. Exact: the worker answers no request to another host | ui: 2,160 requests to other hosts across worker addresses, isolation modes and page states, none answered; 9 of 10 mutants caught, the survivor equivalent. App: the list equals the engine's tile sources' hosts plus Google, the chart and night lights; 8 of 8 mutants caught. Chrome 156, default map, six cities a run, three interleaved runs each way: 6,985 of 6,985 tile requests through the fetch handler → 0 of 6,997, and the worker started again after 9 of 9 stops → 0 of 9. Request times are network-bound and overlap (medians 36.8–40.3 ms); no time gain measured | [tile hosts][u-tile-hosts] |
| P-110 | 7 Nov | renderer `001bd4c`, unpushed | Babylon is offered only enabled meshes each frame, in scene order, so the active-mesh walk skips tiles the caches keep hidden (audit L8). Lives beside the 360 presentation filter, which owns the same Babylon hook. `renderer.skipDisabledMeshes`, on by default. Exact: Babylon skips a disabled mesh before anything that draws; only the scene's vertex counter, read by nothing in FOSS Earth, now counts enabled meshes | 60-frame differential on a NullEngine scene with active lists equal in order; 13 of 13 mutants caught. Browser, setting on/off/on/off in one page: 0 differing pixels for Google and the default map, WebGPU and WebGL2. Drag at 4× CPU, frame profiler, six interleaved stretches: "render/active meshes" 48.6–52.1 → 30.7–33.7 ms/s with Google tiles (836 meshes, about 500 disabled), 12.6–14.2 → 9.4–10.5 ms/s on the default map (173, about 85 disabled); frames/s unchanged | [hidden meshes][r-hidden-meshes] |
| P-108 | 6 Nov | engine `c0403ca`, unpushed | The terrain loader remembers tiles that answered 404 (quadtree indices) and gives a tile under one its nearest existing ancestor's grid without a request, checked when asked for and when a queued tile starts (audit L21). Exact if no tile exists under a missing one, which held in every Mapterhorn probe | Differential harness, 200 seeds, 20,193 calls: same outcomes (digest `a8ab472f6eed400b`), requests 76,284 → 37,602, 404s 34,974 → 1,840. Browser, 2 km over 0°, 20°E, three interleaved pairs: first view's 404s 46 → 30; after moving 5 km, 15 → 0 requests. Not a frame-rate claim | [missing elevation][e-missing] |
| P-107 | 6 Nov | app `46030d9`, unpushed | Preconnect hints for the default tile hosts (Mapterhorn, USGS), with `crossorigin`, first in `<head>` before the inline isolation script (audit L23). Exact: no pixel changes | Cold visits, headless Chrome, Fast 4G and 4× CPU, six interleaved pairs: first USGS tile's DNS + connect 88 → 0 ms (median), its headers about 90 ms sooner; Mapterhorn's first tile 0 of 6 paying setup, against 2 of 6 (80–121 ms). DevTools throttling does not slow connection setup, so the real-4G gain is unmeasured | [preconnect][a-preconnect] |
| P-106 | 28 Oct | engine, uncommitted local work | `fillQueue()` skips its demand-order missing-image scan when the private missing map is empty. The nonempty path and P-102 stats cache are unchanged | Isolated paired Node, 30 rounds of 2,000 calls: 256 resident/no missing 4.172 → 2.663 ms; 4,000 resident/no missing 87.370 → 60.618 ms. Median paired savings 36.12% and 30.85%, each 30/30 faster, outside the complete unchanged-control range. Nonempty missing and public `pump()` timings are inconclusive. Not a frame-rate claim | [queue scan][e-res-queue] |
| P-102 | 27 Oct | engine, uncommitted local work | `imageryResidency.stats()` keeps its counts until residency changes and returns a new object copied from those counts. A generation counter clears on writes that can change the result: entry state, slots and reserved bytes, demand, missing records, pins, overflow, unplaced, upload counters, in-flight uploads, upload refusals, and dispose. An idle `pump()`, an upload that places nothing, and `setPinned` with the same slots do not invalidate. A missing record is a change once `now()` reaches it. A reentered change notification does not store a half-updated pass, and mutating `limits` on a returned object does not leak | Node, 4,000 resident images and 200 missing: about 9.4 → 0.028 µs/call (median of five loops of 2,000). Not a frame-rate claim | [residency stats][e-res] |
| P-101 | 27 Oct | engine, uncommitted local work | `terrainLightPlugin` skips `updateFloat4` and `updateFloatArray` when every component is `Object.is`-equal to the last write on that same uniform buffer (`WeakMap`). A new buffer, a new effect, or any changed value still writes; `setTexture` still runs on every bind that has a night map | Node, 8,000 identical binds against the always-write loop, no overlap: uniform buffer 5.22 → 2.88 ms; effect-forwarded writes 5.20 → 2.96 ms (about 1.8×). Not a frame-rate claim | [terrain light][e-light] |
| P-104 | 27 Oct | engine `deed8b5`, unpushed | Imagery runtime collects visible bindings and loaded pages in one pass, and compares loaded page keys as sets | Isolated Node collection about 2.25 → 0.46 ms for 256 patches; page-key equality about 11–38% at 64–1,024 pages. Not a frame-rate claim. The browser cohort could not separate frames/s | [runtime][e-run] |
| P-103 | 27 Oct | engine `deed8b5`, unpushed | Imagery selection reuses a ready 65×65 lattice, the nearest corner's hull positions, and the hull sphere | Node selection plus loaded-detail: 337.2 → 299.7 ms, 10.87% against an unchanged control, 28 of 30 pairs. Not a frame-rate claim | [selector][e-sel] |
| P-088 | 27 Oct | engine `deed8b5`, unpushed | Height pixels compact unique keys into the sort buffer during the counting pass | Node captured batches 4.304 → 4.021 ms (−6.6%). Not isolated in the browser arm | [heights][e-heights27] |
| P-001 | 24 Oct | engine `5931043`, unpushed | Imagery display page, depth and table lookups come from a typed-array quadtree that searches each ancestor once per build | Fly C172 at 4×: `publishManaged` 118.6–125.7 → 67.3–75.9 inclusive; `buildImageryDisplay` self 31.5–33.8 → 15.6–17.6; frames/s 28.3–29.5 → 30.9–32.4 | [display tree][e-tree] |
| P-002 | 24 Oct | engine `89f265f`, unpushed | `loadedImageryPages` computes each cell's page inline and skips cells that repeat the page to their left or above | 4×: 4.5–14.1 → 3.0–3.6 inclusive | [loaded pages][e-pages] |
| P-003 | 24 Oct | engine `7e61c70`, unpushed | Height pixels are packed with 32-bit slot and index keys, which fall back exactly to 64-bit keys | 4×: packer `add` self 18.2–23.7 → 10.1–12.5; height `flush` 27.7–32.1 → 19.0–20.4 inclusive; 1× `flush` 10.0–11.6 → 7.3–8.0. With P-002, `syncDistribution` 4× 102.7–113.3 → 83.1–93.3 | [height keys][e-keys] |
| P-004 | 22 Oct | engines `7dce10d` | The spool ring's readouts are packed again only when a resize observer reports a size change, not after every digit | Ring 1×: 1.3–1.4 → 0.2; no frame-rate change. The report still lists it as held; see P-076 | [flight frame][f-frame] |
| P-005 | 22 Oct | engine `b13bab3` | The imagery depth traversal stops once both table bounds are known | `patchTableDepth` 4×: 18.9–21.3 → 14.3–15.3 | [binding][e-binding] |
| P-006 | 22 Oct | engine `b7a0bbb` | Imagery cells are classified without repeating region work | `measureLoadedImageryDistribution` 1×: 6.1–7.0 → 5.4–5.6; 4×: 24.1–25.5 → 17.5–19.2 | [flight frame][f-frame] |
| P-007 | 22 Oct | engine `18e3850` | Residency keeps one sorted demand order until `setDemand` | Pump 1×: 14.9–18.5 → 4.4; 4×: 28.6–29.7 → 6.2–9.2 | [flight frame][f-frame] |
| P-008 | 22 Oct | fly `0f3a00f` (was `2a53629`) | HUD and angle-of-attack readouts write only changed values and edit text nodes in place | Untraced layout 1×: 6.4–6.7 → 4.8–4.9; 4×: 13.6–14.6 → 10.5–13.2 | [flight frame][f-frame] |
| P-009 | 22 Oct | sky `cb85cb0` | The ground light probe gets a new render list instead of emptying and refilling the observed one | F-35B PBR `_prepareEffect` 1×: 11.4–12.4 → 2.6–2.8; 4×: 25.1–26.1 → 3.6–4.2 | [flight frame][f-frame] |
| P-010 | 22 Oct | exhaust `f790503` | Radial integrals without a centerbody are reused for every hat wholly above it | Gas integration 4×: 13.7–16.7 → 7.1–7.8 | [flight frame][f-frame] |
| P-011 | 22 Oct | exhaust `b4ba2c9` | The depth pass updates each moved node's world matrix once, ancestors first | Depth pass 4×: 62.6–74.8 → 41.4–46.0 | [flight frame][f-frame] |
| P-012 | 22 Oct | aircraft `c3bcf8f` | Control-surface state is read through one native property batch | F-35B animation 1×: 10.6–11.6 → 6.9–8.3 | [flight frame][f-frame] |
| P-013 | 22 Oct | aircraft `ab43a16`, fly `4ac7be5` (was `b92eb7b`) | Landing lights read only the gear position. The fly commit also carries cockpit, pilot and physics work the user approved | 1×: 12.7–17.4 → 3.7–4.8; 4×: 17.3–24.7 → 6.9–8.7 | [flight frame][f-frame] |
| P-014 | 22 Oct | exhaust `5bfee85`, ground-contact `93ce0af`, fly `89ef851` (was `d143b6a`) | The 21 October batch: depth occluders published and the plume light toggled only on change, gas optics from cached logarithms, flight state and the recovery snapshot read through one native batch, batches released before the SDK is destroyed | F-35B frame work 7.704 → 3.850 ms/frame; main draws 3.529 → 0.682 ms (frame profiler, WebGL2, flat offline terrain) | [21 October][f-1021] |
| P-015 | 22 Oct | sphere-image `438b7e7`, `f58967a` | Panorama marker quads are culled only when they lie wholly outside the view | Marker draws 48.0 → 23.3 per frame; WebGPU main thread 10.78 → 10.26 ms/frame | [tour continuation][t-cont] |
| P-016 | 22 Oct | tour `ffc532d41` | The validated panorama work-saving paths are host defaults | Panorama CPU on WebGPU 64.6 → 49.3; on WebGL2 54.7 → 44.4 | [tour continuation][t-cont] |
| P-017 | 21 Oct | engine `b7e4e05`, `fd52dd7`, `be3f60a` | Republished imagery tables are compared cell by cell in one reused block; the published feedback JSON is kept for the next comparison; the UI covers are drawn in one draw | App 4×: `publishManaged` 34.2–40.2 → 24.6–29.8 | [state, item 4][state-cost] |
| P-018 | 21 Oct | engine `1589628` | `hasPendingTiles` answers without collecting diagnostics, and selected replacements are counted in one pass | Pending query 86 → 76 ns | [engine notes][e-notes] |
| P-019 | 21 Oct | renderer `af7505e` | The frame-time window is kept sorted instead of copied and sorted every frame for p95 | Not separately measured | [audit][audit] |
| P-020 | 21 Oct | sphere-image `c0422ef`, `d1ed7ef` | The canvas height is read once per pass; a frozen asset's preview candidates are ranked once per range | `selection.ts` self 10.6 → below the readers' cut | [state, item 8][state-cost] |
| P-021 | 20 Oct | engine `497e013` | Imagery tiles are measured with one record per lattice point, reusing the last tile's entry | About 30% faster | [audit][audit] |
| P-022 | 20 Oct | engine `f647f96`, `1e3a0a3`, `f11a819`, `1afb938`, `0600ad3`, `545c5cb`, `90c0ef6`, `329dc6c`, `97a6ae1`, `ac1dd19`, `4b75363`, `a3b213c` | The 20 October exact batch: surface-query bounds read by name; no rebuilt grid, clip or sphere objects; lattice heights kept across revisions; batched heights without re-walking levels; a typed-array height memo; worker heights in one packed table; the withdrawal `Error` built only when needed; ground meshes indexed from float64 arrays; the detail rail skips unchanged writes; residency stats in one pass; one view's measurements shared by the plan and the loaded pages; height pixels sorted as a typed array | Per-change table in the audit; the withdrawal `Error` alone cost 22 | [audit][audit] |
| P-023 | 20 Oct | engine `b2ddff9` (pinned first by `6058d4f`) | Each committed terrain mesh is uploaded once with its seams, skipping arrays the mesh already holds | See the report | [state, terrain commit][state-terrain] |
| P-024 | 20 Oct | renderer `24b6a6d` | Depth and stencil clears wait until a draw needs them, so a 360 image draws in one WebGPU pass | GPU 3.62 → 1.61 ms/frame | [audit][audit] |
| P-025 | 20 Oct | sky `e4a3dc3` | The star field does no work when no star could be drawn | Entering a 360 image at 4×: main thread 29% → 25% | [audit][audit] |
| P-026 | 20 Oct | sphere-image `61d04a2` | Orbs are sized by the projection test alone, without a canvas read per orb | About 1.9, by construction | [audit][audit] |
| P-027 | 20 Oct | app `9904178`, `550b10d`; toolbar `4c1d7ee` | One reduced-motion media query; the POI exit button's hidden state and the download-rate text are written only on change | Removes `matchMedia`'s 1.2 | [audit][audit] |
| P-028 | 20 Oct | toolbar `1872be5`, app `b9a12a2`, fly `dddb895` | The Activity outline setting exists; its default is still Spinning (P-071) | Still saves about 47 of style and paint at 4× | [state, waiting][state-wait] |
| P-029 | 19 Oct | engine `a034920`, `dadbbcd` | Imagery heights are reused on a 65×65 lattice per tile; grid heights, samples and hull positions are kept until the surface changes | See the report | [audit][audit] |
| P-030 | 19 Oct | engine `468a42f`, `996ba1b`; app `7eadf4d` | The Google 3D Tiles code is imported in parallel and loaded only on demand | Cold first frame 3.90 → 2.74 s | [startup loading][startup] |
| P-031 | 18–19 Oct | engine `580ad9c`, `b6fc621`, `1c842c2` | WebAssembly worker pools by default; terrain meshes and height batches are prepared in workers, and float32 positions are adopted without a copy | No single metric | [WebAssembly cores](webassembly-cores.md) |
| P-032 | 19 Oct | ui `21fb9c9`, `d6098d8`; foss-earth.github.io `543e2a98`; 0sfs.github.io `d620502`; fly `3493f91` | The boot terminal's modules are fetched at page start; the isolation reload is served from cache; the landing pages register the service workers; `/rc/` skips the flight's early modules | Flight chunk requested at 0.62 s instead of 1.06 s; isolation reload about 15 ms instead of 180–190 ms | [startup loading][startup] |
| P-033 | 17–18 Oct | sky `d319dd5`, `0af6bda` | The multiple-scattering and irradiance tables ship precomputed; the sky is evaluated in a worker | Atmosphere build about 115 → 26 ms | [startup loading][startup] |
| P-034 | 17 Oct | renderer `70c13ac`, `3cca1fd`, `dfbfb8d`, `721f4fa`, `4f061bf`, `2da3af9`; app `b062e0e` | The WebGPU presentation probe is skipped and its result remembered; Babylon barrels keep only the modules in use; the shader store has its own chunk, and only the active language's chunk is preloaded | About 0.42 s at start; app start JavaScript 1.83 → 1.10 MiB compressed | [startup loading][startup] |
| P-035 | 17 Oct | fly `dbfa84e`; aircraft `6630dff`; exhaust `194d7fb`; ground-contact `9e10d9c`; tour `2862e1cd7`; engine `5d0356f`, `64c31ed` | Builds include only the Babylon modules in use; builders are called by name; PBR materials are detected by class name | Flight globe JavaScript 2.12 → 1.43 MiB compressed; 15.0 KiB brotli off the flight chunks; tour start JavaScript 1.83 → 1.11 MiB | [startup loading][startup] |
| P-036 | 17 Oct | ui `44717f9`; fly `7a383d1`, `9e25a9e`; tour `eca262ffd`; about `882926b` | A boot terminal paints from each page's first bytes; startup marks; the built-from record moves to the end of the body | Tour cold first paint 4.14 → 0.23 s; `/fly/` 0.42 → 0.24 s | [startup loading][startup] |
| P-037 | 15–17 Oct | app `d0c1211`, `3d90acd`, `2a7f04a`, `0a48abd`, `bf2e4a0`, `12814c7`; scenes `713ae9a`; ui `1ccb7a2`, `6d8ae31`; tour `593b3ecad` | React and the tab overlay load with `import()`; the scenes panel stays off screen until opened; one `Intl.NumberFormat`; named lazy features; build guards keep PBR, MeshBuilder and preview backends out of the startup chunks | 66 KiB brotli off the first frame; warm globe 2.47 → 2.38 s | [startup loading][startup] |
| P-038 | 14–15 Oct | engine `a31de78`, `31a454d`, `46b8a8c`, `979bb03`, `6cb2494` (app `016a9ee`), `4e4e9bf`, `c681cff`, `d95411a`, `f425410`, `09a7225` | Terrain download claims and ordering; a tile's own elevation first and 16 map requests; the map cache opens before the renderer; an elevation decode worker pool; unused normals dropped; a WGSL occlusion quad | Desktop downloads 600 → 320, phone proxy 947 → 441; overview 2.6 → 1.9 s; the phone's first tile about 2 s sooner; 2.6 MiB of glslang and twgsl no longer downloaded | [engine notes][e-notes] |
| P-039 | 14 Oct | engine `ebca29b`, `e4e63a4`, `744f087`, `d30379e`, `8095c8f`, `79e9ef6`, `7c76c86`, `cb86630`, `2d4255f`, `c425f93`, `52bfea7` | Bit-exact micro-optimizations: row-wise sampling, per-query Mercator trigonometry, a one-word Terrarium decode, presized arrays, no copies | Not measured | Commit messages |
| P-040 | 12 Oct | images `3699810`, `83fc0b9`, `77e92cb`, `c26559c`, `fe19ea7` | A JPEG port of jpeg-js, resize, sRGB, orientation, alpha and PNG, with the same bytes | 1.12× to 3.61× faster; 8192 tour build 15.5 → 9.7 s | [images](performance.md#images) |
| P-041 | 12 Oct | sky `f3ec16f`, `e8ece15` | One march per line of sight for every Sun direction; stars without an object per star | Day 7.9 → 2.5 ms; `createAtmosphere` 121 → 95 ms; 8,404 stars 3.54 → 1.10 ms | [sky](performance.md#sky) |
| P-042 | 12 Oct | sphere-cubemap `357d4de`, sphere-equirectangular `18b76dc`, sphere-tiled-cubemap `96c7f3f` | An equirectangular face or tile is sampled in one loop | A 1536 face 736 → 519 ms; tour build 17.6 → 15.1 s | [projections](performance.md#projections) |
| P-043 | 12–15 Oct | fly `009c560`, `ed5e270`; aircraft `7b19db2`; exhaust `123011a` | The F-35B's hidden gear pipelines are warmed under the loading screen; a page checks that showing the gear compiles nothing | Not measured | Commit messages |
| P-044 | 12 Oct | renderer `9fdba5d` | The drawing buffer keeps its last size until a resize gesture ends | Not measured | Commit message |
| P-045 | 23 Oct | multiplayer `aefe8a2` (documented in anti-cheat `bdf9532`) | Multiplayer loads on demand and is prefetched while idle | Not measured | Commit message |

## Rejected or no gain

Do not retry these without new evidence. Revert a no-gain edit, but add its
row here.

| ID | Date | Idea | Result | Report |
| --- | --- | --- | --- | --- |
| P-100 | 27 Oct | Reuse per-call scratch in `evaluateView` and stored grid-hull positions in `measureFocus`; `toScreen` takes an optional out point | Node five-view replay, 16 rounds: median 158.9 → 159.5 ms (ranges 148.2–196.1 and 151.6–171.5); reverted | [view scratch][e-scratch] |
| P-046 | 22 Oct | Rewrite the selector's screen-area loop | 388 vs 382.4 ms, against 391.7 vs 386.6 for unchanged source; reverted | [flight frame][f-frame] |
| P-047 | 22 Oct | Delay the selector's hull construction | 402.1 vs 399.6 ms over 12 rounds; reverted | [flight frame][f-frame] |
| P-048 | 22 Oct | `Math.hypot` → `Math.sqrt` | Not exact: the result bits differ | [flight frame][f-frame] |
| P-049 | 22 Oct | Cache the canvas size in `applyWorldViewport` | Not exact: a resize lags a frame | [flight frame][f-frame] |
| P-050 | 22 Oct | Skip `publishManaged` on staged revisions | Not exact: it changes what is published | [flight frame][f-frame] |
| P-051 | 22 Oct | A view cache that measures an old view while the flight moves | Not exact | [agent prompts][f-prompts] |
| P-052 | 21 Oct | Hash-only (FNV-1a) table equality as proof | A birthday search finds collisions in seconds; P-017 compares bytes instead | [state, item 4][state-cost] |
| P-053 | 22 Oct | Global `set.wasm.core.imagery=typescript` (`nimg`) as a speedup | It also removes page batching and memoization. Selection 1×: 47.3–53.1 → 147.0–173.1; main thread 35–39% → 47–54%. Says nothing about verification alone (P-073) | [flight frame][f-frame], [heights candidates][e-heights] |
| P-054 | 21 Oct | Flight dynamics in a worker (fly `901a401` keeps the main-thread solver) | Gate failed: at most 0.64 ms/frame movable; one more frame of input latency; the Google 60 m route 6.4% slower; total CPU rises | [worker results][f-worker] |
| P-055 | 21 Oct | Replace JSBSim's C++/WASM with Rust; worker pools for dependent simulation steps or one small field; an exhaust worker chosen from a microbenchmark; polygon reduction alone as a CPU fix | Rejected in the 21 October review | [21 October][f-1021], [exhaust worker][f-exhaust] |
| P-056 | 22 Oct | A hunk-only gear commit | Superseded by the whole-file commit in P-013. Do not retry it or describe it as pending | [22 October handoff][f-handoff] |
| P-057 | 22 Oct | Update golden digests to absorb a difference | Never: digests pin the shipped output | [agent prompts][f-prompts] |
| P-058 | 22 Oct | Lazy import of the WebGPU implementation | Saves 336,666 raw / 82,920 gzip eager bytes but delays the GPU renderer about 0.46 s and content about 0.41 s; removed (patches in renderer `build/night/lazy-webgpu*.patch`) | [state][state] |
| P-059 | 22 Oct | The X1 simpler shader as an exact change | WebGL pixels differ by up to two channel values; kept as a phone decision (P-075) | [state][state], [tour next agent][t-next] |
| P-060 | 22 Oct | Lossless JPEG Huffman optimization of the tour's previews, with libjpeg-turbo | Decoded pixels identical, but only 1.04% off the preview sheet and 1.91% off one 256-pixel face: not worth a new preparation dependency and a content migration | [tour continuation][t-cont] |
| P-061 | 20 Oct | Prefetch a group's heights in one batch | More heights for fewer calls: a loss in the flight. Kept in engine `build/attempts/imagerySelector.prefetch.ts` | [state, what changed][state-changed] |
| P-062 | 20 Oct | Discard the MSAA store | No GPU gain on the M5 | [state, what changed][state-changed] |
| P-063 | 20 Oct | Horizon-cull the main camera's tiles | 13–15% of drawn tiles but about 1% of vertices, and pixel identity is not airtight | [state, what changed][state-changed] |
| P-064 | 20 Oct | Insertion sort for the small height-key arrays | Same order, but saves about 2 at most; not pursued | [state, by cost][state-cost] |
| P-065 | 20 Oct | Terrain-commit step F: compute the bounds ourselves | Writes Babylon's private state and still scans every vertex | [state, terrain commit][state-terrain] |
| P-066 | 14 Oct | Raise the imagery selection budget from 2 to 16 ms, or the upload budget from 4 to 16 MiB a frame | The first imagery request came sooner on the phone proxy, but not the overview or sleep; not committed | [engine notes][e-notes] |
| P-067 | 19 Oct | A head-script preload of Babylon's shader chunk | The first frame did not move (2.77 → 2.83 s on `/app/`, 3.58 → 3.59 s on `/fly/`), and the isolation reload came 0.08 s later | [startup loading][startup] |
| P-068 | 19 Oct | V8 explicit compile hints on the entry and startup chunks | No difference | [startup loading][startup] |
| P-069 | 17 Oct | WebAssembly atmosphere tables | No faster; the tables ship precomputed instead (P-033) | [startup loading][startup] |

## Held

| ID | Date | What | Status | Where |
| --- | --- | --- | --- | --- |
| P-070 | 22 Oct | The isolated gear patch, fly `build/osfs-night/patch/gear.patch` | Already in P-013. Never reapply or expand it: the user's approval covered only that commit | [22 October handoff][f-handoff] |

The "held engine-summary patch" that the 22 October briefs ask agents to
preserve (`engineSummary.new.ts` and `arms/engineSummary.ring.ts` in fly
`build/osfs-night/`) is byte-identical to engines `7dce10d`. It shipped as
P-004.

## Waiting on a decision

Each of these changes pixels, timing or behaviour, so it needs the user's
decision and, if adopted, a setting whose default is today's behaviour.
Before recommending one, re-measure it if the code under it has changed since
the measurement.

| ID | Since | Decision | Measured | Report |
| --- | --- | --- | --- | --- |
| P-113 | 7 Nov | renderer `d7fbefe`, unpushed: draw the main group's opaque meshes near to far (audit L24). Babylon orders them by material, which for map tiles is load order, close to far first. The renderer measures each opaque submesh from the camera before the group sorts; a draw whose picture depends on the order (the sky dome, which writes no depth) keeps Babylon's place, and the plain draws between such draws are sorted. `renderer.opaqueNearToFar`, off. Keep it off unless L25 accepts the pixels and a GPU without hidden-surface removal shows a gain | Minneapolis, 1280 × 800, on/off/on/off in one page: Google 61 (WebGPU) and 41 (WebGL2) of 1,024,000 pixels, up to 8 levels; default map 5 and 0; each arm against itself 0. Strict-depth tie check: WebGL2's 41 all at depth ties, WebGPU's 48 of 61. Dragging Google tiles at 4×: render 4.96–5.11 → 5.10–5.17 ms a frame on Metal (about +0.1 ms), 59.7–59.9 frames/s both; SwiftShader WebGL2 13.2–13.5 → 13.1–13.5 frames/s, no gain. 18 of 22 mutants caught, 4 change nothing | [opaque near to far][r-opaque-order] |
| P-109 | 6 Nov | Google tile memory (audit L5). (a) 16-bit indices in the Google worker: index memory halves, but on WebGPU pixels change along tile edges, from the index format alone (same shader and pipeline; WebGL2 unchanged). Keep only if L25 accepts it. (b) Count real tile bytes so `map.google.cacheBytes` binds: needs a byte limit, since at 307–410 MiB a full cache refuses tiles in heavy views. Counting for the reading alone would be exact | Minneapolis, 1.5 km up, WebGPU 1280 × 800: index 1.88 → 0.94 MiB of 121 MiB held (textures 112). Pixels 32- vs 16-bit: 841 of 1,024,000 (0.08%), up to 31 levels; each width against itself 0–12. 250 m up at the horizon: 568 meshes, 311 MiB; 380–570 KiB a mesh, so 6,000 tiles is 2.2–3.3 GiB | [Google tile memory][r-google-memory] |
| P-072 | 22 Oct | One raster update per frame in 0SFS: engine `setExternalViewState` calls `rasterTilesRuntime?.update()` again after `prepareFrame`. Proposed: `if (!simRunning) rasterTilesRuntime?.update();`. Tiles would arrive at different moments | Removing it (`c11`): frames/s 4× 26.5–28.1 → 36.4–37.2; p95 50 → 33.3 ms; raster 4× 538–566 → 465–472. A middle course with doubled budgets (`c11m`) was also measured | [flight frame][f-frame] |
| P-073 | 20 Oct | Verify imagery heights only at admission, or make verification optional. The worker's double check never feeds the output; it is the WebAssembly design's safety net | Measured on 22 October, before P-003: flush and receive 1× 10.6–12.9, 4× 29.9–30.5. Height `flush` is now 7.3–8.0 at 1× and 19.0–20.4 at 4×, so re-measure. Keep packed queries and the revision cache in any arm | [flight frame][f-frame], [heights candidates][e-heights] |
| P-075 | 20 Oct | Phones: `renderer.resolutionScale` below 1 (P1), antialiasing off (P3), an opaque canvas (P7), the four 360 experiments (X1) | See the reports | [state, waiting][state-wait], [tour next agent][t-next] |
| P-076 | 22 Oct | The ring ResizeObserver (P-004) shipped although the reports still list it as held: a resize to the same text now repacks at once. Confirm that this was intended, or record the decision | Ring 1×: 1.3–1.4 → 0.2 | [flight frame][f-frame] |
| P-077 | 20 Oct | Horizon culling of far-side Google tiles, behind a setting | About 15 at 4× | [state, waiting][state-wait] |
| P-078 | 22 Oct | Nozzle creep: the F135 nozzle position changes about 6.8e-9 a frame yet rebuilds the gas geometry. Options: quantize the aperture, a rebuild-cadence setting, or keep | About 5–7 at 1× and 10–11 at 4× on the F-35B (profile attribution, no arm) | [flight frame][f-frame] |
| P-079 | 22 Oct | F-35B primitive merging (259 primitives, 349 nodes with the F135): a structural and render-order change. The user ruled out changing aircraft models in optimization work | Not measured | [flight frame][f-frame], [F-35 model LOD][f-lod] |
| P-080 | 22 Oct | Periodic re-resolve of absent properties: the F-35B keeps 7 scalar fallback reads per surface state. The exact option needs an SDK property-tree revision or notification | Not measured | [flight frame][f-frame] |
| P-081 | 22 Oct | Two VR correctness follow-ups, separate from performance: camera switching during XR can stop the cockpit screen while HUD copies stay suppressed; the G-force blackout is DOM-only and missing from the headset mirror | Not performance | [22 October handoff][f-handoff] |

Already decided, for reference:

| ID | Date | Commit | Decision |
| --- | --- | --- | --- |
| P-082 | 22 Oct | fly `0bedc6d` | Physics at 60 Hz by default; 30 Hz is not validated |
| P-083 | 20 Oct | engine `5d1b132` | `map.terrain.hideCoarseStandIns` on by default, as a requested bug fix; it changes what is drawn while tiles load |
| P-084 | 20 Oct | engine `a073fa4` | Coarser elevation, opt-in |
| P-085 | 20 Oct | engine `79f5b3b` | Imagery refines to the detail target once the view rests (`map.imagery.refineAtRest`) |

## Open

Candidates without a result yet, with the latest measured cost. The ranking
and the first steps are in [28 October][e-resume].

| ID | Area | Candidate | Latest cost | Notes |
| --- | --- | --- | --- | --- |
| P-105 | engine imagery residency | Remaining `fillQueue` work after P-102 and P-106: entry count, ordered-demand walk, nonempty missing path | 27 Oct 4× still C172: self 9.4, before P-106 | Same file as P-102. P-106 skips only the empty missing-map scan; there is no new browser measurement |
| P-086 | engine imagery selector | What is left of `evaluateView`, `surfaceSamples`, `footprintFrom`, `heightsAt` and `sample`, and `measureImageryView` across its callers | Fly C172 4×, 27 Oct, after `deed8b5`: `evaluateView` self 44.5, inclusive 111.8; `surfaceSamples` 24.3; `footprintFrom` 20.8; `heightsAt` 8.2; `measureFocus` 13.6 | P-046, P-047, P-048, P-051, and P-100 failed or are not exact. Do not retry scratch reuse or `Math.hypot`. Keep the floating-point order. `heightsAt` must keep handing out a fresh coordinates array |
| P-087 | engine imagery display | `buildImageryDisplay` after P-001 | Fly 4× self 18.7 | [display tree][e-tree] |
| P-089 | engine distribution | `syncDistribution`'s own `measureImageryView` and the rest of `publishManaged` | `syncDistribution` 4× 83.1–93.3; `publishManaged` 4× 67.3–75.9 | The cadence is P-074. [loaded pages][e-pages] |
| P-090 | engine viewport and forced layout | `applyWorldViewport` and the reads after mid-frame HUD writes | 27 Oct 4× still C172, after `deed8b5`: self 48.6. Earlier 4×: fly 34.2, app 28.7, tour 26.4; `getBoundingClientRect` 10.4–13.8 in the app and tour | Its first style recalc pays for the CSS animation (P-071). Later forced style and layout need a proof that the HUD writes never move the canvas. P-049 is not exact |
| P-091 | exhaust depth | Per-mesh eligibility and the eight-corner projection | 7.8–14.6 before exhaust `f7d994e` (23 Oct), which changed depth eligibility | Take a new baseline first. Brief: Agent 4 in [agent prompts][f-prompts] |
| P-092 | Babylon uniforms | `writeBuffer`, `_buffersEqual`, `_updateFloatArrayForEffect` | 27 Oct 4× still C172: `writeBuffer` 22.3; uniform-buffer file 41.2. Earlier targets: `writeBuffer` 11.5–14.7; app phone `_buffersEqual` 8.3 | P-101 skips identical terrain-light writes. It does not cover Babylon's own compare. Do not patch Babylon |
| P-093 | engine UI occlusion | Cache `worldBoxOf` boxes until the layout changes | 16.7–19 on the phone | Needs a proof that a cache never misses a change; the first read is the frame's first forced layout, so removing it may move the cost rather than save it. [state, by cost][state-cost] |
| P-094 | fly | Smaller leads: `measureFocus`, `syncManagedPins`, garbage collection, swept collision, F-35B view updates, unprofiled main-thread work | Fly 4×: `measureFocus` 11.7, `syncManagedPins` 9.8. 21 Oct: GC 2.8–3.7 ms/s (8 at 60 m); swept collision 0.40 ms/frame at 60 m; F-35B view updates about 0.55 ms/frame; trace p95 2–4.5 ms above profiled p95 on Google | [worker results][f-worker] |
| P-095 | 0SFS cockpit | Skip drawing the world where opaque cockpit meshes cover it | Not measured | [0SFS follow-ups](https://github.com/0SFS/docs/blob/main/TODO.md) |
| P-096 | exhaust | Rust/WebAssembly gas-optics kernel | Not started | Gate: at least 0.25 ms of main-thread p95 per field, with no state-age, latency or total-CPU regression; synchronous Rust first. [exhaust worker][f-exhaust] |
| P-097 | tour | The six advanced specifications: dynamic atlas storage, elevation memory ownership, coherent frame geometry, the remaining marker batching, backend-aware early preload, optional panel loading | See the specification | [tour next agent][t-next] |
| P-098 | cloud runs | R2 to R5: the four 360 experiments' pixels (X1), memory, heap and GPU memory, startup blocking and bytes | Not run | [cloud runs](proposals/implementation/performance-cloud-runs.md) |
| P-099 | 360 entry | Entering a 360 image at 4×: the sphere-image record and the sky's atmosphere transmittance | About 12.4 and 13 | [state, by cost][state-cost] |

## Rewritten commit IDs

Fly's `main` was rebased onto `origin/main` on 22 October at 19:50. The old
IDs survive only in the local reflog, which expires. Read an old ID in a report
as its new one:

| Old | New | Old | New |
| --- | --- | --- | --- |
| `2a53629` | `0f3a00f` | `7e4e862` | `15712b5` |
| `d143b6a` | `89ef851` | `cdd6e86` | `eeab59f` |
| `a44f245` | `d644e69` | `ea2568c` | `0bedc6d` |
| `12ccb9c` | `243ee80` | `16ca8ff` | `2c7233b` |
| `b92eb7b` | `4ac7be5` | `1c47a50` | `5d1c691` |
| `b0d1295` | `bd2aa64` | `78aa4fe` | `2001aa1` |
| `203ff36` | `3759104` | `eb3f65a` | `ed12c98` |
| `73fcdd5` | `1918b82` | `f735711` | `ce3cf2a` |

In this repository, `9ccd2b6` became `f9b3551` and `c0acf77` became `51a517b`.

## Units and methods

- **24 October and 22 October** (engine and fly reports): ms/s of main-thread
  CPU from 8-second CPU profiles at 1× and 4× CPU throttling, in headless
  Chrome with WebGPU on the M5 MacBook Air, 1280×800 CSS px at DPR 1, the
  default C172, live terrain, physics at 60 Hz. Ranges are over at least three
  interleaved pairs of pinned builds.
- **21 October** (fly): ms per frame from the frame profiler, on WebGL2 with
  flat offline terrain and physics at 120 Hz.
- **12–20 October** (docs and audit): Node microbenchmarks as interleaved
  medians, browser startup marks, and phone-drag CPU profiles. Each report
  states its own method.
- Inclusive rows nest, so never add them. A 4× throttle is not a phone result.
  At 1× most pages hold about 59 frames/s, so only function costs show there.

[audit]: performance-audit.md
[startup]: proposals/startup-loading.md
[state]: proposals/implementation/performance-agent-state.md
[state-changed]: proposals/implementation/performance-agent-state.md#what-changed
[state-terrain]: proposals/implementation/performance-agent-state.md#the-terrain-commit-engine-b2ddff9-done
[state-cost]: proposals/implementation/performance-agent-state.md#then-by-measured-cost
[state-wait]: proposals/implementation/performance-agent-state.md#waiting-on-the-user
[e-tree]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-24/display-tree.md
[e-pages]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-24/loaded-pages.md
[e-keys]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-24/height-keys.md
[e-binding]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-22/binding.md
[e-heights]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-22/heights-candidates.md
[e-notes]: https://github.com/foss-earth/engine/blob/main/docs/performance-notes.md
[e-scratch]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-27/view-scratch.md
[e-light]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-27/terrain-light.md
[e-res]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-27/residency-stats.md
[e-res-queue]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-27/residency-stats.md#p-106-empty-missing-set-queue-scan--28-october
[e-resume]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-27/resume.md
[a-preconnect]: https://github.com/foss-earth/app/blob/main/docs/performance/2026-11-06/preconnect.md
[e-missing]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-11-06/missing-elevation.md
[e-readout-cadence]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-11-07/loaded-detail-cadence.md
[e-draw-changes]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-11-07/draw-only-changes.md
[e-elevation-memory]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-11-07/elevation-memory.md
[r-google-memory]: https://github.com/foss-earth/renderer/blob/main/docs/performance/2026-11-06/google-tile-memory.md
[r-hidden-meshes]: https://github.com/foss-earth/renderer/blob/main/docs/performance/2026-11-07/hidden-mesh-candidates.md
[r-opaque-order]: https://github.com/foss-earth/renderer/blob/main/docs/performance/2026-11-07/opaque-near-to-far.md
[u-tile-hosts]: https://github.com/foss-earth/ui/blob/main/docs/performance/2026-11-07/tile-hosts-past-the-worker.md
[e-sel]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-27/selector.md
[e-run]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-27/runtime.md
[e-heights27]: https://github.com/foss-earth/engine/blob/main/docs/performance/2026-10-26/heights.md
[n-engine-sample]: https://github.com/0SFS/engines/blob/main/docs/performance/2026-11-07/engine-sample-batch.md
[c-command-batch]: https://github.com/0SFS/controls/blob/main/docs/performance/2026-11-07/flight-command-batch.md
[g-pose-batch]: https://github.com/0SFS/ground-contact/blob/main/docs/performance/2026-11-07/terrain-contact-pose-batch.md
[f-rest-order]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-11-07/rest-check-order.md
[g-clearance-batch]: https://github.com/0SFS/ground-contact/blob/main/docs/performance/2026-11-07/clearance-property-batch.md
[f-frame]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-22/flight-frame.md
[f-handoff]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-22/session-handoff.md
[f-prompts]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-22/agent-prompts.md
[f-1021]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-21/README.md
[f-worker]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-21/flight-dynamics-worker-results.md
[f-exhaust]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-21/exhaust-wasm-worker.md
[f-lod]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-21/f35-model-lod.md
[t-cont]: https://github.com/UMN-VR/tour/blob/main/docs/performance-continuation.md
[t-next]: https://github.com/UMN-VR/tour/blob/main/docs/performance-next-agent.md
