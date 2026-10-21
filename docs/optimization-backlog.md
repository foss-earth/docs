# Optimization backlog

Every performance and power optimization we know of that is not done yet, for
FOSS Earth and the apps built on it: 0SFS and the UMN tour. Each item is ranked by
what it should save and what it should cost to build. Most of the work lands in
FOSS Earth. Items that only one app owns are in that app's own backlog:

- 0SFS: [research/optimization-backlog.md](https://github.com/0SFS/research/blob/main/optimization-backlog.md)
- UMN tour: [docs/optimization-backlog.md](https://github.com/UMN-VR/tour/blob/main/docs/optimization-backlog.md)

Written 16 October 2026 against the working trees of that day. It merges the
earlier catalogues and checks each item against the code:

| Prefix | Catalogue |
| --- | --- |
| CP | 0SFS [Competitor performance techniques](https://github.com/0SFS/research/blob/main/competitor-performance.md), 25 September |
| PR | research [WebGL panorama performance review](https://github.com/foss-earth/research/blob/main/docs/webgl-panorama-performance-review.md), 70 candidates |
| EN | engine [Performance notes](https://github.com/foss-earth/engine/blob/main/docs/performance-notes.md) |

What is already done, and how a speedup is proven to change nothing, is in
[Performance](performance.md). The rules for when a frame is drawn are in
[Render on demand](render-on-demand.md).

Updated 20 October 2026 after the first performance session (the
[20 October audit](performance-audit.md#20-october-2026)). Its finished items
are marked Local. The items it added carry measured costs, marked
"measured", and the session's next steps are in the
[performance agent state](proposals/implementation/performance-agent-state.md).

## How to read the estimates

**None of the gains below were measured.** They are estimates from the code, the
workload arithmetic and what competitors report. Treat them as the order to try
things in, not as results. Measure each change with the frame budget
(`?set.renderer.profiling.enabled=1`), `flightPerf=1` in 0SFS, and the power
harness in [M1](#measurement-first).

- **Gain** names what it saves: GPU time, main-thread CPU, power, memory, bytes
  downloaded, or time to the first useful view. A percentage is of that one
  thing, on the workload named, not of the whole frame.
- **Effort**, for one developer: **S** up to 2 days, **M** up to 2 weeks,
  **L** up to 6 weeks, **XL** longer.
- **Tier** is the rank:
  1. Small, likely to save 10% or more of what it targets, or needed before
     anything else can be judged.
  2. Medium effort, likely large saving.
  3. Medium to large effort, moderate or uncertain saving.
  4. Architecture bets: large effort, large possible saving.
- **Backend:** All, or the backends that can do it (WebGPU, WebGL2, WebGL1).
- **Load:** F is flying in 0SFS, G is moving around the globe, T is a 360
  photograph in the tour.
- **Status:** Open, Partial, Off (built but off by default), Local (committed
  but not pushed), Done.

## Ranking

The first 30, best ratio first. The full catalogue is below.

| Rank | ID | Item | Gain (estimate) | Effort | Load |
| ---: | --- | --- | --- | :-: | --- |
| 1 | M1 | Power and frame-time harness on a fixed route | Makes every other number real | S | F G T |
| 2 | P1 | Draw at most about 1.5 device pixels per CSS pixel by default on dense screens | GPU fragment work −45 to −75% on 2× screens | S | F G T |
| 3 | P4 | Default frame cap while flying on battery (30 or 40), and vsync-aligned capping | Whole-frame CPU and GPU power −30 to −50% | S | F |
| 4 | P7 | Opaque canvas (`alpha: false`, WebGPU `alphaMode: "opaque"`) | Compositor blend of a full-screen layer; a few % of GPU power | S | F G T |
| 5 | D1 | Ship the JavaScript speedups (images, sky, projections): pushed, so the apps' next build has them | Sky 3–5× faster, star update 3× | S | F G T |
| 6 | T1 | Horizon detail: relax screen-space error toward the horizon (CP4) | Google triangles and downloads −30 to −60% at cockpit pitch | M | F G |
| 7 | T2 | Make Google tile memory real: byte accounting in the Babylon adapter (CP8, PR1) | Memory bounded; fewer context losses on phones | M | F G T |
| 8 | C1 | Collision BVH with a per-frame ground cache (CP13) | Near-ground physics CPU: 2.25 ms → under 0.1 ms per frame | M | F |
| 9 | P5 | Lower resolution while the camera moves, full when it stops (PR43) | GPU −40 to −70% during motion, nothing at rest | M | G T |
| 10 | P8 | Dynamic resolution from measured GPU time | Holds frame rate, caps power on any device | M | F G T |
| 11 | T3 | Fog and haze culling: skip tiles the atmosphere hides | Distant tiles −20 to −50% in haze | M | F G |
| 12 | T5 | Hold back requests while the view turns fast (CP6) | Wasted downloads −20 to −40% when turning | M | F G |
| 13 | R1 | Share index and UV buffers between terrain tiles of one segment count (PR52) | Terrain GPU memory and upload −60%; less CPU per tile | M | F G |
| 14 | R2 | Typed arrays for terrain positions | One copy less per upload; less garbage | S | F G |
| 15 | P9 | Spatial upscaling with sharpening after a lower render scale | Same GPU saving as P1, less visible softness | M | F G T |
| 16 | T4 | Load the centre of the screen first (CP5) | Sharper where the eye is, sooner | M | F G |
| 17 | X1 | Promote the panorama experiments after device trials (PR3, 5, 6, 7) | Main-thread render −25% inside a stop; blend and shader savings | S | T |
| 18 | R3 | Build terrain meshes in the decode workers (PR51, EN) | Main-thread stalls on tile arrival −2 to −10 ms each | M | F G |
| 19 | T6 | Port `UnloadTilesPlugin`: free GPU copies of hidden tiles, keep CPU copies | GPU memory −30 to −60% when turning | M | F G T |
| 20 | T7 | Port `TileCompressionPlugin`: 16-bit indices, quantized normals and UVs, no mips | Google geometry memory −25 to −50% | M | F G |
| 21 | B1 | WebGPU: snapshot rendering (render bundles) for static meshes | Draw submission CPU −30 to −80% for what it covers | M | F T |
| 22 | B6 | WebGL2/WebGPU: occlusion queries to skip tiles behind terrain and buildings | Low flight in valleys and cities: draws −10 to −40% | L | F G |
| 23 | S1 | Babylon: import specific modules, not barrels (PR62) | Startup JS −20 to −40% (4.8 MB flight, 5.4 MB tour) | M | F G T |
| 24 | S3 | Compile shaders in parallel, before they are needed (PR13) | First-flight and first-photo hitches removed | M | F G T |
| 25 | P10 | Pause or slow the globe while a panel covers most of it | Power while reading panels | S | G T |
| 26 | R5 | Heights on the GPU from a shared grid (CP10) | Terrain CPU build and upload mostly gone | L | F G |
| 27 | B3 | WebGPU: compress Google tile textures on the GPU after download | Texture memory ÷4 to ÷8; sampling bandwidth and power | L | F G |
| 28 | C3 | Render from an OffscreenCanvas in a worker | Frees the main thread for input and the DOM | XL | F G T |
| 29 | R4 | Skirts instead of stitching (CP11) | Stitching CPU gone; reproducible edges | M | F G |
| 30 | B7 | Batch Google tiles into fewer draws (`BatchedTilesPlugin`, multi-draw) | Draw calls −50 to −90% at fine detail | L | F G |

## Measurement first

Most of this list cannot be ranked better without numbers. These come first.

| ID | Item | Status | Owner | Effort | Tier |
| --- | --- | --- | --- | :-: | :-: |
| M1 | Qualify the power harness: research's `scripts/benchmarks/power/battery.mjs` integrates whole-machine battery discharge, and `flight.mjs` aligns it to fixed routes but still reports `qualified: false` with route coverage unverified. CPU/GPU/package breakdown, core residency where required, and shared-machine attribution remain separate work. Log qualified watts/joules beside actual frames and useful progress; [adaptive CPU scheduling](proposals/adaptive-cpu-scheduling.md#evidence-and-acceptance) defines the comparison. | Partial, unqualified | research `benchmarks/` | S | 1 |
| M2 | A fixed, repeatable flight: recorded inputs replayed against a byte-for-byte tile cache, so A/B runs fly the same path. `benchmarks/globe-compare` and `scene-ab` are the start. Since 20 October 2026, research's `startup-audit/profile.mjs` replays the same drag, phone finger drag and 360 entry and exit on every run, with a CPU profile named by source function, layout tracing and a reduced-motion switch (research `a26ca32`, `8dcfb02`, `4f5bd62`); tiles still come live. | Partial | research, 0SFS route | M | 1 |
| M3 | Device matrix: M5 on battery in Low Power Mode, an Intel or older iGPU laptop, a mid Android phone on Chrome and Firefox, an iPhone on Safari. One real WebGL1 context. | Open | research | M | 2 |
| M4 | Land the profiler streams in the app (`profiler-streams` branch) | Local | app, renderer | S | 1 |
| M5 | Split the sky's CPU section into illumination, dome, stars and tables | Open | sky or engine | S | 2 |
| M6 | Count Google 3D Tiles bytes and the decode worker's busy time | Open | engine, renderer | S | 2 |

## Pixels and frame pacing

These apply to every backend. On a dense laptop screen the GPU shades
width × height × DPR² pixels a frame, so pixel count and frame count are the two
largest power levers we have.

| ID | Item | Status | Owner | Backend | Load | Gain (estimate) | Effort | Tier | Precedent |
| --- | --- | --- | --- | --- | --- | --- | :-: | :-: | --- |
| P1 | Default `renderer.resolutionScale` so the canvas draws at most about 1.5 device pixels per CSS pixel. The setting exists; its default is 1 × DPR. Tile detail does not drop: the tiles' error is computed from CSS size. (CP1) | Partial | renderer | All | F G T | GPU fragment work −45% at 1.5, −75% at 1.0, on a 2× screen | S | 1 | CesiumJS `useBrowserRecommendedResolution`, on by default |
| P2 | Expose a resolution step per preset. Smooth motion uses 0.75; Save battery does not change it. | Partial | app | All | F G T | As P1, by choice | S | 1 | Web Flight Simulator presets |
| P3 | MSAA off in Save battery, with FXAA in its place where edges show | Open | app, renderer | All | F G | Memory −75% of the colour target; GPU small on Apple tile GPUs, larger on desktop GPUs | S | 2 | Web Flight Simulator, MSFS |
| P4 | Frame cap while flying on battery: 30 or 40, rounded to divide 120 Hz physics. Check that the cap skips whole display refreshes instead of waking on a timer between them, or 30 on a 60 Hz panel judders. (CP3, PR41) | Partial | renderer, 0SFS chooses | All | F | Power −30 to −50% | S | 1 | FlightGear, Rigs of Rods, iOS Low Power Mode caps at 30 |
| P5 | Lower resolution while the camera moves; restore after it rests, with a delay so it does not oscillate (PR43) | Open | renderer | All | G T | GPU −40 to −70% during motion | M | 2 | Google Earth and CesiumJS refine after motion stops |
| P6 | Battery hint: in Chromium, `navigator.getBattery()` can offer the Save battery preset on battery. Safari has no such API. Offer, never switch silently. | Open | app | All | F G T | As the preset | S | 2 | iOS Low Power Mode |
| P7 | Opaque canvas. Babylon creates the WebGL context with alpha and WebGPU with `alphaMode: "premultiplied"`, so the compositor blends a full-screen layer every frame. The globe covers the canvas, so nothing shows through. | Open | renderer | All | F G T | A few % of GPU power, more on phones | S | 1 | Common WebGL advice |
| P8 | Dynamic resolution: steer `resolutionScale` from GPU time (WebGPU timestamps, WebGL2 disjoint timer) within user limits, slow to raise, quick to lower | Open | renderer | All | F G T | Holds a frame-time target on any device | M | 2 | Xbox and console titles, MSFS on Xbox |
| P9 | Spatial upscaling: draw at P1 or P8's scale, then upscale with edge-aware filtering and sharpening (an FSR 1 style EASU and RCAS pass). Babylon 8.56 has `SharpenPostProcess` and FXAA but no FSR pipeline, despite what [ai_framegen_upscale.md](https://github.com/foss-earth/research/blob/main/ai_framegen_upscale.md) says. | Open | renderer | WebGL2, WebGPU | F G T | Same GPU saving as P1 with less softness | M | 2 | MSFS (FSR, DLSS), CesiumJS FXAA |
| P10 | Pause or slow the globe while panels cover most of the canvas. `uiOcclusion.ts` already knows what is covered. | Open | engine, renderer | All | G T | Power while reading panels | S | 2 | — |
| P11 | Temporal anti-aliasing and upscaling with jittered frames and motion vectors. Babylon has a TAA pipeline. Photogrammetry and moving aircraft need careful history rejection. | Open | renderer | WebGL2, WebGPU | F G | GPU −50% at 0.67 scale with quality near native | L | 4 | MSFS TAA, DLSS, FSR 2 |
| P12 | Replace `backdrop-filter` blur and large shadows over the moving canvas with flat fills (PR42) | Open | ui, toolbar | All | F G T | Compositor work per frame | S | 2 | — |
| P13 | A still Activity outline. The spinning comet on busy chips restyles and repaints them every frame. The setting `interface.toolbar.activityOutline` exists (toolbar `1872be5`, app `b9a12a2`, fly `dddb895`); Still is not the default, and that is the user's decision | Off | toolbar, apps | All | F G T | Measured: about 47 ms/s of style and paint at the phone drag at 4× CPU; 50.5 → 52.7 fps | S | 1 | System reduced-motion |

## Google Photorealistic 3D Tiles

The adapter is 3d-tiles-renderer 0.4.24 for Babylon. Its core is shared with the
three.js adapter, but its three.js-only plugins are not available to us.
`optimizedLoadStrategy` (CP7) is on. The error target is the Google plugin's
recommended 20 px.

| ID | Item | Status | Owner | Backend | Load | Gain (estimate) | Effort | Tier | Precedent |
| --- | --- | --- | --- | --- | --- | --- | :-: | :-: | --- |
| T1 | Horizon detail: raise the error target for tiles far away and near the horizon, through `calculateTileViewError`, which the runtime already wraps (CP4) | Open | engine | All | F G | Triangles and downloads −30 to −60% from a cockpit | M | 2 | CesiumJS `dynamicScreenSpaceError`; Mapbox coarsens tiles at high pitch |
| T2 | Byte accounting. `calculateBytesUsed` returns 1 in the Babylon adapter, so `map.google.cacheBytes` limits 400 MiB of "bytes" that are really tile counts: the setting has no effect, and the 6,000 to 8,000 tile count is the real limit. Fix upstream, then trust the setting. (CP8, PR1) | Open | upstream, then engine | All | F G T | Memory bounded as the setting says | M | 1 | CesiumJS `cacheBytes` |
| T3 | Fog culling and fog error: tiles the haze fully hides are not drawn or requested; those it mostly hides take a coarser error. Sky already knows the visibility. | Open | engine, sky | All | F G | Distant tiles −20 to −50% in haze | M | 2 | CesiumJS `Fog` |
| T4 | Centre of the screen first (CP5) | Open | engine | All | F G | Perceived load time | M | 3 | CesiumJS `foveatedScreenSpaceError` |
| T5 | Cull requests while turning fast (CP6) | Open | engine | All | F G | Wasted downloads −20 to −40% | M | 2 | CesiumJS `cullRequestsWhileMoving` |
| T6 | Free a hidden tile's GPU copies after a delay and keep its CPU copies, so it uploads again without a download | Open | engine, port of upstream `UnloadTilesPlugin` | All | F G T | GPU memory −30 to −60% when the view turns | M | 2 | 3d-tiles-renderer (three.js) |
| T7 | Smaller tile geometry: 16-bit indices, 8-bit normals and UVs, 16-bit positions where the precision holds | Open | engine, port of upstream `TileCompressionPlugin` | All | F G | Google geometry memory −25 to −50% | M | 2 | 3d-tiles-renderer (three.js) |
| T8 | Skip reselection when nothing changed: camera, settings, residency (PR45) | Open | engine, port of upstream `UpdateOnChangePlugin` | All | G T | Traversal CPU while still | S | 2 | 3d-tiles-renderer (three.js) |
| T9 | Time-budget traversal, parsing and GPU commits (PR47) | Open | engine | All | F G | Long frames on tile arrival | M | 2 | CesiumJS spreads work across frames |
| T10 | Detail follows render pixels when P1 or P8 lowers resolution (PR48) | Open | engine | All | F G T | Avoids detail a smaller target cannot show | S | 2 | — |
| T11 | Coordinate Google downloads and parses with input and the active photograph (PR46) | Open | engine | All | T | Fewer bursts while a photo loads | M | 3 | — |
| T12 | Restrict loading to a region, for example the tour's campus, when the host asks | Open | engine, port of `LoadRegionPlugin` | All | T | Downloads outside the region gone | M | 3 | 3d-tiles-renderer (three.js) |
| T13 | Checked on live Google tiles on 16 October 2026: the sampled glb files contain JPEGs and no Draco. Move profile-checked glb parsing and JPEG decode into workers; keep Babylon's loader for other formats ([plan, step 7](proposals/webassembly.md#7-google-tiles-off-the-main-thread)). Size all pools together. | Open; format survey done | engine, app | All | F G | Less tile-arrival work on the main thread; measured by W0 | M–L | 2 | Google Earth decodes on background threads |
| T14 | Preload along the flight path's next minutes, as raster terrain already does | Open | engine, 0SFS | All | F | Fewer coarse tiles ahead | M | 3 | CesiumJS `preloadFlightDestinations` |
| T15 | Draw low-resolution tiles first, at a fraction of the screen height, while finer ones load | Open | engine | All | G | Time to first full view | M | 3 | CesiumJS `progressiveResolutionHeightFraction` |
| T16 | Fade tiles in over a few frames instead of popping, when fade cost is below pop cost | Open | engine, port of `TilesFadePlugin` | All | F G | Perceived smoothness, not speed | M | 4 | 3d-tiles-renderer (three.js) |
| T17 | Coarse stand-ins. A loaded coarse tile drawn while its descendants load can sit kilometres above the ground, because Google's octree boxes overlap. The ground sample now gives way to a finer tile within the coarser one's error, and `map.terrain.hideCoarseStandIns` (on) hides a tile with children whose error exceeds both its distance from the eye and 16 × the eye's height (engine `5d1b132`). A bug fix: the camera no longer floats | Local | engine | All | F G T | Measured: eye rise 276 → 435 m with 14 pushes before, none after | S | 1 | — |
| T18 | Horizon culling for the main camera: tiles wholly below the horizon (`isSphereBelowHorizon`, already used for focus and proximity) are not selected | Open, needs decision | engine | All | F G | Measured: 13–15 % of drawn tiles but about 1 % of vertices; about 15 ms/s of CPU at the phone drag at 4×. Pixel identity is not airtight, so it needs a setting | S | 3 | CesiumJS horizon culling |

## Raster terrain and imagery

Done since September: quadtree selection with hysteresis (CP12), no CPU morph,
no vertex normals, decode workers sized to the device, request caps of 16,
coarser elevation as an option, imagery atlas with page tables, selective
stitching.

| ID | Item | Status | Owner | Backend | Load | Gain (estimate) | Effort | Tier | Precedent |
| --- | --- | --- | --- | --- | --- | --- | :-: | :-: | --- |
| R1 | Share one index buffer and one UV buffer between all tiles of a segment count. At 64 segments a tile holds about 51 kB of positions, 34 kB of UVs and 49 kB of 16-bit indices, so two-thirds is the same in every tile. At 128 segments, four times as much. (PR52) Since 19 October 2026 (not committed), the CPU indices and UVs are built once per segment count and shared by every tile, with 16-bit indices up to 255 segments. The GPU buffers are still one per tile: a shared Babylon index buffer leaves picking without its indices and is not rebuilt after a lost context. | Partial | engine | All | F G | Terrain GPU memory and upload −60%; index build CPU gone | M | 2 | MapLibre one terrain topology; OpenGL Flightsim |
| R2 | Positions as `Float32Array` from the start: `terrainSurface` builds `number[]`, which Babylon converts on every upload. Done 19 October 2026 (not committed): targets, new meshes and refinement steps are float32 from the start, with the same stored bits (identity digest). Stitched seams stay float64 on the CPU: rounding them moves a seam on the antimeridian or the equator just off its plane, where Babylon's exact bounding-box check rejects a ray along it. | Done | engine | All | F G | One copy less per upload; less garbage | S | 1 | — |
| R3 | Build the mesh in the decode worker and transfer the buffers (PR51; postponed in EN). Since 19 October 2026 (not committed): worker geometry is adopted without a copy on either side; the page no longer works out its own target for every worker job, only for the one parity check; and a target prepared before a segments change is no longer uploaded to the rebuilt mesh, a race the page path had as well. Mesh workers are still opt-in, through the execution selection. | Partial | engine | All | F G | 2 to 10 ms of main thread per tile arrival | M | 2 | Kestrel, Skybolt, Orbiter, FlightGear |
| R4 | Skirts instead of stitching, which also makes edges independent of arrival order, an open question in EN (CP11) | Open, needs decision | engine | All | F G | Stitching CPU gone | M | 3 | Kestrel, CesiumJS |
| R5 | Heights on the GPU: one shared grid, heights from a texture in the vertex shader, morph as a uniform. Ground contact must keep reading the same surface. (CP10) | Open | engine | WebGL2, WebGPU; WebGL1 only with vertex texture units | F G | Terrain CPU build and upload mostly gone | L | 4 | OpenGL Flightsim, Skybolt, geometry clipmaps |
| R6 | Elevation bytes: a 512 px lossless WebP tile feeds a 64 to 128 segment mesh. Serve or pick a level whose pixel count matches the mesh where the provider allows, beyond today's opt-in coarser elevation. | Open, needs decision | engine | All | F G | Elevation downloads −60 to −75% (EN measured for coarser elevation) | M | 2 | Cesium quantized-mesh |
| R7 | Make the persistent map cache store tour servers' tiles: their cross-origin responses hide `Date` and `Age`, so it stores nothing today (EN). Use a fixed lifetime per provider. | Open | engine | All | F G T | Repeat-visit downloads | S | 1 | MSFS rolling cache |
| R8 | Byte-based elevation admission and retention; drop stale demand (PR54) | Partial | engine | All | F G | Memory, wasted decodes | M | 3 | — |
| R9 | Recheck the decoded-grid LRU size (EN: 98 of 631 downloads were repeats after eviction) | Open | engine | All | G | Downloads −10 to −15% | S | 1 | — |
| R10 | Incremental imagery page-table publication and budgeted page uploads (PR55, PR56) | Open | engine | All | F G | Upload spikes on slow devices | M | 3 | Virtual texturing |
| R11 | A minimal unlit terrain shader with no unused Babylon material features (PR59) | Open | engine | All | F G | Fragment and driver work for every terrain pixel | M | 2 | MapLibre draped terrain |
| R12 | Back-face culling where the camera cannot be under the terrain (PR60) | Open | engine | All | F G | Small | S | 3 | — |
| R13 | Lower anisotropy under Save battery (PR37); the option exists | Partial | app | All | F G | Sampling bandwidth on oblique ground | S | 2 | — |
| R14 | Commit terrain with each tile uploaded once with its seams, an array a mesh already holds not uploaded again (its world bounds still moved), and seam neighbours and commit tiles found only at the levels present (engine `6058d4f`, `b2ddff9`). Bit-identical by a digest pinned before the change and 17 mutants; see the [performance agent state](proposals/implementation/performance-agent-state.md#the-terrain-commit-engine-b2ddff9-done) | Local | engine | All | F G | Measured at the phone drag at 4×: `commitTerrain` 24.2 → 10.5 ms/s, `stitchTerrainEdges` 15.8 → 5.8, raster update 237.2 → 214.6 | S | 1 | — |
| R15 | Imagery heights and measurements reused instead of recomputed: grid, lattice and hull heights within a revision, and across revisions for tiles no changed terrain touches; one measurement per view shared by the plan and the readout; packed worker transport; typed point tables; a leaf shortcut; no per-call objects in `evaluateView`, then one record per lattice point and the last tile's entry reused (engine `dadbbcd`, `a034920`, `a3b213c`, `4b75363`, `ac1dd19`, `545c5cb`, `0600ad3`, `1afb938`, `f11a819`, `1e3a0a3`, `497e013`). Bit-identical, by pinned digests and mutants | Local | engine | All | F G | Measured: flight 1× main thread 75 → 51 → 49 % with the first two; at the phone drag at 4×, height work 58.5 → 35.1 ms/s, then `evaluateView` 102.9 → 80.6 ms/s, and 84.3 → 61.3 with `497e013` | M | 1 | — |

## Main thread, CPU and memory

| ID | Item | Status | Owner | Backend | Load | Gain (estimate) | Effort | Tier | Precedent |
| --- | --- | --- | --- | --- | --- | --- | :-: | :-: | --- |
| C1 | Collision BVH, built per tile in a worker, queried through a per-frame ground cache around the aircraft. The prototype took 0.0008 ms for five rays against 2.25 ms. Not integrated. (CP13) | Open | engine query, 0SFS cache | All | F | Near-ground physics CPU −95% | M | 1 | FlightGear ground cache, Rigs of Rods, three-mesh-bvh |
| C2 | Reuse vectors, arrays and matrices on hot paths, and leave unchanged uniforms alone (PR12). Done for the imagery measurement (`evaluateView`, engine `1e3a0a3`). Babylon's `uniformBuffer._buffersEqual` still costs about 4 ms/s at the phone drag at 4× | Partial | all libraries | All | F G T | Garbage-collection pauses | M | 3 | — |
| C3 | Render from an `OffscreenCanvas` in a worker. Babylon supports it. Input, DOM overlays and every host port would have to cross a message boundary. | Open | renderer, engine, apps | WebGL2, WebGPU | F G T | Main thread free for input and UI; smoother on phones | XL | 4 | — |
| C4 | Rust/WASM for measured CPU cores, with a binary per map family (raster; Google 3D Tiles), plus sky and projections. Move TypeScript into workers first; ship threaded and single-threaded builds with a TypeScript fallback ([plan](proposals/webassembly.md), [implementation brief](proposals/implementation/webassembly-agent.md)). | Open | native (new), engine, sky, projections | All | F G T | Tile, terrain, ground-query, sky and preparation CPU; prove each gain | L | 4 | Google Earth is C++ in WebAssembly |
| C5 | Separate camera updates from status publication; defer hidden panel work (PR10, PR11). Writes of unchanged values are skipped since 20 October 2026: the detail rail, the POI exit button and the download rate (engine `97a6ae1`, app `550b10d`, toolbar `4c1d7ee`), with style recalcs 2.75 → 2.07 and layouts 1.32 → 0.84 per frame at the phone drag at 4×. The 360 orbs no longer read the canvas box once per orb in every frame (sphere-image `61d04a2`), and the scene host keeps one reduced-motion media query (app `9904178`), about 3 ms/s at 4× by construction. About 17 ms/s of forced style and layout from reads after mid-frame HUD writes is left | Partial | engine, ui | All | F G T | DOM and serialization per frame | M | 2 | MSFS glass cockpit refresh rate |
| C6 | Audit timers and per-frame callbacks that run while nothing changes, as [Render on demand](render-on-demand.md#checklist) asks | Open | all | All | G T | Idle power | S | 1 | — |
| C7 | Cross-origin isolation, on by default, with headers from the apps' service worker; then `SharedArrayBuffer` and WebAssembly threads. Keep the transferred-buffer and TypeScript paths, bounded startup and per-core failure diagnostics ([plan, step 3](proposals/webassembly.md#3-isolation-from-the-service-worker), [implementation brief](proposals/implementation/webassembly-agent.md)). On an isolated page whose terrain is prepared in mesh workers, decode workers publish each elevation tile's heights once in a `SharedArrayBuffer`, which the page and the mesh workers read without a copy (Component execution → Terrain heights → Shared memory, `native.sharedHeights`, on by default since 19 October 2026 with WebAssembly in worker pools, applies after a reload). Elsewhere heights are transferred as before. Checked in Node and in headless Chrome on an isolated dev server (114 of 114 tiles shared). | Open | app, ui, engine | All | F G T | Shared tile data and ground queries from a physics worker; finer timers where supported | M for isolation | 2 | Google Earth: C++ in WebAssembly with threads |
| C8 | Index stitched ground meshes, whose positions are float64 arrays, for the anchor markers' occlusion ray, rather than scanning each raster tile's 8,192 triangles every frame (engine `329dc6c`); bounds rejected with each axis read by name (engine `f647f96`) | Local | engine | All | G T | Measured: marker raycast 40.5 → 14.6 ms/s at the phone drag at 4×, then 16.4 → 10.5 | S | 1 | three-mesh-bvh |
| C9 | No Error stack captured for every hidden patch on every publish (engine `90c0ef6`) | Local | engine | All | F G T | Measured: about 22 ms/s at a heavy phone drag at 4× | S | 1 | — |
| C10 | Skip the star field's update when no star could be drawn at the exposure (sky `e4a3dc3`) | Local | sky | All | G T | Measured: entering a 360 image by day at 4×, main thread 29 → 25 % | S | 1 | — |
| C11 | One raster update per frame in 0SFS. `prepareFrame` updates with the previous view, then `setExternalViewState` updates again | Open, needs decision | engine | All | F | Measured: the second call costs 58–60 ms/s of the flight's main thread at 1× at HEAD, but 24–26 of that is selection, which would move to the remaining call, so probably about 32–35 would be saved; tiles would arrive at different moments while moving | S | 1 | — |
| C12 | Re-measure the loaded-detail readout at the selector's 100 ms cadence, or at the throttled view, not on every publish | Open, needs decision | engine | All | F G | Measured: `refreshLoadedDetail` costs 53.4 ms/s at the phone drag at 4× since engine `497e013` (64–68 before) and 38–54 in the flight at 1× before it, and most of it would go; the readout would move at a different time | S | 2 | — |
| C14 | Keep the UI occlusion pass's element boxes until the layout changes. `coveredWorldClips` (`uiOcclusion.ts`) reads every covering element's box and runs `querySelectorAll` in each frame's render | Open | engine | All | F G | Measured: the pass costs 16.7–19 ms/s at the phone drag at 4×, `getBoundingClientRect` 6.7 and `querySelectorAll` 2.6 of it; pixel-identical only if no change of layout can be missed | S | 2 | — |
| C13 | [Adaptive CPU scheduling](proposals/adaptive-cpu-scheduling.md): separate live-worker limits from shared active-compute admission; balance ready jobs dynamically, use E-count only as an optional hint, and grow to full useful allowed concurrency when deadlines/readiness require it. Qualify fixed candidates and power before an opt-in governor; preserve quality and main-thread fallbacks only for genuine capability failure. | Open, proposed | engine, app, sky, renderer; research evidence; hosts | All | F G T | Energy unknown until measured; avoid unnecessary parallel work without starving weaker devices | M | 2 | — |

## Loading, network and startup

| ID | Item | Status | Owner | Backend | Load | Gain (estimate) | Effort | Tier | Precedent |
| --- | --- | --- | --- | --- | --- | --- | :-: | :-: | --- |
| D1 | Publish the JavaScript speedups: images, sky, projections ([Performance](performance.md#publish-the-javascript-speedups)). All five libraries have them on GitHub's `main` (checked 16 October 2026); the apps get them with their next build. | Done | images, sky, cubemap, equirectangular, tiled-cubemap | All | F G T | Sky 7.9 → 2.5 ms a step in daylight; stars 3.5 → 1.1 ms; preparation 1.1 to 3.6× | S | 1 | — |
| S1 | Import specific Babylon modules and register what is used (PR62). Flight's main chunk is 4.8 MB and the tour's 5.4 MB. | Open | all libraries, apps | All | F G T | Startup download, parse and heap −20 to −40% | M | 2 | Marzipano is 55 kB gzipped |
| S2 | Lazy-load panels, editors and providers that are not open (PR63) | Open | app, ui, apps | All | F G T | Startup work | M | 2 | — |
| S3 | Compile likely shaders in parallel and early: `KHR_parallel_shader_compile` on WebGL, `createRenderPipelineAsync` on WebGPU, during the loading screen (PR13; EN measured 1.45 s of blocking link on the phone proxy) | Open | renderer | All | F G T | First-use hitches | M | 2 | — |
| S4 | Check that only one of the GLSL and WGSL shader chunks (670 kB each) is fetched | Open | renderer `vite/babylonShaderChunks` | All | F G T | 670 kB at startup if both load | S | 1 | — |
| S5 | Write the overview's height into the scene (EN: overview 3 s sooner on desktop, settle 9% sooner on the phone proxy) | Open, needs decision | scenes, apps | All | G T | First view | S | 3 | — |
| S6 | Model one shared link in the bench, so byte savings show in timings (EN) | Open | research | — | — | Makes R6, T7 and B3 measurable | S | 2 | — |

## 360 photographs

The tour now loads photographs as tiles of an equi-angular cube (PR17, partly).
Four savings are built and off by default: skipping the hidden globe
(`presentationCandidates`), dropping panorama test records (`panoramaBookkeeping`),
opaque immersion (`opaqueImmersion`) and leaner WebGL shaders (`panoramaShaders`).

| ID | Item | Status | Owner | Backend | Load | Gain (estimate) | Effort | Tier |
| --- | --- | --- | --- | --- | --- | --- | :-: | :-: |
| X1 | Turn the four experiments on by default after the phone trial (PR3, 5, 6, 7) | Off | renderer, sphere-image | All | T | Measured: main-thread render −25% inside a stop | S | 1 |
| X2 | Cull orbs outside the view and below the horizon (PR8) | Open | sphere-image, engine | All | G T | Draws and uniforms | M | 2 |
| X3 | Instanced preview orbs with shared geometry (PR9) | Open | sphere-image | All; WebGL1 through `ANGLE_instanced_arrays` | G T | Draw calls −80% or more with many stops | L | 3 |
| X4 | Cancel obsolete uploads per job and give the active photograph priority (PR4, PR20, PR24) | Open | renderer, sphere-image | All | T | Upload hitches and wasted mips | M | 2 |
| X5 | Choose a representation from the viewport, field of view and render scale, with hysteresis (PR14) | Partial | sphere-image | All | T | Decode, upload, memory | M | 2 |
| X6 | GPU-compressed photograph tiles (KTX2, Basis) with a JPEG fallback (PR18) | Open | images, sphere-tiled-cubemap, tour content | All with a transcode target | T | Photo GPU memory ÷4 to ÷8 | L | 3 |
| X7 | Offline mip chains for photograph tiles (PR19) | Open | images, tour content | All | T | Mip generation off the device | M | 3 |
| X8 | Evict distant map caches during a long stay inside a photograph (PR40, PR49) | Open | engine | All | T | Memory for photographs | M | 3 |

The rest of PR1 to PR70 stand as written in the review; the tour's own content
items are in its backlog.

## Backend-specific

Where a backend can do more than the others. Babylon picks WebGPU where it starts,
then the WebGL that last worked. An item here needs a fallback on the others.

### WebGPU only

| ID | Item | Status | Owner | Load | Gain (estimate) | Effort | Tier |
| --- | --- | --- | --- | --- | --- | :-: | :-: |
| B1 | Snapshot rendering: Babylon records each mesh's draw into render bundles and replays them. Tiles come and go, so start with what is stable: the aircraft, sky, photograph cube. Babylon reports up to 10× less CPU for static scenes. | Open | renderer | F T | Draw-submission CPU −30 to −80% for what it covers | M | 2 |
| B2 | Pipeline compilation with `createRenderPipelineAsync` during loading (with S3) | Open | renderer | F G T | First-use hitches | M | 2 |
| B3 | Compress Google tile and photograph textures on the GPU after download, to BC or ASTC, with a compute encoder such as Ludicon's Spark (check its licence). JPEG in, compressed texture out, no CPU transcoding. | Open | renderer, engine | F G T | Texture memory ÷4 to ÷8; sampling bandwidth and power | L | 3 |
| B4 | Terrain heights and morphs in a compute pass (with R5) | Open | engine | F G | As R5, with no vertex texture fetch limits | L | 4 |
| B5 | `shader-f16` for colour and lighting math where precision allows (PR44) | Open | sky, sphere-image, engine | F G T | ALU and registers on Apple and mobile GPUs | M | 3 |
| B8 | GPU timestamps drive P8 (the pass timer already works; the frame timer reads 0) | Partial | renderer | F G T | Makes P8 exact on WebGPU | S | 2 |
| B9 | Exhaust depth from the main depth attachment instead of a second depth pass (see 0SFS backlog) | Open | renderer exposes, 0SFS uses | F | One geometry pass less while exhaust shows | M | 2 |
| B13 | One render pass per frame. Babylon's depth or stencil-only clear before a rendering group (the 360 panorama, the location marker) ended the main pass and began another, which loads and stores every attachment again. The engine now holds such a clear until a draw needs it (`deferDepthClears`, renderer `24b6a6d`). Pixel-identical in 9 states | Local | renderer | T G | Measured: GPU inside a 360 image 3.62 → 1.61 ms a frame (−56 %) on the M5 at a phone's viewport; main passes per frame from up to 3 to 1 | S | 1 |

### WebGL2 and WebGPU, not WebGL1

| ID | Item | Status | Owner | Load | Gain (estimate) | Effort | Tier |
| --- | --- | --- | --- | --- | --- | :-: | :-: |
| B6 | Occlusion queries: skip Google tiles and terrain hidden behind nearer ground or buildings, one frame late, with a conservative fallback | Open | engine | F G | Draws −10 to −40% low in valleys and cities | L | 3 |
| B7 | Fewer draw calls for Google tiles: one material and shared buffers per batch (`BatchedTilesPlugin` in three.js), or `WEBGL_multi_draw` in Chromium | Open | engine | F G | Draw calls −50 to −90% at fine detail | L | 3 |
| B10 | Immutable texture storage with known levels (PR21) | Open | renderer | T | Driver allocation and validation | M | 3 |
| B11 | Non-power-of-two mipmaps for photograph tiles and preview cubes | Partial | sphere-image | T | Sampling quality and cache use at distance | S | 2 |
| B12 | Spatial upscaling P9 and TAA P11 need float or multiple render targets that WebGL1 lacks | Open | renderer | F G T | See P9, P11 | — | — |

### WebGL1 compatibility tier

WebGL1 is for devices that cannot do better. Make it work and keep it light;
do not spend effort making it fast.

| ID | Item | Status | Owner | Load | Gain (estimate) | Effort | Tier |
| --- | --- | --- | --- | --- | --- | :-: | :-: |
| W1 | Start WebGL1 with a light preset: resolution 0.75, no MSAA, 30 fps cap, smallest photograph tier | Open | app, renderer | F G T | Usable frame rate on old devices | S | 2 |
| W2 | Qualify real WebGL1 paths: derivative-free atlas, cube size limits, allocation failure, context restore (PR69) | Open | renderer, sphere-image | G T | Reliability | M | 3 |
| W3 | Power-of-two photograph sizes so mipmaps work (PR34) | Open | images, tour content | T | Sampling at distance | S | 3 |
| W4 | Decline vertex-texture terrain (R5) where `MAX_VERTEX_TEXTURE_IMAGE_UNITS` is 0 and keep CPU meshes | Open | engine | F G | Keeps R5 from breaking old devices | S | — |

## Why Google Earth is still faster

What is known, and what we can copy. Google Earth's internals are not public;
the first two points come from Google's own write-up and the
[earth-reverse-engineering](https://github.com/retroplasma/earth-reverse-engineering)
project's reading of its tile format.

1. **Native threads.** Earth is C++ compiled to WebAssembly with threads, and
   moves streaming and decompression to background threads (web.dev case study).
   Threads need `SharedArrayBuffer`, which needs COOP and COEP headers. GitHub
   Pages cannot send them, so our service worker adds them (built on 18 October
   2026, not deployed). In Chrome and Firefox, every map, search and airports
   loaded in the isolated page with nothing blocked
   ([step 3](proposals/webassembly.md#3-isolation-from-the-service-worker)). The plan, its costs and one Rust
   binary per map family are in [WebAssembly builds](proposals/webassembly.md) (C7). Until
   then, message-passing workers get part of the effect: R3, C1, T13, C3.
2. **A tile format made for its renderer.** Earth's own tiles carry packed
   meshes and textures as JPEG or crunched DXT1, a GPU format. Google
   Photorealistic 3D Tiles give us glTF whose images expand to uncompressed RGBA
   on the GPU, four to eight times larger. B3 and T7 are the closest we can
   get without a different source.
3. **One engine with one data set.** Earth's selection, culling, caching and
   drawing were written together. We join 3d-tiles-renderer, Babylon, our own
   raster terrain and the sky. Each seam costs: a second traversal, per-tile
   meshes and materials, separate memory budgets. T2, T6, R1 and B7 close some.
4. **What it does not draw.** Earth does not stream the whole view at full
   detail while it moves and then sharpens. P5, T1, T3 and T5 are that
   behaviour.

Earth also stops drawing when nothing moves. We already do
([Render on demand](render-on-demand.md)).

## Competitor precedent

What each product does that this list copies. Items marked "have" are done here.

| Product | Technique | Here |
| --- | --- | --- |
| Google Earth (web) | WebAssembly with threads; background streaming and decode | R3, C1, C3, T13 |
| Google Earth | GPU-compressed tile textures | B3, X6 |
| CesiumJS | One pixel per CSS pixel; `resolutionScale` | P1, P2 |
| CesiumJS | Dynamic and foveated screen-space error; cull requests while moving; fog culling | T1, T4, T5, T3 |
| CesiumJS | Byte-bounded tile cache | T2 |
| CesiumJS | Request render mode | have |
| CesiumJS | `progressiveResolutionHeightFraction`, `preloadFlightDestinations` | T15, T14 |
| MSFS 2020 / 2024 | Render scaling with TAA, FSR, DLSS | P8, P9, P11 |
| MSFS | Terrain and object level-of-detail sliders | have (detail settings) |
| MSFS | Glass cockpit refresh rate | C5; 0SFS F3 |
| MSFS | Rolling cache on disk | have (map cache), R7 |
| MSFS | Frame generation | left out |
| Mapbox GL, MapLibre | One terrain topology; fog toward the horizon; coarser tiles at high pitch | R1, T3, T1 |
| FlightGear | Frame-rate throttle aligned to physics; ground cache for collision | P4, C1 |
| krpano, Marzipano, Pannellum | Tiled multiresolution cube photographs; draw only when something changes | have |
| krpano | Separate, smaller image sets for phones | X5; tour backlog |
| Pannellum | Faces at most 4,096 px for wide WebGL support | W2 |
| Matterport and other tour viewers | Load what the view needs first | X5 |
| 3d-tiles-renderer (three.js) | Unload, compression, batching, update-on-change, load-region plugins | T6, T7, B7, T8, T12 |
| Kestrel, Skybolt, OpenGL Flightsim | Worker mesh building, GPU heights, skirts | R3, R5, R4 |

## Looked at and left out

- **Frame generation.** A browser cannot present a frame between two
  `requestAnimationFrame` callbacks, and synthesizing frames from a 30 fps
  render adds latency a pilot feels. MSFS players report the same latency and
  artefacts around instruments.
- **Not clearing the frame.** On Apple and mobile tile-based GPUs, a clear at the
  start of a pass is cheaper than loading the previous contents. Keep `autoClear`.
- **Less physics.** JSBSim's 120 Hz is a fidelity choice, not waste. Make each
  step cheaper (C1) or move it (0SFS backlog), but keep the rate.
- **`powerPreference: "low-power"`** does nothing on a Mac with one GPU. It may
  help on dual-GPU Windows laptops; try it there under Save battery.
- **Bounding-sphere culling and blocked material dirty flags.** Tried and
  reverted in the first performance pass.
- **Discarding the main pass's multisampled store** (20 October 2026). No GPU
  gain measured on the M5 (3.009 against 3.003 ms a frame), and it would need a
  guarantee that the pass never restarts.
- **Prefetching a traversal group's heights in one batch** (20 October 2026).
  Fewer calls but 17 % more heights, and a loss in the flight: the cost of a
  height is per point, not per call.
- **One level of detail per Google tile** (20 October 2026). The coarse
  tiles drawn with finer ones are siblings whose boxes overlap, not ancestors,
  so it would not have stopped the floating camera (T17 did).

## Sources

- [How we're bringing Google Earth to the web](https://web.dev/case-studies/earth-webassembly), web.dev
- [earth-reverse-engineering](https://github.com/retroplasma/earth-reverse-engineering), on Earth's tile format
- CesiumJS `Cesium3DTileset`, `Viewer` and `Fog` reference, 1.145
- [Occlusion culling in Cesium for Unreal](https://cesium.com/blog/2022/08/18/occlusion-culling-cesium-for-unreal), Cesium blog
- [Why WebGPU backend is slower?](https://forum.babylonjs.com/t/why-webgpu-backend-is-slower/24091), Babylon forum, on snapshot rendering
- [MSFS 2024 graphics settings overview](https://forums.flightsimulator.com/t/msfs-2024-graphic-settings-overview-in-2026/757241), official forum
- [Pannellum documentation](https://pannellum.org/documentation/overview/), [krpano](https://krpano.com/home/), [Marzipano](https://opensource.google.com/projects/marzipano)
- [KTX 2.0 and Basis Universal](https://khronos.org/ktx/), Khronos
- 3d-tiles-renderer 0.4.24 source as installed in `foss-earth/node_modules`; Babylon.js 8.56.2 source, same place
