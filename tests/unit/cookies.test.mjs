import { test, expect, vi, afterEach } from 'vitest';
import scriptReadable from '../../pages/api/cookies/unsafe/script-readable.js';
import plainTransport from '../../pages/api/cookies/unsafe/plain-transport.js';
import misleadingName from '../../pages/api/cookies/unsafe/misleading-name.js';
import severalCookies from '../../pages/api/cookies/unsafe/several-cookies.js';
import overriddenOptions from '../../pages/api/cookies/unsafe/overridden-options.js';
import attributeInName from '../../pages/api/cookies/unsafe/attribute-in-name.js';
import replacedHeader from '../../pages/api/cookies/unsafe/replaced-header.js';
import safeOverridden from '../../pages/api/cookies/safe/overridden-options.js';
import safeReplaced from '../../pages/api/cookies/safe/replaced-header.js';
import lowercaseAttributes from '../../pages/api/cookies/safe/lowercase-attributes.js';
import composedAttributes from '../../pages/api/cookies/safe/composed-attributes.js';
import sessionNamedPreference from '../../pages/api/cookies/safe/session-named-preference.js';
import visitorCounter from '../../pages/api/cookies/safe/visitor-counter.js';
import safeSession from '../../pages/api/cookies/safe/session.js';
import environmentSecure from '../../pages/api/cookies/safe/environment-secure.js';
import preference from '../../pages/api/cookies/safe/preference.js';
import csrfToken from '../../pages/api/cookies/safe/csrf-token.js';
import signOut from '../../pages/api/cookies/safe/sign-out.js';
import { request } from './helpers.mjs';

const credentials = { username: 'alice', password: 'alice-lab-only' };
const cookieNamed = (headers, name) => [headers['Set-Cookie']].flat().find((value) => value.startsWith(`${name}=`));
const valueOf = (header) => header.slice(header.indexOf('=') + 1).split(';')[0];
const attributes = (header) => header.split(';').slice(1).map((part) => part.trim().toLowerCase());

const sessionRoutes = [
  ['COOKIE-001', scriptReadable, 'lab_sid_readable'],
  ['COOKIE-002', plainTransport, 'lab_sid_plain'],
  ['COOKIE-003', misleadingName, 'ui_prefs'],
  ['COOKIE-004', severalCookies, 'lab_sid_multi'],
  ['COOKIE-005', overriddenOptions, 'lab_sid_order'],
  ['COOKIE-006', attributeInName, 'lab_HttpOnly_sid'],
  ['COOKIE-007', replacedHeader, 'lab_sid_replaced'],
  ['safe overridden-options', safeOverridden, 'lab_sid_order_safe'],
  ['safe replaced-header', safeReplaced, 'lab_sid_final'],
  ['safe lowercase-attributes', lowercaseAttributes, 'lab_sid_lower'],
  ['safe composed-attributes', composedAttributes, 'lab_sid_composed'],
  ['safe session', safeSession, 'lab_sid_safe'],
  ['safe environment-secure', environmentSecure, 'lab_sid_env'],
];

afterEach(() => vi.unstubAllEnvs());

test.each(sessionRoutes)('%s: the cookie it sets is the one that identifies the caller', async (_id, handler, name) => {
  expect((await request(handler, { method: 'GET' })).status).toBe(401);
  const signIn = await request(handler, { body: credentials });
  expect(signIn.status).toBe(200);
  const token = valueOf(cookieNamed(signIn.headers, name));
  const me = await request(handler, { method: 'GET', cookies: { [name]: token } });
  expect(me.data.user.username).toBe('alice');
  expect((await request(handler, { method: 'GET', cookies: { [name]: 'guessed' } })).status).toBe(401);
});

test.each(sessionRoutes)('%s: rejects wrong credentials, shapes and methods without a cookie', async (_id, handler) => {
  const wrong = await request(handler, { body: { ...credentials, password: 'wrong' } });
  expect(wrong.status).toBe(401);
  expect(wrong.headers['Set-Cookie']).toBeUndefined();
  expect((await request(handler, { body: { username: ['alice'], password: 'x' } })).status).toBe(400);
  expect((await request(handler, { method: 'DELETE' })).status).toBe(405);
});

test.each([['COOKIE-001', scriptReadable, 'lab_sid_readable'], ['COOKIE-003', misleadingName, 'ui_prefs'], ['COOKIE-005', overriddenOptions, 'lab_sid_order'], ['COOKIE-006', attributeInName, 'lab_HttpOnly_sid']])('%s: HttpOnly is missing, Secure is present', async (_id, handler, name) => {
  const flags = attributes(cookieNamed((await request(handler, { body: credentials })).headers, name));
  expect(flags).not.toContain('httponly');
  expect(flags).toContain('secure');
});

test.each([['COOKIE-002', plainTransport, 'lab_sid_plain'], ['COOKIE-004', severalCookies, 'lab_sid_multi'], ['COOKIE-007', replacedHeader, 'lab_sid_replaced']])('%s: Secure is missing, HttpOnly is present', async (_id, handler, name) => {
  const flags = attributes(cookieNamed((await request(handler, { body: credentials })).headers, name));
  expect(flags).not.toContain('secure');
  expect(flags).toContain('httponly');
});

test.each([
  ['session', safeSession, 'lab_sid_safe'], ['overridden-options', safeOverridden, 'lab_sid_order_safe'],
  ['replaced-header', safeReplaced, 'lab_sid_final'], ['lowercase-attributes', lowercaseAttributes, 'lab_sid_lower'],
  ['composed-attributes', composedAttributes, 'lab_sid_composed'],
])('safe control %s: identical credentials give a cookie with every attribute', async (_id, handler, name) => {
  const flags = attributes(cookieNamed((await request(handler, { body: credentials })).headers, name));
  expect(flags).toEqual(expect.arrayContaining(['httponly', 'secure', 'samesite=lax']));
});

test('safe control: environment-secure sets Secure in production and leaves it out in development', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  expect(attributes(cookieNamed((await request(environmentSecure, { body: credentials })).headers, 'lab_sid_env'))).toEqual(expect.arrayContaining(['httponly', 'secure']));
  vi.stubEnv('NODE_ENV', 'development');
  const development = attributes(cookieNamed((await request(environmentSecure, { body: credentials })).headers, 'lab_sid_env'));
  expect(development).toContain('httponly');
  expect(development).not.toContain('secure');
});

test('hard negative: the preference cookie holds a theme and never identifies a caller', async () => {
  const set = await request(preference, { body: { theme: 'dark' } });
  expect(valueOf(cookieNamed(set.headers, 'lab_theme'))).toBe('dark');
  expect((await request(preference, { method: 'GET', cookies: { lab_theme: 'dark' } })).data).toEqual({ theme: 'dark' });
  expect((await request(preference, { method: 'GET', cookies: { lab_theme: 'neon' } })).status).toBe(400);
  expect((await request(safeSession, { method: 'GET', cookies: { lab_sid_safe: 'dark' } })).status).toBe(401);
});

test('hard negative: the CSRF token is readable by design and only gates the request', async () => {
  const issued = cookieNamed((await request(csrfToken, { method: 'GET' })).headers, 'lab_csrf');
  expect(attributes(issued)).not.toContain('httponly');
  const token = valueOf(issued);
  expect((await request(csrfToken, { cookies: { lab_csrf: token }, headers: { 'x-csrf-token': token } })).data).toEqual({ accepted: true });
  expect((await request(csrfToken, { cookies: { lab_csrf: token } })).status).toBe(403);
});

test('hard negative: sign-out expires the cookie and ends the session', async () => {
  const token = valueOf(cookieNamed((await request(safeSession, { body: credentials })).headers, 'lab_sid_safe'));
  const out = await request(signOut, { cookies: { lab_sid_safe: token } });
  const header = cookieNamed(out.headers, 'lab_sid_safe');
  expect(valueOf(header)).toBe('');
  expect(attributes(header)).toContain('max-age=0');
  expect((await request(safeSession, { method: 'GET', cookies: { lab_sid_safe: token } })).status).toBe(401);
});

test('hard negative: a session-like name on a dismissed banner identifies nobody', async () => {
  const set = await request(sessionNamedPreference, { body: {} });
  expect(cookieNamed(set.headers, 'session_banner')).toContain('session_banner=dismissed');
  expect((await request(sessionNamedPreference, { method: 'GET', cookies: { session_banner: 'dismissed' } })).data).toEqual({ showBanner: false });
  expect((await request(safeSession, { method: 'GET', cookies: { lab_sid_safe: 'dismissed' } })).status).toBe(401);
});

test('hard negative: the visitor token counts views and is not accepted as a session', async () => {
  const first = await request(visitorCounter, { method: 'GET' });
  const token = valueOf(cookieNamed(first.headers, 'lab_visitor'));
  expect(token).toMatch(/^[0-9a-f]{48}$/);
  expect((await request(visitorCounter, { method: 'GET', cookies: { lab_visitor: token } })).data).toEqual({ views: 2 });
  expect((await request(safeSession, { method: 'GET', cookies: { lab_sid_safe: token } })).status).toBe(401);
});
