# Documentation layout

These rules apply in foss-earth, 0SFS, and UMN-VR. A hub README lists each
page under Current, Proposals, or Archive. That list is the kind.

Component repos keep their own `docs/` for behavior they own. Org `AGENTS.md`
stays the policy entry point. Do not flatten `foss-earth/docs/docs/`. Other
repos link those GitHub paths.

## Current

How the code works today. Lives next to the owning repo. Linked from that
repo's README.

## Proposal

Not shipped, or shipped but still the design record. Stays in
`docs/proposals/`. A Status line does not make it current; the README current
list does.

## Handoff

A session brief, continuation prompt, or delegate note. Not a procedure.
Listed only under Archive. File under `docs/archive/sessions/` only when
nothing outside the repo links it.

## Measurement

Dated notes stay in `docs/performance/YYYY-MM-DD/`. One ledger or backlog
links them. Do not copy measurements into a second guide.

## One body, many readers

If two repos carry the same text, one path is canonical and the other file is
a short pointer that keeps the old path.
