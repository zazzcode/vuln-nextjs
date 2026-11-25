// The second MongoDB batch as scenarios: the identical input has its effect
// on the vulnerable route and none on every safe control, and every route
// also answers ordinary input. The answer key, with reasons, is in
// docs/vulnerabilities/workshop.md; the first batch is tests/unit/mongo.test.mjs.
import { test, expect, beforeEach, afterAll, describe } from 'vitest';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import mongo from '../../lib/mongo.cjs';
import { close, database } from '../../lib/workshop/client.js';
import { seed } from '../../lib/workshop/seed.js';
import { methods, scenarios, toHandlerInput } from '../workshop-cases.mjs';
import { request } from './helpers.mjs';

const root = path.join(import.meta.dirname, '../..');
const handlers = {};
for (const route of Object.keys(methods)) handlers[route] = (await import(`${root}/pages/api/workshop/${route}.js`)).default;

function send(route, input) {
  return request(handlers[route], toHandlerInput(input));
}

beforeEach(async () => seed(await database()), 600000);
afterAll(async () => { await close(); await mongo.closeMongo(); });

test('every route under pages/api/workshop is registered once and every scenario has a behaviour', () => {
  const files = readdirSync(path.join(root, 'pages/api/workshop'), { recursive: true }).filter((file) => file.endsWith('.js')).map((file) => file.replace(/\.js$/, '')).sort();
  const routes = [...new Set(scenarios.flatMap(({ vulnerable, controls }) => [vulnerable, ...controls]))].sort();
  expect(routes).toEqual(files);
});

describe.each(scenarios)('$id $title', ({ vulnerable, controls, attacks, exploited, attacksOn, ordinaryFor }) => {
  test.each(attacks.map((input) => [JSON.stringify(input), input]))('VULNERABLE: %s has its effect', async (_label, input) => {
    expect(await exploited(await send(vulnerable, input), send)).toBe(true);
  });

  test.each(controls.flatMap((route) => attacksOn(route).map((input) => [route, JSON.stringify(input), input])))('PROTECTED %s: %s has no effect', async (route, _label, input) => {
    expect(await exploited(await send(route, input), send), `${route} ${JSON.stringify(input)}`).toBe(false);
  });

  test.each([vulnerable, ...controls])('%s accepts ordinary input', async (route) => {
    const [input, ok] = ordinaryFor(route);
    const result = await send(route, input);
    expect(result.status, route).toBe(200);
    expect(ok(result), `${route} ${JSON.stringify(result.data)}`).toBe(true);
  });
});
