// Ordinary input only: every route under pages/api/workshop answers it.
import { test, expect, beforeEach, afterAll } from 'vitest';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import mongo from '../../lib/mongo.cjs';
import { close, database } from '../../lib/workshop/client.js';
import { seed } from '../../lib/workshop/seed.js';
import { request } from './helpers.mjs';

const root = path.join(import.meta.dirname, '../../pages/api/workshop');
const files = readdirSync(root, { recursive: true }).filter((file) => file.endsWith('.js')).map((file) => file.replace(/\.js$/, '')).sort();
const credentials = { login: 'alice', passcode: 'alice-lab-only' };
const get = (query = {}, more = {}) => ({ method: 'GET', query, ...more });
const post = (body) => ({ body });
const alice = ({ data }) => data.person?.login === 'alice';
const some = (key) => ({ data }) => data[key]?.length > 0;
const is = (key, value) => ({ data }) => data[key] === value;
const payload = post({ payload: JSON.stringify(credentials) });

const ordinary = {
  'desk/accept': [payload, alice],
  'desk/arrive': [post({ otp: '234202' }), alice],
  'desk/badge-in': [post(credentials), alice],
  'desk/begin': [post(credentials), alice],
  'desk/checkin': [post({ otp: '234202' }), alice],
  'desk/clock-in': [post(credentials), alice],
  'desk/context': [get({}, { headers: { 'x-desk': '{"login":"alice","badge":"B-12-ALI"}' } }), alice],
  'desk/enter': [post(credentials), alice],
  'desk/hint': [post({ login: 'alice', start: 'alice' }), is('right', true)],
  'desk/import': [payload, alice],
  'desk/load': [payload, alice],
  'desk/open-up': [post(credentials), alice],
  'desk/pass': [post(credentials), some('pass')],
  'desk/permit': [post(credentials), some('pass')],
  'desk/refresh': [post({ code: 'rs-2c08', next: 'new-lab-only' }), alice],
  'desk/renew': [post({ code: 'rs-2c08', next: 'new-lab-only' }), alice],
  'desk/scan': [post({ badge: 'B-12-ALI' }), alice],
  'desk/shift': [post(credentials), alice],
  'desk/start': [post(credentials), alice],
  'desk/tap': [post({ badge: 'B-12-ALI' }), alice],
  'desk/terminal': [get({}, { headers: { 'x-desk': 'alice:B-12-ALI' } }), alice],
  'desk/unlock': [post(credentials), alice],
  'desk/verify': [post({ login: 'alice', start: 'alice-lab-only' }), is('right', true)],
  'desk/wave': [post({ badge: 'B-12-ALI' }), alice],
  'loans/batch': [post({ items: [{ where: { number: 101 } }] }), is('changed', 1)],
  'loans/bundle': [post({ items: [{ number: 101, state: 'in' }] }), is('changed', 1)],
  'loans/cancel': [post({ number: 101 }), is('gone', 101)],
  'loans/give-back': [post({ loan: { number: 101 } }), ({ data }) => data.loan?.state === 'in'],
  'loans/hand-back': [post({ loan: { number: 101 } }), ({ data }) => data.loan?.state === 'in'],
  'loans/joined': [post({}), some('rows')],
  'loans/linked': [post({ link: 'part' }), some('rows')],
  'loans/mine': [post({}), some('loans')],
  'loans/ours': [post({}), some('loans')],
  'loans/withdraw': [post({ number: 101 }), is('gone', 101)],
  'parts/blend': [get({ bin: 'A' }), some('parts')],
  'parts/choose': [post({ terms: [{ name: 'Hex key' }] }), some('parts')],
  'parts/combine': [get({ bin: 'A' }), some('parts')],
  'parts/everything': [get(), some('rows')],
  'parts/overview': [get(), some('rows')],
  'parts/select': [post({ terms: [{ name: 'Hex key' }] }), some('parts')],
  'people/card': [post({ email: 'alice.l@lab.test' }), is('changed', 1)],
  'people/bureau': [post({ view: 'floor' }), some('people')],
  'people/crew': [post({ login: 'alice' }), some('people')],
  'people/finder': [get({ login: 'alice' }), alice],
  'people/group': [post({ login: 'alice' }), some('people')],
  'people/latest': [get({}, { cookies: { view: '{"team":"floor"}' } }), some('people')],
  'people/others': [post({}), some('people')],
  'people/recent': [get({}, { cookies: { view: '{"team":"floor"}' } }), some('people')],
  'people/roster': [get({ login: 'alice' }), alice],
  'people/sheet': [post({ email: 'alice.l@lab.test' }), is('changed', 1)],
  'people/teams': [post({ teams: ['floor'] }), some('people')],
  'people/units': [post({ teams: ['floor'] }), some('people')],
  'stats/amount': [post({ start: 1 }), is('total', 7)],
  'stats/export': [post({ name: 'weekly' }), is('saved', 'copy_weekly')],
  'stats/headcount': [post({}), is('total', 1)],
  'stats/heads': [post({ login: 'admin' }), is('total', 1)],
  'stats/loads': [post({ factor: 2 }), some('totals')],
  'stats/options': [get(), some('values')],
  'stats/sample': [get(), is('total', 3)],
  'stats/size': [get(), is('total', 3)],
  'stats/snapshot': [post({ name: 'weekly' }), is('saved', 'weekly')],
  'stats/sum': [post({ start: 1 }), is('total', 7)],
  'stats/values': [get(), some('values')],
  'stats/weights': [post({ factor: 2 }), some('totals')],
};

beforeEach(async () => seed(await database()), 600000);
afterAll(async () => { await close(); await mongo.closeMongo(); });

test('every route has an ordinary input', () => {
  expect(Object.keys(ordinary).sort()).toEqual(files);
});

test.each(files)('%s answers ordinary input', async (file) => {
  const { default: handler } = await import(path.join(root, `${file}.js`));
  const [input, ok] = ordinary[file];
  const result = await request(handler, input);
  expect(result.status).toBe(200);
  expect(ok(result), JSON.stringify(result.data)).toBe(true);
  expect((await request(handler, { method: 'DELETE' })).status).toBe(405);
});
