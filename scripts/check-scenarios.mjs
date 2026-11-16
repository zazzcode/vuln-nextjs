// Scenario ground truth, generated from lib/catalog.json and committed:
//
// 1. tests/expected-hashes.json — SHA-256 of every registered vulnerable and
//    protected route, so scenario sources cannot silently change.
// 2. tests/expected-scanner-findings.json — per-source scanner expectations
//    (expected finding yes/no + CWE) for SAST/SCA evaluation harnesses.
//
// If either drifts, this check fails; review the change and re-snapshot:
//   pnpm scenario:update
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const hashPath = path.join(root, 'tests/expected-hashes.json');
const findingsPath = path.join(root, 'tests/expected-scanner-findings.json');
const update = process.argv.includes('--update');

const catalog = JSON.parse(await readFile(path.join(root, 'lib/catalog.json'), 'utf8'));
const controlsOf = (entry) => [...(entry.safeControl ? [entry.safeControl] : []), ...(entry.safeControls ?? [])];

// --- Ground truth 1: route content hashes ---------------------------------
const scenarioFiles = [...new Set(catalog.flatMap((entry) => [entry.source, ...controlsOf(entry)]))].sort();
const hashes = {};
const problems = [];
for (const file of scenarioFiles) {
  try {
    hashes[file] = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
  } catch {
    problems.push(`missing on disk: ${file}`);
  }
}

// --- Ground truth 2: scanner expectations export ---------------------------
const scannerExport = {
  generatedFrom: 'lib/catalog.json',
  scopeNote: 'Per-source expectations for scanner evaluations. expectedFinding=true rows must be flagged (a miss is a false negative). expectedFinding=false rows are scoped claims: the file should NOT be flagged for the listed CWE — the flaw it is the registered safe control for; findings for unrelated issues are out of scope for this lab. Regenerate with: pnpm scenario:update',
  sources: catalog.flatMap((entry) => [
    { id: entry.id, source: entry.source, expectedFinding: entry.expectedFinding, cwe: entry.cwe, scanner: entry.scanner },
    ...controlsOf(entry).map((source) => ({
      id: `${entry.id}-safeControl`, controlFor: entry.id, source,
      expectedFinding: false, cwe: entry.cwe, scanner: entry.scanner,
    })),
  ]).sort((a, b) => a.id.localeCompare(b.id) || a.source.localeCompare(b.source)),
};

if (update) {
  await writeFile(hashPath, JSON.stringify(hashes, null, 2) + '\n');
  await writeFile(findingsPath, JSON.stringify(scannerExport, null, 2) + '\n');
  console.log(`Snapshots updated: tests/expected-hashes.json (${Object.keys(hashes).length} scenario files), tests/expected-scanner-findings.json (${scannerExport.sources.length} expectations).`);
  process.exit(problems.length ? (console.error(problems.join('\n')), 1) : 0);
}

const expectedHashes = JSON.parse(await readFile(hashPath, 'utf8'));
for (const file of scenarioFiles) {
  if (hashes[file] && expectedHashes[file] !== hashes[file]) {
    problems.push(`modified: ${file}\n  expected ${expectedHashes[file]?.slice(0, 16)}…  actual ${hashes[file].slice(0, 16)}…`);
  }
}
for (const file of Object.keys(expectedHashes)) {
  if (!hashes[file]) problems.push(`stale manifest entry (not in catalog): ${file}`);
}

const expectedFindings = JSON.parse(await readFile(findingsPath, 'utf8'), 'utf8');
if (JSON.stringify(expectedFindings) !== JSON.stringify(scannerExport)) {
  problems.push('tests/expected-scanner-findings.json does not match lib/catalog.json (stale export)');
}

if (problems.length) {
  console.error(`FAIL: scenario ground truth drifted:\n  ${problems.join('\n  ')}`);
  console.error('  Review the change, then re-snapshot with: pnpm scenario:update');
  process.exit(1);
}
console.log(`PASS: all ${scenarioFiles.length} catalog scenario sources match the committed hashes; scanner expectations export in sync (${scannerExport.sources.length} rows).`);
