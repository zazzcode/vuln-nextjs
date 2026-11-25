# Module: Workshop parts (second MongoDB batch)

The parts routes of [the workshop batch](workshop.md) (MONGO-044 to MONGO-046). Techniques demonstrated: an operator key built from a request word, a `$unionWith` collection named by the request, and a `$`-key sanitizer that rebuilds objects but returns arrays unchanged.

The routes use the native `mongodb` driver against [mongodb-memory-server](https://www.npmjs.com/package/mongodb-memory-server) (MongoDB 8.2.6, loopback, synthetic data). The full answer key is in [workshop.md](workshop.md). Scope: injection only.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [MONGO-044 · A request-chosen top-level operator](#mongo-044) | [expected finding](#mongo-044-agent) | [guide](#mongo-044-student) | [Burp · Postman · curl](#mongo-044-exploit) | [comparison](#mongo-044-safe) | [tests](#mongo-044-tests) |
| [MONGO-045 · A request-chosen union collection](#mongo-045) | [expected finding](#mongo-045-agent) | [guide](#mongo-045-student) | [Burp · Postman · curl](#mongo-045-exploit) | [comparison](#mongo-045-safe) | [tests](#mongo-045-tests) |
| [MONGO-046 · A $-key filter that misses nested arrays](#mongo-046) | [expected finding](#mongo-046-agent) | [guide](#mongo-046-student) | [Burp · Postman · curl](#mongo-046-exploit) | [comparison](#mongo-046-safe) | [tests](#mongo-046-tests) |

## Safe cases and why they are tricky

| Safe source | Control for | Why it is safe | Wrong reasoning it catches |
| --- | --- | --- | --- |
| `pages/api/workshop/parts/blend.js` | MONGO-044 | The operator is one of two constants chosen by comparison and both clause shapes are fixed; the only request value inside is a string. | Reporting a computed operator key without reading the choice. |
| `pages/api/workshop/parts/overview.js` | MONGO-045 | The union stage is one of two constants; an unknown name falls back. | Reporting a `$unionWith` that depends on the request without reading the map. |
| `pages/api/workshop/parts/choose.js` | MONGO-046 | Every term is rebuilt as `{name: `${term?.name}`}`, so whatever survives the sanitizer is still reduced to text. | Reading the sanitizer as the only defence and missing the coercion — or the reverse. |

## Vulnerable cases that look safe

| Vulnerable source | What looks like a control | Why it is not |
| --- | --- | --- |
| `pages/api/workshop/parts/combine.js` (MONGO-044) | The two clause shapes are fixed and `bin` is coerced | The *operator key* is built as `` `$${mode}` `` from the request word, so `$nor` inverts both fixed conditions and matches the unlisted part. |
| `pages/api/workshop/parts/everything.js` (MONGO-045) | A `$unset` that strips `_id` and `supplier` | The unset trims the parts rows, but the `$unionWith` collection is the raw request word — union `people` and the whole collection joins the output, secrets included. |
| `pages/api/workshop/parts/select.js` (MONGO-046) | The same `tidy` helper the twin uses | `tidy` rebuilds objects but returns arrays as they are, so operator objects inside the `terms` array survive into `$and`. |

---

<a id="mongo-044"></a>
## MONGO-044 · A request-chosen top-level operator

<a id="mongo-044-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/parts/combine.js` |
| Safe control | `pages/api/workshop/parts/blend.js` |
| Route | `GET /api/workshop/parts/combine` vs `/api/workshop/parts/blend` |
| Flow | query `mode` → operator key built from the request word → `find` |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-044-student) · [Exploit lab](#mongo-044-exploit) · [Vuln vs protected](#mongo-044-safe) · [Tests](#mongo-044-tests)

<a id="mongo-044-student"></a>
### Student guide

The filter looks fixed: two built clauses, a stringified `bin`, a fixed `listed: true` elsewhere. But the operator key itself is `` `$${mode}` `` — the caller's word after a dollar. Choosing `nor` turns both conditions upside down: "not listed and not in bin A", which is exactly the row `listed: true` was meant to keep out. The twin chooses between `$or` and `$and` by comparison, so only those two operators can ever appear.

<a id="mongo-044-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same query to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/workshop/parts/combine?mode=nor&bin=A'
# parts include P-9 "Prototype jig" — the unlisted part

curl -s 'http://127.0.0.1:3000/api/workshop/parts/blend?mode=nor&bin=A'
# the $and form: only listed parts in bin A
```

**Observation that proves exploitation:** the response includes `P-9` `Prototype jig`, the part whose `listed: false` the ordinary query never returns.

<a id="mongo-044-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/parts/combine.js` | vulnerable | The operator key is built from the request word, so the caller picks any top-level operator; `$nor` inverts both fixed conditions. |
| `pages/api/workshop/parts/blend.js` | protected | The operator is one of two constants chosen by comparison and both clause shapes are fixed. |

The control is scoped to this flaw.

<a id="mongo-044-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-045"></a>
## MONGO-045 · A request-chosen union collection

<a id="mongo-045-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/parts/everything.js` |
| Safe control | `pages/api/workshop/parts/overview.js` |
| Route | `GET /api/workshop/parts/everything` vs `/api/workshop/parts/overview` |
| Flow | query `plus` → `$unionWith` coll name |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-045-student) · [Exploit lab](#mongo-045-exploit) · [Vuln vs protected](#mongo-045-safe) · [Tests](#mongo-045-tests)

<a id="mongo-045-student"></a>
### Student guide

`$unionWith` appends another collection's documents to the pipeline output. Here the collection name is the raw `plus` parameter, so one request unions `people` into the parts listing — and the `$unset` only trims `_id` and `supplier`, so the passcodes arrive whole. The twin picks the union stage from a constant `Map` by `has`, with a constant pipeline attached, so an unknown name falls back to the loans branch.

<a id="mongo-045-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same query to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/api/workshop/parts/everything?plus=people'
# rows include "admin-lab-only" — a passcode

curl -s 'http://127.0.0.1:3000/api/workshop/parts/overview?plus=people'
# the loans branch: only parts and loans in the rows
```

**Observation that proves exploitation:** the response contains `admin-lab-only`, a stored secret, read out of a parts listing.

<a id="mongo-045-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/parts/everything.js` | vulnerable | The union collection is request text, so the caller can append any collection of the database to the rows. |
| `pages/api/workshop/parts/overview.js` | protected | The union stage is one of two constants; an unknown name falls back. |

The control is scoped to this flaw.

<a id="mongo-045-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-046"></a>
## MONGO-046 · A $-key filter that misses nested arrays

<a id="mongo-046-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/parts/select.js` |
| Safe control | `pages/api/workshop/parts/choose.js` |
| Route | `POST /api/workshop/parts/select` vs `/api/workshop/parts/choose` |
| Flow | body `terms` → `tidy` returns arrays unchanged → raw elements into `$and` → `find` |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-046-student) · [Exploit lab](#mongo-046-exploit) · [Vuln vs protected](#mongo-046-safe) · [Tests](#mongo-046-tests)

<a id="mongo-046-student"></a>
### Student guide

`tidy` in `lib/workshop/shape.js` removes `$`-prefixed keys — but only while it is walking *objects*. An array is returned as it is, so an operator object that sits inside the request's `terms` array survives the sanitiser and is spread raw into `$and`. The proof is quiet but strict: a term `{"name":{"$ne":""}}` returns every listed part, which no text value can do. The same spot also accepts a slow pattern (CWE-1333), the flow of MONGO-026 in the first batch. The twin maps every term through a template string, so whatever survives is text.

<a id="mongo-046-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/parts/select -H 'Content-Type: application/json' \
  -d '{"terms":[{"name":{"$ne":""}}]}'
# every listed part — the operator matched, which no text value can do

curl -s -X POST http://127.0.0.1:3000/api/workshop/parts/choose -H 'Content-Type: application/json' \
  -d '{"terms":[{"name":{"$ne":""}}]}'
# no parts — the same value became the text "[object Object]"
```

**Observation that proves exploitation:** the sanitised-looking route returns *all* listed parts for one term; the coercing twin returns none for the identical input.

<a id="mongo-046-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/parts/select.js` | vulnerable | `tidy` rebuilds objects but returns arrays as they are, so operator objects inside the `terms` array survive into `$and`. |
| `pages/api/workshop/parts/choose.js` | protected | Every term is rebuilt as `{name: `${term?.name}`}`, so whatever survives `tidy` is still reduced to text. |

The control is scoped to this flaw.

<a id="mongo-046-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.
