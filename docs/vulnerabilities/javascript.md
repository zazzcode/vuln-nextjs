# Module: JavaScript injection (CWE-95)

Both scenarios feed user-controlled strings into `eval`. JS-001 executes in the visitor's browser; JS-002 executes in the server process. Neither is related to SCA-001 (React2Shell), which is a vulnerable *dependency*, not application code.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [JS-001 · Browser eval injection](#js-001) | [expected finding](#js-001-agent) | [guide](#js-001-student) | [Burp · Postman · curl](#js-001-exploit) | [comparison](#js-001-safe) | [tests](#js-001-tests) |
| [JS-002 · Server-side eval injection](#js-002) | [expected finding](#js-002-agent) | [guide](#js-002-student) | [Burp · Postman · curl](#js-002-exploit) | [comparison](#js-002-safe) | [tests](#js-002-tests) |

---

<a id="js-001"></a>
## JS-001 · Browser eval injection

<a id="js-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/vulnerable/eval-injection.js` |
| Route | `/vulnerable/eval-injection?input=…` |
| Sink | `eval()` inside `useEffect`, browser runtime |
| Flow | `query.input` → `getServerSideProps` prop → `eval` template string |
| Safe control | none in this module — see `/secure/sanitized-input` |
| Tests | `tests/browser/xss.browser.test.mjs` |

**Expected finding:** SAST reports unsafe `eval` of user-controlled input (CWE-95), browser-side code injection. SSR renders the code but does not run it.

[Student guide](#js-001-student) · [Exploit lab](#js-001-exploit) · [Vuln vs protected](#js-001-safe) · [Tests](#js-001-tests)

<a id="js-001-student"></a>
### Student guide

```js
useEffect(() => {
  eval(`setResult('${userInput}')`);
}, [userInput]);
```

The query parameter is interpolated into a string that is evaluated as JavaScript **in the visitor's browser**. Breaking out of the string context executes arbitrary client-side code — this is XSS with an extra step. It is *not* server-side RCE: the server only renders the page.

Working payload shape: the template wraps the input in quotes inside a `setResult('…')` call, so the breakout must close the string, evaluate an expression, and reopen the string: `' + (6 * 7) + '`. Classic `'); … //` examples don't parse here — always derive the payload from the actual template.

<a id="js-001-exploit"></a>
### Exploit lab

Prerequisite: main app running (`pnpm dev` or `pnpm start`), and the payload `' + (6 * 7) + '` (displays `42` when evaluated).

**Burp Suite**

1. Open Burp's embedded browser and visit `http://127.0.0.1:3000/vulnerable/eval-injection`.
2. With Proxy → Intercept on, edit the URL to add `?input=%27%20%2B%20(6%20*%207)%20%2B%20%27` and forward the request.
3. The page's **Result** box shows `42` — the input ran through `eval` in the browser. (The Proxy history also shows the payload traveling as plain query data; the execution happens client-side.)

**Postman**

1. `GET http://127.0.0.1:3000/vulnerable/eval-injection?input=%27%20%2B%20(6%20*%207)%20%2B%20%27` and Send.
2. The HTML response contains the payload embedded in the page bundle — Postman proves delivery, not execution. Copy the URL into a real browser to see `42`.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/vulnerable/eval-injection?input=%27%20%2B%20(6%20*%207)%20%2B%20%27' -o /dev/null -w '%{http_code}\n'
# then open the same URL in a browser: Result shows 42
```

**Observation that proves exploitation:** the evaluated result `42` appears in the page (browser console/Result box), not merely the payload text.

<a id="js-001-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Route | `/vulnerable/eval-injection` | `/secure/sanitized-input` |
| Source | `pages/vulnerable/eval-injection.js` | `pages/secure/sanitized-input.js` |
| Mechanism | `eval(template + user input)` | type/length checks → character whitelist → rendered as React text |
| Same payload → | `42` — code executed | payload displayed as (partial) text |

**Why the control works:** it removes the sink, not the input. No code path evaluates anything, so no breakout can exist; whitelisting only shrinks what can be displayed. Escaping-by-construction (React text nodes) means the browser never re-parses the data as markup.

<a id="js-001-tests"></a>
### Automated tests

- `tests/browser/xss.browser.test.mjs` loads the exploit URL in Chromium and asserts the page shows `42`.

---

<a id="js-002"></a>
## JS-002 · Server-side eval injection

<a id="js-002-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/vulnerable-submit.js` |
| Safe control | `pages/api/protected-example.js` |
| Endpoint | `POST /api/vulnerable-submit` |
| Sink | server-side `eval` of an object-literal template |
| Flow | JSON `name`/`message` → string interpolation → `eval` in Node |
| Tests | `tests/unit/eval.test.mjs`; `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports unsafe `eval` of request-body input (CWE-95) — RCE-grade because it executes in the server process.

[Student guide](#js-002-student) · [Exploit lab](#js-002-exploit) · [Vuln vs protected](#js-002-safe) · [Tests](#js-002-tests)

<a id="js-002-student"></a>
### Student guide

```js
const result = eval(`({
  name: '${name}',
  message: '${message}',
  ...
})`);
```

Both body fields are interpolated into an **object literal** (the `{ key: value }` syntax) that `eval` compiles and runs **in the server process**. Because the expression is an object literal, the breakout must respect that grammar — close the string, close nothing else, splice an expression, reopen the string: `' + (6 * 7) + '` in either field.

<a id="js-002-exploit"></a>
### Exploit lab

Payload: `{"name":"lab","message":"' + (6 * 7) + '"}` — success looks like `"message": "42"` in the response.

**Burp Suite**

1. Proxy → Intercept on; in the embedded browser open `/vulnerable/form-submission` and submit its console form once.
2. Send the captured `POST /api/vulnerable-submit` to Repeater.
3. In Repeater, replace the JSON body with the payload above and **Send**.
4. Response body contains `"message": "42"` — arithmetic ran server-side.

**Postman**

1. New request: method `POST`, URL `http://127.0.0.1:3000/api/vulnerable-submit`.
2. Headers: `Content-Type: application/json`. Body → raw → JSON, paste the payload. Send.
3. `"message": "42"` in the response proves server-side execution.

**curl**

```bash
curl -s http://127.0.0.1:3000/api/vulnerable-submit \
  -H 'Content-Type: application/json' \
  -d '{"name":"lab","message":"'"'"' + (6 * 7) + '"'"'"}'
```

**Observation that proves exploitation:** the response contains computed output (`42`), and the same request to `/api/protected-example` returns the payload as literal text.

<a id="js-002-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Route | `POST /api/vulnerable-submit` | `POST /api/protected-example` |
| Source | `pages/api/vulnerable-submit.js` | `pages/api/protected-example.js` |
| Mechanism | `eval` on a template containing both fields | type/length validation + character whitelist, response built as data |
| Same payload → | `"message": "42"` | digits `6 7` as literal text |

**Why the control works:** again the sink is gone — the handler composes a plain object, so there is nothing to break out of. The whitelist is defense-in-depth for display, not the security boundary; the boundary is *never evaluating untrusted input*.

<a id="js-002-tests"></a>
### Automated tests

- `tests/unit/eval.test.mjs`: unsafe handler returns `42`; safe handler returns the payload inert; method/type validation.
- `tests/api/lab.api.test.mjs` repeats both over HTTP.
