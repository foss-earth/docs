# Startup: instant feedback, a boot terminal, code on demand

Status: proposal, 17 October 2026, being built in its order of work (steps 1
to 5 and 7 are built, step 6 is begun). Nothing below is built yet unless it says so. It covers four
requests that share one goal, a FOSS Earth page that
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
| Prefetch while idle | `warmPages()` from `@foss-earth/ui/vite`, on the tour's selector page | Built 17 October 2026 (section 2, The click). Until then there was no `requestIdleCallback`, `modulepreload` injection or speculation rules anywhere |
| App files kept on the device | `appFiles()` Vite plugin and `foss-earth-sw.js` | Built; repeat visits read the app from the device |
| Loading screen | `bootTerminal()` from `@foss-earth/ui/vite` | Built 17 October 2026 (section 2, The boot terminal). Until then a campus page was an empty `<div id="root">` until the whole bundle had run |
| Failure and stall screen | `browserRecovery()` from `@foss-earth/ui/vite`, inline at the start of `<body>` after the boot terminal (in `<head>` until 17 October 2026), 45 s stall limit | Built; its offers show inside the boot terminal while it is there |
| Log with progress bars | `createGameLog` in `@foss-earth/ui` (`progress: number \| null` per line), map and scene loading lines | Built |
| Renderer diagnostics | Renderer tab: secure context, `navigator.gpu`, `IsSupportedAsync`, fallback error | Built. Until 17 October 2026 only in the tab: nothing in the log said WebGL was a fallback (now `describeRendererStart`, section 3) |
| Startup items in the optimization backlog (`docs/optimization-backlog.md`, Loading, network and startup) | S1 (import only the Babylon modules used), S2 (lazy panels), S3 (compile shaders during loading), S4 (fetch only one shader chunk) | S1 and S4 built 17 October 2026 (Startup measurements); S2 and S3 open |

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

Rebuilt on 17 October 2026 and checked again (brotli at quality 11, entry
script counted with the preloads), the figures hold:

| Page | HTML (brotli) | Inline recovery | Inline provenance | Modules before app code | `scenes-*` / `index-*` | GLSL / WGSL (brotli) |
| --- | --- | --- | --- | --- | --- | --- |
| `/tour/minneapolis/` | 70.7 KB (14.6 KB) | 37.5 KB | 25.9 KB | 71: 7.48 MiB raw, 1.43 MiB brotli | 5.20 MiB, 1.04 MiB brotli | 100.5 KB / 98.7 KB |
| FOSS Earth app (`/app/`) | 68.5 KB (14.1 KB) | 37.5 KB | 24.1 KB | 69: 7.48 MiB raw, 1.43 MiB brotli | 5.20 MiB, 1.04 MiB brotli | 100.5 KB / 98.7 KB |

The audio (`spatialWebAudio*`, `abstractSound*`), flow graph (10
`flowGraph*` chunks) and `dds-*` modules are still preloaded by both pages.
Both pages' HTML is just over the 14 KB of a first round trip when
compressed, with nothing paintable in it.

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

**Built 17 October 2026** (app `2a7f04a`, ui `6d8ae31`, the tour
`593b3ecad`), with these changes from the proposal:

- The map is not a virtual module but a JSON
  `<script id="foss-earth-lazy-features">` in each built page, like the shader
  chunks' map: `lazyFeatures()` in `foss-earth/vite` finds the
  `defineLazyFeature({ id: "…", …, load: () => import("…") })` calls as it
  transforms the code, resolves each import, and in `transformIndexHtml` walks
  the bundle from the page's entry. Each page lists the features it can load,
  with only the chunks it does not already load, and their size. So `id` and
  `load` must be literals at the call.
- A feature names the tabs it belongs to (`tabs: ["controls"]`), and intent
  is the pointer or focus reaching an element with that `data-tab-id`: the
  overlay's tab buttons and the + menu's items carry it. An `idle` feature is
  fetched on intent too.
- The queue adds one `modulepreload` at a time, intent ahead of idle, idle
  ones in `requestIdleCallback` (5 s timeout). It starts at `boot:settled`,
  waits while the page is hidden, and does nothing under `saveData` or 2G.
- On a `?dev=1` page the game log says "Loaded the pose editor (33 KB)".

On it so far:

- The controller bindings editor (`@felipegalind0/gamepad-tools/ui`, 16 KB),
  `intent` on the Controls tab. It was mounted at startup; it now mounts the
  first time that tab is shown.
- The pose editor (32 KB, 2 files), `idle` and `devOnly`.
- The scene thumbnails (2 KB), `intent` on the Scenes tab.

Left out, and why: the panorama viewer and its tabs are created at startup
because restoring a saved scene needs them; the bug report and date and time
panels hand their elements to the overlay as it starts, and would save about
3 to 4 KiB brotli each; the Dev tab's views already mount only while it is
open. The startup JavaScript went from 698.1 to 695.1 KiB brotli on the app
and from 700.7 to 697.5 KiB on the tour. 0sfs builds its own page around the
flight and names no features yet, so it needs no plugin.

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

Built 17 October 2026. Owner: `@foss-earth/ui/vite`, as a `bootTerminal()`
plugin beside `browserRecovery()`, so that every FOSS Earth app gets it. Its
runtime is `ui/src/browser/bootTerminal.ts`, and an app's side is the helpers
in `bootSteps.ts`, which do nothing on a page without the terminal. The FOSS
Earth app, the tour's campus pages and 0sfs (`/`, `/fly/` and `/rc/`) use it.

- **Markup and style first.** Right after `<meta charset>` come the
  terminal's `<style>` (3.8 KB, or 2.6 KB for a page that is always dark) and
  a one-line script that marks `boot:html` and applies the theme the visitor
  chose (`foss-earth.theme`, else the settings' `interface.theme`, else the
  device's). The terminal's markup is the first thing in `<body>`: a title,
  the lines as an `<ol role="log">`, and a bar with `role="progressbar"` and
  `aria-valuenow`. It uses `ui-monospace`, no web font, and follows
  `data-ui-theme` (Earth or UMN) and `prefers-color-scheme`, with no
  transition under `prefers-reduced-motion`.
- **Nothing ahead of it.** The page's stylesheets move from `<head>` to the
  end of `<body>`, so they no longer hold back the first paint. Modules still
  wait for them, so the app never shows unstyled. The recovery script (38 KB)
  moves from `<head>` to just after the terminal. On all three apps the HTML
  up to the end of the terminal's markup is about 3 KB compressed, well inside
  the first round trip.
- **Knows what it waits for.** At build time the plugin writes the files the
  page waits for before its first module runs into the runtime's call: the
  entry, its static imports and their styles, and the lazy chunks named by
  `waitFor` (0sfs's flight), each with its gzip size. A buffered
  `PerformanceObserver` for `resource` entries matches them. Bytes count when
  they came over the network (`transferSize` above 0). Otherwise the line
  counts files ("Loading the app from this device: 12 of 70 files").
- **Stages after the download.** The app reports
  `bootStep(id, text, fraction?)`: "Starting the app" (0sfs: "Starting the
  flight") when its modules run, "Starting the renderer", then "Started
  WebGPU" (or WebGL 2, WebGL), and "Preparing the 3D scene". Compiling shaders
  (n of m) comes with backlog S3.
- **An honest estimate.** The bar weighs download and startup by the times
  this device took on its last start of this page (`localStorage` key
  `foss-earth.boot <path>`, in try/catch; 3 s and 1.5 s until there is one),
  and never goes back. It shows "about N s left" only once 64 KB have
  arrived over at least 400 ms on this visit. The download's line is
  rewritten at most every 500 ms, so a screen reader is not flooded.
- **Handover.** At `boot:first-frame` (in `browserRuntime`, so the app, the
  tour and 0sfs alike) the terminal fades out over 150 ms and is removed. The
  game log takes the terminal's lines into its history as soon as the log
  exists (`attachBootLog`), and every later line too, so the record runs on
  without a gap. A page that draws no scene (0sfs's `/rc/`) hands over when
  the app says it is ready.
- **Failure.** A module that cannot download ends the start with an error
  line. A failure the app reports (`reportBrowserAppFailure`) does the same,
  unless the app's log is already on the page: then the terminal goes, and the
  log shows the failure with its actions. The recovery's stall and failure
  offers show inside the terminal while it is there, and stay after it goes.
  On 0sfs's `/rc/` the terminal stays hidden unless the start fails, so the
  controller keeps its black screen.

Changed from the proposal:

- The lines are a `role="log"` with `aria-relevant="additions"`, not a
  `role="status"`: a status is read out whole on every change, a log only its
  new lines.
- The build provenance (24 to 38 KB) stays in the HTML, moved to the end of
  `<body>`, rather than into a `built-from.json` that the About tab fetches.
  The About tab and the diagnostics report read it at once when the app
  starts, and it cannot describe a different build from the page's. At the end
  of the body it holds back nothing that paints.

### The click

Built 17 October 2026 for the tour's selector page. `warmPages({ from, pages })`
from `@foss-earth/ui/vite` writes speculation rules for the campus pages
(`prefetch`, `eagerness: "moderate"`), so a hovered or pressed card fetches
its page's HTML. Once the selector has loaded and is idle, it fetches the
files the campus pages wait for into the HTTP cache with
`<link rel="prefetch">`: largest first, four at a time, only while the page
is visible, and not under Save-Data or on a 2G connection. A card shows
pressed on `:active` (with a passive `touchstart` listener, which iOS Safari
needs for `:active`).

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
`boot:renderer`, `boot:first-frame`, `boot:globe`, `boot:content` and
`boot:settled` (`app/src/app/bootMarks.ts`). `boot:globe` is the first frame
that draws the globe's ground. `boot:content` is the first that draws what the
page is for: a tour's scene on the globe, 0sfs's aircraft, or for the app
alone the opening view with no tile missing. Record:

- the first paint of the terminal after navigation;
- the first 3D frame, the globe and the content;
- the bytes fetched before the first 3D frame;
- the time to settled.

Record each for the Minneapolis page, the FOSS Earth app and 0sfs's `/fly/`
(which never settles: a flight keeps drawing), cold and warm, before and after
each step. Put the numbers in this document, as section 1's
measurements are. A step is done when its numbers are recorded and no other
number regressed.

### Startup measurements

**How.** The script is `build/startup-baseline/measure.mjs` in the tour
checkout (gitignored, so it is copied here in outline):

- Chrome 155, headless, with WebGPU on Metal.
- Fast 4G is the DevTools preset: 165 ms latency, 1,012,500 B/s down,
  168,750 B/s up. It is applied to the page and to the service worker.
- The 4× CPU slowdown is applied to the page.
- Chrome refuses both throttles in dedicated workers ("Not supported"). Their
  requests still wait the page's latency, but tile decoding in workers runs at
  full speed, so phones will be slower there.
- A cold visit starts from a new, empty profile. The warm visit opens the page
  again in the same profile, through the service worker it installed.
- The builds are served by a local server that answers like GitHub Pages:
  gzip, `Cache-Control: max-age=600` and ETags. Tiles come from the real tile
  servers.
- The local server speaks HTTP/1.1, so Chrome fetches at most six files at a
  time from it. GitHub Pages speaks HTTP/2, which fetches them all over one
  connection, so a cold start of a page with about 70 scripts is faster there
  than these numbers.
- "Bytes" is what the network carried, compressed, for requests that finished
  before the mark.
- Settled is `boot:settled`: the moment frames stopped, once they stay stopped
  for a second after the first frame. It depends on the tile servers.
- The local server has no tour media: `public/` is not in `dist/`, and its
  ~400 requests answer 404. So the tour's settled time misses that media.
- Since ui `4b125b0` (18 October 2026) a built page's first visit registers
  the service worker that makes it cross-origin isolated, waits up to 4 s for
  it, and reloads once (`ui/src/browser/isolation.ts`). Since 19 October 2026
  the script times a page that reloads from its first navigation: the HTML,
  the terminal and the first paint from the first load, the other marks from
  the last, and the bytes over both.

All numbers are medians of 3 runs, in seconds from navigation. The runs
agreed within 2%, except warm settled, which varied by up to 50%.

**Baseline, 17 October 2026.** Measured at commits app `a802d92`, ui
`79f9ea5`, renderer `a6b85b0`. Both pages started on WebGPU.

| Page | Visit | `boot:html` | Terminal paint | First contentful paint | `boot:modules` | `boot:renderer` | First 3D frame | Bytes before first frame | Settled | Bytes until settled |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/tour/minneapolis/` | cold | 0.18 | — | 4.11 | 4.02 | 4.49 | **5.54** | **1.94 MiB** (74 scripts, 1 CSS, the HTML) | 47.4 | 41.5 MiB |
| `/tour/minneapolis/` | warm | 0.02 | — | 0.40 | 0.32 | 0.78 | 1.43 | 276 B | 6.2 | 2.7 MiB |
| FOSS Earth app `/app/` | cold | 0.18 | — | 3.07 | 2.99 | 3.46 | **4.50** | **1.94 MiB** (72 scripts, 1 CSS, the HTML) | 61.0 | 55.4 MiB |
| FOSS Earth app `/app/` | warm | 0.02 | — | 0.39 | 0.31 | 0.78 | 1.43 | 276 B | 16.4 | 0.3 MiB |

What this shows:

- On a cold visit the HTML has arrived and begun to run by 0.18 s, then the
  screen stays blank for about 3 s (app) to 4 s (tour). That is the time the
  modules take to load and run.
- Apart from the HTML and one stylesheet, everything fetched before the first
  frame is script. No tile and no scene data is fetched before it.
- From the modules running to the first frame takes 1.0 to 1.5 s, cold or
  warm: the renderer starts, then the first frame is drawn.
- A warm visit takes nothing from the network before its first frame.
- There is no terminal yet ("—"). `boot:terminal` comes with the boot
  terminal.

**After step 3 (the boot terminal), 17 October 2026.** Before is app
`19852ba` (which added `boot:globe` and `boot:content`), ui `79f9ea5`,
renderer `a6b85b0`, 0sfs `9e25a9e`. After is ui `44717f9`, app `e12a91d`, the
tour `eca262ffd`, 0sfs `7a383d1`, with the provenance at the end of the body
(about `882926b`). All pages started on WebGPU. Each cell is before → after.

| Page | Visit | First paint | Terminal paint | Modules run | First 3D frame | Globe | Content | Bytes before first frame | Settled |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/tour/minneapolis/` | cold | 4.14 → **0.23** | — → **0.23** | 4.05 → 4.03 | 5.57 → 5.58 | 7.19 → 7.24 | 7.19 → 7.24 | 1.94 → 1.95 MiB | 48.2 → 47.8 |
| `/tour/minneapolis/` | warm | 0.41 → **0.06** | — → **0.06** | 0.33 → 0.34 | 1.46 → 1.45 | 2.95 → 3.21 | 2.95 → 3.21 | 276 B → 276 B | 8.0 → 8.3 |
| FOSS Earth app `/app/` | cold | 3.08 → **0.22** | — → **0.22** | 2.99 → 2.99 | 4.51 → 4.56 | 6.19 → 6.25 | 60.5 → 60.6 | 1.94 → 1.95 MiB | 60.8 → 60.9 |
| FOSS Earth app `/app/` | warm | 0.39 → **0.07** | — → **0.07** | 0.30 → 0.31 | 1.42 → 1.45 | 2.72 → 2.97 | 5.29 → 5.54 | 276 B → 276 B | 19.4 → 18.4 |
| 0sfs `/fly/` | cold | 0.42 → **0.24** | — → **0.24** | 3.71 → 3.71 | 5.18 → 5.19 | 7.31 → 7.36 | 24.5 → 25.0 | 2.91 → 2.92 MiB | — |
| 0sfs `/fly/` | warm | 0.06 → 0.06 | — → **0.06** | 0.33 → 0.35 | 1.68 → 1.71 | 3.13 → 3.20 | 3.54 → 3.59 | 0 B → 0 B | — |

What this shows:

- The screen is no longer blank: the terminal paints at 0.22 to 0.24 s cold
  and 0.06 to 0.07 s warm, where the tour showed nothing until 4.1 s and the
  app until 3.1 s. 0sfs painted its static log at 0.42 s; the terminal that
  replaces it paints at 0.24 s, because the stylesheet and the recovery script
  no longer come before it.
- The terminal costs about 5.5 KB before the first frame (its style, markup
  and runtime, inline in the HTML), and nothing measurable after it: the
  modules, the first frame, the globe and the content moved by no more than
  the runs vary, except the warm globe.
- The warm globe came 0.25 s later on the tour and the app. It is not the
  terminal: two builds of the app from the same tree, with and without it,
  opened in turn on the same machine (five warm visits each), drew the globe
  at 2.87 and 2.90 s. The after builds held other work in the app's and the
  engine's checkouts, not yet committed, that changes the terrain decoding
  workers.
- The app's content comes about a minute after its globe on a cold visit:
  with no tile missing from the opening view means every tile of it, down to
  the finest, has arrived over Fast 4G.

**Step 4 (S1 and S4) and the first of step 6, 17 October 2026.** Bytes are
from the built pages, brotli at quality 11. "Startup" is the entry script
plus its preloads, the JavaScript that has to arrive before the app's code
runs. "Shader JS" is what a renderer fetches for its language: before S4
both chunks loaded at startup, after it one does, preloaded once the
renderer knows its language.

| Build | Commits | App `/app/` startup | Tour `/tour/minneapolis/` startup | Shader JS (WGSL / GLSL) |
| --- | --- | --- | --- | --- |
| Before S1 | app `e12a91d` | 69 files, 1461.6 KiB | 71 files, 1462.3 KiB | 194.6 / 194.6 KiB, both at startup |
| S1: only the Babylon modules used (`babylonBarrels()`) | renderer `dfbfb8d`, app `b062e0e` | 42 files, 912.6 KiB | 52 files, 921.2 KiB | 108.4 / 108.4 KiB, both at startup |
| S4: one shader chunk per language | renderer `721f4fa`, `4f061bf` | 42 files, 817.6 KiB | 52 files, 826.2 KiB | 61.9 / 59.7 KiB, one language |
| React and the tab overlay after the globe starts | app `d0c1211` | 50 files, 752.2 KiB | 52 files, 754.6 KiB | 61.9 / 59.7 KiB |
| PBR materials told by class name, not `instanceof` | engine `5d0356f`, app `0a48abd` | 45 files, 716.6 KiB (755.0 KiB rebuilt just before) | measured with the next row | 61.9 / 59.7 KiB |
| Babylon's builders called by name, not through `MeshBuilder` | engine `64c31ed`, renderer `2da3af9`, app `bf2e4a0` | 45 files, 698.1 KiB | 47 files, 700.7 KiB | 61.9 / 59.7 KiB |
| Step 5: the controller bindings editor on demand | app `2a7f04a`, ui `6d8ae31`, the tour `593b3ecad` | 695.1 KiB | 697.5 KiB | 61.9 / 59.7 KiB |

So the JavaScript before the first frame is under half what it was (1.43
MiB to 0.68 MiB on both pages), which meets section 2's first goal. 0sfs's
flight, which loads its globe in a lazy chunk, went from 82 files and
2.12 MiB to 64 files and 1.43 MiB with S1 (0sfs `dbfa84e`), and fetches
63.4 KiB (WGSL) or 60.6 KiB (GLSL) of shaders instead of 195.2 KiB. Its
aircraft, exhaust and ground contact packages calling the builders by name
took another 15.0 KiB brotli (60.3 KiB raw) off the flight's chunks
(exhaust `194d7fb`, aircraft `6630dff`, ground-contact `9e10d9c`); the
flight keeps the PBR materials, which its glTF aircraft use.

- **S4.** `babylonShaderChunks()` now makes four groups: the shader store
  alone (the code that compiles shaders imports it), the shaders that code
  imports statically (such as the WebGPU clear quad) which load with Babylon,
  and one lazy chunk per language. The page names the language chunks in a
  JSON `<script id="babylon-shader-chunks">`, and the renderer adds a
  `modulepreload` for its language as soon as it knows it (WGSL after
  `IsSupportedAsync`, GLSL when it creates a WebGL engine). Babylon's WebGPU
  engine fetches glslang and twgsl only when it must translate GLSL, which
  the globe never asks, so they cost nothing at startup.
- **The WebGPU presentation probe, skipped once it has passed** (renderer
  `70c13ac`). Every WebGPU start drew three frames on an offscreen canvas and
  waited four more and 75 ms for a presentation error, about 0.42 s before
  the first frame, so that a broken WebGPU could still fall back to WebGL on
  the page's canvas. A pass is now remembered per browser
  (`foss-earth:renderer-webgpu-verified`: the options, the user agent, the
  time) for 30 days. A start with the same options and browser skips the
  probe and watches the page canvas's first frames instead; a presentation
  error there forgets the record and reloads, so the next start probes again
  and can fall back. Auto-detect in the Renderer tab forgets it too. The first
  visit, and the first after a browser update, still pay the probe.
- **No presentation probe in automatic mode** (renderer `3cca1fd`, 18
  October 2026). Automatic mode now starts WebGPU on the page's canvas on
  every visit, the first included, and watches its first frames for the
  probe's errors. Before the first frame it saves the options it starts
  with; a presentation error saves what the next start tries and reloads:
  first the safe options (no antialiasing, no device pixels), then WebGL. So
  the rare device whose WebGPU cannot present reloads once or twice on its
  first visit, and then starts as saved for 30 days, or for three days on
  WebGL, before it tries the defaults again. A start whose saved options do
  not read back (no storage), a host without `reload`, a chosen WebGPU and a
  retry after a WebGL fallback still probe. The page's first inline script
  also asks for the WebGPU adapter (`window.__fossEarthWebGpuSupport`), so
  it comes while the modules load instead of when the renderer starts: the
  first adapter of a fresh headless Chrome profile took 36–83 ms.
- **The default atmosphere's tables, precomputed** (sky `d319dd5`, 18
  October 2026). The tables of light scattered more than once and of the
  sky's light on level ground were most of what `createAtmosphere` spent
  before the first frame. The build now ships them for the settings'
  default atmosphere (`src/precomputedAtmosphereTables.ts`, 9 KB more
  JavaScript, made by `npm run generate:atmosphere-tables`), so that
  building it computes only the transmittance: about 115 ms to 26 ms
  without slowdown. Other parameters still build them. A test fails when
  the kept tables are no longer, bit for bit, what the code builds. A
  WebAssembly build of the same loops gave identical tables and was no
  faster, so the work is not done at all rather than done in WebAssembly.
- **React and the tab overlay** (app `d0c1211`) are imported with `import()`
  when `mountGlobeApp` starts, and awaited after `createGlobeApp`, so they
  download while the globe starts instead of before it: 66 KiB off the
  startup JavaScript. `scripts/check-startup-chunks.mjs` fails the build if
  either is imported statically again.
- **PBR materials** (38.4 KiB brotli, 5 files). The terrain light plugin
  asked `instanceof PBRMaterial`, which kept Babylon's PBR materials in the
  startup graph though only glTF models (3D Tiles, loaded later) use them.
  It now walks the material's prototypes and compares each class's own
  `getClassName()`, so it needs no import.
- **MeshBuilder** (18.4 KiB brotli, 76 KiB raw). Calling
  `MeshBuilder.CreateSphere` keeps all 23 builders, since the object refers
  to each. The globe, the compass, the headset tour and the vector debug
  drawing now import `CreateSphere`, `CreatePlane`, `CreateLines`,
  `CreateDisc`, `CreateCylinder` and `CreateTube`, which `@babylonjs/core`
  exports with the same signatures. The rest is left to the panorama
  viewer, a lazy chunk. `check-startup-chunks.mjs` fails the build if
  either returns to the startup graph.

Timings for these steps are only indicative so far: one run of
`measure.mjs` on 18 October 2026, as above, on a machine that other work
was using (load average about 1.8), not an exclusive run of three. The
builds were renderer `3cca1fd`, sky `d319dd5`, with the WebAssembly work
then in the app's, the engine's and the sky's checkouts, since committed.
Each cell is after step 3 → now, so it covers steps 4 and 5 as well as
step 6 so far.

| Page | Visit | First paint | Modules run | Renderer | First 3D frame | Globe | Content | Bytes before first frame |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/tour/minneapolis/` | cold | 0.23 → 0.29 | 4.03 → **2.57** | — → 2.81 | 5.58 → **4.72** | 7.24 → 6.85 | 7.24 → 6.85 | 1.95 → **1.23 MiB** |
| `/tour/minneapolis/` | warm | 0.06 → 0.11 | 0.34 → 0.21 | — → 0.43 | 1.45 → 1.34 | 3.21 → 3.10 | 3.21 → 3.11 | 276 B → 276 B |
| FOSS Earth app `/app/` | cold | 0.22 → 0.25 | 2.99 → **2.02** | — → 2.26 | 4.56 → **4.05** | 6.25 → 6.24 | 60.6 → 60.4 | 1.95 → **1.23 MiB** |
| FOSS Earth app `/app/` | warm | 0.07 → 0.08 | 0.31 → 0.33 | — → 0.57 | 1.45 → 1.50 | 2.97 → 4.12 | 5.54 → 9.23 | 276 B → 276 B |
| 0sfs `/fly/` | cold | 0.24 → 0.25 | 3.71 → **3.16** | — → 3.26 | 5.19 → **4.58** | 7.36 → 8.16 | 25.0 → 23.8 | 2.92 → **1.55 MiB** |
| 0sfs `/fly/` | warm | 0.06 → 0.08 | 0.35 → 0.50 | — → 0.78 | 1.71 → 1.98 | 3.20 → 4.92 | 3.59 → 5.48 | 0 B → 0 B |

- On a cold visit the modules run 0.5 to 1.5 s sooner and the first frame
  comes 0.5 to 0.9 s sooner: 0.7 MiB less to fetch (steps 4 to 6) on the
  tour and the app, 1.4 MiB less on the flight, and no probe.
- Warm visits fetch nothing before their first frame, and it moved by no
  more than one run on a busy machine varies.
- The warm globe came 1.1 to 1.7 s later on the app and the flight, and
  not on the tour. The profile above finds the time in the engine's
  terrain and imagery work, which the WebAssembly work changed in those
  builds, not in the renderer or the atmosphere; an exclusive A/B run
  would tell.

**Where the time goes after the modules run.** A CPU profile of a warm
`/tour/minneapolis/` visit at 4× slowdown, with source maps, on WebGPU with
the probe skipped: `boot:renderer` at 0.22 s, the first frame at 0.96 s, the
globe at 2.47 s.

- Renderer to first frame (0.74 s): the atmosphere's tables
  (`sky/src/atmosphere.ts`) take 233 ms on the main thread, the terrain mesh
  59 ms, Babylon's WebGPU buffers 55 ms, garbage collection 35 ms. The
  atmosphere is already in the WebAssembly work's scope (native atmosphere
  tables in workers, `implementation/webassembly-ab-handoff.md`), and
  `createAtmosphereFromTables` would also let a build ship them precomputed.
  That is the largest single cost left before the first frame.
- First frame to globe (1.51 s): the scenes panel (`scenes/src/panel.ts`)
  85 ms, terrain image decoding on the main thread 61 ms, imagery geometry
  55 ms, the settings panel's sections, controls and number formatting about
  90 ms, the game log 25 ms. The panels are step 5's targets.

Two of those are fixed (scenes `713ae9a`, app `3d90acd`, ui `1ccb7a2`).
The scenes panel starts off screen (`shown: false`): it restores its saved
scope and selection at once, but builds its cards only when the Scenes tab
opens (`setShown`, from the overlay's `onTabVisibility`). The settings
panel's `formatNumber` made an `Intl.NumberFormat` for every value it
printed; it now keeps one. Profiled the same way afterwards, the globe came
at 2.38 s instead of 2.47 s, the first frame 0.69 s after the renderer, of
which the atmosphere's tables take 208 ms. What is left between the first
frame and the globe is the engine's terrain and imagery work, spread across
many functions (terrain image decoding 62 ms, imagery geometry 50 ms, the
imagery selector 44 ms), and no single panel.

With no probe and the atmosphere's tables precomputed (18 October 2026), a
warm `/app/` visit profiled the same way had `boot:renderer` at 0.41 s, the
first frame at 1.44 s and the globe at 4.06 s. The build held the
WebAssembly work then in the app's, the engine's and the sky's checkouts,
since committed (app `e398745`, engine `b6fc621`, sky `0af6bda`).

- Renderer to first frame (1.03 s, 1.03 s sampled): Babylon's WebGPU
  buffers (`setRawData`, `createIndexBuffer`, `setVerticesData`) about
  160 ms, the terrain mesh (`createTerrainMesh`, `terrainSurface`,
  `meshPositions`) about 140 ms, the atmosphere 136 ms, of which building
  the transmittance (`buildAtmosphere` and the optical depths of `logMean`)
  is 84 ms, and garbage collection 45 ms. No single cost is left as large as the
  atmosphere's tables were.
- First frame to globe (2.62 s, 2.62 s sampled): the main thread is busy
  the whole time, with the engine's terrain and imagery work spread over
  many functions: terrain image decoding 115 ms, `applyWorldViewport` 77 ms
  (it reads the canvas's `clientWidth` and `clientHeight` every frame),
  edge stitching 45 ms, the imagery selector 42 ms, imagery geometry 38 ms.

**The Google 3D Tiles code before the first frame.** On a cold `/app/`
visit (the indicative run above), the renderer is ready at 2.26 s and the
page then downloads `3d-tiles-renderer`'s Babylon adapter and the glTF
loader it brings (`index.babylonjs`, `pbrMaterial`, Babylon's audio and
flow-graph chunks, `LoaderBase`, `workerPool`: 22 files from 2.28 to
2.99 s), then its plugins (`index.core-plugins`, to 3.18 s), before the
globe starts: `app/src/app/browserRuntime.ts` awaits
`loadBrowserGlobeGoogleProviders()` there, with or without a Google key.
The first terrain tile is requested at 3.83 s.

Done 19 October 2026: the app awaits that code before the globe only where
the globe starts on Google (a key in the page's options or saved, and Google
preferred), and otherwise loads it when Google is first chosen. The engine's
Google ports take an optional `ready()`, and `createGlobeRuntime` waits for it
when a key arrives while the page runs, keeping the map it shows; a later map
choice or a cleared key drops the wait, and code that fails to load falls back
to the plain globe with a message. An A/B of `/app/` with and without the
app's change, both built from the same checkouts the same day, two runs each,
indicative (other work was using the machine):

| Visit | | Modules run | Renderer | First 3D frame | Globe | Bytes before first frame |
| --- | --- | --- | --- | --- | --- | --- |
| cold | before → after | 2.32 → 2.32 | 2.47 → 2.45 | 3.90 → **2.74** | 5.78 → **4.57** | 1.26 → **1.09 MiB** |
| warm | before → after | 0.19 → 0.18 | 0.32 → 0.31 | 0.64 → 0.60 | 2.17 → 2.11 | 0 → 0 |

The runs of each agreed within 0.05 s. A cold first frame now comes 0.3 s
after the renderer instead of 1.4 s. A warm visit had the code in its cache
already, so it gains little.

**Waterfalls removed, 19 October 2026.**

- Where the globe does start on Google, the engine imports the 3D Tiles
  renderer and its plugins at once, not one after the other, which saves a
  round trip (engine `468a42f`, `loadBrowserGlobeGoogleProviders`).
- `/fly/` imports the flight lazily (`src/main.tsx`), so its 1.2 MB of
  compressed code used to be requested only once the entry had run. The boot
  terminal now lists a page's `waitFor` modules that Vite does not already
  preload, largest first. Its runtime adds a `modulepreload` for each, and a
  style `preload` for their styles, as soon as the page starts. It skips this on
  a page about to reload for isolation, because the reload would drop the
  downloads halfway. `/rc/`, a copy of the same page, leaves them out
  (fly's `scripts/pages-html.mjs`). The cold runs to compare are those in
  which the reload made the page fetch `shell` again:

  | Flight preload | Flight chunk requested | Modules run | First 3D frame |
  | --- | --- | --- | --- |
  | without | 1.06 s | 3.37 s | 3.70 s |
  | with | 0.62 s | 3.24 s | 3.59 s |

  A warm visit is unchanged (first frame 0.70 → 0.68 s). Over HTTP/1.1 the
  70-odd files queue for six connections, so the local server shows less of
  the gain than GitHub Pages' HTTP/2 should.

Tried and dropped:

- A head script that preloads Babylon's shader chunk as soon as the WebGPU
  adapter answers, instead of once the renderer's modules have run. On a
  cold `/app/` visit the WGSL chunk came at 0.2 s instead of 2.45 s, but the
  first frame did not move: 2.77 → 2.83 s on `/app/` and 3.58 → 3.59 s on
  `/fly/` (3 runs each). The renderer's own 0.3 s of work before its first
  frame already hid the fetch. The extra request in the page's first load
  also put the isolation reload 0.08 s later.
- V8's explicit compile hints (`//# allFunctionsCalledOnLoad`) on the entry
  and on its startup chunks. They made no difference to when the modules ran
  or to the first frame.

**Where the three pages are now (19 October 2026).** These runs are
indicative: two runs each (three for `/fly/`), with other work on the
machine. The builds are what is deployed: the app at app `bae8b3b` with
engine `468a42f`, and fly with the flight preload. Each arrow goes from the
baseline to now, in seconds: first frames from 17 October (`/fly/`: 18
October), globes from 18 October.

| Page | Visit | Modules run | First 3D frame | Globe | Bytes before first frame |
| --- | --- | --- | --- | --- | --- |
| `/tour/minneapolis/` | cold | 2.88 | 5.54 → **3.25** | 7.24 → **5.03** | 1.02 MiB |
| `/tour/minneapolis/` | warm | 0.13 | 1.43 → **0.54** | 3.21 → **1.57** | 0 |
| `/app/` | cold | 2.32 | 4.50 → **2.77** | 6.25 → **4.70** | 1.09 MiB |
| `/app/` | warm | 0.18 | 1.43 → **0.60** | 2.97 → **1.59** | 0 |
| `/fly/` | cold | 3.24 | 5.19 → **3.58** | 7.36 → **5.44** | 1.52 MiB |
| `/fly/` | warm | 0.28 | 1.71 → **0.67** | 3.20 → **1.62** | 0 |

The terminal shows at 0.22 to 0.24 s on a cold visit and 0.06 to 0.07 s on
a warm one. On a cold visit, the largest cost left was the isolation reload,
covered next. What each page costs once it runs (frames, CPU and memory) is in
the [Performance audit](../performance-audit.md).

**The isolation reload, 19 October 2026.** A built page's first visit
registers the service worker that makes it cross-origin isolated, which
gives the WebAssembly threads their shared memory, then reloads once
(`ui/src/browser/isolation.ts`). Locally, the reload came at about 1.9 s on
`/app/`, because over HTTP/1.1 the worker's script queues behind the page's
module preloads. GitHub Pages serves over HTTP/2, where that queue does not
form.

Cold visits of the published pages (Fast 4G, 4× CPU slowdown) show what the
reload costs there:

| Page | HTML | Worker script | Reload | Reloaded HTML | Then |
| --- | --- | --- | --- | --- | --- |
| `/app/` | 0–0.36 s | 0.36–0.53 s | 0.58 s | 0.58–0.76 s, a 304 | the entry (569 KB), half loaded, starts again at 0.77 s |
| `/fly/` | 0–0.39 s | 0.38–0.56 s | 0.61 s | 0.61–0.78 s, a 304 | `shell` (224 KB), half loaded, starts again at 0.79 s |

The reload costs three things:

- the wait for the worker;
- a round trip to revalidate the HTML;
- the downloads it drops.

Two changes, both in ui `d6098d8`:

- **Reloading.**
  - The page now reloads on the worker's `statechange` event, so
    `/fly/` reloads about 4 ms after its worker activates. It still polls
    every 50 ms, because an update found before the script ran sends no
    event.
  - It now reloads with `location.replace` of its own address, which is a new
    load. The worker answers it with the HTML the browser has just cached:
    0 bytes, in about 15 ms. `location.reload()` asked the site again,
    which took 180 to 190 ms locally. An address with a fragment still uses
    `reload()`, because replacing it would only scroll.
  - The replaced load counts as a navigation rather than a reload. The
    app's published-version check (`app/src/app/publishedVersion.ts`)
    reads only reloads, which this one is not: the visitor did not ask
    for it.
- **Registering ahead.** The build also emits `foss-earth-isolate.js`,
  which registers the app's worker from a page that links to it. The
  landing pages of foss-earth.github.io (`543e2a9`) and 0sfs.github.io
  (`d620502`) load it with `async`, so a visitor who goes on to the app
  starts isolated, with no reload. The script asks for nothing where the
  app's own script would not isolate:
  - report-only mode;
  - the setting turned off;
  - a browser that refused it before;
  - an insecure page;
  - a frame;
  - an already isolated page.

An A/B on the local server (medians of two runs each, indicative), with
app `a2d0b1c` and fly as deployed. "After" adds the change to the same builds.
"Direct" opens the app on an empty profile. "From the landing page" opens
`/` first and waits until the worker is active, as a visitor reading the
page would.

| Page | Visit | Reload at | First 3D frame | Globe | Reloads |
| --- | --- | --- | --- | --- | --- |
| `/app/` | direct | 1.95 → 1.82 s | 2.86 → **2.54** | 4.86 → **4.46** | 1 → 1 |
| `/fly/` | direct | 0.45 → 0.38 s | 3.68 → **3.50** | 5.70 → **5.46** | 1 → 1 |
| `/app/` | from the landing page | 1.93 s → none | 2.75 → **2.41** | 4.66 → **4.29** | 1 → **0** |
| `/fly/` | from the landing page | 0.42 s → none | 3.60 → **3.41** | 5.48 → **5.31** | 1 → **0** |

- **Worker timing.** From the landing page, the worker was active 0.42 to
  0.47 s after `/` opened. Before the change, `/` registered no worker.
- **Isolation.** Every visit, before and after, ended cross-origin isolated
  with `SharedArrayBuffer` defined, so the WebAssembly threads keep their
  shared memory.
- **Expected on GitHub Pages, not yet measured there.**
  - A direct first visit should gain about 0.2 s: the revalidation's round
    trip, and the reload following the worker sooner.
  - A visit from a landing page should gain about 0.4 s, because there is
    no reload.

## 3. Renderer advisor

The phone case that prompted this: Chrome on Android opened the tour from the
dev server at `http://192.168.0.103:5173`. That origin is not a secure
context, so `navigator.gpu` is absent and the app silently drew with WebGL.
The Renderer tab says so, but the log does not, so nobody noticed.

### Two defects, fixed first (built 17 October 2026)

- **A fallback was saved as the preference.** `createWebGlSelection` in
  `renderer/src/babylon/createRendererMode.ts` called
  `persistWorkingRenderer`, so one failed WebGPU start stored `webgl2` under
  `foss-earth:renderer-preference`, and automatic mode then started straight
  in WebGL on that origin and never tried WebGPU again. Now only WebGPU is
  saved as the preference. A failure is saved as a fallback
  (`foss-earth:renderer-fallback`): the WebGL mode, the reason, the time, and
  what it depended on (`isSecureContext`, `navigator.gpu`, the user agent).
  Automatic mode starts WebGL from it without waiting for WebGPU to fail again,
  and tries WebGPU again once the page is a secure context, `navigator.gpu`
  appears, the user agent changes, or three days pass
  (`staleFallbackReason`). A chosen WebGL is no longer saved either, and a
  `webgl2` or `webgl` preference saved by an earlier build is ignored and
  removed, so visitors already caught by the old trap get WebGPU back.
  Switching the Renderer tab back to Auto-detect forgets both.
- **The log said nothing.** `describeRendererStart` (renderer core) words one
  line for a start on WebGL, and `createGlobeApp` prints it in the game log,
  so the app and the tour show it, and 0sfs since step 7 (`b584ff7`), which
  starts its own app. It is a warning when WebGPU was
  wanted and did not start (an insecure page, a saved fallback with the date
  WebGPU is tried again, a failure with its reason), and information when
  WebGL is right (a chosen WebGL, a headset, a browser without WebGPU). The
  Renderer tab also shows a saved fallback's date and its retry date.

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
| `stale-preference` | Auto mode started WebGL from a saved fallback while `navigator.gpu` is present | WebGL is used from an earlier fallback | Retried automatically from the date the log gives; sooner: Renderer → WebGPU |
| `software-gl` | The WebGL renderer string matches SwiftShader, llvmpipe, "Software" or "Basic Render Driver" | The browser draws without the GPU | Turn on the browser's graphics acceleration (in Chrome: Settings → System → "Use graphics acceleration when available") and relaunch |
| `adapter-blocked` | `navigator.gpu` is present but `requestAdapter()` gives null | This GPU is not on the browser's WebGPU list | Info only. Point to the browser's WebGPU status page (`chrome://gpu`), and don't recommend unsafe flags to visitors |
| `old-browser` | Safari or iOS before the version that ships WebGPU, or Firefox on a platform where it is not yet on by default | WebGPU arrives with an update | Update the browser or OS |
| (none) | A WebXR requirement chose WebGL (headset) | Nothing: WebGL is right there | — (test that no advice is given) |

**Built 17 October 2026** (renderer `b782380`, app `e41a900`, 0sfs `b584ff7`).
`adviseRenderer` and `identifyBrowser` are in `renderer/src/rendererAdvice.ts`;
`reportRendererStart` (app, exported from `foss-earth/shell`) reads the facts,
prints the log lines and returns the advice for `createRendererPanel`'s
`advice`. The app, the tour and 0sfs's flight all call it. Changes from the
proposal:

- The GPU's name is Babylon's `engine.getInfo().renderer`: WebGL's unmasked
  renderer, or the WebGPU adapter's architecture. `software-gl` also matches
  `lavapipe`, `softpipe` and "Software Rasterizer". It is the one advice
  given whatever the renderer, a chosen WebGL included.
- Advice that explains the WebGL replaces the start line; `software-gl` is
  printed beside it. "How to fix" opens the line in place to show the steps,
  with "Open the guide" where the advice has one. "Don't show again" saves
  the id under `foss-earth:renderer-advice-dismissed`, for every later visit.
- `insecure-origin` is given for any browser that has WebGPU on its
  platform, not only Chromium, since every one hides `navigator.gpu` on an
  insecure page. On a private address or a `.local` name it points to
  [WebGPU on a phone](../development.md#webgpu-on-a-phone); elsewhere to the
  page's `https://` address.
- `adapter-blocked` is `navigator.gpu` present and `IsSupportedAsync` false;
  it names `chrome://gpu` or Firefox's `about:support`.
- `old-browser` uses these thresholds, checked on 17 October 2026 against
  the [gpuweb implementation status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)
  and the browsers' notes: Chrome 113 on Windows, macOS and ChromeOS, 121 on
  Android, some GPUs only on Linux (144 Intel Gen12 and newer, 147 NVIDIA
  under Wayland, so Linux gets no version advice); Safari 26 on macOS and iOS
  (every iOS browser is WebKit); Firefox 141 on Windows and 145 on macOS
  (Apple silicon on macOS 26). Firefox on Linux and Android has no WebGPU by
  default yet, and is told so. Chrome's reduced user agent always says
  Android 10, so Android before 12, where Chrome has no WebGPU, is not
  advised.

A headless run of a built tour showed it end to end: at `http://campus.local`
the warning, its steps and guide, and after "Don't show again" nothing on the
next visit; on SwiftShader, `software-gl` beside the start line.

### Phones and `immersive-vr` (checked 17 October 2026)

Since renderer 7c61ef0 (the VR headset work), automatic mode chooses WebGL on
any device that answers `navigator.xr.isSessionSupported("immersive-vr")`
with true (`immersiveVrRequirement` in
`renderer/src/babylon/browserRenderer.ts`). **Chrome on an ordinary Android
phone answers true.** Chromium registers a Google Cardboard VR runtime on
every Android build without looking at the device: `enable_cardboard`
defaults to on for Android on ARM and x86 (`device/vr/buildflags/buildflags.gni`),
`ChromeXrIntegrationClient` adds a `CardboardDeviceProvider` unless another
runtime is forced, and its `Initialize` adds the runtime unconditionally
(`components/webxr/android/cardboard_device_provider.cc`, read at the
148.0.7778.96 tag). So, on HTTPS, 7c61ef0 would have put every Android phone on
WebGL.

Fixed before any deploy: on Android, only a headset's browser counts. A
browser whose user agent names `OculusBrowser`, `PicoBrowser` or `Wolvic`, or
carries the `VR` token Meta and Samsung use, or whose
`userAgentData.getHighEntropyValues(["formFactors"])` includes `XR` (Chrome on
an Android XR headset: `GetFormFactorsClientHint` in
`components/embedder_support/user_agent_utils.cc`) is a headset. Any other
Android browser is a phone, and is not asked about immersive VR at all, which
also saves the query at startup. Other platforms keep the rule: a desktop with
a PC headset, and Safari on Apple Vision Pro. On a phone the VR tab already
says to choose WebGL 2 and reload, which is what Cardboard needs. This was
read from Chromium's source, not tried on a phone: before the next deploy, a
phone on an HTTPS build should show WebGPU in the HUD and no WebGL line in the
log.

## Order of work

1. Measure the baseline (section 2, Acceptance). Done 17 October 2026: see
   Startup measurements.
2. Renderer: stop saving a fallback as the preference, and print the fallback
   in the log. Small, and fixes a real trap. Done 17 October 2026: see Two
   defects, fixed first.
3. Boot terminal, provenance moved out of the HTML, and selector-page
   speculation rules. Done 17 October 2026, with the provenance moved to the
   end of the HTML instead: see The boot terminal, The click and Startup
   measurements.
4. One shader chunk (S4), and the unused Babylon modules out of the startup
   graph (start of S1). Done 17 October 2026: see Startup measurements.
5. `defineLazyFeature`, the chunk-map plugin and the idle queue. Move the
   pose editor, the closed panels and the Dev tab's views onto it (S2). Done
   17 October 2026, with the panels that restoring a scene needs left at
   startup: see Code on demand and idle prefetch.
6. The empty scene first: the boot chunk split. Begun 17 October 2026 with
   the presentation probe skipped once passed, and React and the tab overlay
   loaded while the globe starts. Its first goal is met: 0.68 MiB of
   JavaScript before the first frame, from 1.44 MiB. On 18 October 2026 the
   probe went from automatic mode altogether, for a reload on the rare
   device whose WebGPU cannot present, the WebGPU adapter is asked for while
   the page parses, and the default atmosphere's tables ship precomputed:
   see Startup measurements. On 19 October 2026 the Google 3D Tiles code
   left the first frame unless the globe starts on Google (a cold first
   frame 1.2 s sooner, see Startup measurements). What is left before the
   first frame, largest first: on a first visit, the reload that makes the
   page cross-origin isolated (ui `4b125b0`), after which the modules run at
   2.3 s instead of 2.0 s (shortened on 19 October 2026, and spared from the
   landing pages: see The isolation reload); Babylon's WebGPU buffers and the first terrain
   mesh (about 0.3 s at 4× slowdown); and running the entry chunk itself
   (475 KiB brotli, 1.9 MB), whose panels the profile no longer singles
   out.
7. The renderer advisor's rules and the log entries. Done 17 October 2026:
   see Advice.
