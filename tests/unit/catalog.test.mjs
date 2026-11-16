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
