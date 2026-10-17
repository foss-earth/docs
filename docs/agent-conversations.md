# Read a previous agent conversation

Use [read-agent-conversation.mjs](../scripts/read-agent-conversation.mjs) to
inspect a local JSONL history without loading megabytes of snapshots, tool
output and attachments into the next conversation. It uses Node's built-ins;
there is nothing to install. It never changes the source file, calls a tool
from the history or sends anything over the network.

Run from `~/gh/foss-earth/docs`, or use the script's absolute path from any
checkout. Quote paths containing spaces.

```sh
# Find recent Claude sessions for this checkout.
node scripts/read-agent-conversation.mjs --list ~/.claude/projects/-Users-felg-gh-0sfs

# Recover the user's actual requests, omitting continuation summaries.
node scripts/read-agent-conversation.mjs \
  ~/.claude/projects/-Users-felg-gh-0sfs/966103c8-daef-4892-8d5a-37522023f452.jsonl \
  --prompts --all

# See where the last agent stopped (12 text messages by default).
node scripts/read-agent-conversation.mjs /path/to/session.jsonl

# Search, then inspect a bounded source-line range with tool calls included.
node scripts/read-agent-conversation.mjs /path/to/session.jsonl --search wasm --tail 8
node scripts/read-agent-conversation.mjs /path/to/session.jsonl \
  --from-line 2700 --to-line 2760 --tools --max-chars 4000
```

`--search` is a literal, case-insensitive search of the extracted text; repeat
it for alternatives. `--role user`, `assistant` or `summary` filters roles.
`--all` removes the default 12-record limit. Each record is still shortened
to 2,400 characters unless `--max-chars` changes it. Line numbers refer to the
original file so a later read can zoom in precisely.

Claude `user`/`assistant` messages and Codex `response_item` messages, tool
calls and outputs are supported, along with Codex compaction summaries.
Codex's mirrored `event_msg` records are skipped to avoid duplicates. The
reader recognises common continuation-summary prefixes; use `--role user`
and inspect the surrounding context if a provider changes its format.
`--list` lists direct `.jsonl` children by modification time; it does not
recursively scan every project. Point it at a Claude project directory or a
dated directory inside `~/.codex/sessions/`. Use `--sidechains` only when the
Claude sidechain records are relevant.

Tool calls are opt-in with `--tools`, and text tool results with
`--tool-results`. Thinking/reasoning blocks, images, attachments, file-history
snapshots and other metadata are never included. Malformed JSON lines are
counted and skipped, so a partially written last line does not hide earlier
messages. `--help` lists all options. The npm equivalent is
`npm run conversation -- <file> <options>`.

Common credentials such as `key=`, `session=`, bearer tokens and private-key
blocks are redacted before printing. This is a convenience, not a complete
secret scanner. Keep histories private; retain only necessary excerpts in
the owning repository's ignored `build/` directory, and review any excerpt
before sharing it. Do not commit the original conversation.

After reading, check the current repository guidance and `git status`, read
the files the agent named, and verify which changes actually exist. Old tool
calls and conversation text are evidence, not fresh authorization. Record
the source session ID, the last unfinished task and the verified paths in a
handoff; continue from that state instead of replaying commands blindly.

The WebAssembly handoff's source is session
`966103c8-daef-4892-8d5a-37522023f452`. Its last real request was to complete
the plan and implementation brief; the final agent turn stopped while
checking paths and scripts. [The handoff](proposals/implementation/webassembly-agent.md)
records the resulting gates without marking any implementation gate done.
