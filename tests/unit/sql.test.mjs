import { test, expect, afterAll } from 'vitest';
import database from '../../lib/database.cjs';
import safeLogin from '../../pages/api/sql/safe/login.js';
import unsafeLogin from '../../pages/api/sql/unsafe/login.js';
import safeProducts from '../../pages/api/sql/safe/products.js';
import unsafeProducts from '../../pages/api/sql/unsafe/products.js';
import safeNotes from '../../pages/api/sql/safe/notes.js';
import unsafeNotes from '../../pages/api/sql/unsafe/notes.js';
import reset from '../../pages/api/lab/reset.js';
import { request } from './helpers.mjs';

const creds = { username: 'alice', password: 'alice-lab-only' };

afterAll(async () => {
  const db = await database.getDatabase();
  await db.close();
  delete globalThis.__zazzlesLabDatabase;
});

test('concurrent initialization shares one seeded instance', async () => {
  const [a, b] = await Promise.all([database.getDatabase(), database.getDatabase()]);
  expect(a).toBe(b);
  expect((await a.query('SELECT * FROM users')).rows).toHaveLength(2);
});

test('both logins accept valid credentials and reject wrong passwords', async () => {
  for (const [mode, handler] of [['safe', safeLogin], ['unsafe', unsafeLogin]]) {
    const ok = await request(handler, { body: creds });
    expect(ok.status, mode).toBe(200);
    expect(ok.data.user.username).toBe('alice');
    expect(ok.data.user.password_hash).toBeUndefined();
    expect(ok.data.user.password_demo).toBeUndefined();
    const bad = await request(handler, { body: { username: 'alice', password: 'wrong' } });
    expect(bad.status, mode).toBe(401);
  }
});

test('SQL-001: comment payload bypasses unsafe login; safe login rejects username and password payloads', async () => {
  const attack = { username: "admin' --", password: 'wrong' };
  const unsafe = await request(unsafeLogin, { body: attack });
  expect(unsafe.status).toBe(200);
  expect(unsafe.data.user.role).toBe('admin');
  expect((await request(safeLogin, { body: attack })).status).toBe(401);
  expect((await request(safeLogin, { body: { username: 'admin', password: "' OR true --" } })).status).toBe(401);
  expect((await request(unsafeLogin, { body: { username: 'nobody', password: "' OR true --" } })).status).toBe(200);
});

test('SQL-002: OR-true payload reveals the private product only through unsafe search', async () => {
  for (const [mode, handler] of [['safe', safeProducts], ['unsafe', unsafeProducts]]) {
    expect((await request(handler, { method: 'GET' })).data.products, mode).toHaveLength(2);
    expect((await request(handler, { method: 'GET', query: { q: 'mug' } })).data.products, mode).toHaveLength(1);
  }
  const attack = { method: 'GET', query: { q: "' OR true --" } };
  expect((await request(unsafeProducts, attack)).data.products).toHaveLength(3);
  expect((await request(unsafeProducts, attack)).data.products.map((p) => p.name)).toContain('Internal prototype');
  expect((await request(safeProducts, attack)).data.products).toHaveLength(0);
  expect((await request(safeProducts, { method: 'GET', query: { q: "O'Reilly" } })).status).toBe(200);
});

test('SQL-003: stacked statement mutates products only through the unsafe write', async () => {
  const attack = "lab', 'public'); UPDATE products SET public = true; --";
  const safe = await request(safeNotes, { body: { body: attack } });
  expect(safe.status).toBe(201);
  expect(safe.data.notes[0].body).toBe(attack);
  expect((await request(safeProducts, { method: 'GET' })).data.products).toHaveLength(2);
  const unsafe = await request(unsafeNotes, { body: { body: attack } });
  expect(unsafe.status).toBe(201);
  expect((await request(safeProducts, { method: 'GET' })).data.products).toHaveLength(3);
  await database.resetDatabase();
  expect((await request(safeProducts, { method: 'GET' })).data.products).toHaveLength(2);
  expect((await request(safeNotes, { method: 'GET' })).data.notes).toHaveLength(1);
});

test('ordinary notes work in both controls and apostrophes store safely', async () => {
  for (const [mode, handler] of [['safe', safeNotes], ['unsafe', unsafeNotes]]) {
    expect((await request(handler, { body: { body: 'normal note' } })).status, mode).toBe(201);
  }
  expect((await request(safeNotes, { body: { body: "O'Reilly's note" } })).status).toBe(201);
});

test('reset recovers dropped tables and re-seeds identities', async () => {
  const db = await database.getDatabase();
  await db.exec('DROP TABLE products');
  expect((await request(reset, { body: {} })).status).toBe(200);
  expect((await db.query('SELECT * FROM products')).rows).toHaveLength(3);
  expect((await request(safeLogin, { body: { username: 'admin', password: 'admin-lab-only' } })).status).toBe(200);
});

test('method, type and length checks are enforced without masking SQL payloads', async () => {
  for (const [mode, handler] of [['safe', safeLogin], ['unsafe', unsafeLogin]]) {
    const method = await request(handler, { method: 'GET' });
    expect(method.status, mode).toBe(405);
    expect(method.headers.Allow, mode).toBe('POST');
    expect((await request(handler, { body: { username: [], password: 'x' } })).status, mode).toBe(400);
    expect((await request(mode === 'safe' ? safeNotes : unsafeNotes, { body: { body: 'x'.repeat(1001) } })).status, mode).toBe(400);
    expect((await request(mode === 'safe' ? safeProducts : unsafeProducts, { method: 'GET', query: { q: ['a', 'b'] } })).status, mode).toBe(400);
  }
});
