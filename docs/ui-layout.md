# UI Layout

Rules for panels, tabs, menus and the HUD in FOSS Earth and in the applications
built on it, 0sfs included. Read them before adding or changing any on-screen
control.

## Windows, the log, and the world

The shell has three arrangements, chosen from the requested sizes rather than a
fixed breakpoint:

- **Dual**, the widest: a window on each side and the log floating in the center,
  12 px below the top safe area. This is the only arrangement that shows the log
  all the time.
- **Columns**: a window on each side and no floating log. The log is a tab.
  When both no longer fit at their own widths, the window resized last keeps
  its size and the other takes the rest, down to 160 px, so either side can be
  dragged wider; before any resize, the wider one keeps its size. A window
  that gave way grows back when the other narrows, unless it had asked for at
  least as much as the one dragged: then the width it shows when the drag ends
  becomes its own, so a reload shows the same widths.
- **Stacked**, a phone: one window, initially the available width. It can be
  narrowed in overlay; an explicit split keeps it full width (see below).
  The other window's tabs fold into it. The log is a tab. Which window fills the
  phone stays on its occupied side when only one side has tabs. When both do,
  it follows the last side the user focused or resized; otherwise it is the
  right one. The empty opposite **+** disappears, and the grip moves to the
  middle of the window's bottom edge. Browser resizing never moves a lone
  window to the other side. Dragging a tab temporarily reveals the opposite
  launcher as a drop target, so the tab can still be moved there.
  While an image tab is selected on an expanded side, that fold does not run:
  both occupied sides stay labelled rows, two images share one body under those
  rows, and an image beside ordinary content keeps two stacked groups. The empty
  or collapsed side keeps its launcher or strip. Widening is not a tab move, and
  ordinary folding returns only when no image is selected. The width where two
  windows stop fitting is `320 + 160 + 12 * 3` pixels in `resolveDockLayout`.

`resolveDockLayout` allocates the windows and, in the dual arrangement, the log.
`WindowOverlay` publishes that allocation before paint. The log has no saved
absolute position. Its startup placeholder stays on the left until the shell
takes over.

The most recent manual resize gets priority. Growing the log shrinks each window
as needed, down to 160 px. If the requested log still does not fit between both
windows, the layout becomes columns: both windows stay, and the log moves into
a tab. It comes back to the center only once the requested width fits there
again, so a log the user widened does not flicker back as soon as the windows
have 160 px of room. Tabs stay on the sides they were on.

Growing a window shrinks the log when they meet. The log's center stays at half
the viewport width, even with unequal windows. Each half of the log must clear
its neighboring window and a 12 px gap. Window resize handles stop when the log
reaches its 160 px minimum. If a window grows until the centered log would be
under 160 px, the layout becomes columns and both windows remain.

Preferences survive fitting, and taking over a resize starts from the displayed
sizes. A log drag keeps the same width calculation across the dual and columns
arrangements so it can reverse through the transition without oscillating.
Ordinary log messages never take resize priority. Minimizing releases the log's
requested space; restoring reapplies its preference. Collapsed tab strips also
fit their allocated widths.

### What the world draws under the windows

Overlay is the default at every width: windows float over the full-screen world
and can be resized freely. An empty window's **+** launcher stays in its top
corner. The world still shades only the pixels those opaque windows
do not cover: a depth mask is drawn over each window (and over the floating
log) before the globe, and later fragments fail the depth test there.

With Split explicitly chosen, the window is a band across the top and the world
is drawn only in the area under it, so the drawing buffer itself is smaller.
The resize grip sits on the edge where the window meets the world. The toolbar
and imagery provider stay at the bottom of the screen at every screen width.
Dragging the grip gives the world less or more of the screen; collapsing the window leaves
only its tab strip at the top. Interface → **World size** chooses when the
drawing buffer follows. Release, the default, keeps that buffer while
the split window is dragged and while the browser window changes shape, then
resizes it once when the drag ends. Live resizes it on every movement.

### Windows on the screen's edges

Interface → **Windows on the screen's edges** (`interface.windows.flushEdges`)
chooses the edge style at every screen width. It is on by default; turning it
off explicitly chooses corner insets. Resizing the screen keeps that choice.
With it on, each overlay window loses its 6 px inset and meets the top and its
own side of the screen, with square corners and no shadow or blur behind it;
two windows keep only the 12 px between them. The log stays a tab at every
width. The toolbar's buttons close up with no gaps and meet the bottom and side
edges, and the map's detail rail moves inside the basemap's chip, before its
name. The world is then one rectangle with rectangles cut from its edges: while
this is on, the depth mask also covers each toolbar item shown, so nothing is
shaded under the toolbar either. The same toolbar style applies with Split
chosen, while its window remains a band at the top.

With corner insets chosen, the toolbar keeps its inset and gaps at every width.
On 2026-10-14, in Chrome with WebGPU at 1440×900 at 2× and
no frame-rate cap, the default view over Minneapolis with a window on each side
drew a frame in a median 3.19 ms on the edges and 3.40 ms inset, faster in all
8 alternating blocks. The 3D world's own GPU time fell only 2.6%, although the
covered area grew from 24% to 26% of the screen. Most of the saving is the blur
and shadow behind floating windows, which the browser no longer composites.

When split is on and only one side has a tab, that window uses the full width.
The empty side stays a launcher. The world starts under whichever window or
launcher reaches lowest, so moving a tab to the other side keeps the split.

An image tab, or a 360 photograph's, takes the world's place under the windows,
so its tab says so before its label: a picture for an image, a sphere for a 360
photograph (`icon` on the tab's definition; `@foss-earth/ui`'s README has the
details). The label is the image's title alone.

Interface → **Windows and the world** is a two-way switch, overlay or split.
Overlay stays the default on phones and wider screens. Split is an explicit
choice; resizing never changes the chosen presentation. Holding
a tab still, or holding the resize grip still, opens the same switch beside
the press, below it when the press is at the top of the screen. Moving during
the press drags the tab or resizes the window, as before.

Clicking a log message copies its text and appends `(copied 2 clipboard)` after
the clipboard write succeeds. The message is also a keyboard button. Panorama
image-ready notices leave the log after Interface → Log's **Log line time**,
including while history is open, so repeated visits do not accumulate ready notices.

The workspace is remembered per device. After a reload each window holds the
tabs it held, shows the one it showed, and keeps its width and whether it was
minimized (`ui/src/browser/workspace.ts` and
`ui/src/windowing/core/workspacePersistence.ts`); the sections open inside each tab
are remembered the same way (`panelSectionsOpen.ts`). What is saved is the
layout a wide window on the globe would show: tabs folded onto either side are
saved on their own sides, and inside a panorama the map's tabs are saved where
they were and the panorama's own tabs not at all. A saved tab the application no
longer offers is dropped.

### What a window's grip changes

A grip's arrows show exactly what dragging it changes. The layout says once,
in `windowWidthFixed`, whether a window's requested width is used, and the
grip takes its axes from that alone, so it never offers a width the layout
would throw away. `WindowOverlay.grip.test.tsx` drags every grip at phone,
threshold and desktop widths, in each presentation and with tabs on either or
both sides, and fails if the icon's sideways arrows and the width change ever
disagree.

- **Corner**, wherever two windows fit: width and height, from the free bottom
  corner, with arrows along the two edges it moves.
- **Middle of the bottom edge, both ways**: a phone in overlay. The window
  starts full width, where a corner grip would sit on the screen's edge, hard
  to grab and where a phone's back gesture starts. Dragging toward the side
  the window is anchored on narrows it, down to 160 px. Dragging the other way
  expands it. Within 24 px of full width it snaps to fill the available width;
  releasing there keeps it full width as the compact browser width changes.
  Continuing past that snap zone moves the window to the opposite side and
  starts narrowing it from there, in the same gesture. Reversing the drag
  reverses that transition. This explicit side change moves the whole visible
  window, including its folded tabs, and is remembered on reload and when two
  windows fit again. A tab can also be moved individually by dragging it to
  the opposite side. Other chosen widths are kept on reload and when two
  windows fit again.
- **Middle of the bottom edge, height only**: a split window that spans the
  width, on a phone or as the one open window on a wider screen.

### Maintaining compact window gestures

The shared implementation lives in `ui`, rather than in the app's tab
composition. Keep these rules when changing it:

- `src/shell/dockLayout.ts` chooses a lone occupied side before any remembered
  resize or focus preference. `WindowOverlay` checks the logical workspace,
  with borrowed tabs restored to their homes. Once two windows are folded,
  pin the presented side to `compactMemory.into`: selecting a borrowed tab
  must not move the window. An explicit tab drop activates its destination
  before the updated workspace has rendered.
- A snapped full-width overlay stores `width: null`. This follows the compact
  viewport's available width, including the chosen insets, rather than saving
  the current pixel width. At desktop widths, null still uses the ordinary
  default window width.
- `src/windowing/react/panelWidth.ts` calculates from the drag's original
  side, width and maximum width. Within 24 px of the maximum, retain the
  original side and use full width. Beyond that zone, switch anchors and use
  `2 * maximum - requested` as the width. Do not rebase the drag after a side
  change; reversing one captured gesture must retrace it.
- `WindowOverlay` keeps component identities independent of their physical
  slots (`slotOrder`). Keep the same mounted `DockPanel` and grip while the
  side changes, or the browser loses pointer capture. Compact image rows use
  CSS order to retain left-before-right presentation after a prior side swap.
- Save the height before the atomic side-and-width callback. The callback
  swaps whole workspace slots, clears borrowed-tab memory, and moves the
  hidden context tabs, context entry marker, pending opens, log home and focus
  with them. Updating only visible tabs loses the chosen placement when a
  panorama closes, the browser widens or the page reloads.
- In compact mode, the opposite launcher mounts only during a tab drag. Pass its
  active drop state explicitly: it mounted after the drag-start event and
  cannot rely on hearing that event. Pointer up, cancel, lost capture and
  unmount must each end a resize at most once, without treating cancellation
  as a click to minimize.

Side-crossing resize is enabled only for an ordinary stacked overlay. Full-width
split windows and compact image/surface rows retain their height-only grips. Browser width
may change fitting and folding; it must preserve the user's edge and
presentation choices, the screen-bottom HUD, and a lone window's side.

Regression coverage lives in `src/shell/WindowOverlay.grip.test.tsx`,
`src/shell/dockLayout.test.ts`, `src/windowing/react/DockPanel.resize.test.tsx`
and `src/windowing/react/panelWidth.test.ts`. The app's
`src/shell/WindowOverlay.test.tsx` checks the composed host and reload. On
2026-10-17, 92 Chrome scenarios also checked narrow/wide transitions, both
sides, inset/flush edges, explicit split, captured-pointer resize and reversal,
tab drop targets, context transitions and saved placement. The user confirmed
the resulting gestures by hand. Browser profiles, screenshots and reports are
local scratch under `ui/build/side-resize/`; the committed tests retain the
regressions without depending on those artifacts.

## Paragraph grids, never fixed columns

Arrange controls and explanation as compactly as practical. Prefer natural
widths, short labels and shared rows; do not add empty space, padding, repeated
text, one-control-per-line blocks or extra action buttons without a need.
A paragraph grid is often the right layout: items fill the available line and
wrap together when it runs out. Choose it when it saves space while preserving
readability, meaningful grouping, keyboard/focus and usable hit targets.
Compactness is a default design requirement, not an optional polishing pass.

Use a **paragraph grid** by default for compact groups of controls (toggles,
chips, buttons, short fields, cards): each item at its natural width, placed
left to right and wrapping when the line is full, the way words wrap in a
paragraph. Choose another arrangement when it reads more naturally or improves
meaningful grouping and interaction.

For an expanded component or small control group, its title is the **first
naturally sized item in that same paragraph grid**, followed by the controls.
Let controls sit beside the title when they fit and wrap in reading order when
they do not. Do not reserve a separate full-width header row or body gap for
these titles. Keep disclosure semantics, keyboard access and trailing help.
**Full section headings are the exception:** they may retain a separate row
above the section body. This distinction applies by default throughout the UI.

For paragraph grids containing expandable/minimizable components, override the
visual order to show **expanded items first, then minimized items** by default.
Keep the original relative order within each group. Use the current expansion
state (for example, `order: -1` on an open component), without recreating items,
losing focus or resetting controls. This grouping does not move full sections
around or change their separate heading treatment.

```css
.group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
}
```

Tab wrappers use 6 px padding. Section headings use 5 px vertically and 6 px
horizontally; section bodies use 6 px at the sides and bottom. Compact padding
keeps control minimum sizes and text sizes unchanged.

The HUD bar is the reference (`.hud-bar` in `src/styles/hud.css`): its items
sit side by side at their own widths, with default visibility fitted to one row
as described below. Items set to On can wrap. Interface → Toolbar keeps its
three-way visibility controls in the same paragraph layout.

Do not lay a set of controls out in fixed columns: no `grid-template-columns:
repeat(n, …)`, no row of `flex: 1` children stretched to equal widths, no table
used for layout. Panels are 320 to 420 px wide and labels run from "Theme" to "POI
sprite size tuner". Equal columns give every item the same share, which leaves
empty space beside short labels, cuts long ones off, and stops at the column count
however much room is left on the line.

Only something that needs the whole width takes a whole line, as a paragraph
break does: a full section heading, a continuous track, a text field that needs
room, or essential explanatory text. A nested grid may take the whole width
when its content needs it; its component title still starts its own paragraph
flow rather than forcing a separate header row.

Independent toggles and mutually exclusive choices keep their different
semantics. Mutually exclusive choices use the compact segmented design below;
do not render them as separate checkbox/radio pills.

Each logical component placed in a paragraph grid has its **own compact rounded
rectangle** by default, so its label, control and help read as one group.
Component overrides each have their own rounded enclosure, including when
collapsed. Inside a group, all segments of one choice stay together in the
slider's single track; this does not mean a separate enclosure around every
segment. Use natural widths and minimal padding, and preserve the visible
boundary when groups wrap. Do not replace these groups with unbounded text
scattered across the paragraph or with only a top separator.

### Compact segmented choices

This is the default design for every discrete choice control in every host app.
The user explicitly requires compact text segments inside **one rounded
rectangle**, with selection shown by the segment's fill and inset outline.
It must not become a collection of separate pills or visible radio circles.

- One container sizes itself to its text. Its adjacent segments have natural
  widths; never stretch them to equal columns or across the panel. Use the
  existing 2 px inner track padding, 8 px outer radius, 6 px segment radius,
  1 px by 5 px segment padding and 22 px segment minimum height. Selection uses
  fill plus an inset outline, with light/dark contrast and visible focus.
- Button text is as short as possible while remaining understandable. Component
  modes are **Global / Auto / Manual**. Inherited fields say **Global**, never
  **Use global settings**, **As global settings**, or a sentence. Prefer **WASM**,
  **Default / Workers**, and **1 worker / Pool** where the control's label gives
  the context. Put explanation in help text and fuller accessible names when
  needed. Do not repeat the heading inside every segment. Use digits for counts
  (**1 worker**, not **One worker**).
- Implementation choices use their technology colors when selected: TypeScript
  blue (`#3178c6`) and WebAssembly purple (`#654ff0`), with white text. Unselected
  choices stay neutral. Apply this to global and component implementation fields
  in both light and dark themes; other settings keep their ordinary accent.
  Component containers also use the **actual running** implementation color for
  their outline and a light translucent fill, expanded or collapsed. Pending
  choices do not recolor an active service. Mixed TS/WASM uses both colors;
  not-started, starting and unavailable status stays neutral.
- Arrange label text and the control in the order that reads naturally as a
  phrase. Usually the label comes first: **Implementation [TS / WASM] ?** reads
  better than **[TS / WASM] Implementation ?**. This is a reading guideline,
  not a fixed DOM/CSS order for every parameter: text may precede and follow
  a control when that makes grammatical sense (for example a quantity and its
  unit). Do not enforce a universal slider-first or label-first layout.
  Keep the phrase in one natural-width wrapping row when it fits; **?** is
  the **last item**. Do not give headings or
  short controls an unnecessary full row. Related segments remain inside the
  same container when a narrow width requires wrapping; never split them into
  unrelated pills, clip labels or add horizontal scrolling.
- There is **no separate source-link button/icon in the control row**. Put the
  existing source-link **icon** inline at the end of the **?** tooltip's text,
  like a final character, with the description, default/reason, current value,
  provenance, setting ID, limits and restart/pending behavior. The tooltip holds
  explanation and links, not another copy of the control.
- Use existing recognizable **icons** for familiar actions by default, rather
  than replacing an icon with verbose visible text. A source link keeps its
  external-link icon inside help; do not label it “Source code” or a full file
  path. Give icon actions a full accessible name and hover title. Use visible
  words for the actual setting choices (Global/Auto/Manual, etc.) and when an
  icon would be ambiguous; compactness must preserve meaning and keyboard access.
- Use a compact **?** button by default for supplementary information,
  diagnostics and long explanations. Do not introduce wordy **Details** or
  **More info** actions for the same purpose. Keep help last in its title/row,
  visible even when its component is collapsed, and ensure opening help does
  not expand/collapse that component. Do not repeat descriptions, scope, architecture, caveats or rationale
  under every control. Show text immediately only when proper UX requires it:
  a current error/fallback, unavailable capability, pending/apply state, or a
  short instruction needed to make a correct decision. Keep visible messages
  terse and put the full explanation behind the action. Never hide information
  someone must see to understand the current state or avoid a mistake.
- Preserve native mutually exclusive radio behavior, keyboard arrows, focus,
  accessible names and disabled semantics. Native inputs may be visually clipped
  to 1 px; never use `display:none`, `hidden` or `aria-hidden` to remove the
  interactive inputs from keyboard or assistive technology. The selected fill
  replaces the visible radio glyph. Disabled choices explain their limitation.
- Reuse `createChoiceGroup` and the shared compact-choice styles in `ui`, or the
  standard parameter control that uses the same track. The shared container is
  `.foss-earth-parameter__pills` under `.foss-earth-parameter--compact-choice`;
  `.foss-earth-choice` labels are its segments. Do not copy a per-app variant.
  Continuous numeric/range tracks retain their existing semantics.
- Protect the shared factory and real rendering: one container, one selected
  segment, hidden glyphs, keyboard/focus, disabled states, credit links, compact
  labels, last help button, source inside help, narrow widths and both themes.
  When changing a setting's behavior, preserve these design checks; changing its
  value or backend must not accidentally rebuild it as separate radio pills.

These cases were settled during the compact-controls cleanup (18 October 2026):

- **Independent booleans** use the shared switch, label first: **Label [switch] ?**.
  It is a native checkbox clipped inside `.foss-earth-choice.foss-earth-switch`,
  and `.foss-earth-switch__knob` is its knob. When it is on, it fills with the accent.
  The standard boolean parameter and **Show all parameters** both draw it.
  Do not draw a visible checkbox box.
- The **two-position slider** (`choiceControl: "two-position"`) remains allowed
  for a two-option choice.
- **Every parameter row** gets its own rounded enclosure, not just choice groups
  and components.
- **Slider-first** is opt-in per parameter with `controlFirst: true`. It is used
  where the phrase reads better that way, as in Interface → Toolbar's
  **[On / Auto / Off] Label** rows. Without it, the label comes first.
- **One decision is one track**, even when it has categories. The Map basemap
  is a single track, 3D then 2D. It does not use separate tracks that share a
  radio name.
- A **label too long** to share its line with its track wraps. The track moves
  to the next line, followed by **?**. Segments never shrink or clip.
- A **section's purpose** goes behind a **?** after its title. It does not go
  in an intro paragraph. Pass `help` (and `helpLabel`) on the section entry.
  The **?** is placed in `.foss-earth-panel-section__frame`, outside the
  `<summary>`, so it does not join the summary's name and does not open the
  section.
- A value that applies **on the next start** is saved at once. The section then
  shows **Changes pending** with **Apply & reload** and **Discard**. A single
  control does not reload the page by itself. Renderer → API follows this rule.
- **Editor and debug panels** (pose and link editors, Fly Debug, Performance
  debug) follow the same rules as user panels.
- React hosts use `ChoiceTrack`, `IconButton` and `HelpTip` from
  `@foss-earth/ui/react` (also re-exported by `foss-earth/shell`). These draw
  the same track, icon action and **?** as `createChoiceGroup`,
  `createIconButton` and `createHelpTooltip`. Do not draw a lookalike.
- **Exempt:**
  - Image card galleries, such as Fly's aircraft picker and the tour landing
    page's campus cards. These are authored content, not controls.
  - Destructive confirmations ("Clear this site's browser data", "Return
    without clearing"). Their full wording prevents mistakes.

To check a change in the browser:

- Open every affected tab at desktop and phone width (360 px), in both
  themes. `?set.interface.theme=light` picks the theme from the URL, and
  `?dev=1` adds the editors.
- Give each screenshot its own fresh browser profile. A panel saves whether
  its sections are open, so a shared profile carries that state from one shot
  into the next.
- The brand palette (`ui/assets/theme.css`, `[data-ui-theme]`) loads after
  `ui.css`. A rule in `ui.css` that a palette also colors, such as a checked
  switch, needs a matching rule in `theme.css` that is at least as specific.
  Otherwise the palette's rule wins in one theme.

The [app-wide cleanup assignment](proposals/implementation/ui-compact-controls-handoff.md)
carries these rules into a fresh conversation and defines the audit/verification
scope for the remaining panels.

Cleanup tracking (18 October 2026):

- [x] Make shared `createChoiceGroup` use the same compact segmented track as
  standard parameter choices, fixing the Renderer API choice at its shared UI
  source rather than introducing a renderer-only lookalike. Browser verification
  is recorded with Component execution evidence.
- [x] Component execution: short Global/Auto/Manual and field labels, compact
  track, last help button, inline source icon inside help, no empty stable-state
  banner. Components combines running status and per-component settings; long
  explanations remain behind **?**.
- [x] Audit remaining manually built radio/pill groups in Map, Sky, Interface,
  host-specific panels and legacy compatibility controls. Convert one-choice
  groups to the shared factory without changing selected values or behavior.
  These are in Map, Sky, Scenes, Sphere image, Renderer, Interface, the
  headset, pose and link editors, and in 0sfs Fly, aircraft and ground
  contact. UMN-VR's native panels have a matching patch waiting to be applied.
- [x] Check remaining custom help rows for a leading **?** or separate source
  button. Move help last and source into its tooltip; preserve focus/keyboard.
- [ ] Open exceptions:
  - The legacy `MapCachePanel` (engine) is exported but never mounted, and it
    is not converted.
  - Fly's Weather wind sliders are still raw ranges, because wind has no
    registry parameters yet.
  - gamepad-tools' **Show 3D controller** is still a native checkbox. That
    package is external.

### Dropdowns fit their own text

A dropdown (`<select>`) is as wide as its own text, which is its longest option
and its arrow, and no wider: it is a word in the paragraph, not a bar across it.
Never stretch one to its row, its column or its panel: no `width: 100%`, no
`flex: 1`, no grid column that sizes it. Inside a grid cell or a flex column, set
`justify-self: start` or `align-self: flex-start` with `width: auto`, because both
layouts stretch their items by default.

```css
select {
  justify-self: start;
  width: auto;
  max-width: 100%;
}
```

`max-width: 100%` lets it shrink on a panel too narrow for its longest option,
where the browser cuts the shown option short; that is the only width change
allowed. A dropdown sized to its row leaves a long empty box after "Auto", reads
as a text field, and puts its arrow a panel's width away from the word it
changes. It is sized by its options, not by the one showing, so choosing a
longer one does not move the controls after it. 0sfs's aircraft level of detail,
FOSS Earth's airport position and runway, and gamepad-tools' profile and
controller lists follow it.

## The HUD defaults to one row

The bottom-left toolbar fits its default items into one row, using the space
between the screen's left safe edge and the detail rail and attribution chip
on the right. Measure the widths of those items and their gaps; the available
space changes with the provider, its attribution, the current view and the
viewport. Do not use a phone breakpoint or a fixed estimate of the chip's
width.

Default visibility follows this priority, highest first:

| Priority | Item | Why |
| --- | --- | --- |
| 0 | North (`N`) | The only shortcut for resetting heading |
| 1 | Help (`?`) | A new visitor needs to learn the controls and tabs |
| 2 | Input method | Keeps the current controls visible and accessible immediately after Help |
| 3 | Fullscreen | Enters or leaves fullscreen where the browser supports it |
| 4 | FPS | Useful feedback for anyone |
| 5 | WebGPU / WebGL 1 / WebGL 2 | Explains which renderer is drawing when FPS is low |
| 6 | Camera position (latitude, longitude, altitude, `h/p/z`) | Opens the Location tab |
| 7 | Theme | Also available in Interface → Toolbar |
| 8 | Settings | Also available as a tab under + |

Each configurable toolbar item has an On / Auto / Off choice in Interface →
Toolbar, including FPS and every other performance reading. On uses a filled
switch icon, Auto uses `A`, and Off uses an outlined switch icon; hover and
accessible names give the full words. On stays shown, wrapping when needed;
Auto fits in the available row by priority; Off stays hidden. These are stored
values, independent of whether they came from a default or a saved choice.
Toolbar buttons and FPS default to Auto; other performance readings default
to Off. Existing saved checkbox values migrate
to On or Off.

**Priorities** is one Auto / Custom slider, starting in Auto. Auto uses the default
order above. Custom applies the saved priorities and reveals each item's compact
number field at the left of its existing visibility row, including in Show all
parameters. North has its own field because it has no visibility switch. Lower
numbers come first, with the default order breaking ties. Returning to Auto hides
the numbers and uses the default order, retaining the custom values for later.
North always remains available even when its position in the row changes.

Hide the lowest-priority Auto items first until the row fits, and bring
them back in priority order when space returns. Reserve room for North and the
first two available items after North (Help and Input method by default), shortening long attribution
text inside its chip when needed. Then measure the detail rail and attribution
chip and fit the remaining defaults into the space left over. The credit link
and detail rail stay accessible beside the core controls.

Auto stays selected even when its chip does not fit, including Camera position.
Fitting changes only what is drawn. FPS shows its number above a smaller gray
`fps` label, within the same toolbar row height.

The position readout (`createPositionReadout`, shared with 0sfs's flight chip)
writes the latitude, the longitude and the altitude, then what its host adds:
heading, pitch and zoom distance on the globe, heading in the flight. By default
only the N/S and E/W after the numbers say which is which; Interface → Position
readout can write `lat` and `lon` before them instead, or draw a globe with only
its parallels before the latitude and one with only its meridians before the
longitude, each in the text colour at 1.2em. The same section says what the
altitude is measured from, above mean sea level or above the terrain below, and
whether it is in metres or feet. Mean sea
level is NGA's EGM2008 geoid: raster terrain's heights are already above its
source's sea level, and over Google 3D Tiles, drawn at their WGS84 ellipsoid
heights, the readout takes away the geoid's height from a grid shipped with the
app, downloaded once, when first needed (`src/terrain/geoid.ts`). The grid's
spacing, 1°, 30′ or 15′, is the Sea level grid parameter beside it, each choice
with its download and its measured error. On the globe the altitude is the
camera's own, not that of the point it looks at. Digits are tabular, so a
changing number does not shift what follows.

## One home for every control

Every setting lives in exactly one place, a section of a tab.

- A new control is a new tab, unless the person asked to add it to a tab that
  already exists. Do not invent a floating plate, a corner overlay, or a second
  copy of the controls beside the windows. A gizmo drawn in the world (axes
  on a photograph, for example) is not a tab: the controls that read and save
  what it changes still live in a tab.
- A toolbar button is a shortcut that toggles its tab: it shows the tab, and
  closes it when the tab is already the one showing. ⚙ toggles Settings, the
  input-method button Controls, the position readout Location, the renderer chip
  Renderer and the map chip Map. Call `toggleTab` on the overlay handle; keep
  `openOrSelectTab` for links that should only ever open, such as "change
  controller bindings".
- A toolbar button never pops up its own copy of the controls, and never a menu
  of choices either: two copies drift apart and double the space they use. The
  renderer and basemap choices have tabs of their own for that reason, and
  `HudBarMenuItem` is deprecated.
- Nothing floats in a screen corner behind a launcher button. Controls go in a
  tab, where the dock layout manages the space.
- A tab that holds several groups is built from collapsible sections
  (`SectionsPanel` from `foss-earth/shell`, or `createSectionsElement` for a tab
  whose content is an element). A section starts closed unless people usually
  arrive wanting it, as Input method does when its toolbar button opens
  Controls, and Source and Detail do in the Map tab.
- Each section is a parameter section (`createParameterSection`, see the
  [settings spec](proposals/settings.md#implementation)): its own controls,
  then a control for every main-level parameter homed in it that those don't
  cover, hosts' included, then **Show all parameters**. The Map tab
  (`createMapSourcePanel`) is Source, Detail, Automatic adjustment, Loading
  and memory, Imagery selection and Terrain selection; the
  Renderer tab (`createRendererPanel`) is Renderer, Resolution and frame
  rate, Depth range and Performance debug; the Sky tab (`createSkyPanel`) is a
  line saying where the Sun is, with a button that opens Date and time, then
  Atmosphere and illumination, Moon and stars, Ground and Exposure and display; the
  Date and time tab (`createDateTimePanel`) is one section, its two dials; the Scenes tab is Content, Image links
  (only when editing is enabled), Orbs, Motion, Loading and memory, Tiled images, Saved images and Credits; the Controls tab is Input method,
  Camera, Orbit, Mouse and trackpad, Touch and Controller; the Interface tab
  is Toolbar, Position readout, Log and Search; and the Settings tab is Presets, Saved settings, App files and Diagnostics. About is
  a tab of its own (`createAboutPanel`): which version runs and what it is built from, as a tree from the app
  down, where someone looking for the version looks for it, under +. Map and
  Renderer add a section for
  every section of their tab a host's parameters are homed in, such as 0sfs's
  Renderer → Instruments, so a host never builds a second copy of the tab.
- Controls are drawn from the parameter's kind, and each has one
  implementation: independent switches retain their boolean semantics; a choice
  is a compact segmented control; a number is a value track with its readout as
  a field, the default ticked and any named values ("Off", "Normal") as compact
  segments; discrete priorities use
  compact numeric fields; a range is a range
  track; text is a field, never showing a secret. Text and controls form a
  compact, naturally reading phrase, with `?` **last**. Source links belong inside
  that tooltip; never add a separate source-link button. A custom priority field
  comes before the visibility segments. `?` opens an explanation tooltip with
  the description,
  default and its reason, current value and provenance, parameter ID, limits
  and restart notes. It closes on another click, Escape or a click outside.
  The tooltip contains explanation and its inline source icon; the setting
  keeps its single home.
  Hosts use `createHelpTooltip` from the public `foss-earth/shell` export for the
  same behavior. Its `label` is the button's complete accessible name, `content`
  is the explanation HTMLElement, and optional `onOpen` refreshes that text when
  requested. Only one explanation is open across settings and host controls;
  clicking `?` toggles it, and Escape or a click outside closes it. The tooltip
  stays within the visible viewport without changing the panel's layout. Its
  handle exposes the wrapper, button and content, plus `open`, `close` and
  `destroy`; callers destroy it when removing or rebuilding the panel so no
  detached explanation or input listener remains.
  `closeHelpTooltipWithin(container)` closes the explanation whose button belongs
  to a panel before that panel collapses or detaches, while leaving another
  panel's explanation alone.
  An invalid edit opens its explanation so the rejection is visible. The source
  link inside that explanation has an accessible name and opens in a new tab. Per-setting
  reset buttons are removed; Reset all remains in the section's transfer controls.
- A quantity that comes round again, the time of day or the day of the year, is a
  dial (`createDial` in `src/shell/dial.ts`): a knob on a ring, which a press on the
  ring takes there and a drag turns on past the top into the next day or year, as a
  clock's hand does, never jumping back. The moments that matter are marks round
  the edge, their names written along it, upright, and pushed apart where they
  would overlap, each a press away; the readout and a button sit in the middle. A
  dial is 140 px across, so two side by side fit a 320 px panel; where they do not
  fit they wrap, as any item of a paragraph grid does. The knob takes a slider's
  keys, and its ring takes its own touches (`touch-action: none`).
- A range is one track with two thumbs, never two sliders. Choosing an acceptable
  part of one continuous scale is one control: the thumbs are its ends, the part
  outside them stays visible but dimmed, and a default or a host's marker (such
  as 0sfs's flight minimum) sits on the same track. Detail tracks use the HUD
  rail's colours, green for finer through yellow to red for coarser, anchored to
  the scale so a value has the same colour wherever it appears. A host's marker
  is a bar in its own colour, labelled under the track, hollow while waived; a
  requirement stripes the part of the range it refuses. `createTrack` draws all
  of them.
- Interface → Toolbar holds all configurable toolbar visibility, including
  performance readouts. Renderer → Performance debug holds tuners and profiling.
  Auto items fit by the priority above; On and Off take precedence.
  Hiding a button never hides what it opened; its tab stays under
  +. The same section holds one two-position theme slider, with sun and moon icons,
  so theme remains changeable when its toolbar shortcut does not fit.
- The menu under a tab strip's + closes on Escape, as on a click outside it, and
  the key goes no further: no panorama is left and no binding reads it. Focus goes
  back to the + button.
- The menu under a + ends above the HUD bar, and takes another column for the tabs
  that do not fit between its button and the bar, so none is out of sight
  (`menuFit.ts`; the overlay gives the bar's top as `menuBottom`). A host may draw
  the bar over the panels' layer, as 0sfs does, and a menu that ran under it hid its
  last tabs: on 2026-10-07 About, last in the menu, read as not there.
- The menu under a tab strip's + is drawn outside its panel, in the overlay's own
  layer, fixed to the window where the + button is. The panel clips what passes
  its edges, and with many tabs the + sits at the strip's right end, so a menu
  drawn inside the panel was cut off there and the globe or a panorama showed in
  its place.

## Settings describe one decision and its current effect

Use names people recognize from the work being configured. Sky, terrain and
Google tiles are **components**; call their individual settings **Component
overrides**. Reserve CPU core and thread for hardware/execution concepts. A
user-facing name must explain the purpose without knowledge of an internal
package name such as `native`.

A control answers one question. Execution policy (Auto or Manual), implementation
(TypeScript or WebAssembly), placement (main thread or background workers) and
parallelism are different decisions. Do not encode their combinations as one
ordered performance scale. A background worker runs on another thread with
either implementation; several independent worker instances and one shared-memory
computation pool are different architectures. Describe their scope explicitly.
Keep memory ownership an implementation detail unless choosing it helps the
person make a meaningful decision. Show unsupported combinations with a reason;
a future threaded backend must not look like an available faster setting.

Offer a global default and component overrides that explicitly inherit it.
Automatic choices explain what is currently selected. Keep timing, parity,
payload and other diagnostic detail secondary to the controls and a readable
summary of what is running.

A saved selection and a running service are separate states. Apply a change live
when its resource lifecycle supports it. Otherwise, immediately show **Changes
pending** beside the affected setting and an explicit action such as **Apply and
reload**. Identify what is running now and what will run after that action; a
footnote or help tooltip alone is insufficient. Clear the pending state only
when the new configuration is active. Report a fallback with its reason, and
distinguish it from pending changes and a component with no work yet.

The 18 October 2026 execution-settings feedback is recorded in the
[native state document](proposals/implementation/webassembly-native-state.md#execution-settings-feedback-18-october-2026).
The user selected **Component execution**. Its sections are Global defaults and
Components. Each component combines its settings and real running status, with
diagnostics behind the trailing **?** button. A collapsed component shows only
its name and **?**; an expanded title reads, for example, **Terrain heights: TS
(2 workers) ?** or **Terrain geometry: TS (main) ?**. Show actual measured
execution once in the title, without a duplicate Running line. Preserve mixed
worker/main execution and fallback information. Separate manual choices and visible
Apply and reload behavior implement these requirements; shared-memory WASM
threading remains unavailable.

Show only components relevant to the selected map mode, updating immediately
when `map.source.basemap` changes. Raster basemaps show Terrain heights, Terrain
geometry and Imagery heights; Google 3D Tiles shows Google tile preparation.
Sky and Ground spatial index are shared and remain visible in both modes (finite
ray queries use the ground pipeline for either surface). Preserve hidden
components' overrides, expansion state and complete diagnostic reports. Close
help belonging to an item that becomes hidden and move focus to a visible control
if necessary; changing the map must not discard pending execution choices.

## A control uses its input or passes it on

Every control over the world either uses an input or passes it to the world behind
it, the same way for every control, so that nothing in between swallows a gesture
or a key meant for the camera or the vehicle.

- **Swipes and pinches.** A two-finger swipe over a panel that cannot scroll that
  way, over the HUD bar or over an instrument moves the camera as it would over the
  map, and a pinch zooms it, whichever camera has the canvas
  (`passUnusedInputToWorld` in `src/input/passToWorld.ts`, which the runtime
  starts). A panel keeps the swipes it scrolls with, along its own axis; a listener
  that calls `preventDefault` keeps the events it uses. The first event of a
  gesture decides for all of it. Nothing unused reaches the browser, where a
  sideways swipe went Back a page and a pinch zoomed the page, and the page itself
  never overscrolls (`overscroll-behavior: none` on `html` and `body` in the shell's
  stylesheet).
- **Keys.** A focused control keeps the keys it uses and the bindings behind it
  take the rest: a text field or a dropdown every key, a slider its arrows, Page and
  Home/End keys, a checkbox Space, a button Space and Enter (`controlTakesKey` from
  `@felipegalind0/gamepad-tools/browser`). A control whose keys none of these
  describe names them in `data-takes-keys`. A trim slider just dragged therefore
  still lets W, A, S and D fly, as the custom throttle lever always did, and a
  focused slider's arrow keys move its thumb without also turning a panorama. Every
  key binding asks this one rule, never a list of its own of which elements to
  ignore.
- **Escape** closes what is open over the world, such as the + menu, before it
  reaches anything behind it.

## A panorama's tabs

Inside a panorama, a large **Return to map** button sits at the bottom centre,
just above the HUD bar. Entry leaves existing tabs and their minimized state
alone throughout the flight and while inside. Once the panorama is on screen
(`onScreen` in the tabs' snapshot), if no tabs are open, a tab titled
with the panorama's title opens, after a sphere mark (`createViewerTabs` in
`sphere-image/src/panels.ts`, given to `WindowOverlay` as `sphereTabs`). An
existing tab keeps its selection; the photograph tab remains available under +.
The windows retain their chosen widths and heights when
entering or leaving a photograph, and remember those sizes across reloads.
Photograph content uses the same compact padding as the other tabs and scrolls
within the window instead of resizing it. The tab holds:

- The photograph's description and the groups it is in. This content has no
  section header or repeated title. Capture, accuracy, pose, north alignment
  and attribution stay in the scene metadata; attribution also appears in
  the HUD bar.
- **Links**, collapsed by default: a button for each link, as in the view.
- **Image detail**, collapsed by default: which image is on screen, why no
  larger one is (the detail
  asked for, the device's texture limit or a memory budget, each named, or a
  load that failed), the images the panorama offers, and
  `scene.panorama.immersionWidth`, whose one home this is. These sections are
  available by scrolling within the remembered window size.
- **Placement**, when the address has exactly one `dev=1`, in local dev and on a
  published build. Visitors without that flag do not download the editor.
  Saved corrections for this browser still apply on an ordinary visit. A
  right-click on an orb arms it and stays on the map; a short click or tap
  enters. A touch or pen long-press on an orb, about half a second without
  moving past the click threshold, arms it and does not also enter. While a
  photograph is open, that photograph is the one being edited. Closing the
  tab or clicking the ground stops editing and does not start again just
  because the same photograph reports its status. The controls stay at the
  bottom of this tab, including when no photograph is selected: the saved-edit
  count, Export, Download, Copy JSON and Clear. The red arrow is east and the
  blue arrow is north; the green one is up. Hovering a red or blue arrow
  lengthens it, and it stays that long while its turn arc is open. Clicking
  it shows an arc of one eighth of a circle on both sides of that arrow,
  turning about up. Slide the arc to turn the red and blue pair together.
  That turn is only how those two arrows drag: it is not the photograph's
  heading, and it is not exported. Arrow heading sets the same turn. The
  circular arrow at that field's corner puts the pair back on east and north;
  Reset restores the published place and leaves the arrow turn alone. Dragging
  a shaft moves the photograph along the way that arrow points. The heading
  and pitch rings stay on the geographic axes. See through is not saved.
  North checked records a confirmation against the text in Checked against.
  Changing heading, pitch or the capture place clears that check. Marker east
  and north are display offsets. Save place is only for a local `*.scene.json`
  on the dev server (`POST /__foss-earth/pose`, plugin `apply: "serve"`). A
  published tour offers Export instead. Export, Download and Copy keep a JSON
  file; they do not clear the edits. Reload afterward to see a saved local
  file in the status bar. The number fields shrink to the text in them.
  Inside, the gizmo sits in the center of the view.
  The editing selection is remembered for this browser tab and scene: reloading
  into the same photograph restores edit mode and its saved corrections.
  Valid focused number fields are committed before reload. Done editing or
  closing the editing tab stops this recovery until editing is enabled again.

Entering a photograph from the map keeps the heading and pitch of the incoming
flight. Look up and remembered thumbnail views do not replace that direction or
level its pitch afterward. An explicit saved view used to restore a visit still
restores its exact direction.

A failure also goes to the log as an error line, since a tab can be closed: the
scene file, entering a panorama, a larger image of the one on screen, and orb
previews. Previews fail together when their server stops, so they share one
line that counts the panoramas and moves to the top with each new failure.
Cancelled work and a larger image held back by a limit the user set are not
failures and are not logged.

Following a link retitles the same tab. Closing it leaves the panorama, exactly
as Escape does; while a panorama is still being entered, closing it cancels.
The **Return to map** button leaves it too.

Tabs belong to a context, the globe or a panorama, and the overlay shows those
of the context on screen:

| Tab | On the globe | In a panorama | Why |
| --- | --- | --- | --- |
| Location | yes | yes | Place search and coordinate fields stay available in a tour |
| Map | yes | kept if already open | A closed Map tab is offered again when returning to the map |
| Renderer | yes | yes | The panorama is drawn by the same renderer, at its resolution and frame-rate cap |
| Controls | yes | yes | The input method and controller bindings drive the panorama's look too |
| Interface, Settings | yes | yes | The toolbar, log, search, presets and saved settings apply anywhere |
| About | yes | yes | Which version runs is the same anywhere |
| Scenes | yes | yes | Its list enters any other panorama of the scene, and its budgets hold the image on screen |
| The panorama's title | no | yes | The panorama on screen |
| 360 image settings | no | yes | What matters only inside a panorama |

A tab hidden by a context comes back where it was, and selected if it was, when
its context returns, unless it was opened elsewhere meanwhile
(`src/shell/contextTabs.ts`). A panel the panorama's tab opened goes back to
how it was when the panorama is left. The bar hides what is about the map in a
panorama too: the detail rail, the basemap chip, whose place the panorama's
credit takes, and the camera's position, whose Location tab is hidden.

The Scenes tab holds what the globe shows and what both sides share: Content
(choosing a scene, its panoramas and their orbs), Image links (connecting two
photographs, in local development or with exactly one `dev=1`), Orbs, Motion (hover growth,
flying into and out of 360 images, the entry reveal, fades and reduced motion,
which play on the globe side too),
Loading and memory (one set of budgets: the orbs' previews and the image on
screen come from the same pools) and Credits. 360 image settings holds Image
(the sharpness target), Looking (the field of view, looking up and down, and
every look and zoom rate) and Entering (where you look and how long levelling
takes).

## Map source and credits

The HUD bar ends with the map source, pushed to the bottom-right corner by its
slot: the detail rail, then a chip of two halves
(`createMapSourceHud` in `src/shell/mapSourceHud.ts`, mounted in the bar's last
slot). The first half is one button, the download speed, the provider's logo
when it has a square one and its name, that toggles the Map tab. The second
links to the provider's attribution page, marked with the external-link icon
(`createExternalLinkIcon`: a box open at its top-right corner, an arrow leaving
through the gap). Each half fills the chip to its
rounded edge and lights up whole on hover; nothing underlines. It reserves its
width beside the default toolbar's single row. When the person's explicit
toolbar choices require wrapping, it remains part of the bar's layout rather
than covering other controls.

The toolbar's first row never leaves the bar's edge, and the map source never
gets a row of its own under it. Interface → Toolbar → **Imagery in the toolbar**
chooses whether that source joins the buttons. Off, the default, keeps it in
the bottom-right corner, so the empty space stays between the toolbar and the
provider. When the row is full moves it next to the last control that fits
once a wanted control is hidden or does not fit beside it
(`hud-bar--end-attached`). Always keeps it as the last toolbar button even
when the corner has room. A pinned control that does not fit keeps its row
above the first on a bar at the bottom. The fitting (`fitHudBar` in
`@foss-earth/toolbar`) counts the controls it hides as outside the row, so their
hidden state must take them out of the layout whatever an item's own style says.
The row's width is the bar's content box.
On 2026-10-14 the
windows-on-the-edges style gave every item `position: relative`. The hidden
items took their width back, and at 800 px and narrower the bar wrapped with
the provider under a raised toolbar. The browser check missed it: it only
compared the slot's bottom with the bar's, which a wrapped bar still passes, and
it runs at 1100 px, where nothing is hidden.

A provider whose logo spells its name, such as CARTO, shows that logo instead of
the mark and name (`wordmark`), followed by the basemap's own name, "Positron".
Its artwork comes in a dark and a light version, and the theme picks between
them.

Every basemap gives its credit page as `attributionUrl`, and every elevation
provider as `attribution`. In the Map tab, the pill of each source in use, the
basemap and the elevation provider alike, ends in the same icon linking that page
(a choice's `creditUrl`). The other pills have none, and no text names the
credit. Put no other credit link on the map; add the provider's page to its
definition.

The detail rail is the one interactive temporary-detail control: finer to the
left, coarser to the right, and both ends are ordinary values with no reset
meaning. A tick marks the saved default; the blue marker shows a renderer target
only where one number describes it, never a claim that imagery has loaded. The
saved range and default have their one home in the Map tab's Detail group, and
both observe the same `MapDetailController`.

The bar spans the bottom edge and publishes its height as `--foss-hud-bar-height`.
Anything anchored above the bar, such as 0sfs's instruments, clears it with that
variable rather than a fixed guess.

## Input method

The Input method section of the Controls tab shows a **Touch** part on a device
with a touchscreen, then a **Mouse or trackpad** part on a device with a pointer.
A touch laptop, or an iPad with a keyboard and trackpad, gets both.

Touch is not a mode to choose. Touch gestures work whatever the pointer mode is
and use their own sensitivity; the mouse or trackpad choice only decides how
wheel and gesture events are read. `createInputModeHud` in `src/hud/inputModeHud.ts`
draws both the toolbar button and the section; hosts mount the section with
`mountInline` and pass `onToggle` to toggle their Controls tab.
