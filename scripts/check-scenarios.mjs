// Scenario integrity: every vulnerable and safe route registered in
// lib/catalog.json must exist with exactly the content this lab's ground
// truth was built on. Hashes are committed in tests/expected-hashes.json.
//
// If a scenario file changes, this check fails; review the change and then
// re-snapshot deliberately:
//   pnpm scenario:update
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const manifestPath = path.join(root, 'tests/expected-hashes.json');
const update = process.argv.includes('--update');

const catalog = JSON.parse(await readFile(path.join(root, 'lib/catalog.json'), 'utf8'));
const scenarioFiles = [...new Set(catalog.flatMap((entry) => [entry.source, entry.safeControl].filter(Boolean)))].sort();

const actual = {};
const problems = [];
for (const file of scenarioFiles) {
  try {
    actual[file] = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
  } catch {
    problems.push(`missing on disk: ${file}`);
  }
}

if (update) {
  await writeFile(manifestPath, JSON.stringify(actual, null, 2) + '\n');
  console.log(`Snapshot updated: tests/expected-hashes.json (${Object.keys(actual).length} scenario files).`);
  process.exit(problems.length ? (console.error(problems.join('\n')), 1) : 0);
}

const expected = JSON.parse(await readFile(manifestPath, 'utf8'));
for (const file of scenarioFiles) {
  if (actual[file] && expected[file] !== actual[file]) {
    problems.push(`modified: ${file}\n  expected ${expected[file]?.slice(0, 16)}…  actual ${actual[file].slice(0, 16)}…`);
  }
}
for (const file of Object.keys(expected)) {
  if (!actual[file]) problems.push(`stale manifest entry (not in catalog): ${file}`);
}

if (problems.length) {
  console.error(`FAIL: scenario sources drifted from tests/expected-hashes.json:\n  ${problems.join('\n  ')}`);
  console.error('  Review the change, then re-snapshot with: pnpm scenario:update');
  process.exit(1);
}
console.log(`PASS: all ${scenarioFiles.length} catalog scenario sources match the committed hashes.`);
