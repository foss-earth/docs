# Deploying to GitHub Pages

Redeploying the live site is one command:

```sh
npm run deploy
```

That's it. A minute or so later, https://felipegalind0.github.io/foss-earth/ serves the new build.

## What the command does

`npm run deploy` runs `deploy:gh-pages`, which is two steps:

1. `npm run build -- --base=/foss-earth/` — typechecks (`tsc -b`), then builds with Vite. The
   `--base` flag matters: Pages serves the site from `/foss-earth/`, not the domain root, so every
   asset URL in the bundle has to be prefixed with the repository name.
2. `gh-pages -d dist` — commits the contents of `dist/` to the `gh-pages` branch and pushes it.
   GitHub Pages serves that branch directly. Nothing on `main` is touched.

The deploy is manual and runs from your machine. There is no GitHub Actions workflow in this
repository, so pushing to `main` does **not** republish the site — you have to run the command.

## Before the first deploy on a new machine

- Node.js 22 or newer.
- `npm ci` at least once, so the `gh-pages` CLI is installed.
- Push access to `origin`, with git credentials already working (the command pushes as you).

## Repository settings

Pages must be set to deploy from the `gh-pages` branch, folder `/ (root)`, under
**Settings → Pages** in GitHub. This is already configured; you only need it when setting up a
fresh fork. The `gh-pages` branch is created automatically by the first deploy.

## Verifying

```sh
curl -o /dev/null -w '%{http_code}\n' https://felipegalind0.github.io/foss-earth/
```

`200` means the site is up. Hard-refresh in the browser — Pages caches aggressively and a normal
reload will happily serve you the previous build.

## Troubleshooting

**The page loads blank and the console shows 404s for `/assets/*.js`.** The build went out with the
wrong base path. Use `npm run deploy` rather than calling `gh-pages -d dist` against a plain
`npm run build`, whose base is `/` for local dev.

**The deploy reports success but nothing changes.** The `gh-pages` package keeps a cache in
`node_modules/.cache/gh-pages` that can get out of sync with the remote branch. Clear it and retry:

```sh
npx gh-pages-clean
npm run deploy
```

**Renaming the repository.** The base path is hardcoded in the `deploy:gh-pages` script in
`package.json` and must match the new repository name, otherwise every asset 404s.

## Deploying your own fork

Change `--base=/<your-repo-name>/` in the `deploy:gh-pages` script in `package.json`, then run
`npm run deploy`. Your copy will be served from `https://<your-user>.github.io/<your-repo-name>/`.
See [Development](development.md) for what running a fork involves.
