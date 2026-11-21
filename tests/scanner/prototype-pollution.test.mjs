import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { exportPrototypePollutionFixtures, prototypePollutionProjects, writePrototypePollutionProject } from '../../scripts/export-prototype-pollution-fixtures.mjs';

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

// Each added project is checked source by source against the path the scanner
// is expected to record: raw, guarded, review, or no record at all.
const protection = { raw: 'raw', guarded: 'guarded', review: 'unknown' };
for (const name of ['pages-shapes', 'app-shapes', 'libraries-affected', 'libraries-patched']) {
  test(`${name} records the expected path for every source`, async (t) => {
    const uses = await scanFixture(t, name);
    const expected = prototypePollutionProjects()[name];
    assert.deepEqual(
      [...new Set(uses.map((use) => use.sink.span.file))].sort(),
      Object.keys(expected).filter((source) => expected[source].path !== 'absent').sort(),
    );
    for (const use of uses) {
      const { path } = expected[use.sink.span.file];
      assert.deepEqual(use.pollution.paths.map((item) => item.protection), [protection[path]], use.sink.span.file);
      assert.equal(use.completeness.blockers.length === 0, path !== 'review', use.sink.span.file);
      assert.equal(use.assessment.status, 'not_run');
    }
  });
}

test('the added shapes carry their key facts', async (t) => {
  const uses = await scanFixture(t, 'pages-shapes');
  const at = (source) => uses.find((use) => use.sink.span.file === source);

  // An incomplete deny-list names what it blocks and leaves the other route open.
  assert.deepEqual(at('pages/api/deny-path-partial.ts').pollution.blocked, ['__proto__']);
  assert.deepEqual(at('pages/api/deny-path-partial.ts').pollution.open, ['constructor', 'prototype']);
  assert.deepEqual(at('pages/api/deny-path.ts').pollution.blocked, ['__proto__', 'constructor', 'prototype']);

  // A comparison on untyped array parts and a lookup on the key are not credited.
  for (const source of ['pages/api/set-path-compared.ts', 'pages/api/preferences-known.ts']) {
    assert.deepEqual(at(source).completeness.blockers.map((gap) => gap.kind), ['key_guard_coverage_unknown'], source);
  }

  // Library source kept in the repository: the sink is the route, the write is in the library file.
  const vendored = at('pages/api/vendored.ts');
  assert.equal(vendored.pollution.operation, 'recursive_merge');
  assert.deepEqual(vendored.completeness.evidence.prototype_write.map((item) => item.span.file), ['lib/tiny-merge.ts']);

  assert.equal(at('pages/api/unflatten.ts').pollution.key_operand, 'source_keys');
  assert.equal(at('pages/api/preferences.ts').pollution.operation, 'nested_write');
});

test('library calls are judged by the resolved Lodash version', async (t) => {
  const uses = await scanFixture(t, 'libraries-affected');
  assert.deepEqual(
    uses.map((use) => [use.sink.span.file, use.pollution.contract_id, use.pollution.version]).sort(),
    [
      ['pages/api/lodash-defaults-deep.ts', 'lodash-merge-v1', '4.17.4'],
      ['pages/api/lodash-set.ts', 'lodash-set-v1', '4.17.4'],
      ['pages/api/lodash-zip.ts', 'lodash-set-v1', '4.17.4'],
    ],
  );
});

test('exported manifest maps every case to a TypeScript file', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'zazzles-next-export-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await exportPrototypePollutionFixtures(root);

  const { sources } = JSON.parse(await readFile(join(root, 'expected-scanner-findings.json'), 'utf8'));
  assert.equal(sources.length, 32);
  const row = (source) => sources.find((item) => item.source === source);
  assert.deepEqual(
    sources.filter((item) => item.source.startsWith('pages-') && !item.source.startsWith('pages-shapes/') && item.expectedFinding).map((item) => item.source),
    [`pages-affected/${basicMerge}`],
  );
  assert.equal(row(`app-nested/${nestedWrite}`).expectedFinding, true);
  assert.equal(row(`pages-patched/${basicMerge}`).expectedPath, 'absent');
  assert.equal(row(`pages-affected/${guardedMerge}`).expectedPath, 'guarded');

  // Exploitable sources the scanner does not confirm stay marked as findings.
  assert.deepEqual(row('pages-shapes/pages/api/set-path-compared.ts'), {
    source: 'pages-shapes/pages/api/set-path-compared.ts', cwe: 'CWE-1321', expectedFinding: true, expectedPath: 'review',
  });
  assert.equal(row('pages-shapes/pages/api/preferences-known.ts').expectedFinding, false);
  assert.deepEqual(row('libraries-affected/pages/api/dset.ts'), {
    source: 'libraries-affected/pages/api/dset.ts', cwe: 'CWE-1321', expectedFinding: true, expectedPath: 'absent', advisory: 'CVE-2024-21529',
  });
  assert.equal(row('libraries-patched/pages/api/dset.ts').expectedFinding, false);
  assert.equal(sources.filter((item) => item.expectedFinding).length, 17);

  for (const item of sources) {
    assert.equal(item.cwe, 'CWE-1321');
    await access(join(root, item.source));
  }
});
