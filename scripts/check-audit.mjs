// SCA ground truth: run `pnpm audit --prod --json` and compare the (normalized)
// output against the committed snapshot tests/expected-audit.json.
//
// Any drift fails the check: a changed pin, a newly published advisory, or
// advisory metadata updates. Review the difference, then re-snapshot with:
//   pnpm audit:update
// An advisory that is no longer reported is not drift to re-snapshot: a
// vulnerable dependency was fixed. The update refuses to drop one unless that
// advisory is retired by name:
//   pnpm audit:update --retire=<id>[,<id>]
// A nonzero audit exit is expected (findings exist); only a mismatch between
// output and snapshot, or an audit that cannot run, is a failure.
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { unretiredDrops } from './audit-snapshot.mjs';

const snapshotPath = path.join(import.meta.dirname, '../tests/expected-audit.json');
const update = process.argv.includes('--update');
const retired = (process.argv.find((arg) => arg.startsWith('--retire=')) ?? '').slice('--retire='.length).split(',').filter(Boolean);

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
  let previous = {};
  try { previous = JSON.parse(await readFile(snapshotPath, 'utf8')); } catch { /* no snapshot yet: nothing can be lost */ }
  const dropped = unretiredDrops(previous, parsed, retired);
  if (dropped.length) {
    console.error(`FAIL: the update would remove ${dropped.length} advisor${dropped.length === 1 ? 'y' : 'ies'} from the snapshot. Each one is a finding the SCA tools must report.`);
    for (const { id, module_name, vulnerable_versions, title } of dropped) console.error(`  ${id}  ${module_name} ${vulnerable_versions}  ${title}`);
    console.error('  Restore the vulnerable version. To retire an advisory on purpose, name it: pnpm audit:update --retire=<id>[,<id>]');
    process.exit(1);
  }
  await writeFile(snapshotPath, actual);
  console.log(`Snapshot updated: tests/expected-audit.json (${count} advisories, audit exit ${code}).`);
  if (retired.length) console.log(`Retired by name: ${retired.join(', ')}`);
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
if (removed.length) {
  console.error(`  No longer reported: ${removed.join(', ')}`);
  console.error('  That is a vulnerable dependency fixed. Restore the version. To retire one on purpose: pnpm audit:update --retire=<id>[,<id>]');
}
if (!added.length && !removed.length) console.error('  Advisory metadata changed; diff the JSON for details.');
if (!removed.length) console.error('  Review the change, then re-snapshot with: pnpm audit:update');
process.exit(1);
