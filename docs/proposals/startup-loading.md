# Startup: instant feedback, a boot terminal, code on demand

Status: proposal, 17 October 2026. Nothing below is built yet unless it says
so. It covers four requests that share one goal, a FOSS Earth page that
answers a click at once and is in its 3D scene as early as possible:

1. Code on demand ("JIT"), with prefetching while the page is idle, so that
   developer tools and closed panels cost a visitor nothing.
2. Tiered startup: an instant page, then a terminal-like loading screen with a
   progress bar, then the 3D scene, which keeps loading into the log.
3. A renderer advisor: a warning, with a concrete fix, when the browser draws
   with WebGL on hardware that could use WebGPU.
4. Measurement, so each step can show what it saved.

The [implementation brief](implementation/startup-loading-agent.md) is the
prompt that starts an agent on this work.

## What exists today

| Piece | Where | State |
| --- | --- | --- |
| Lazy `import()` for a few features | app `sceneHost.ts` (pose editor, thumbnails), engine `globeBindings.ts` (3D Tiles), engine `createGlobeRuntime.ts` (compass center ball) | Ad hoc: each is written by hand, and none is prefetched |
| Developer mode | `@foss-earth/dev`: `wantsDev(search)` accepts exactly one `dev=1`; the Dev tab mounts contributions only while open | Built |
| Developer-only settings | engine `DEV_CONTROLS_PARAMETERS`, which the app registers only under `?dev=1` (`app/src/settings/appSettings.ts`) | Built for Show compass center |
| Prefetch while idle | — | None. No `requestIdleCallback`, `modulepreload` injection or speculation rules anywhere |
| App files kept on the device | `appFiles()` Vite plugin and `foss-earth-sw.js` | Built; repeat visits read the app from the device |
| Loading screen | — | None. A campus page is an empty `<div id="root">` until the whole bundle has run |
| Failure and stall screen | `browserRecovery()` from `@foss-earth/ui/vite`, inline in `<head>`, 45 s stall limit | Built; it is the natural owner of the boot terminal |
| Log with progress bars | `createGameLog` in `@foss-earth/ui` (`progress: number \| null` per line), map and scene loading lines | Built |
| Renderer diagnostics | Renderer tab: secure context, `navigator.gpu`, `IsSupportedAsync`, fallback error | Built, but only in the tab: nothing in the log says WebGL was a fallback |
| Startup items in the optimization backlog (`docs/optimization-backlog.md`, Loading, network and startup) | S1 (import only the Babylon modules used), S2 (lazy panels), S3 (compile shaders during loading), S4 (fetch only one shader chunk) | Open |

### Measured: what the Minneapolis page loads before it can draw

From the tour's `dist/` built on 16 October 2026 (`/tour/minneapolis/`):

- The HTML is 68 KB: a 37 KB inline recovery script and 25 KB of inline
  build provenance (`foss-earth-built-from` JSON) come before anything that
  could be painted.
- It then preloads **72 modules: 7.6 MiB raw, 1.44 MiB brotli**, before the
  first line of app code runs.
- `scenes-*.js` alone is 5.3 MiB raw, 1.0 MiB brotli.
- **Both** shader chunks are preloaded, GLSL (98 KB brotli) and WGSL (96 KB
  brotli), though a page uses one. This settles backlog S4: it is a real cost.
- The preload list includes Babylon audio (`spatialWebAudio*`,
  `abstractSound*`), flow graph (`flowGraph*`) and DDS modules, which the
  globe does not use: evidence for S1.

Repeat visits read these from the service worker's cache, so the cold first
visit on a phone is the case to design for.

## 1. Code on demand and idle prefetch

### Rules

- A feature that a visitor does not see on the first frame is loaded with
  `import()`, never imported statically from the startup graph: panels that
  start closed, editors, providers not selected, developer tools.
- Each such feature declares when it may be fetched early:
  - `intent`: when the visitor shows intent, such as hovering or focusing the
    tab button that opens it, or a setting that will need it being changed.
  - `idle`: after the scene has settled, while the page is idle.
  - `never`: only when it is used. Developer tools are `never` for visitors,
    and `idle` on a `?dev=1` page.
- Prefetching fetches and compiles without running: it adds
  `<link rel="modulepreload">` for the feature's chunk and its imports. It does
  not call `import()`, so no module's top-level code runs early.
- Prefetching never wakes the render loop ([Render on demand](../render-on-demand.md)),
  stops while the page is hidden, takes one chunk at a time, and is skipped
  under `navigator.connection.saveData` or an `effectiveType` of `slow-2g`
  or `2g`.

### Proposed API (app)

```ts
// app/src/app/lazyFeature.ts
const poseEditor = defineLazyFeature({
  id: "pose-editor",
  load: () => import("./poseEditor/editor"),
  prefetch: "intent",          // "intent" | "idle" | "never"
  devOnly: false,              // true: prefetch is "never" unless wantsDev(search)
});
await poseEditor.load();       // memoized; the log notes "Loaded pose editor (42 KB)" in dev mode
poseEditor.prefetch();         // adds modulepreload links once
```

A small Vite plugin (beside `babylonShaderChunks` in `foss-earth/vite`) writes
a virtual module that maps each feature's `id` to its chunk URL and the chunk
URLs it imports, read from the bundle in `generateBundle`. In development the
map is empty and `prefetch()` does nothing.

An idle queue, started on the scene's first settled frame, prefetches the
`idle` features in their declared order with `requestIdleCallback`
(`setTimeout` where it is missing).

Engine features such as the compass center ball keep their own `import()`,
because the engine does not depend on the app; the app can still list the
engine's chunk for prefetch through the same plugin.

### Two kinds of developer tool

- **Shipped but dormant:** in every build, listed only on a `?dev=1` page,
  fetched only when switched on. Show compass center is the first. This kind
  works on the live site, so a phone can use it without a dev server.
- **Dev server only:** added by a Vite plugin to `npm run dev` pages and
  absent from builds. Use this kind when the tool has a large dependency, or
  must not reach the live site at all.

## 2. Tiered startup

### Target experience

1. **T0, the click (under 100 ms).** A tap on a campus card, or any link into
   a FOSS Earth app such as 0sfs, shows the card pressed and the next page's
   first paint quickly. The selector page prefetches the campus pages' HTML
   with speculation rules (`<script type="speculationrules">`, `prefetch`,
   `eagerness: "moderate"`, so on hover or pointer down) and, while idle,
   warms the shared app chunks into the HTTP cache or service worker.
2. **T1, the boot terminal (first paint).** The page's HTML paints a dark,
   monospace terminal before any script is fetched. Log lines say what is
   being fetched and started, and a bar under the text shows how far along it
   is.
3. **T2, an empty 3D scene, as early as possible.** The renderer and an empty
   scene, with the globe's base, start from a small boot chunk. Everything
   else loads into the running scene.
4. **T3, loading in the scene.** The terminal hands over to the existing log
   (a tab, or an overlay where the window is wide enough), whose lines and
   progress bars carry on with tiles, photographs, panels and idle prefetches.

### The boot terminal

Owner: `@foss-earth/ui/vite`, as a `bootTerminal()` plugin beside
`browserRecovery()`, so that every FOSS Earth app gets it.

- **Markup and style first.** An inline `<style>` and a static
  `<div id="foss-earth-boot" role="status" aria-live="polite">` are the first
  things in the HTML, so the terminal paints from the first bytes with no
  script. The bar is `role="progressbar"` with `aria-valuenow`. It uses
  `ui-monospace`, no web font, and follows `data-ui-theme` and
  `prefers-color-scheme`, with no animation under `prefers-reduced-motion`.
- **A small HTML.** Move the 25 KB build provenance out of the HTML into a
  `built-from.json` that the About tab fetches when it opens. Keep the HTML
  before the terminal under about 14 KB compressed, so it arrives in the first
  round trip.
- **Knows what it waits for.** At build time the plugin writes the entry's
  static import graph, with each chunk's compressed size, into the page as a
  small JSON. A `PerformanceObserver` for `resource` entries (buffered)
  matches finished chunks and sums `encodedBodySize`. Where sizes are missing,
  for example when the service worker answers, it counts files instead.
- **Stages after the download.** The app reports
  `window.__fossEarthBoot?.step(id, text, fraction?)` for: evaluate modules,
  start the renderer (saying WebGPU or WebGL), compile shaders (n of m, which
  is where backlog S3 runs), load the scene, first frame.
- **An honest estimate.** The bar weighs download and startup by the times
  this device took last time (kept in `localStorage`, in try/catch). It shows
  "about N s" only once it has measured a byte rate on this visit.
- **Handover.** On the first presented frame of the 3D scene the terminal fades
  out over about 150 ms, and its lines are printed into the game log's history,
  so the record runs on without a gap.
- **Failure.** The recovery script's stall and failure offers use the same
  element: the last line turns into the error, with its actions.

### The empty scene first

This is the step that changes how long it takes to reach the scene. Split the
entry so the first chunk holds only renderer selection, the engine and scene,
the globe's base and the boot-terminal hooks. React, panels, the scene
catalogue, the star catalogue, the geoid tables (`egm2008-*.bin`) and providers
not chosen load after the first frame, through section 1's features. It
depends on S1 (import specific Babylon modules), S2 (lazy panels) and S4 (one
shader chunk). Set its byte budget from the measured baseline. A first goal is
half of today's 1.44 MiB brotli before the first frame.

### Acceptance

Measure with `@foss-earth/browser-testing`: a cold profile, and the Chrome
DevTools Protocol for network throttling (Fast 4G) and a 4× CPU slowdown. Use
`performance.mark` at `boot:html`, `boot:terminal`, `boot:modules`,
`boot:renderer`, `boot:first-frame` and `boot:settled`. Record:

- the first paint of the terminal after navigation;
- the first 3D frame;
- the bytes fetched before the first 3D frame;
- the time to settled.

Record each for the Minneapolis page and the FOSS Earth app, cold and warm,
before and after each step. Put the numbers in this document, as section 1's
measurements are. A step is done when its numbers are recorded and no other
number regressed.

## 3. Renderer advisor

The phone case that prompted this: Chrome on Android opened the tour from the
dev server at `http://192.168.0.103:5173`. That origin is not a secure
context, so `navigator.gpu` is absent and the app silently drew with WebGL.
The Renderer tab says so, but the log does not, so nobody noticed.

### Two defects to fix in code first

- **A fallback is saved as the preference.** `createWebGlSelection` in
  `renderer/src/babylon/createRendererMode.ts` calls
  `persistWorkingRenderer`, so one failed WebGPU start stores `webgl2` under
  `foss-earth:renderer-preference`. From then on, automatic mode starts
  straight in WebGL on that origin and never tries WebGPU again. Save a
  fallback with its reason and time instead, and try WebGPU again when the
  reason no longer holds (for example, now a secure context with
  `navigator.gpu`) or after a few days. Test both paths.
- **The log says nothing.** Print the fallback, and any advice, into the game
  log when the renderer starts.

### Advice

A pure function in the renderer package, `adviseRenderer(facts): Advice[]`,
takes:

- the renderer selection: requested, mode, fallback reason, and whether it came
  from a saved preference;
- `isSecureContext`, and whether `navigator.gpu` is present;
- `navigator.userAgentData` (brands, platform, mobile), or the user agent;
- the WebGL `UNMASKED_RENDERER_WEBGL` string;
- the WebGPU adapter's info;
- the hostname;
- any WebXR requirement.

Each advice has an `id`, a tone (`warning` or `info`), one sentence, and the
steps of its fix with a docs link. The app prints each once in the log, with
"How to fix" and "Don't show again" actions (dismissals saved per `id`), and
the Renderer tab lists them all.

| Id | When | Says | Fix |
| --- | --- | --- | --- |
| `insecure-origin` | Not a secure context, in a Chromium-based browser that ships WebGPU on this platform | WebGL is used because WebGPU needs HTTPS | The HTTPS address, or for a dev server: [WebGPU on a phone](../development.md#webgpu-on-a-phone) |
| `stale-preference` | Auto mode started WebGL from a saved fallback while `navigator.gpu` is present | WebGL is used from an earlier fallback | Retried automatically once the code fix above lands; until then, Renderer → WebGPU |
| `software-gl` | The WebGL renderer string matches SwiftShader, llvmpipe, "Software" or "Basic Render Driver" | The browser draws without the GPU | Turn on the browser's graphics acceleration (in Chrome: Settings → System → "Use graphics acceleration when available") and relaunch |
| `adapter-blocked` | `navigator.gpu` is present but `requestAdapter()` gives null | This GPU is not on the browser's WebGPU list | Info only. Point to the browser's WebGPU status page (`chrome://gpu`), and don't recommend unsafe flags to visitors |
| `old-browser` | Safari or iOS before the version that ships WebGPU, or Firefox on a platform where it is not yet on by default | WebGPU arrives with an update | Update the browser or OS |
| (none) | A WebXR requirement chose WebGL (headset) | Nothing: WebGL is right there | — (test that no advice is given) |

Check the version thresholds against current browser release notes when this
is built. They change, and this table was written from memory in October 2026.

One risk to check first: since renderer 7c61ef0 (17 October 2026, the VR
headset work), automatic mode chooses WebGL on any device that answers
`navigator.xr.isSessionSupported("immersive-vr")` with true
(`immersiveVrRequirement` in `renderer/src/babylon/browserRenderer.ts`). It is
pushed but not deployed yet. Find what Android Chrome on an ordinary phone
answers before the next deploy, because phones answering true would lose
WebGPU. If they do, ask for WebGL only when a session is about to start, or
only on a headset's browser.

## Order of work

1. Measure the baseline (section 2, Acceptance).
2. Renderer: stop saving a fallback as the preference, and print the fallback
   in the log. Small, and fixes a real trap.
3. Boot terminal, provenance moved out of the HTML, and selector-page
   speculation rules.
4. One shader chunk (S4), and the unused Babylon modules out of the startup
   graph (start of S1).
5. `defineLazyFeature`, the chunk-map plugin and the idle queue. Move the
   pose editor, the closed panels and the Dev tab's views onto it (S2).
6. The empty scene first: the boot chunk split.
7. The renderer advisor's rules and the log entries.
