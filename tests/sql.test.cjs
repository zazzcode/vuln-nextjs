const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const database = require('../lib/database.cjs');

// Exercise the actual Next API handlers against real PGlite, without a server.
function loadHandler(file) {
  const filename = path.join(__dirname, '..', 'pages/api', file);
  const source = fs.readFileSync(filename, 'utf8')
    .replace(/import (\w+) from '([^']+)';/g, (_, name, relative) => `const ${name} = require(${JSON.stringify(path.resolve(path.dirname(filename), relative))});`)
    .replace('export default ', 'module.exports = ');
  const sandbox = { require, module: { exports: {} }, console };
  vm.runInNewContext(source, sandbox, { filename });
  return sandbox.module.exports;
}
async function request(file, { method = 'POST', body = {}, query = {} } = {}) {
  let status, data;
  const headers = {};
  await loadHandler(file)({ method, body, query }, {
    setHeader(name, value) { headers[name] = value; },
    status(value) { status = value; return this; },
    json(value) { data = JSON.parse(JSON.stringify(value)); },
  });
  return { status, data, headers };
}
after(async () => { const db = await database.getDatabase(); await db.close(); delete globalThis.__zazzlesLabDatabase; });

test('SQL scenarios and safe controls', async (t) => {
  await t.test('concurrent initialization shares one seeded instance', async () => {
    const [a, b] = await Promise.all([database.getDatabase(), database.getDatabase()]);
    assert.equal(a, b);
    assert.equal((await a.query('SELECT * FROM users')).rows.length, 2);
  });
  await t.test('both logins accept valid credentials and reject wrong passwords', async () => {
    for (const mode of ['safe', 'unsafe']) {
      const route = `sql/${mode}/login.js`;
      const ok = await request(route, {body:{username:'alice',password:'alice-lab-only'}});
      assert.equal(ok.status,200); assert.equal(ok.data.user.username,'alice');
      assert.equal(ok.data.user.password_hash,undefined); assert.equal(ok.data.user.password_demo,undefined);
      assert.equal((await request(route,{body:{username:'alice',password:'wrong'}})).status,401);
    }
  });
  await t.test('SQL-001 bypasses unsafe login; safe login rejects username and password payloads', async () => {
    const attack = {username:"admin' --",password:'wrong'};
    const unsafe = await request('sql/unsafe/login.js',{body:attack});
    assert.equal(unsafe.status,200); assert.equal(unsafe.data.user.role,'admin');
    assert.equal((await request('sql/safe/login.js',{body:attack})).status,401);
    assert.equal((await request('sql/safe/login.js',{body:{username:'admin',password:"' OR true --"}})).status,401);
    assert.equal((await request('sql/unsafe/login.js',{body:{username:'nobody',password:"' OR true --"}})).status,200);
  });
  await t.test('SQL-002 reveals private product only through unsafe search', async () => {
    for (const mode of ['safe','unsafe']) {
      assert.equal((await request(`sql/${mode}/products.js`,{method:'GET'})).data.products.length,2);
      assert.equal((await request(`sql/${mode}/products.js`,{method:'GET',query:{q:'mug'}})).data.products.length,1);
    }
    const attack = {method:'GET',query:{q:"' OR true --"}};
    assert.equal((await request('sql/unsafe/products.js',attack)).data.products.length,3);
    assert.equal((await request('sql/safe/products.js',attack)).data.products.length,0);
    assert.equal((await request('sql/safe/products.js',{method:'GET',query:{q:"O'Reilly"}})).status,200);
  });
  await t.test('SQL-003 executes stacked mutation only in unsafe write', async () => {
    const attack = "lab', 'public'); UPDATE products SET public = true; --";
    const safe = await request('sql/safe/notes.js',{body:{body:attack}});
    assert.equal(safe.status,201); assert.equal(safe.data.notes[0].body,attack);
    assert.equal((await request('sql/safe/products.js',{method:'GET'})).data.products.length,2);
    assert.equal((await request('sql/unsafe/notes.js',{body:{body:attack}})).status,201);
    assert.equal((await request('sql/safe/products.js',{method:'GET'})).data.products.length,3);
    await database.resetDatabase();
    assert.equal((await request('sql/safe/products.js',{method:'GET'})).data.products.length,2);
    assert.equal((await request('sql/safe/notes.js',{method:'GET'})).data.notes.length,1);
  });
  await t.test('ordinary notes work in both controls, apostrophes work safely', async () => {
    for (const mode of ['safe','unsafe']) assert.equal((await request(`sql/${mode}/notes.js`,{body:{body:'normal note'}})).status,201);
    assert.equal((await request('sql/safe/notes.js',{body:{body:"O'Reilly's note"}})).status,201);
  });
  await t.test('reset recovers dropped tables and re-seeds identities', async () => {
    const db = await database.getDatabase(); await db.exec('DROP TABLE products');
    assert.equal((await request('lab/reset.js')).status,200);
    assert.equal((await db.query('SELECT * FROM products')).rows.length,3);
    assert.equal((await request('sql/safe/login.js',{body:{username:'admin',password:'admin-lab-only'}})).status,200);
  });
  await t.test('method, types and limits are enforced without masking SQL payloads', async () => {
    for (const mode of ['safe','unsafe']) {
      const method = await request(`sql/${mode}/login.js`,{method:'GET'});
      assert.equal(method.status,405); assert.equal(method.headers.Allow,'POST');
      assert.equal((await request(`sql/${mode}/login.js`,{body:{username:[],password:'x'}})).status,400);
      assert.equal((await request(`sql/${mode}/notes.js`,{body:{body:'x'.repeat(1001)}})).status,400);
      assert.equal((await request(`sql/${mode}/products.js`,{method:'GET',query:{q:['a','b']}})).status,400);
    }
  });
});
