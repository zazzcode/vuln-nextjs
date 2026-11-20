import { cp, mkdir, mkdtemp, readdir, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = fileURLToPath(new URL('../tests/scanner/fixtures/prototype-pollution/', import.meta.url));
const pagesControls = {
  'pages/api/guarded.ts': 'guarded',
  'pages/api/parse.ts': 'absent',
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
};

export async function writePrototypePollutionProject(root, name) {
  const { router, lodash } = projects[name];
  await mkdir(root, { recursive: true });
  const target = join(root, router);
  await cp(join(fixtures, router), target, { recursive: true });
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
  await writeFile(join(root, 'package.json'), JSON.stringify({ private: true, dependencies }));
  await writeFile(join(root, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages }));
}

export async function exportPrototypePollutionFixtures(root) {
  const sources = [];
  for (const [name, project] of Object.entries(projects)) {
    await writePrototypePollutionProject(join(root, name), name);
    for (const [source, expectedPath] of Object.entries(project.sources)) {
      sources.push({
        source: `${name}/${source}`,
        cwe: 'CWE-1321',
        expectedFinding: expectedPath === 'raw',
        expectedPath,
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
