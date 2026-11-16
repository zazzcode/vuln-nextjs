# Module: Cross-site scripting (CWE-79)

Four shapes of the same mistake — untrusted strings treated as markup. Each has protected counterparts that receive the **identical payload**: rendered as React text (no parsing at all) or sanitized with DOMPurify (when rich text is required). Browser tests execute every payload in a real browser on the unsafe pages and assert non-execution on the protected pages.

Payload shape note: markup inserted via `innerHTML` does not run `<script>` elements, but event-handler attributes fire normally — so the lab sample is an image error handler:

```html
<img src=x onerror="window.__zazzlesXss='…-marker'">
```

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [XSS-001 · Reflected](#xss-001) | [expected finding](#xss-001-agent) | [guide](#xss-001-student) | [Burp · Postman · curl](#xss-001-exploit) | [comparison](#xss-001-safe) | [tests](#xss-001-tests) |
| [XSS-002 · Stored (notes)](#xss-002) | [expected finding](#xss-002-agent) | [guide](#xss-002-student) | [Burp · Postman · curl](#xss-002-exploit) | [comparison](#xss-002-safe) | [tests](#xss-002-tests) |
| [XSS-003 · Script-context injection](#xss-003) | [expected finding](#xss-003-agent) | [guide](#xss-003-student) | [Burp · Postman · curl](#xss-003-exploit) | [comparison](#xss-003-safe) | [tests](#xss-003-tests) |
| [XSS-004 · Stored guestbook](#xss-004) | [expected finding](#xss-004-agent) | [guide](#xss-004-student) | [Burp · Postman · curl](#xss-004-exploit) | [comparison](#xss-004-safe) | [tests](#xss-004-tests) |

---

<a id="xss-001"></a>
## XSS-001 · Reflected XSS

<a id="xss-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/xss/unsafe/reflected.js` |
| Safe controls | `pages/xss/safe/reflected.js` (React text) · `pages/xss/sanitized/reflected.js` (DOMPurify) |
| Route | `/xss/{unsafe,safe,sanitized}/reflected?payload=…` |
| Sink | `dangerouslySetInnerHTML={{ __html: payload }}` |
| Flow | `query.payload` → `getServerSideProps` prop → raw HTML emission |
| Tests | `tests/browser/xss.browser.test.mjs`; `scripts/test-http.mjs` |

**Expected finding:** SAST reports unsafe raw-HTML rendering of user input (CWE-79). The markup ships in the SSR HTML and executes on load; the attack is carried entirely in the URL (link-shareable).

[Student guide](#xss-001-student) · [Exploit lab](#xss-001-exploit) · [Vuln vs protected](#xss-001-safe) · [Tests](#xss-001-tests)

<a id="xss-001-student"></a>
### Student guide

```jsx
<div id="xss-output" dangerouslySetInnerHTML={{ __html: payload }} />
```

`dangerouslySetInnerHTML` opts the element out of React's escaping — the string is parsed as HTML by the browser. Anything the visitor's session can do, the payload's author can do, from a single URL.

<a id="xss-001-exploit"></a>
### Exploit lab

Payload (URL-encoded below): `<img src=x onerror="window.__zazzlesXss='reflected-marker'">`

**Burp Suite**

1. In Burp's embedded browser open `http://127.0.0.1:3000/xss/unsafe/reflected?payload=%3Cimg%20src%3Dx%20onerror%3D%22window.__zazzlesXss%3D%27reflected-marker%27%22%3E`.
2. Open the browser DevTools console (right-click → Inspect): `window.__zazzlesXss` → `'reflected-marker'` — the handler executed.
3. In Proxy history, inspect the response HTML: the `<img …onerror…>` is served **unescaped** inside `#xss-output`. Repeat on `/xss/safe/reflected`: same request, response shows `&lt;img` and the console stays undefined.

**Postman**

1. `GET` the same URL → the response body contains raw `<img src=x onerror=` markup (find it in the response search).
2. Same URL on `/xss/safe/reflected` → `&lt;img src=x` — escaped. Postman shows the *markup difference*; execution proof needs a browser (step 2 above).

**curl**

```bash
curl -s 'http://127.0.0.1:3000/xss/unsafe/reflected?payload=%3Cimg%20src%3Dx%20onerror%3D%22window.__zazzlesXss%3D%27reflected-marker%27%22%3E' \
  | grep -o '<div id="xss-output"[^>]*>.*</div>' | head -c 200
# raw <img ...> markup

curl -s 'http://127.0.0.1:3000/xss/safe/reflected?payload=%3Cimg%20src%3Dx%20onerror%3D%22window.__zazzlesXss%3D%27reflected-marker%27%22%3E' \
  | grep -c '&lt;img'
# 1 — escaped
```

**Observation that proves exploitation:** `window.__zazzlesXss === 'reflected-marker'` in a browser (unsafe) vs undefined with the payload visible as text (safe).

<a id="xss-001-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected (text) | Protected (sanitized) |
| --- | --- | --- | --- |
| Route | `/xss/unsafe/reflected` | `/xss/safe/reflected` | `/xss/sanitized/reflected` |
| Source | `pages/xss/unsafe/reflected.js` | `pages/xss/safe/reflected.js` | `pages/xss/sanitized/reflected.js` |
| Mechanism | `dangerouslySetInnerHTML={{ __html: payload }}` | `<div>{payload}</div>` | `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(payload) }}` |
| Same payload → | handler executes | payload displayed as text | handler stripped; benign tags kept |

**Why the controls work:** the text control never lets the browser parse untrusted data as markup — React escapes text nodes, so no sanitizer is needed and nothing can execute. The sanitized control is for pages that must render rich text: DOMPurify parses the markup in a hardened context and re-serializes only allowlisted tags/attributes, so `<img src=x>` survives but `onerror` cannot. **SAST ground-truth nuance:** the sanitized page still contains the raw `dangerouslySetInnerHTML` sink — it is safe *by construction* (sanitizer directly upstream), a pattern many tools report differently from the unsanitized sink.

<a id="xss-001-tests"></a>
### Automated tests

- `tests/browser/xss.browser.test.mjs`: marker executes on unsafe; stays undefined with visible text on safe; undefined on sanitized.
- `scripts/test-http.mjs`: SSR HTML contains raw markup (unsafe) vs `&lt;` escaped (safe).

---

<a id="xss-002"></a>
## XSS-002 · Stored XSS (notes)

<a id="xss-002-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/xss/unsafe/stored.js` |
| Safe control | `pages/xss/safe/stored.js` |
| Route | `/xss/{unsafe,safe}/stored` |
| Sink | `dangerouslySetInnerHTML` per note body, client-fetched list |
| Flow | note `body` → parameterized INSERT → `GET /api/sql/safe/notes` → raw HTML per note |
| Tests | `tests/browser/xss.browser.test.mjs`; `scripts/test-http.mjs` |

**Expected finding:** SAST reports unsafe raw-HTML rendering of stored data (CWE-79) — executes for every visitor of the list (second-order XSS).

[Student guide](#xss-002-student) · [Exploit lab](#xss-002-exploit) · [Vuln vs protected](#xss-002-safe) · [Tests](#xss-002-tests)

<a id="xss-002-student"></a>
### Student guide

Storage is **not** the flaw — notes are written through the parameterized endpoint from SQL-003. Rendering is: each stored body is emitted as raw HTML, so a payload saved once executes for every visitor who loads the list. The list is fetched client-side here; see XSS-004 for the fully server-rendered variant.

<a id="xss-002-exploit"></a>
### Exploit lab

Payload: `<img src=x onerror="window.__zazzlesXss='stored-marker'">`

**Burp Suite**

1. In Repeater, `POST http://127.0.0.1:3000/api/sql/safe/notes` with `{"body":"<img src=x onerror=\"window.__zazzlesXss='stored-marker'\">"}` → 201 (stored safely — proof storage is orthogonal).
2. In the embedded browser open `/xss/unsafe/stored` → console shows `window.__zazzlesXss === 'stored-marker'`.
3. Open `/xss/safe/stored` → the payload is visible as literal text; marker undefined. Clean up with `POST /api/lab/reset`.

**Postman**

1. `POST .../api/sql/safe/notes` with the payload body → 201.
2. `GET http://127.0.0.1:3000/api/sql/safe/notes` shows the payload stored verbatim — then open the two page URLs in a browser for the execution difference.

**curl**

```bash
curl -s http://127.0.0.1:3000/api/sql/safe/notes \
  -H 'Content-Type: application/json' \
  -d '{"body":"<img src=x onerror=\"window.__zazzlesXss='"'"'stored-marker'"'"'\">"}'
# then browse /xss/unsafe/stored  → marker set
# and  /xss/safe/stored      → literal text, marker undefined
curl -s -X POST http://127.0.0.1:3000/api/lab/reset -H 'Content-Type: application/json' -d '{}'
```

**Observation that proves exploitation:** one stored payload executes for every page load (unsafe) vs inert text for every visitor (safe).

<a id="xss-002-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Route | `/xss/unsafe/stored` | `/xss/safe/stored` |
| Source | `pages/xss/unsafe/stored.js` | `pages/xss/safe/stored.js` |
| Storage (identical) | `POST /api/sql/safe/notes` (parameterized) | same |
| Rendering | `dangerouslySetInnerHTML={{ __html: note.body }}` | `<div>{note.body}</div>` |
| Same stored payload → | executes per visitor | displayed as text |

**Why the control works:** the storage layer was already safe; the fix is confined to the sink. Text rendering removes HTML parsing from the data path entirely — the stored string is *displayed*, never interpreted. If the product required rich text, the DOMPurify pattern from [XSS-004](#xss-004-safe) applies.

<a id="xss-002-tests"></a>
### Automated tests

- `tests/browser/xss.browser.test.mjs`: resets the lab, stores the payload through the real API, asserts marker execution (unsafe) and non-execution with visible text (safe).

---

<a id="xss-003"></a>
## XSS-003 · Script-context injection in server-rendered JSON

<a id="xss-003-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/xss/unsafe/script-context.js` |
| Safe control | `pages/xss/safe/script-context.js` |
| Route | `/xss/{unsafe,safe}/script-context?data=…` |
| Sink | `<script dangerouslySetInnerHTML>` fed by `JSON.stringify` |
| Flow | `query.data` → `JSON.stringify({ data })` → inline script element |
| Tests | `tests/browser/xss.browser.test.mjs`; `scripts/test-http.mjs` |

**Expected finding:** SAST reports unsafe inline-script construction (CWE-79). Distinct from XSS-001/002: the payload breaks out of a `<script>` *element* via the literal characters `</script>`, which JSON escaping does not neutralize.

[Student guide](#xss-003-student) · [Exploit lab](#xss-003-exploit) · [Vuln vs protected](#xss-003-safe) · [Tests](#xss-003-tests)

<a id="xss-003-student"></a>
### Student guide

```jsx
<script dangerouslySetInnerHTML={{ __html: `window.__labData = ${JSON.stringify({ data })};` }} />
```

`JSON.stringify` escapes quotes and newlines for JavaScript, but the HTML parser terminates a script element at the **first** `</script>` sequence regardless of JS string context. The payload `</script><img src=x onerror=…>` closes the element early; the rest is parsed as page markup and the handler executes.

Craft detail that bites in practice: `JSON.stringify` turns the payload's `"` into `\"`, and those backslashes travel into the broken-out markup — a double-quoted `onerror="…"` ends up containing `\"…\"` and throws a SyntaxError instead of executing. The working payload therefore uses **no double quotes at all**: a single-quoted attribute and a backtick string, both of which pass through JSON escaping untouched.

<a id="xss-003-exploit"></a>
### Exploit lab

Payload: `</script><img src=x onerror='window.__zazzlesXss=`script-marker`'>` (single-quoted attribute, backtick string — see the student guide for why)

**Burp Suite**

1. In the embedded browser open `http://127.0.0.1:3000/xss/unsafe/script-context?data=%3C%2Fscript%3E%3Cimg%20src%3Dx%20onerror%3D%27window.__zazzlesXss%3D%60script-marker%60%27%3E`.
2. Console: `window.__zazzlesXss` → `'script-marker'`; `window.__labData` is undefined (the script died mid-string).
3. Proxy history shows the response: `…window.__labData = {"data":"</script><img …` — the breakout is visible in the SSR HTML. The same URL on `/xss/safe/script-context` returns `\u003c/script>` in the script and the console keeps `__labData.data` equal to the raw payload.

**Postman**

1. `GET` `http://127.0.0.1:3000/xss/unsafe/script-context?data=%3C%2Fscript%3E%3Cimg%20src%3Dx%20onerror%3D%27window.__zazzlesXss%3D%60script-marker%60%27%3E` → response HTML contains `</script><img src=x onerror=` inside the inline script (search the body).
2. The same URL on `/xss/safe/script-context` → contains `\u003c/script>` and no breakout markup.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/xss/unsafe/script-context?data=%3C%2Fscript%3E%3Cimg%20src%3Dx%20onerror%3D%27window.__zazzlesXss%3D%60script-marker%60%27%3E' \
  | grep -o 'window.__labData = .*' | head -c 120
# {"data":"</script><img src=x onerror=…  ← raw breakout

curl -s 'http://127.0.0.1:3000/xss/safe/script-context?data=%3C%2Fscript%3E%3Cimg%20src%3Dx%20onerror%3D%27window.__zazzlesXss%3D%60script-marker%60%27%3E' \
  | grep -o 'window.__labData = .*' | head -c 120
# {"data":"\u003c/script>…  ← escaped, cannot terminate the element
```

**Observation that proves exploitation:** marker property set and `__labData` truncated (unsafe) vs full verbatim round-trip and no execution (safe).

<a id="xss-003-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Route | `/xss/unsafe/script-context` | `/xss/safe/script-context` |
| Source | `pages/xss/unsafe/script-context.js` | `pages/xss/safe/script-context.js` |
| Mechanism | `JSON.stringify(value)` pasted into `<script>` | `JSON.stringify(value).replace(/</g, '\\u003c')` (+ line separators) |
| Same payload → | element terminated; handler executes | payload survives as a JS string; `__labData.data` equals it verbatim |

**Why the control works:** the exploit needs the literal `</script>` byte sequence to reach the HTML parser. Escaping `<` as `\u003c` is transparent to JavaScript (identical string value after parsing) but removes every `<` from the emitted bytes, so the parser can never see a closing tag — while `JSON.parse`/evaluation still yields the original data. This is the standard fix for server data in inline scripts, alongside U+2028/2029 escaping for JS string literals.

<a id="xss-003-tests"></a>
### Automated tests

- `tests/browser/xss.browser.test.mjs`: breakout executes (unsafe); safe page keeps `__labData.data` verbatim with no execution.
- `scripts/test-http.mjs`: SSR HTML contains the raw breakout sequence (unsafe) vs `\u003c` escaping (safe).

---

<a id="xss-004"></a>
## XSS-004 · Stored XSS in the server-rendered guestbook

<a id="xss-004-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/xss/unsafe/comments.js` |
| Safe control | `pages/xss/sanitized/comments.js` |
| Route | `/xss/{unsafe,sanitized}/comments` |
| Storage | `pages/api/xss/comments.js` — parameterized INSERT, deliberately safe |
| Sink | `dangerouslySetInnerHTML` per comment body, **server-rendered** |
| Flow | comment `body` → parameterized INSERT → `getServerSideProps` query → raw HTML for every visitor |
| Tests | `tests/unit/comments.test.mjs`; `tests/browser/xss.browser.test.mjs`; `scripts/test-http.mjs` |

**Expected finding:** SAST reports unsafe raw-HTML rendering of stored data (CWE-79) in a fully server-rendered list — the classic guestbook shape: one stored payload, every visitor, visible even in `curl` output.

[Student guide](#xss-004-student) · [Exploit lab](#xss-004-exploit) · [Vuln vs protected](#xss-004-safe) · [Tests](#xss-004-tests)

<a id="xss-004-student"></a>
### Student guide

The comments are fetched in `getServerSideProps` and rendered into the SSR HTML, so the malicious markup is in the very first response bytes — no client fetch required. Storage uses a parameterized INSERT (`pages/api/xss/comments.js`), which isolates the flaw to rendering: the same rows flow into both pages; only the emission differs.

<a id="xss-004-exploit"></a>
### Exploit lab

Payload: `<img src=x onerror="window.__zazzlesXss='guestbook-marker'">`

**Burp Suite**

1. Repeater: `POST http://127.0.0.1:3000/api/xss/comments` with `{"author":"tester","body":"<img src=x onerror=\"window.__zazzlesXss='guestbook-marker'\">"}` → 201.
2. Embedded browser: `/xss/unsafe/comments` → console shows `'guestbook-marker'` — executed as part of the initial SSR response.
3. `/xss/sanitized/comments` → the comment shows `<img src="x">` (handler stripped), seeded `<b>benign markup</b>` still bold; marker undefined.
4. `POST /api/lab/reset` to restore the seed comments.

**Postman**

1. `POST .../api/xss/comments` with the payload → 201.
2. `GET http://127.0.0.1:3000/xss/unsafe/comments` → response HTML contains the raw `<img … onerror=…>` markup (server-rendered — no browser needed to *see* the injection).
3. `GET .../xss/sanitized/comments` → the same comment appears as `<img src="x">` without `onerror`.

**curl**

```bash
curl -s http://127.0.0.1:3000/api/xss/comments \
  -H 'Content-Type: application/json' \
  -d '{"author":"tester","body":"<img src=x onerror=\"window.__zazzlesXss='"'"'guestbook-marker'"'"'\">"}'

curl -s http://127.0.0.1:3000/xss/unsafe/comments | grep -o 'onerror=[^>]*' | head -2
# raw handler markup in the SSR HTML

curl -s http://127.0.0.1:3000/xss/sanitized/comments | grep -o '<div class="comment-body">[^<]*<img[^>]*>' | head -2
# <img src="x"> — sanitized, no handler

curl -s -X POST http://127.0.0.1:3000/api/lab/reset -H 'Content-Type: application/json' -d '{}'
```

**Observation that proves exploitation:** stored markup appears raw in the first response bytes and executes for every visitor (unsafe) vs sanitized emission with benign markup preserved (protected).

<a id="xss-004-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Route | `/xss/unsafe/comments` | `/xss/sanitized/comments` |
| Source | `pages/xss/unsafe/comments.js` | `pages/xss/sanitized/comments.js` |
| Storage (identical) | parameterized INSERT via `pages/api/xss/comments.js` | same |
| Rendering | `dangerouslySetInnerHTML={{ __html: comment.body }}` | `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }}` |
| Same stored payload → | executes for every visitor, present in SSR bytes | handler stripped; `<b>`/links survive |

**Why the control works:** a guestbook legitimately wants rich text, so the text-rendering fix from XSS-002 would change the product. DOMPurify draws the line *inside* HTML: the payload is parsed in an inert context and re-serialized from only allowlisted tags and attributes, so structure survives while executable content (handlers, scripts, `javascript:` URLs) cannot. The unsafe page differs by exactly one thing — no sanitizer between the stored row and the sink — which is the entire vulnerability.

<a id="xss-004-tests"></a>
### Automated tests

- `tests/unit/comments.test.mjs`: comments round-trip verbatim through the storage API; method/field validation.
- `tests/browser/xss.browser.test.mjs`: resets, stores the payload via the API, asserts execution on unsafe and non-execution with surviving benign markup on sanitized.
- `scripts/test-http.mjs`: SSR HTML raw vs sanitized markup for the identical stored comment.
