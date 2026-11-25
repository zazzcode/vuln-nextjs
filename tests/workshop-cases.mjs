// Shared by tests/unit/workshop-scenarios.test.mjs (handlers) and
// tests/api/lab.api.test.mjs (HTTP). The input of each scenario comes from
// lib/workshop-cases.json and the vulnerable and safe sources from
// lib/catalog.json (IDs MONGO-028 and up — the first batch keeps
// tests/mongo-cases.mjs). The full answer key, with reasons, is in
// docs/vulnerabilities/workshop.md.
//   exploited  true only when the input had its effect. `send(route, input)`
//              reads the effect back where the response does not show it.
//   ordinary   per route that must work, so a safe route is not safe only
//              because it rejects everything.
//   attacks    further inputs, each with its effect on the vulnerable route.
//              Where a control reads a key the documented input does not
//              carry, the input adds it, so the attack reaches the control's
//              own query: its safety is then shown by the pattern, not by a 400.
// A request descriptor is either { body } (POST) or
// { query, headers?, cookies? } (GET, query as text).
import { readFileSync } from 'node:fs';
import { parse } from 'node:querystring';

const read = (file) => JSON.parse(readFileSync(new URL(`../lib/${file}`, import.meta.url), 'utf8'));
const catalog = read('catalog.json');
const inputs = read('workshop-cases.json');

const credentials = { login: 'alice', passcode: 'alice-lab-only' };
const payloadBody = { payload: JSON.stringify(credentials) };
const viewCookie = { view: '{"team":"floor"}' };
const deskHeader = { 'x-desk': '{"login":"alice","badge":"B-12-ALI"}' };

const alice = ({ data }) => data.person?.login === 'alice';
const isAdmin = ({ data }) => data.person?.login === 'admin' && data.person?.role === 'admin';
const some = (key) => ({ data }) => data[key]?.length > 0;
const is = (key, value) => ({ data }) => data[key] === value;
const includes = (login, key) => ({ data }) => (data[key] ?? []).some((row) => row.login === login);
const passcode = ({ data }) => data.person === null;
// The bulk update changed exactly one row that is not the caller's own loan:
// the ordinary batch on the caller's own number still changes it afterwards.
const changedOtherLoan = async (result, send) => result.data.changed === 1
  && is('changed', 1)(await send('loans/batch', body({ items: [{ where: { number: 101 } }] })));

const body = (value) => ({ body: value });
const query = (text, extra = {}) => ({ query: text, ...extra });

// Ordinary input per route: every route must answer it (also used by
// tests/unit/workshop.test.mjs).
export const ordinary = {
  'desk/accept': [body(payloadBody), alice],
  'desk/arrive': [body({ otp: '234202' }), alice],
  'desk/badge-in': [body(credentials), alice],
  'desk/begin': [body(credentials), alice],
  'desk/checkin': [body({ otp: '234202' }), alice],
  'desk/clock-in': [body(credentials), alice],
  'desk/context': [query('', { headers: deskHeader }), alice],
  'desk/enter': [body(credentials), alice],
  'desk/hint': [body({ login: 'alice', start: 'alice' }), is('right', true)],
  'desk/import': [body(payloadBody), alice],
  'desk/load': [body(payloadBody), alice],
  'desk/open-up': [body(credentials), alice],
  'desk/pass': [body(credentials), some('pass')],
  'desk/permit': [body(credentials), some('pass')],
  'desk/refresh': [body({ code: 'rs-2c08', next: 'new-lab-only' }), alice],
  'desk/renew': [body({ code: 'rs-2c08', next: 'new-lab-only' }), alice],
  'desk/scan': [body({ badge: 'B-12-ALI' }), alice],
  'desk/shift': [body(credentials), alice],
  'desk/start': [body(credentials), alice],
  'desk/tap': [body({ badge: 'B-12-ALI' }), alice],
  'desk/terminal': [query('', { headers: { 'x-desk': 'alice:B-12-ALI' } }), alice],
  'desk/unlock': [body(credentials), alice],
  'desk/verify': [body({ login: 'alice', start: 'alice-lab-only' }), is('right', true)],
  'desk/wave': [body({ badge: 'B-12-ALI' }), alice],
  'loans/batch': [body({ items: [{ where: { number: 101 } }] }), is('changed', 1)],
  'loans/bundle': [body({ items: [{ number: 101, state: 'in' }] }), is('changed', 1)],
  'loans/cancel': [body({ number: 101 }), is('gone', 101)],
  'loans/give-back': [body({ loan: { number: 101 } }), ({ data }) => data.loan?.state === 'in'],
  'loans/hand-back': [body({ loan: { number: 101 } }), ({ data }) => data.loan?.state === 'in'],
  'loans/joined': [body({}), some('rows')],
  'loans/linked': [body({ link: 'part' }), some('rows')],
  'loans/mine': [body({}), some('loans')],
  'loans/ours': [body({}), some('loans')],
  'loans/withdraw': [body({ number: 101 }), is('gone', 101)],
  'parts/blend': [query('bin=A'), some('parts')],
  'parts/choose': [body({ terms: [{ name: 'Hex key' }] }), some('parts')],
  'parts/combine': [query('bin=A'), some('parts')],
  'parts/everything': [query(''), some('rows')],
  'parts/overview': [query(''), some('rows')],
  'parts/select': [body({ terms: [{ name: 'Hex key' }] }), some('parts')],
  'people/bureau': [body({ view: 'floor' }), some('people')],
  'people/card': [body({ email: 'alice.l@lab.test' }), is('changed', 1)],
  'people/crew': [body({ login: 'alice' }), some('people')],
  'people/finder': [query('login=alice'), alice],
  'people/group': [body({ login: 'alice' }), some('people')],
  'people/latest': [query('', { cookies: viewCookie }), some('people')],
  'people/others': [body({}), some('people')],
  'people/recent': [query('', { cookies: viewCookie }), some('people')],
  'people/roster': [query('login=alice'), alice],
  'people/sheet': [body({ email: 'alice.l@lab.test' }), is('changed', 1)],
  'people/teams': [body({ teams: ['floor'] }), some('people')],
  'people/units': [body({ teams: ['floor'] }), some('people')],
  'stats/amount': [body({ start: 1 }), is('total', 7)],
  'stats/export': [body({ name: 'weekly' }), is('saved', 'copy_weekly')],
  'stats/headcount': [body({}), is('total', 1)],
  'stats/heads': [body({ login: 'admin' }), is('total', 1)],
  'stats/loads': [body({ factor: 2 }), some('totals')],
  'stats/options': [query(''), some('values')],
  'stats/sample': [query(''), is('total', 3)],
  'stats/size': [query(''), is('total', 3)],
  'stats/snapshot': [body({ name: 'weekly' }), is('saved', 'weekly')],
  'stats/sum': [body({ start: 1 }), is('total', 7)],
  'stats/values': [query(''), some('values')],
  'stats/weights': [body({ factor: 2 }), some('totals')],
};

const changedPasscode = async (result, send) => isAdmin(await send('desk/accept', body({ payload: JSON.stringify({ login: 'admin', passcode: 'zazzles-marker-pass' }) })));
const roleOfAlice = async (result, send) => (await send('people/finder', query('login=alice'))).data.person?.role === 'admin';
const aliceIsGone = async (result, send) => passcode(await send('people/finder', query('login=alice')));

const behaviours = {
  'MONGO-028': {
    exploited: isAdmin,
    attacks: [body({ otp: { $gt: '' } })],
  },
  'MONGO-029': { exploited: isAdmin },
  'MONGO-030': {
    exploited: isAdmin,
    attacks: [query('', { headers: { 'x-desk': '{"login":"admin","badge":{"$gt":""}}' } })],
  },
  'MONGO-031': { exploited: isAdmin },
  'MONGO-032': {
    exploited: is('right', true),
    attacks: [body({ login: 'admin', start: '^a' })],
  },
  'MONGO-033': {
    exploited: isAdmin,
    controlAttacks: { 'desk/load': [body({ payload: JSON.stringify({ login: 'admin', passcode: { $ne: '' } }) })] },
  },
  'MONGO-034': { exploited: isAdmin },
  'MONGO-035': { exploited: isAdmin },
  'MONGO-036': { exploited: changedPasscode },
  'MONGO-037': {
    exploited: isAdmin,
    attacks: [body({ badge: 'B-77.ADM' })],
  },
  'MONGO-038': { exploited: isAdmin },
  'MONGO-039': {
    exploited: changedOtherLoan,
    // bundle never reads "where": the number is added at the item's top level,
    // where bundle does read it, as a well-formed request for another loan.
    attacks: [body({ items: [{ where: { number: 202 }, number: 202, state: 'in' }] })],
  },
  'MONGO-040': { exploited: is('gone', 202) },
  'MONGO-041': { exploited: ({ data }) => data.loan?.number === 202 },
  'MONGO-042': {
    exploited: ({ data }) => (data.rows ?? []).some((row) => row.extra?.[0]?.passcode === 'alice-lab-only'),
    // linked reads "link" instead of from/mine/theirs; "person" makes it join
    // people too, through its constant projection.
    attacks: [body({ from: 'people', mine: 'borrower', theirs: 'login', link: 'person' })],
  },
  'MONGO-043': { exploited: ({ data }) => (data.loans ?? []).some((loan) => loan.number === 202) },
  'MONGO-044': { exploited: ({ data }) => (data.parts ?? []).some((part) => part.sku === 'P-9') },
  'MONGO-045': { exploited: ({ data }) => JSON.stringify(data.rows ?? '').includes('admin-lab-only') },
  'MONGO-046': { exploited: ({ data }) => (data.parts ?? []).length === 2 },
  'MONGO-047': { exploited: includes('admin', 'people') },
  'MONGO-048': { exploited: roleOfAlice },
  'MONGO-049': {
    exploited: includes('admin', 'people'),
    controlAttacks: { 'people/finder': [query('team[$ne]=floor')], 'people/roster': [query('team[$ne]=floor')] },
  },
  'MONGO-050': { exploited: includes('admin', 'people') },
  'MONGO-051': {
    exploited: includes('admin', 'people'),
    // $in and $nin as request objects. others reads "without" instead of
    // "teams", so the attack is repeated through that key: as a name it can
    // only exclude, and as an operator the server refuses it.
    attacks: [
      body({ teams: { $ne: 'floor' } }),
      body({ teams: { $in: ['board'] }, without: ['floor'] }),
      body({ teams: { $nin: ['floor'] }, without: [{ $ne: 'board' }] }),
    ],
  },
  'MONGO-052': {
    exploited: is('total', 1),
    attacks: [body({ $where: 'this.passcode.length === 14' }), body({ login: { $ne: '' } })],
  },
  'MONGO-053': { exploited: ({ data }) => data.rows?.[0]?.passcode === 'admin-lab-only' && data.total === 2 },
  'MONGO-054': { exploited: aliceIsGone },
  'MONGO-055': { exploited: is('total', 48) },
  'MONGO-056': { exploited: ({ data }) => (data.values ?? []).some((value) => String(value).startsWith('zazzles-supplier')) },
  'MONGO-057': { exploited: ({ data }) => (data.totals ?? []).length > 0 && data.totals.every(({ value }) => value === 42) },
};

const name = (source) => source.replace(/^pages\/api\/workshop\//, '').replace(/\.js$/, '');

const isGet = new Set(['desk/context', 'desk/terminal', 'desk/pass', 'desk/permit', 'parts/blend', 'parts/combine', 'parts/everything', 'parts/overview', 'people/finder', 'people/latest', 'people/recent', 'people/roster', 'stats/options', 'stats/sample', 'stats/size', 'stats/values']);
export const methods = Object.fromEntries(Object.keys(ordinary).map((route) => [route, isGet.has(route) ? 'GET' : 'POST']));

export const scenarios = catalog.filter((entry) => /^MONGO-(0[2-9][0-9]|1[0-9]{2})$/.test(entry.id) && Number(entry.id.slice(6)) >= 28).map((entry) => {
  const { method, endpoints, input, headers, cookies } = inputs[entry.id.toLowerCase()];
  const behaviour = behaviours[entry.id];
  const vulnerable = name(entry.source);
  const controls = [entry.safeControl, ...entry.safeControls].map(name);
  const sameChannel = (route) => (method === 'GET') === (methods[route] === 'GET');
  const primary = method === 'POST' ? body(input) : query(input, { headers, cookies });
  return {
    id: entry.id, title: entry.title, method, endpoints,
    vulnerable, controls,
    attacks: [primary, ...(behaviour.attacks ?? [])],
    exploited: behaviour.exploited,
    attacksOn: (control) => [...[primary, ...(behaviour.attacks ?? [])].filter((one) => sameChannel(control)), ...(behaviour.controlAttacks?.[control] ?? [])],
    ordinaryFor: (route) => ordinary[route],
  };
});

// A GET descriptor's query text becomes the flat query object the handler sees.
export function toHandlerInput(input) {
  if (input.body !== undefined) return { method: 'POST', body: input.body };
  return { method: 'GET', query: { ...parse(input.query ?? '') }, headers: input.headers ?? {}, cookies: input.cookies ?? {} };
}

// The GET side of a mixed pair (a body route with query controls) is documented
// in the key; the pages send only the routes that share the case's channel.
testCoverage();
function testCoverage() {
  for (const { id, endpoints, vulnerable, controls, method } of scenarios) {
    const sameChannel = controls.filter((route) => (method === 'GET') === (methods[route] === 'GET'));
    const expected = [vulnerable, ...sameChannel].map((route) => `/api/workshop/${route}`).sort();
    if (JSON.stringify(endpoints) !== JSON.stringify(expected)) throw new Error(`${id}: endpoints must list the same-channel routes, sorted`);
  }
}
