# Deploying to GitHub Pages

The live site is https://foss-earth.github.io/. `/` is the landing page.
`/app/` is the Earth app. Publishing is a manual build from a side-by-side
checkout of the Earth repositories. Pushing `main` does not publish the site.
There is no GitHub Actions workflow for it.

The landing repository is
[foss-earth/foss-earth.github.io](https://github.com/foss-earth/foss-earth.github.io).
Its `scripts/deploy.mjs` is the publisher. This docs repository has no app
bundle and no deploy command of its own.

## Publish

The app links each library with `file:../…`, so the build compiles the sibling
checkouts as they are on disk.

```sh
cd ~/gh/foss-earth/foss-earth.github.io && npm run deploy
```

The deploy first records the commit of each checkout the app is built from in
`app/deployed-from.json`, and commits and pushes it in `app` when one moved, so
new code in a library is a new version of the app (About's record; see
[CONTRIBUTING](https://github.com/foss-earth/.github/blob/main/CONTRIBUTING.md#versions)).
It stops if `app`'s branch lacks commits its remote has. Then it runs
`npm run build` in `app/`, which typechecks and writes `app/dist/` with Vite's
base `/app/`, and `npm run build` in `foss-earth.github.io`, which copies that
directory to `dist/app/` and adds the landing page (`index.html`,
`landing.css`, `foss-earth-sw.js`). Last, it fetches `origin/gh-pages`,
replaces that branch with `dist/`, and leaves `eac-prototype/` and `examples/`
in place. The deploy commit records the short SHA of the `app` checkout. GitHub Pages serves
the `gh-pages` branch from the repository root. `main` is not changed.

## Before the first deploy on a machine

- Node.js 22 or newer.
- The Earth repositories checked out side by side, and `gamepad-tools` beside
  them, as in the [app README](https://github.com/foss-earth/app/blob/main/README.md).
- `npm install` in `app/` at least once.
- Push access to `foss-earth/foss-earth.github.io`, with git credentials already
  working. The deploy pushes as you.

Pages is set to the `gh-pages` branch, folder `/ (root)`, under **Settings →
Pages** on `foss-earth/foss-earth.github.io`.

## Check

A blank page can still return `200`. Check the app page and its script:

```sh
curl -o /dev/null -w '%{http_code}\n' https://foss-earth.github.io/app/
curl -s https://foss-earth.github.io/app/ | grep -o 'src="[^"]*"'
curl -s https://foss-earth.github.io/app/ | grep -o '<meta name="foss-earth[^>]*>'
```

The script URL starts with `/app/assets/`. The meta tags name the build time and
the app commit. GitHub can take a minute to serve the new `gh-pages` commit. A
browser may still show a page it kept; a hard refresh loads the published one.

## The campus tour

The University of Minnesota tour is a second site,
https://umn-vr.github.io/tour/. It is built from `~/gh/UMN-VR/tour` against
these same sibling checkouts (`foss-earth` and `@foss-earth/ui` are `file:`
links), so a globe change is not on the tour until the tour is published too.
`npm run deploy` there records what the tour is built from in its
`deployed-from.json`, as the app's deploy does, then builds and pushes the tour
repository's own `gh-pages` branch. It keeps the photographs already published. The club homepage is a
different repository and this command does not publish it.

```sh
cd ~/gh/UMN-VR/tour && npm run deploy
```

## When the page is blank

Asset URLs in `app/dist/index.html` must start with `/app/`. That base is set
in `app/vite.config.ts`. The landing build refuses a bundle whose page does not
load `/app/assets/`.
