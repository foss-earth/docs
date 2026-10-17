# Development

Current split checkout/bootstrap guidance is in [setup](../setup.md) and the
[globe application owner](https://github.com/foss-earth/foss-earth.github.io).
The single-checkout instructions below are retained from the original Earth
source revision. Their sibling source link and build commands are historical;
they are not the independent split application's setup contract. No current
bootstrap or device qualification is established by retaining them.

## Historical application setup

This page is for people who want to change the code. If you just want to use FOSS Earth, open
[the live site](https://foss-earth.github.io/) — it is the same build, always current,
and needs no setup.

## Requirements

- Node.js 22 or newer
- npm
- A built checkout of [gamepad-tools](https://github.com/Felipegalind0/gamepad-tools) beside this
  one (see below)
- Optional: a Google Maps Tiles API key with the Maps Tiles API enabled

## Running locally

FOSS Earth takes its controller and keyboard bindings from gamepad-tools, linked from a sibling
folder: `package.json` depends on `file:../Felipegalind0/gamepad-tools`. A fresh clone of this
repository alone fails `npm ci`. Clone both into the same parent folder:

```text
<parent>/
├── foss-earth/              this repository
└── Felipegalind0/
    └── gamepad-tools/
```

gamepad-tools does not commit its compiled output. Its package exports point at `dist/`, which is
gitignored, so build it before installing here:

```sh
git clone https://github.com/Felipegalind0/gamepad-tools.git Felipegalind0/gamepad-tools
(cd Felipegalind0/gamepad-tools && npm install && npm run build)
git clone https://github.com/foss-earth/foss-earth.github.io.git foss-earth
cd foss-earth
npm ci
npm run dev
```

Open the Vite URL printed by the dev server.

npm links the sibling folder instead of copying it, so FOSS Earth sees changes there without
reinstalling. But its code is read from `dist/`, so run `npm run build` in gamepad-tools after
changing its source. Its `styles.css` is the one export read straight from `src/`.

## Google Photorealistic 3D Tiles

The free raster basemaps need no key. To enable Google's Photorealistic 3D Tiles, paste your own
Maps Tiles API key in Map → Source, or pass it once as a query parameter:

```text
http://127.0.0.1:5173/?key=YOUR_GOOGLE_MAPS_API_KEY
```

The app saves the key in this origin's local storage and removes it from the address bar, so later
visits need no `?key=` and links you copy do not carry it. Without a key the app starts in fallback
mode and shows the fallback notice in the lower-left corner. The key is never committed or sent
anywhere but Google.

## Testing on a phone

To open a local server on a phone without typing its address, serve on the local network and
scan a QR code:

```sh
npm run dev -- --host        # or: npm run build && npm run preview -- --host
npm run qr                   # in another terminal
```

`npm run qr` ([scripts/lan-qr.mjs](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/scripts/lan-qr.mjs)) draws the code in the terminal. The
code opens this computer's Wi-Fi or Ethernet address, at the port of whichever server answers
there: 5173 for dev, 4173 for preview. It includes your Google key, which the app saves on the
phone as it would from any `?key=`. The code is made on this computer, with nothing sent
anywhere. `--path=/some/page/` opens another page. `--query=set.<id>=<value>` adds a parameter,
and can be repeated. `--port` and `--host=<address>` override the port and the address, when the
one chosen is not the phone's network. `--no-key` leaves the key out, and `--help` lists all of
them.

The key comes from `FOSS_EARTH_GOOGLE_KEY` in the environment, or else from that line in this
checkout's `.env.local`, which git ignores and Vite refuses to serve. With neither, the first run
asks for the key and saves it there. The printed address hides the key, but the code carries it,
so don't share a picture of the code.

An application that links FOSS Earth gets the same command as `foss-earth-qr`, such as the UMN
tour's `npm run qr`. It reads the key from FOSS Earth's `.env.local` wherever it runs. An
application installed before the command existed needs `npm rebuild foss-earth` to link it.

- A phone's browser gives no WebGPU over plain HTTP, since WebGPU needs a secure context, so
  the app draws with WebGL there. [WebGPU on a phone](#webgpu-on-a-phone) says how to get it.
- If your key is restricted to certain websites, Google refuses it from this computer's LAN
  address until you add the address to the key's restrictions.
- If the macOS firewall is on, allow Node's incoming connections when asked, or the phone
  cannot connect.

The log's first line says which version the phone runs: the build's time and its commits. A
phone that comes back to a tab may show its own copy of an older page; a page built with the
`appFiles` plugin notices and reloads itself ([app-files.md](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/docs/app-files.md#the-page-and-a-browsers-copy-of-it)).
When something goes wrong on the phone, Settings → Diagnostics → Copy report gives what the app
knows as text, and `?report` in the address shows it when the app does not stay open:
[diagnostics.md](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/docs/diagnostics.md), which also says how to attach a browser's inspector to a phone.

### WebGPU on a phone

`http://<this computer's address>:5173` is not a secure context, so the phone's browser hides
`navigator.gpu`, and the app quietly falls back to WebGL. Settings → Renderer shows it
(`Secure context: ✗ no`). Either of these gives the phone WebGPU against the dev server:

- **USB, Android:** turn on USB debugging, connect the phone, run
  `adb reverse tcp:5173 tcp:5173`, and open `http://localhost:5173/...` on the phone.
  `localhost` counts as secure.
- **Wi-Fi, Chrome on Android:** open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`,
  enter the origin (such as `http://192.168.0.103:5173`), enable it and relaunch Chrome. Remove it
  when done.

The log says when the globe draws with WebGL, and why. A failed WebGPU start is remembered for
that origin with its reason (`foss-earth:renderer-fallback`), so the next start goes straight to
WebGL; WebGPU is tried again once the page is a secure context, `navigator.gpu` appears, the
browser changes, or three days pass. Switching Settings → Renderer back to Auto-detect from another
choice forgets it at once.
Builds before 17 October 2026 saved the fallback as the preference instead, and kept WebGL for good;
a newer build ignores that.

### Developer tools

A page opened with `?dev=1` (exactly one, `wantsDev` in `@foss-earth/dev`) gets the Dev tab and
the engine's developer settings (`DEV_CONTROLS_PARAMETERS`, such as Controls → Orbit → Show
compass center). A developer tool is in every build but is fetched with `import()` only when it
is switched on, so a visitor's page never downloads it. Once a build with it is deployed, it works
on the live site too:
`https://umn-vr.github.io/tour/minneapolis/?dev=1&set.input.showCompassCenter=true`.

A tool that only a developer's machine needs is a Vite plugin for `npm run dev` instead, and no
build contains it. The emulated VR headset is one: `headsetEmulator()` from `foss-earth/vite`
serves Meta's `iwer` to a page opened with `?headsetEmulator=quest3`, and `npm run check:headset`
in the app goes through a headset visit with it (the app's README, "VR without a headset").

## Quality checks

```sh
npm run lint
npm run test
npm run build
```

Or the exact sequence CI uses:

```sh
npm run ci
```

How these checks work, what each costs and what makes them slow: [CI/CD](ci-cd.md).

The suite covers camera and geodetic math, terrain streaming, and jsdom smoke tests for app
startup, URL key parsing, north-up reset behavior, layer lifecycle delegation, and cleanup. The
built-in controller profile is tested against simulated gamepad input: stick, trigger and button
directions, the deadzone, and capture suppression.
`npm run test:watch` reruns on change.

See [Manual QA checklist](manual-qa.md) for what to exercise by hand before a release.

## Running your own copy

You generally should not need to. The hosted site is the same code, it updates automatically, and
self-hosting gains you nothing unless you are modifying the source. If you are modifying the
source — or you want a copy that will not change under you — build the static bundle:

```sh
npm run build
npx vite preview
```

`dist/` is a plain static directory. Any static host will serve it, so long as the Vite `base` in
`vite.config.ts` matches the path it is served from. For GitHub Pages specifically, see
[Deploying to GitHub Pages](deploying.md).

Note the license terms in [NOTICE](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/NOTICE) before publishing a modified copy: FOSS Earth is
AGPL-3.0-only, so a network-accessible deployment must offer its users the corresponding source.

## Architecture notes

- [Streamed terrain and visible-surface queries](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/docs/streamed-terrain.md)
- [Compass height model](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/docs/compass-height-model.md)
- [Airport locations](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/docs/airport-locations.md)
- [Design proposals](../navigation.md#retained-local-and-host-evidence)

## Asset sources

- Non-clicked gesture icons (outline/no fill, for example 2-finger swipe):
  https://www.svgrepo.com/collection/mobile-gestures-with-arrows/
- Click gesture icons: https://www.svgrepo.com/collection/libre-variety-filled-icons/
