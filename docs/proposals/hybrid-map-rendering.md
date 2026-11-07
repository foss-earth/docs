# Hybrid map rendering

Status: implementation spec. Nothing in this document is implemented.
Date: 2026-11-04.

Two map providers share one globe by owning different ground, on the imagery
the terrain mesh already draws. Google Photorealistic 3D Tiles stay a
whole-map mode. The mesh, the stitch, the atlas shader, the surface query,
and the frame budgets stay the ones the raster map has today.

## Intended result

With a 2D basemap selected, a second raster basemap can fill the ground the
first one does not cover. USGS Imagery Topo keeps its published bounds, and
OpenStreetMap (or whichever elsewhere-source is chosen) covers the rest.
Each Web Mercator tile is drawn from exactly one of those sources. The
elevation provider is still the one on `map.source.elevation`, for the whole
mesh.

The Map tab gains one choice, on the source section that already picks the
basemap. The default is that the second source is the same as the first, which
is today's globe. Credits for every source actually on screen stay visible
together, each with its own link.

Google 3D Tiles, when selected, still replace the raster globe. The elsewhere
choice is remembered and applied again only after a raster basemap is selected.

## Decision

Hybrid rendering is a second imagery source inside the existing atlas
selector. It is not a second terrain, a second tileset, or a second scene.

The imagery path already separates the photograph from the mesh. Selection
walks one quadtree, residency keys every image by source id and version, and
one page table per terrain patch samples the atlas. A leaf's image key decides
the provider. The fragment shader in
[`imageryMaterialPlugin.ts`](https://github.com/foss-earth/engine/blob/main/src/babylon/imagery/imageryMaterialPlugin.ts)
gains no provider branch.

That is the shape that can be fast. The visible leaf count stays the count a
single source would select for the same view. The owner test is the bounds
test the selector already runs. `map.imagery.selectionTimePerFrame` (default
2 ms), `map.imagery.gpuBudget`, `map.imagery.concurrentRequests`, and the
terrain tile budgets are unchanged, and they are not given a second
allowance.

## Performance rules

These are acceptance rules. A change that breaks one of them is the wrong
implementation, including one that looks right in a screenshot.

1. **One owner per displayed tile.** A leaf requests and samples one source.
   The other source contributes no texels to that tile.
2. **One walk.** The selector visits the same quadtree it visits for one
   source. It does not run once per provider. With the elsewhere source set
   to the same id and version as the basemap, the planned image keys match
   the single-source plan.
3. **One atlas, one budget.** Both sources allocate slots in the atlas that
   already exists. Root coverage for a second source is the only extra
   resident set, and only while that source is in the partition: level 2 is
   sixteen tiles. They compete with detail pages under the current GPU budget.
   The default budget formula stays as it is.
4. **Demand matches ownership.** A tile the partition assigns to source A is
   never requested from source B. A source whose `requestPolicy.prefetch` is
   false (OpenStreetMap) still receives visible leaves only.
5. **No extra geometry.** Terrain selection, seam stitching, and mesh upload
   are unchanged. Hybrid does not add a draw of a second ground.
6. **Off means today's cost.** `map.source.elsewhere = same`, and Google mode,
   leave the raster update, the imagery plugin, and the Google runtime on
   their current paths.

The per-source in-flight cap already exists. `ImageryRequest.sourceKey` and
`maxConcurrentForSource` in
[`imageryResidency.ts`](https://github.com/foss-earth/engine/blob/main/src/terrain/imagery/imageryResidency.ts)
are the hook. Pass each descriptor's `requestPolicy.maxConcurrent`. The
global `map.imagery.concurrentRequests` cap remains the ceiling on top of
those.

## Ownership

A partition names at most two raster descriptors.

| Kind | Who owns a tile |
| --- | --- |
| `single` | The basemap. This is the default, and it is the only kind used while the basemap is Google. |
| `coverage` | The basemap, where the tile lies inside that source's `bounds`. The elsewhere source, where the tile lies outside them. A basemap with no `bounds` is global, so the partition collapses to `single`. |
| `rectangle` | The basemap, where the tile center lies in the rectangle. The elsewhere source otherwise. Specified below so the pure function and the selector can grow it without a second residency model. The Map tab does not offer it until the coverage kind has been measured. |

"Outside" uses the same edge test as `outsideCoverage` in
[`imagerySelector.ts`](https://github.com/foss-earth/engine/blob/main/src/terrain/imagery/imagerySelector.ts):
a tile whose span is completely west, east, north, or south of the region.
Touching the edge counts as inside. A tile that crosses the edge is split
only when the footprint test already wants a split. While that tile is a
leaf, its center (`u = 0.5`, `v = 0.5`, the same `latLonAt` the selector
uses) picks the owner. Forcing a split along a border would refine the whole
boundary to the finest zoom whenever the border is on screen, including from
orbit. The boundary is then a stair-step at whatever level the view already
selected. That is the same stair a tile map already has.

A rectangle may cross the antimeridian. When its east edge is numerically
west of its west edge, the inside set wraps. Longitude wrapping uses the
same nearest-copy rule as the selector's camera test. Poles stay on the
Web Mercator grid the imagery path already uses.

The pure function lives in a new module,
`engine/src/terrain/imagery/imageryPartition.ts`. It imports no Babylon, no
DOM, and no settings. Inputs are descriptors and a tile id. Output is the
owning descriptor. Two descriptors with the same `imageSourceKey` return as
`single`.

A source that owns a tile and has no image there keeps today's behavior: the
nearest resident ancestor of **that** source stands in, and refinement stops
on a missing image. The other provider does not paint into the hole. A hole
is that provider's hole. Coverage bounds are how USGS hands ground to
OpenStreetMap. They are not a second, hidden partition.

## Selection and residency

`createImagerySelector` gains an optional partition on its input. When the
partition is `single`, the job is the job that runs today: one
`ImagerySourceCapabilities`, one coverage list, one `imageKey` prefix.

When the partition names two sources, the walk is still one walk from the
shared root. Each evaluated node records the owner from the partition.
`imageKey` already prefixes the source id and version, so the two sources
cannot collide in the atlas or the missing-image set. A node's level cap,
variant, and missing-image record come from its owner. `outsideCoverage`
for the owner's own bounds still applies after the partition, so a secondary
source is not refined past its own published coverage either.

Fallback coverage is pushed for each source in the partition, restricted to
root tiles that source owns. Those requests are included in every demand
set before the selection time budget runs. Residency treats a source as
gone when no request in the demand carries its `sourceKey`, and then cancels
that source's in-flight work. Dropping a source key because this frame's
2 ms budget had not reached it would cancel a healthy download. Coverage
requests are the keep-alive. Detail requests are added only for leaves the
walk actually selected.

`setDemand` lets an in-flight image finish when its source key is still
present, even if that image key left the demand. That rule stays. It is the
same rule that avoids cancelling a tile the camera just turned away from.
A download starts only from a demanded leaf, so a source with
`prefetch: false` still does not receive speculative detail requests.

`setSource` on the imagery runtime resets the selector and retires the
previous source. A partition update must not do that to a source that
remains. Retire a source key only when the new partition omits it. Leaves
that change owner keep the outgoing page bound until the incoming page is
resident, which is the overlap `setSource` already uses when a basemap
switch reallocates. The globe does not flash the complement to the empty
color during the fetch.

`map.imagery.maxNodes` still bounds the walk. Truncation reports the same
`truncated` flag it reports today. It must not drop the coverage keep-alive.

## What the frame draws

The terrain runtime keeps one mesh set. Patches attach the same
`ImageryAtlasMaterialPlugin`. The plugin's page-table block is filled from
the plan, so a patch that straddles two leaves can already sample two atlas
slots. Those slots may now belong to different source keys. No uniform
switches per provider, and no fragment discard.

Surface queries, aircraft terrain regions, and the sky's ground test keep
using the terrain meshes they use now. Imagery ownership does not change
`SurfaceHit`, revision rules for geometry, or collision. A region is ready
from elevation the way it is today. Imagery `pending` stays true while a
visible leaf's owning page is queued, loading, or waiting to retry, for
either source.

`RuntimeMode` stays `"google-tiles" | "raster-basemap" | "fallback"`. Hybrid
is not a fourth mode. `selectedSource` in
[`currentReadiness.ts`](https://github.com/foss-earth/engine/blob/main/src/surface/currentReadiness.ts)
gains the elsewhere source key when the partition names two sources, so
`sourceGeneration` already bumps when elsewhere changes.

The overview map keeps following the primary basemap, or the chart the
overview already knows how to show. It does not evaluate the partition and
it does not become a second globe.

## Settings, panel, credits

`map.source.basemap` stays the primary. Add `map.source.elsewhere` beside it
in [`map.ts`](https://github.com/foss-earth/engine/blob/main/src/settings/catalogue/map.ts):

- Choice: `same`, then each id in `RASTER_BASE_MAP_SOURCES`. No `google` entry.
- Default: `same`.
- Label along the lines of "Outside this basemap".
- Description: where the basemap has no published coverage, draw this source
  on the same terrain. `same` leaves the globe on one source.
- `appliesLive: true`, home on the Map tab source section.

Resolving it belongs next to the basemap resolver in
[`mapRuntimeConfig.ts`](https://github.com/foss-earth/engine/blob/main/src/settings/mapRuntimeConfig.ts).
An unknown id, the primary's own id, or a primary with no `bounds` resolves
to `single`. While `map.source.basemap` is `google`, the stored elsewhere
value is ignored and the raster partition is not built.

The control is another choice group in
[`mapSourcePanel.ts`](https://github.com/foss-earth/engine/blob/main/src/map/mapSourcePanel.ts),
in the existing Map source section. No new tab, no overlay, no second HUD
chip floating on the globe.

Credits: every source that has a displayed leaf is credited, each with its
own link and its own wording. USGS and OpenStreetMap must not be fused into
one attribution string. The source button names the owner under the camera
nadir when that owner has a displayed leaf, and otherwise the primary. The
nadir is one geodetic sample per status update, not a per-fragment test.
`displayedRasterBaseMap` remains that named source so current HUD callers
keep a single object. Add the full displayed list beside it. The HUD renders
one credit control per distinct attribution URL.

`BabylonRuntimeStatus.mode` is unchanged. Extend the status with the resolved
elsewhere source, null when the partition is `single`.

## Work sequence

### 1. Partition, with no renderer change

Add `imageryPartition.ts` and a Node test file. Cover:

- `same` id and version collapses to one source
- USGS bounds: a tile south of 14°S belongs to elsewhere; a tile over the
  contiguous United States belongs to USGS; a tile that crosses 14°S keeps
  the center's owner and is not force-split
- a primary with no `bounds` ignores elsewhere
- a rectangle that crosses the antimeridian
- a tile on the antimeridian itself
- Google is not representable in the partition type

The test file imports the module under Node with no DOM and no Babylon.

### 2. Selector and residency

Thread the partition through `createImagerySelector` and
`createImageryRuntime`. `setPartition` is the new entry. `setSource` remains
the single-source call and is implemented as a `single` partition, so the
current basemap switch keeps one code path.

Tests, extending the existing imagery selector tests:

- a view that crosses 14°S requests USGS URLs on the north leaves and the
  elsewhere URL on the south leaves, and never both for one leaf
- OpenStreetMap's prefetch flag still withholds tiles that are not visible
  leaves
- a demand set always contains a coverage request for each named source, even
  when the visible leaves all belong to one of them
- replacing elsewhere retires that source key and leaves the primary's
  resident pages in place
- `single` produces the same image keys as the current selector on a fixed
  view fixture, and `plan.cpuMs` is the same order (the fixture asserts the
  key list exactly; timing stays a diagnostic, not a flaky equality)

Do not change `imageryMaterialPlugin.ts`, `imageryAtlas.ts`, or the terrain
stitch.

### 3. Globe, settings, credits

Watch `map.source.elsewhere` from `createGlobeRuntime` the way the basemap is
watched. Build the partition when the raster runtime starts and when either
source changes. Pass it into the raster runtime's imagery options.

`createRasterTilesRuntime` forwards the partition to the imagery runtime. It
does not take a second terrain source and it does not start a second tile
cache.

HUD and panel tests cover: default `same` shows one credit; a crossed view
shows two credit links; elsewhere equal to the primary shows one; a `google`
value is absent from the choices.

### 4. Measure, then the rectangle

Coverage hybrid ships with the default `same`. Before any preset turns
elsewhere on, and before the rectangle is exposed in the panel, record one
comparison on the existing terrain capture path:

- elsewhere `same`, fixed view: selection nodes, requested URLs, and drawn
  terrain tiles match the single-source run
- elsewhere set, camera entirely inside the primary bounds: detail URLs are
  only the primary's; the secondary contributes coverage requests only
- elsewhere set, camera on the coverage edge: the new URLs are the leaves
  that changed owner, not a second copy of the view

The rectangle kind can then be four numbers (`west`, `south`, `east`,
`north`) on the same partition type, edited from the Map source section.
Until that measurement exists, the rectangle is a tested function and not a
setting.

## Files

| File | Change |
| --- | --- |
| `engine/src/terrain/imagery/imageryPartition.ts` | New. Owner function. |
| `engine/tests/terrain/imagery/imageryPartition.test.ts` | New. |
| `engine/src/terrain/imagery/imagerySelector.ts` | Partition on the job. Single path preserved. |
| `engine/src/babylon/imagery/createImageryRuntime.ts` | `setPartition`. Retire omitted source keys only. |
| `engine/src/babylon/createRasterTilesRuntime.ts` | Forward the partition. |
| `engine/src/babylon/createGlobeRuntime.ts` | Resolve and watch elsewhere. Extend status. |
| `engine/src/settings/mapRuntimeConfig.ts` | Resolve elsewhere to a partition or `single`. |
| `engine/src/settings/catalogue/map.ts` | `map.source.elsewhere`. |
| `engine/src/map/mapSourcePanel.ts` | Second choice group. |
| `engine/src/map/mapSourceHud.ts` | One credit link per displayed attribution. |
| Existing selector, HUD, and runtime-config tests | The cases in the work sequence. |

Leave these alone: `createTilesRuntime.ts`, `surfaceQuery.ts`,
`imageryMaterialPlugin.ts`, the terrain mesh builder, and the Google loading
budgets.

## Why the two runtimes stay exclusive

[`createGlobeRuntime.ts`](https://github.com/foss-earth/engine/blob/main/src/babylon/createGlobeRuntime.ts)
already holds a Google runtime and a raster runtime at the same time, and
only during a switch. `adoptGoogleCoverage` and `adoptRasterCoverage` dispose
the loser in the frame the winner has visible tiles. The comment on that
handover records the reason: keeping the previous surface up draws two
grounds for the whole time streaming continues. `isMapSurface` would then
include both for the sky probe and for picking. `createSurfaceQuery` skips
disabled meshes and, among enabled ones, returns the closest triangle. Two
enabled grounds make the closest triangle the collision surface, including
where the datums disagree.

Google's own Q&A says Photorealistic 3D Tiles and another terrain (Cesium
World Terrain in that note) sit on different reference systems, and tells
the reader to hide the globe. Our elevation mesh is in that same situation.
Reading Google tile vertices to warp our mesh onto them would store a height
taken from Google Maps Content. Section 3.2.3(c) of the
[Maps Platform Terms](https://cloud.google.com/maps-platform/terms) forbids
creating content from that data, and the
[Map Tiles policies](https://developers.google.com/maps/documentation/tile/policies)
call programmatic elevation measurement a prohibited derivative use. A skirt
built from those heights is out of scope for the same reason.

Drawing both meshes and discarding fragments on one of them puts a discard
on a phone-sized tile renderer. The hard target for this globe is mobile
WebGPU, where a discarded fragment still occupies the pass. Clipping boundary
glTF on the CPU repeats that cost on every straddling parent, and Google's
parents are large.

There is a second, sharper cost inside the tiles library we pin,
`3d-tiles-renderer` 0.4.24. `runTraversal` in `traverseFunctions.js` stops
descending when `inView` is false, and our `calculateTileViewError` override
in `createTilesRuntime.ts` can set that. Once a parent is refined, the
library's `LOAD_ROOT_SIBLINGS` path calls `recursivelyMarkUsed` on **every**
child, and that function does not look at the frustum. `queueTileForDownload`
has no geographic filter. Masking a city still queues the siblings of every
refined parent. At the root those siblings are the coarse meshes of the rest
of the planet. One `root.json` is the billable session
([How Google bills Photorealistic 3D Tiles](https://github.com/foss-earth/research/blob/main/3D_tiles/google-side-billing.md));
a second `GoogleTilesRuntime` would be a second root. Masking does not make
a second globe free, and it does not keep the extra meshes from downloading.

The legal boundary is the one that decides this, with the cost behind it.
Map Tiles API is a [Google Maps Core Service](https://cloud.google.com/maps-platform/terms/maps-services/).
Section 3.2.3(e) of the Maps Platform Terms says the customer will not use
the Core Services with or near a non-Google map. The examples include
showing Google imagery and a non-Google map on the same screen. OpenStreetMap,
CARTO, USGS, OpenTopoMap, and the FAA sectional used by the overview are
non-Google maps. The policies' "hybrid visualization" paragraph is a
different case: Photorealistic 3D Tiles as a background, plus the
customer's own models, with attribution that says which part is Google. It
is an authored overlay on Google's basemap. It is not a second provider
filling the complement.

The EEA service terms drop that clause. This spec does not grow a
billing-address branch that draws the composite for some accounts. A counsel
review would be its own document. Until then, Google occupies the whole
view, or it is not shown. The mode switch already implements that.

The overview's existing note, when the main map is Google and the inset has
no flat Google image, is unchanged by this work. This spec must not add
another non-Google basemap onto the Google globe to feed that inset.

## Later, only with a new decision

A geometric inset (Google mesh inside a region, raster mesh outside) needs
all of the following, and this spec does not schedule them:

- a written reading of section 3.2.3(e) that allows the pairing
- one Google tileset, with a download filter in front of
  `queueTileForDownload`, because `inView` is not that filter
- parent meshes clipped or hidden so their texels do not cover the raster
  owner, without a full-screen discard
- a seam policy that does not sample Google geometry into a stored height
- surface queries and the sky probe limited to the enabled owner
- a frame capture showing the inset costs a ring of tiles, not a second globe

Two elevation providers on one mesh are the same class of problem as the
seam stitch the terrain commit already had to make cheap. They are not a
follow-on to imagery hybrid.
