# Search tab TODO

Status: deferred feature, 2026-10-08. Record this in the repository plan;
**do not implement Search or provision its repository during the split**.
It is not included in the current tab counts or migration acceptance gates.

Proposed owner: **`foss-earth/search`**. Provide one shared Search tab with a
search bar for finding anything exposed by the other registered tabs: tabs,
sections, settings, actions, help and feature-provided content. Earth, the UMN
tour and flight will use that implementation with their own registered content.
This is application-wide discovery; it does not replace the existing Location
tab's geographical search or require sending queries to an internet service.

## Intended behavior for the later implementation

- Search titles, labels, descriptions and useful synonyms supplied by each
  feature owner. Show the owning tab/section and enough context to distinguish
  similar results. Large or dynamic feature content can register a provider.
- Selecting a result opens its canonical tab/section and focuses or reveals
  the existing item. Search does not create duplicate editable settings.
  Selecting a result that describes an action does not silently execute it.
- Keep results consistent with installed features and the active globe,
  panorama or flight context. Dev-only content follows `?dev=1` visibility;
  search must not expose hidden developer/private state through its index.
- Support keyboard navigation, accessible result announcements and useful
  empty states. Avoid rebuilding an unchanged index or drawing unchanged frames.
- Start with local search. External search, ranking choices, index budgets and
  any new network service require their own later design decisions.

## Ownership and proposed dependency direction

`search` consumes public `foss-earth/ui` registration/navigation contracts.
Hosts compose it and supply feature metadata/providers. It must not import
every feature implementation, the globe application, the tour or the simulator
to discover their controls. Each feature retains its data and settings state.
No per-host Search repository is needed.

The graphs show proposed future arrows from each host to `foss-earth/search`
and from Search to UI. They are TODO relationships, not current package
dependencies. Final provider schemas and integration tests belong to the later
Search assignment; this document does not freeze an unimplemented API.
