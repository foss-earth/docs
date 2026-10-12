# VS Code package discovery saturated the CPU (2026-10-11)

| Field | Value |
| --- | --- |
| Date | 2026-10-11, America/Chicago |
| Status | Recovered |
| Root cause | Partially identified; exact trigger unconfirmed |

## What happened

The user reported that CPU usage was pinned at 100% and identified `rg`
(ripgrep) as the process using it. No build or tests were running as part of
this work at the time; this was unintended background activity.

## Observations

Two ripgrep processes, PIDs 7587 and 7588, were each using roughly 460–500%
CPU. On macOS, a process can exceed 100% by using several cores, so the two
processes together were consuming about nine to ten cores.

Both had parent PID 74546, a VS Code `Code Helper (Plugin)` process. Their
arguments showed a search for `package.json` files:

```text
rg --files --hidden --case-sensitive --no-require-git
   -g **/package.json
   -g !**/.git -g !**/.svn -g !**/.hg -g !**/.jj
   -g !**/.DS_Store -g !**/Thumbs.db
   --no-ignore --follow --no-config --no-ignore-global
```

These arguments enumerate hidden files, ignore the usual ignore files, and
follow symbolic links. Version-control directories and two system metadata
filenames were explicitly excluded. Neither `node_modules` nor generated
`build` directories appeared among the exclusions.

## Cause and remaining uncertainty

The process tree and arguments identify VS Code package discovery as the
source of the CPU load. They do not identify which extension or event started
the searches, or which working directories the processes were traversing.

Following the linked repository and `node_modules` directory graph could make
this search expensive, especially when generated directories are included.
That is a plausible explanation, not a confirmed root cause. The evidence
does not establish a loop, a VS Code defect, or a particular extension defect.
The start time and total duration were not recorded.

## Recovery

Only the two observed runaway search processes were sent `SIGTERM`:

```sh
kill -TERM 7587 7588
```

A follow-up process snapshot showed no remaining runaway ripgrep processes.
The largest observed non-search consumers were Stats at 14.8% and WindowServer
at 8%, and CPU usage dropped. VS Code and its plugin host were left running.
No editor settings were changed during recovery.

## Follow-ups

- If this recurs, capture the search processes' working directories and the
  responsible VS Code extension before stopping them. Compare the directories
  with generated outputs and symbolic links to establish what is being walked.
- Open the relevant repositories as workspace folders rather than a broad
  parent directory, and check discovery exclusions for `node_modules` and
  generated `build` directories.
- If VS Code's built-in npm script detection is responsible, consider setting
  `npm.autoDetect` to `off` for the workspace, or using `npm.exclude` to exclude
  generated folders. The installed npm extension's settings schema supports
  both options. Their effect on this incident has not been tested, and another
  extension's discovery may need a different setting.
- Keep manual searches scoped to the relevant repository and source files.
  Avoid following symbolic links or searching ignored dependency and generated
  trees unless the investigation requires it.
- Record any recurrence and whether the selected mitigation prevents it; the
  recovery above stops the current searches but does not prove prevention.
