# Fresh-agent prompt: fix compact-control violations across the UI

Prepared 18 October 2026. Start in `/Users/felg/gh/foss-earth`, with
`/Users/felg/gh/0sfs` and `/Users/felg/gh/UMN-VR` available. This assignment
covers the other UI throughout the apps; the separate WASM runtime and
Component execution runtime-integration assignment remains separate. The compact
Component execution cleanup is complete; the shared-memory agent is still active.
Preserve that finished UI when auditing other panels.

**Status (19 October 2026):**

- The fix pass is committed, not pushed, on the `ui-compact-controls` branch
  in foss-earth app, docs, engine, renderer, scenes, sky, sphere-image, toolbar
  and ui, and in 0sfs fly, aircraft, ground-contact and controls. A second
  commit in app, docs, renderer and ui fits fields to their text, puts the
  Renderer tab's everyday controls on the tab itself, and adds the rules on
  sections and terse titles.
- The slider redesign the user asked for next is in
  [slider-handle-field-handoff.md](slider-handle-field-handoff.md).
- The settled rule questions and the remaining exceptions are recorded in
  [ui-layout.md](../../ui-layout.md#compact-segmented-choices).
- The audit and the status of each item are in
  `docs/build/ui-compact-audit/violations.md`.
- UMN-VR's native-panel patch has not been applied yet. It is at
  `UMN-VR/app/.local/build/ui-compact-controls/panels-after-foss-earth-bump.patch`.

```text
Find and fix violations of the user's compact UI design throughout FOSS Earth,
the UMN tour and 0SFS fly. Implement the fixes in their owning shared libraries
and host panels, then verify actual rendered controls. Do not stop at an audit,
a TODO list, a single tab, or a new lookalike widget in one app.

Use ? by default for supplementary information and diagnostics, rather than
wordy Details/More info actions. Keep help last and visible on collapsed
components; opening help must not toggle the component disclosure. Component
execution titles show only Name ? collapsed, and Name: TS/WASM (N workers/main) ?
expanded, without a duplicate Running line. Preserve mixed execution/fallbacks.

Read first:
1. ~/gh/foss-earth/.github/AGENTS.md, ~/gh/0sfs/.github/AGENTS.md,
   ~/gh/UMN-VR/.github/AGENTS.md and each affected repository's AGENTS.md.
2. ~/gh/foss-earth/docs/docs/ui-layout.md, especially Paragraph grids,
   Compact segmented choices, and Settings describe one decision and its
   current effect. This is the authoritative design, not an example to reinterpret.
3. ui/src/shell/choiceGroup.ts, ui/src/shell/settings/controls.ts and
   ui/src/styles/ui.css. These already contain the shared compact track; use it.
4. app/src/app/nativePanel.ts and its tests for the current Component execution
   implementation, and app/build/component-execution/functional.md plus
   browser-map-mode/report.json for the latest verified Component execution UI.
   Earlier browser folders contain diagnostic/superseded layouts. The native
   state document links the evidence and the three separate assignments.
5. Relevant panel/setting owners in renderer, engine, sky, images/sphere/scenes,
   toolbar, app, tour and fly before changing their consumers.

Explicit user requirements, all apply throughout the UI:
- Arrange things AS COMPACTLY AS PRACTICAL by default. Use short labels, natural
  widths and shared rows. A wrapping paragraph grid is often right: related
  items fill a line and wrap when it runs out. Avoid empty space, oversized
  padding, repeated explanation, unnecessary headings/full-width rows, fixed
  columns, equal-width stretching and one-control-per-line layouts where a
  compact row fits. Preserve meaningful grouping and usable interaction.
- Expanded component/group titles are the FIRST naturally sized item in the
  same wrapping paragraph grid as their controls. Controls flow beside the
  title when space allows. Do not reserve a separate title row/body gap.
  Full section headings are the exception and may keep their own row.
  In paragraph grids with expandable components, show expanded items before
  minimized items by default (order override), retaining relative order within
  both groups and preserving focus/control state.
- Each logical component in a paragraph grid has its own compact rounded
  rectangle by default. Components each need their own enclosure,
  including when collapsed; a top separator is insufficient. Keep each
  slider's segments together in one track inside its logical group. Preserve
  natural widths, minimal padding and boundaries when groups wrap.
- A discrete choice/slider is ONE rounded rectangle containing adjacent text
  segments. Selected fill and inset outline show the selected value. No visible
  radio/checkbox circles, no collection of separate pills. Reuse the shared UI
  factory and styles; do not rebuild an app-specific variant.
- Buttons are as terse as possible without losing meaning. Use Global / Auto /
  Manual, never Use global settings or As global settings. Inherited fields say
  Global. Prefer concise words such as WASM, Default / Workers, 1 worker / Pool
  when context is supplied by the control. Do not repeat the heading in every
  button or replace compact labels with explanatory sentences.
- Order text and controls so the phrase reads grammatically. Usually label
  first is right: Implementation [TS / WASM] ?. Do NOT hard-code a universal
  label-first or slider-first order; prefix and suffix text are allowed when
  that reads better, including quantities/units. Keep the phrase compact.
- The ? help button is LAST in its control row. Help includes full meaning,
  defaults/reasons, provenance, limits, restart/pending behavior and setting IDs.
  Do not reserve a whole row for help or leave a leading help button.
- There is NO separate source button or icon in the control row. Keep the
  EXISTING source-link ICON inside the ? tooltip, INLINE AT THE END OF THE TEXT,
  like a final character. No Source code button text, full path as link text,
  or extra icon row. Keep a full accessible name and hover title.
- For familiar actions, prefer existing recognizable ICONS by default over
  verbose text. Do not replace an icon with words merely to label an action.
  Keep accessible names; use visible words when an icon would be ambiguous.
  Actual setting choices remain concise text, not arbitrary invented icons.
- Keep semantics and accessibility: native mutually exclusive radios can be
  visually clipped to 1 px, but remain focusable and usable with arrows and
  screen readers. Never display:none/hidden/aria-hidden the interactive inputs.
  Preserve focus outlines, disabled explanations, light/dark selected contrast,
  credit/attribution links, keyboard interaction, and pointer/trackpad routing.
- A saved choice is not necessarily active. Reload-only settings need immediate
  Changes pending feedback and an explicit apply action; running status must
  reflect actual services. Do not silently reload or claim an unavailable
  backend started. Preserve native URLs, setting IDs and saved tab placement.

Scope and approach:
- Audit all reachable tabs/panels, not only Component execution: Renderer,
  Map, Sky, Date/time, Controls, Interface, Settings, Scenes, Location,
  panorama/image panels, dialogs/tooltips and host-specific tour/flight panels.
  Include custom radio groups, boolean choice buttons, help/source rows,
  oversized action labels, and fixed/wasteful layouts. Do not abbreviate authored
  content, legal credits, scene names or data just to make a control smaller.
- Renderer Auto-detect/WebGPU/WebGL2/WebGL was specifically reported as a
  regression to four visible radio circles. The shared createChoiceGroup has
  since been changed to the compact track. Verify that change is actually
  consumed by the apps; do not assume an owner build/installed copy is current.
- Prefer owner-level fixes that remove multiple violations at once. Preserve
  the shared control API/event contract, selection/default values, credits,
  provenance, lifecycle and reset/import/export behavior. Use shortLabel and
  accessible names where a concise label must coexist with full semantics.
- Keep an explicit inventory in an ignored build/ report: affected owner,
  panel/control, violation, fix, browser evidence and remaining exceptions.
  Add deliberate remaining work to the design spec's TODOs with a concrete
  reason; do not quietly stop with obvious reachable violations unaddressed.
- The Component execution UI is being cleaned up separately, and another agent
  owns shared-memory Rust/WASM, isolation, protocols and worker scheduling.
  Inspect their current work, avoid their in-progress files, and coordinate
  shared factories by reading current diffs before each exact edit. You may
  begin with read-only audits while they finish; do not overwrite their changes
  or change execution architecture as part of a visual cleanup.
- Keep the app's separate foss-earth/native entry; fly mocks runtime wholesale.
  Do not change rendering/visual-quality defaults, camera/gesture physics,
  authored placement, worker/backend defaults or performance policy in this task.

Long explanations and diagnostics use a compact ? button by default, not a wordy Details action.
Keep only essential terse errors/fallbacks, pending/apply state, unavailable
capabilities and decision-critical instructions visible. Do not repeat scope,
architecture and rationale paragraphs under each control or hide information
necessary to understand the current state or avoid a mistake.

Verification:
- Add practical regression coverage to shared factories/owners before broad
  changes: one shared segment container, one selected value, glyphs visually
  hidden while radios remain accessible, short button text, last help button,
  inline icon-only source inside help, preserved credit links, disabled states,
  and event/keyboard behavior. Avoid tests that merely copy implementation text.
- Inspect actual rendered panels at desktop and narrow phone widths, both
  themes, including wrapping, scrollability, focus and selected contrast. Test
  saved/URL settings and reload-only pending/apply behavior where changed.
- Run relevant owner tests, typecheck/build/lint and actual host-consumer checks.
  One heavy job at a time. Recheck existing failures and distinguish them from
  regressions. Do not spend the task rewriting unrelated failing features.
- Use installed tools/browsers only; all screenshots, fixtures, logs, profiles
  and audit output go in the owning repository's ignored build/. Close owned
  browsers normally and dispose workers in finally. Follow Chrome clone cleanup
  rules after any timeout/crash/forced stop. Do not touch personal profiles.

Keep docs/docs/ui-layout.md and its cleanup TODOs current. Update the relevant
handoff/state notes so future agents know what was fixed and what remains.
Deliver a concise list of actual fixes, representative screenshots/evidence,
checks and remaining exceptions. Save all reusable rules in docs and shared
AGENTS.md rather than leaving them only in conversation.

Preserve concurrent dirty work. Record git status per repo, re-read before exact
edits, and never stage, commit, push, deploy, discard others' work, use sudo,
install tools, create external repositories or expose credentials. Proceed
through reversible implementation and necessary verification without routine
permission questions.
```
