// Ordinary input only: every route under pages/api/workshop answers it.
// The vulnerable/protected pairs live in tests/unit/workshop-scenarios.test.mjs.
import { test, expect, beforeEach, afterAll } from 'vitest';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import mongo from '../../lib/mongo.cjs';
import { close, database } from '../../lib/workshop/client.js';
import { seed } from '../../lib/workshop/seed.js';
import { ordinary, toHandlerInput } from '../workshop-cases.mjs';
import { request } from './helpers.mjs';

const root = path.join(import.meta.dirname, '../../pages/api/workshop');
const files = readdirSync(root, { recursive: true }).filter((file) => file.endsWith('.js')).map((file) => file.replace(/\.js$/, '')).sort();

beforeEach(async () => seed(await database()), 600000);
afterAll(async () => { await close(); await mongo.closeMongo(); });

test('every route has an ordinary input', () => {
  expect(Object.keys(ordinary).sort()).toEqual(files);
});

test.each(files)('%s answers ordinary input', async (file) => {
  const { default: handler } = await import(path.join(root, `${file}.js`));
  const [input, ok] = ordinary[file];
  const result = await request(handler, toHandlerInput(input));
  expect(result.status).toBe(200);
  expect(ok(result), JSON.stringify(result.data)).toBe(true);
  expect((await request(handler, { method: 'DELETE' })).status).toBe(405);
});
