# Procedural ocean

Status: proposal. Nothing in this document is implemented.
Date: 2026-11-04.

Open water leaves the basemap. A sea tile is drawn by a small shader on the
terrain mesh the globe already has, and the imagery atlas, the elevation
requests, and the fine mesh under it are not built. The shader exists to
replace that work. It is not a second simulation of the ocean.

This applies to a 2D basemap draped on elevation. Google Photorealistic 3D
Tiles stay a whole-map mode, as in
[Hybrid map rendering](hybrid-map-rendering.md). Where that document says
every leaf has one imagery owner, a sea tile is the case with none.

## Intended result

With a raster basemap selected, a region the elevation grid calls sea is not
an imagery leaf and not a fine terrain leaf. Its surface sits at mean sea
level, lit by the same Sun and sky as the ground. Land, coasts, and any tile
that contains a single land sample keep today's photograph and today's mesh
error. Turning the feature off restores today's selection on a land view.

The campus tour and an inland flight gain nothing and pay nothing. The saving
is an over-water view, and it is largest on a basemap or an elevation source
that keeps publishing tiles after the water has stopped changing.

## What was measured

On 4 November 2026 one tile was fetched for each place below and decoded with
the Terrarium formula the engine already uses,
`(R * 256 + G + B / 256) - 32768`. Mapterhorn tiles are 512² WebP. AWS and the
imagery tiles are 256². Heights are metres.

| Place | Source | Tile | Bytes | Heights |
| --- | --- | --- | --- | --- |
| Pacific, 30° N, 150° W | Mapterhorn | z4 and z5 | 52 | every sample 0 |
| Pacific | Mapterhorn | z6 through z13 | 404 | no tile |
| Pacific | USGS Imagery Topo (the default basemap) | z1–z8 | 3–29 KB JPEG | image exists |
| Pacific | USGS Imagery Topo | z0 and z9–z13 | 404 | no tile |
| Minneapolis | USGS Imagery Topo | z12 | 30 KB JPEG | image exists |
| Pacific | OpenStreetMap | z4–z13 | 103 | a tile at every level |
| Pacific | AWS Terrarium | z5 | 90 KB | −6490 to −1831, every sample negative |
| Pacific | AWS Terrarium | z8, z12 | 144 KB, 90 KB | bathymetry continues |
| IJsselmeer centre | Mapterhorn | z12 | 52 | every sample 0 |
| Lake Michigan | Mapterhorn | z12 | 54 | every sample 177 |
| Lake Superior | Mapterhorn | z10 | — | every sample 183 |
| Caspian | Mapterhorn | z10 | — | every sample −28 |
| Schiphol | Mapterhorn | z12 | — | −10 to 7.5, a few samples at 0 |
| Maldives | Mapterhorn | z8 | — | 99.9% of samples 0, maximum 12 |
| Netherlands, coarse | Mapterhorn | z5 | 112 KB | −238 to 990, mixed |

USGS Imagery (without the topo overlay) matched the topo result over this
Pacific point: tiles through z8, 404 from z9. The default elevation source is
Mapterhorn. AWS is the other source in
[`terrainGrid.ts`](https://github.com/foss-earth/engine/blob/main/src/terrain/terrainGrid.ts).

## What the globe does with that

Imagery selection refines a tile until its projected pixels are fine enough.
The test is the footprint, in
[`imagerySelector.ts`](https://github.com/foss-earth/engine/blob/main/src/terrain/imagery/imagerySelector.ts).
A blue tile and a city tile of the same size are the same amount of work.
Each atlas slot is a 288² RGBA page with its mips, 442,368 bytes, from
`SLOT_BYTES` in
[`loading.ts`](https://github.com/foss-earth/engine/blob/main/src/settings/catalogue/loading.ts).
An OpenStreetMap ocean tile is 103 bytes on the wire and a full slot after
decode. The fragment shader samples the page table and the atlas with
explicit derivatives
([`imageryMaterialPlugin.ts`](https://github.com/foss-earth/engine/blob/main/src/babylon/imagery/imageryMaterialPlugin.ts)).
A missing page is already a flat colour, `rgb(0.16, 0.18, 0.2)`, unlit by
any water model.

Terrain selection refines a tile while its geometric error, in pixels,
exceeds the target. That error is a quarter of the vertex spacing, which is
the allowance Cesium uses for a heightmap whose heights between vertices are
not yet known
([`terrainTileErrorMeters`](https://github.com/foss-earth/engine/blob/main/src/terrain/terrainSelector.ts)).
It does not read the height range. At the equator, with the default 64
segments and `WGS84_A` of 6,378,137 m:

| Level | Tile width | Vertex spacing | Error used today | Sagitta of one cell on the ellipsoid |
| --- | --- | --- | --- | --- |
| 5 | 1,252 km | 19.6 km | 4,892 m | 7.5 m |
| 8 | 157 km | 2.45 km | 611 m | 0.12 m |
| 16 | 611 m | 9.6 m | 2.4 m | 2 mm |

Level 16 is the default finest terrain level. A loaded grid that is exactly
flat has a real miss of about the sagitta, so the selector is refining a
plane as though a ridge of hundreds of metres might sit between the vertices.

A failed elevation request does not draw the failed child. The comment in
[`createRasterTilesRuntime.ts`](https://github.com/foss-earth/engine/blob/main/src/babylon/createRasterTilesRuntime.ts)
is "the coarse surface stays displayed; only the failed detail is requested."
Over the open Pacific, Mapterhorn and USGS already 404, so the drawn mesh and
the drawn photographs stop early. The selector does not know the server has
nothing finer. While the view is over that water it still measures those
leaves, and the runtime still asks for them until a missing record or a retry
backoff says to wait. A source that answers, OpenStreetMap at every zoom and
AWS Terrarium with a real bathymetric grid, never hits that stop. The mesh
then follows the seabed. On AWS the Pacific tile at z5 is already 2 to 6 km
below sea level, and the flight's ground query reads that mesh.

The published frame profiles do not measure this. The 21 October audit's
phone drag is the Minneapolis tour. Imagery selection there is about 42 ms
of main thread per second, terrain selection and new meshes about 23 ms, and
the raster update is the large surrounding cost. Those numbers are a land
view. An ocean change is not allowed to cite them as its own speedup.

## Where a speedup is real

The saving is requests, decodes, atlas slots, selection nodes, and meshes
that the sea test declines to create. It scales with how long the providers
keep answering.

- **OpenStreetMap over water.** A tile at every level, 103 bytes of flat
  colour, one atlas slot and one of the sixteen concurrent requests each.
  This is the imagery case to measure.
- **AWS Terrarium over deep water.** About 90–140 KB of bathymetry at every
  level sampled, and a mesh refined to the finest terrain level because the
  geometric error never looks at the range. This is the mesh and elevation
  case to measure.
- **Mapterhorn plus USGS over the open Pacific.** Fine tiles already 404.
  The remaining win is the coarse pages (z8 and above still decode into full
  slots), the selection walk, and the retries for levels the server does not
  have. Expect a smaller frame-time change than the two cases above.
- **A constant lake, such as Michigan at 177 m.** The photograph is worth
  keeping. The mesh is a plane, and the flat-error rule below stops splitting
  it. That saving is independent of the water colour.

A view of Minneapolis, the campus tour, and any tile that contains land stay
on the current numbers. That is an acceptance check, not a hope.

## Classification

Use the elevation grid that has already been decoded. Do not use
`boundsFor`. That function pads a known range by 50 m on each side and
reports `{ min: -500, max: 9000 }` when the range is unknown, which is a
culling bound, not a water test.

A sample is sea when it is exactly 0, the Mapterhorn void value seen over
the Pacific and the IJsselmeer, or when it is below −450 m, deeper than the
Dead Sea, which is the AWS open-ocean case. A terrain tile is sea when every
sample of the finest loaded grid covering it, inside that tile, is sea, and
the grid has at least one sample there. One land sample keeps the tile on
the basemap. The Maldives tile at z8 stays land because its highest sample
is 12 m. Schiphol stays land because the tile spans −10 to 7.5 m.

A child that the server does not have, inside a region already marked sea,
is sea and is not requested. A child that arrives is judged from its own
samples, so an island in a zero parent comes back the moment its tile
exists.

This also marks zero-filled inland water. The IJsselmeer centre is every
sample 0, the same encoding as the Pacific, so it becomes the procedural
surface at height 0, which is the height already stored. Lake Michigan at
177 m and the Caspian at −28 m are constant and are not sea. They keep their
photographs. A later pass can point the same shader at a constant non-zero
water surface; this version does not guess which flats are lakes.

Shallow AWS shelf, roughly 0 to −450 m, stays on the current path. A
coastline mask would be a new dataset and is not required to get the open
ocean. Dry land below −450 m would be misread as sea. No such tile turned up
in the sample, and the Dead Sea tile that was fetched runs up to 968 m, so
the mixed shore stays land.

## Flat ground, including water that keeps its photograph

When every sample covering a tile is the same value, at any height, the
geometric error of that tile is the sagitta of one mesh cell on the
ellipsoid, not a quarter of the vertex spacing. Splitting stops once that
sagitta is inside the pixel target. A parent that is merely low-relief, with
a non-zero range, does not qualify: a coarse average can hide a hill. An
exactly constant parent does qualify, and so does a tile's own constant grid.

Land with relief keeps today's error bit for bit. The selector's pinned
digests change only for views that contain a constant tile.

## The surface

Sea is drawn with the terrain patches that remain, at height 0. On
Mapterhorn those samples are already 0, so a ground query there does not
move. On AWS the drawn surface and the ground query over a sea tile become
0 instead of the trench depth. That is a behaviour change on AWS, and it is
the surface a flight wants: the Pacific stops being a 6 km hole. Bathymetry
stays in the elevation tile that was already fetched to make the decision.
Finer bathymetry is not fetched.

There is no second globe under the land. A second full-earth draw would
z-fight the mesh and double the ground pass. Hybrid rendering's rule of no
extra geometry holds for land. Sea and constant tiles are allowed to be
coarser than today. They are not allowed to add a draw.

The fragment colour is a water reflectance written where the imagery plugin
now writes `baseColor`, then the existing terrain-light plugin. That plugin
already has the Sun direction, the sky table, and the cd/m² scale in
[`terrainLightPlugin.ts`](https://github.com/foss-earth/engine/blob/main/src/babylon/imagery/terrainLightPlugin.ts).
One Fresnel term toward the Sun is enough for the surface to read as water
in that scale. The night-light map is not added on a sea fragment.

A sea patch and a land patch are two variants of the same shader, switched
by a define, the way `IMAGERY_ATLAS` is switched today. The variant is
compiled once, when the first sea patch appears. A frame with no sea patch
does not bind it.

These are outside this version, because each one spends the frame time the
skip just recovered:

- An FFT or Tessendorf spectrum, a compute pass, or a texture rebuilt every
  frame.
- A reflection camera, a refraction pass, or screen-space reflections.
- Per-pixel noise with several octaves across the ocean.
- Vertex waves. A few Gerstner components on nearby vertices, fading to zero
  at distance so the horizon stays the ellipsoid the sky was built against,
  can be tried only after the skip is measured and only if the vertex cost
  stays under the mesh cost that was removed. The default is off.

## Settings and the hybrid basemap

`map.ocean` is `surface` or `off`. The default is `surface`. `off` is the
rollback: land and sea both take today's selector, and a land view's planned
keys match the current digest.

Sea tiles are not assigned to either imagery source. The elsewhere basemap
in the hybrid proposal covers land outside the first source's bounds. It
does not cover sea. A coastal tile that fails the sea test is owned by
whichever source the hybrid partition already chooses, so a shoreline keeps
one photograph, not a blend. Blending at the waterline is a later visual
pass and adds shader work this version avoids.

Cartographic ocean ink survives wherever the tile contains land, which is
where labels and boundaries actually are. A pure sea tile of OpenStreetMap
at these zooms is the 103-byte tile. Replacing it does not remove a label
that tile never held. A provider that draws a graticule or a depth figure on
a tile the classifier calls sea would lose that figure. `off` is the switch
for that provider.

## Acceptance

No speedup is claimed until it is measured the way
[Performance](../performance.md) measures a change: interleaved runs, a
control, and the existing counters (imagery requests, atlas slots and bytes,
selection nodes, terrain leaves, elevation requests, mesh commits).

Views:

1. Minneapolis, or the campus tour, at the current detail. With `surface`
   and with `off`, the imagery plan and the terrain leaves match. Frame time
   stays inside the noise of a land run.
2. OpenStreetMap over the Pacific point above, low enough that today's
   selector wants fine leaves. The imagery request count and the atlas bytes
   for sea leaves drop. Land leaves in the same view, if any, still request.
3. AWS Terrarium over that point. Elevation requests stop once the tile is
   known to be entirely below −450 m. The drawn and queried height is 0.
   The terrain leaf count falls because the error is the sagitta.
4. Mapterhorn plus USGS Imagery Topo over that point. Record the result
   separately. Fine tiles already 404, so a small or null frame-time change
   here is an acceptable result, not a failed one, provided the retries and
   the coarse sea pages are gone.
5. Lake Michigan. The photograph stays. The mesh stops splitting once the
   constant 177 m grid is in hand.
6. Schiphol and the Maldives tile. Both stay on the basemap.

Pixels on land are unchanged. Pixels on sea are allowed to change, and they
are pinned only after the reflectance is accepted. The sky's single ground
albedo is unchanged; the atmosphere is not recomputed per surface.

## Order of work

1. The sea test and the constant-grid error, behind `map.ocean`, with the
   land digest as the guard. Measure views 1, 3, and 5 before writing a
   shader.
2. Skip imagery for sea tiles and write the lit reflectance. Measure view 2
   and view 4.
3. Revisit vertex waves only with a profile that shows spare budget against
   the meshes removed in step 1.

A global coastline mask, shallow-shelf bathymetry, and procedural lakes at
their own stage height wait until those measurements say the open-ocean
skip is worth extending.
