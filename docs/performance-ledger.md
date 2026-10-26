# Performance ledger

Every optimization shipped, rejected, held, waiting on a decision or still
open, across FOSS Earth, 0SFS and the UMN tour, from 12 October 2026 on. Read
it before choosing work, so that nothing is retried by accident. The current
state, the next candidates and the method are in
[Resume performance work](performance-work.md).

Each item has a permanent ID. When an item changes status, move its row to the
new section and keep its ID. Give a new item the next free ID (the last one
used is P-099). Cite commits as `repo sha`. Numbers are the ranges from the
named report, before → after, in ms/s of main-thread CPU unless the row says
otherwise. Numbers from different methods are not comparable: see
[Units and methods](#units-and-methods).

Fly commits made before the 22 October rebase have new IDs. The table in
[Rewritten commit IDs](#rewritten-commit-ids) maps the old IDs, which older
reports still cite, to the current ones.

## Shipped

Newest first. "Unpushed" means local `main` was ahead of `origin/main` at the
end of the 24 October session.

| ID | Date | Commits | Change | Measured | Report |
| --- | --- | --- | --- | --- | --- |
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
| P-046 | 22 Oct | Rewrite the selector's screen-area loop | 388 vs 382.4 ms, against 391.7 vs 386.6 for unchanged source; reverted | [flight frame][f-frame] |
| P-047 | 22 Oct | Delay the selector's hull construction | 402.1 vs 399.6 ms over 12 rounds; reverted | [flight frame][f-frame] |
| P-048 | 22 Oct | `Math.hypot` → `Math.sqrt` | Not exact: the result bits differ | [flight frame][f-frame] |
| P-049 | 22 Oct | Cache the canvas size in `applyWorldViewport` | Not exact: a resize lags a frame | [flight frame][f-frame] |
| P-050 | 22 Oct | Skip `publishManaged` on staged revisions | Not exact: it changes what is published | [flight frame][f-frame] |
| P-051 | 22 Oct | A view cache that measures an old view while the flight moves | Not exact | [agent prompts][f-prompts] |
| P-052 | 21 Oct | Hash-only (FNV-1a) table equality as proof | A birthday search finds collisions in seconds; P-017 compares bytes instead | [state, item 4][state-cost] |
| P-053 | 22 Oct | Global `set.native.core.imagery=typescript` (`nimg`) as a speedup | It also removes page batching and memoization. Selection 1×: 47.3–53.1 → 147.0–173.1; main thread 35–39% → 47–54%. Says nothing about verification alone (P-073) | [flight frame][f-frame], [heights candidates][e-heights] |
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
| P-071 | 20 Oct | Activity outline Still by default, or a composited comet in the toolbar CSS (not pixel-identical). The `globe.css` comment that calls the spinner compositor-only and free of JavaScript cost is wrong | Still vs Spinning: style 1× 9.5–9.8 → 3.2–3.3; `applyWorldViewport` 1× 14.8–16.0 → 6.9–7.6; frames/s 4× 27.3–28.2 → 28.3–29.8; about 47 of style and paint at 4× | [flight frame][f-frame] |
| P-072 | 22 Oct | One raster update per frame in 0SFS: engine `setExternalViewState` calls `rasterTilesRuntime?.update()` again after `prepareFrame`. Proposed: `if (!simRunning) rasterTilesRuntime?.update();`. Tiles would arrive at different moments | Removing it (`c11`): frames/s 4× 26.5–28.1 → 36.4–37.2; p95 50 → 33.3 ms; raster 4× 538–566 → 465–472. A middle course with doubled budgets (`c11m`) was also measured | [flight frame][f-frame] |
| P-073 | 20 Oct | Verify imagery heights only at admission, or make verification optional. The worker's double check never feeds the output; it is the WebAssembly design's safety net | Measured on 22 October, before P-003: flush and receive 1× 10.6–12.9, 4× 29.9–30.5. Height `flush` is now 7.3–8.0 at 1× and 19.0–20.4 at 4×, so re-measure. Keep packed queries and the revision cache in any arm | [flight frame][f-frame], [heights candidates][e-heights] |
| P-074 | 20 Oct | Cadence of the loaded-detail readout and the distribution (`refreshLoadedDetail`, `syncDistribution`): the rail would lag the camera | `refreshLoadedDetail` 179.0 inclusive in the fly C172 at 4× on 24 October; `syncDistribution` 83.1–93.3 after P-002 and P-003 | [flight frame][f-frame], [state, waiting][state-wait] |
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
and the first steps are in
[Resume performance work](performance-work.md#next-work).

| ID | Area | Candidate | Latest cost | Notes |
| --- | --- | --- | --- | --- |
| P-086 | engine imagery selector | What is left of `evaluateView`, `surfaceSamples`, `footprintFrom`, `heightsAt` and `sample`, and `measureImageryView` across its callers | Fly C172 4×, 24 Oct: `evaluateView` self 53.9, inclusive 160.6; `surfaceSamples` 30.6; `footprintFrom` 15.3; `heightsAt` 12.2; `sample` 11.5; `measureImageryView` 136.1 inclusive. App 4× drag: `evaluateView` self 47.0 | P-046 to P-051 failed or are not exact. Keep the floating-point order. Brief: Agent 1 in [agent prompts][f-prompts] |
| P-087 | engine imagery display | `buildImageryDisplay` after P-001 | Fly 4× self 18.7 | [display tree][e-tree] |
| P-088 | engine heights | Hypothesis 1: compact the unique keys in place during the counting pass | Packer `add` 4× self 10.1–12.5 after P-003 | `src/browser/terrainHeightPixels.ts` still counts, then copies. The engine `build/perf-heights` scratch predates P-003 and is stale. [heights candidates][e-heights] |
| P-089 | engine distribution | `syncDistribution`'s own `measureImageryView` and the rest of `publishManaged` | `syncDistribution` 4× 83.1–93.3; `publishManaged` 4× 67.3–75.9 | The cadence is P-074. [loaded pages][e-pages] |
| P-090 | engine viewport and forced layout | `applyWorldViewport` and the reads after mid-frame HUD writes | Self at 4×: fly 34.2, app 28.7, tour 26.4; `getBoundingClientRect` 10.4–13.8 in the app and tour | Its first style recalc pays for the CSS animation (P-071). About 17 at 4× of later forced style and layout needs a proof that the HUD writes never move the canvas. P-049 is not exact |
| P-091 | exhaust depth | Per-mesh eligibility and the eight-corner projection | 7.8–14.6 before exhaust `f7d994e` (23 Oct), which changed depth eligibility | Take a new baseline first. Brief: Agent 4 in [agent prompts][f-prompts] |
| P-092 | Babylon uniforms | `writeBuffer`, `_buffersEqual`, `_updateFloatArrayForEffect` | 4×: `writeBuffer` 11.5–14.7 in every target; app phone `_buffersEqual` 8.3, `_updateFloatArrayForEffect` 8.9 | Not broken down yet |
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
[f-frame]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-22/flight-frame.md
[f-handoff]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-22/session-handoff.md
[f-prompts]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-22/agent-prompts.md
[f-1021]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-21/README.md
[f-worker]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-21/flight-dynamics-worker-results.md
[f-exhaust]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-21/exhaust-wasm-worker.md
[f-lod]: https://github.com/0SFS/fly/blob/main/docs/performance/2026-10-21/f35-model-lod.md
[t-cont]: https://github.com/UMN-VR/tour/blob/main/docs/performance-continuation.md
[t-next]: https://github.com/UMN-VR/tour/blob/main/docs/performance-next-agent.md
