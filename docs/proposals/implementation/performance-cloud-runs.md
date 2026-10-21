# Performance runs for a cloud VM

The timed browser runs that the performance work needs but that are too long
for the user's laptop, a fanless MacBook (M5) that heats up and throttles under
them. Hand this file to an agent on a cloud VM. The work they measure is
described in the [performance agent state](performance-agent-state.md) and the
[performance audit](../../performance-audit.md).

Each run below is self-contained. Do them in order of priority, and skip any
whose setup fails, saying why.

## Rules

- **Measure, don't change.** Don't commit to or push any FOSS Earth, UMN-VR or
  0SFS repository, and don't deploy. Local, uncommitted edits are allowed only
  where a run says so (the R3 probe). Revert them afterwards.
- **No secrets are needed.** None of these pages needs an API key. Don't add
  one.
- **Never print or save a map tile's address.** Report bytes by kind and host,
  never by URL.
- **One timed run at a time.** Nothing else may run on the VM during a
  `profile.mjs`, `pixels.mjs` or `run.mjs` run: no builds, installs or tests.
  Do all the builds first.
- **Interleave the arms** in the order a b b a a b: three runs of each arm,
  alternating, so a drift in the machine affects both arms alike.
- **Count a difference only if it separates**, meaning no run of one arm
  overlaps any run of the other. Report everything else as "within noise".
- **Clean up after a failed browser.** If Chrome was killed, crashed or timed
  out, kill any leftover Chrome processes before the next run. If a run fails,
  record the command and the last 30 lines of its log, then go on.

## The machine

- Use a dedicated (not burstable) Linux VM with at least 8 vCPUs and 16 GB of
  memory. Node 22.18 or newer.
- Install Chrome, for example Chrome for Testing
  (`npx @puppeteer/browsers install chrome@stable`), and set `CHROME_BIN` to it.
- Without a GPU, WebGPU needs software rendering. Put the flags in
  `CHROME_EXTRA_ARGS`, which both research scripts add to Chrome's command
  line. Try
  `--enable-unsafe-swiftshader --use-webgpu-adapter=swiftshader --enable-features=Vulkan --use-vulkan=swiftshader --no-sandbox`.
  If a page cannot get a WebGPU adapter, it falls back to WebGL2. That still
  serves an A/B, but say which backend every run used. To check it, pass this
  to `profile.mjs`:

  ```sh
  --probe '(() => { const c = [...document.querySelectorAll("canvas")].sort((a, b) => b.width * b.height - a.width * a.height)[0]; return c?.getContext("webgpu") ? "webgpu" : c?.getContext("webgl2") ? "webgl2" : "none"; })()'
  ```

  The answer is in `summary.md`, on its "Probe before/after" line.
- The figures will not match the Mac's. Only arms run on this VM in one sitting
  compare with each other.

## Setup (once)

Clone into `~/gh` with exactly these folders, so that the apps' relative
`file:` dependencies resolve:

| GitHub | Folder | Repositories |
| --- | --- | --- |
| `foss-earth/<name>` | `~/gh/foss-earth/<name>` | about, app, browser-testing, dev, docs, engine, images, preview-sheets, rectangle-image, renderer, research, scenes, sky, sphere-cubemap, sphere-equirectangular, sphere-image, sphere-tiled-cubemap, toolbar, ui, weather |
| `UMN-VR/<name>` | `~/gh/UMN-VR/<name>` | tour, minneapolis, st-paul, twin-cities |
| `0SFS/<name>` | `~/gh/0sfs/<name>` | fly, and each folder its `package.json` names with `file:../` (aircraft, autopilot, C172, controls, engines, exhaust, F-35B, F135, FJ33, fuel, g-forces, ground-contact, IO320, logging, logo, rc, SF-50, sound; the names are case-sensitive) |
| `Felipegalind0/gamepad-tools` | `~/gh/Felipegalind0/gamepad-tools` | |

`foss-earth/dev_installer` can set up the same layout from a workspace
manifest. Only R1 needs the 0SFS repositories.

Then install each app's dependencies (`npm ci` in `UMN-VR/tour`,
`foss-earth/app`, `0sfs/fly` and `foss-earth/research`). The libraries, such as
`engine`, have no `node_modules` of their own. On the Mac they resolve packages
such as `3d-tiles-renderer` and `@babylonjs/core` from
`~/gh/foss-earth/node_modules`. If a build cannot resolve a package from a
library, install it there at the version in the app's `package-lock.json`.
Write down what you had to do.

**Builds.** Every arm is a production build with source maps, in the app's own
`build/perf/<name>`:

```sh
cd ~/gh/UMN-VR/tour && npx vite build --configLoader native --sourcemap --outDir build/perf/<name> --emptyOutDir
cd ~/gh/foss-earth/app && npx vite build --configLoader native --manifest --sourcemap --outDir build/perf/<name> --emptyOutDir
cd ~/gh/0sfs/fly && npx vite build --configLoader native --sourcemap --outDir build/perf/<name> --emptyOutDir
```

For each build, record `git rev-parse --short HEAD` and `git status --short |
wc -l` of every repository. The arms of an A/B must differ only where the run
says.

**The profiler.** Run it from `~/gh/foss-earth/research`:

```sh
node scripts/benchmarks/startup-audit/profile.mjs --target <tour|app|fly> --root <build> [--phone] \
  [--motion drag|still|enter] --rates <1,4> --seconds 8 [--query "<a=b&c=d>"] --label <label>
```

- Each run makes a cold and a warm visit, then one stretch per rate with the
  CPU profiler on.
- The last line of the log is the output folder. It holds `summary.md`.
- `summary.md` gives, per stretch: fps, p95 frame time, main-thread %, script
  %, and self and inclusive time by function and by file, in ms per second.
- Compare arms on **main-thread ms per frame**, which is main % × 10 ÷ fps. At
  4× CPU a saving buys frames as well as idle time, so the main-thread share
  alone misleads.
- The visits line must read `isolated true, shared memory true` in every run.
  If it doesn't, stop and report it: it is a regression.
- A run takes 1–2 minutes per rate.

## R1. The flight with this session's engine and renderer commits

Priority 1, about 25 minutes. Before these commits reach the flight (`/fly/`),
check that they don't slow it. They are pixel-identical and do less work by
construction, so a slower flight would be a surprise.

| Arm | engine | renderer | Everything else |
| --- | --- | --- | --- |
| `fe-a` | `5a7880e` | `89ec913` | the same commits in both arms |
| `fe-b` | `be3f60a` | `af7505e` | |

`git checkout` the engine and renderer refs, build the flight into
`build/perf/fe-a`, switch both repositories to the B refs, and build into
`build/perf/fe-b`. Then return both repositories to their branch.

```sh
node scripts/benchmarks/startup-audit/profile.mjs --target fly --root ~/gh/0sfs/fly/build/perf/fe-<arm> --rates 1,4 --seconds 8 --label r1-<arm>-<n>
```

Report, for each rate:

- main %, fps and ms per frame: each run, and the median per arm;
- the self ms/s of `createImageryRuntime.ts`, `managedPatchTable.ts`,
  `imageryBinding.ts`, `uiOcclusion.ts` and the renderer's `metrics.ts`, from
  the "Self time by file" table, where they appear.

**Passes if** neither ms per frame at 4× nor main % at 1× is worse in B by a
separated margin.

## R2. The four 360 experiments (backlog X1)

Priority 2, about 40 minutes. The renderer's experiments are meant to draw the
same picture with less work. Each is off by default:

- `renderer.experiments.panoramaBookkeeping`;
- `renderer.experiments.opaqueImmersion`;
- `renderer.experiments.panoramaShaders`, which acts on WebGL only;
- `renderer.experiments.presentationCandidates`.

`renderer.experiments.all` turns on all four. Build the tour at `main` into
`build/perf/main`.

**(a) Pixels.**

```sh
node scripts/benchmarks/startup-audit/pixels.mjs ~/gh/UMN-VR/tour/build/perf/main build/pixels/x1-webgpu setting=renderer.experiments.all
node scripts/benchmarks/startup-audit/pixels.mjs ~/gh/UMN-VR/tour/build/perf/main build/pixels/x1-webgl2 setting=renderer.experiments.all query=set.renderer.backend=webgl2
```

- The script stops the page's clock at 9 moments: the map, part way into a 360
  image, inside it, part way out, and the map after. At each moment it
  compares screenshots with the setting off and on.
- A good moment is `"same":true`. Each JSON line in the log is one moment.
- `"steady":false` means the page kept changing with the setting held. If the
  log says `NOT READY` (the page was still loading at the 4-minute limit), run
  it again once.
- For any `"same":false`, report the differing pixel count and the largest
  channel difference, and keep the two PNGs. Then run each experiment alone to
  find which one differs.

**(b) Time inside a stop.** Six runs in a b b a a b order:

- arm a: `--target tour --phone --motion enter --rates 4 --seconds 8` with no
  query;
- arm b: the same with `--query "set.renderer.experiments.all=1"`.

Then six more with `set.renderer.backend=webgl2` added to both arms' query.
Report ms per frame, fps, p95 and the longest frame per arm.

## R3. Off-screen orb draws (backlog X2)

Priority 3, about 10 minutes. Every 360 orb is drawn in every frame, about 49
draws a frame in the tour's phone drag, even where the orb is off screen. This
run counts how many draws are wholly outside the view, which bounds what
culling them could save.

In `foss-earth/sphere-image/src/renderer.ts`, inside `applyUniforms`, insert
this right after the line
`const quad = orbQuad(rel, radius, uniforms, near, outline?.widthPx ?? 0);`:

```ts
        if (target === material) {
          // Probe: whether every corner lies outside one clip half-space (x>w, x<-w, y>w, y<-w, w<0).
          const m = uniforms.viewRotProj.m;
          let px = 0, nx = 0, py = 0, ny = 0, nw = 0;
          for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
            const x = quad.center[0] + su * quad.u[0] + sv * quad.v[0], y = quad.center[1] + su * quad.u[1] + sv * quad.v[1], z = quad.center[2] + su * quad.u[2] + sv * quad.v[2];
            const cx = x * m[0] + y * m[4] + z * m[8] + m[12], cy = x * m[1] + y * m[5] + z * m[9] + m[13], cw = x * m[3] + y * m[7] + z * m[11] + m[15];
            const slack = 1e-4 * (Math.abs(cx) + Math.abs(cy) + Math.abs(cw));
            if (cx - cw > slack) px++; if (cx + cw < -slack) nx++; if (cy - cw > slack) py++; if (cy + cw < -slack) ny++; if (cw < -slack) nw++;
          }
          const fe = ((globalThis as { __fe?: Record<string, unknown> }).__fe ??= {});
          const c = (fe.orb ??= { draws: 0, outside: 0, fullscreen: 0, behind: 0, frames: 0, lastFrame: -1 }) as Record<string, number>;
          c.draws++; if (quad.fullscreen) c.fullscreen++;
          if (px === 4 || nx === 4 || py === 4 || ny === 4 || nw === 4) c.outside++;
          if (nw === 4) c.behind++;
          if (c.lastFrame !== engine.frameId) { c.frames++; c.lastFrame = engine.frameId; }
        }
```

Build the tour into `build/perf/orbcount`, then run once with each motion:

```sh
node scripts/benchmarks/startup-audit/profile.mjs --target tour --root ~/gh/UMN-VR/tour/build/perf/orbcount --phone --motion drag --rates 4 --seconds 8 --probe 'JSON.stringify(globalThis.__fe ?? null)' --label r3-drag
node scripts/benchmarks/startup-audit/profile.mjs --target tour --root ~/gh/UMN-VR/tour/build/perf/orbcount --phone --motion still --rates 4 --seconds 8 --probe 'JSON.stringify(globalThis.__fe ?? null)' --label r3-still
```

Then `git checkout src/renderer.ts` in sphere-image.

Report:

- the probe's before and after values, and their difference: draws, outside,
  behind, fullscreen and frames;
- `outside / draws` for the stretch;
- the self ms/s of `sphere-image/src/renderer.ts` from the summary.

## R4. Memory, heap and GPU memory

Priority 4, about 10 minutes. These are single runs on the `main` builds (build
the app at `main` into `build/perf/main` as well):

```sh
node scripts/benchmarks/startup-audit/profile.mjs --target tour --root ~/gh/UMN-VR/tour/build/perf/main --phone --rates 4 --seconds 8 --memory --heap --gpu --label r4-tour
node scripts/benchmarks/startup-audit/profile.mjs --target app --root ~/gh/foss-earth/app/build/perf/main --rates 1 --seconds 8 --memory --heap --gpu --label r4-app
```

`--heap` and `--gpu` are new. If either fails, fix the script in your checkout,
say what you changed, and run again. Report from `summary.md`:

- the "Page heap snapshot" section;
- the "GPU memory" section;
- memory-infra's largest allocators;
- the total JS heap.

The macOS footprint part of `--memory` is empty on Linux. GPU memory is counted
only through WebGPU, so if the page fell back to WebGL2, say so.

The question behind it: how much of GPU memory is map and photo tile textures,
and how much is render targets? And are any render targets larger or more
numerous than the canvas needs (MSAA, copies, unused targets)?

## R5. Startup blocking and bytes

Priority 5, about 20 minutes, with the `main` builds:

```sh
node scripts/benchmarks/startup-audit/run.mjs --serve --runs 3 --targets tour,app \
  --tour-root ~/gh/UMN-VR/tour/build/perf/main --app-root ~/gh/foss-earth/app/build/perf/main
```

From its `summary.md`, report:

- per page, cold and warm: time to content, the globe and settled;
- blocking before the first frame and before the globe;
- the number of long tasks and the longest;
- `isolated`.

From the `<page>-<run>-cold.json` request lists, report bytes received by kind
(code, map imagery tiles, elevation tiles, 3D tiles, 360 photo media, other)
and by host. Never report URLs.

## What to send back

One Markdown report, as the final message. For each run, give:

- the arms' commits, and the backend each arm used;
- a table of every run, and each arm's median;
- which differences separate.

Also give the VM's type, CPU model, vCPU count, memory, Chrome version and
Chrome flags, and every setup step that differed from this file. Keep each
run's `summary.md` (and `heap.json` and `gpu.json`) in a tarball, if the
environment can return files.

## Adding runs

A later performance session adds a run here, as R6 onward, when it needs a long
measurement. Each run names its arms by commit, its exact commands, what to
report, and the result that would change a decision.
