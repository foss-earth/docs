# Fresh-agent prompt: opt-in lens flare for the Sun

Prepared 25 October 2026. Start in `/Users/felg/gh/foss-earth`, with `/Users/felg/gh/0sfs` available.
It follows the scene-capture work in `app/scripts/capture-scenes/`
([workflow](../../../../app/docs/proposals/scene-screenshot-capture.md)), which made the 0SFS landing
page's sky pictures. Those pictures show the Sun as a bare disc, 13 px across, with no glare. The
user wants an opt-in lens flare, and will re-capture the pictures once it lands.

```text
Add an opt-in lens flare to FOSS Earth's sky: the glare, starburst and ghost
reflections a camera lens makes of the Sun when it is in view. It is off by
default, is one setting in the Sky tab, and also works from the address
(set.<id>=<value>) so a still capture can turn it on.

Read first:
1. ~/gh/foss-earth/.github/AGENTS.md and the AGENTS.md of each repository you
   change (sky, engine, app, and 0sfs fly if it is affected).
2. ~/gh/foss-earth/docs/docs/development.md, "Committing beside someone else's
   work in progress". Other agents have uncommitted work in sky (the civil
   clock), engine and app. Preserve it; stage explicit paths only; commit
   nothing unless asked.
3. ~/gh/foss-earth/docs/docs/proposals/settings.md (the registry, Controls, the
   Sky catalogue), docs/docs/render-on-demand.md and docs/docs/ui-layout.md.
4. sky/docs/proposals/sky.md, especially exposure and "A lamp seen directly is
   a point of light" (createLightPoints). Follow the same rule: the brightness
   comes from the light, not from looks.
5. The code:
   - sky/src/skyState.ts: the Sun's disc in the dome (around "The Sun's
     disc"), whiteLuminanceForEv100, adaptEv100;
   - sky/src/babylon/createSkyRuntime.ts: exposure(), the
     environment it publishes (ev100, whiteLuminance, sunDirection), and
     requestRender;
   - sky/src/babylon/createLightPoints.ts: the core-and-glare point image and
     its screen blend;
   - sky/src/settings.ts: the sky.exposure.* parameters;
   - engine/src/babylon/createGlobeRuntime.ts: imageProcessingConfiguration
     exposure (renderer.exposureEV);
   - renderer/src/babylon/sceneUpdates.ts: frame readiness and settling.

What is there now:
- No post-processing at all: no bloom, glare, flare or tone mapping. Each
  emitter writes luminance / whiteLuminance, where whiteLuminance is
  1.2 × 2^EV cd/m², and anything above white clips.
- The Sun is a disc of its real luminance in the sky dome, reddened and
  dimmed by the air in front of it. It is partly below the horizon when it
  is at the Earth's edge.
- The app renders on demand: a still view draws no frames.

What to build:
- One opt-in control, default off, in the Sky tab's exposure section, with
  help text. A choice is fine, e.g. "Lens flare: Off / Glare / Flare", if
  ghosts should be separable from glare. Off must cost nothing: no extra
  draw, pass, shader compile or texture.
- The Sun at least. The Moon and bright lamps only if the same rule covers
  them cheaply; otherwise say so in the docs.
- The flare's strength derives from how far the source overexposes the
  display: its illuminance at the camera against the display white at the
  current exposure (fixed or metered). Count only the part of the disc that
  is visible.
  - At EV 12 from orbit, the Sun is about 18 stops over white and flares
    strongly.
  - A Sun dimmed by thick air at the horizon flares less, and in its
    reddened colour.
  - The same scene at a lower exposure flares more.
  Lens constants (glare spread, blade count, ghost spacing and strength) are
  fixed parameters of a nominal lens, documented with their source or
  reasoning. They are not tuned per scene.
- Occlusion is part of the job: no flare when the Sun is behind the Earth,
  terrain, Google 3D Tiles buildings, an aircraft or a cockpit. A partly
  hidden disc gives a proportionally weaker flare.
  - The Earth's edge can be analytic.
  - Everything else needs the depth buffer or an occlusion query, and must
    work on WebGL2 and WebGPU.
  - A query result arriving a frame late must not leave a stale flare on a
    still view.
- Render on demand stays intact.
  - The flare changes only when the view, the Sun or the exposure changes.
  - No animation runs without input.
  - Any fade has a settled end state that triggers no further frames.
- WebXR: correct per eye, or off in XR. Document which.

For still captures (app/scripts/capture-scenes/):
- The same scene must give the same pixels on every run.
- Publish the flare's state where the capture can read it, for example on
  runtime.sky.getEnvironment():
  lensFlare: { mode, sources: [{ id: "sun", visibleFraction, stopsOverWhite,
  pixel }], settled }.
- Do NOT edit app/scripts/capture-scenes/. It belongs to another agent who
  is using it now. Report the state field and its meaning, and they will wire
  it into the capture's readiness and report.
- To check your work visually, build into your own directory and point the
  capture at it. Do not use --rebuild, and do not write app/dist while the
  other agent captures:
    cd ~/gh/foss-earth/app
    npm exec --no -- vite build --configLoader native \
      --outDir build/lens-flare/app-dist --emptyOutDir
    node scripts/capture-scenes/capture.mjs sky-sunset-orbit \
      --app-dist build/lens-flare/app-dist --out build/lens-flare/runs \
      --set settings.<your id>=<value>
  - sky-sunset-orbit is the main test scene: the 0SFS sky card. It shows
    the Sun 2° above the Earth's edge from 400 km, at a fixed EV 12, 40°
    field of view, 1200×1200. The Sun is a 16 px disc there today.
  - sky-sunset-orbit-wide is the same kind of scene at 18°, 1920×432.
  - Also check a ground-level sunset and a Sun hidden behind a building in
    Google 3D Tiles. Check a Sun behind the Earth too (scenario
    night-lights-orbit), where the flare must be absent.
  - Use the Google key only through the documented lookup; never print it.

Done means:
- The setting works in FOSS Earth and in 0SFS fly, which also uses the sky.
  0SFS fly typechecks and its tests pass.
- Sky, engine and app typecheck, and their tests pass, with new tests for:
  - strength against exposure;
  - the occluded fraction;
  - off adding nothing to the scene.
- sky/docs/proposals/sky.md documents the model, its constants, its limits
  and the state field.
- A short report states:
  - the setting id and choices;
  - the files changed;
  - the before and after capture paths;
  - performance with it on and off (one quick check, not a long benchmark);
  - anything left undone.
- Stop every server and child process you started.
```
