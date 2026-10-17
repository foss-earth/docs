# Camera motion

The camera is a physical thing with mass and momentum. It never jumps, it
never stops dead, and it never ignores the person moving it. These rules hold for
the globe camera and for every camera a person steers in FOSS Earth and in the
applications built on it, 0SFS and the campus tour included. Read them before you
add or change a camera animation, a transition between modes, a handover of the
camera from one owner to another, or an input handler.

They come from the flights into and out of 360 images (September 2026). The user
asked for a flight cut short to "switch from moving in the animation to slowing
down to standstill" and said it had to "respect conservation of momentum". A first
version braked while the scene still held the camera, and ignored the swipe that
cut it short until the user lifted and swiped again, which was "very frustrating".
The version that follows these rules is the one the user called "so real, so
intuitive, so physical": "the camera really feels like a physical thing with mass
and momentum". The history and the tests are in
[panorama-scenes.md](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/docs/proposals/panorama-scenes.md) under "Flying in and out".

## The rules

### 1. It never jumps

Position, look direction, roll and field of view change continuously while a
person watches. An animation that is cut short does not snap back to where it
began or on to where it would have ended. It stops where it got to and goes on
from there under rules 2 and 3.

A cut, meaning a fade to a different view, is honest where the motion would be
impossible or unwanted: reduced motion, a place the camera cannot reach, or a
view behind the camera. A snap between two poses that looks like motion is not.

### 2. It keeps its momentum at every handover

When control of the camera passes to another owner, the camera keeps the
velocity and turn it had. The owners include an animation, the person, a
panorama holding navigation, and the globe's own glide. Whoever takes over
slows it, and does not stop it cold or start it over.

When a flight is cut short, its eye velocity (m/s) and look turn (1/s) become the
globe's own pan, orbit and zoom rates, and its glide slows them as it slows a flick.

### 3. The person's input acts at once, and keeps acting

The moment the person gives input, the camera is theirs. Nothing holds the camera
while their input waits. For example, braking out an animation first and handing
over later is wrong. The input that interrupts something is not spent on
interrupting it: a swipe goes on panning, and a press becomes a drag from where
the pointer is. The person never has to lift and start again because the program
was busy.

A drag grabs the ground. A mouse press or a finger takes hold of the displayed
surface under it (the terrain, not the ellipsoid beneath it) and the camera
keeps that point under the pointer. Heading, tilt and distance stay as they are.
The same marker as a zoom or a turn shows the grabbed point from the press until
the glide after release has stopped. `camera.grabFollowMs`, Controls → Camera →
Grab follow time, is 0 by default, which holds the point on the pointer. A longer
time brings it there as a critically damped spring that never overshoots. When
the pointer lets go, the grab carries on at the speed it was moving, in screen
pixels per second. The globe keeps feeding that speed for `TRACKPAD_MOMENTUM_MS`,
shrinking the way a swipe's wheel events do, and `camera.inertiaDecay` slows it
once per 60 Hz frame, so the same flick covers about the same ground on a faster
display. The marker stays on the grabbed ground through that glide. While the
finger is down it is the anchor colour, because the grab is holding that point
under the pointer. Once the finger is up it turns gray: the point is only
being shown, and the grab is not holding the camera. A zoom's ground mark does
the same, the anchor colour while its pinch or wheel events are still arriving,
and gray once only its glide is left. Gold and gray are only that: input
still arriving, or only the glide. A mark behind the ground keeps whichever
of those colours it has. Being hidden is an X painted on that coloured ink
([Kept on purpose](#kept-on-purpose)). A drag that
starts on the sky, or on a point of interest, does not grab. A second finger
landing ends the grab: the pair zooms and turns, and the finger left takes a
grab of its own.

With the developer tool `input.showCompassCenter` (Controls → Orbit → Show
compass center, listed only on a page opened with `?dev=1`, off by default), a turn or tilt about the compass target, which is the middle of the
view, shows a faint ball standing there in the world: about 52 px across, at 22%
opacity while the input arrives. From the release it fades with the glide's
speed, its opacity the share of the speed it had when let go, so it is gone
when the turn stops. It is the only mark of a turn that holds no point of the
ground, so a twist that holds the ground, a drag, a pinned point and a zoom
never show it. It is shown where `GlideAnchors.compass` says the orbit under
way has no anchor point.

The ball is a sphere impostor in Babylon, `src/visualization/compassCenterSphere.ts`:
one camera-facing quad whose fragment shader shades a lit ball from the quad's
own coordinates, with no texture and the same one-pixel rim at any pixel ratio.
Its vertex shader faces and sizes it, so a frame only moves the mesh and sets
its opacity. It is placed at the front of the ball, so the ground behind the
center does not cut it, while buildings and hills in front of it hide it. It
never writes depth. Hidden, it is disabled. Its module is fetched only when the
setting is switched on, so a visitor's page never downloads it.

Two fingers that twist in place can grab too, as in Google Maps. With
`input.touch.twistTurn` (Controls → Touch → Twist to turn, on by default),
a pair that twists past `input.touch.twistThreshold` (15° by default) takes
hold of the ground under its midpoint until it lifts. Its twist turns the view
about that ground, as far as the fingers turn. Its spread zooms toward it, as
far as they spread. Its midpoint drags it along. It no longer tilts. Whatever
the pair had set moving stops when it takes hold, because the ground is held
now. The twist before the threshold is not applied, so nothing jumps. Letting
go glides on, turning and zooming about that point at the speed the fingers
had, fed and slowed like a grab. A twist that starts on the sky, or on a point
of interest, does not grab: the pair stays a swipe and a pinch. A two-finger
swipe still turns and tilts the view about the compass.

### 4. Only the person's input is input

A trackpad's glide after the fingers lift is the system's: a stream of wheel
events that belongs to the gesture that started it. A wheel event within
`WHEEL_GESTURE_IDLE_MS` of the previous one continues its gesture. A measured
two-finger swipe kept sending those events for about 1100 ms after its
strongest sample, and they got smaller. A pinch, a button-drag turn and a
one-finger pan stop when the fingers do, so the globe feeds them for that
same stretch (`TRACKPAD_MOMENTUM_MS`), shrinking the same way, and
`camera.inertiaDecay` slows the result. A one-finger pan is fed at the speed
the drag already had, so letting go keeps that speed and then shrinks it. A
swipe is left to the trackpad, so it is not fed twice.

- **Gestures already under way are not new input.** An animation is cut short only
  by a gesture that began after the animation did. A glide still arriving from
  before it never interrupts it.
- **A gesture from before a handover does not follow the camera over.** It belonged
  to the previous owner, so the new owner ignores it to its end. Momentum from
  turning a 360 image never pans the map, and momentum from panning the map
  never turns the image.
- **The gesture that took the camera over does follow.** That is rule 3.
- **A swipe over the controls is input too.** A two-finger swipe or a pinch over a
  panel that cannot scroll that way, over the HUD bar or over an instrument moves
  the camera as it would over the map, whichever camera has the canvas
  (`passToWorld.ts`). A camera swipe that drifts over a panel stays the camera's
  to its end, and a scroll that drifts off its panel stays a scroll; the first
  event of a gesture decides. On 2026-10-07 a sideways swipe over the Debug tab,
  meant for the camera, went Back a page.

### 5. One friction

Every glide slows by the same share of its speed each 60 Hz frame:
`camera.inertiaDecay`, Controls → Camera → Glide. Anything that changes alongside a
glide follows the same curve, so everything settles together and the person tunes
it in one place. Examples are a field of view easing back to the globe's, and a
sphere shrinking back into its orb.

Do not add a second decay, a fixed-duration ease-out or a separate stopping time
for camera motion.

### 6. Limits bend; they don't snap

A camera handed back where a limit would not allow it may stay there. It comes no
further past the limit than its glide takes it, and the limit holds again once it
is back inside. The zoom limit works this way after a flight ends near an orb.

Where a limit cannot bend, the camera jumps to the nearest allowed pose. That
happens when the globe camera cannot look above the horizon, or cannot roll. Keep
such cases rare and say so in the feature's documentation.

### 7. Automatic corrections are continuous, and avoided at handovers

Ground following, the orbit target's height and similar corrections move the
camera at a bounded rate, never in one step. At a handover, choose the state that
needs no correction. For example, a camera handed back orbits the point where its
line of sight comes down to the height the globe keeps its orbit target at, so
ground following has nothing to fix.

A view nobody has moved since it was set follows the ground the map shows as it
loads: map tiles appear flat and then take their terrain, and the view rises with
them at the ground following's rate. It goes straight onto the ground only where
it would otherwise be under it: when it was set before any ground there was
known, or when the ground came up past the eye.

Starting to track a point is a correction too: the centre eases onto the tracked
point at the glide's pace (`camera.inertiaDecay`) rather than jumping to it.
Choosing where zoom acts (`input.zoomCenter`, and `input.*.zoomAnchor` while that
is the ground anchor) never moves the camera by itself. A turn stays on the
compass: the centre does not run out to where a shallow look meets the ground.
A twist that holds the ground is the one turn that is not about the compass:
it turns about the ground the fingers hold, and the centre goes where the new
look comes down to the orbit target's height.
A zoom toward a ground point keeps that point where it is on screen, and the
centre stays where the line of sight comes down to the orbit target's height.
A zoom toward the view centre keeps the compass where it is. A point picked
nearer or farther than the zoom limits allow is left there; the camera may move
back toward the limits, not further past them.

### 8. Motion reads as steady

Motion should look like one object moving, not like several animations running
side by side.

- Distance toward or away from a thing changes by the same factor each moment,
  so it grows or shrinks on screen at a steady rate.
- Turning and travelling happen together.
- Easing starts and ends at rest; smoothstep is the default.
- Durations are parameters with units, bounds and reasons ([Settings](proposals/settings.md)).

### 9. Stopping something is not also clicking it

A press that interrupts an animation or a glide is the person grabbing the
camera, so it is not also a click on whatever lies under the pointer. Otherwise,
stopping a flight into an orb would enter the orb again.

### 10. Reduced motion is honoured

Under `prefers-reduced-motion`, or the scene's Reduce setting, the camera does not
travel. It cuts with a short fade, and nothing glides.

## Where it is built

| Piece | Where |
| --- | --- |
| The globe's glide, and its caps per frame | `createInertialCameraController` in `src/input/inertialCameraController.ts`, decay `camera.inertiaDecay` |
| Placing the camera anywhere while an owner holds navigation | `placeNavigationCamera` in `src/engine/babylon/createBabylonRuntime.ts` |
| Handing it back moving: orbit, glide, field of view, input carried on | `glideNavigationCamera` there, with `NavigationGlide` in `navigationLease.ts` |
| The orbit that holds an eye and look, and motion as pan, orbit and zoom rates | `orbitCenterOnSight`, `orbitGlideRates` and `withinTilt` in `src/camera/cameraGlide.ts` |
| A closer zoom limit after a handback, until the camera is back outside it | `CameraController.allowNearer` in `src/camera/cameraState.ts` |
| Which wheel event begins a gesture, and when | `watchWheelGestures` in `src/input/wheelController.ts` |
| Swipes and pinches over the controls that none of them uses, handed to the canvas | `passUnusedInputToWorld` in `src/input/passToWorld.ts`, started by the runtime |
| Input carried on, or ignored, when the globe gets input back | `InputHandback` in `src/browser/createInputController.ts`, `heldPress` in `mouseController.ts`, `heldTouches` in `touchController.ts`; the fingers come from `NavigationGlide.touches` |
| Where zoom and rotation act, and the pinned point | `createNavigationAnchorService` in `src/babylon/navigationAnchorService.ts`, choices in `src/input/navigationAnchors.ts` |
| Grabbing the ground: the point held under the pointer, its marker, and the glide on letting go | `CameraController.beginAnchorPan`, `stepAnchorPan` and `endAnchorPan` in `src/babylon/cameraState.ts`, stepped each frame by `createGlobeInertia` in `globeInertia.ts`; the ground from `NavigationAnchorService.groundAt`; the marker in `src/browser/navigationAnchorMarkers.ts` |
| The ball at the compass center while the view turns about it, and its fade | `GlideAnchors.compass` from `createInertialCameraController` in `src/input/inertialCameraController.ts`; the ball in `src/visualization/compassCenterSphere.ts`, shown by `createGlobeRuntime` |
| A two-finger twist that holds the ground: when it counts, the turn and zoom about the held point, and the glide on letting go | `detectTwist` and `applyTwist` in `src/browser/touchController.ts`; `CameraController.twistAbout` and `twistAnchorPan` in `src/babylon/cameraState.ts`, turning with `turnAbout` in `src/camera/anchoredMotion.ts`; the glide in `createGlobeInertia` in `globeInertia.ts` |
| The feed after a pinch, a button-drag turn, or a one-finger pan, for `TRACKPAD_MOMENTUM_MS` | `trackpadMomentumFraction` in `src/input/trackpadMomentum.ts`, armed from the pointer, touch, Safari, and pinch-wheel handlers; a two-finger swipe is not armed |
| The collision nudge kept out of Babylon's scratch vector, so a zoom does not walk east | `keepCollisionOffset` in `src/babylon/globeCamera.ts` |
| Zoom and rotation about a point, keeping it on screen | `CameraController.zoomAbout` and `orbitAbout` in `src/babylon/cameraState.ts`, with `src/camera/anchoredMotion.ts` |
| Each glide keeping the point its gesture chose | the per-channel anchors in `createInertialCameraController` |
| Easing onto a tracked point | `createPoiTracking` in `src/layers/poiTracking.ts` |
| A flight's velocity where it got to, and the glide's settling curve | `flightMotion` and `glideSettling` in `src/scenes/panoramaFlight.ts` |
| The flights, their cuts and the orb's return | `enter`, `leave`, `handBack` and `fadeSphere` in `src/scenes/loadScene.ts` |

## Checklist for camera work

Before calling a camera change done, check each of these, and write a test for it
where a unit test can express it:

1. **Cut short at any moment:** what happens if the person interrupts at 10 %, 50 % and 90 %? The camera stays where it got to, and the first pose after the handover equals the last pose before it.
2. **Momentum:** the camera carries the velocity and turn it had, in direction and size, and slows by `camera.inertiaDecay`.
3. **Input:** a swipe, a mouse drag or the fingers that interrupt act on the camera at once and keep acting; Escape leaves it gliding.
4. **Momentum is not input:** a trackpad glide still arriving from before neither interrupts the animation nor moves the camera after a handover.
5. **Nothing snaps:** check field of view, roll, tilt, distance limits and the orbit target's height across every handover. List any snap that cannot be avoided in the feature's docs.
6. **Clicks:** the press that stopped something did not also activate what was under it.
7. **Reduced motion:** a cut with a fade, no travel.
8. **Parameters:** every duration and rate is a setting with unit, bounds, default and reason. Friction is `camera.inertiaDecay`, not a new constant.

## Kept on purpose

Settled in October 2026. Leave them as they are.

The streamed ground is not a physics world. The camera is one body, moved by
forces and by `camera.inertiaDecay`. The tiles stay geometry the camera reads.
Safe space (`camera.safeSpace`) is on by default. Altitude changes only
while the ground enters the sphere around the camera
(`camera.safeSpace.clearance`, 15 m), no faster than Safe space acceleration
(`camera.safeSpace.acceleration`, 60 m/s²).

A two-finger swipe already coasts. On the measured trackpad the wheel events
kept arriving for 1083 ms after the strongest sample, and they got smaller.
The globe leaves that stream alone. A pinch and a button-drag turn stop with
the fingers, so `trackpadMomentumFraction` feeds them for
`TRACKPAD_MOMENTUM_MS` (1100 ms), `exp(-3 × elapsed / 1100)`, and
`camera.inertiaDecay` slows what that feed added. A one-finger grab is fed at
the speed the drag already had, so letting go holds that speed and then
shrinks it. Shift+wheel orbit and a mouse-notch zoom are left alone: a wheel
stream may already carry the system's glide. A vertical-only integer pixel
wheel delta is that notch (`wheelZoom`). A two-finger click is the orbit
button. The gesture pad in `experiments` reports the operating system's
stream with this feed off.

A phone pinch or two-finger turn uses that same tail. A reload on a phone in
October 2026 found the current numbers passable, so leave them. The coast
speed is the average of the last `MOMENTUM_WINDOW_MS` (120) in
`src/input/inertialCameraController.ts`. A gesture that has already slowed
before the fingers lift has almost nothing in that window, so it stops. On a
touch screen, `ORBIT_ACTIVATION_PX` (4) in `src/browser/touchController.ts` is
both how far the two-finger centre must move before a turn counts and how far
a finger left down may drift before that coast is cancelled and a grab starts.
`TOUCH_MAX_DELTA_PX` (80) drops an orbit frame whose centre jumps further than
that, so a smooth turn is remembered and a jerky one can lose the frames that
would have made the coast. `ZOOM_ACTIVATION_LOG` is `ln(1.05)`: the finger gap
must change about 5% before a pinch counts. `PINCH_RELEASE_GAP_MS` (48) treats
a quiet that long as the pinch ending, and the next small movement then
replaces the coast. Glide and `TRACKPAD_MOMENTUM_MS` change how long a coast
lasts once it has started. `camera.orbitForce` and `camera.zoomForce` scale
the push. They do not decide whether the coast is kept.

A twist counts when the pair has turned past the threshold in its recent
motion and is in place. Recent means the last `TWIST_MEMORY_PX` (100) of
fingertip travel, or the gap between the fingers when that is wider, so older
turning fades as new motion comes in. In place means the fingertips travel at
least `TWIST_IN_PLACE_RATIO` (0.5) as far turning as the midpoint travels. A
twist about one still finger moves the midpoint as far as it turns them, and a
swipe hardly turns them. Fingers closer than `TWIST_MIN_SPAN_PX` (40) give no
direction. A turn of more than `TWIST_MAX_STEP_RAD` (45°) in one frame is a
glitch. The turn is about the vertical through the Earth's centre and the held
point (`turnAbout`), not the WGS84 one. A level look turned about that axis
stays level. Looking almost straight down, the WGS84 axis rolled the look, and
levelling it again turned the view 17% further than the fingers at 89° tilt,
so the ground slid out from under them. The heading the compass then shows
can differ from the twist by a few hundredths of a degree.

The grab marker does not drag the camera. Release ends the grab. The mark is
the ground point remembered for the glide. The grab's own step holds the
release speed and puts back the share `camera.inertiaDecay` took off, in the
proportion a swipe's later wheel events still have. Pouring that release into
the shared pan velocity speeds the camera up, and a faster display then
travels further.

Gold and gray mean live and gliding. The anchor colour `#fde68a` is a grab
whose finger is down, or a zoom whose pinch or wheel events are still
arriving. The coast colour `#a3a3a3`
(`--foss-earth-navigation-anchor-coast-color`) is only the glide. A point
behind the ground keeps that colour. An X, one cell `M 0 0 L 3 3 M 3 0 L 0 3`,
is painted with the same stroke as the coloured ink. Lines across the empty
part of the marker, a fade, and a second colour were each tried for "behind"
and rejected: the empty box looked crossed out, and colour was already live
or gliding.

A zoom walks east if the collision nudge stays in Babylon's scratch vector.
`GeospatialCamera._getCollisionOffset` returns `TmpVectors.Vector3[6]`, and
recovering yaw reuses that vector as geographic east, so each zoom step adds
about a metre east. `keepCollisionOffset` copies the nudge into a vector the
globe owns. Leave `node_modules` alone. A `new GeospatialCamera` that skips
that copy still walks.

Unified inertia only scales the push. `camera.panForce`, `camera.orbitForce`
and `camera.zoomForce` default to 1. A pan still slides the ground, a turn is
still about the compass, and a zoom still moves toward its anchor. A single
six-degree body was removed: it orbited where the camera stood, zoomed to the
screen centre, and broke pan.

## Known gaps

- **Touch, on devices.** A touch that interrupts a flight carries on as the globe
  gesture it is: one finger pans and two pinch and turn from where they are, about
  the point under their midpoint when they landed. A phone check found pinch and
  turn coasting once a finger left after the gesture stays still. The gates that
  still drop a coast are in Kept on purpose. Dragging that leftover finger takes
  the camera over.
- **Looking up.** The globe camera cannot look above the horizon. An exit from a
  360 image cut short in its first moments, from a view looking up, snaps the tilt
  to the horizon.
- **Only the panorama flights so far.** They are the only animations built this
  way. Map transitions elsewhere, such as the overview a scene applies or the
  camera moves in 0SFS, have not been checked against these rules. Bring each one
  in line when you next work on it.
- **Unified inertia is on.** `camera.unifiedInertia` (Controls → Camera) defaults
  on. `camera.panForce`, `camera.orbitForce` and `camera.zoomForce` scale the
  same pan, turn and zoom; each defaults to 1, which is the usual push. A pan
  still slides the ground, a turn is still about the compass, and a zoom still
  moves toward its anchor. Glide is still `camera.inertiaDecay`. Turning where
  the camera stands is `camera.orbitInPlace`, off by default and not part of
  this. Zooming toward the centre of the view is Zoom center.
- **Safe space is on.** `camera.safeSpace` (Controls → Camera) defaults on,
  with `camera.safeSpace.clearance` at 15 m and `camera.safeSpace.acceleration`
  at 60 m/s². A pan, a grab or a zoom keeps the camera's altitude. The ground
  pushes the camera up only while it is inside that sphere, and leftover
  upward speed slows by `camera.inertiaDecay`. The ground does not pull the
  camera down, and a view set over a point still starts on the ground there.
  Off, the orbit point follows the ground again. The old ids
  (`camera.eyeContact`, `camera.eyeContactAcceleration`, `camera.eyeClearance`)
  are not parameters, so a saved record drops that branch and keeps every
  other saved value.
- **Twist to turn, on devices.** The threshold, the in-place test and the
  glide after a twist are covered by unit tests and the real camera, not yet
  by a phone. Only the ground under the midpoint is held exactly. From above,
  the ground under each finger stays within about a pixel. Tilted, the
  ground under the outer fingers drifts as the view turns about the vertical,
  as in Google Maps.
- **Phone check of the grab coast and the ground mark.** The one-finger coast,
  gray while only gliding, and the X on a hidden mark are covered by unit
  tests. They have not been confirmed on a phone.
- **Zoom armed with no sample.** `isActive` stays true while a zoom tail is
  armed even when no zoom sample was stored, so drawing can be asked for with
  nothing moving. `cancel()` clears it. Still open.
