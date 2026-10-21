# Performance audit

This page records what each of the three apps costs:

- the UMN tour, `/tour/minneapolis/`;
- the FOSS Earth app, `/app/`;
- 0SFS, `/fly/`.

It covers how fast each one starts, how evenly it draws, how busy it keeps the
CPU, and how much memory it holds. Run the audit again after a change that could
move these numbers, and add a dated section rather than editing the old one.

## 21 October 2026

**What changed.** A second runtime session on the three apps, the evening
after the 20 October section's runs. Every change is pixel-identical by
construction and test. They are committed and not yet pushed:

- engine `b2ddff9`, with its identity test `6058d4f`: the terrain commit
  uploads each tile once with its seams, and doesn't upload an array a mesh
  already holds. It searches for seam neighbours only at the levels present
  (backlog R14);
- engine `497e013`: imagery measurement (`evaluateView`) keeps one record per
  lattice point and reuses the last tile's entry. It computes clip points,
  footprints and bisection probes without per-call objects;
- engine `f647f96`: the marker ray's bounds test reads each axis by name
  rather than through Vector3's slow computed-key path;
- sphere-image `61d04a2`: the 360 orbs are tested on screen by projection
  alone, without reading the canvas box once per orb in every frame;
- app `9904178`: the scene host keeps one reduced-motion media query instead
  of making two new ones in every frame.

Engine `5a7880e` fixes a test that depended on timing, with no change at run
time.

**Runs.** The same profiler, visits and machine as on 20 October, with these
differences:

- **Before** (`s2-start`) is HEAD with only this session's files as they were
  at its start:
  - engine `createRasterTilesRuntime.ts`, `meshRefinement.ts`,
    `imagerySelector.ts`, `imageryGeometry.ts` and `surfaceQuery.ts`;
  - sphere-image `renderer.ts` and `viewer.ts`;
  - app `sceneHost.ts`.
- **After** (`s2-end`) is HEAD.
- **Shared code.** Both arms were built back to back from one state of every
  checkout: engine `5a7880e`, renderer `89ec913`, sky `18d68ea`, ui
  `d6098d8`, toolbar `1872be5`, sphere-image `61d04a2`, app `9904178` and
  images `6310a26`. So both include the scheduling agent's commits from the
  same day.
- **Pairs.** Each target ran three interleaved pairs, in the order before,
  after, after, before, before, after. They ran on battery under
  `caffeinate -i`, with load averages of 2.2 to 4.4.
- **Checks.** No other profiler run overlapped any of them. Every visit
  ended cross-origin isolated, with shared memory.
- **Medians.** Figures are medians of three. "Separate" means every run of
  one arm is beyond every run of the other.
- **Raw results** are in research's `build/session/`.

### Highlights

1. **On the phone drag at 4×, a frame costs 13.4 ms of main thread before and
   12.8 ms after.** The frame rate rose from 55.0 to 56.2 frames/s; both are
   separate.
   - The raster update fell from 230.9 to 198.3 ms/s (−14 %).
   - At 4× the phone spends some of what is saved on drawing more frames. So
     the main thread fell less, from 74 to 72 %, and script from 55.3 to
     52.3 %.
2. **The terrain commit costs half what it did.**
   - On the phone it fell from 23.7 to 11.9 ms/s, with `stitchTerrainEdges`
     falling from 16.7 to 6.4.
   - In the app at 1× it fell from 8.8 to 3.7 ms/s.
3. **Imagery measurement fell by a sixth to a quarter on every target.**
   - `evaluateView` fell from 83.4 to 62.3 ms/s on the phone, and from 63.2
     to 47.8 in the flight at 1×.
   - The loaded-detail readout measures through the same function, so it
     fell too, from 64.5 to 53.6 on the phone.
   - On 20 October this was the part counted whole that was most likely to
     lower a floor.
4. **At 1×, where frames are capped at 60, the gains show as an idle main
   thread.**
   - The flight fell from 37.9 to 36.6 % and the tour from 22.8 to 22.3 %;
     both are separate.
   - In the app at 1×, and in every desktop drag at 4×, the totals moved
     within noise, though each changed part moved beyond it.
5. **The app's warm visit showed content sooner:** about 5.0 s before (4946
   to 5082 ms) and 4.6 s after (4503 to 4845 ms).
   - The tour's moved from about 2.06 to 1.99 s; both are separate.
   - The terrain commit and imagery measurement both run while the first
     view loads. That is not traced.
6. **Every target is within about 4 % of its same-behaviour floor.** See
   [Floors and gaps now](#floors-and-gaps-now).

### Before and after the second session

**Totals.** "ms a frame" is main-thread time per frame drawn.

| Page | Stretch | Main thread | Frames/s | ms a frame |
| --- | --- | --- | --- | --- |
| `/fly/` | flying, 1× | 37.9 → 36.6 %, separate | 58.9 → 58.8 | 6.42 → 6.22, separate |
| `/fly/` | flying, 4× | 99.0 → 99.1 % | 24.9 → 25.1 | 39.8 → 39.5 |
| `/app/` | dragging, 1× | 26.2 → 25.6 % | 59.3 → 59.4 | 4.41 → 4.32 |
| `/app/` | dragging, 4× | 72.9 → 73.8 % | 56.9 → 56.8 | 12.8 → 13.0 |
| `/tour/minneapolis/` | dragging, 1× | 22.8 → 22.3 %, separate | 59.3 → 59.2 | 3.84 → 3.76, separate |
| `/tour/minneapolis/` | dragging, 4× | 56.2 → 55.1 % | 57.8 → 58.1, separate | 9.72 → 9.51 |
| `/tour/minneapolis/`, phone | dragging, 4× | 74.1 → 71.6 % | 55.0 → 56.2, separate | 13.4 → 12.8, separate |

One of the app's "after" runs carried more work in every part: 29 % at 1× and
80 % at 4×. That is why the app's totals overlap.

**The parts this session changed,** in ms of main thread per second. All are
separate unless marked.

| Part | Phone drag, 4× | Tour drag, 1× | App drag, 1× | Flight, 1× |
| --- | --- | --- | --- | --- |
| Raster update | 230.9 → 198.3 | 63.2 → 57.6 | 125.5 → 114.0, overlap | 192.6 → 172.3 |
| `evaluateView` | 83.4 → 62.3 | 27.6 → 22.6 | 54.6 → 45.2 | 63.2 → 47.8 |
| Imagery selection | 51.4 → 43.0 | 16.1 → 14.2 | 38.1 → 34.0, overlap | 52.5 → 45.9 |
| Loaded-detail readout | 64.5 → 53.6 | 24.0 → 20.8 | 40.0 → 35.7, overlap | 66.0 → 54.0 |
| `commitTerrain` | 23.7 → 11.9 | 1.7 → 1.0 | 8.8 → 3.7 | 2.7 → 1.6, overlap |
| Marker raycast | 17.3 → 12.7 | 3.8 → 3.3 | 5.0 → 3.2 | none |
| The 360 orbs' frame | 33.3 → 30.9 | 11.3 → 10.4, overlap | 2.7 → 2.2, overlap | none |

In the app's drag at 4×, `evaluateView` fell from 178.4 to 146.8 ms/s,
`commitTerrain` from 9.2 to 4.4, and the raycast from 10.0 to 5.7. All three
are separate. In the flight at 4×, `evaluateView` fell from 171.6 to 143.5.

On the phone, style recalculations fell from 1.91 to 1.85 a frame and layouts from 0.77 to 0.71, both separate, probably because the orbs no longer read the canvas box. On the desktop they did not change.

### The second session's changes

Each change's own A/B, at the phone drag at 4×, three interleaved pairs, in
ms of main thread per second:

| Change | Commit | Before | After | Proof |
| --- | --- | --- | --- | --- |
| Each terrain tile uploaded once with its seams; no upload of an array a mesh holds; seams searched only at the levels present | engine `b2ddff9` | `commitTerrain` 24.2; `stitchTerrainEdges` 15.8; raster update 237.2 | 10.5; 5.8; 214.6 | A digest pinned before the change (`6058d4f`); 17 mutants killed, 3 equivalent |
| Imagery measurement with one record per lattice point and no per-call objects | engine `497e013` | `evaluateView` 84.3; selection 51.0 | 61.3; 41.5 | The selector's pinned digest and 400 random views; 20 of 22 mutants killed, 2 equivalent |
| The marker ray's bounds test with each axis read by name | engine `f647f96` | Raycast 16.4 | 10.5 | The shipped answers over 200,000 random rays and boxes; 6 mutants killed |
| The orbs tested on screen by projection alone | sphere-image `61d04a2` | One canvas box read per orb, 1.3–2.5 | None | The same answer over 10,000 directions, with no box read; 4 mutants killed |
| One reduced-motion media query, kept | app `9904178` | Two new queries a frame, 1.3–2.1 | 0.6 or less | A media query's `matches` is live |

`497e013` and `f647f96` were measured together. With both, the raster update
fell from 216.0 to 193.6 ms/s and the main thread from 75 to 67 %. The last
two rows are the before/after runs' figures.

`5a7880e` fixes the engine's atlas test "changes imagery level and source
without touching terrain, elevation requests or the surface". It failed in
whole-file runs before and after the terrain commit, because heights that
arrived were selected for again once the terrain's 100 ms reselection interval
had passed. The test now advances its clock 50 ms a frame.

### Floors and gaps now

The method is the one in [Floors and gaps](#floors-and-gaps) below:

- a floor is what is left when every cost we know how to remove is taken out;
- every other part counts at its measured cost, so a floor is an upper bound;
- "with the decisions" also takes out the changes that wait on the user.

The figures are the "after" medians. These runs read higher than those of
20 October for nearly the same code: the tour's drag at 4× was 56 % before
this session, against 53–55 % then. So compare each gap, not each floor,
with that section's.

| Target | Measured at HEAD | Floor, same behaviour | Floor, with the decisions | Gap to the first | Gap to the second |
| --- | --- | --- | --- | --- | --- |
| Flight, `/fly/`, 1× | 36.6 % | About 36.4 % | About 30 % | Under 1 % | About 1.2× |
| Map drag, `/app/`, 1× | 25.6 % | About 25.1 % | About 21 % | About 2 % | About 1.2× |
| Tour drag, `/tour/minneapolis/`, 1× | 22.3 % | About 21.8 % | About 19 % | About 2 % | About 1.2× |
| Phone drag, tour, 4× | 71.6 % | About 69 % | About 60 % | About 4 % | About 1.2× |

**The phone drag at 4×.** The known costs between it and its floors:

| Cost | ms/s at 4× | Kind | Backlog |
| --- | --- | --- | --- |
| The loaded-detail readout, re-measured on every publish | 53.6; about 45 would go at a 100 ms cadence | Decision | C12 |
| The spinning Activity outline's style and paint | About 47 | Decision: Still | P13 |
| Forced style and layout after mid-frame HUD writes | About 17 | Same behaviour; parked until it is proved that those writes never move the canvas | C5 |
| Height-batch sorting and uniform comparisons | About 6 | Same behaviour | C2 |
| Patch tables built when unchanged | Up to about 3; the share of unchanged tables is not measured | Same behaviour | — |

The three same-behaviour rows add up to about 26 ms/s, so the floor is about
69 %. With the two decisions, about 118 ms/s in all, it is about 60 %.

This session closed the terrain commit's row (about 13 ms/s on 20 October)
and about half of the raycast's waste (about 8 then). The phone also lost
21 ms/s from `evaluateView`, a part that was counted whole.

At 4×, a saving buys frames as well as idle time, so these percentages
overstate how far the main thread falls. On the phone the frame rate is 56.2;
the floors are at 60.

**At 1×.** The same-behaviour costs are small: forced layouts, uniforms and
height batches, about 5 ms/s in the tour and app, and about 2 in the flight,
whose forced style recalculation is not traced. The gap to the second floor
is the decisions:

- **The loaded-detail readout:** 20.8 ms/s in the tour, 35.7 in the app and
  54.0 in the flight. Most of it would go at the selector's cadence.
- **Still:** about 10 ms/s in the tour, through `applyWorldViewport`'s style
  recalculation. The app's (10–12) probably has the same cause, which is not
  traced.
- **In 0SFS, the second raster update:** about 59 ms/s at 1×, of which about
  32–35 would probably be saved (C11).

**The parts counted whole,** on the phone, in ms/s at HEAD:

- Babylon's render, 209–219: active-mesh evaluation 29–32, the UI occlusion
  pass 17–18;
- imagery selection, 42–44, and publish, 24–29;
- the 360 orbs' frame, 30–31;
- `prepare`, 31;
- terrain selection and new tile meshes, 23–25;
- the anchor markers, 16–17, of which the raycast is 12–13;
- the work outside the frame, the workers' replies, height batches, tile
  fetches and input;
- the browser's own work outside script.

None of these has been shown to be necessary. The next candidates in each are
listed in the
[performance agent state](proposals/implementation/performance-agent-state.md#then-by-measured-cost).

### Still waiting on a decision

The list in [Waiting on a decision](#waiting-on-a-decision) below stands. Two
of its figures have moved:

- **The loaded-detail readout** costs less now that it measures through a
  cheaper `evaluateView`: 53.6 ms/s at the phone drag at 4×, against 64–68,
  and 54 in the flight at 1×. Most of that would still go at the selector's
  cadence.
- **0SFS's second raster update** still costs about 59 ms/s at 1×.

## 20 October 2026

**What changed.** A day of runtime work on the three apps, mostly in the
engine. Each change is listed below with its own A/B. Every change is
pixel-identical by construction and test, except where an entry says
otherwise. They are committed and not yet pushed, at engine `1e3a0a3`,
renderer `24b6a6d`, sphere-image `b2f0ec9`, sky `e4a3dc3`, toolbar `1872be5`,
app `b9a12a2` and fly `dddb895`.

The before/after below also includes engine `33e897e`, the terrain proximity
LOD, which another agent committed the same day. It cut the runtime selection
cost too. The tour deployed on 20 October has engine `90c0ef6`, not the later
height and measurement work.

**Runs.** These figures are indicative. The tool is research's frame profiler,
`scripts/benchmarks/startup-audit/profile.mjs`, not the 19 October runner.

- It makes the same cold and warm visits under Fast 4G, then 8 s stretches
  with the CPU profiler on.
- Each target ran as interleaved pairs: base, HEAD, HEAD, base.
- The machine ran on battery under `caffeinate -i`, with load averages of 2 to
  3.5 on 10 cores.
- The base builds are those kept from before the work:
  - fly `dist-base`, 19 October, before any change;
  - app `app-base` and tour `tour-base`, the morning of 20 October, after
    `dadbbcd`, `a034920` and `a3b213c`, so they understate the change;
  - tour `layout-base`, for the phone, built at 14:07 after the held clears,
    `33e897e` and the stand-in fix, but before the layout guards, so it shows
    only the afternoon's changes.
- The raw results are in research's `build/final/` and
  `build/benchmarks/startup-audit/profile-final-*`.

### What stands out

1. **The flight's main thread fell from about three quarters of a core to
   about a third.**
   - At 1×, the main thread was busy 79 % and 69 % of the time before, and
     30 % and 36 % at HEAD.
   - At 4×, the flight drew 12.8 and 14.1 frames/s before, and 43.8 and
     24.9 at HEAD.
   - The aircraft flies itself, so each run sees different ground, and the 4×
     figures vary the most.
   - Most of the saving is imagery selection and measurement: the heights are
     reused instead of asked for again, and one measurement serves two
     consumers.
2. **On the phone drag at 4×, the afternoon's changes alone took the main
   thread from 82–84 % to 72–73 %.**
   - Frames/s rose from 52.6 and 53.0 to 55.3 and 55.8, and the 95th
     percentile frame from 33.3 to 16.7 ms.
   - Idle time rose from 155–171 to 262–266 ms/s.
   - The marker raycast fell from 40–43 to 15 ms/s.
   - The imagery update fell from 220–225 to 166–168 ms/s.
   - Style recalculations fell from 2.7 to 1.9 per frame, and layouts from
     1.2 to 0.8.
   - On the desktop at 4×, the tour's main thread fell from 71–76 % to
     53–55 %, and the app's frame rate rose from 47.9–51.1 to
     56.8–57.6 frames/s.
3. **A 360 image costs the GPU less than half what it did.**
   - Babylon cleared the depth buffer before the panorama's rendering group,
     which ended the main pass and began another.
   - The renderer now holds that clear until a draw needs it. Every tour
     state draws in one render pass, where it used up to three.
   - Inside a 360 image, GPU time per frame fell from 3.62 to 1.61 ms
     (−56 %) on the M5 at a phone's viewport.
4. **Coarse Google 3D Tiles no longer lift the camera.** It was a bug, not a
   speed problem; see [Coarse stand-ins](#coarse-stand-ins) below.
5. **Each target is within 10 % of the floor that keeps today's behaviour,
   counting the parts not yet examined at their measured cost.** The rest is
   either a change in behaviour that waits on a decision, or a part not yet
   shown to be cheaper, imagery selection first. See
   [Floors and gaps](#floors-and-gaps).

### Before and after

Main thread as a fraction of one core, and frames per second. Each cell gives
the two runs.

| Page | Stretch | Base main thread | HEAD main thread | Base frames/s | HEAD frames/s |
| --- | --- | --- | --- | --- | --- |
| `/fly/` | flying, 1× | 79 %, 69 % | 30 %, 36 % | 58.9, 58.7 | 59.1, 58.9 |
| `/fly/` | flying, 4× | 100 %, 100 % | 98 %, 99 % | 12.8, 14.1 | 43.8, 24.9 |
| `/app/` | dragging, 1× | 29 %, 35 % | 26 %, 26 % | 59.5, 59.2 | 59.4, 59.4 |
| `/app/` | dragging, 4× | 86 %, 89 % | 73 %, 71 % | 47.9, 51.1 | 56.8, 57.6 |
| `/tour/minneapolis/` | dragging, 1× | 23 %, 24 % | 21 %, 21 % | 59.3, 59.2 | 59.2, 59.3 |
| `/tour/minneapolis/` | dragging, 4× | 71 %, 76 % | 53 %, 55 % | 57.4, 57.7 | 58.1, 57.9 |
| `/tour/minneapolis/`, phone | dragging, 4× | 84 %, 82 % | 73 %, 72 % | 52.6, 53.0 | 55.3, 55.8 |

The phone row's base is `layout-base`, so it shows only the afternoon's
changes. In the tour's desktop drags, style recalculations fell from about 2.9
to 1.9 a frame, and layouts from about 1.15 to 0.85. In the app's, style
recalculations fell from about 2.9 a frame to 1.9 at 1× and 2.3 at 4×.

Every visit ended cross-origin isolated, with shared memory. Every profile
shows Babylon's WebGPU engine and none of its WebGL one. The app's warm visit showed content in 4986 and 5142 ms at HEAD, against 5974 and
5963 ms before. That was not looked into. The tour's did not change, at about
2 s.

### Each change and its own A/B

Medians of interleaved pairs, in ms of main thread per second, at the phone
drag at 4× CPU, unless stated otherwise.

| Change | Commit | Before | After |
| --- | --- | --- | --- |
| Imagery grid heights reused within a surface revision | engine `dadbbcd` | Flight 1×: main thread 75–76 %; 4× 12.4–12.7 frames/s | 51 %; 15.5–16.2 frames/s |
| The same over a 65 × 65 lattice per tile | engine `a034920` | Flight 1×: 53 %; 4× 15.8, 16.2 frames/s | 49 %; 16.6, 17.4 frames/s |
| The parity check's pixels collected with a typed sort | engine `a3b213c` | 12 µs for 30 points | 5 µs |
| One view's measurements shared by the plan and the loaded pages | engine `4b75363` | App 4×: 50.6 frames/s, 88 %; fly 4×: 19.5 frames/s | 56.7 and 56.0, 83 % and 82 %; 23.7 and 28.4 |
| Residency stats in one pass | engine `ac1dd19` | About ten passes, four times an update | One pass, same values |
| Depth or stencil-only clears held until a draw needs them | renderer `24b6a6d` | GPU inside a 360 image: 3.62 ms a frame; up to 3 passes | 1.61 ms; 1 pass |
| Unchanged values not written to the DOM | engine `97a6ae1`, app `550b10d`, toolbar `4c1d7ee` | 2.75 style recalcs and 1.32 layouts a frame; 49.8 frames/s | 2.07 and 0.84; 50.5 frames/s |
| No star field update when no star can be drawn | sky `e4a3dc3` | Entering a 360 image by day, 4×: main thread 29 % | 25 % |
| Stitched ground meshes indexed for the markers' ray | engine `329dc6c` | Marker raycast 40.5 | 14.6 |
| No Error stack per hidden patch per publish | engine `90c0ef6` | About 22 in a heavy drag | 0, by construction |
| The worker's height check sent as one packed table | engine `545c5cb` | Height work 58.5 | 35.1 |
| Memoised heights in typed open-addressed tables | engine `0600ad3` | Height work 48.7 | 41.0 |
| A batch's heights from the last leaf tile found | engine `1afb938` | `heightsAt` 27.3 (13.1 self) | 23.9 (9.9 self) |
| Lattice heights kept for tiles no changed terrain touches | engine `f11a819` | Raster update 251.5; `heightsAt` 24.9 | 233.2; 17.3 |
| `evaluateView` without per-call objects | engine `1e3a0a3` | `evaluateView` 91.7; select 55.9 | 80.6; 49.5 |

A few points on these:

- **Proof.** The imagery changes keep a pinned digest of the selector's plans
  and measurements, and catch hand-made mutants. The measurement cache also
  ran a differential probe in the app: no mismatches over 263,621 regions.
- **Separate baselines.** The phone figures come from different days' builds,
  so add them up only within one row, not across rows.
- **Rejected after measuring:**
  - prefetching a group's heights in one batch: more heights for fewer
    calls, and slower;
  - discarding the main pass's multisampled store: no GPU gain on the M5;
  - horizon culling the main camera's tiles: about 1 % of vertices, and not
    provably identical.

### Floors and gaps

A floor here is what is left of a moving frame when every cost we know how to
remove is taken out. Every other part is counted at its measured cost, so
these floors are upper bounds. They show what is known, not what is possible.
Each target has two:

- **Same behaviour:** only the pixel-identical savings found so far.
- **With the decisions:** also the changes in behaviour that wait on the user
  (see [Waiting on a decision](#waiting-on-a-decision)).

The figures are from the two HEAD runs of each target. At 1× a frame is capped
at 60 frames/s, so the floors are in main-thread time.

| Target | Measured at HEAD | Floor, same behaviour | Floor, with the decisions | Gap to the second |
| --- | --- | --- | --- | --- |
| Flight, `/fly/`, 1× | 30 %, 36 % | The same: nothing pixel-identical is known | About 23–27 % | About 1.3× |
| Map drag, `/app/`, 1× | 26 %, 26 % | About 25 % | About 21 % | About 1.25× |
| Tour drag, `/tour/minneapolis/`, 1× | 21 %, 21 % | About 21 % | About 18 % | About 1.2× |
| Phone drag, tour, 4× | 73 %, 72 % | About 68 % | About 58 % | About 1.25× |

So every target is within 10 % of its same-behaviour floor. Each part of what
is left either needs a decision, or is a part counted whole that has not yet
been shown to be cheaper. Those parts, none of them shown to be necessary:

- **Imagery selection:**
  - 51–59 ms/s in the flight at 1×;
  - 35–38 in the app at 1×;
  - 16 in the tour at 1×;
  - 50 on the phone at 4×.

  It already starts at most one traversal per 100 ms while moving, so its
  floor is the cost of one traversal. It is the first place to look for a
  lower floor.
- **Babylon's render:** 48–60 ms/s at 1×, and 202 on the phone. On the phone
  that includes the UI occlusion pass (17–19), which reads element boxes every
  frame, and the HUD observers (15).
- **The 360 orbs' frame** (sphere-image's `onFrame`): 10–11 ms/s in the tour
  at 1×, and 34 on the phone.
- **The rest:** residency and publish, terrain selection, the workers'
  replies, and the browser's own work outside script.

**The flight at 1×.** What separates it from its floor with the decisions:

- **The raster update runs twice a frame** (backlog C11). The second call
  costs 58–60 ms/s. Of that, 24–26 is selection, which would move to the
  remaining call, so about 32–35 ms/s would probably be saved.
- **The loaded-detail readout is re-measured on every publish** (C12). It
  costs 38–54 ms/s, 10–13 of it in the second call. Most of the rest would go
  if it were measured at the selector's 100 ms cadence.
- **`applyWorldViewport` forces a style recalculation every frame**
  (16 ms/s). In the tour, the busy outline's CSS animations cause it, and
  Still removes it. The flight's cause has not been traced.

Selection is the largest part counted whole. Counting the readout's own
measurements, `evaluateView` costs 51 ms/s in all, `measureFocus` 20 and
`footprintFrom` 16.

**The phone drag at 4×.** The known costs between it and its floors:

| Cost | ms/s at 4× | Kind | Backlog |
| --- | --- | --- | --- |
| The loaded-detail readout, re-measured on every publish | 64–68; about 55 would go at a 100 ms cadence | Decision | C12 |
| The spinning Activity outline's style and paint | About 47 | Decision: Still | P13 |
| Forced style and layout after mid-frame HUD writes | About 17 | Same behaviour; parked until it is proved that those writes never move the canvas | C5 |
| The terrain commit's repeated uploads, keys and searches | About 13 of 23–24 | Same behaviour; designed | R14 |
| The marker raycast's remaining waste | About 8 of 15 | Same behaviour | — |
| Height-batch sorting and output, and uniform comparisons | About 6 | Same behaviour | — |

The four same-behaviour rows add up to about 44 ms/s, so the floor is about
68 %. With the two decisions, about 146 ms/s, the floor is about 58 %.

The parts counted whole, on the phone:

- Babylon's render, 202–203: opaque meshes 69, transparent 51–52, active-mesh
  evaluation 28, the UI occlusion pass 17–19, HUD observers 15;
- imagery selection, 50;
- the 360 orbs' frame, 34;
- residency and publish, 27–29;
- terrain selection and new tile meshes, 23;
- the work outside the frame, about 55: the workers' replies, height batches,
  tile fetches and input;
- the browser's own work outside script.

### Coarse stand-ins

The symptoms:

- the camera floated up with nothing touched;
- a very coarse tile showed with a finer one beneath it;
- coarse tiles appeared on the horizon.

The cause: 3d-tiles-renderer keeps a loaded tile drawn while its descendants
load. Google's octree boxes overlap, so such a stand-in can be far from its
own ground.

- One depth-3 tile, with a geometric error of 263 km, is centred in the Yukon.
  It still contains a camera at Minneapolis, and its mesh lies 6.5 to 6.8 km
  above the campus.
- The ground sample under the eye hit it first, and the eye contact pushed the
  camera up. A higher eye chose coarser tiles, and so on.

The fix is engine `5d1b132`:

- The ground under the eye now gives way to a finer tile within the coarser
  one's error below it.
- With **Hide coarse stand-ins** (`map.terrain.hideCoarseStandIns`, Map tab,
  on by default), a tile with children is not drawn when its error exceeds
  both its distance from the eye and 16 times the eye's height.

On cold caches, in the view that floated:

| Build | Eye height | Pushes |
| --- | --- | ---: |
| Before | 276 → 435 m | 14 |
| Fix, setting off | 276 → 282.5 m | 2 |
| Fix, default | 276 m throughout | 0 |

Settled views draw the same pixels. While tiles load, the setting draws less.

### Waiting on a decision

Each of these would change pixels or timing, so each needs a setting that
defaults to today:

| Change | What it would save |
| --- | --- |
| **Still** as the default Activity outline (the setting exists) | About 47 ms/s of style and paint in a phone drag at 4×; 50.5 → 52.7 frames/s |
| One raster update per frame in 0SFS | Probably about 32–35 ms/s of the flight at 1×. The second call costs 58–60, but its selection would move to the first. Tiles would arrive at other moments while moving |
| Re-measure the loaded-detail readout at the selector's cadence | Most of its 38–54 ms/s in the flight at 1×, and about 55 of its 64–68 ms/s in a phone drag at 4×. The readout would change at other moments |
| Verify imagery heights only at admission | Most of the worker check's remaining cost |
| Horizon culling of far-side Google tiles | About 15 ms/s at 4× |

Also for phones:

- a render scale below 1;
- no antialiasing;
- an opaque canvas;
- the four 360 experiments.

### How these were measured

These figures come from the frame profiler. The 19 October section used the
audit runner. The browser, machine, viewport, throttling and visits are the
same as below, with these differences:

- **The profiler** names main-thread time by source function, through the
  builds' source maps.
- **The phone runs** use `--phone`: 412 × 915 CSS pixels at 2.625 device
  pixels per CSS pixel, dragged with one finger.
- **The CPU profiler** costs a little itself, so compare these figures with
  each other, not with the 19 October ones.

The tools, the A/B method and the next steps are in the
[performance agent state](proposals/implementation/performance-agent-state.md).

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
