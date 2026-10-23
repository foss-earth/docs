# Shared VR

Status, 2026-10-21: FOSS Earth, the UMN tour and 0SFS enter VR through
`foss-earth/immersive`, from the app's VR tab. Each is tested on an emulated
headset ([Testing as an agent](../agent-testing.md)). None has been tried on a
real headset yet. The 2026-10-08 note deferring VR until after the repository
split no longer holds: the code is in `foss-earth/app`, and the `foss-earth/vr`
repository below is still to come.

## What there is

- **A session** (`app/src/app/immersive/headsetSession.ts`, since cc1c7fd,
  2026-10-17). The VR tab enters an immersive session that draws the globe, or
  the open photograph, for both eyes where the view stands. It has snap turns,
  controller rays that pick and follow links, and the grip to go back to the
  map. On a headset's browser the VR tab opens once, to show the way in.
- **The page's interface around the head** (`headsetUi.ts`, the layout in
  `headsetUiLayout.ts`). A flat page's corners are out of sight in a headset, so:
  - the toolbar is a row below the view that follows the head lazily;
  - the windows dock either side of the view, as the page has them;
  - a single **+** at the toolbar's left end opens a window, or a tab once both
    sides hold one;
  - the grip floats a window anywhere, and letting go near its place docks it
    again;
  - menus, helps and slider tracks are panels of their own, over what opened
    them.

  Each panel draws a copy of a part of the page (`createDomMirror` in
  `foss-earth/ui`), and a controller pointing at it plays a mouse on the page
  there. The trigger presses and the thumbstick scrolls. The page stays the one
  interface: what changes on it changes in the headset. The mirror copies each
  shown part as a layer of its own (`DomMirrorOptions.layers`), so where parts
  overlap on the page, one panel never shows another's part.
- **Vehicles** (`HeadsetPlace.up`, `HeadsetSurface`). An app with a vehicle
  seats the headset in it: the space turns with the vehicle, and there is no
  snap turn. The app may show parts of its page on a surface of its own, such
  as a cockpit's screen. A hand pointing at the surface plays the mouse there,
  and `locate` finds an element on it. What stays in view, such as a vehicle's
  instruments, stands just above the toolbar, either side of the middle. Docked
  windows rise clear of it.
- **An emulated headset for tests** (`app/src/dev/headsetEmulator.ts`,
  `headsetEmulator()` in `foss-earth/vite`). On a dev server only,
  `?headsetEmulator=quest3` puts Meta's Immersive Web Emulation Runtime in
  place of WebXR. `window.__fossEarthHeadset` drives it as a person would, and
  `npm run check:headset` goes through a visit.

## Still to do

- **A real headset.** Comfort, text sharpness through the lenses, hand
  tracking, frame rate and session teardown, on each browser and backend.
  Record the combinations that work.
- **More than two windows.** The page's workspace has two sides, so a headset
  shows at most two windows. More floating windows need more places in the
  workspace.
- **Comfort settings.** Decide them explicitly, rather than applying desktop
  camera inertia to tracked poses: snap-turn angle, a vignette while moving,
  and seated or standing height.

## Ownership

Proposed owner: **`foss-earth/vr`**, shared by FOSS Earth, the UMN tour and
flight. The immersive code moves there from `foss-earth/app` when the split
reaches it. It owns the generic immersive-session lifecycle, tracked views and
input, presentation of shared UI, and integration with renderer resources and
frame scheduling. Globe and panorama navigation, and comfort behaviour that a
non-flight globe would want, belong here or in their existing shared owner.
Keep one renderer and resource lifecycle, not an independent render loop beside
it.

Hosts supply scene, navigation and content through public contracts. Campus
content and any tour-specific behaviour stay in `UMN-VR/tour`; a separate UMN
VR repository is not proposed. Shared VR must not import campus or flight
packages. The flight-specific `0sfs/vr` adapter consumes this shared
implementation. It owns cockpit and aircraft interactions and the flight
reference frames supplied by the simulator.

The graphs show `vr → renderer/ui`, with scene and navigation ports injected by
hosts. Avoid `renderer → vr` or `vr → host application` imports, and keep the
graph acyclic.
