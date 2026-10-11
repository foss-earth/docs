# npm install looped forever in `about` (2026-10-11)

## What happened

After the change to `YY.MM.DD.#N` versions, `about`'s own tests needed a run.
`about` had no `node_modules` and no lockfile, so this ran in it:

```sh
npm install --prefer-offline --no-audit --no-fund
```

It never finished. After 10 minutes it was using one CPU core fully and 2.6 GB
of memory, and it hadn't written a single package. In its first two minutes its
debug log reached npm's limit of five 10 MB files (about 1.25 million lines), all
the same few lines repeating. It was stopped by hand.

npm 11.19.1, Node 26.9.0, macOS.

## Cause

npm keeps each package's list of published versions in its local cache. Four
packages that jsdom 29.1.1 needs, through `@asamuzakjp/css-color` 5.1.11, had
lists cached at different times:

| Package | Newest version in the cache | Newest version on the registry |
| --- | --- | --- |
| `@csstools/css-color-parser` | 4.2.6 | 4.2.6 |
| `@csstools/css-calc` | 3.4.0 | 3.4.3 |
| `@csstools/css-parser-algorithms` | 4.0.0 | 4.0.2 |
| `@csstools/css-tokenizer` | 4.0.0 | 4.0.2 |

`--prefer-offline` tells npm to trust the cached lists without asking the
registry. `css-color-parser` 4.2.6 needs `css-calc` ^3.4.3 and the other two at
^4.0.2, versions the cache didn't know about. Instead of stopping with a "no
matching version" error, npm's resolver placed packages with no version, swapped
`css-parser-algorithms` back and forth, and started over, forever:

```text
placeDep ROOT @csstools/css-color-parser@4.2.6 OK for: @asamuzakjp/css-color@5.1.11 want: ^4.1.0
placeDep node_modules/@csstools/css-color-parser @csstools/css-calc@ OK for: @csstools/css-color-parser@4.2.6 want: ^3.4.3
placeDep ROOT @csstools/css-parser-algorithms@ REPLACE for: @csstools/css-color-parser@4.2.6 want: ^4.0.2
placeDep ROOT @csstools/css-tokenizer@ OK for: @csstools/css-color-parser@4.2.6 want: ^4.0.2
placeDep node_modules/@asamuzakjp/css-color @csstools/css-calc@3.4.0 OK for: @asamuzakjp/css-color@5.1.11 want: ^3.2.0
placeDep node_modules/@asamuzakjp/css-color @csstools/css-parser-algorithms@4.0.0 REPLACE for: @csstools/css-calc@3.4.0 want: ^4.0.0
warn ERESOLVE overriding peer dependency
...
```

So it was not slow hardware: the install could never have finished on any
machine. The loop itself is an npm bug; it hasn't been reported to npm.

## Resolution

- A normal `npm install --dry-run` in `about`, without `--prefer-offline`,
  resolved all 189 packages in 12 seconds and refreshed the cached lists.
- `about`'s tests ran on the tools the app already has installed, through the
  app's link to `about`: 55 tests passed in under a second, and nothing was
  installed.

## Lessons

- Don't pass `--prefer-offline` to an install that has no lockfile.
- Libraries should have lockfiles: with one, npm installs the recorded versions
  and never looks up version lists, so a stale cache can't cause this.
- Running a library's tests shouldn't need its own install when the app already
  has the same tools; see [the follow-ups](../todo.md).
