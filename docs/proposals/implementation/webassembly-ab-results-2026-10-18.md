# Native app comparison, 18 October 2026

The six app cores and the panorama preparation consumer are connected. The
global default remains TypeScript. Functional parity and measured performance
are separate: a worker placement gain is not a Rust arithmetic gain.

This is local, uncommitted work. Evidence under `build/` is ignored and exists
in these checkouts; the commands below use those local harnesses.

## Run the apps

Start each app in its own terminal:

```sh
cd ~/gh/foss-earth/app
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

```sh
cd ~/gh/UMN-VR/tour
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

```sh
cd ~/gh/0sfs/fly
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Use these equal-placement arms. Both cap preparation workers at ten and
elevation decode workers at two; the same controls, content and quality apply.
Reload for each tier change.

| App | TypeScript in workers | WASM in the same workers |
| --- | --- | --- |
| Earth | <http://127.0.0.1:5173/app/?set.native.tier=typescript-worker&set.native.workers=10&set.map.loader.decodeWorkers=2> | <http://127.0.0.1:5173/app/?set.native.tier=single&set.native.workers=10&set.map.loader.decodeWorkers=2> |
| UMN Minneapolis | <http://127.0.0.1:5174/tour/minneapolis/?set.native.tier=typescript-worker&set.native.workers=10&set.map.loader.decodeWorkers=2> | <http://127.0.0.1:5174/tour/minneapolis/?set.native.tier=single&set.native.workers=10&set.map.loader.decodeWorkers=2> |
| Fly | <http://127.0.0.1:5175/?set.native.tier=typescript-worker&set.native.workers=10&set.map.loader.decodeWorkers=2> | <http://127.0.0.1:5175/?set.native.tier=single&set.native.workers=10&set.map.loader.decodeWorkers=2> |

`?set.native.tier=auto` keeps the measured TS choices and enables only the
qualified sky worker placement; the global default itself remains unchanged.
`?set.native.tier=typescript` selects the original placements. To isolate a
core, keep that global tier and add `set.native.core.imagery=single` versus
`set.native.core.imagery=typescript-worker`; the same form works for `raster`,
`sky`, `terrain`, `google` and `ground`. For stars, keep
`set.native.core.sky=typescript-worker` and compare
`set.sky.stars.atmosphere=page` versus `worker`.

Inspect the Component execution tab or Copy report in each app. Earth and the tour also
expose `window.__fossEarthPanoramaTest.nativeCores()` when their URL includes
`&panoramaTest=1`; fly does not install that console hook. Check **actual**,
parity and fallback reason. An inactive core says it has not started; a fallback does
not qualify as a native sample. Google requires a Google map workload;
ground requires eligible scene meshes and finite surface queries.

## What actually runs

| Core | Rust work in `single` | Work retained elsewhere |
| --- | --- | --- |
| Raster | Terrarium RGBA-to-height conversion | Browser codecs/readback and existing decode-worker scheduling |
| Sky | Atmosphere tables, illumination, dome radiance | Star atmosphere/final colors use TS in the same worker; current-frame billboards, exposure and drawing stay synchronous |
| Terrain | Mesh target positions and bounds at `applyGrid` | Initial meshes, refinement, morph application and drawing |
| Imagery | Batched exact interpolation of sparse original grid pixels | Page answers misses immediately; both worker arms share generation-keyed memoization; selection remains synchronous |
| Google | Supported GLB geometry decoding | Browser JPEG codecs; lazy Babylon hierarchy, materials, texture upload and AssetContainer ownership |
| Ground | Immutable BVH construction | Admitted compact indices are traversed synchronously in TS, with current transforms and original picking fallback |
| Projection preparation | Exact bounded-window RGB reprojection in one preparation worker | Codecs, pyramid and preparation orchestration remain JS; direct browser photos already use GPU texture sampling |

Only the sky has a shared-memory threaded build. Requested `threaded` runs it
with `native.threads` cooperating threads on a cross-origin isolated page, and
otherwise falls back to single WASM with `not-cross-origin-isolated`. Other
cores report `threadedFallback: "no-shared-build"`. To compare it, start a dev
server with `FOSS_EARTH_ISOLATION=enforce` and load:

```text
http://127.0.0.1:5173/app/?set.native.tier=typescript&set.native.core.sky=threaded&set.native.threads=4&set.native.workers=10&set.map.loader.decodeWorkers=2
```

Use `native.core.sky=single` or `typescript-worker` with the same server for
the other arms. Results, commands and evidence are in the
[shared-memory UI handoff](webassembly-shared-memory-ui-handoff.md). Startup, parity, timeout, worker-budget and unsupported-profile
failures retain complete references. Ground excludes changing or unsupported
geometry and higher-precision CPU arrays. Google retains the original loader
for EXIF images, WebGL ICC images and unsupported GLB profiles.

## Repeat the frozen-source app workloads

From `~/gh/foss-earth/app`, the local driver runs paired arms and A/A controls,
one Chrome/Vite job at a time. Choose a new output directory to retain earlier
evidence:

```sh
node build/wasm-profile/runtime/runs/2026-10-17-integrated-ab/run-ab.mjs --out=build/wasm-profile/runtime/runs/my-native-ab
node build/wasm-profile/runtime/runs/2026-10-17-integrated-ab/summarize.mjs build/wasm-profile/runtime/runs/my-native-ab
```

An optional positional `sky-matrix`, `imagery` or `ground` selects that group.
The driver uses `--no-watch`, pinned time, `native.workers=8`, two elevation
decode workers and one changed core. It rejects changed-source or failed
arms. Do not edit served sources while it runs.

- **C-webgpu:** 20-second fixed camera sky-clock sweep through two days around
  each solstice, then a two-second hold. Separate original placement, same
  sky worker with page/worker stars, and the same worker with WASM sky math.
- **B-webgpu:** 30-second deterministic campus flight from 8,000 km to street
  level, pan, near-horizon tilt and climb. Synthetic deterministic map tiles,
  original imagery sampling versus TS/WASM batch/cache arms.
- **G-webgpu:** the actual app surface pipeline plus a static Float32 64×64
  grid fixture above campus. After build/admission, 64 fixed finite rays run
  200 times. All arms use the same mesh/rays. This tests the adapter, not an
  aircraft flight qualification.

Each arm stores `run.json`, actual native status, frame/long-task/memory
metrics, CPU profiles and source hashes. Ground also records a result hash.
`integrated-summary.json` and `.md` collect the arms. Existing preliminary
evidence is under `2026-10-17-integrated-ab/`; excessive full-grid imagery
copies and the earlier larger star output are retained as diagnostics.

## Repeat panorama preparation

From `~/gh/foss-earth/sphere-image`, create the deterministic fixture pose
(or substitute the same authored photo pose/input in both arms):

```sh
mkdir -p build/projections-window
printf '%s\n' '{"headingDeg":0,"pitchDeg":0,"rollDeg":0,"provenance":"deterministic preparation parity fixture"}' > build/projections-window/pose.json
node node/prepare-cli.mjs --input synthetic:cardinal:256 --pose build/projections-window/pose.json --preview-face-sizes 16,64 --tiles eac,cube --tile-size 16 --tile-face-size 64 --encoding png --attribution fixture --native-tier typescript-worker --out build/projections-window/js --replace
node node/prepare-cli.mjs --input synthetic:cardinal:256 --pose build/projections-window/pose.json --preview-face-sizes 16,64 --tiles eac,cube --tile-size 16 --tile-face-size 64 --encoding png --attribution fixture --native-tier single --projection-module ../native/packages/native-projections/index.js --out build/projections-window/wasm --replace
```

`prepared.json.nativeCores` records actual backend, parity, timing, copies,
memory and hashes. The checked full 8192×4096 RGB f32 source is unchanged
(384 MiB); adaptive windows keep tested peak WASM payload at 60,500,448 bytes
and linear memory at 95,551,488 bytes, within the existing 128/256 MiB caps.

## Evidence and limits

Focused parity, consumer and browser checks are recorded in the
[state document](webassembly-native-state.md). Google browser pixel evidence
is `renderer/build/google-browser/evidence/`; projection encoded parity is
`sphere-image/build/projections-window/consumer-parity.json`; ground lifetime
and finite-ray parity is `engine/build/ground-acceleration-2026-10-17/`.
The sparse imagery revision is recorded under
`engine/build/height-sparse-2026-10-18/`.

The final sky and imagery matrix is
`app/build/wasm-profile/runtime/runs/2026-10-17-integrated-ab/final/`.
All 20 arms had `sourceUnchanged=true`, one common served-source version and
1,260 per-file receipts. The final ground-only repetition after the index
invalidation fix is `../ground-index-final/` relative to that directory.
Each directory has `integrated-summary.{json,md}`; the first also has
`comparisons.json`. Earlier ground rows describe the preceding static-fixture
implementation and are superseded by that repetition.

| Comparison | Repeated page task times | Interpretation |
| --- | --- | --- |
| Original sky versus TS sky worker, stars on page | 12.218/11.869 s versus 8.154/8.057 s | Mean −3.938 s / −32.7%, with original control spread 0.348 s |
| Star colors on page versus same TS sky worker | 8.154/8.057 s versus 7.060/7.678 s | Mean −0.736 s / −9.1%; both paired differences favor offloading, but worker spread is 0.618 s and frame tails vary |
| TS versus WASM sky, both with worker stars | 7.060/7.678 s versus 7.402/7.487 s | Mean WASM +1.0%, within observed variation; no whole-app Rust gain |
| Original imagery versus TS versus WASM batches | 19.213/14.176 s; 21.344/15.832 s; 16.420/15.841 s | Original/TS repeat drift is 5.0–5.5 s, larger than the apparent WASM difference; no qualified gain |

Combined sky placement and worker stars reduce mean page task time from
12.043 s to 7.369 s (−38.8%). This is a worker architecture result, with
TypeScript star evaluation. Original sky callback p95 was 9.5–9.8 ms;
worker-star TS arms were 3.9/5.5 ms. Star offloading alone does not show a
uniform frame-tail improvement. All C arms stayed approximately 60 FPS,
reported no page errors or long tasks, and had sampled page heaps of
152–198 MiB. These are page heap readings, not total process memory or watts.

Imagery's final WASM arms admitted native results with parity `same`, zero
fallback/dropped queries and 11.9–13.4 million native cache hits. Per-run
input was about 31 MB; transient sparse snapshot peaks were 0.14–0.21 MB,
with native snapshots below 84 KB and zero retained snapshot bytes after
jobs. Both worker arms memoize exact page misses too: none of that memoization
is a Rust arithmetic gain. Late TS/WASM worker work totals were 365 versus
581 ms; the page reference was faster than either late worker arm. Imagery,
terrain and raster therefore retain TS in auto. Long tasks, FPS and memory
for every B arm remain in the raw reports; the first controls were visibly
slower and are retained, not discarded.

After the index-identity fix, all six G repetitions were source-stable.
Each arm executed 12,800 queries; its final 64-ray outputs had the same SHA256
`efca0e0f4c13e31279dfc0f1192f2cbd8db1dd3dc53aa5f49c0e2226d4335a0a`.
Original query totals were 3.242/3.194 s; TS-built indices took 1.923/1.966 s,
and WASM-built indices 1.924/1.910 s: about 40% lower query cost with the
spatial index. The reference A/A spread was 49 ms. Both accelerated arms
perform the same synchronous TS traversal, so the query improvement belongs
to the index, not Rust. WASM construction was slower (20.9–21.6 ms versus
14.9–15.4 ms TS). One 229,312-byte index was admitted per arm; scene/native
parity was `same`, with no fallback. The workload submits synchronous ray
batches, so its incidental frame samples are not a flight-frame metric.
Ground remains TS in auto pending representative flight/Google workloads.

The ground review also fixed same-length `Geometry.updateIndices()` changes
that bypass Babylon's geometry notification. An O(1) source-identity check
invalidates the cached index before any query; pending builds verify the
captured identity before publication. Three new adversarial cases and the
10-test ground suite pass, along with full engine typecheck/build/lint.

The preliminary sky page control varied from 7.37 to 11.70 seconds, so that
earlier matrix was inconclusive. The full-grid imagery preflight copied
gigabytes and was replaced with the sparse path before the final comparison.
Google's 48 cases and projection's 264 outputs establish scoped functional
parity, not representative performance gains. Absolute power, real-view
Google performance, cross-browser program gates and flight qualification
remain separate work.
