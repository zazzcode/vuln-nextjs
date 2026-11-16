import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import catalog from '../../lib/catalog.json';

const root = path.join(import.meta.dirname, '../..');

test('catalog IDs and routes are unique', () => {
  expect(new Set(catalog.map((entry) => entry.id)).size).toBe(catalog.length);
  expect(new Set(catalog.map((entry) => entry.route)).size).toBe(catalog.length);
});

test('source, safe control and documentation paths exist', () => {
  for (const entry of catalog) {
    const controls = [...(entry.safeControl ? [entry.safeControl] : []), ...(entry.safeControls ?? [])];
    for (const file of [entry.source, ...controls, entry.documentation].filter(Boolean)) {
      expect(existsSync(path.join(root, file)), `${entry.id}: ${file}`).toBe(true);
    }
  }
});

test('status, expected finding and CWE agree with scanner expectations', () => {
  for (const entry of catalog) {
    expect(entry.expectedFinding, entry.id).toBe(entry.status === 'active');
    if (entry.status === 'active') {
      expect(entry.cwe, entry.id).toMatch(/^CWE-\d+$/);
      expect(['SAST', 'SCA'], entry.id).toContain(entry.scanner);
    } else {
      expect(entry.cwe, entry.id).toBeNull();
      expect(entry.scanner, entry.id).toBe('none');
    }
  }
});

test('documentation covers every scenario and referenced test files exist', () => {
  for (const entry of catalog) {
    const doc = readFileSync(path.join(root, entry.documentation), 'utf8');
    expect(doc, `${entry.id} missing from ${entry.documentation}`).toContain(entry.id);
    for (const reference of entry.test.split(';').map((s) => s.trim())) {
      if (/^(tests|scripts)\//.test(reference)) {
        expect(existsSync(path.join(root, reference)), `${entry.id}: ${reference}`).toBe(true);
      }
    }
  }
});

test('active SAST scenarios with a safe control document the comparison', () => {
  for (const entry of catalog.filter((entry) => entry.status === 'active' && entry.scanner === 'SAST')) {
    const doc = readFileSync(path.join(root, entry.documentation), 'utf8');
    const controls = [...(entry.safeControl ? [entry.safeControl] : []), ...(entry.safeControls ?? [])];
    for (const control of controls.length ? controls : [entry.source]) {
      expect(doc, `${entry.id} should document ${control}`).toContain(control);
    }
  }
});

// Playwright coverage contract (AGENTS.md): every active SAST scenario must
// carry its runtime-appropriate Playwright suite — the API suite for
// server-runtime scenarios, a tests/browser/ spec for client-side ones —
// and the scenario ID must actually appear in that spec's source. A new
// vuln or safe route committed without the matching Playwright pair fails
// here, and therefore fails CI.
const API_SUITE = 'tests/api/lab.api.test.mjs';
test('Playwright coverage contract: runtime-appropriate suite exists and names every active SAST scenario', () => {
  for (const entry of catalog.filter((e) => e.status === 'active' && e.scanner === 'SAST')) {
    const references = entry.test.split(';').map((s) => s.trim());
    if (entry.runtime === 'browser') {
      const browserSpecs = references.filter((r) => r.startsWith('tests/browser/'));
      expect(browserSpecs.length, `${entry.id} (client-side vuln) must reference a tests/browser/ spec`).toBeGreaterThan(0);
      for (const spec of browserSpecs) {
        expect(readFileSync(path.join(root, spec), 'utf8'), `${entry.id} missing from ${spec}`).toContain(entry.id);
      }
    } else {
      expect(references, `${entry.id} must reference ${API_SUITE}`).toContain(API_SUITE);
      expect(readFileSync(path.join(root, API_SUITE), 'utf8'), `${entry.id} missing from the Playwright API suite`).toContain(entry.id);
    }
  }
});
