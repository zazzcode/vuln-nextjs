# Module: Server-side rendering abuse (CWE-918, CWE-601)

These flaws live in `getServerSideProps` — the Pages Router function that runs **on the server before the page renders**. SSR is the feature that makes them possible: the page's own rendering step performs network requests and redirects with attacker-influenced parameters. (Vocabulary: see the [glossary](../README.md#glossary).)

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [SSRF-001 · Server-side request forgery](#ssrf-001) | [expected finding](#ssrf-001-agent) | [guide](#ssrf-001-student) | [Burp · Postman · curl](#ssrf-001-exploit) | [comparison](#ssrf-001-safe) | [tests](#ssrf-001-tests) |
| [REDIR-001 · Open redirect](#redir-001) | [expected finding](#redir-001-agent) | [guide](#redir-001-student) | [Burp · Postman · curl](#redir-001-exploit) | [comparison](#redir-001-safe) | [tests](#redir-001-tests) |

---

<a id="ssrf-001"></a>
## SSRF-001 · Server-side request forgery during rendering

<a id="ssrf-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/vulnerable/ssrf.js` |
| Safe control | `pages/secure/ssrf.js` |
| Route | `/vulnerable/ssrf?fetch=…` vs `/secure/ssrf?fetch=…` |
| Sink | `fetch(attacker-controlled absolute URL)` inside `getServerSideProps` |
| Flow | `query.fetch` → server-side `fetch` → response rendered into the page |
| Tests | `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports SSRF (CWE-918): the server fetches a caller-chosen absolute URL with its internal network position.

[Student guide](#ssrf-001-student) · [Exploit lab](#ssrf-001-exploit) · [Vuln vs protected](#ssrf-001-safe) · [Tests](#ssrf-001-tests)

<a id="ssrf-001-student"></a>
### Student guide

```js
const url = query.fetch; // any absolute http(s) URL
const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
const excerpt = (await response.text()).slice(0, 500); // rendered into the page
```

The visitor's browser never makes the request — the **server** does, from its own network position, which typically reaches loopback services, cloud metadata endpoints, and internal APIs a browser could never touch. The lab demonstrates this safely by pointing the page at its *own* internal API and showing the response body rendered back.

<a id="ssrf-001-exploit"></a>
### Exploit lab

Payload: `?fetch=http://127.0.0.1:3000/api/sql/safe/products` — the page returns the internal API's JSON (status, content-type, and body excerpt) it fetched for you.

**Burp Suite**

1. Embedded browser: `http://127.0.0.1:3000/vulnerable/ssrf?fetch=http%3A%2F%2F127.0.0.1%3A3000%2Fapi%2Fsql%2Fsafe%2Fproducts`.
2. The page shows `HTTP 200 application/json` and product rows the browser asked the *server* to fetch. (Try the fixture origin `http://127.0.0.1:3001/` — also reachable from the server, not from outside.)
3. `/secure/ssrf?fetch=http://127.0.0.1:3001/` → “Blocked by same-origin policy”; `/secure/ssrf?fetch=/api/sql/safe/products` → works.

**Postman**

1. `GET http://127.0.0.1:3000/vulnerable/ssrf?fetch=http%3A%2F%2F127.0.0.1%3A3000%2Fapi%2Fsql%2Fsafe%2Fproducts` → HTML response whose `<pre>` contains the internal JSON.
2. Same on `/secure/ssrf` with an absolute URL → blocked message; with the relative `/api/...` path → allowed.

**curl**

```bash
curl -s 'http://127.0.0.1:3000/vulnerable/ssrf?fetch=http%3A%2F%2F127.0.0.1%3A3000%2Fapi%2Fsql%2Fsafe%2Fproducts' \
  | grep -o 'Zazzles mug' | head -1
# internal API body rendered — the server fetched it

curl -s 'http://127.0.0.1:3000/secure/ssrf?fetch=http%3A%2F%2F127.0.0.1%3A3001%2F' \
  | grep -o 'Blocked by same-origin policy'
```

**Observation that proves exploitation:** internal-origin content (or a different origin's content) rendered through the page, fetched by the server (unsafe) vs origin+path policy rejection (safe).

<a id="ssrf-001-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Route | `/vulnerable/ssrf` | `/secure/ssrf` |
| Source | `pages/vulnerable/ssrf.js` | `pages/secure/ssrf.js` |
| Mechanism | `fetch(user-supplied absolute URL)` | `new URL(target, ownOrigin)` + origin equality + `/api/` path prefix, **before** any request |
| Arbitrary absolute URL → | fetched, body rendered | blocked — no request made |

**Why the control works:** the decision happens *before* the network call: the target is resolved against the request's own origin, then compared for origin equality (host+scheme+port) and path prefix. Absolute URLs, `//host` tricks, and redirects (`redirect: 'manual'`) cannot escape the comparison because `URL` parsing normalizes first. A real deployment would extend the allowlist to explicit partner origins — the property is *decide-then-fetch*, never fetch-then-check.

<a id="ssrf-001-tests"></a>
### Automated tests

- `tests/api/lab.api.test.mjs`: internal API content rendered via the vulnerable page; safe page allows `/api/…` and blocks other origins/absolute URLs.

---

<a id="redir-001"></a>
## REDIR-001 · Open redirect during rendering

<a id="redir-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/vulnerable/redirect.js` |
| Safe control | `pages/secure/redirect.js` |
| Route | `/vulnerable/redirect?to=…` vs `/secure/redirect?to=…` |
| Sink | `getServerSideProps` → `{ redirect: { destination: query.to } }` |
| Flow | `query.to` → 307/308 `Location` header, verbatim |
| Tests | `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports open redirect (CWE-601): the redirect destination is attacker-controlled, including absolute URLs on other origins.

[Student guide](#redir-001-student) · [Exploit lab](#redir-001-exploit) · [Vuln vs protected](#redir-001-safe) · [Tests](#redir-001-tests)

<a id="redir-001-student"></a>
### Student guide

```js
return { redirect: { destination: to, permanent: false } }; // to = query.to, verbatim
```

The redirect happens during SSR, before any page renders. Impact is trust-transfer, not direct RCE: phishing links that begin on your trusted host, OAuth/token flows that append secrets to a URL an attacker controls, and bypass of allowlist-based link validation downstream.

<a id="redir-001-exploit"></a>
### Exploit lab

Payloads: relative `?to=/sql/login` (benign) and absolute `?to=https://example.org/` (proves off-origin control — observe the `Location` header only; no request to the target is made).

**Burp Suite**

1. Embedded browser with Proxy → Intercept **off** first: visit `http://127.0.0.1:3000/vulnerable/redirect?to=https%3A%2F%2Fexample.org%2F` — the browser lands on example.org (don't click anything there; it's just proof).
2. Turn Intercept on and repeat: inspect the 307 response — `Location: https://example.org/` came verbatim from your query string.
3. `/secure/redirect?to=https%3A%2F%2Fexample.org%2F` → no redirect; the policy rejection renders instead. `/secure/redirect?to=%2Fsql%2Flogin` → 307 to `/sql/login`.

**Postman**

1. Settings → General → **Automatically follow redirects: OFF**.
2. `GET http://127.0.0.1:3000/vulnerable/redirect?to=https%3A%2F%2Fexample.org%2F` → 307 with `Location: https://example.org/`.
3. Same on `/secure/redirect` → 200 rejection page; relative `to=/sql/login` → 307 in-site.

**curl**

```bash
curl -s -o /dev/null -D - 'http://127.0.0.1:3000/vulnerable/redirect?to=https%3A%2F%2Fexample.org%2F' | grep -iE '^(HTTP|location)'
# HTTP/1.1 307 Temporary Redirect
# location: https://example.org/     ← attacker-controlled absolute URL

curl -s -o /dev/null -D - 'http://127.0.0.1:3000/secure/redirect?to=https%3A%2F%2Fexample.org%2F' | head -1
# HTTP/1.1 200 OK  ← rejected, no redirect
```

**Observation that proves exploitation:** an off-origin `Location` emitted verbatim (unsafe) vs rejection and in-site-only redirects (safe).

<a id="redir-001-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Route | `/vulnerable/redirect` | `/secure/redirect` |
| Source | `pages/vulnerable/redirect.js` | `pages/secure/redirect.js` |
| Mechanism | `destination: query.to` verbatim | `/^\/[^/]/` + no `scheme:` pattern → same-site relative paths only |
| `to=https://example.org/` → | 307 off-origin — **the exploit** | 200 rejection page |
| `to=//example.org/` → | Next itself normalizes to `/example.org/` (same-site) — not exploitable via this sink | rejected (`//` fails the pattern) |
| `to=/sql/login` → | 307 in-site | 307 in-site |

**Why the control works:** the destination must begin with `/` but not `//` and contain no URI scheme, so every way to name another origin fails — the browser can only ever be sent somewhere inside the application. The rejection renders a normal page rather than redirecting to a “safe” default, which would itself be a behavior oracle.

<a id="redir-001-tests"></a>
### Automated tests

- `tests/api/lab.api.test.mjs`: 307 + verbatim `Location` for absolute and protocol-relative targets on the vulnerable route; rejection and working in-site redirect on the protected route.
