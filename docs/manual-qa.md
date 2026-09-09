# Manual QA checklist

Exercise these by hand before publishing a build. See [Development](development.md) for the
automated checks (`npm run ci`).

- Boot without a key and confirm fallback mode is visible.
- Boot with `?key=...` and confirm Google tiles mode is reported.
- Verify desktop controls: left drag pan, right drag orbit, shift plus trackpad swipe orbit, wheel zoom.
- Verify mobile/touch controls: one-finger pan, two-finger orbit, pinch zoom.
- On mobile, confirm the bottom HUD row is fully tappable — browsers with a bottom URL bar
  (Firefox Android) overlay the page, and the HUD offsets itself to clear it.
- Confirm HUD lat/lon/heading/pitch/zoom updates while navigating.
- Click the north button and confirm heading resets and POI tracking exits.
- Add/remove a test layer and confirm POI picking/tracking and cleanup behavior.
- Watch the perf pill for stable frame timing and culling/tile counts during normal navigation.

## Platform coverage log

- macOS desktop: Chrome, Firefox, and Safari — passed 2026-05-17.
