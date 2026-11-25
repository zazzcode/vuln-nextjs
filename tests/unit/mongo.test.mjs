import { test, expect, beforeEach, afterAll, describe } from 'vitest';
import { readdirSync } from 'node:fs';
import { parse } from 'node:querystring';
import path from 'node:path';
import mongo from '../../lib/mongo.cjs';
import { behaviours, methods, scenarios } from '../mongo-cases.mjs';
import { request } from './helpers.mjs';

const root = path.join(import.meta.dirname, '../..');
const handlers = {};
for (const route of Object.keys(methods)) handlers[route] = (await import(`${root}/pages/api/mongo/${route}.js`)).default;

// Next.js gives a handler the flat `querystring` result and the original URL.
function send(route, input) {
  if (methods[route] === 'POST') return request(handlers[route], { body: input });
  return request(handlers[route], { method: 'GET', query: { ...parse(input) }, url: `/api/mongo/${route}?${input}` });
}

// The first run downloads mongod, so allow more than the suite default.
beforeEach(() => mongo.resetMongo(), 600000);
afterAll(() => mongo.closeMongo());

test('every route under pages/api/mongo is registered once and every scenario has a behaviour', () => {
  const files = readdirSync(path.join(root, 'pages/api/mongo'), { recursive: true }).filter((file) => file.endsWith('.js')).map((file) => file.replace(/\.js$/, ''));
  expect(Object.keys(methods).sort()).toEqual(files.sort());
  expect(scenarios.map(({ id }) => id)).toEqual(Object.keys(behaviours));
  for (const { id, endpoints, vulnerable, controls } of scenarios) {
    expect(endpoints, id).toEqual([vulnerable, ...controls].map((route) => `/api/mongo/${route}`).sort());
  }
});

test('concurrent initialization shares one seeded server', async () => {
  const [a, b] = await Promise.all([mongo.collection('accounts'), mongo.collection('accounts')]);
  expect(a.dbName).toBe(b.dbName);
  expect(await a.countDocuments()).toBe(2);
});

describe.each(scenarios)('$id $title', ({ vulnerable, controls, attacks, exploited, attacksOn, exploitedOn, normalFor }) => {
  test.each(attacks.map((input) => [JSON.stringify(input), input]))('VULNERABLE: %s has its effect', async (_label, input) => {
    expect(await exploited(await send(vulnerable, input), send)).toBe(true);
  });

  test.each(controls.flatMap((route) => attacksOn(route).map((input) => [route, JSON.stringify(input), input])))('PROTECTED %s: %s has no effect', async (route, _label, input) => {
    expect(await exploitedOn(route)(await send(route, input), send)).toBe(false);
  });

  test.each([vulnerable, ...controls])('%s accepts ordinary input', async (route) => {
    const [input, ok] = normalFor(route);
    expect(ok(await send(route, input))).toBe(true);
  });
});

test('other methods are refused', async () => {
  for (const [route, method] of Object.entries(methods)) {
    expect((await request(handlers[route], { method: 'DELETE' })).status, `${method} ${route}`).toBe(405);
  }
});

test('lab reset restores the seeded documents', async () => {
  const { default: reset } = await import('../../pages/api/lab/reset.js');
  await (await mongo.collection('accounts')).deleteMany({});
  expect((await request(reset, { body: {} })).status).toBe(200);
  expect(await (await mongo.collection('accounts')).countDocuments()).toBe(2);
});
