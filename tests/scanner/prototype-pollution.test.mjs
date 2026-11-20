import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { exportPrototypePollutionFixtures, writePrototypePollutionProject } from '../../scripts/export-prototype-pollution-fixtures.mjs';

const basicMerge = 'pages/api/merge.ts';
const guardedMerge = 'pages/api/guarded.ts';
const nestedWrite = 'app/api/settings/route.ts';

async function scanFixture(t, name) {
  assert.ok(process.env.ZAZZLES_SCAN, 'Set ZAZZLES_SCAN to a scanner binary with the pollution family');
  const root = await mkdtemp(join(tmpdir(), 'zazzles-next-fixture-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  await writePrototypePollutionProject(root, name);

  const output = execFileSync(resolve(process.env.ZAZZLES_SCAN), ['--analyze', '--json', '--output-dir', '', root], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH },
    maxBuffer: 8 * 1024 * 1024,
    timeout: 30000,
  });
  return JSON.parse(output).uses.filter((use) => use.kind === 'prototype_write_candidate');
}

test('Pages Router detects the affected merge and lists the complete guard', async (t) => {
  const uses = await scanFixture(t, 'pages-affected');
  assert.deepEqual(uses.map((use) => use.sink.span.file).sort(), [guardedMerge, basicMerge]);

  const raw = uses.find((use) => use.sink.span.file === basicMerge);
  assert.equal(raw.pollution.contract_id, 'lodash-merge-v1');
  assert.equal(raw.pollution.version, '4.17.4');
  assert.deepEqual(raw.pollution.paths.map((path) => path.protection), ['raw']);
  assert.deepEqual(raw.completeness.blockers, []);
  assert.equal(raw.assessment.status, 'not_run');

  const guarded = uses.find((use) => use.sink.span.file === guardedMerge);
  assert.deepEqual(guarded.pollution.blocked, ['__proto__', 'constructor', 'prototype']);
  assert.deepEqual(guarded.pollution.paths.map((path) => path.protection), ['guarded']);
  assert.deepEqual(guarded.completeness.blockers, []);
});

test('Pages Router excludes the patched merge and JSON parsing alone', async (t) => {
  const uses = await scanFixture(t, 'pages-patched');
  assert.deepEqual(uses.map((use) => use.sink.span.file), [guardedMerge]);
});

test('App Router traces Request.json to the first computed key', async (t) => {
  const uses = await scanFixture(t, 'app-nested');
  assert.deepEqual(uses.map((use) => use.sink.span.file), [nestedWrite]);
  assert.equal(uses[0].pollution.operation, 'nested_write');
  assert.deepEqual(uses[0].pollution.paths.map((path) => path.protection), ['raw']);
  assert.deepEqual(uses[0].completeness.blockers, []);
  assert.equal(uses[0].assessment.status, 'not_run');
});

test('exported manifest maps the raw, guarded, and absent cases to TypeScript files', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'zazzles-next-export-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await exportPrototypePollutionFixtures(root);

  const { sources } = JSON.parse(await readFile(join(root, 'expected-scanner-findings.json'), 'utf8'));
  assert.equal(sources.length, 7);
  assert.deepEqual(
    sources.filter((row) => row.expectedFinding).map((row) => row.source),
    [`pages-affected/${basicMerge}`, `app-nested/${nestedWrite}`],
  );
  assert.equal(sources.find((row) => row.source === `pages-patched/${basicMerge}`).expectedPath, 'absent');
  assert.equal(sources.find((row) => row.source === `pages-affected/${guardedMerge}`).expectedPath, 'guarded');
  for (const row of sources) {
    assert.equal(row.cwe, 'CWE-1321');
    await access(join(root, row.source));
  }
});
