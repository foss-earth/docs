import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// One immutable documentation fixture, not workspace/bootstrap orchestration.
const root = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
assert.ok(process.env.DOCS_CONSUMER_ARCHIVES, "DOCS_CONSUMER_ARCHIVES must name a reviewed immutable archive closure; this fixture packs no source.");
const closureFile = path.resolve(process.env.DOCS_CONSUMER_ARCHIVES);
const closureBytes = readFileSync(closureFile), closure = JSON.parse(closureBytes);
assert.equal(closure.version, 1);
assert.ok(Array.isArray(closure.packages) && closure.packages.length === 1, "Docs has no runtime dependency; provide exactly its archive.");
const record = closure.packages[0];
assert.equal(record.name, "@foss-earth/docs"); assert.equal(record.version, "0.1.0");
assert.match(record.sha256 ?? "", /^[a-f0-9]{64}$/);
assert.ok(Number.isSafeInteger(record.bytes) && record.bytes > 0);
assert.equal(typeof record.archive, "string");
const archive = realpathSync(path.resolve(path.dirname(closureFile), record.archive));
const bytes = readFileSync(archive), sha256 = data => createHash("sha256").update(data).digest("hex");
assert.equal(bytes.length, record.bytes); assert.equal(sha256(bytes), record.sha256);

const directories = ["build", "build/consumer", "build/npm-cache"];
for (const relative of directories) {
  const directory = path.join(root, relative);
  if (!existsSync(directory)) mkdirSync(directory);
  assert.equal(realpathSync(directory), directory, "Owner output/cache cannot redirect to another tree.");
}
const output = path.join(root, "build/consumer", new Date().toISOString().replace(/[:.]/g, "-"));
assert.ok(!existsSync(output), "Retain each run in a fresh owner-local output."); mkdirSync(output);
const workspace = path.join(output, "workspace"), temp = path.join(output, "tmp");
mkdirSync(workspace); mkdirSync(temp);
const snapshot = path.join(output, "docs.tgz"); writeFileSync(snapshot, bytes, { flag: "wx" });
writeFileSync(path.join(output, "input-closure.json"), closureBytes, { flag: "wx" });
const env = { ...process.env, TMPDIR: temp };
delete env.NODE_PATH; delete env.NODE_OPTIONS;
for (const key of Object.keys(env)) if (/^npm_config_/i.test(key)) delete env[key];
const logs = [];
function run(command, argv, log) {
  const filename = path.join(output, log), fd = openSync(filename, "wx"); let result;
  try { result = spawnSync(command, argv, { cwd: workspace, env, stdio: ["ignore", fd, fd] }); }
  finally { closeSync(fd); }
  const data = readFileSync(filename);
  logs.push({ command, argv, cwd: path.relative(root, workspace), log, exitCode: result.status, sha256: sha256(data), bytes: data.length });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, "Installed documentation check failed; inspect " + filename);
  return data.toString("utf8");
}
function archiveFile(member) {
  const argv = ["-xOf", snapshot, member];
  const result = spawnSync("tar", argv, { cwd: workspace, env, encoding: null, maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, "Cannot read reviewed archive member: " + member);
  return result.stdout;
}
const metadata = JSON.parse(archiveFile("package/package.json"));
assert.equal(metadata.name, record.name); assert.equal(metadata.version, record.version);
for (const group of [metadata.dependencies, metadata.optionalDependencies, metadata.peerDependencies]) assert.equal(Object.keys(group ?? {}).length, 0, "Documentation fixture must not pull runtime dependencies.");
assert.ok(![metadata.bundleDependencies, metadata.bundledDependencies].some(value => value === true || Array.isArray(value) && value.length), "Bundled packages are not qualified.");
const members = run("tar", ["-tzf", snapshot], "archive-members.log").trim().split("\n").filter(member => !member.endsWith("/"));
assert.ok(members.length > 0);
const expected = new Map();
for (const member of members) {
  assert.ok(member.startsWith("package/") && !member.slice(8).split("/").some(part => !part || part === "." || part === ".."), "Unsafe archive member: " + member);
  const relative = member.slice(8); assert.ok(!expected.has(relative), "Duplicate archive member: " + relative);
  const data = archiveFile(member); expected.set(relative, { path: relative, sha256: sha256(data), bytes: data.length });
}
writeFileSync(path.join(output, "archive-files.json"), JSON.stringify([...expected.values()].sort((a, b) => a.path.localeCompare(b.path)), null, 2) + "\n");
writeFileSync(path.join(workspace, "package.json"), JSON.stringify({ name: "docs-installed-document-fixture", private: true, version: "1.0.0", type: "module", dependencies: { [record.name]: "file:" + snapshot } }, null, 2) + "\n");
run("npm", ["install", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", "--cache", path.join(root, "build/npm-cache"), "--prefix", workspace], "install.log");
const owner = path.join(workspace, "node_modules/@foss-earth/docs"), workspaceRoot = realpathSync(workspace) + path.sep;
assert.equal(realpathSync(owner), owner, "Installed docs must be an independent package, not a source link.");
const installed = new Map();
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink() && realpathSync(filename).startsWith(workspaceRoot), "Installed file escaped the fixture.");
    if (entry.isDirectory()) { assert.notEqual(entry.name, "node_modules", "No undeclared nested dependency."); collect(filename); }
    else if (entry.isFile()) {
      const data = readFileSync(filename), relative = path.relative(owner, filename).split(path.sep).join("/");
      installed.set(relative, { path: relative, sha256: sha256(data), bytes: data.length });
    }
  }
}
collect(owner);
assert.deepEqual([...installed.keys()].sort(), [...expected.keys()].sort(), "Installed full file map differs from the archive.");
for (const [relative, entry] of expected) assert.deepEqual(installed.get(relative), entry, "Installed byte mismatch: " + relative);
const installedNames = readdirSync(path.join(workspace, "node_modules/@foss-earth")).sort();
assert.deepEqual(installedNames, ["docs"]);
for (const name of readdirSync(path.join(workspace, "node_modules"))) assert.ok(name === "@foss-earth" || name.startsWith("."), "Unpinned installed dependency: " + name);

writeFileSync(path.join(workspace, "guard.mjs"), `import {registerHooks} from "node:module";import {realpathSync} from "node:fs";import {fileURLToPath} from "node:url";import path from "node:path";const root=realpathSync(process.cwd())+path.sep;registerHooks({resolve(specifier,context,next){const result=next(specifier,context);if(result.url.startsWith("node:"))return result;if(!result.url.startsWith("file:")||!realpathSync(fileURLToPath(result.url)).startsWith(root))throw new Error("OUTSIDE_ISOLATED_WORKSPACE");return result;}});\n`);
run(process.execPath, ["--import", "./guard.mjs", path.join(owner, "scripts/check-links.mjs")], "installed-document-links.log");
const fixtures = readdirSync(path.join(owner, "fixtures")).filter(name => name.endsWith(".test.mjs")).sort().map(name => path.join(owner, "fixtures", name));
assert.ok(fixtures.length > 0);
run(process.execPath, ["--import", "./guard.mjs", "--test", "--test-concurrency=1", ...fixtures], "installed-source-fixtures.log");
writeFileSync(path.join(output, "outside.mjs"), "export const outside=true;\n");
writeFileSync(path.join(workspace, "negative.mjs"), `import assert from "node:assert/strict";await assert.rejects(import(${JSON.stringify(path.join(output, "outside.mjs"))}),/OUTSIDE_ISOLATED_WORKSPACE/);\n`);
run(process.execPath, ["--import", "./guard.mjs", "negative.mjs"], "isolation-negative.log");
const receipt = { schemaVersion: 1, status: "isolated-installed-document-consumer-passed", package: record.name, version: record.version, archive: { sha256: record.sha256, bytes: record.bytes, retainedSnapshot: "docs.tgz" }, fullFileMap: { path: "archive-files.json", sha256: sha256(readFileSync(path.join(output, "archive-files.json"))), files: expected.size }, checks: ["exact immutable archive manifest and installed complete byte map", "offline scripts-disabled independent package install", "current owner Markdown/community navigation without sibling reads", "actual installed source fixtures", "runtime-resolution isolation with outside-path negative control"], logs, environment: { node: process.version, platform: process.platform, architecture: process.arch }, limitations: ["No network/remote fragment qualification", "No app build, browser, GPU, experiment or native execution", "Shared common-policy conformance, full publication refs, remote admission and app adoption remain separate"] };
writeFileSync(path.join(output, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
process.stdout.write(JSON.stringify({ output, receipt }) + "\n");
