import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { messages, parseArgs, redact } from "../scripts/read-agent-conversation.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
mkdirSync(path.join(root, "build"), { recursive: true });
const scratch = mkdtempSync(path.join(root, "build/conversation-reader-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
const filename = path.join(scratch, "session with spaces.jsonl");
const records = [
  { type: "user", timestamp: "2026-10-16T01:00:00Z", message: { content: "Original Rust request" } },
  { type: "attachment", attachment: { text: "OMIT_ATTACHMENT" } },
  { type: "assistant", message: { content: [
    { type: "thinking", thinking: "OMIT_REASONING" },
    { type: "text", text: "Worker plan: key=FAKE_QUERY_SECRET&session=FAKE_SESSION_SECRET" },
    { type: "tool_use", name: "Bash", input: { command: "echo planned-only", api_key: "FAKE_ARGUMENT_SECRET" } },
  ] } },
  { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "call-1", content: [
    { type: "text", text: "Tool text Bearer FAKE_BEARER_SECRET" },
    { type: "image", source: { data: "OMIT_IMAGE" } },
  ] }] } },
  { type: "user", message: { content: "This session is being continued from a previous conversation. Summary..." } },
  { type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: "Continue the Rust work" }] } },
  { type: "event_msg", payload: { type: "user_message", message: "Continue the Rust work" } },
  { type: "response_item", payload: { type: "message", role: "assistant", content: [{ type: "output_text", text: "Final handoff" }] } },
  { type: "response_item", payload: { type: "reasoning", summary: [{ text: "OMIT_CODEX_REASONING" }] } },
  { type: "compacted", payload: { message: "Saved compaction summary" } },
  { type: "user", isSidechain: true, message: { content: "SIDECHAIN_TEXT" } },
];
const source = records.map(record => JSON.stringify(record)).join("\n") + '\n{"incomplete":\nnull\n' +
  JSON.stringify({ type: "assistant", message: { content: "Valid message after malformed records" } });
writeFileSync(filename, source);
const cli = (...args) => spawnSync(process.execPath, [path.join(root, "scripts/read-agent-conversation.mjs"), ...args], { encoding: "utf8" });

test("extracts public Claude/Codex text and summaries without mirrors, reasoning or attachments", () => {
  const out = cli(filename, "--all");
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /Original Rust request/);
  assert.match(out.stdout, /Final handoff/);
  assert.match(out.stdout, /Saved compaction summary/);
  assert.equal(out.stdout.match(/Continue the Rust work/g).length, 1);
  assert.doesNotMatch(out.stdout, /OMIT_|SIDECHAIN_TEXT|tool-call|tool-result|planned-only|FAKE_/);
  assert.match(out.stdout, /malformed 2/);
  assert.match(out.stdout, /Valid message after malformed records/);
  assert.equal(readFileSync(filename, "utf8"), source, "the input stays unchanged");
});

test("prompts omit continuation summaries and tool-result user envelopes", () => {
  const out = cli(filename, "--prompts", "--all", "--tool-results");
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /Original Rust request/);
  assert.match(out.stdout, /Continue the Rust work/);
  assert.doesNotMatch(out.stdout, /Summary|summary|Final handoff|Tool text/);
  assert.match(out.stdout, /matched 2; shown 2/);
});

test("search and source-line bounds select real messages before applying the tail", () => {
  const out = cli(filename, "--search", "RUST", "--from-line", "2", "--to-line", "8", "--tail", "1");
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /LINE 6 \| user/);
  assert.doesNotMatch(out.stdout, /Original Rust request|Final handoff/);
  const tail = cli(filename, "--tail", "1");
  assert.match(tail.stdout, /Valid message after malformed records/);
  assert.doesNotMatch(tail.stdout, /Final handoff/);
});

test("tool calls and text results are opt-in and credentials are redacted", () => {
  const out = cli(filename, "--all", "--tools", "--tool-results");
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /tool-call.*\nBash .*planned-only/);
  assert.match(out.stdout, /tool-result.*\ncall-1\nTool text Bearer \[redacted\]/);
  assert.doesNotMatch(out.stdout, /FAKE_|OMIT_/);
  const codex = { type: "response_item", payload: { type: "function_call", name: "exec", arguments: '{"cmd":"test"}' } };
  assert.equal(messages(codex).length, 0);
  assert.equal(messages(codex, { tools: true })[0].role, "tool-call");
  assert.equal(messages(records[10], { sidechains: true })[0].text, "SIDECHAIN_TEXT");
});

test("limits long excerpts and lists sessions in a directory with spaces", () => {
  const out = cli(filename, "--role", "assistant", "--max-chars", "8", "--tail", "1");
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /Valid me\n\[truncated/);
  const list = cli("--list", scratch);
  assert.equal(list.status, 0, list.stderr);
  assert.match(list.stdout, /session with spaces.jsonl/);
  assert.match(list.stdout, /Original Rust request/);
});

test("redacts common credential forms including JSON, URLs and private-key blocks", () => {
  const input = 'https://example.invalid/?key=SECRET1&session=SECRET2&gkey=SECRET7 {"api_key":"SECRET3"} FOSS_EARTH_GOOGLE_KEY=SECRET4 GOOGLE_3D_TILES_KEY="SECRET8"\n' +
    'Authorization: Bearer SECRET5\n-----BEGIN PRIVATE KEY-----\nSECRET6\n-----END PRIVATE KEY-----';
  assert.doesNotMatch(redact(input), /SECRET/);
});

test("invalid arguments and unreadable files fail clearly", () => {
  assert.throws(() => parseArgs([filename, "--tail", "0"]), /positive integer/);
  assert.throws(() => parseArgs([filename, "--from-line", "3", "--to-line", "2"]), /must not exceed/);
  assert.throws(() => parseArgs([filename, "--list", scratch]), /not both/);
  assert.throws(() => parseArgs([filename, "--role", "developer"]), /--role must/);
  const invalid = cli(filename, "--unknown");
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Conversation reader: Unknown option/);
  const missing = cli(path.join(scratch, "missing.jsonl"));
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /ENOENT/);
  assert.equal(cli("--help").status, 0);
});
