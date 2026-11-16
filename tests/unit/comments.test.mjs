import { test, expect, afterAll } from 'vitest';
import database from '../../lib/database.cjs';
import comments from '../../pages/api/xss/comments.js';
import { request } from './helpers.mjs';

afterAll(async () => {
  const db = await database.getDatabase();
  await db.close();
  delete globalThis.__zazzlesLabDatabase;
});

test('XSS-004 storage: guestbook comments round-trip verbatim through the parameterized API', async () => {
  const list = await request(comments, { method: 'GET' });
  expect(list.status).toBe(200);
  expect(list.data.comments.length).toBeGreaterThanOrEqual(2);
  expect(list.data.comments.some((c) => c.body.includes('<b>'))).toBe(true);
  const payload = `<img src=x onerror="window.__zazzlesXss='stored-marker'">`;
  const created = await request(comments, { body: { author: 'tester', body: payload } });
  expect(created.status).toBe(201);
  expect(created.data.comments[0].body).toBe(payload); // stored verbatim — the flaw is rendering, not storage
  const after = await request(comments, { method: 'GET' });
  expect(after.data.comments.some((c) => c.body === payload)).toBe(true);
});

test('XSS-004 storage: rejects wrong methods and invalid fields', async () => {
  expect((await request(comments, { method: 'PUT' })).status).toBe(405);
  expect((await request(comments, { body: {} })).status).toBe(400);
  expect((await request(comments, { body: { author: '', body: 'x' } })).status).toBe(400);
  expect((await request(comments, { body: { author: 'a', body: 'x'.repeat(1001) } })).status).toBe(400);
});
