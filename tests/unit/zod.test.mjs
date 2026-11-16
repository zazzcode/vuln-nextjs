import { test, expect, afterAll } from 'vitest';
import database from '../../lib/database.cjs';
import zodLogin from '../../pages/api/sql/zod/login.js';
import zodProducts from '../../pages/api/sql/zod/products.js';
import zodNotes from '../../pages/api/sql/zod/notes.js';
import { request } from './helpers.mjs';

afterAll(async () => {
  const db = await database.getDatabase();
  await db.close();
  delete globalThis.__zazzlesLabDatabase;
});

test('SQL-001 zod control: valid login works, bypass payload is rejected as data', async () => {
  const ok = await request(zodLogin, { body: { username: 'alice', password: 'alice-lab-only' } });
  expect(ok.status).toBe(200);
  expect(ok.data.validatedWith).toBe('zod');
  expect(ok.data.user.username).toBe('alice');
  const attack = await request(zodLogin, { body: { username: "admin' --", password: 'wrong' } });
  expect(attack.status).toBe(401);
  expect(attack.data.authenticated).toBe(false);
});

test('SQL-001 zod control: schema violations are rejected before any query', async () => {
  expect((await request(zodLogin, { body: { username: '', password: 'x' } })).status).toBe(400);
  expect((await request(zodLogin, { body: { username: 'a', password: 'x'.repeat(201) } })).status).toBe(400);
  expect((await request(zodLogin, { body: { username: 42, password: 'x' } })).status).toBe(400);
  expect((await request(zodLogin, { method: 'GET' })).status).toBe(405);
});

test('SQL-002 zod control: OR-true payload stays a literal search term', async () => {
  const attack = { method: 'GET', query: { q: "' OR true --" } };
  const result = await request(zodProducts, attack);
  expect(result.status).toBe(200);
  expect(result.data.products).toHaveLength(0);
  expect((await request(zodProducts, { method: 'GET', query: { q: 'mug' } })).data.products).toHaveLength(1);
  expect((await request(zodProducts, { method: 'GET', query: { q: 'x'.repeat(201) } })).status).toBe(400);
});

test('SQL-003 zod control: stacked-statement payload is stored literally', async () => {
  const payload = "lab', 'public'); UPDATE products SET public = true; --";
  const safeProducts = async () => (await import('../../pages/api/sql/safe/products.js')).default;
  const before = await request(await safeProducts(), { method: 'GET' });
  const result = await request(zodNotes, { body: { body: payload } });
  expect(result.status).toBe(201);
  expect(result.data.notes[0].body).toBe(payload);
  const after = await request(await safeProducts(), { method: 'GET' });
  expect(after.data.products).toHaveLength(before.data.products.length); // no mutation
  expect((await request(zodNotes, { body: { body: '' } })).status).toBe(400);
  expect((await request(zodNotes, { body: { body: 'x'.repeat(1001) } })).status).toBe(400);
  await database.resetDatabase();
});
