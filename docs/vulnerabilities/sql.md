# Module: SQL injection (CWE-89)

All scenarios run against the in-memory PGlite instance (see [architecture](../architecture.md)). Every scenario has an **unsafe** endpoint that interpolates user input into SQL and protected endpoints that receive the **identical payload** as data — via bound parameters (`/api/sql/safe/*`) and via Zod schema validation feeding the same bound parameters (`/api/sql/zod/*`). `POST /api/lab/reset` restores the seed data at any time.

Lab credentials: `alice / alice-lab-only`, `admin / admin-lab-only`. Login endpoints perform a demo identity check only — no session or cookie is created.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [SQL-001 · Login bypass](#sql-001) | [expected finding](#sql-001-agent) | [guide](#sql-001-student) | [Burp · Postman · curl](#sql-001-exploit) | [comparison](#sql-001-safe) | [tests](#sql-001-tests) |
| [SQL-002 · Search injection](#sql-002) | [expected finding](#sql-002-agent) | [guide](#sql-002-student) | [Burp · Postman · curl](#sql-002-exploit) | [comparison](#sql-002-safe) | [tests](#sql-002-tests) |
| [SQL-003 · Stacked statements](#sql-003) | [expected finding](#sql-003-agent) | [guide](#sql-003-student) | [Burp · Postman · curl](#sql-003-exploit) | [comparison](#sql-003-safe) | [tests](#sql-003-tests) |

---

<a id="sql-001"></a>
## SQL-001 · Login bypass

<a id="sql-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/sql/unsafe/login.js` |
| Safe controls | `pages/api/sql/safe/login.js` (bound parameters) · `pages/api/sql/zod/login.js` (Zod + bound parameters) |
| Endpoint | `POST /api/sql/{unsafe,safe,zod}/login` |
| Sink | string interpolation into `db.query` |
| Flow | JSON `username`/`password` → `'…${username}…${password}…'` |
| Tests | `tests/unit/sql.test.mjs`; `tests/unit/zod.test.mjs`; `scripts/test-http.mjs` |

**Expected finding:** SAST reports SQL injection (CWE-89) on both interpolated fields.

[Student guide](#sql-001-student) · [Exploit lab](#sql-001-exploit) · [Vuln vs protected](#sql-001-safe) · [Tests](#sql-001-tests)

<a id="sql-001-student"></a>
### Student guide

```js
`SELECT id, username, role FROM users WHERE username = '${username}' AND password_demo = '${password}' LIMIT 1`
```

The comment payload `admin' --` closes the username string and comments out the password check; a tautology in the password field (`' OR true --`) bypasses equally. The unsafe login compares the lab-only `password_demo` column so the classic payload works; the protected logins verify a salted scrypt hash instead.

<a id="sql-001-exploit"></a>
### Exploit lab

Payload: `{"username":"admin' --","password":"wrong"}` — success is `200` with `"role":"admin"` despite the wrong password.

**Burp Suite**

1. Open `/sql/login` in the embedded browser, choose **unsafe** mode, press **Run unsafe example** with the loaded injection sample.
2. Send the captured `POST /api/sql/unsafe/login` to Repeater; **Send** → `"role": "admin"`.
3. Right-click → change the path to `/api/sql/safe/login` (and again `/api/sql/zod/login`), **Send** → `401 {"authenticated":false}` for the identical body.

**Postman**

1. `POST http://127.0.0.1:3000/api/sql/unsafe/login`, header `Content-Type: application/json`, raw body = payload → 200 as admin.
2. Duplicate the tab twice, changing only the path to `/api/sql/safe/login` and `/api/sql/zod/login` → both 401.

**curl**

```bash
curl -s http://127.0.0.1:3000/api/sql/unsafe/login \
  -H 'Content-Type: application/json' \
  --data-raw '{"username":"admin'"'"' --","password":"wrong"}'
# → 200, "role": "admin"

curl -s -w '\n%{http_code}\n' http://127.0.0.1:3000/api/sql/safe/login \
  -H 'Content-Type: application/json' \
  --data-raw '{"username":"admin'"'"' --","password":"wrong"}'
# → 401 {"authenticated":false}   (zod endpoint behaves the same)
```

**Observation that proves exploitation:** admin identity returned with a wrong password (unsafe) vs 401 for the identical payload (protected).

<a id="sql-001-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected (parameterized) | Protected (Zod + parameters) |
| --- | --- | --- | --- |
| Route | `POST /api/sql/unsafe/login` | `POST /api/sql/safe/login` | `POST /api/sql/zod/login` |
| Source | `pages/api/sql/unsafe/login.js` | `pages/api/sql/safe/login.js` | `pages/api/sql/zod/login.js` |
| Mechanism | interpolation into the SQL text | `WHERE username = $1` + scrypt hash verify | `Credentials.safeParse(body)` then the same `$1` query |
| Same payload → | authenticated as admin | 401 | 401 (well-formed strings reach the query and match nothing) |

**Why the controls work:** a bound parameter is transmitted to PostgreSQL as a value, not SQL grammar — the payload never rewrites the statement, which is also why legitimate apostrophes keep working. The Zod layer adds *shape* enforcement (types, lengths) before any query runs: it rejects `{"username": 42}` outright, but note it deliberately does **not** reject quote characters — validation complements parameterization, it cannot replace it. The password check also moves to a salted hash comparison, removing the plaintext-comparison weakness the unsafe route relies on.

<a id="sql-001-tests"></a>
### Automated tests

- `tests/unit/sql.test.mjs`: comment and tautology bypasses succeed only on unsafe; valid/invalid logins on all; response never leaks hash columns.
- `tests/unit/zod.test.mjs`: zod control rejects bad shapes (empty/oversized/wrong type) with 400 and treats the bypass payload as data (401).
- `scripts/test-http.mjs` repeats the pair over HTTP.

---

<a id="sql-002"></a>
## SQL-002 · Product search injection

<a id="sql-002-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/sql/unsafe/products.js` |
| Safe controls | `pages/api/sql/safe/products.js` · `pages/api/sql/zod/products.js` |
| Endpoint | `GET /api/sql/{unsafe,safe,zod}/products?q=` |
| Sink | ILIKE pattern interpolation |
| Flow | `query.q` → `'…ILIKE '%${q}%…'` |
| Tests | `tests/unit/sql.test.mjs`; `tests/unit/zod.test.mjs`; `scripts/test-http.mjs` |

**Expected finding:** SAST reports SQL injection (CWE-89) on the interpolated search term.

[Student guide](#sql-002-student) · [Exploit lab](#sql-002-exploit) · [Vuln vs protected](#sql-002-safe) · [Tests](#sql-002-tests)

<a id="sql-002-student"></a>
### Student guide

```js
`SELECT ... WHERE public = true AND name ILIKE '%${q}%' ORDER BY id`
```

The intended predicate lists public products only. `' OR true --` rewrites the WHERE clause to match everything, disclosing the hidden `Internal prototype` row — an authorization boundary crossed through data, without changing any code.

<a id="sql-002-exploit"></a>
### Exploit lab

Payload: `q=' OR true --` (URL-encoded `%27%20OR%20true%20--`).

**Burp Suite**

1. From `/sql/products` (unsafe mode, **Load injection example**, Run) capture `GET /api/sql/unsafe/products?q=...`; send to Repeater; **Send** → 3 rows including `Internal prototype`.
2. Change the path to `/api/sql/safe/products` → identical query returns `[]`.

**Postman**

1. `GET http://127.0.0.1:3000/api/sql/unsafe/products?q=%27%20OR%20true%20--` → 3 products.
2. Same URL against `/api/sql/safe/products` (and `/api/sql/zod/products`) → empty list; `?q=mug` works on all three.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/sql/unsafe/products?q=%27%20OR%20true%20--'   # 3 rows
curl -s 'http://127.0.0.1:3000/api/sql/safe/products?q=%27%20OR%20true%20--'    # []
```

**Observation that proves exploitation:** the private product appears only through the unsafe route.

<a id="sql-002-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected (parameterized) | Protected (Zod + parameters) |
| --- | --- | --- | --- |
| Route | `GET /api/sql/unsafe/products` | `GET /api/sql/safe/products` | `GET /api/sql/zod/products` |
| Source | `pages/api/sql/unsafe/products.js` | `pages/api/sql/safe/products.js` | `pages/api/sql/zod/products.js` |
| Mechanism | `ILIKE '%${q}%'` | `ILIKE $1` with `['%' + q + '%']` | `z.object({ q: z.string().max(200) })` then `ILIKE $1` |
| Same payload → | 3 rows (hidden row disclosed) | 0 rows | 0 rows |

**Why the controls work:** as a bound value, `' OR true --` is just a product name that matches nothing. **Scope note:** parameterization defeats injection; it is not an authorization control — which rows are public remains the query's own business rule.

<a id="sql-002-tests"></a>
### Automated tests

- `tests/unit/sql.test.mjs`: 3 rows via unsafe (including the private product), 0 via safe; identical baselines; apostrophe search works safely.
- `tests/unit/zod.test.mjs`: zod control returns 0 rows for the payload and 400 for oversized input.
- `scripts/test-http.mjs` repeats the pair over HTTP.

---

<a id="sql-003"></a>
## SQL-003 · Note write with stacked statements

<a id="sql-003-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/sql/unsafe/notes.js` |
| Safe controls | `pages/api/sql/safe/notes.js` · `pages/api/sql/zod/notes.js` |
| Endpoint | `GET/POST /api/sql/{unsafe,safe,zod}/notes` |
| Sink | `db.exec` (multi-statement) with interpolated note body |
| Flow | JSON `body` → `INSERT … VALUES ('${body}', …)` |
| Tests | `tests/unit/sql.test.mjs`; `tests/unit/zod.test.mjs`; `scripts/test-http.mjs` |

**Expected finding:** SAST reports SQL injection (CWE-89); the multi-statement sink additionally enables stacked queries (mutation/destruction, not just disclosure).

[Student guide](#sql-003-student) · [Exploit lab](#sql-003-exploit) · [Vuln vs protected](#sql-003-safe) · [Tests](#sql-003-tests)

<a id="sql-003-student"></a>
### Student guide

```js
await db.exec(`INSERT INTO notes (body, visibility) VALUES ('${body}', 'public') RETURNING ...`);
```

`db.exec` executes **multiple statements**, so the note text can close the INSERT and append a second statement — an `UPDATE`, a `DELETE`, or `DROP TABLE`. The demo payload publishes every product; a destructive variant works identically (reset recovers the schema).

<a id="sql-003-exploit"></a>
### Exploit lab

Payload: `{"body":"lab', 'public'); UPDATE products SET public = true; --"}` — the note is stored *and* the stacked UPDATE runs.

**Burp Suite**

1. From `/sql/notes` (unsafe mode, **Load injection example**, Run) capture `POST /api/sql/unsafe/notes`; Repeater → **Send** → 201.
2. In a second Repeater tab, `GET /api/sql/safe/products` → now 3 rows (the UPDATE worked).
3. Re-send the same body to `/api/sql/safe/notes` after `POST /api/lab/reset` → 201, then `GET /api/sql/safe/products` → still 2 rows; `GET /api/sql/safe/notes` shows the payload stored verbatim.

**Postman**

1. `POST http://127.0.0.1:3000/api/sql/unsafe/notes` with the payload → 201.
2. `GET .../api/sql/safe/products` → 3 rows.
3. `POST http://127.0.0.1:3000/api/lab/reset` (empty JSON body), then repeat step 1 against `/api/sql/safe/notes` → 201, products stay 2, notes list shows the literal payload.

**curl**

```bash
curl -s http://127.0.0.1:3000/api/sql/unsafe/notes \
  -H 'Content-Type: application/json' \
  -d '{"body":"lab'"'"', '"'"'public'"'"'); UPDATE products SET public = true; --"}'
curl -s http://127.0.0.1:3000/api/sql/safe/products   # 3 rows — stacked UPDATE ran

curl -s -X POST http://127.0.0.1:3000/api/lab/reset -H 'Content-Type: application/json' -d '{}'
curl -s http://127.0.0.1:3000/api/sql/safe/notes \
  -H 'Content-Type: application/json' \
  -d '{"body":"lab'"'"', '"'"'public'"'"'); UPDATE products SET public = true; --"}'
curl -s http://127.0.0.1:3000/api/sql/safe/products   # still 2 rows — payload stored as text
```

**Observation that proves exploitation:** product visibility changed (or a table dropped) through a note field (unsafe) vs the attack string stored verbatim with zero side effects (protected).

<a id="sql-003-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected (parameterized) | Protected (Zod + parameters) |
| --- | --- | --- | --- |
| Route | `POST /api/sql/unsafe/notes` | `POST /api/sql/safe/notes` | `POST /api/sql/zod/notes` |
| Source | `pages/api/sql/unsafe/notes.js` | `pages/api/sql/safe/notes.js` | `pages/api/sql/zod/notes.js` |
| Mechanism | `db.exec` with interpolation (multi-statement) | single-statement `db.query` with `($1, $2)` | `Note.safeParse(body)` then the same single-statement query |
| Same payload → | note stored **and** stacked UPDATE runs | note stored verbatim, nothing else executes | same, plus 400 for empty/oversized bodies |

**Why the controls work:** two independent properties. (1) Bound parameters keep the body out of SQL grammar. (2) `db.query` executes **one** statement, so even a hypothetical grammar escape could not chain a second — the unsafe route fails on both axes (`exec` + interpolation). Storing the attack string verbatim is the desired evidence: the *data* was never the problem.

<a id="sql-003-tests"></a>
### Automated tests

- `tests/unit/sql.test.mjs`: stacked mutation flips visibility only via unsafe; safe write stores the string literally; apostrophes round-trip; reset recovers after `DROP TABLE`.
- `tests/unit/zod.test.mjs`: zod write stores the payload verbatim with no product mutation; schema violations 400.
- `scripts/test-http.mjs` repeats the scenario end-to-end.
