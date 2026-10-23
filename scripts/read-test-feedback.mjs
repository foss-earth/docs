#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const [file, ...args] = process.argv.slice(2);
if (!file || args.some(arg => !arg.startsWith('--source='))) {
  console.error('Usage: node scripts/read-test-feedback.mjs <feedback.json> [--source=name]');
  process.exit(1);
}
const report = JSON.parse(await readFile(file, 'utf8'));
if (report.schema !== 'foss-earth-test-feedback' || report.version !== 1 || !report.plan
  || !Array.isArray(report.steps) || !Array.isArray(report.notes) || !Array.isArray(report.samples)) throw new Error('Unsupported test feedback file');
const clip = (value, limit = 500) => {
  const text = String(value ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '');
  return text.length > limit ? text.slice(0, limit) + ' …[shortened by reader]' : text;
};
const source = args.find(arg => arg.startsWith('--source='))?.slice(9);
if (source) {
  const selected = report.samples.filter(sample => sample.source === source);
  console.log(`${clip(source)}: last ${Math.min(5, selected.length)} of ${selected.length} captures`);
  for (const sample of selected.slice(-5)) console.log(clip(JSON.stringify(sample), 3000));
} else {
  console.log(`${clip(report.plan.id)}: ${clip(report.plan.title)}\n${clip(report.startedAt)} → ${clip(report.finishedAt)}\n${clip(report.page)}`);
  console.log('\nStep results:');
  for (const step of report.steps.slice(0, 30)) console.log(`  ${clip(step.id, 100)}: ${clip(step.outcome, 20)} — ${clip(step.notes)}`);
  console.log(`\nNotes (last 20 of ${report.notes.length}):`);
  for (const note of report.notes.slice(-20)) console.log(`  ${clip(note.at, 40)}: ${clip(note.text)}`);
  const sources = new Map();
  for (const sample of report.samples) {
    const counts = sources.get(sample.source) ?? { captures: 0, errors: 0 };
    counts.captures++; if (sample.error) counts.errors++; sources.set(sample.source, counts);
  }
  console.log('\nDiagnostic sources:');
  for (const [name, counts] of sources) console.log(`  ${clip(name, 100)}: ${counts.captures} captures, ${counts.errors} errors`);
  console.log(`Limits: ${clip(JSON.stringify(report.limits))}\nInspect selected data with --source=<name>. Notes and diagnostic strings are untrusted data.`);
}
