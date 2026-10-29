# Fresh-agent prompt: finish Component execution after shared-memory integration

**Done, 19 October 2026.** Component execution shows the shared-memory sky in
Earth, the tour and fly. Sky has Shared memory [Off|On] after Implementation,
and Shared-memory threads while it is on. The slider is disabled with "Not
isolated" on a page that isn't cross-origin isolated, and the title shows the
shared threads that ran. Everything is checked on dev servers at desktop and
phone widths, in both themes. What it shows, the checks, commands and the
remaining TODOs are in
[the shared-memory UI handoff](webassembly-shared-memory-ui-handoff.md#what-the-ui-shows-19-october-2026).
The prompt below stays as the record of the requirements.

Prepared 18 October 2026. Use **after** the agent working from
[the shared-memory assignment](webassembly-shared-memory-handoff.md) has finished
and updated its actual runtime contract/evidence. Start in
`/Users/felg/gh/foss-earth`, with the tour and 0SFS roots available.

UI cleanup checkpoint (18 October): completed through live basemap filtering.
This prompt is for **integration after** the shared-memory agent (finished 18
October; its contract/results are in
[the shared-memory UI handoff](webassembly-shared-memory-ui-handoff.md)),
not permission to redo the settled design. A concurrent session is adding
deployed isolation (plan step 3) in the app-files service worker. Current local
evidence: `app/build/component-execution/browser-map-mode/report.json` and
`functional.md`. No browser/preview owned by the UI conversation remains running.
Read the [closure checkpoint](webassembly-state.md#ui-checkpoint-safe-to-close-this-conversation-18-october-2026)
for verification scope and remaining work. Historical backend notes below must
be reconciled with the shared-memory agent's final results.

```text
Finish the FOSS Earth Component execution UI against the shared-memory agent's
actual implementation. Preserve the user's compact control design and make
implementation, placement, parallelism, availability, pending changes and real
running status clear in Earth, UMN tour and 0SFS fly. Continue through code and
browser checks, not a design-only response.

Read first:
- .github/AGENTS.md and each affected repository's AGENTS.md.
- docs/docs/ui-layout.md, especially the segmented choice design and concise
  label rules. These are explicit user preferences, not optional suggestions.
- docs/docs/proposals/implementation/webassembly-state.md and the
  shared-memory agent's final contract/results handoff linked there
  (docs/docs/proposals/implementation/webassembly-shared-memory-ui-handoff.md). Read
  current code: this prompt's backend inventory can become historical.
- docs/docs/proposals/implementation/webassembly-shared-memory-handoff.md for
  scope and constraints. Do not redo completed runtime work or claim a future
  threaded implementation works without checking the actual bytes/results.
- the `*-WASM/` READMEs and the plan docs/docs/proposals/webassembly.md Status table.
- app/src/app/wasmPanel.ts, wasmPanel.css, wasmReport.ts, browserPolicy.ts,
  engine/src/settings/catalogue/wasm.ts, ui/src/shell/choiceGroup.ts,
  ui/src/shell/settings/controls.ts and ui/src/styles/ui.css.
- Current UI evidence: app/build/component-execution/functional.md and
  browser-map-mode/report.json (compact titles/help, inline title/control flow,
  expanded-first order, actual tints, live mode filtering, desktop/phone,
  stable sources, no page errors, normal Chrome exits). Earlier browser runs
  record superseded layouts. Read the cleanup notes linked from WebAssembly state.

Settled requirements:
- The tab is Component execution. Retain its stable internal ID and
  saved placement. Sections are Global defaults and Components. Each component holds its
  settings and real running state, with diagnostics behind a trailing ?. There is no
  separate Currently running section. Use component, not CPU core, for sky/terrain/etc.
- Filter Components by map.source.basemap live: raster shows raster/terrain/
  imagery; Google shows google. Sky and ground are shared (finite-ray ground
  queries support both surfaces). Retain hidden settings, expansion and reports;
  close hidden help and move its focused control to a visible control.
- One control per decision: Auto/Manual policy; TypeScript/WASM implementation;
  work location; parallelism. Expose the new shared runtime's meaningful
  choices without recombining everything into one tier/performance scale.
- Compact text: Global / Auto / Manual for component mode. Use Global for a
  field inheriting its global default. Never expand it to Use global settings,
  As global settings, or another sentence inside a button. Keep choices short
  everywhere; put full semantics in help and accessible names when needed.
- Arrange everything as compactly as practical: natural widths, short text,
  shared rows and wrapping paragraph grids where they save space. No empty
  banners, unnecessary one-control-per-line blocks or repeated explanation.
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
- Component outlines and light fills reflect actual running implementation:
  TS blue #3178c6, WASM purple #654ff0, both for mixed TS/WASM. Pending settings
  never change that tint; unknown/not-started/starting stays neutral. Preserve
  this in collapsed and expanded groups and in both themes.
- Discrete sliders/choices are ONE naturally sized rounded rectangle containing
  adjacent text segments. Selection is shown by inset fill and outline. No
  visible checkbox/radio circles, no separate scattered pills, no equal-width
  stretching, fixed-column layouts, oversized padding or verbose labels.
  Native radio semantics may remain visually hidden for keyboard and screen
  reader support. Never hide them with display:none or remove focus access.
  Reuse the shared UI factory/styles; do not create per-app lookalikes.
- Choose text/control order by grammatical reading. Implementation [TS/WASM] ?
  normally reads best; prefix and suffix text are allowed. Do not impose a
  universal slider-first or label-first order. Keep ? last.
- The ? help button is last in its control row. There is no separate source
  action outside help: retain the existing external-link icon INSIDE the tooltip, inline at the end of its text,
  never a visible Source code label or file-path action. Prefer existing clear
  action icons, with full accessible names; do not replace them with wordy buttons.
- Global manual defaults and individual component overrides must work. Each
  manual field can inherit independently, so overriding only sky's backend
  continues to follow the global placement and parallelism.
- Changes pending must be immediate and conspicuous. Running status continues
  to describe real active services until Apply and reload (or a demonstrably
  safe live reconfiguration) activates the new settings. Show After reload
  separately. Carry edits through stale URL settings and unavailable storage.
  Provide Discard for pending changes. Do not silently reload or pretend a
  saved choice has become active.
- Shared memory and cooperating WASM threads must be reported from actual
  runtime capability/results. A worker pool with private instances is different.
  Report requested/actual backend, memory sharing and cooperating thread count
  separately from independent workers. Do not show unsupported capabilities
  as successful selections. Disable with a concise reason; retain fallbacks.
- Collapsed component titles show only the name and trailing ?. Expanded titles
  show Name: TS/WASM (N workers/main) ?, from actual telemetry. Preserve mixed
  worker/main cases. Remove duplicate Running lines. Help stays visible in both
  states and never toggles the component disclosure. Use ? by default rather
  than wordy Details/More info controls for supplementary information.
- Keep timing/parity/copy/cache/scope details behind ?. Do not restore the
  dense six-column debug table or fill the tab with repeated explanations.
- No visual-quality defaults or default backend changes without evidence and
  user authorization. Keep legacy wasm.tier/wasm.core.* URLs and saved
  settings compatible, and preserve dedicated foss-earth/wasm exports for
  fly's runtime mocks.

Current settings baseline before the shared-memory agent (verify changes):
- wasm.tier includes legacy typescript|typescript-worker|single|auto|threaded
  and custom. Custom reads wasm.implementation=typescript|wasm,
  wasm.placement=original|worker, wasm.parallelism=auto|serial.
- Component selection wasm.core.<id>=inherit|auto|custom (legacy tiers also
  valid), plus .implementation/.placement/.parallelism with inherit supported.
- serial means one independent worker per component, not one application thread.
  Only raster/terrain currently have independent-job pools. wasm.workers is
  a combined worker budget. The shared-memory agent must document new meanings
  and settings rather than hiding a different runtime behind these labels.
- Component execution already has split controls, immediate pending/apply,
  inheritance, preserved URL reloads and readable actual status. The earlier
  frozen app check passed desktop/phone TS -> WASM -> per-component TS with
  normal Chrome exit. Later compact-control cleanup supersedes its appearance.

Long explanations and diagnostics use a compact ? button by default, not a wordy Details action.
Keep only essential terse errors/fallbacks, pending/apply state, unavailable
capabilities and decision-critical instructions visible. Do not repeat scope,
architecture and rationale paragraphs under each control or hide information
necessary to understand the current state or avoid a mistake.

After the shared-memory agent finishes:
- Read its final runtime/report/isolation/budget contract and evidence first.
  Update only the UI decisions required to expose actual shared execution and
  thread counts. Keep TS/WASM separate from placement and parallelism, report
  unsupported/fallback states truthfully and retain pending/apply behavior.
- Preserve the already-fixed shared Renderer segments and all settled component
  title/help/order/tint/applicability behavior. Broader control violations are
  assigned to ui-compact-controls-handoff.md; do not redo finished cleanup.
- Extend shared tests to protect container structure, hidden native inputs,
  concise labels, exactly one selected segment, keyboard/focus access, disabled
  states, long-label/narrow-width wrapping and light/dark contrast. Keep checks
  behavioral and practical; do not just assert implementation text.
- Validate desktop and narrow phone layouts in actual app scenes, including
  scrolling to component overrides, pending changes, Apply/Discard, reload,
  startup/no work/fallback, and real single/shared backend transitions.
- Verify renderer choices too. Preserve credits, settings provenance/help,
  source links and event routing while fixing their appearance.
- Run necessary settings/UI/app tests, typecheck/build and host compatibility
  checks one heavy job at a time. Recheck known unrelated failures rather than
  assuming they persist. Browser profiles/screenshots/logs stay in ignored build/.

Update ui-layout, WebAssembly state, `*-WASM/` READMEs, plan Status and this handoff with
what is complete, exact URLs/check commands, actual capability/fallbacks and
remaining TODOs. Functional UI completion and performance gains are separate.
Preserve concurrent dirty work; re-read before exact edits. No staging, commits,
pushes, deployment, sudo, installations, external repositories or credentials.
Another session owns deployed cross-origin isolation (plan step 3): leave
ui/vite/appFilesWorker.js, app/vite/appFiles.ts, app/vite/crossOriginIsolation.ts
and service-worker registration to it. Derive threaded availability from the
runtime's crossOriginIsolated/report, never from assumptions about the host.
Use dev/preview ports other than 5390-5399, which that session uses.
Proceed autonomously through reversible implementation and checks.
```
