import assert from 'node:assert/strict';
const base = process.env.LAB_URL || 'http://127.0.0.1:3000';
async function request(path, body) {
  const response = await fetch(base + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
async function page(path, options = {}) {
  const response = await fetch(base + path, { redirect: 'manual', ...options });
  return { status: response.status, headers: response.headers, html: await response.text() };
}

// SQL-001/002/003: unsafe vs safe (parameterized) vs zod (validation + parameters).
assert.equal((await request('/api/lab/reset', {})).status, 200);
for (const mode of ['safe', 'unsafe', 'zod']) {
  assert.equal((await request(`/api/sql/${mode}/login`, { username: 'alice', password: 'alice-lab-only' })).status, 200);
  assert.equal((await request(`/api/sql/${mode}/login`, { username: 'alice', password: 'bad' })).status, 401);
}
const attack = { username: "admin' --", password: 'wrong' };
assert.equal((await request('/api/sql/unsafe/login', attack)).data.user.role, 'admin');
assert.equal((await request('/api/sql/safe/login', attack)).status, 401);
assert.equal((await request('/api/sql/zod/login', attack)).status, 401);
assert.equal((await request('/api/sql/zod/login', { username: 42, password: 'x' })).status, 400);
const q = encodeURIComponent("' OR true --");
assert.equal((await request(`/api/sql/unsafe/products?q=${q}`)).data.products.length, 3);
assert.equal((await request(`/api/sql/safe/products?q=${q}`)).data.products.length, 0);
assert.equal((await request(`/api/sql/zod/products?q=${q}`)).data.products.length, 0);
const write = { body: "lab', 'public'); UPDATE products SET public = true; --" };
assert.equal((await request('/api/sql/safe/notes', write)).status, 201);
assert.equal((await request('/api/sql/safe/products')).data.products.length, 2);
assert.equal((await request('/api/sql/unsafe/notes', write)).status, 201);
assert.equal((await request('/api/sql/safe/products')).data.products.length, 3);
assert.equal((await request('/api/lab/reset', {})).status, 200);
assert.equal((await request('/api/sql/safe/products')).data.products.length, 2);

// JS-002 eval pair.
assert.equal((await request('/api/vulnerable-submit', { name: 'lab', message: "' + (6 * 7) + '" })).data.message, '42');
assert.equal((await request('/api/protected-example', { name: 'lab', message: "' + (6 * 7) + '" })).data.message.includes('42'), false);

// OS-001 exec pair: identical metacharacter string, shell vs data.
const metachar = 'printf zazzles-one; printf zazzles-two';
assert.equal((await request('/api/vulnerable-exec', { command: metachar })).data.output, 'zazzles-onezazzles-two');
assert.equal((await request('/api/secure/command', { text: metachar })).data.echoed, metachar);

// FS-001 file-read pair.
assert.match((await request('/api/vulnerable-file-read', { filePath: './package.json' })).data.content, /zazzles-vuln-lab/);
assert.equal((await request('/api/secure/file-read', { file: 'package.json' })).status, 200);
assert.equal((await request('/api/secure/file-read', { file: '../../../etc/passwd' })).status, 403);

// XSS-001 SSR markup: unsafe serves raw HTML; safe escapes; sanitized strips the handler.
const xss = encodeURIComponent(`<img src=x onerror="window.__zazzlesXss='reflected-marker'">`);
const outputDiv = (html) => html.match(/<div id="xss-output"[^>]*>([\s\S]*?)<\/div>/)[1];
const unsafeReflected = await page(`/xss/unsafe/reflected?payload=${xss}`);
assert.equal(unsafeReflected.status, 200);
assert.match(outputDiv(unsafeReflected.html), /<img src=x onerror=/);
const safeReflected = await page(`/xss/safe/reflected?payload=${xss}`);
assert.equal(safeReflected.status, 200);
assert.match(outputDiv(safeReflected.html), /&lt;img src=x onerror=/);
const sanitizedReflected = await page(`/xss/sanitized/reflected?payload=${xss}`);
assert.equal(sanitizedReflected.status, 200);
assert.match(outputDiv(sanitizedReflected.html), /^<img src="x">$/);
assert.doesNotMatch(outputDiv(sanitizedReflected.html), /onerror/);

// XSS-003 SSR markup: raw </script> breakout vs \u003c escaping.
// Payload avoids double quotes (JSON escaping would corrupt the handler).
const breakout = encodeURIComponent(`</script><img src=x onerror='window.__zazzlesXss=\`script-marker\`'>`);
const unsafeScript = await page(`/xss/unsafe/script-context?data=${breakout}`);
assert.equal(unsafeScript.status, 200);
assert.match(unsafeScript.html, /window\.__labData = \{"data":"<\/script><img src=x onerror=/);
const safeScript = await page(`/xss/safe/script-context?data=${breakout}`);
assert.equal(safeScript.status, 200);
assert.match(safeScript.html, /window\.__labData = \{"data":"\\u003c\/script>/);
assert.doesNotMatch(safeScript.html, /data":"<\/script>/);

// XSS-004 guestbook: identical stored comment, raw vs sanitized SSR emission.
// Compare only the rendered comment bodies (__NEXT_DATA__ legitimately carries the raw rows).
const guestbook = `<img src=x onerror="window.__zazzlesXss='guestbook-marker'">`;
assert.equal((await request('/api/xss/comments', { author: 'probe', body: guestbook })).status, 201);
const commentBodies = (html) => [...html.matchAll(/<div class="comment-body">([\s\S]*?)<\/div>/g)].map((m) => m[1]).join('\n');
const unsafeComments = await page('/xss/unsafe/comments');
assert.equal(unsafeComments.status, 200);
assert.match(commentBodies(unsafeComments.html), /<img src=x onerror=/);
const sanitizedComments = await page('/xss/sanitized/comments');
assert.equal(sanitizedComments.status, 200);
assert.match(commentBodies(sanitizedComments.html), /<b>benign markup<\/b>/);
assert.match(commentBodies(sanitizedComments.html), /<img src="x">/);
assert.doesNotMatch(commentBodies(sanitizedComments.html), /onerror/);
assert.equal((await request('/api/lab/reset', {})).status, 200);

// SSRF-001: the server fetches an internal URL; the safe route enforces origin + path.
const internal = encodeURIComponent('http://127.0.0.1:3000/api/sql/safe/products');
const ssrf = await page(`/vulnerable/ssrf?fetch=${internal}`);
assert.equal(ssrf.status, 200);
assert.match(ssrf.html, /Zazzles mug/);
const otherOrigin = encodeURIComponent('http://127.0.0.1:3001/');
assert.match((await page(`/secure/ssrf?fetch=${otherOrigin}`)).html, /Blocked by same-origin policy/);
assert.match((await page(`/secure/ssrf?fetch=${encodeURIComponent('/api/sql/safe/products')}`)).html, /Zazzles mug/);

// REDIR-001: verbatim attacker destination vs relative-path-only policy.
const offsite = encodeURIComponent('https://example.org/');
const openRedirect = await page(`/vulnerable/redirect?to=${offsite}`);
assert.equal(openRedirect.status, 307);
assert.equal(openRedirect.headers.get('location'), 'https://example.org/');
const protocolRelative = await page(`/vulnerable/redirect?to=${encodeURIComponent('//example.org/')}`);
assert.equal(protocolRelative.status, 307);
assert.equal(protocolRelative.headers.get('location'), '/example.org/'); // Next normalizes // to a same-site path
assert.equal((await page(`/secure/redirect?to=${offsite}`)).status, 200); // rejected, no redirect
assert.equal((await page(`/secure/redirect?to=${encodeURIComponent('//example.org/')}`)).status, 200);
const inSite = await page(`/secure/redirect?to=${encodeURIComponent('/sql/login')}`);
assert.equal(inSite.status, 307);
assert.equal(inSite.headers.get('location'), '/sql/login');

// Every page renders.
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
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
}
console.log('PASS: HTTP pairs for SQL/eval/exec/file-read/XSS markup/SSRF/redirect and all page routes');
