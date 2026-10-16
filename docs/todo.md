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
in [Performance](performance.md). WebAssembly is still the section below,
and it waits on that work.

## WebAssembly builds

Every component where it makes sense should eventually have a WebAssembly (WASM)
LTS build. Nothing is compiled to WASM yet.

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

So a WASM build means rewriting a component's core in a language that compiles
to WASM well (Rust, C++, Zig or AssemblyScript), keeping a thin TypeScript
wrapper with the same API, and testing that both behave the same. The cost is
roughly a rewrite of that core, so it pays off for heavy, self-contained
computation and not for UI or rendering code. Profile before choosing; the
likely candidates are:

- image decoding and resampling (images);
- projection conversions (cubemap, equirectangular, tiled-cubemap);
- sky model calculations (sky);
- preview sheet composition (preview-sheets).

ui, toolbar, about, dev, scenes and the app shell are not candidates. No
infrastructure of our own is needed: GitHub Actions can install the toolchain
(for example Rust and wasm-pack), build the WASM and publish it with the release.

The precompiled LTS builds in the previous section don't depend on WASM: static
JavaScript builds already avoid installing anything.

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
