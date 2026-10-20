# Performance

What has been made faster, how a change is shown to be the same, and what is
still to do. Measured on an Apple M5, Node 26.9, in October 2026. The machine
was shared; the ratios below are interleaved medians, old and new alternating,
with the load average written beside them when it was recorded.

Library work lives in each library. The app wires owners into the profiler; it
does not hold the resampling or the projection loops.

What each of the three apps costs as a whole, from its start to its frames,
CPU and memory, is in the [Performance audit](performance-audit.md).

## Bit-identical JavaScript

Restructuring the JavaScript, with the output the same bit for bit, is most of
the gain so far. A WebAssembly port is a later step, and only for a core that
is heavy and self-contained. See [Follow-ups](todo.md).

A fast path is guarded. Any input it does not recognise takes the original
code, including the original allocations. The proof, for each change:

1. A differential harness in that repo's gitignored `build/`, comparing the
   shipped build with the new one value by value (`Object.is`) and, where
   NaN payloads matter, byte by byte.
2. Committed tests whose digests were pinned by running the shipped code.
3. One-line mutants. Both the harness and the committed tests must fail on
   every one. Restore the original in a `finally` block.
4. Interleaved benchmarks, medians and ratios.

`Object.is` treats every NaN as equal. A byte compare of a NaN output can
still disagree, because the payload bits can change. Pin digests from
finite inputs, and keep a separate byte check for a source that contains
NaNs.

A uniform image hides a swapped `atan2`: every sample reads the same colour.
A mutant of the direction formula has to be tested on an image whose pixels
differ. `JSON.stringify` turns NaN into `null`, so a log of a NaN sample
looks like a missing value.

Run a library's tests with `npm --prefix <repo> test`. `npm --prefix <repo>
exec -- vitest` does not change directory, and from a parent checkout it
loads the wrong tests.

## Images

On `images` `main`, five commits ahead of `origin/main`, through `fe19ea7`.
Not pushed.

| Commit | What changed |
| --- | --- |
| `3699810` | `resizeArea` no longer reads past the last row or column |
| `83fc0b9` | JPEG encode and decode, a port of jpeg-js, same results |
| `77e92cb` | Resize, sRGB, orient and alpha |
| `c26559c` | PNG |
| `fe19ea7` | Where the JPEG port succeeds and jpeg-js does not |

The 360 preparation tool, with only images changed, wrote 8 cases, 2,632
files, about 43 MB, all identical. Speedups were 1.12× to 3.61×. An 8192
tour went from 15.5 s to 9.7 s.

jpeg-js throws `RangeError: Invalid array length` at 2^27 output bytes or
more (a 6144² noise image). The port writes the bytes a typed-array jpeg-js
would write. jpeg-js overflows the stack on a long COM segment when the
call is already deep; the port decodes it. The jpeg-js clone used for the
comparison is `~/gh/0sfs/jpeg-js`.

`check:implementation`'s consumer test fails with `IMAGES_CONSUMER_ARCHIVES
must name a complete exact archive closure JSON`. That failure is on `main`
without these commits as well.

`360` `a16324f` raises the preparation tool to version 2 because of the
`resizeArea` fix. The commit above it on `360` `main`, `bd3d4e7`, is a
separate panorama-flight change. Pushing `360` `main` publishes both.

There is an empty `faster-js` branch in images at `bb7c9c0`, equal to the
26.10.11 LTS tag. It can be archived.

## Sky

On `sky` `main`, four commits ahead of `origin/main`. Not pushed.

Night lights (`b8f6e6e`) switch at `sky.nightLights.switchIlluminance`,
default 16 lx, at about 11% more cost per step. The render check was 117
of 117. The threshold follows photocell practice around 16 lx (street
lighting specifications and common dusk-to-dawn cells).

The two speedups, on top of that:

- One march per line of sight for every direction to the Sun (`f3ec16f`).
  Illumination and a 32×32 dome, 16 steps, Minneapolis at 600 m: day 7.9 →
  2.5 ms, twilight 18.0 → 5.6, night with a full Moon 15.9 → 4.6, night
  with no Moon 4.3 → 0.84, orbit 3.6 → 0.95. `createAtmosphere` 121 → 95 ms.
- Stars without an object per star (`e8ece15`). An update of 8,404 stars
  went from 3.54 ms to 1.10 ms. Babylon's vector cross, normalise and scale
  are inlined in their original order.
- `88cda0e` writes those costs into the sky proposal and two setting
  descriptions.

The check was 20.3 million sky values and 83 million star values, no
mismatches. Mutants: 12, 9, 12 and 6, all caught. `RadianceFan` and
`radianceFanOf` are internal to `atmosphere.ts` and are not on the package
entry. Sky's `dist` is not tracked, so publishing these commits does not
need a rebuilt `dist` in git. A browser check of the sky on port 5431 was
not run.

An atmosphere the caller built, with no fan, is still sampled ray by ray.
A dome with fractional rows or columns still takes the old per-vertex
moonlit loop.

## Projections

On each library's `main`, one commit ahead of `origin/main`. Not pushed.

| Repo | Commit | What changed |
| --- | --- | --- |
| cubemap | `357d4de` | An equirectangular face is sampled in one loop |
| equirectangular | `18b76dc` | The plan's level is marked so that loop can read it |
| tiled-cubemap | `96c7f3f` | An equirectangular tile is sampled in one loop |

The public declarations are unchanged. Cubemap does not depend on
equirectangular. The mark is `Symbol.for("foss-earth.equirectangular.cubePreparationLevel")`,
set only by `cubePreparationPlan` on the sampler it builds, non-enumerable,
and read by cubemap and tiled-cubemap. A sampler without a valid
`LinearImage` on that symbol takes the original per-direction loop,
allocations included. `createEquirectSourceSampler` is not marked: it
chooses a level from the footprint on each call.

The length of a direction is V8 14.6's three-argument `FastMathHypot`, not
`Math.hypot` and not an older Kahan replica. The replica returns NaN for
`(0, 0, Infinity)`; `Math.hypot` returns Infinity. The V8 sequence matched
`Math.hypot` on two million random values and the edge grid (zeros, infinities,
NaNs, subnormals). It is also faster than calling `Math.hypot`. The order
that stays bit-identical is `atan2(x, y)` (x then y), then `asin` of the
clamped `z / n`, then bilinear as top and bottom, then the average, then a
float32 store. The equi-angular warp is `Math.tan(s * Math.PI / 4)`, which
is `(s * Math.PI) / 4`.

Unrolling `sampleEquirect`'s three channels matched in Node and disagreed
under Vitest: one NaN payload was canonicalised. That function stays a loop.
The fused face and tile loops are unrolled; their bytes matched the shipped
code in Node, including a NaN source.

One loop serves both warps. A copy of the loop per warp was slower once both
warps had run in the same process.

Interleaved medians, load average about 3:

| Work | Shipped | New | Ratio |
| --- | --- | --- | --- |
| Face 256 from a 1024 source | 18.4 ms | 14.1 ms | 1.30× |
| Face 1536 from an 8192 source | 736 ms | 519 ms | 1.42× |
| Equi-angular tile, 128+1 | 6.5 ms | 4.5 ms | 1.46× |
| Gnomonic tile, 128+1 | 4.0 ms | 3.6 ms | 1.10× |
| Per-direction sampler, 200,000 calls | 32.7 ms | 32.9 ms | unchanged |

The per-direction sampler is what a plan no longer uses. The differential
check was 213,695 values, 0 mismatches, including NaN payload bytes. All 12
compiled mutants and all 12 source mutants were caught.

The 360 preparation tool, with only these three libraries changed and the
same images and the same 360, wrote 2,617 files, about 43 MB, all identical.
An 8192 tour went from 17.6 s to 15.1 s (1.17×). The larger 8192 case, with
1536-pixel tiles, went from 20.1 s to 17.8 s (1.13×). JPEG and PNG encoding
dominates the cases that barely moved.

`prepared.json` records the sha256 of each library file it imported. Those
digests change when the libraries change. The pixel files and the rest of
the manifest are what the comparison holds equal. Compare with
`components.*.entrySha256` set aside.

## Streamgraphs

On `renderer` `main`, pushed as `6c435ce`. The frame budget
(Renderer → Debug; in 0SFS, Debug → Frame budget) draws five
graphs of the last minute, one sample every 250 ms, above the section table:

| Graph | Unit | Where the numbers come from |
| --- | --- | --- |
| CPU | ms of work per second | Frame-profiler sections, drained once a sample |
| GPU | ms of work per second | Passes under `gpu/`, the same drain |
| GPU memory | bytes held | Babylon's textures, unique mesh buffers, and the canvas |
| Memory | bytes held | Owners that count themselves, plus Chromium's heap rest |
| Network | bytes received per second | Resource Timing, plus bodies the app counts itself |

`?set.renderer.profiling.enabled=1` turns measuring on. The other settings
are `renderer.profiling.windowFrames` (600), `refreshMs` (500), `traceFrames`
(0), `streamSeconds` (60), `streamMs` (250) and `streamShape` (`stream` or
`stacked`). A registry from before the stream settings keeps the defaults.

While measuring is off, `clock`, `add`, `addDuration`, `tag` and `frame`
return without reading the clock. Babylon's observers and GPU timers are
attached only while measuring is on. The Resource Timing observer is created
when measuring starts and disconnected when it stops. Stream rings are
allocated at the start and dropped at the stop. The panel does not refresh
while it is hidden or while measuring is off. Its own work is
`profiler/panel`; the sampling is `profiler/streams`.

`frame` used to call `now()` in a default argument, which runs before the
function can see that measuring is off. The argument is ordinary now, and
the clock is read only after that check.

WebGPU's frame-level GPU timer reads 0. The pass timer is the one that
works; copies and mipmaps are left out. WebGL's disjoint timer arrives late
and samples one frame in a few. WebGL1 repeats one stale value. A missing
reading is "not available" or "waiting", never 0. `timestamp-query` is
requested when the WebGPU device is created. That is a device flag, not
per-frame work.

There is no browser API for GPU memory. The estimate walks Babylon at most
once a second and says so on the graph. Drivers pad and compress, so the
real figure differs.

The stream shape centres each layer on the total (ThemeRiver). A stacked
shape starts from zero. Layer order follows the totals, so a band keeps its
place as the minute scrolls. The wiggle baseline is not used: on a scrolling
window it draws trends that are not there. The legend is the text
alternative. No charting library was added. 0SFS's calls (`enabled`,
`clock`, `add`, `addDuration`) are unchanged.

The renderer's profiler tests, run in `renderer`:

```sh
npm --prefix <renderer> test -- tests/frameProfiler.test.ts tests/resourceStreams.test.ts tests/resourceStreamsView.test.ts tests/resourceSources.test.ts tests/gpuMemorySource.test.ts tests/frameBudgetPanel.test.ts tests/browser.test.ts tests/profilingLifecycle.test.ts
```

67 tests passed on 2026-10-12.

### What a frame already times

From `createGlobeRuntime`, then the draw:

1. `map/camera` — inertia, field-of-view return, the terrain-preparation camera
2. `map/google tiles`
3. `map/raster tiles`
4. the host's frame preparation — the app times this as `panoramas`
5. `sky` — one section for `sky.update()`
6. `render`, `render/active meshes`, `render/render targets`, `render/draw`
7. `render/draw/panorama uniforms` when 360 is given the profiler
8. `map/terrain preparation` after the frame
9. `gpu/globe` — alongside the frame, not inside it

The globe draws on demand. While it is still, no frame closes a sample, so
the panel's refresh does.

CPU sections that report themselves become stream layers. Time a parent
spent outside the children it names is `parent/other`. GPU layers are the
passes under `gpu/`.

## Still to do

The items below finish work already started. Everything else, ranked, is in
the [Optimization backlog](optimization-backlog.md).

### Publish the JavaScript speedups

Done. On 16 October 2026, `git ls-remote` showed each of these on its
library's `main` on GitHub:

- images, five commits through `fe19ea7`
- sky, four commits through `88cda0e`
- cubemap `357d4de`, equirectangular `18b76dc`, tiled-cubemap `96c7f3f`
- `360`, now `sphere-image`: `a16324f`, with `bd3d4e7`

The published apps get them with their next build.

### Point the app at the streamgraphs

`renderer` `main` has the graphs. The app's `main` does not register memory
or network sources, and it does not name GPU owners. That wiring is on
branch `profiler-streams` in `app/build/ws/foss-earth/app`, commit `5945fcb`,
plus one uncommitted line that tracks sky table bytes
(`sky.getEnvironment()?.cost.tableBytes`). App `main` has moved since that
branch, and it has other uncommitted edits. Land the branch without
discarding those edits.

Until that lands, a build that uses the new renderer still shows CPU and GPU
from the sections above, and a GPU-memory estimate named by the first word
of each Babylon name. Memory and network stay "not available".

What that branch already does:

- Request owners: Google 3D Tiles, search, raster imagery, Mapterhorn and
  Terrarium terrain, NASA night lights, same-origin panorama scenes, the
  app's own files.
- The map cache's `fetch` counts imagery, terrain and night-light bodies
  while measuring, because those servers hide sizes from Resource Timing.
  While measuring is off it is the original `fetch`.
- GPU names: imagery atlas, raster tiles, the fallback globe, the sky dome
  and night lights, panorama meshes, the compass.
- Memory tracks: encoded image bytes (in the JavaScript heap), decoded
  images (not in that heap on Chromium), sky tables, night-light bytes.

Still uncounted after that branch:

- Google 3D Tiles bytes. They are fetched by `3d-tiles-renderer`, not the
  map cache, so they depend on Resource Timing and on the server allowing it.
- The star catalogue, about 196 kB once the sky is dark enough to load it.
- Terrain and Google tile CPU caches, panorama images outside the image
  broker, scene JSON, the game log.
- The atlas imagery worker's busy time. A `background/decode` section is
  the place for it; workers do not report today.
- The service worker's own network bytes. A cache hit of an app file should
  show as nothing received.

### Split the sky's one CPU section

`sky.update()` is timed as `sky`. The runtime already records
`cost.illuminationMs`, `cost.domeMs`, `cost.tablesMs` and the star field's
cost. Reporting `sky/illumination`, `sky/dome`, `sky/stars` and `sky/tables`
from those figures makes the CPU stream show which part moved. That change
belongs in the engine's frame, or in the sky runtime if it is given the
profiler. Keep it off the sky `faster-js` history; that history is the
speedups above.

### Capture harness

`research/scripts/benchmarks/scene-ab` already opens a page with
`set.renderer.profiling.*`, cross-origin isolation, and a CDP trace.
Isolation is what makes `performance.now()` finer than 100 µs and what
`performance.measureUserAgentSpecificMemory` requires. The apps' builds are
isolated too, with the headers from their service worker, since GitHub Pages
cannot send them: [WebAssembly builds](proposals/webassembly.md#3-isolation-from-the-service-worker),
step 3, built on 18 October 2026. Until the published apps are deployed with
it, isolation there is only on the capture harness.

Resource Timing keeps 250 entries unless the page raises the buffer. A long
tile load can drop entries. The observer does not ask for entries that
finished before measuring started.

### WebAssembly

[WebAssembly builds](proposals/webassembly.md) is the plan, and the
[WebAssembly agent](proposals/implementation/webassembly-agent.md) brief is
how to carry it out. A core moves to WASM only where a profile says it is
still the cost. It keeps the TypeScript API and needs the same bit-identical
proof. The binaries are built on the Mac with a pinned toolchain and
committed with their build metadata, so no hosted CI is needed. UI, the
toolbar and the app shell are not candidates. Design notes from the sky
bake-off sit in that repo's gitignored `build/wasm-bakeoff/`; they are not a
decision.

### After a merge

Archive finished worktrees and scratch with `~/gh-archive` and a line in
`~/gh-archive/MOVED.md`, then `git worktree prune`. Do not delete them.
Worktrees in use:

- `images`, `sky`, `cubemap`, `equirectangular`, `tiled-cubemap`: `build/worktrees/ws`
- `360/build/worktrees/ws` on `resize-area-edge`
- `renderer/build/worktrees/ws` on `profiler-streams` (`4275f5d`). Renderer `main` `6c435ce` has the same files; the branch can be dropped once nothing else points at it.
- `app/build/ws/foss-earth/app` on `profiler-streams`

Profiling harnesses under `images/build/wasm-profile`, `sky/build/wasm-profile`
and `cubemap/build/wasm-profile` are scratch. `app/build/wasm-profile` keeps
the app-level preparation, probe, runtime and tools.
