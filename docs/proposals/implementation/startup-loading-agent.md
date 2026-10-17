# Startup loading: implementation agent

Status: brief, 17 October 2026. Paste the assignment below into a fresh agent
conversation started in `~/gh/foss-earth`.

## Assignment to give the agent

```text
Make FOSS Earth pages answer a click at once and reach their 3D scene sooner. The spec is
~/gh/foss-earth/docs/docs/proposals/startup-loading.md. Read it first, then the shared rules
in ~/gh/foss-earth/.github/AGENTS.md, docs/render-on-demand.md and docs/ui-layout.md. Verify
every claim in the spec's "What exists today" and "Measured" sections against today's code and a
fresh build before relying on it.

Context: the apps are the FOSS Earth app (~/gh/foss-earth/app, built into
~/gh/foss-earth/foss-earth.github.io), the UMN campus tour (~/gh/UMN-VR/tour), and 0sfs
(~/gh/0sfs). All of them link the Earth libraries with file: dependencies. Developer mode is
?dev=1 (@foss-earth/dev wantsDev). The engine's first developer tool, Show compass center, is
the model for "shipped but dormant": DEV_CONTROLS_PARAMETERS, registered only under ?dev=1,
loaded with import() only when switched on (engine createGlobeRuntime.ts syncCompassSphere).

Work in the spec's "Order of work", one step at a time. Each step: measure before, build it with
tests, measure after, record the numbers in the spec, and report. Then stop for review before the
next step unless I say to continue.

1. Baseline. Write a measurement script under the tour's build/ (gitignored) using
   @foss-earth/browser-testing with a cold profile, Fast 4G throttling and a 4x CPU slowdown.
   Measure /tour/minneapolis/ and the FOSS Earth app, cold and warm: terminal paint (once it
   exists), first 3D frame, bytes before the first frame, settled. Add the performance.mark
   names the spec lists.
2. Renderer (renderer repo): stop saving a WebGL fallback as the renderer preference; save the
   reason and time and retry WebGPU when the reason no longer holds. Print the fallback in the
   game log at startup. Tests for both paths.
3. Boot terminal (@foss-earth/ui/vite bootTerminal), provenance JSON moved out of the HTML and
   fetched by About, and speculation-rules prefetch on the tour's selector page.

Rules:
- Other agents are working in these checkouts (WebAssembly benchmarks in research, 0sfs/fly and
  the docs; the VR headset work is committed). Run git status first.
  Don't discard, overwrite or commit their changes. Stage only your own paths, or only your own
  hunks with git apply --cached.
- Before the renderer step, check what Android Chrome answers to
  navigator.xr.isSessionSupported("immersive-vr"). The spec explains why, under "Renderer
  advisor".
- Scratch, logs and screenshots go in each repository's gitignored build/, never /tmp.
- Commits: one descriptive sentence, no AI attribution. Don't push, deploy or start servers
  unless I ask. Exclusive benchmark runs need me to confirm that the machine is free.
- Before calling a step done, run each touched repository's typecheck, lint and tests (the
  tour: npm run typecheck, npm run test:changed -- <files>, npm run lint). Report failures that
  predate your work as such, with their output.
```

## Hand-off notes

- The tour dev server may already be running (`~/gh/UMN-VR/tour/build/dev.log`).
  Check with `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/tour/`
  before starting another.
- To test WebGPU on a phone against the dev server, see
  [Development → WebGPU on a phone](../../development.md#webgpu-on-a-phone).
- The last browser checks of the compass center ball (WebGPU and WebGL2 in
  headless Chrome) used `engine/build/compass-sphere/check.mjs`, which is a
  model for driving input in a real GPU page.
