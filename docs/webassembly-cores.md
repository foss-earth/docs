# WebAssembly cores

Six numeric cores have a TypeScript reference and a Rust/WebAssembly twin.
Each twin pair sits side by side in the repository that owns the core, in
`<name>-TS/` and `<name>-WASM/`. The apps (Earth, the UMN tour and 0SFS) choose
between them per component, at startup, and run WebAssembly only in workers.
A WebAssembly core is used only after its output matches the TypeScript one
exactly: on its first real input, or for the ground index on a fixed fixture
when its worker starts, after which every index it builds must contain its
mesh. Otherwise the component keeps TypeScript and reports why.

The [WebAssembly builds proposal](proposals/webassembly.md) is the plan; this
page describes what exists.

## Where they are

| Core | Repository | TypeScript | Rust/WebAssembly | Chosen by |
| --- | --- | --- | --- | --- |
| Terrarium tiles to heights | [engine](https://github.com/foss-earth/engine) | `raster-TS/` | [`raster-WASM/`](https://github.com/foss-earth/engine/blob/main/raster-WASM/README.md) | `native.core.raster` |
| Terrain geometry and height batches | engine | `terrain-TS/` | [`terrain-WASM/`](https://github.com/foss-earth/engine/blob/main/terrain-WASM/README.md) | `native.core.terrain`, `native.core.imagery` |
| Ground spatial index | engine | `ground-TS/` | [`ground-WASM/`](https://github.com/foss-earth/engine/blob/main/ground-WASM/README.md) | `native.core.ground` |
| Sky atmosphere, with a shared-memory build | [sky](https://github.com/foss-earth/sky) | `sky-TS/` (re-exports `src/`) | [`sky-WASM/`](https://github.com/foss-earth/sky/blob/main/sky-WASM/README.md) | `native.core.sky`, `native.sharedSky`, `native.threads` |
| Google tile geometry | [renderer](https://github.com/foss-earth/renderer) | `google-TS/` | [`google-WASM/`](https://github.com/foss-earth/renderer/blob/main/google-WASM/README.md) | `native.core.google` |
| Panorama reprojection | [sphere-image](https://github.com/foss-earth/sphere-image) | `projections-TS/` (re-exports the three sphere libraries) | [`projections-WASM/`](https://github.com/foss-earth/sphere-image/blob/main/projections-WASM/README.md) | the preparation command's `--native-tier` |

Each `-WASM/` folder is its own Cargo workspace (`Cargo.toml`, `Cargo.lock`,
`rust-toolchain.toml`, `toolchain.lock.json`) with its crates under `crates/`,
the JavaScript wrapper and declarations, the checked-in binary
(`single/<core>.wasm`, plus the sky's `shared/sky-shared.wasm`), the build
receipt `build-metadata.json`, `scripts/`, `tests/` and a README with the ABI,
bounds and evidence. Packages export them as `/<name>-TS`, `/<name>-WASM` and
`/<name>-WASM/wasm`, the binary.

From each owning repository:

```sh
npm run build:wasm     # rebuild the binaries offline, with their receipts
npm run check:wasm     # receipts: source hashes, binary size and hash, Node validation
npm run check:parity   # engine, sky, sphere-image: the binary against the TypeScript reference
npm run test:wasm      # wrapper, worker and ownership tests (renderer: also its parity)
npm run test:rust      # engine, sky: cargo tests
```

Parity reports go to the repository's ignored `build/<name>-WASM/`.

## In the apps

`native.tier` chooses how every core runs, after a reload:

- `typescript` keeps each core's original code and placement: the page, except
  raster decoding, which always ran in workers.
- `typescript-worker` runs the TypeScript reference in the same workers as
  WebAssembly. It is the reference arm of an A/B.
- `single` runs the single-threaded WebAssembly core in those workers.
- `auto` takes each core's recorded choice.
- `threaded` runs the sky's shared-memory build on a cross-origin isolated
  page, and its single-threaded core elsewhere. The other cores have no shared
  build and report their fallback.
- `custom` takes separate choices: `native.implementation=typescript|wasm`,
  `native.placement=original|worker` and `native.parallelism=auto|serial`.

Since 19 October 2026 the default is `single`, with `native.sharedSky` on, so a
WebAssembly sky runs its shared-memory build on an isolated page. That default
was chosen because it worked well enough on a Mac and an Android phone; it is
not a speed claim. Paired runs measured Terrain heights and Terrain geometry
slower in WebAssembly than in TypeScript.

`native.core.<core>` overrides the tier for one core (`raster`, `sky`,
`terrain`, `imagery`, `google`, `ground`), and `native.core.<core>.<field>`
overrides one manual field; each accepts `inherit`. `native.workers` caps all
preparation workers together, and `native.threads` (1–8, the coordinator
included) sets the sky's shared-memory threads. A URL sets them for one load,
for example `?set.native.tier=typescript-worker` or
`?set.native.core.sky=threaded&set.native.threads=4`.

The Component execution tab has Global defaults and Components. Each component
shows its settings and what it is actually running: TypeScript or WebAssembly,
in how many workers or on the page, tinted blue for TypeScript, purple for
WebAssembly, and both colours when mixed. The list follows the basemap: raster
heights, geometry and imagery for 2D, Google preparation for 3D, sky and the
ground index in both. Changes wait for Apply and reload. The sky's Shared
memory control is disabled on a page that is not cross-origin isolated. Copy
report includes every component's requested and actual backend, parity,
fallback and timings.

Count a WebAssembly measurement only when the report says the actual backend
is WebAssembly and parity is `same`. A fallback is working behaviour, not a
WebAssembly result. No Rust export runs on the page's main thread.

## Measuring

Do not assume Rust is faster. Measure the kernel and the whole copy and worker
path separately, with paired A/B trials and an A/A control on the same
machine, comparing `typescript-worker` with `single` for one core at a time.
For a reproducible isolated comparison set
`native.tier=typescript,native.workers=8,map.loader.decodeWorkers=2` and
override one core. Power needs its own agreed battery window. A kernel
benchmark is not an app measurement either: in Node on an Apple M5, ground's
Rust core builds the TypeScript index about 12 times faster than TypeScript
(26 ms against 308 ms at 262,088 faces), but the in-app comparison has not been
rerun for it. The
[native state document](proposals/implementation/webassembly-native-state.md)
records the first in-app A/B and its method; the
[18 October comparison guide](proposals/implementation/webassembly-ab-results-2026-10-18.md)
has launch URLs for the app, the tour and 0SFS.

## Toolchain

- Rust and cargo 1.99.0 (the installed `stable`), the `wasm32-unknown-unknown`
  target and Binaryen 132's `wasm-opt`, pinned in `toolchain.lock.json` and
  checked before each build starts. Node 26.9.0 is pinned there too and
  recorded in the receipt.
- No nightly, `wasm-bindgen` or external crates. The build scripts compile with
  `--locked --offline` and never install, download or ask for anything.
- The release profile uses `opt-level = 3`, fat LTO, one codegen unit and
  `panic = "abort"`. The single builds add `+simd128` and a 256 MiB memory
  maximum, then run `wasm-opt -O3 --enable-simd --strip-debug`.
- The sky's shared build uses stable Rust with the atomics, bulk-memory,
  mutable-globals and simd128 target features, an imported 4 MiB shared memory
  and no standard library; see sky-WASM's README.
- Intermediates go to the repository's ignored `build/<name>-WASM/target/`.

The builds are reproducible. Moving the cores into their repositories on
19 October 2026 rebuilt every binary byte for byte, ground's as
`1fb1c9d0…0e0a` (30,911 bytes). Later that day ground's core was rewritten to
build the TypeScript index bit for bit, which the moved binary did not always
do, and faster; see
[ground-WASM](https://github.com/foss-earth/engine/blob/main/ground-WASM/README.md).
Each folder's receipt has the full hashes:

| Binary | Bytes | SHA-256 |
| --- | --- | --- |
| `raster.wasm` | 16,459 | `533e6afc…f8c3` |
| `terrain.wasm` | 33,297 | `24e02faa…aba1` |
| `ground.wasm` | 49,399 | `3b66f9ea…e0f7` |
| `sky.wasm` | 35,972 | `f789b0aa…0135` |
| `sky-shared.wasm` | 16,985 | `450d07cb…6d5c` |
| `google.wasm` | 18,316 | `f5ef0ee8…9955` |
| `projections.wasm` | 33,660 | `30bf17b2…6aa2` |

### Why wasm32

`wasm32-unknown-unknown` names the target, not an old Rust version: browser
WebAssembly with 32-bit memory addresses and no assumed operating system.
Numbers still include i64 and f64, and SIMD is enabled separately. The single
builds are bounded at 256 MiB, so they do not need memory64. Rust's wasm64
target is Tier 3 with no precompiled standard library; a wasm64 experiment
would need its own support and performance qualification, not an assumption
that wider pointers help these workloads. See the
[wasm32](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html)
and [wasm64](https://doc.rust-lang.org/rustc/platform-support/wasm64-unknown-unknown.html)
target documentation.

## History

From 17 to 19 October 2026 the cores were built in one local workspace,
`foss-earth/native`, which was never published. The implementation handoffs
under `proposals/implementation/` describe that period and keep its paths
(`native/packages/native-*`).
