// SCA ground truth: run `pnpm audit --prod --json` and compare the (normalized)
// output against the committed snapshot tests/expected-audit.json.
//
// Any drift fails the check: a changed pin, a newly published advisory, or
// advisory metadata updates. Review the difference, then re-snapshot with:
//   pnpm audit:update
// A nonzero audit exit is expected (findings exist); only a mismatch between
// output and snapshot, or an audit that cannot run, is a failure.
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const snapshotPath = path.join(import.meta.dirname, '../tests/expected-audit.json');
const update = process.argv.includes('--update');

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function runAudit() {
  try { return await run('pnpm', ['audit', '--prod', '--json']); }
  catch { return await run('corepack', ['pnpm', 'audit', '--prod', '--json']); }
}

const { code, stdout, stderr } = await runAudit();
let parsed;
try {
  parsed = JSON.parse(stdout);
} catch {
  console.error(`FAIL: audit did not produce JSON (exit ${code}).\nstdout: ${stdout.slice(0, 400)}\nstderr: ${stderr.slice(0, 400)}`);
  process.exit(1);
}
// Normalize formatting so only content, not pnpm's serialization, is compared.
const actual = JSON.stringify(parsed, null, 2) + '\n';
const count = Object.keys(parsed.advisories ?? {}).length;

if (update) {
  await writeFile(snapshotPath, actual);
  console.log(`Snapshot updated: tests/expected-audit.json (${count} advisories, audit exit ${code}).`);
  process.exit(0);
}

const expected = await readFile(snapshotPath, 'utf8');
if (actual === expected) {
  console.log(`PASS: pnpm audit --prod matches the committed snapshot (${count} advisories).`);
  process.exit(0);
}

const expectedIds = Object.keys(JSON.parse(expected).advisories ?? {});
const actualIds = Object.keys(parsed.advisories ?? {});
const added = actualIds.filter((id) => !expectedIds.includes(id));
const removed = expectedIds.filter((id) => !actualIds.includes(id));
console.error(`FAIL: audit output drifted from tests/expected-audit.json (raw audit exit ${code}).`);
if (added.length) console.error(`  New advisory IDs: ${added.join(', ')}`);
if (removed.length) console.error(`  No longer reported: ${removed.join(', ')}`);
if (!added.length && !removed.length) console.error('  Advisory metadata changed; diff the JSON for details.');
console.error('  Review the change, then re-snapshot with: pnpm audit:update');
process.exit(1);
