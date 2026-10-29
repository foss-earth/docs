# Terrain Proximity & Line-of-Sight LOD: Workhorse Agent Spec

Status: implemented and runtime-optimized, 20 October 2026. See the
[implementation and measurement record](../../validation/terrain-proximity-lod.md)
for the committed behavior, cache invariants, checks and performance limits.
The assignment below is retained as the original 19 October handoff, rather
than a request to implement it again.

## Assignment to give the agent

```text
Implement the customizable, zero-allocation Line-of-Sight (LOS) + 3D Proximity
Terrain LOD system and Shared-Memory WASM / WebGPU pipeline optimizations
specified in ~/gh/foss-earth/docs/docs/proposals/terrain-view-proximity-priority-lod.md.

Read first, in order:
1. ~/gh/foss-earth/.github/AGENTS.md and ~/gh/foss-earth/docs/docs/ui-layout.md.
2. ~/gh/foss-earth/docs/docs/proposals/terrain-view-proximity-priority-lod.md
   (especially Sections 2.5, 4.2, 4.3, 4.4, 4.5, and 5).
3. ~/gh/foss-earth/docs/docs/proposals/implementation/webassembly-state.md
   (shared-memory terrain heights `wasm.sharedHeights` and worker pools).
4. Current implementation files:
   - ~/gh/foss-earth/engine/src/settings/catalogue/loading.ts
   - ~/gh/foss-earth/engine/src/terrain/terrainSelector.ts
   - ~/gh/foss-earth/engine/src/babylon/createRasterTilesRuntime.ts
   - ~/gh/foss-earth/engine/src/babylon/rasterSurfaceSampler.ts
   - ~/gh/foss-earth/engine/src/babylon/createTilesRuntime.ts
   - ~/gh/foss-earth/engine/src/babylon/createGlobeRuntime.ts
   - ~/gh/foss-earth/engine/src/babylon/cameraState.ts
   - ~/gh/foss-earth/engine/src/browser/terrainMeshWorkers.ts
   - ~/gh/foss-earth/engine/src/terrain/terrainLoader.ts

Problem summary (verified in code):
1. In `terrainSelector.ts` (lines 226–251), `map.focus.refineBasemapFrom` defaults
   to `"focus"` (`orbit-target` = what the camera is looking at). Line 241
   (`if (!hidden && refine)`) throws away `nearestDistance` (actual distance from
   the camera eye to the tile) and instead divides `error` by
   `Math.max(1, nearest, refine.minDistanceMeters) * pixelAngle` (distance to the
   look-at target). Even when `robustOrbitLOD: true` sets `underEye = true`
   (`hidden = false`), it still enters `if (!hidden && refine)`—so backing the
   camera 5 km away from the orbit target while 20 m above a hill gives the ground
   20 m under the camera the coarse LOD of a tile 5 km away.
2. `underEye` in `terrainSelector.ts` only checks `tileContainsMercator(tile, cameraWorld)`
   with zero horizontal radius and zero velocity lookahead. Tiles 1 m behind the
   camera (`allOutside !== 0`) stay at root LOD (z=2..4) until the camera eye
   crosses into them. While async workers fetch/build the fine tile,
   `stepEyeContact()` (`cameraState.ts:489-523`) samples the coarse parent mesh
   (whose large triangles bridge across valleys and overestimate height) and
   jolts the camera upward at up to 60 m/s^2.
3. `createTilesRuntime.ts` (Google 3D Tiles) has no camera-eye proximity path at
   all (`target.inView` is purely frustum-culled unless covered by `focus`, which
   clamps distance to `focusMinDistance`).
4. `createRasterTilesRuntime.ts` blocks out-of-frustum proximity tiles on 2D
   imagery (`imageryReady`), wasting WebGPU texture bandwidth on unseen tiles
   behind the camera, and calls `meshWorkers.prepare(...)` without `priority` or
   `AbortSignal`.

Execute the implementation in 5 steps:

### Step 1: Settings Catalogue (`engine/src/settings/catalogue/loading.ts`)
Register the live-applying tuning parameters in `MAP_LOADING_PARAMETERS` under
`MAP_TAB`, section `"terrain-selection"`, `appliesLive: true` (preserving
`map.terrain.robustOrbitLOD` default `false` so existing tests/baselines stay
unchanged unless opted in):
- `map.terrain.proximityAnchor`: choice `"eye" | "focus" | "both"`, default `"both"`.
- `map.terrain.proximityBlendMode`: choice `"max" | "power-norm" | "weighted-sum"`, default `"max"`.
- `map.terrain.proximityBlendPower`: quantity `ratio`, min `1`, max `8`, step `0.5`, fallback `2`.
- `map.terrain.losWeight`: quantity `ratio`, min `0`, max `4`, step `0.05`, fallback `1`.
- `map.terrain.losGazeExponent`: quantity `ratio`, min `0`, max `8`, step `0.25`, fallback `0`.
- `map.terrain.losPeripheralFloor`: quantity `ratio`, min `0.05`, max `1`, step `0.05`, fallback `0.25`.
- `map.terrain.proximityWeight`: quantity `ratio`, min `0`, max `4`, step `0.05`, fallback `1`.
- `map.terrain.proximityCoreMeters`: number `m`, bounds `15..2000`, scale `"log2"`, step `0.1`, default `200`.
- `map.terrain.proximityRadiusMeters`: number `m`, bounds `50..50000`, scale `"log2"`, step `0.1`, default `1500`.
- `map.terrain.proximityHeightMeters`: number `m`, bounds `20..10000`, scale `"log2"`, step `0.1`, default `600`.
- `map.terrain.proximityFalloffExponent`: quantity `ratio`, min `0.25`, max `4`, step `0.25`, fallback `1`.
- `map.terrain.proximityLookaheadSeconds`: quantity `s`, min `0`, max `5`, step `0.1`, fallback `1.5`.
- `map.terrain.minProximityZoom`: quantity `levels`, min `0`, max `18`, step `1`, fallback `14`.
- `map.terrain.maxProximityErrorPx`: number `px`, bounds `1..128`, scale `"log2"`, step `0.25`, default `8`.

### Step 2: Zero-Allocation Dual-Metric Selector (`engine/src/terrain/terrainSelector.ts`)
1. **Zero Heap Allocations in `measure(tile)`**:
   - Remove `const hull: Vec3[] = []`, `hull.reduce(...)`, `hull.map(...)`,
     `[...points, nearestLocal]`, and per-node closures.
   - Use module-scoped `Float64Array` scratch storage (e.g. 20 hull points * 3 = 60
     floats) and accumulate `centerX, centerY, centerZ` inline during the 10-point
     grid loop, followed by a single scalar loop for `radius`.
2. **Precomputed Proximity Capsule & $O(1)$ Mercator AABB Early-Out**:
   - Extend `TerrainSelectionInput` with an optional `proximity?: TerrainProximityConfig`
     (containing anchor ECEF endpoints `start`, `end` from $\vec{p}_0 + \tau\vec{v}$,
     optional secondary anchor when `proximityAnchor === "both"`, `coreMeters`,
     `radiusMeters`, `heightMeters`, `falloffExponent`, `proximityWeight`,
     `losWeight`, `losGazeExponent`, `losPeripheralFloor`, `blendMode`,
     `blendPower`, `minProximityZoom`). When `robustOrbitLOD` is `true` and
     `proximity` is omitted, synthesize the default `TerrainProximityConfig` from
     `view.camera` so existing callers of `{ robustOrbitLOD: true }` automatically
     get the fixed proximity behavior.
   - Once per `selectTerrain(input)` call, precompute the Mercator bounding box
     `[minU, maxU, minV, maxV]` of the proximity sphere/capsule expanded by
     `radiusMeters` (handling antimeridian wrap).
   - In `measure(tile)`, if a tile is frustum-culled (`allOutside !== 0` or below
     camera horizon) and `focus` does not cover it: immediately test the tile's
     Mercator bounds `[tile.x / n, (tile.x + 1) / n] x [tile.y / n, (tile.y + 1) / n]`
     against the precomputed proximity Mercator AABB in $O(1)$. If disjoint,
     return immediately without computing proximity distances.
3. **Decoupled $E_{\text{los}}$ and $E_{\text{prox}}$ Calculation**:
   - **Line-of-Sight ($E_{\text{los}}$)**:
     - Evaluated when `!frustumHidden`.
     - Distance $d_{\text{los}}$ uses `refineDistance` (clamped to `refine.minDistanceMeters`)
       when `refine` is provided, else `nearestDistance` from `view.camera`.
     - If `losGazeExponent > 0`, compute $\cos(\theta_{\text{gaze}})$ from the camera
       forward vector (extracted from `view.ecefToClip` or camera pose) to the
       tile's nearest point, and multiply by
       `g = Math.max(losPeripheralFloor, Math.max(0, cosTheta) ** losGazeExponent)`.
     - `losErrorPx = losWeight * g * (error / (Math.max(1, d_los) * pixelAngle))`.
   - **Proximity ($E_{\text{prox}}$)**:
     - Evaluated whenever `input.robustOrbitLOD` (or `input.proximity`) is active
       and the tile intersects the proximity Mercator AABB.
     - Compute true 3D distance $d_{\text{prox}}$, horizontal surface distance $d_h$,
       and vertical clearance $d_v$ from the proximity anchor capsule
       $[\vec{p}_0, \vec{p}_0 + \tau\vec{v}]$ to the tile's 10 sample points (including
       `nearestLocal(tile, anchorMercator)`). **Never** use `refineDistance` or
       `refine.minDistanceMeters` here.
     - If $d_h \le R_{\text{prox}}$ and $d_v \le H_{\text{prox}}$:
       - Compute $u_h = \text{clamp}((d_h - R_{\text{core}}) / \max(1, R_{\text{prox}} - R_{\text{core}}), 0, 1)$
         and $u_v = \text{clamp}(d_v / \max(1, H_{\text{prox}}), 0, 1)$.
       - $\phi = (1 - u_h^\beta) \cdot (1 - u_v^\beta)$.
       - `proxErrorPx = proximityWeight * phi * (error / (Math.max(1, d_prox) * pixelAngle))`.
       - Mark `inCore = d_h <= R_core && d_v <= H_prox`.
   - **Blending & Hard Safety Floor**:
     - Combine `losErrorPx` and `proxErrorPx` using `blendMode`:
       - `"max"`: `Math.max(losErrorPx, proxErrorPx)`
       - `"power-norm"`: `(losErrorPx ** p + proxErrorPx ** p) ** (1 / p)`
       - `"weighted-sum"`: `losErrorPx + proxErrorPx`
     - In the quadtree split loop: a node splits if
       `(node.needed && node.errorPx > input.targetPx * threshold && node.tile.z < input.maxLevel)`
       **OR** `(node.inCore && node.tile.z < Math.min(input.maxLevel, minProximityZoom))`.
     - Expose `inFrustum?: boolean`, `inProximity?: boolean`, and `inCore?: boolean`
       on `TerrainLeaf`.

### Step 3: Shared-Memory WASM + WebGPU Runtime Optimizations (`createRasterTilesRuntime.ts`, `rasterSurfaceSampler.ts`, `cameraState.ts`)
1. **Anchor Velocity Tracking**:
   - In `createRasterTilesRuntime.ts`, track previous proximity anchor ECEF position
     and timestamp (`nowMs()`). Compute $\vec{v} = \Delta\vec{p} / \Delta t$
     (resetting $\vec{v} = \vec{0}$ if $|\Delta\vec{p}| > 2000\text{ m}$ in one step,
     e.g. teleport/location jump, and clamping speed to $\le 1000\text{ m/s}$).
2. **Elevation-Only Fast-Path for Out-of-Frustum Proximity Tiles**:
   - When `isRobustOrbitLOD()` is true and a desired leaf has
     `inProximity === true && inFrustum === false`:
     - Allow the tile's decoded `TerrainGrid` and mesh geometry to settle and
       register with `surfaceSampler` even before 2D imagery (`imageryReady`)
       completes, and skip queuing high-res atlas imagery page preparation while
       the tile remains outside the view frustum.
3. **Direct Shared-Memory `TerrainGrid` Sampling & Safe-Space Coarse-Jolt Guard**:
   - In `rasterSurfaceSampler.ts` (or `createRasterTilesRuntime.ts`), allow
     `sample(latDeg, lonDeg)` to fall back to or query the finest resident decoded
     `TerrainGrid` (`sampleTerrainGrid`, backed by `SharedArrayBuffer` when
     `wasm.sharedHeights = true`) whenever a finer decoded grid is already
     resident for `(lat, lon)` than the currently displayed mesh vertex buffer.
   - In `cameraState.ts` (`stepEyeContact`), guard against transient coarse
     stand-in jolts: if `robustOrbitLOD` is enabled and the surface sample's
     `quality` (terrain zoom) is coarse ($0 \le \text{quality} < \text{minProximityZoom}$
     while tiles are still pending), do not apply upward spring acceleration from
     that unrefined stand-in.
4. **Worker Pool Priority & Cancellation Wiring**:
   - Pass `{ priority: Math.round(leaf.errorPx) + (leaf.inCore ? 1_000_000 : 0), signal }`
     into `meshWorkers.prepare(...)` and `prioritize = Boolean(leaf.inCore)` into
     `terrainLoader.load(...)` so proximity safety-core tiles always jump ahead of
     distant horizon tiles on decode and WASM mesh worker queues.

### Step 4: Google 3D Tiles Proximity & Blend Parity (`createTilesRuntime.ts` & `createGlobeRuntime.ts`)
- In `createTilesRuntime.ts` (`applyViewMeasure` / `calculateTileViewError`):
  - Read the new proximity settings from `settings` when `map.terrain.robustOrbitLOD`
    is `true`.
  - Precompute camera forward vector, camera eye in tile space (`cameraInTiles`),
    focus anchor in tile space, and velocity lookahead capsule once per
    `tiles.update()`.
  - For each tile:
    - Compute $E_{\text{los}}$ from `target.error` (when `target.inView` is true),
      scaled by `losWeight` and gaze foveation $\cos^\alpha(\theta_{\text{gaze}})$.
    - Compute 3D distance $d_{\text{prox}}$ from the tile's `boundingVolume` to the
      proximity anchor / velocity capsule (using `cameraInTiles` and/or
      `focusInTiles` per `proximityAnchor`, **never** clamped to `focusMinDistance`).
    - When $d_{\text{prox}} \le R_{\text{prox}}$ and not below the anchor's horizon:
      compute $E_{\text{prox}} = w_{\text{prox}} \cdot \phi(d_{\text{prox}}) \cdot \text{errorAt}(tile, \max(1, d_{\text{prox}}))$.
      If $d_{\text{prox}} \le R_{\text{core}}$, enforce
      $E_{\text{prox}} \ge \text{tiles.errorTarget} \cdot (\epsilon(T) / \text{maxProximityErrorPx})$.
      Set `target.inView = true`, `target.distanceFromCamera = Math.min(target.distanceFromCamera, d_prox)`,
      and `target.error = blend(E_los, E_prox)`.

### Step 5: Verification & Regression Gate
1. Add unit tests in `engine/tests/terrain/terrainSelector.test.ts`,
   `engine/tests/createRasterTilesRuntime.test.ts`, and
   `engine/tests/createTilesRuntime.test.ts` covering all 7 scenarios in Section 5 of
   `terrain-view-proximity-priority-lod.md`:
   - Distant `refineFrom` ($10\text{ km}$) with low camera eye ($20\text{ m}$) ->
     under-eye tile refines to $\ge \text{minProximityZoom}$ ($z \ge 14$).
   - Backward camera velocity ($\vec{v}$ pointing into an off-frustum tile behind
     the camera) -> rear tile refines *before* boundary crossing.
   - Custom weights (`losWeight`, `proximityWeight`, `losGazeExponent`, and
     `proximityBlendMode`: `"max"`, `"power-norm"`, `"weighted-sum"`).
   - Hard floor isolation when `targetPx` is coarsened to maximum.
   - Google 3D Tiles out-of-frustum proximity refinement and unclamped distance.
   - Zero regression when `map.terrain.robustOrbitLOD` is `false` (default).
2. Run and pass:
   - `cd ~/gh/foss-earth/engine && npm run typecheck && npm run lint && npm test`
   - `cd ~/gh/foss-earth/app && npm run typecheck && npm run lint && npm test`
   - `cd ~/gh/0sfs/fly && npm run typecheck`
```
