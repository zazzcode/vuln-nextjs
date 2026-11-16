# JavaScript injection scenarios (CWE-95)

Both scenarios feed user-controlled strings into `eval`. JS-001 executes in the browser, JS-002 on the server. Neither is related to SCA-001 (React2Shell), which is a vulnerable *dependency*, not application code.

---

## JS-001 · Browser eval injection

| Field | Value |
| --- | --- |
| Source | `pages/vulnerable/eval-injection.js` |
| Route | `/vulnerable/eval-injection` |
| Data flow | `query.input` → `getServerSideProps` → `useEffect` → `eval` |
| Runtime | browser only (SSR renders the code, does not run it) |
| Expected finding | SAST: unsafe `eval` of user input, CWE-95 |

### The flaw

```js
useEffect(() => {
  eval(`setResult('${userInput}')`);
}, [userInput]);
```

The query parameter is interpolated into a string that is evaluated as JavaScript **in the visitor's browser**. Escaping the string context executes arbitrary client-side code (XSS). This is not server-side RCE.

### Exploit it

With the dev or production server running on `127.0.0.1:3000`, open:

```
http://127.0.0.1:3000/vulnerable/eval-injection?input=' + (6 * 7) + '
```

(URL-encode as `?input=%27%20%2B%20(6%20*%207)%20%2B%20%27` when pasting into tooling.)

The page's **Result** box shows `42` — the arithmetic ran inside `eval`. Any other expression executes the same way, in the browser session of whoever opens the link.

### Safe comparison

`/secure/sanitized-input` (`pages/secure/sanitized-input.js`) receives the same parameter, type- and length-checks it, strips characters outside a whitelist, and rejects dangerous patterns — then renders it without ever evaluating. The identical payload is displayed, not executed.

### Tests

- `tests/browser/xss.browser.test.mjs` loads the exploit URL in a real browser and asserts the evaluated result (`42`) appears on the page.

---

## JS-002 · Server-side eval injection

| Field | Value |
| --- | --- |
| Source | `pages/api/vulnerable-submit.js` |
| Safe control | `pages/api/protected-example.js` |
| Route / endpoint | `/vulnerable/form-submission` → `POST /api/vulnerable-submit` |
| Data flow | JSON `name`/`message` → string interpolation → server-side `eval` |
| Runtime | server (Node) |
| Expected finding | SAST: unsafe `eval` of request body, CWE-95 (RCE-grade) |

### The flaw

```js
const result = eval(`({
  name: '${name}',
  message: '${message}',
  timestamp: Date.now(),
  ...
})`);
```

Both body fields are interpolated into an object expression that `eval` compiles and runs **in the server process**. Note the payload shape: because the expression is an object literal, classic `'); payload //` examples are syntactically invalid here — the working breakout closes the string and the property, evaluates an expression, and reopens the string.

### Exploit it

```bash
curl -s http://127.0.0.1:3000/api/vulnerable-submit \
  -H 'Content-Type: application/json' \
  -d '{"name":"lab","message":"'"'"' + (6 * 7) + '"'"'"}'
```

Response contains `"message": "42"` — server-side arithmetic from request data. The UI page `/vulnerable/form-submission` sends the same payload via its console.

### Safe control

`POST /api/protected-example` (`pages/api/protected-example.js`) validates types and lengths, whitelists characters, and builds the response object **without any code evaluation**. Send the identical payload:

```bash
curl -s http://127.0.0.1:3000/api/protected-example \
  -H 'Content-Type: application/json' \
  -d '{"name":"lab","message":"'"'"' + (6 * 7) + '"'"'"}'
```

The message comes back containing the digits `6 7` as literal text — the expression never ran.

### Tests

- `tests/unit/eval.test.mjs`: unsafe handler returns `42` for the payload (execution); safe handler returns the payload as inert text with identical input; method/type validation on the safe handler.
- `scripts/test-http.mjs` repeats the positive case over HTTP.
