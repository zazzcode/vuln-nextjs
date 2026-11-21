import { cp, mkdir, mkdtemp, readdir, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = fileURLToPath(new URL('../tests/scanner/fixtures/prototype-pollution/', import.meta.url));
const pagesControls = {
  'pages/api/guarded.ts': 'guarded',
  'pages/api/parse.ts': 'absent',
};
const shapeSources = {
  'pages/api/deep-merge.ts': 'raw',
  'pages/api/set-path.ts': 'raw',
  'pages/api/set-path-checked.ts': 'guarded',
  // Exploitable, and the scanner cannot credit a comparison on untyped parts.
  'pages/api/set-path-compared.ts': { path: 'review', finding: true },
  'pages/api/unflatten.ts': 'raw',
  'pages/api/reduce-path.ts': 'raw',
  'pages/api/deny-path.ts': 'guarded',
  'pages/api/deny-path-partial.ts': 'raw',
  'pages/api/preferences.ts': 'raw',
  // Safe in practice, behind a lookup the scanner does not read.
  'pages/api/preferences-known.ts': 'review',
  'pages/api/vendored.ts': 'raw',
  'pages/api/read-path.ts': 'absent',
  'pages/api/shallow.ts': 'absent',
};
const lodashSources = {
  'pages/api/lodash-set.ts': 'raw',
  'pages/api/lodash-defaults-deep.ts': 'raw',
  'pages/api/lodash-zip.ts': 'raw',
};
const projects = {
  'pages-affected': {
    router: 'pages',
    lodash: '4.17.4',
    sources: { 'pages/api/merge.ts': 'raw', ...pagesControls },
  },
  'pages-patched': {
    router: 'pages',
    lodash: '4.17.21',
    sources: { 'pages/api/merge.ts': 'absent', ...pagesControls },
  },
  'app-nested': {
    router: 'app',
    sources: { 'app/api/settings/route.ts': 'raw' },
  },
  // Source-visible write shapes in application code and in library source kept in the repository.
  'pages-shapes': { tree: 'shapes', sources: shapeSources },
  'app-shapes': {
    tree: 'shapes-app',
    sources: { 'app/api/profile/route.ts': 'raw', 'app/api/flags/route.ts': 'raw' },
  },
  // Library calls. The dset and merge-deep pins are published advisories that
  // need a library contract or a dependency audit: source analysis has no record.
  'libraries-affected': {
    tree: 'libraries',
    lodash: '4.17.4',
    packages: { dset: '3.1.3', 'merge-deep': '3.0.2' },
    sources: {
      ...lodashSources,
      'pages/api/dset.ts': { path: 'absent', finding: true, advisory: 'CVE-2024-21529' },
      'pages/api/merge-deep.ts': { path: 'absent', finding: true, advisory: 'CVE-2021-26707' },
    },
  },
  'libraries-patched': {
    tree: 'libraries',
    lodash: '4.17.21',
    packages: { dset: '3.1.4', 'merge-deep': '3.0.3' },
    sources: {
      'pages/api/lodash-set.ts': 'absent',
      'pages/api/lodash-defaults-deep.ts': 'absent',
      'pages/api/lodash-zip.ts': 'absent',
      'pages/api/dset.ts': 'absent',
      'pages/api/merge-deep.ts': 'absent',
    },
  },
};

export function prototypePollutionProjects() {
  return Object.fromEntries(Object.entries(projects).map(([name, project]) => [name, expectations(project)]));
}

// expectations normalizes each source to { path, finding, advisory }. path is the
// evidence the Zazzles scanner records: raw, guarded, review or absent. finding
// is the ground truth for any scanner: whether the source is exploitable.
function expectations(project) {
  return Object.fromEntries(Object.entries(project.sources).map(([source, expected]) => {
    const row = typeof expected === 'string' ? { path: expected } : expected;
    return [source, { finding: row.path === 'raw', ...row }];
  }));
}

export async function writePrototypePollutionProject(root, name) {
  const { router, tree, lodash, packages: pins = {} } = projects[name];
  await mkdir(root, { recursive: true });
  // A tree holds a whole project layout. The first fixtures hold one router directory.
  const target = tree ? root : join(root, router);
  await cp(join(fixtures, tree ?? router), target, { recursive: true });
  for (const file of await readdir(target, { recursive: true })) {
    if (file.endsWith('.ts.txt')) {
      await rename(join(target, file), join(target, file.slice(0, -4)));
    }
  }

  const dependencies = { next: '13.4.19' };
  const packages = {};
  if (lodash) {
    dependencies.lodash = '^4.17.4';
    packages['node_modules/lodash'] = { version: lodash };
  }
  for (const [pkg, version] of Object.entries(pins)) {
    dependencies[pkg] = version;
    packages[`node_modules/${pkg}`] = { version };
  }
  await writeFile(join(root, 'package.json'), JSON.stringify({ private: true, dependencies }));
  await writeFile(join(root, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages }));
}

export async function exportPrototypePollutionFixtures(root) {
  const sources = [];
  for (const [name, project] of Object.entries(projects)) {
    await writePrototypePollutionProject(join(root, name), name);
    for (const [source, expected] of Object.entries(expectations(project))) {
      sources.push({
        source: `${name}/${source}`,
        cwe: 'CWE-1321',
        expectedFinding: expected.finding,
        expectedPath: expected.path,
        ...(expected.advisory ? { advisory: expected.advisory } : {}),
      });
    }
  }
  await writeFile(join(root, 'expected-scanner-findings.json'), JSON.stringify({ sources }, null, 2) + '\n');
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  const root = await mkdtemp(join(tmpdir(), 'zazzles-next-pollution-'));
  await exportPrototypePollutionFixtures(root);
  console.log(root);
}
