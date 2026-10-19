# Fresh-agent prompt: sliders with help last, tracks on demand and a field for a handle

Prepared 19 October 2026. Start in `/Users/felg/gh/foss-earth`, with
`/Users/felg/gh/0sfs` and `/Users/felg/gh/UMN-VR` available. It follows the
[compact-controls pass](ui-compact-controls-handoff.md), which is committed on
the `ui-compact-controls` branch in foss-earth app, docs, engine, renderer,
scenes, sky, sphere-image, toolbar and ui, and in 0sfs fly, aircraft,
ground-contact and controls. Nothing is pushed.

```text
Redesign the shared slider so that FOSS Earth, 0SFS fly and the UMN tour follow
the Sliders rules in ~/gh/foss-earth/docs/docs/ui-layout.md (section "Sliders").
Implement it in the shared ui factory, not in one app, and verify the rendered
controls in a browser.

Read first:
1. ~/gh/foss-earth/.github/AGENTS.md, ~/gh/0sfs/.github/AGENTS.md,
   ~/gh/UMN-VR/.github/AGENTS.md and each affected repository's AGENTS.md.
2. ~/gh/foss-earth/docs/docs/ui-layout.md: Paragraph grids, Compact segmented
   choices (and the settled cases after it), Fields fit their own text,
   Sliders, and One home for every control. These are the user's rules.
3. ~/gh/foss-earth/docs/docs/development.md, "Committing beside someone else's
   work in progress", before staging anything.
4. ui/src/shell/settings/controls.ts (createHeader, placeSlider,
   createValueTrack, createRangeTrack, fitNumberField and the wrapper that
   appends status and help), ui/src/shell/settings/track.ts (createTrack),
   ui/src/shell/settings/parameterSection.ts, ui/src/styles/ui.css,
   ui/assets/theme.css, and the help tooltip (createHelpTooltip) whose
   portal, viewport fitting and one-open-at-a-time rules a track popover can
   share.
5. ui/src/settings/types.ts (ParameterSpec: controlFirst, named, numberControl,
   track) and the catalogues that use tracks: renderer/src/settings/catalogue.ts
   and profiling.ts, and the engine, sky, scenes, app and fly catalogues.

What the user asked for (19 October 2026):
- The ? help button is the LAST item of a control, after its track. Today the
  track comes last: placeSlider appends the track after the phrase line, and
  the help wrapper appends status and ? to the end of that line.
- Most sliders should not show all the time. By default a number reads
  "Label [value] unit ?"; its track appears in a popover while the pointer is
  over the setting, and stays regardless of the pointer once the setting is
  selected (clicked), until a click elsewhere or Escape. Keyboard focus and a
  touch tap select it too. All of Renderer -> Debug's sliders go on demand.
- Where a slider should show all the time (Resolution, for example), its
  handle IS the input field: the value is written on the thumb. A stationary
  click on the thumb selects it and shows it as an editable field, and a
  further click types into it; a press that moves is an ordinary drag.
- The value keeps a constant character count across its range, with leading
  zeros and the step's fixed decimals (010 to 240 fps, 0.25 to 2.00 x), in
  tabular figures, so the handle's text never changes width while it moves.
- The motivating bug: a field beside the track changed width as a drag changed
  its digits, which moved the track under the pointer, which changed the value
  again. An interim fix is committed: a slider's field starts as wide as the
  widest end of its range and never narrows (fieldChars in createValueTrack).
  Replace it with the constant character count.
- Open question for the user: where an always-shown slider sits in its phrase.
  They asked whether such sliders should come first. The recommendation in the
  docs is "Label [track, value on its thumb] unit ?", label first as elsewhere.
  Ask before settling it.

Do:
- Add one plainly named per-parameter option for a track shown all the time,
  with on demand as the default. The user rejected "lead" as an unclear name;
  use words that say what they do. Decide with the user which parameters keep
  an always-shown track; propose a short list (Resolution is theirs).
- Keep native range inputs for keyboard and screen readers: never hidden,
  display:none or aria-hidden. Preserve arrow keys, focus outlines, disabled
  explanations, pending/apply state, named values (Off | Value), reset/import/
  export, provenance and setting IDs. Keep pointer/trackpad routing between the
  panel and the globe, and touch. A popover overlays; it does not shift layout.
- Range tracks (two thumbs, for example Depth range's fixed range) and the Map
  detail tracks follow the same rules; check each kind createTrack draws.
- Update the tests that pin ? as the last item of the phrase line
  (ui/src/shell/settings/parameterSection.test.ts) and add regression tests:
  ? last after the track, popover open/pinned/closed, click versus drag on the
  handle, constant character count across a range, no layout shift on drag.
- Keep docs/docs/ui-layout.md (Sliders and its cleanup tracking) current.

Waiting for the user's decision; do not change without asking:
- Move onto the tab itself (section main): Interface -> Compass (one everyday
  control), Map -> Source, Controls -> Input method.
- Shorter section titles: Atmosphere and illumination -> Atmosphere, Exposure
  and display -> Exposure, Loading and memory -> Memory, Automatic adjustment
  -> Auto, Imagery selection -> Imagery, Terrain selection -> Terrain, Mouse
  and trackpad -> Mouse/trackpad, Moon and stars -> Moon/stars, Position
  readout -> Position.
- The preset status "Custom" now stands alone at the top of the Renderer tab;
  perhaps show only "Matches <preset>".
- The ? still wraps alone after Map's Basemap and Elevation choices, and Sky ->
  Haze's note pushes its ? onto its own line.
- Fly's own tabs and the native page have not been checked against the
  section rules.

Verification:
- Inspect actual rendered panels at desktop and phone width (360 px), both
  themes, with a fresh browser profile per screenshot. Drag each always-shown
  track across its whole range and record the field's width and the track's
  position at each step; neither may change. Screenshots and logs go in each
  repository's ignored build/.
- Dev servers: `npm run dev` in foss-earth/app (http://localhost:5174/app/
  when 5173 is taken) and in 0sfs/fly (--port 5175). Fly's Renderer tab is the
  same createRendererPanel.
- Known failures before this work, not regressions: ui has 7 failing tests
  (src/browser/theme.test.ts x6, tests/injected-widgets.test.tsx x1) and one
  lint error in tests/keptFiles.test.ts; fly's typecheck has 2 errors in
  node_modules/foss-earth/src/app/thumbnailWebGpu.ts, and its tests have 14
  failures (createFlightSimApp.test.ts x10, stowedGearHitch.test.ts,
  createFlightHudBar.test.ts, flightParameters.test.ts x2). renderer and app
  pass typecheck, lint and tests. One heavy job at a time.

Rules:
- Other agents work in the same checkouts (app's native panel files and
  workers, docs' WebAssembly notes). Record git status per repository, re-read
  before each exact edit, edit only your hunks, and never discard others' work.
- Commit only when the user asks, with your own hunks only, and never add AI
  author, committer or co-author attribution. Do not push or deploy unless
  asked. Never print or commit the Google key (FOSS_EARTH_GOOGLE_KEY).
- Nothing outside the repositories: no /tmp or scratchpad. Nothing under
  ~/.claude unless the user asks for that exact change.
```
