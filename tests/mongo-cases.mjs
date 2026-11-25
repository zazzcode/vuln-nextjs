// Shared by tests/unit/mongo.test.mjs (handlers) and tests/api/lab.api.test.mjs
// (HTTP). The input of each scenario comes from lib/mongo-cases.json and the
// vulnerable and safe sources from lib/catalog.json.
//   exploited  true only when the input had its effect. `send(path, input)`
//              reads the effect back where the response does not show it.
//   normal     ordinary input per route that must work, so a safe route is not
//              safe only because it rejects everything.
import { readFileSync } from 'node:fs';

const read = (file) => JSON.parse(readFileSync(new URL(`../lib/${file}`, import.meta.url), 'utf8'));
const catalog = read('catalog.json');
const inputs = read('mongo-cases.json');

const credentials = { username: 'alice', passphrase: 'alice-lab-only' };
const isAlice = ({ data }) => data.user?.username === 'alice' && data.user.role === 'user';
const isAdmin = ({ data }) => data.user?.role === 'admin';
const account = (username) => ({ data }) => data.account?.username === username;
const titles = ({ data }) => (data.articles ?? data.rows ?? []).map((row) => row.title);
const showsDraft = (result) => titles(result).includes('Internal prototype');
const lists = (...expected) => (result) => JSON.stringify(titles(result)) === JSON.stringify(expected);
const changed = ({ data }) => data.changed === 1;
const signIn = (send) => send('sign-in/kiosk', credentials);
const promoted = async (_result, send) => isAdmin(await signIn(send));
const all = (path, input, ok) => ({ '*': [input, ok], ...path });

const MUG = '64b000000000000000000001';
const code = { code: 'zz-alice-17' };

export const behaviours = {
  'MONGO-001': {
    exploited: isAdmin,
    attacks: [{ $gt: '' }, { $regex: '.*' }, { $in: ['x', 'admin-lab-only'] }].map((passphrase) => ({ username: 'admin', passphrase })),
    normal: all({}, credentials, isAlice),
  },
  'MONGO-002': { exploited: isAdmin, normal: all({}, credentials, isAlice) },
  'MONGO-003': { exploited: isAdmin, normal: all({}, credentials, isAlice) },
  'MONGO-004': {
    exploited: isAdmin,
    normal: all({}, { username: 'alice', passphrase: 'x', code: 'zz-alice-17' }, isAlice),
  },
  'MONGO-005': { exploited: isAdmin, normal: all({}, credentials, isAlice) },
  'MONGO-006': {
    exploited: account('admin'),
    attacks: ['username=admin&inviteCode[$in]=x&inviteCode[$in]=zz-admin-41', 'username=admin&inviteCode[$regex]=.', 'username[$ne]=alice&inviteCode[$ne]=x&pin[$ne]=1', 'category[$ne]=x&category[$ne]=y&username=admin&inviteCode[$gt]='],
    normal: {
      'directory/badge': ['username=alice&inviteCode=zz-alice-17', account('alice')],
      'directory/locker': ['username=alice&pin=2046', account('alice')],
      'directory/desk': ['username=alice&inviteCode=zz-alice-17', account('alice')],
      'articles/shelf': ['category=home&category=office&category=lab', lists('Security notebook', 'Zazzles mug')],
    },
    controlExploited: { 'articles/shelf': ({ data }) => data.articles?.length !== 0 },
  },
  'MONGO-007': {
    exploited: ({ data }) => data.article?.title === 'Internal prototype',
    normal: all({}, { id: MUG }, ({ data }) => data.article?.title === 'Zazzles mug'),
  },
  'MONGO-008': {
    exploited: showsDraft,
    normal: {
      'articles/browse': ['category=home', lists('Zazzles mug')],
      'articles/topic': ['category=home', lists('Zazzles mug')],
      'articles/budget': ['limit=10', lists('Security notebook')],
      'articles/view': ['mode=cheap', lists('Security notebook')],
      'articles/range': ['limit=10', lists('Security notebook')],
    },
    // The same text in the parameter that each safe route reads.
    controlAttacks: {
      'articles/budget': ["limit=1 || true", 'limit=$price', 'limit=Infinity'],
      'articles/view': ['mode=true', 'mode=constructor'],
      'articles/range': ['limit=$price', 'limit=Infinity'],
    },
  },
  'MONGO-009': {
    exploited: ({ data }) => Boolean(data.rows?.length) && data.rows.every((row) => row.score === 42),
    normal: all({}, { weight: 2 }, ({ data }) => data.rows?.map((row) => row.score).join() === '16,24'),
  },
  'MONGO-010': {
    exploited: showsDraft,
    attacks: ['filter={"$where":"true"}', 'filter={"category":{"$ne":"x"},"published":{"$ne":true}}'],
    normal: all({}, 'filter={"category":"home"}', lists('Zazzles mug')),
  },
  'MONGO-011': {
    exploited: showsDraft,
    attacks: [{ published: false }],
    normal: all({}, { category: 'home' }, lists('Zazzles mug')),
  },
  'MONGO-012': {
    exploited: ({ data }) => data.total > 0,
    normal: {
      'directory/tally': [{ filter: { username: 'alice' } }, ({ data }) => data.total === 1],
      'directory/count': [{ filter: { username: 'alice', role: 'user' } }, ({ data }) => data.total === 1],
    },
  },
  'MONGO-013': {
    exploited: changed,
    normal: all({}, { booking: { reference: 'BK-1001' } }, changed),
  },
  'MONGO-014': {
    exploited: ({ data }) => data.removed === 1,
    normal: all({}, { reference: 'BK-1001' }, ({ data }) => data.removed === 1),
  },
  'MONGO-015': {
    // A booking that is already confirmed does not change again.
    exploited: async (_result, send) => (await send('bookings/accept', { reference: 'BK-2002' })).data.changed === 0,
    normal: all({}, { reference: 'BK-1001' }, changed),
  },
  'MONGO-016': {
    exploited: ({ data }) => data.rows?.[0]?.passphrase === 'admin-lab-only',
    normal: {
      'reports/run': [{ stages: [{ $match: { published: true } }, { $count: 'total' }] }, ({ data }) => data.rows?.[0]?.total === 2],
      'reports/named': [{ report: 'categories' }, ({ data }) => data.rows?.length === 2],
    },
    controlAttacks: { 'reports/named': [{ report: 'constructor' }, { report: [{ $unionWith: 'accounts' }] }] },
  },
  'MONGO-017': {
    exploited: lists('Zazzles mug'),
    attacks: [{ only: { $expr: { $eq: [{ $substrCP: ['$reviewerNote', 0, 14] }, 'zazzles-note-a'] } } }],
    normal: all({}, { only: { category: 'office' } }, lists('Security notebook')),
    controlAttacks: { 'reports/overview': [{ only: { category: '$category' } }] },
  },
  'MONGO-018': {
    exploited: ({ data }) => JSON.stringify(data.rows ?? '').includes('zazzles-note-'),
    attacks: ['by=$ROOT'],
    normal: all({}, 'by=category', ({ data }) => data.rows?.map((row) => row._id).join() === 'home,office'),
  },
  'MONGO-019': {
    exploited: promoted,
    attacks: [{ access: { role: 'admin' } }, { displayName: 'A', email: 'a@lab.test', 'access.role': 'admin' }],
    normal: all({}, { displayName: 'Alice L', email: 'alice.l@lab.test' }, changed),
  },
  'MONGO-020': {
    exploited: promoted,
    attacks: [{ displayName: 'A', 'access.role': 'admin' }],
    normal: all({}, { displayName: 'Alice L' }, changed),
  },
  'MONGO-021': {
    exploited: promoted,
    attacks: [{ changes: { $set: { displayName: 'A', access: { role: 'admin' } } } }],
    normal: all({}, { changes: { $set: { displayName: 'Alice L' } } }, changed),
  },
  'MONGO-022': {
    exploited: ({ data }) => data.account?.displayName === 'alice-lab-only',
    normal: all({}, { displayName: 'Alice L' }, ({ data }) => data.account?.displayName === 'Alice L'),
    controlExploited: { 'members/alias': ({ data }) => data.account?.displayName !== '$passphrase' },
  },
  'MONGO-023': {
    exploited: lists('Zazzles mug', 'Security notebook'),
    normal: {
      'articles/ordered': ['order=title', lists('Security notebook', 'Zazzles mug')],
      'articles/sorted': ['order=newest', lists('Security notebook', 'Zazzles mug')],
    },
    controlAttacks: { 'articles/sorted': ['order=constructor', 'order=__proto__'] },
  },
  'MONGO-024': {
    exploited: ({ data }) => JSON.stringify(data.people ?? '').includes('lab-only'),
    normal: all({}, 'fields=displayName,email', ({ data }) => data.people?.[1]?.email === 'alice@lab.test'),
  },
  'MONGO-025': {
    exploited: account('admin'),
    attacks: ['by=passphrase&value=admin-lab-only', 'by=access.role&value=admin'],
    normal: all({}, 'by=username&value=alice', account('alice')),
  },
  'MONGO-026': {
    exploited: ({ data }) => Boolean(data.account),
    attacks: [{ code: 'zz-admin-\\d+' }, { code: 'x|zz-admin-41' }, { code: 'zz-admin-.+' }],
    normal: all({}, code, account('alice')),
    controlAttacks: Object.fromEntries(['claim', 'check', 'open'].map((name) => [`invites/${name}`, [{ code: '\\E.*' }, { code: '[a-z0-9-]+' }, { code: '.*\n' }, { code: { $regex: '.*' } }]])),
  },
  'MONGO-027': {
    exploited: ({ data }) => Boolean(data.account),
    normal: all({}, code, account('alice')),
    controlAttacks: { 'invites/join': [{ code: '.*' }, { code: '\\d' }, { code: '\\\\.*' }, { code: 'x|zz-admin-41' }] },
  },
};

const name = (source) => source.replace(/^pages\/api\/mongo\//, '').replace(/\.js$/, '');

export const scenarios = catalog.filter((entry) => entry.id.startsWith('MONGO-')).map((entry) => {
  const { method, endpoints, input } = inputs[entry.id.toLowerCase()];
  const behaviour = behaviours[entry.id];
  const vulnerable = name(entry.source);
  const controls = [entry.safeControl, ...entry.safeControls].map(name);
  const attacks = [input, ...(behaviour.attacks ?? [])];
  return {
    id: entry.id, title: entry.title, method, endpoints, vulnerable, attacks, controls, exploited: behaviour.exploited,
    attacksOn: (control) => [...attacks, ...(behaviour.controlAttacks?.[control] ?? [])],
    exploitedOn: (control) => behaviour.controlExploited?.[control] ?? behaviour.exploited,
    normalFor: (path) => behaviour.normal[path] ?? behaviour.normal['*'],
  };
});

export const methods = Object.fromEntries(scenarios.flatMap(({ method, vulnerable, controls }) => [vulnerable, ...controls].map((path) => [path, method])));
