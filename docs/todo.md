# Follow-ups

Work across the Earth repositories that isn't done yet. The app's own
follow-ups are in [app's docs/todo.md](https://github.com/foss-earth/app/blob/main/docs/todo.md).

## Scenes photograph grid

The Scenes tab should list each photograph once, grouped by indoor/outdoor or
by tour stop, with collapsed preview-sheet cards, one mini 360 viewer for the
expanded card, and an opening-look setting (last view, per photograph, or a
fixed position including Look up). Handoff:
[proposals/scenes-photograph-grid.md](proposals/scenes-photograph-grid.md).

## Choosing how each library is used

For each library, a developer should be able to choose between:

1. a pinned, precompiled LTS build;
2. the latest source on GitHub;
3. a checkout on their own machine.

The first two shouldn't install anything or take up disk space. Only the third
exists today ([app README, "Local source"](https://github.com/foss-earth/app#local-source)).
The first two could be static builds of each library hosted at fixed URLs (for
example on GitHub Pages, one per LTS release and one for `main`), which the app
loads through an import map instead of from `node_modules`.

## Performance

The JavaScript speedups, the proof they match the shipped pixels, the
frame-budget streamgraphs, and the remaining app, sky and capture work are
in [Performance](performance.md). The WebAssembly program below starts with
measurement and can prepare isolation and tooling alongside it. Every optimization not done yet, ranked by gain
against effort, is in the [Optimization backlog](optimization-backlog.md).

## WebAssembly builds

Every component where it makes sense should eventually have a WebAssembly (WASM)
LTS build where measurement justifies it. The new Rust cores are not built yet;
0SFS already uses JSBSim compiled from C++ to WASM.

WASM isn't a build setting for this code. The libraries are TypeScript, which the
browser's JavaScript engine already compiles to machine code, and most of them
spend their time calling browser APIs (the page through React, the GPU through
Babylon.js) that WASM can only reach through JavaScript anyway. Nothing turns
TypeScript like this into faster WASM:

- AssemblyScript looks like TypeScript but is a different language, so code has
  to be rewritten into it.
- Compilers of full JavaScript to WASM, such as Porffor, are experimental.
- Running JavaScript inside a WASM build of a JavaScript engine, such as Javy
  with QuickJS, works but is slower than the browser's own engine.

So a WASM build means rewriting a component's core in Rust, keeping a thin TypeScript
wrapper with the same API, and testing that both behave the same. The cost is
roughly a rewrite of that core, so it pays off for heavy, self-contained
computation and not for UI or rendering code. Profile before choosing; the
likely candidates are:

- terrain mesh construction and tile parsing (engine);
- ground height grids and collision BVHs (engine, with 0SFS ground contact);
- projection conversions (sphere-cubemap, sphere-equirectangular, sphere-tiled-cubemap);
- sky model calculations (sky);

Keep browser image decoding in `createImageBitmap` workers. Preparation-time
JPEG codecs are a separate native-tool decision; they are not part of the
projection binary.

ui, toolbar, about, dev, scenes and the app shell are not candidates. Builds
run locally on the Mac with a pinned toolchain. Commit the generated binaries,
glue and metadata with hashes; checks rebuild when that toolchain is present,
and verify retained artifacts otherwise. No hosted CI is required.

The precompiled LTS builds in the previous section don't depend on WASM: static
JavaScript builds already avoid installing anything.

### Plan

[WebAssembly builds](proposals/webassembly.md) is the end-to-end plan, ranked by
gain against effort. The [implementation brief](proposals/implementation/webassembly-agent.md)
has a paste-ready assignment, gates W0–W12 and their acceptance checks.

- GitHub Pages stays the host.
- Shared memory is on by default, with the headers it needs added by the apps'
  service worker.
- Rust for the new native cores.
- One binary per map family (Google 3D Tiles; raster terrain and imagery) and
  one per library core.
- Each binary has a threaded and a single-threaded build, and the TypeScript is
  kept as the reference and the last fallback.
- Workers move work off the main thread first; Rust replaces measured CPU
  kernels. Shared memory and Rust are tools to measure, not evidence that a
  build is faster.

## Libraries on their own

- The libraries name each other by version (`0.1.0`), and those versions aren't
  published, so a library's own `npm install`, tests and build fail unless it
  is used through the app. Link siblings the way the app does, or publish them.
- On a machine with the app installed, a library's tests can run on the app's
  tools instead of a second install; make that a command.
- Give each library a lockfile ([npm install loop](incidents/2026-10-11-npm-install-loop.md)).

## Landing site

[foss-earth.github.io](https://github.com/foss-earth/foss-earth.github.io)
still assembles the site from compiled app archives stored in the repository.
It should build from the app instead. Its GitHub `main` still holds the old
single-repository history, which the split landing repository doesn't share.

## Migration-process documents

Some documents (for example `docs/admission.md` and `docs/validation.md` in
several libraries, and this repository's `migration.md`, `setup.md` and agent
prompts) describe the split's process rather than the code. Rewrite or remove
them.
