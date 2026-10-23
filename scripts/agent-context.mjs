#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const read = async path => { try { return await readFile(join(root, path), 'utf8'); } catch (e) { if (e.code === 'ENOENT') return ''; throw e; } };
const [readme, manifest] = await Promise.all([read('README.md'), read('package.json')]);
const pkg = manifest ? JSON.parse(manifest) : {};
const lines = [`# ${pkg.name ?? root}`, `Path: ${root}`, 'Read AGENTS.md, then ../.github/AGENTS.md (or its GitHub link).'];
lines.push('\nREADME.md headings:', ...[...readme.matchAll(/^#{1,4} .+$/gm)].map(m => `  ${m[0]}`));
lines.push('\npackage.json scripts:', ...Object.entries(pkg.scripts ?? {}).map(([name, command]) => `  ${name}: ${command}`));
lines.push('\nPublic exports:', ...Object.keys(pkg.exports ?? {}).map(name => `  ${name}`));
async function docs(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  const paths = await Promise.all(entries.sort((a,b) => a.name.localeCompare(b.name)).map(async entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? docs(path) : entry.isFile() && /\.md$/.test(entry.name) ? [relative(root, path)] : [];
  }));
  return paths.flat();
}
const documents = await docs(join(root, 'docs'));
lines.push(`\nDocumentation (${documents.length} files; paths only):`, ...documents.slice(0, 100).map(path => `  ${path}`));
if (documents.length > 100) lines.push('  … use rg --files docs to narrow further.');
lines.push('\nOpen only task-relevant sections. Source, scripts and public contracts determine current behavior.');
console.log(lines.join('\n'));
