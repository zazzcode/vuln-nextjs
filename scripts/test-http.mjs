import assert from 'node:assert/strict';
const base = process.env.LAB_URL || 'http://127.0.0.1:3000';
async function request(path, body) {
  const response = await fetch(base + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
assert.equal((await request('/api/lab/reset', {})).status,200);
for (const mode of ['safe','unsafe']) {
  assert.equal((await request(`/api/sql/${mode}/login`,{username:'alice',password:'alice-lab-only'})).status,200);
  assert.equal((await request(`/api/sql/${mode}/login`,{username:'alice',password:'bad'})).status,401);
}
const attack={username:"admin' --",password:'wrong'};
assert.equal((await request('/api/sql/unsafe/login',attack)).data.user.role,'admin');
assert.equal((await request('/api/sql/safe/login',attack)).status,401);
const q=encodeURIComponent("' OR true --");
assert.equal((await request(`/api/sql/unsafe/products?q=${q}`)).data.products.length,3);
assert.equal((await request(`/api/sql/safe/products?q=${q}`)).data.products.length,0);
const write={body:"lab', 'public'); UPDATE products SET public = true; --"};
assert.equal((await request('/api/sql/safe/notes',write)).status,201);
assert.equal((await request('/api/sql/safe/products')).data.products.length,2);
assert.equal((await request('/api/sql/unsafe/notes',write)).status,201);
assert.equal((await request('/api/sql/safe/products')).data.products.length,3);
assert.equal((await request('/api/lab/reset',{})).status,200);
assert.equal((await request('/api/sql/safe/products')).data.products.length,2);
assert.equal((await request('/api/vulnerable-submit',{name:'lab',message:"' + (6 * 7) + '"})).data.message,'42');
assert.equal((await request('/api/vulnerable-exec',{command:'printf zazzles-command-marker'})).data.output,'zazzles-command-marker');
assert.match((await request('/api/vulnerable-file-read',{filePath:'./package.json'})).data.content,/zazzles-vuln-lab/);
for (const route of ['/', '/vulnerabilities', '/sql/login','/sql/products','/sql/notes','/vulnerable/eval-injection','/vulnerable/form-submission','/vulnerable/api-route','/vulnerable/file-read','/vulnerable/header-injection','/vulnerable/dynamic-import','/vulnerable/rsc-server-action','/secure/sanitized-input','/secure/validated-form','/secure/protected-api','/secure/csp-enabled']) {
  const response=await fetch(base+route); assert.equal(response.status,200,route);
}
console.log('PASS: HTTP SQL controls, legacy vulnerability markers and all page routes');
