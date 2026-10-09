# Shared CI and developer setup: implementation agent

Implement `foss-earth/ci` and `foss-earth/dev_installer` for the
[parallel migration](../../../navigation.md#retained-local-and-host-evidence).
The coordinator provisions the destinations and records their sole writer.
Read this checkout's [AGENTS.md](https://github.com/foss-earth/foss-earth.github.io/blob/90e23b3ee96f53ec5900afc5991a21fffa58649d/AGENTS.md), [CI/CD](../../ci-cd.md)
and the [split specification](../../../navigation.md#retained-local-and-host-evidence).
These are generic FOSS Earth tools: they must work without 0sfs or UMN installed.

You own the two new repositories and generic policy/scaffold templates. You
do not edit the current FOSS Earth source, app lockfiles, consumer workflows or
other agents' checkouts concurrently. Provide reviewed patches/templates and
pins to the primary writers. Flight owns `0sfs/ci` and `0sfs/dev_installer`
adapters. Each app owns its integration commands and workspace/release data.
Campus owns the `UMN-VR/dev_installer` onboarding wrapper. The shared repository
also provides the standalone Earth onboarding entry point, selecting the
globe-owned manifest without importing the globe runtime. Give both wrappers
a documented way to bootstrap a pinned manifest artifact before a workspace
exists; do not require the consuming app's source to run its installer.
The coordinator owns remote creation, branch/ruleset changes and history cleanup.

## First deliverable: contracts and scaffold

Publish contracts early for: validator inputs/results/exit codes, reusable
workflow inputs and required-check identity, workspace manifest schema,
installer CLI/result records and candidate artifact identity. Supply small
synthetic consumer fixtures for code, data/content and documentation repos.
Choose actual package names with the coordinator before consumers hardcode them.

Provide a repository template with local contribution/build instructions,
explicit CI caller, component test hooks, licensing/provenance fields, release
identity and this exact rule in contribution and agent instructions:

> YOU CANNOT HAVE AI AS A CO-AUTHOR, OR YOUR CONTRIBUTIONS WILL BE REJECTED.

AI author/committer identities and equivalent attribution trailers are also
prohibited. Legitimate human credit and technical discussion remain permitted.
Templates are adopted explicitly; an organization `.github` repo does not
install running workflows into all its repositories.

Ship attribution enforcement as one independently usable common component in
`foss-earth/ci`: canonical policy/identity data, validator, reusable workflow,
regression fixtures and consumer-conformance command. Every consumer pins the
reviewed component release. Organization-specific configuration may tighten
the policy but must not permit AI attribution. Do not copy validators or fixture
suites into `0sfs/ci`, installer wrappers or individual feature repositories.

## Authorship validator

Implement a local executable with the same behavior in CI. Keep it independent
of app code and do not execute inspected commits, hooks or their build scripts.
Read raw commit objects and actual author/committer headers, without letting a
mailmap hide the recorded identity. Parse structured identity-bearing trailers
case-insensitively, including `Co-authored-by`; distinguish ordinary prose and
quotes from actual attribution. Report commit ID, affected field and policy
rule with enough detail to repair the violation and no credential leakage.

Provide explicit modes for proposed commit ranges and full selected publication
refs. Full audit must traverse every selected branch/tag and reachable ancestor,
resolve annotated tags, fail on shallow/incomplete history, missing refs or
unreadable/malformed metadata, and describe the exact scope checked. A default
branch-only audit is not a full repository publication audit. Backups/quarantine
refs are excluded only by an explicit publication ref list, never by a silent
negative filter that can hide a published branch.

Disable Git replacement objects for traversal and object reads. Reject grafts
or other local history overlays that can hide ancestry, and verify the selected
refs against the intended publication source. Raw headers alone do not ensure
that every real ancestor was inspected.

Policy includes reviewed AI identities/aliases/domains and a stricter approved
identity mode for admitting new contributors. Define normalization and matching
precisely; do not classify a human named similarly to a product using an arbitrary
substring. Unknown identities in strict mode fail pending onboarding. Legitimate
non-AI automation exceptions must be explicit and auditable. Do not claim a
brand-name denylist recognizes every AI identity or that a self-declared Git
name proves a person is human. Preserve historical human identities through a
reviewed migration inventory rather than relabeling them.

Mandatory fixtures include: allowed humans and non-AI automation; forbidden
author, committer and trailer independently; mixed case/spacing and multiple
trailers; allowed prose mentioning products; names resembling product names;
mailmap masking attempts; replacement/graft attempts to hide a prohibited
ancestor; duplicate aliases; root and merge commits; a violation
on a nondefault branch or tag; shallow/missing history; clean extraction; and a
new violation added after an earlier audit. Use synthetic identities/data.

The coordinator cleans legacy histories. The validator must report their
violations until then, without grandfathering AI identities or returning a
success status for an audit that skipped the offending history.

## Hosted checks and admission

Publish reusable workflows called at reviewed immutable commit SHAs, with
minimal permissions, stable check names and explicit source/ref inputs.
Keep validation code and policy sourced from a trusted revision rather than
the PR's replacement validator. The consumer caller cannot grant itself a
bypass by replacing the policy/validator in the same contribution. Review and
protect workflow/policy changes through a separate trusted path.

Support pull requests, selected branch/tag publication audits and the configured
merge mechanism. If merge queue is enabled, cover its required event. Reject
untrusted PR code execution with privileged credentials; metadata validation
needs no application secrets. Avoid interpolating commit messages, ref names
or repository-controlled strings into shell code.

Current primary references to use and recheck during implementation:

- [Reusable workflow contracts and SHA references](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).
- [Workflow events, including merge groups](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#merge_group).
- [Protected branches and required checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

A passing PR-head check alone does not prove the final merge/squash commit's
metadata is clean. Test each enabled merge method, including edited final
messages and automatically produced attribution. Either prove the resulting
commit is validated before admission, or use a controlled merge service that
constructs/audits the exact candidate commit before updating the protected ref.
Disable methods that cannot enforce the rule. Never describe a post-push
detection job as prevention. Have the coordinator restrict direct pushes and
bypass identities according to actual GitHub capabilities and verify it with
negative admission tests in a designated test repository.

Acceptance includes an allowed contribution succeeding and prohibited primary
authorship, coauthorship and final-merge metadata failing through the actual
configured merge path. Protect the validator repository itself, validate caller
pins and document the update procedure. Deliver configurations to all primary
owners; collect adoption receipts instead of assuming templates were installed.

## Conformance in every repository

Expose a versioned consumer-conformance command that every repository runs
locally and in CI, including docs, research, content/assets, logo, installers,
CI and `.github` policy repositories. It must verify the installed policy and
trusted immutable caller pin, then exercise that consumer's validation entry
point with shared positive and negative fixtures: permitted human attribution
passes; AI author, committer and coauthor attribution each fail. Include Claude,
Cursor and Codex aliases explicitly in the reviewed fixture matrix. Use the
shared regression fixtures rather than copied per-consumer test implementations.

Generate synthetic commits in isolated ignored fixture repositories; never
add prohibited-attribution test commits to a real project's published history.
Authorship jobs must run for documentation-only/content-only changes too: no
changed-path filters, language-suite conditions or optional/manual triggers
may silently skip them. A skipped job is not a successful policy audit.

Provide the coordinator a per-repository conformance result plus the expected
required-check identity and protection settings. The coordinator verifies each
actual remote's caller pin, required admission path and bypass configuration;
representative hosted negative tests alone do not prove adoption everywhere.
Missing policy, caller, conformance result or remote enforcement evidence fails
that repository's migration acceptance, even if its domain tests pass. Record
the first trusted bootstrap exception only as specified by the coordinator.

## Developer installer

Implement `init`, `doctor`, `sync` and `check` or an equivalent documented CLI.
Its input is an explicit versioned workspace manifest, owned by the selected
application. It names repositories, exact refs/artifacts and digests, relative
destinations, dependency/build order, prerequisites, optional content and test
commands. It contains no credentials or user-specific absolute paths. The
installer must not hardcode a flight/campus fleet or depend on an app wrapper.

The full supported workspace is the default setup; explicit component selection
can produce a smaller development workspace. Display the planned fetch/install/
build actions. `doctor` is read-only and reports tool versions, missing repos,
dirty/diverged state, incompatible pins, local links and artifact integrity.
System-tool installation and servers require explicit action; `init` must not
silently change global tools or start a long-lived process.

Use argument arrays, validate paths against workspace escape/symlink hazards,
verify artifact digests, stop on failed prerequisites, and record resumable
step results. Detect dirty checkouts or conflicting refs and report the exact
resolution needed without reset, clean, deletion or stash. `sync` does not
discard local commits. A failed step must leave a repairable workspace; a
second run must not recreate completed downloads/builds unnecessarily.

Production installs use exact package artifacts/refs, not mutable neighboring
checkouts. Provide an explicit local-link mode for development and verify the
resolved identity in both modes. Normal flight setup consumes the adopted
JSBSim tarball; native engine development is a flight-wrapper opt-in, not a
generic setup requirement. Do not rebuild WASM to normalize a hash.

Test with local fixture repositories/artifacts: first init; repeated init;
read-only doctor; selected-component dependency closure; upgrade; dirty and
diverged repos; unavailable remote; corrupt artifact; interrupted/resumed work;
failed build; path escape; and a workspace whose paths contain spaces. Add
real application manifest smoke tests after owners supply accepted artifacts.
State tested platforms precisely; do not label other operating systems supported
because the code happens to use Node.

## Release and handoff

CI and installer have independent versions and checks. Package source, schemas,
templates and fixtures reproducibly with provenance. Supply the coordinator and
primary writers exact source/artifact pins, documentation, migration examples,
negative-test receipts and any platform/API limitations. Verify the tools with
an Earth manifest, a flight manifest and a campus manifest; the Earth/campus
cases must succeed without a 0sfs checkout.

Use assigned checkouts and their scratch/output rules; coordinate heavy checks
with other agents, retaining logs. Do not change live branch protection,
rewrite histories, recreate repos or deploy apps yourself. Implement the
generic tools and demonstrate their operation; the coordinator performs the
reviewed remote rollout. Deferred Search and shared/flight VR are outside this
assignment; do not add them to required workspace manifests or create stubs.
