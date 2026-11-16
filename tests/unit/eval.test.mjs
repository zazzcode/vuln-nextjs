import { test, expect } from 'vitest';
import unsafeSubmit from '../../pages/api/vulnerable-submit.js';
import protectedExample from '../../pages/api/protected-example.js';
import { request } from './helpers.mjs';

test('JS-002: arithmetic payload executes inside the server-side eval', async () => {
  const result = await request(unsafeSubmit, { body: { name: 'lab', message: "' + (6 * 7) + '" } });
  expect(result.status).toBe(200);
  expect(result.data.message).toBe('42');
});

test('JS-002: ordinary submissions pass through both endpoints', async () => {
  const body = { name: 'lab', message: 'hello' };
  expect((await request(unsafeSubmit, { body })).data.message).toBe('hello');
  const safe = await request(protectedExample, { body });
  expect(safe.status).toBe(200);
  expect(safe.data.processedBy).toBe('protected API');
});

test('safe control: the same payload is stored as text, never evaluated', async () => {
  const payload = { name: 'lab', message: "' + (6 * 7) + '" };
  const result = await request(protectedExample, { body: payload });
  expect(result.status).toBe(200);
  expect(result.data.message).not.toBe('42'); // arithmetic never runs
  expect(result.data.message).toMatch(/6\s+7/); // digits survive as plain text
});

test('safe control: rejects wrong methods and non-string fields', async () => {
  expect((await request(protectedExample, { method: 'GET' })).status).toBe(405);
  expect((await request(protectedExample, { body: { name: [], message: 'x' } })).status).toBe(400);
  expect((await request(protectedExample, { body: {} })).status).toBe(400);
});
