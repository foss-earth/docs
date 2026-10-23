# Testing as an agent

How an agent tests FOSS Earth, 0SFS and the UMN tour on each kind of device
without holding one: a desktop browser, a phone or tablet, and a VR headset.
Each runs in headless Chrome against a dev server, and each reads values from
the page rather than from pictures where it can.

| Device | How | Where it is described |
| --- | --- | --- |
| Desktop | `shots.mjs`, with clicks, keys, drags and printed values | [screenshots.md](https://github.com/foss-earth/browser-testing/blob/main/docs/screenshots.md) |
| Phone or tablet | the same, with `device: "phone"` or `"tablet"` and touch steps | [Phones and tablets](#phones-and-tablets) |
| VR headset | a dev-server page with `?headsetEmulator=quest3`, driven by `window.__fossEarthHeadset` | [VR headsets](#vr-headsets) |
| A real phone | the dev server's printed HTTPS network link or QR code | [development.md](development.md#testing-on-a-phone) |

## Before every test

- **Use one dev server.** FOSS Earth serves `https://localhost:3600/app/`, 0SFS
  `https://localhost:7470/fly/` and the tour `https://localhost:8660/tour/`. A
  server someone else started is theirs: use it, and don't stop or restart it.
  If you need to start one for autonomous checks, use `npm run llm-dev`
  (equivalent to `npm run dev -- --no-qr --no-gkey`).
  This skips the local Google key as well as QR art.
  Stop every server and child process you started before returning unless the
  user explicitly asked to keep it running.
- **Wait until the page shows what it is for.** Every app marks
  `boot:content` on the first frame that draws it: the opening view for the
  app, an aircraft for 0SFS, the scene for a tour. Wait on
  `performance.getEntriesByName("boot:content").length > 0`.
- **Set what a test needs in its address**, not by clicking through settings:
  `?set.<id>=<value>` sets a parameter for that page's session, for example
  `?set.osfs.aircraft.id=f-35b`. The ids are in each app's definitions: FOSS
  Earth's in `app/src/settings/catalogue/`, 0SFS's in
  `src/flight/settings/flightParameters.ts`.
- **Read, don't look.** A `{ print: expression }` step gives a value as JSON.
  Open only the images a run reports `new` or `changed`.
- **Keep shot lists in the repository's ignored `build/`**, next to their
  pictures.
- **After a Chrome run that was killed, timed out or crashed,** run
  `~/gh/foss-earth/browser-testing/scripts/chrome-clones.sh --clean`.

## Hand off local testing

Give the user the command for their own terminal, plus a short list of what to
try. The regular startup prints HTTPS addresses and a QR code for another device.
Do not leave an agent-started server running for the handoff.

| App | Command |
| --- | --- |
| 0SFS | `cd ~/gh/0sfs/fly && npm run dev` |
| FOSS Earth | `cd ~/gh/foss-earth/app && npm run dev` |
| UMN tour | `cd ~/gh/UMN-VR/tour && npm run dev` |

When useful, include a [custom test link](test-feedback.md) that works after
startup. For a phone, have the user open the printed network address or scan its
QR code, then use the same test plan at that address. When local work is ready,
also give the exact applicable source push command(s), after inspecting the
affected repositories' current branches and push remotes, and offer to run them
if asked. Do not push without that specific request; a source push does not
authorize deployment.

## Phones and tablets

A shot with `device: "phone"` (412 by 915) or `"tablet"` (1280 by 800) opens
Chrome as its device mode makes one. The page has a five-point touch screen, a
mobile viewport and an Android user agent, and `(pointer: coarse)` matches as
it does on the device. Touch steps act on the centre of the first visible
match. The page gets trusted touch and pointer events, and a click after a tap.

| Step | What a finger does |
| --- | --- |
| `{ tap: selector }` | taps |
| `{ swipe: selector, by: [dx, dy] }` | one finger, moved by dx, dy CSS px |
| `{ pinch: selector, scale }` | two fingers spread to `scale` times as far apart (above 1 zooms in) |

This list checks that a two-finger pinch on a photograph's link zooms the
photograph, not the page. `?panoramaTest=1` gives the page
`window.__fossEarthPanoramaTest`, through which a test opens a photograph and
reads its view.

```js
// A phone's two-finger pinch on a link in a photograph zooms the photograph, not the page.
const H = "window.__fossEarthPanoramaTest.scenes.handle()";
const ready = `${H}?.status?.entries.length >= 2 && ${H}.status.entries.every(e => e.preview === 'ready')`;
const view = `JSON.stringify({ view: ${H}.status.viewer?.view ?? ${H}.status.view ?? null, pageZoom: visualViewport.scale })`;
const settle = ms => `new Promise(r => setTimeout(r, ${ms}))`;
export default {
  base: "https://localhost:3600/app/", timeoutMs: 110000, freeze: false,
  wait: "performance.getEntriesByName('boot:content').length > 0",
  shots: [{ name: "phone-pinch-link", device: "phone", url: "./?panoramaTest=1&scene=campus-pair", steps: [
    { wait: ready },
    `${H}.enter(${H}.status.entries[0].id, { view: { headingDeg: 0, pitchDeg: 14, verticalFovDeg: 70 } })`,
    { wait: `${H}.hotspots().length > 0 && document.querySelector('.foss-earth-scene-hotspot')` },
    settle(1500), { print: view },
    { pinch: ".foss-earth-scene-hotspot", scale: 2.5 },
    settle(1500), { print: view },   // verticalFovDeg from 70 to about 26; pageZoom stays 1
  ] }],
};
```

The fingers start 0.4 of the target's smaller side apart, and at least 20 px.
Put the target where nothing else lies over it: the 14° pitch here moves the
link out from under a window's resize handle.

## VR headsets

The dev server of each app gives a page opened with `?headsetEmulator=quest3`
(or `quest2`, `questPro`) an emulated headset: Meta's Immersive Web Emulation
Runtime in place of WebXR. Entering VR draws an eye each, side by side, over
the page, so a screenshot shows what the headset would. No build holds the
emulator.

`window.__fossEarthHeadset` uses the headset as a person would. Each verb waits
for the frames that show its result.

| Verb | Does |
| --- | --- |
| `enter()`, `exit()` | starts or ends VR, as Enter VR does: the state once it presents |
| `state()` | the session, the head, every panel (`id`, `kind`, its page box `source`, its `pose`) and what each controller points at |
| `look(rightDeg, upDeg)` | turns the head from ahead |
| `aim(hand, target)` | points `"left"` or `"right"` at a target: what it then points at |
| `tap(target, hand?)` | aims and clicks, the right hand by default |
| `press`, `release`, `click(hand, button?)` | the trigger by default; `"squeeze"` is the grip |
| `stick(hand, x, y)`, `scroll(hand, y, frames?)` | leans the thumbstick; y < 0 is forward, which scrolls a window pointed at |
| `move(panel, rightDeg, upDeg)` | takes a window with the grip and lets it go there |
| `frames(count)` | waits for frames drawn |
| `toLocal(point)`, `toWorld(point)` | a scene point in the headset space, and back |
| `session()` | the page's headset session, for what the verbs don't cover |

A target is one of these:

- **A selector.** The element's centre on the panel that shows it. If no panel
  shows it, the centre on a surface that does, such as 0SFS's cockpit screen.
- **`{ panel, u, v }`.** A point of a panel from its top left, the middle by
  default. The panels are `plus`, `toolbar-<n>`, `instruments-<n>`,
  `window-left`, `window-right` and `popup-<n>`.
- **A point `[x, y, z]`** of the headset space, in metres: x right, y up, and
  −z ahead of where the session started.

In VR the page's interface stands around the head. The toolbar's parts are a
row below the view, with a **+** at its left end that opens the window menu.
A vehicle's instruments stand just above the toolbar, either side of the
middle, as the page has them in its corners. Windows dock either side of the
view, clear of the instruments, and the grip floats one where you let it go.

In 0SFS the headset is seated in the aircraft: the view turns with it, and the
stick does not snap-turn. The toolbar, the windows and the instruments are on
the cockpit screen by default, below the view.
`set.osfs.cockpit.screen.<toolbar|windows|instruments>=hud` moves a part
around the head instead.

```js
// 0SFS in a headset: open the Sky window from the cockpit screen, then from the + with everything in the HUD.
const H = "window.__fossEarthHeadset";
const settle = ms => `new Promise(r => setTimeout(r, ${ms}))`;
const start = [settle(3000), `${H}.enter().then(() => 1)`, settle(2500)];
// A menu item's selector, by its name.
const item = name => `'.foss-earth-window-menu-item:nth-child(' + ([...document.querySelectorAll('.foss-earth-window-menu-item')].findIndex(e => e.textContent.trim() === '${name}') + 1) + ')'`;
const panels = `JSON.stringify(${H}.state().panels.map(p => [p.id, p.pose.center.map(v => +v.toFixed(2))]))`;
const HUD = ["toolbar", "windows", "instruments"].map(part => `&set.osfs.cockpit.screen.${part}=hud`).join("");
export default {
  base: "https://localhost:7470/fly/", width: 1280, height: 800, timeoutMs: 110000, freeze: false,
  wait: "performance.getEntriesByName('boot:content').length > 0",
  shots: [
    { name: "vr-screen-window", url: "./?headsetEmulator=quest3&set.osfs.aircraft.id=f-35b", steps: [...start,
      `${H}.look(0, -35).then(() => 1)`,
      `${H}.tap(".foss-earth-panel-launcher-button").then(() => 1)`, settle(800),
      `${H}.tap(${item("Sky")}).then(() => 1)`, settle(1500),
      { print: "[...document.querySelectorAll('.foss-earth-dock-panel')].map(e => e.dataset.side)" }] },
    { name: "vr-hud-window", url: `./?headsetEmulator=quest3&set.osfs.aircraft.id=f-35b${HUD}`, steps: [...start,
      `${H}.tap({ panel: "plus" }).then(() => 1)`, settle(800),
      `${H}.tap(${item("Sky")}).then(() => 1)`, settle(1500),
      { print: panels }] },
  ],
};
```

Take headset shots with `freeze: false` and a `timeoutMs` of up to 110000, as
these lists do. End a verb's step with `.then(() => 1)` or a small value, so
that the step doesn't return the whole state.

### The checks

`npm run check:headset` in `~/gh/foss-earth/app` goes through a visit as a
person in a headset would, in 27 checks. It enters VR, looks about, snap-turns,
opens a photograph from the map with the trigger, follows a link, and goes back
to the map with the grip. Then it opens a window from the **+**, scrolls it,
floats it and docks it again, presses a toolbar button, and ends the session.
The report and pictures go to `build/headset/<time>/`.

```sh
npm run check:headset                                                            # starts its own dev server
npm run check:headset -- --url=https://localhost:3600/app/                       # a running one
npm run check:headset -- --url=https://localhost:8660/tour/<page>/ --scene=page  # a tour page's own scene
```

### What the emulator does not show

- **In a desktop screenshot, the page's own popovers and tooltips also draw
  over the emulator's picture**, such as a slider's track. They are the flat
  page's, not the headset's. A popup the headset shows is a `popup-<n>` panel
  in `state()`.
- It cannot judge comfort, text sharpness through real lenses, hand tracking
  or the device's frame rate. Those need the headset: list them for the
  person to check by hand.
- The controllers do not fly an aircraft yet.
