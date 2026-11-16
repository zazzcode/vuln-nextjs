import assert from 'node:assert/strict';
const base = process.env.LAB_URL || 'http://127.0.0.1:3000';
async function request(path, body) {
  const response = await fetch(base + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
async function page(path) {
  const response = await fetch(base + path);
  return { status: response.status, html: await response.text() };
}

// SQL pairs.
assert.equal((await request('/api/lab/reset', {})).status, 200);
for (const mode of ['safe', 'unsafe']) {
  assert.equal((await request(`/api/sql/${mode}/login`, { username: 'alice', password: 'alice-lab-only' })).status, 200);
  assert.equal((await request(`/api/sql/${mode}/login`, { username: 'alice', password: 'bad' })).status, 401);
}
const attack = { username: "admin' --", password: 'wrong' };
assert.equal((await request('/api/sql/unsafe/login', attack)).data.user.role, 'admin');
assert.equal((await request('/api/sql/safe/login', attack)).status, 401);
const q = encodeURIComponent("' OR true --");
assert.equal((await request(`/api/sql/unsafe/products?q=${q}`)).data.products.length, 3);
assert.equal((await request(`/api/sql/safe/products?q=${q}`)).data.products.length, 0);
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

// XSS SSR markup: unsafe serves raw HTML, safe escapes the identical payload.
const xss = encodeURIComponent(`<img src=x onerror="window.__zazzlesXss='reflected-marker'">`);
const unsafeReflected = await page(`/xss/unsafe/reflected?payload=${xss}`);
assert.equal(unsafeReflected.status, 200);
assert.match(unsafeReflected.html, /<div id="xss-output"[^>]*><img src=x onerror=/);
const safeReflected = await page(`/xss/safe/reflected?payload=${xss}`);
assert.equal(safeReflected.status, 200);
assert.match(safeReflected.html, /&lt;img src=x onerror=/);
assert.doesNotMatch(safeReflected.html, /<div id="xss-output"[^>]*><img /);

// Every page renders.
const routes = ['/', '/vulnerabilities', '/sql/login', '/sql/products', '/sql/notes',
  '/xss/unsafe/reflected', '/xss/safe/reflected', '/xss/unsafe/stored', '/xss/safe/stored',
  '/vulnerable/eval-injection', '/vulnerable/form-submission', '/vulnerable/api-route', '/vulnerable/file-read',
  '/vulnerable/header-injection', '/vulnerable/dynamic-import', '/vulnerable/rsc-server-action',
  '/secure/sanitized-input', '/secure/validated-form', '/secure/protected-api', '/secure/csp-enabled',
  '/secure/command-execution', '/secure/file-access'];
for (const route of routes) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
}
console.log('PASS: HTTP pairs for SQL/eval/exec/file-read/XSS markup and all page routes');
