# Physical UX

Every interactive surface in FOSS Earth and the applications built on it—the
globe, 360 degree spheres, flat image windows, and compact HUD panels—should
feel like a physical object with mass, momentum, and tactile contact. The user
experience goal is that the map and 360 viewer feel like a physical toy in your
hands: responsive on the first frame, anchored under direct contact, smooth
through momentum, and free of dead zones or geometric traps.

Read this alongside [Camera motion](camera-motion.md),
[UI layout](ui-layout.md), and the panorama
[gesture and anchor guide](https://github.com/foss-earth/sphere-image/blob/main/docs/gesture-anchors.md).

## 1. Direct grabs vs. rate/scroll impulses

Different physical gestures express different intent. Treating every gesture as
a cursor-anchored ray solve—or treating every gesture as an unanchored angular
turn—breaks the physical illusion.

### One-finger press-and-drag and two-touch pinch (Direct grab)

When a person presses a mouse button or touches the screen with one or two
fingers, they are physically grabbing the point on the world or image directly
under that contact:

- **On the globe:** `beginAnchorPan` and `stepAnchorPan` cast a ray to the
  displayed terrain surface and solve the camera pose each frame so that exact
  3D ground point stays under the pointer.
- **Inside a 360 sphere:** `LookModel.drag` and `LookModel.touchPinch` cast a
  common-space unit ray through the surface-local contact point (or two-touch
  midpoint) and solve heading, pitch, and FOV (`anchorSphereCamera`) so that
  image point stays under the finger at any FOV ($10^\circ\text{–}150^\circ$).
  This is the default **Drag → Grab** mode. The optional **Scroll** mode maps
  one-finger and mouse drag deltas to heading and pitch regardless of contact
  position, scaled with FOV and viewport height. It keeps the horizon upright
  and the same release inertia, without a grab anchor. This explicit preference
  avoids the unstable geometry of grabbing near a sphere pole through the top
  or bottom of the screen. Two-touch pinches retain their midpoint anchor.
- **On release:** If the finger was moving within the release window
  (`GLIDE_RELEASE_WINDOW_MS = 80` ms in a sphere, `MOMENTUM_WINDOW_MS = 120` ms
  on the globe), the camera carries the actual angular or surface velocity it
  had at release into its exponential glide. If the person held the finger
  still before lifting, it stops where they placed it.

### Two-finger trackpad swipes (Unanchored impulse)

On a trackpad, a two-finger swipe (`pan` or `orbit` from the wheel classifier)
is a scroll/turn impulse, **not** a grab at the mouse cursor:

- The mouse cursor on a laptop is simply wherever the pointer was last left—often
  near a screen edge, over a pole, or nowhere near the user's attention.
- Anchoring a two-finger swipe to the ray under the cursor causes severe failure
  modes: near the poles or screen edges the grabbed ray quickly becomes
  unreachable or goes off-screen, causing long swipes to stall, twist, or stop
  responding.
- **Rule:** Two-finger trackpad swipes inside a 360 sphere (`LookModel.swipe`)
  must never cast or retain a cursor ray or show an anchor marker. They break
  cleanly into $(dx, dy)$ scroll deltas, scale with the current field of view's
  tangent, and feed directly into the heading and pitch inertia accumulators.

## 2. Impulse-fed exponential inertia across pan, turn, and zoom

To make discrete wheel, swipe, and pinch events feel like pushing a physical
body with mass, both the globe (`InertialCameraController`) and 360 spheres
(`LookModel`) use the same impulse-fed geometric decay:

1. Let $d = 0.5^{\Delta t_{\text{frame}} / t_{1/2}}$ be the per-frame decay factor
   for a 60 Hz reference frame ($\Delta t_{\text{frame}} = 16.\overline{6}\text{ ms}$)
   and half-life $t_{1/2}$ (`camera.inertiaDecay` on the globe;
   `scene.panorama.inertiaHalfLife`, default `100` ms, inside a 360 sphere).
2. When an input impulse $\Delta$ arrives (a 2-finger swipe's angular delta or a
   wheel/pinch zoom's log-tangent delta):
   - Apply $(1 - d)\,\Delta$ immediately on Frame 0 so the view responds on the
     very frame the event arrives.
   - Add $\frac{d(1 - d)\,\Delta}{\Delta t_{\text{frame}}}$ to the velocity
     accumulator (`velocity.heading`, `velocity.pitch`, `velocity.zoom`).
3. On each subsequent frame of duration $\Delta t$, advance the camera by
   $\text{velocity} \times \Delta t$ and multiply velocity by
   $0.5^{\Delta t / t_{1/2}}$.

Because $(1 - d) \sum_{k=0}^{\infty} d^k = 1$, the camera's total integrated
displacement across Frame 0 and the entire glide equals the exact target
displacement $\Delta$, while consecutive events accumulate smoothly into a
single continuous coast.

### Zoom has inertia too

Zoom is never a stepped jump while panning is smooth. Wheel notches, trackpad
pinches (`pinchBy`), and released two-touch pinches (`touchPinch`) feed into the
same exponential inertia (`zoomLogVelocity` on the globe, `velocity.zoom` on
$\ln\tan(\text{fov}/2)$ in 360 spheres):

- **Off-centre zoom anchor retention:** When zooming about an off-centre pointer
  or pinch point, the 360 look model retains the sphere ray under `at` across
  every frame of the zoom glide (`grab.kind === "zoom"`) so the feature being
  magnified stays pinned under the cursor until the zoom settles.

## 3. Zoom-proportional sensitivity ($\tan(\text{fov}/2)$)

A fixed angular turn in degrees per pixel feels natural at a wide $90^\circ$
field of view, but feels uncontrollably sensitive when zoomed in to $20^\circ$.

- Both zoom (`zoomFov`) and two-finger trackpad swipes (`swipeFovScale`) operate
  on the half-angle tangent $\tan(\text{fov}/2)$:
  $$\text{swipeFovScale}(\text{fov}) = \tan\!\left(\frac{\text{fov}}{2}\right)$$
- This is unity ($1.0$) at a $90^\circ$ vertical FOV and scales down
  proportionally as the view narrows, matching the globe's `metersPerPixel`
  scaling so a two-finger swipe moves the image across the screen at the same
  visual speed at every zoom level.

## 4. Poles, limits, and immediate recovery

Physical boundaries must never trap the camera or accumulate invisible "dead
travel" that the user has to unwind before moving back:

- **1-finger drag / 2-touch pinch at a pitch limit:** When the finger pulls past
  `pitchRangeDeg` ($\pm 85^\circ$), the camera stops cleanly at the pitch limit
  while retaining the original grabbed ray. The next frame's solve starts from
  that ray's actual clamped projection on screen, and pulling the finger back
  returns the camera to the original ray when the pointer returns to its path.
- **2-finger swipe at a pole:** Clamping `pitchDeg` at `pitchRangeDeg.min` or
  `max` zeroes `velocity.pitch` immediately while `velocity.heading` continues
  turning and gliding freely around the pole. Swiping back away from the pole
  moves pitch on the very first pixel.
- **Zoom at FOV limits:** Clamping `verticalFovDeg` at `fovRangeDeg.min` or
  `max` zeroes `velocity.zoom` immediately so zoom inertia never pushes against
  a hard stop.

## 5. Visual anchor feedback

Optional anchor markers (`input.showNavigationAnchors` on the map,
`scene.panorama.showAnchors` in 360 images) show the actual world or image point
held by a gesture:

- **Gold (`#fde68a`):** An active contact grab (`drag`, `touchPinch`, or map
  ground grab) or an active zoom impulse (`wheel`, `pinchBy`).
- **Gray (`#a3a3a3`):** Post-release glide (`held: false`), where the marker
  shows the point being carried by momentum until the glide stops.
- **Never on 2-finger sphere swipes:** Because a two-finger trackpad swipe in a
  360 sphere is an unanchored angular impulse, it hides any existing marker and
  never displays one.

