import { test, expect } from 'vitest';
import unsafeRead from '../../pages/api/vulnerable-file-read.js';
import secureRead from '../../pages/api/secure/file-read.js';
import { request } from './helpers.mjs';

test('FS-001: unsafe endpoint reads any server-readable relative path', async () => {
  const result = await request(unsafeRead, { body: { filePath: './package.json' } });
  expect(result.status).toBe(200);
  expect(result.data.content).toContain('zazzles-vuln-lab');
});

test('safe control: publishes exactly the allowlisted files', async () => {
  for (const file of ['package.json', 'README.md']) {
    const result = await request(secureRead, { body: { file } });
    expect(result.status, file).toBe(200);
    expect(result.data.file).toBe(file);
    expect(typeof result.data.content).toBe('string');
  }
});

test('safe control: traversal, absolute and partial paths are rejected before any read', async () => {
  for (const file of ['../../../etc/passwd', '/etc/passwd', 'package.json/', './package.json', 'package.json/../package.json', '', 'README.md.asc', ['package.json']]) {
    const result = await request(secureRead, { body: { file } });
    expect(result.status, JSON.stringify(file)).toBe(403);
    expect(result.data.content).toBeUndefined();
  }
});

test('safe control: rejects wrong methods', async () => {
  expect((await request(secureRead, { method: 'GET' })).status).toBe(405);
});
