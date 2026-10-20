# Performance audit

This page records what each of the three apps costs:

- the UMN tour, `/tour/minneapolis/`;
- the FOSS Earth app, `/app/`;
- 0SFS, `/fly/`.

It covers how fast each one starts, how evenly it draws, how busy it keeps the
CPU, and how much memory it holds. Run the audit again after a change that could
move these numbers, and add a dated section rather than editing the old one.

## 19 October 2026

**Builds.** The builds deployed on 19 October 2026: tour `43874b9`, app
`a2d0b1c` and fly `164043d`, on engine `468a42f`. ui `d6098d8`'s isolation
change was put into their pages (see
[The isolation reload](proposals/startup-loading.md#startup-measurements)).

**Runs.** These figures are medians of two runs per page and indicative only.
Other work ran on the machine: the load average was 1.5 to 5.4 on 10 cores. The
raw results are in research's
`build/benchmarks/startup-audit/audit/2026-10-19_223859/`.

### What stands out, largest first

1. **The flight is bound by its main thread.**
   - Flying keeps 0SFS's main thread 73 % busy at full speed, nine tenths
     of it running script.
   - At 4× CPU slowdown the flight falls to 13.6 frames/s. Its median
     frame interval is 83 ms, and 97 % of frames take over 25 ms. The page's
     own frame counter read 16 frames/s.
   - The tour and the app need 1 % of the main thread while their view is
     still, because they draw only on demand. The flight never stops
     drawing, so the cost of its frames is the first thing to cut. Next:
     the flight's per-frame script in the frame profiler.
2. **Dragging the view is main-thread bound at 4×.**
   - The app dropped to 26 frames/s, with a p95 interval of 100 ms.
   - The tour dropped to 48 frames/s, with a p95 interval of 33 ms.
   - At full speed the same drag kept the app's main thread 63 % busy and
     the tour's 36 %.
   - The two views differ, so the gap is not like for like. The app opens
     600 m from downtown Minneapolis at a 23° pitch. The tour opens 2 km
     from the campus at 50°. The same swing of the pointer probably brings
     more new tiles into a low view than into a high one.
   - In both, script is about nine tenths of the main thread's time.
     Next: the frame profiler's `map/*` and `render/*` sections during a
     drag at each view.
3. **The opening view waits on tile bytes.** On Fast 4G, about 1 MB/s:
   - the app's opening view finished loading every tile at 59.6 s, after
     55 MiB;
   - the tour settled at 45.9 s, after 41.5 MiB.

   The first 3D frame needs only 1.0 to 1.5 MiB. Everything after it is
   tiles, so fewer or smaller tiles for a low, oblique view would cut this
   time. The [terrain proximity LOD](proposals/terrain-view-proximity-priority-lod.md)
   proposal, which another agent is implementing, is aimed at the terrain
   share of it.
4. **Main-thread blocking before the globe.**
   - Every page blocks its main thread for 300 to 360 ms before its first
     3D frame, and for 365 to 754 ms before the globe.
   - The longest single task is about 0.3 s, or 0.52 s on the flight's
     cold visit.
   - A warm visit blocks as much as a cold one.
5. **Most of the renderer's memory is not yet accounted for.**
   - The page's renderer process holds 987 MiB for the tour, and 1,529 to
     1,588 MiB for the app and the flight, with peaks up to 1,680 MiB.
   - The parts the audit can name add up to 210 to 330 MiB:
     - the main thread's JS heap, about 100 MiB;
     - its array buffers, WebAssembly memories included: 97 MiB in the
       tour, about 200 MiB in the app and the flight;
     - the workers' heaps, 13 to 23 MiB.
   - The rest is not attributed yet. It could be decoded images, copies
     of textures kept on the CPU, compiled code, or the compositor.
     Next: a heap snapshot and a `memory-infra` trace of a warm app.
6. **GPU memory is about the same everywhere.** The GPU process holds 656
   to 722 MiB, of which 562 to 583 MiB is graphics memory, on all three
   pages. Some of that is the canvas and the render targets at 1280 × 800,
   but the tiles' textures are not separated out yet.
7. **Seventeen workers per page.** These are:
   - nine terrain decoders, one per hardware thread but one (at most 16),
     so a phone with 8 cores gets seven;
   - two terrain mesh builders;
   - one terrain heights worker;
   - one atlas imagery worker;
   - one sky evaluation worker;
   - three sky helpers, which share one memory with the sky's WebAssembly
     core: four threads in all, its coordinator included.

   While tiles load, the terrain decoders hold 70 to 260 MiB of array
   buffers between them. After the stretches, 6 workers were left in the
   tour, 17 in the app and 15 in the flight.

Every visit, cold and warm, ended cross-origin isolated with
`SharedArrayBuffer` defined, on WebGPU.

### Startup

Seconds from navigation, Fast 4G, 4× CPU slowdown. A cold visit includes the
isolation reload, about 1.8 s locally on the tour and the app and 0.37 s on
the flight. GitHub Pages
serves over HTTP/2, so the published pages reload sooner (see the isolation
reload in [Startup](proposals/startup-loading.md#startup-measurements)).

| Page | Visit | Terminal | Modules run | First 3D frame | Globe | Content | Settled | Bytes before first frame | Bytes until settled |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/tour/minneapolis/` | cold | 0.22 | 2.65 | 3.06 | 4.88 | 4.88 | 45.9 | 1.02 MiB | 41.5 MiB |
| `/tour/minneapolis/` | warm | 0.08 | 0.13 | 0.55 | 2.23 | 2.23 | 7.9 | 0 | 2.7 MiB |
| `/app/` | cold | 0.22 | 2.00 | 2.39 | 4.23 | 59.6 | 60.0 | 1.06 MiB | 55.2 MiB |
| `/app/` | warm | 0.06 | 0.18 | 0.59 | 2.05 | 6.9 | 19.8 | 0 | 0.2 MiB |
| `/fly/` | cold | 0.22 | 3.08 | 3.43 | 5.24 | 16.4 | — | 1.52 MiB | — |
| `/fly/` | warm | 0.07 | 0.27 | 0.68 | 2.31 | 2.64 | — | 0 | — |

What each mark means:

- **Content** is the first frame that draws what the page is for:
  - the tour's scene;
  - the aircraft;
  - for the app, the opening view with no tile missing.
- **Settled** is when frames stop for good. The flight never settles.
- **A warm globe** depends on the live tile servers and on what the cold
  visit left in the cache. These runs waited for the cold visit to settle,
  and their warm globes came 0.2 to 0.5 s later than those of the day's A/B
  runs, which stopped at the globe. Treat the warm globe as the least stable
  figure here.

Main-thread blocking, in ms: each long task's time past 50 ms, for the tasks
that began before the mark. The longest task is over the whole visit.

| Page | Visit | Before first 3D frame | Before globe | Longest task |
| --- | --- | --- | --- | --- |
| `/tour/minneapolis/` | cold | 312 | 569 | 297 |
| `/tour/minneapolis/` | warm | 306 | 618 | 289 |
| `/app/` | cold | 359 | 641 | 292 |
| `/app/` | warm | 347 | 650 | 281 |
| `/fly/` | cold | 318 | 365 | 520 |
| `/fly/` | warm | 315 | 754 | 285 |

### Frames and CPU

Each stretch is 8 s on the warm page once it has reached its moment. The
main-thread column is a fraction of one core, from Chrome's thread ticks. The
page's renderer process and the GPU process are fractions of one core, from
the operating system. The renderer's 4× figures appear to include Chrome's
throttling (see below), so they are left out.

| Page | Stretch | Frames/s | p95 interval | p99 interval | Frames over 25 ms | Main thread | Page renderer | GPU process |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/tour/minneapolis/` | still | 60.0 | 16.7 ms | 16.7 ms | 0 % | 1 % | 2 % | 1 % |
| `/tour/minneapolis/` | drag | 60.0 | 16.7 ms | 16.7 ms | 0 % | 36 % | 53 % | 10 % |
| `/tour/minneapolis/` | still, 4× | 59.2 | 16.7 ms | 33.3 ms | 1 % | 8 % | — | 1 % |
| `/tour/minneapolis/` | drag, 4× | 48.1 | 33.3 ms | 50 ms | 22 % | 89 % | — | 6 % |
| `/app/` | still | 60.0 | 16.7 ms | 16.7 ms | 0 % | 1 % | 2 % | 1 % |
| `/app/` | drag | 58.4 | 16.7 ms | 33.3 ms | 3 % | 63 % | 89 % | 8 % |
| `/app/` | still, 4× | 56.0 | 16.7 ms | 50 ms | 2 % | 15 % | — | 1 % |
| `/app/` | drag, 4× | 26.3 | 100 ms | 108 ms | 32 % | 95 % | — | 3 % |
| `/fly/` | flying | 59.8 | 16.7 ms | 16.7 ms | 0 % | 73 % | 106 % | 13 % |
| `/fly/` | flying, 4× | 13.6 | 117 ms | 125 ms | 97 % | 100 % | — | 4 % |

- **The two runs agreed.** Every frames-per-second figure was within 1
  frame/s between runs, and every main-thread share within 0.05 of a core.
- **The GPU process stays light.** It never needed more than 13 % of a
  core, so command submission is not where these pages run out.
- **The renderer outruns the main thread.** At full speed the page's
  renderer process does about 40 to 50 % more than its main thread. That
  is the compositor, the raster threads and the workers.

### Memory

After the stretches, in MiB.

| Page | Main-thread JS heap | Page array buffers | Workers' JS heaps (workers) | Page renderer footprint | Its peak | GPU process | Of it, graphics |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/tour/minneapolis/` | 96 | 97 | 17 (6) | 987 | 1,152 | 667 | 571 |
| `/app/` | 109 | 203 | 13 (17) | 1,529 | 1,680 | 656 | 562 |
| `/fly/` | 101 | 204 | 23 (15) | 1,588 | 1,674 | 722 | 583 |

- **During the stretches.** The app's and the flight's renderer footprint
  grew by 149 to 374 MiB, and the tour's shrank by 74 to 86 MiB. The tour's
  and the app's main-thread heaps grew by 18 to 34 MiB, and the flight's
  shrank by 7 to 14 MiB.
- **The browser process** held 90 to 100 MiB, and Chrome's other
  processes less than 50 MiB each.

## How it was measured

The tool is the [startup and runtime audit](https://github.com/foss-earth/research/blob/main/benchmarks/startup-audit/README.md)
in foss-earth/research, `scripts/benchmarks/startup-audit/run.mjs`. Its README
lists the options and how to read each number. In outline:

- **Browser.** Chrome 155, headless, with WebGPU on Metal, on an Apple M5 with
  10 cores and a 1280 × 800 viewport.
- **Server.** The builds are served locally the way GitHub Pages serves them,
  but over HTTP/1.1. Tiles come from the real tile servers.
- **Throttling.** Every visit runs under DevTools' Fast 4G preset and a 4× CPU
  slowdown. Chrome refuses both in dedicated workers, so tile decoding there runs
  at full speed.
- **Cold and warm.** A cold visit starts on a new, empty profile. A warm visit
  opens the page again through the service worker the first visit installed.
- **Startup.** The startup figures are the page's `boot:*` marks, in seconds
  from navigation. A first visit that reloads for isolation is timed from its
  first navigation.
- **Blocking time.** Blocking is total blocking time up to the mark: each long
  task's time past 50 ms, summed over the tasks that began before it.
- **Runtime stretches.** The runtime figures come after the warm visit has
  reached its moment. Each stretch lasts 8 s: still, then a left-button drag
  that swings the view back and forth, first at full speed and then at 4× CPU
  slowdown. The flight flies by itself, so it has only still stretches.

### What the numbers cannot say

- **Frame intervals.** These are the display's pace, capped at 16.7 ms by a
  60 Hz display. They are not GPU time.
  - A page that draws on demand still shows 60 frames/s while still,
    because the audit's own `requestAnimationFrame` loop keeps frames
    coming.
  - Use "frames over 25 ms" and the main thread's share alongside them.
- **4× CPU slowdown.** It slows only the page's main thread. It does not
  touch the GPU or the workers, so it shows where the main thread runs out
  first, not a phone's frame rate.
- **Page renderer CPU at 4×.** At 4×, the renderer process's CPU appears to
  include Chrome's throttling itself. It ran at about 0.8 of a core while
  the page was still, so compare the main thread there instead.
- **GPU memory.** Browsers have no API for GPU memory.
  - The graphics figure is macOS's own count for each process: the dirty
    memory in its `(graphics)`, `IOSurface` and `IOAccelerator`
    categories.
  - The renderer's [GPU memory streamgraph](performance.md#streamgraphs) is
    Babylon's own estimate. The two differ.
- **Array buffers.** The page's array buffers include its WebAssembly
  memories. A shared memory is counted again in each worker that holds it,
  so the workers' array buffers are left out.
  `performance.measureUserAgentSpecificMemory()` did not resolve within
  60 s on these pages, so it is not used.
- **A shared machine.** The machine was shared with other work, and the load
  average is written next to each set of figures. Treat differences under
  about 10 % as noise unless an exclusive run confirms them.

## Measuring a part of a frame

The audit says how much a page costs, not where in a frame the cost goes. For
that:

- **The frame profiler.** Open the page with
  `?set.renderer.profiling.enabled=1` and read Renderer → Debug (in 0SFS,
  Debug → Frame budget). It times each section of a frame on the CPU, and
  each pass on the GPU, as streamgraphs of the last minute. See
  [Streamgraphs](performance.md#streamgraphs).
- **An A/B test.** To A/B one change to the app with frames held continuous,
  use the [scene A/B benchmark](https://github.com/foss-earth/research/blob/main/benchmarks/scene-ab/README.md).
