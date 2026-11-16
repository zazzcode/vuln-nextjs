/**
 * Zazzles vulnerability lab — Playwright API regression suite.
 *
 * Contributor/agent contract (see AGENTS.md): every scenario — vulnerable
 * route AND every safe control — must be represented here as a pair:
 * ONE identical payload sent to both routes, asserting the exploit
 * succeeds on the vulnerable side and stays inert data on the protected
 * side. Browser-executing scenarios additionally live in tests/browser/
 * (which needs Chromium; this file never launches a browser, so it runs
 * without `playwright install`).
 *
 * Failure interpretation:
 *   a VULNERABLE assertion failing  → someone hardened a flaw (regression:
 *                                     restore the vulnerability)
 *   a PROTECTED assertion failing   → a control stopped neutralizing its
 *                                     payload (fix the control, not the test)
 */
import { test, expect } from '@playwright/test';

// -- small helpers: keep the specs about security, not plumbing -------------

/** Reset the lab's in-memory database to its seeded state. */
async function resetLab(request) {
  const response = await request.post('/api/lab/reset', { data: {} });
  expect(response.ok(), 'lab reset must succeed').toBeTruthy();
}

/** POST a JSON body and return the response (Playwright sets the header). */
const postJson = (request, path, data) => request.post(path, { data });

/** Extract the rendered #xss-output container from SSR HTML. */
const outputDiv = (html) => html.match(/<div id="xss-output"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';

/** Extract the rendered .comment-body divs from SSR HTML (not __NEXT_DATA__). */
const commentBodies = (html) => [...html.matchAll(/<div class="comment-body">([\s\S]*?)<\/div>/g)].map((m) => m[1]).join('\n');

// -- SQL-001 · login bypass --------------------------------------------------

test.describe('SQL-001 · login bypass', () => {
  test.beforeEach(async ({ request }) => resetLab(request));

  test('valid credentials work on all three variants', async ({ request }) => {
    for (const mode of ['unsafe', 'safe', 'zod']) {
      const response = await postJson(request, `/api/sql/${mode}/login`, { username: 'alice', password: 'alice-lab-only' });
      expect(response.status(), mode).toBe(200);
    }
  });

  test('comment payload: VULNERABLE authenticates as admin, PROTECTED twins reject it', async ({ request }) => {
    const payload = { username: "admin' --", password: 'wrong' }; // password is ignored after "--"
    const vulnerable = await (await postJson(request, '/api/sql/unsafe/login', payload)).json();
    expect(vulnerable.user.role, 'bypassed with a wrong password').toBe('admin');
    expect((await postJson(request, '/api/sql/safe/login', payload)).status(), 'parameterized').toBe(401);
    expect((await postJson(request, '/api/sql/zod/login', payload)).status(), 'zod + parameters').toBe(401);
  });

  test('zod variant rejects malformed shapes before any query', async ({ request }) => {
    expect((await postJson(request, '/api/sql/zod/login', { username: 42, password: 'x' })).status()).toBe(400);
  });
});

// -- SQL-002 · search injection ----------------------------------------------

test.describe('SQL-002 · product search injection', () => {
  test.beforeEach(async ({ request }) => resetLab(request));

  test('OR-true payload: VULNERABLE discloses the hidden product, PROTECTED twins return none', async ({ request }) => {
    const q = encodeURIComponent("' OR true --");
    expect((await (await request.get(`/api/sql/unsafe/products?q=${q}`)).json()).products, 'hidden row disclosed').toHaveLength(3);
    expect((await (await request.get(`/api/sql/safe/products?q=${q}`)).json()).products, 'parameterized').toHaveLength(0);
    expect((await (await request.get(`/api/sql/zod/products?q=${q}`)).json()).products, 'zod + parameters').toHaveLength(0);
  });
});

// -- SQL-003 · stacked statements --------------------------------------------

test.describe('SQL-003 · note write with stacked statements', () => {
  test.beforeEach(async ({ request }) => resetLab(request));

  test('stacked UPDATE: VULNERABLE mutates products, PROTECTED stores the attack string verbatim', async ({ request }) => {
    const payload = { body: "lab', 'public'); UPDATE products SET public = true; --" };

    expect((await postJson(request, '/api/sql/safe/notes', payload)).status(), 'note accepted').toBe(201);
    expect((await (await request.get('/api/sql/safe/products')).json()).products, 'no side effect').toHaveLength(2);

    expect((await postJson(request, '/api/sql/unsafe/notes', payload)).status(), 'note accepted').toBe(201);
    expect((await (await request.get('/api/sql/safe/products')).json()).products, 'stacked UPDATE ran').toHaveLength(3);
  });
});

// -- JS-002 · server-side eval ------------------------------------------------

test.describe('JS-002 · server-side eval injection', () => {
  test('arithmetic payload: VULNERABLE computes it, PROTECTED echoes it as text', async ({ request }) => {
    const payload = { name: 'lab', message: "' + (6 * 7) + '" };
    expect((await (await postJson(request, '/api/vulnerable-submit', payload)).json()).message, 'server evaluated 6*7').toBe('42');
    const protectedResponse = await (await postJson(request, '/api/protected-example', payload)).json();
    expect(protectedResponse.message, 'digits survive as text').toMatch(/6\s+7/);
    expect(protectedResponse.message, 'never evaluated').not.toBe('42');
  });
});

// -- OS-001 · shell command execution -----------------------------------------

test.describe('OS-001 · shell command execution', () => {
  test('identical metacharacter string: VULNERABLE runs two commands, PROTECTED echoes one argument', async ({ request }) => {
    const payload = { text: 'printf zazzles-one; printf zazzles-two' };
    expect((await (await postJson(request, '/api/vulnerable-exec', { command: payload.text })).json()).output, 'shell chained both').toBe('zazzles-onezazzles-two');
    expect((await (await postJson(request, '/api/secure/command', payload)).json()).echoed, 'semicolon is data').toBe(payload.text);
  });
});

// -- FS-001 · arbitrary file read ---------------------------------------------

test.describe('FS-001 · arbitrary file read', () => {
  test('VULNERABLE reads any path, PROTECTED allows exactly its allowlist', async ({ request }) => {
    expect((await (await postJson(request, '/api/vulnerable-file-read', { filePath: './package.json' })).json()).content).toContain('zazzles-vuln-lab');
    expect((await postJson(request, '/api/secure/file-read', { file: 'package.json' })).status(), 'allowlisted').toBe(200);
    expect((await postJson(request, '/api/secure/file-read', { file: '../../../etc/passwd' })).status(), 'traversal rejected').toBe(403);
  });
});

// -- XSS · SSR markup emission -------------------------------------------------

test.describe('XSS · server-rendered markup', () => {
  test('XSS-001 reflected: raw HTML on unsafe, escaped on safe, handler stripped on sanitized', async ({ request }) => {
    const payload = encodeURIComponent(`<img src=x onerror="window.__zazzlesXss='reflected-marker'">`);
    expect(outputDiv(await (await request.get(`/xss/unsafe/reflected?payload=${payload}`)).text()), 'raw markup served').toMatch(/<img src=x onerror=/);
    expect(outputDiv(await (await request.get(`/xss/safe/reflected?payload=${payload}`)).text()), 'escaped as text').toMatch(/&lt;img src=x onerror=/);
    const sanitized = outputDiv(await (await request.get(`/xss/sanitized/reflected?payload=${payload}`)).text());
    expect(sanitized, 'benign part kept').toBe('<img src="x">');
    expect(sanitized, 'handler stripped').not.toContain('onerror');
  });

  test('XSS-003 script-context: raw </script> breakout vs \\u003c escaping', async ({ request }) => {
    const payload = encodeURIComponent(`</script><img src=x onerror='window.__zazzlesXss=\`script-marker\`'>`);
    const unsafe = await (await request.get(`/xss/unsafe/script-context?data=${payload}`)).text();
    expect(unsafe, 'breakout reaches the HTML parser').toMatch(/window\.__labData = \{"data":"<\/script><img src=x onerror=/);
    const safe = await (await request.get(`/xss/safe/script-context?data=${payload}`)).text();
    expect(safe, 'escaped for script embedding').toMatch(/window\.__labData = \{"data":"\\u003c\/script>/);
    expect(safe).not.toMatch(/data":"<\/script>/);
  });

  test('XSS-004 guestbook: identical stored comment, raw vs sanitized emission', async ({ request }) => {
    await resetLab(request);
    const payload = `<img src=x onerror="window.__zazzlesXss='guestbook-marker'">`;
    expect((await postJson(request, '/api/xss/comments', { author: 'api-test', body: payload })).status(), 'stored verbatim (safe storage)').toBe(201);

    expect(commentBodies(await (await request.get('/xss/unsafe/comments')).text()), 'raw markup for every visitor').toMatch(/<img src=x onerror=/);
    const sanitized = commentBodies(await (await request.get('/xss/sanitized/comments')).text());
    expect(sanitized, 'benign seeded markup kept').toContain('<b>benign markup</b>');
    expect(sanitized, 'handler stripped').not.toContain('onerror');
  });
});

// -- SSRF-001 · server-side request forgery -----------------------------------

test.describe('SSRF-001 · request forgery during rendering', () => {
  test('VULNERABLE fetches an internal URL, PROTECTED enforces origin + path', async ({ request }) => {
    const internal = encodeURIComponent('http://127.0.0.1:3000/api/sql/safe/products');
    expect(await (await request.get(`/vulnerable/ssrf?fetch=${internal}`)).text(), 'internal API rendered').toContain('Zazzles mug');
    expect(await (await request.get(`/secure/ssrf?fetch=${encodeURIComponent('http://127.0.0.1:3001/')}`)).text(), 'other origin blocked').toContain('Blocked by same-origin policy');
    expect(await (await request.get(`/secure/ssrf?fetch=${encodeURIComponent('/api/sql/safe/products')}`)).text(), 'own API allowed').toContain('Zazzles mug');
  });
});

// -- REDIR-001 · open redirect --------------------------------------------------

test.describe('REDIR-001 · open redirect during rendering', () => {
  test('VULNERABLE emits an off-origin Location, PROTECTED accepts only same-site paths', async ({ request }) => {
    // maxRedirects: 0 — observe the 307 itself instead of following it
    const offsite = await request.get(`/vulnerable/redirect?to=${encodeURIComponent('https://example.org/')}`, { maxRedirects: 0 });
    expect(offsite.status()).toBe(307);
    expect(offsite.headers().location, 'attacker-controlled absolute URL').toBe('https://example.org/');

    expect((await request.get(`/secure/redirect?to=${encodeURIComponent('https://example.org/')}`, { maxRedirects: 0 })).status(), 'absolute rejected (renders rejection page)').toBe(200);
    const inSite = await request.get(`/secure/redirect?to=${encodeURIComponent('/sql/login')}`, { maxRedirects: 0 });
    expect(inSite.status(), 'relative allowed').toBe(307);
    expect(inSite.headers().location).toBe('/sql/login');
  });
});

// -- every page renders ---------------------------------------------------------

test('all lab pages return 200', async ({ request }) => {
  const routes = ['/', '/vulnerabilities', '/sql/login', '/sql/products', '/sql/notes',
    '/xss/unsafe/reflected', '/xss/safe/reflected', '/xss/sanitized/reflected',
    '/xss/unsafe/stored', '/xss/safe/stored', '/xss/unsafe/comments', '/xss/sanitized/comments',
    '/xss/unsafe/script-context', '/xss/safe/script-context',
    '/vulnerable/eval-injection', '/vulnerable/form-submission', '/vulnerable/api-route', '/vulnerable/file-read',
    '/vulnerable/ssrf', '/secure/ssrf', '/secure/redirect',
    '/vulnerable/header-injection', '/vulnerable/dynamic-import', '/vulnerable/rsc-server-action',
    '/secure/sanitized-input', '/secure/validated-form', '/secure/protected-api', '/secure/csp-enabled',
    '/secure/command-execution', '/secure/file-access'];
  for (const route of routes) {
    expect((await request.get(route)).status(), route).toBe(200);
  }
});
