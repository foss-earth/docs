# Shared VR TODO

Status: deferred feature, 2026-10-08. **Do not implement VR, provision its
repository or add runtime dependencies during the repository split.** This is
a future ownership boundary, not a claim of headset support or a current tab.

Proposed owner: **`foss-earth/vr`**, shared by FOSS Earth, the UMN tour and
flight. It owns the generic immersive-session lifecycle, tracked views and
input, presentation of shared UI, and integration with renderer resources and
frame scheduling. Globe/panorama navigation and comfort behavior that a
non-flight globe would want belong here or in their existing shared owner.
Preserve one renderer/resource lifecycle rather than adding an independent
render loop beside it.

Hosts supply scene, navigation and content through public contracts. Campus
content and any tour-specific behavior stay in `UMN-VR/tour`; a separate UMN VR
repository is not presently proposed. Shared VR must not import campus or
flight packages. The flight-specific `0sfs/vr` adapter consumes this shared
implementation; it owns cockpit/aircraft interactions and flight reference
frames supplied by the simulator.

## Later design work

- Inventory the renderer's available immersive APIs, browser/backend/headset
  combinations and constraints before selecting an implementation. Do not
  claim that current rendering backends already support the intended VR path.
- Define host ports for scene/reference frames, tracked input and navigation;
  keep physical head tracking separate from user-steered camera motion. Decide
  comfort and accessibility behavior explicitly rather than mechanically
  applying desktop camera inertia to tracked poses.
- Decide the user-facing entry/exit controls and settings home. A VR repository
  does not by itself establish a new tab ID; update the tab inventory when
  that UI is designed. Preserve non-VR use and explicit session activation.
- Validate with representative devices and record the actual supported
  combinations, tracking/input behavior, session teardown and rendering limits.
  Device runs and performance claims are part of that later assignment.

The graphs tentatively show `vr → renderer/ui`, with scene/navigation ports
injected by hosts. These describe the intended direction, not finalized APIs.
Avoid `renderer → vr` or `vr → host application` imports. Refine any additional
shared dependencies during the later design while keeping the graph acyclic.
