# Map loading recovered after clearing browser data (2026-10-11)

Status: recovered, cause unconfirmed. Date uses America/Chicago.

## What happened

During panorama UI work, the user reported that the map would not load.
They cleared browser data and reported that the map then worked again.
The browser, page version, map provider and exact scope of the data cleared
were not recorded.

## Evidence and recovery

The confirmed evidence is the user's before/after observation: loading failed
before clearing data and succeeded afterwards. No original console error,
failed request or diagnostic report was preserved. The agent did not clear
the user's browser data.

No cache or service-worker change was made in response to this incident.
Subsequent local UI checks used isolated test browser profiles; those checks
do not establish what failed in the user's earlier profile.

## What remains unknown

Clearing browser data can affect saved settings, app files, HTTP caching and
stored map tiles. The recovery therefore does not identify which of those
was responsible, or establish that a cache was corrupt.

A read-only code review found separate storage mechanisms:

- The [app-file worker](https://github.com/foss-earth/ui/blob/main/vite/appFilesWorker.js)
  stores app assets, rather than map tiles.
- The [map cache](https://github.com/foss-earth/engine/blob/main/src/browser/mapCache.ts)
  falls back to network loading when its initialization fails.
- Saved settings can preserve a provider or renderer selection across visits.

An older page requesting app chunks after an update and a saved configuration
problem are possible explanations. Neither was reproduced or confirmed.

## Next recurrence

Before clearing data, preserve the app's Bug report, the first console error
and the first failed network request, including its status and URL without
credentials. Record the page's build version, browser and map provider. That
evidence should distinguish an app-asset problem from a map-provider,
settings or storage failure.
