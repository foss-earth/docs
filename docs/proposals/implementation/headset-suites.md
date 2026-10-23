# Headset test suites

Status: implementation contract for the automated Quest and Vision Pro visits. The code that follows this document lives in `foss-earth/app`. The UMN tour and 0SFS mount that app and do not keep a second headset suite.

Date: 2026-10-22.

## 1. Outcome

VR has two branches. A profile is one or the other, and a visit runs only that branch.

| Branch | Profiles | Input | Visit |
| --- | --- | --- | --- |
| Controller | `quest2`, `quest3`, `questPro` | Trigger, grip, thumbstick, a ray that stays on | The controller visit |
| Controllerless | `visionpro` | One `transient-pointer` for the length of a pinch, then nothing | The controllerless visit |

Two automated suites, one Chrome at a time:

| Suite | Command | Devices | Visit |
| --- | --- | --- | --- |
| Fast, the default | `npm run check:headset` | Quest 2 | The controller visit |
| One named device | `npm run check:headset -- --device=quest2\|quest3\|questPro\|visionpro` | That device | Its own branch. A Quest runs the controller visit. Vision Pro runs the controllerless visit |
| Comprehensive | `npm run check:headset -- --comprehensive` | Quest 2, then Quest 3, then Vision Pro | The controller visit twice, then the controllerless visit |

`--comprehensive` and `--device` together are an error. The comprehensive run stops at the first failing visit. A `--url` page is reused; otherwise each visit starts the app dev server. Reports go under `build/headset/`. A single visit writes `report.json` in that directory. A comprehensive run writes one directory per device plus a summary `report.json`.

Quest 2 is the default because it is one session and because its controller is the older Touch profile. It is not a lighter render. IWER 2.5.0 gives every headset the same eye buffers (the Chrome window), the same 63 mm separation, and the same 90° field of view.

## 2. What the two visits are allowed to claim

The controller visit is the visit `check:headset` already runs, in `headset-controller.mjs`: enter VR, both eyes, head look, a 30° snap turn, a photograph opened with the trigger, a link followed, the grip back to the map, the toolbar, scrolling, floating a window, a toolbar press, and session end. While that session presents, the VR tab lists Trigger, Grip, the thumbstick, and +. The page is opened with the dropdown tab picker, so + opens the window menu the visit chooses from. The app's own default opens a new tab instead.

The controllerless visit, in `headset-controllerless.mjs`, checks the Vision Pro contract only. While that session presents, the VR tab lists Pinch and +, and does not list a grip or a thumbstick.

- The runtime name is `Apple Vision Pro`. An unknown `headsetEmulator` value must not install Quest 3.
- `immersive-vr` is supported and `immersive-ar` is not.
- The page starts on WebGL 2. WebGPU still refuses the VR tab.
- Enter VR, both eyes side by side, head look, and session end behave as on Quest.
- `inputSources` is empty until a pinch and empty again after the pinch ends.
- One pinch opens the photograph the ray meets, a second pinch follows one of its links, a pinch opens a window from +, and a pinch presses a toolbar button when the page has one.

The controllerless visit does not assert snap turn, thumbstick scroll, grip, a laser that stays on between pinches, or hover-then-click. Those need a controller. Comfort, lens sharpness, and frame rate stay a real headset, on WebGL 2, and are outside both suites.

## 3. Profiles

`?headsetEmulator=` accepts `quest2`, `quest3`, `questPro`, and `visionpro`. Any other value, including an empty one, throws before installing a runtime.

`visionpro` is an IWER `XRDevice` with no controller config, so its controller list is empty. It advertises `inline` and `immersive-vr`, the features `viewer`, `local`, and `local-floor`, and a 90 Hz nominal rate. It does not advertise `immersive-ar`, hand tracking, or gaze tracking. Its user agent stays a Chrome string, the same shape as the Quest profiles, so the page boots the renderer the Quest visit boots. The device name carries the identity.

The dev server still injects the emulator only while serving, and only when the query parameter is present. A build does not contain it.

## 4. Pinch double

IWER 2.5.0 can represent `transient-pointer` and never constructs one. The double installs over `activeInputs` for the Vision Pro device:

- At rest the list is empty. Hands and gaze are not substituted.
- `begin` connects one source for the next frames. Its `targetRayMode` is `transient-pointer`, its handedness is `none`, and it has no gamepad, so the thumbstick and squeeze paths do not see it.
- The ray starts at the headset and looks at a point in the session's local space. The point is moved into IWER's global space with the same origin transform controller `look_at` uses (`transformXROriginToGlobal` on the 2.5.0 remote).
- The first frame of a pinch fires `selectstart`. A later frame fires `select`, then `selectend`, then disconnects the source. `select` is the completed pinch, which is what `tookThisFrame` already treats as belonging to the interface when `selectstart` pressed a panel.

`window.__fossEarthHeadset.pinch(target)` aims and runs that sequence. A target is the same selector, panel point, or `[x, y, z]` the controller verbs take. On a Quest profile, `pinch` throws. `press`, `stick`, and `move` throw on Vision Pro.

`state().sources` is the current `targetRayMode` list.

## 5. Separate UX

The VR tab shows one list, and only while a session is presenting.

- A tracked pointer with a gamepad is the controller list: Trigger, Grip, Thumbstick up or down, Thumbstick left or right, +.
- A presenting session with no such source is the controllerless list: Pinch and +. It does not mention a grip or a thumbstick.
- Before the session presents, and after it ends, the branch is unknown and the list is hidden. Empty input for the first few frames stays unlabeled, so a controller that connects immediately is not shown the pinch list.

Controller `selectstart` is unchanged: it presses the hit cached from earlier frames. Controllerless `selectstart` hit-tests that event's ray in the same turn (`point`, which calls `follow` with that one ray) and then presses. `follow` itself is unchanged. `select` still reads the event pose for a photograph or a link, and a press the interface took is not also a tour selection.

No controllerless gesture stands in for grip or the thumbstick. The controllerless visit does not go back to the map, scroll, snap-turn, or float a window.

## 6. Files

| File | Change |
| --- | --- |
| `app/src/dev/headsetProfiles.ts` | The four profiles and the refusal of any other name |
| `app/src/dev/transientPinch.ts` | The Vision Pro device config and the pinch source |
| `app/src/dev/headsetEmulator.ts` | Install the named profile; add `pinch` and `sources` |
| `app/src/app/immersive/headsetUi.ts` | `point(ray)` calls `follow` with that ray. `follow` is unchanged. A press lands on the page beneath the emulator picture |
| `app/src/app/immersive/headsetSession.ts` | `branch`. Transient-pointer `selectstart` calls `point` before `press`. Controller `selectstart` does not |
| `app/src/app/immersive/headsetPanel.ts` | Controller list and controllerless list. The presenting branch picks one |
| `app/scripts/validation/headset-emulator.mjs` | Default Quest 2, `--device`, `--comprehensive`, then one visit |
| `app/scripts/validation/headset-controller.mjs` | The controller visit |
| `app/scripts/validation/headset-controllerless.mjs` | The controllerless visit |
| `app/README.md`, `docs/docs/agent-testing.md`, `docs/docs/proposals/vr.md` | The commands and the two visits |
| `UMN-VR/tour/vite.config.ts` | Comment lists the profiles |

## 7. Verification

Unit tests cover option parsing, the profile table, and that a Vision Pro device has no inputs until a pinch begins, then one `transient-pointer` with no gamepad, then none after the end frame.

`npm run check:headset` is the fast Quest 2 visit. `npm run check:headset -- --comprehensive` is the three-device run. Both need Chrome, WebGL 2, and the network. They are not part of `npm test`.
