# Incident reports

Record unexpected failures and excessive resource use here so their evidence
and recovery steps can be found again. Dates use America/Chicago unless a
report specifies another time zone.

| Date | Incident | Recovery | Cause |
| --- | --- | --- | --- |
| 2026-10-11 | [VS Code ripgrep searches saturated the CPU](2026-10-11-vscode-ripgrep-cpu.md) | Two searches stopped | Expensive package discovery confirmed; trigger unresolved |
| 2026-10-11 | [Map loading recovered after clearing browser data](2026-10-11-map-loading-browser-data.md) | User cleared browser data | Unconfirmed; original evidence unavailable |
| 2026-10-11 | [npm install looped forever in `about`](2026-10-11-npm-install-loop.md) | Cache refreshed; existing app tools used for tests | Inconsistent cached package versions caused a resolver loop |

## Adding a report

Use a dated filename, link it in this index, and record:

- What happened and its effect on the user.
- Evidence collected, including relevant versions or process measurements.
- What is confirmed, what is inferred and what remains unknown.
- Recovery actions and the check that established recovery.
- Any prevention or diagnostic work still needed.

Keep reports useful without including credentials, personal browser data or
large raw logs. Put local diagnostic scratch files in the application's
gitignored `build/` directory. Clearing data or stopping a process is a
recovery action; it does not establish the root cause by itself.
