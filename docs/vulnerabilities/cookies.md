# Module: Session cookie attributes (CWE-1004, CWE-614)

A session cookie is a credential. `HttpOnly` keeps it from page script and `Secure` keeps it from plain HTTP. These scenarios ask a scanner two questions: **is this cookie a credential**, by how the server uses it, and **which attributes does the sent header really have**. Seven vulnerable routes are paired with eleven safe ones, and several safe routes are deliberately tricky, so a tool cannot pass by always reporting or never reporting.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [COOKIE-001 · Session cookie without HttpOnly](#cookie-001) | [expected finding](#cookie-001-agent) | [guide](#cookie-001-student) | [Burp · Postman · curl](#cookie-001-exploit) | [comparison](#cookie-001-safe) | [tests](#cookie-001-tests) |
| [COOKIE-002 · Session cookie without Secure](#cookie-002) | [expected finding](#cookie-002-agent) | [guide](#cookie-002-student) | [Burp · Postman · curl](#cookie-002-exploit) | [comparison](#cookie-002-safe) | [tests](#cookie-002-tests) |
| [COOKIE-003 · Session cookie with a misleading name, without HttpOnly](#cookie-003) | [expected finding](#cookie-003-agent) | [guide](#cookie-003-student) | [Burp · Postman · curl](#cookie-003-exploit) | [comparison](#cookie-003-safe) | [tests](#cookie-003-tests) |
| [COOKIE-004 · Session cookie without Secure among several cookies](#cookie-004) | [expected finding](#cookie-004-agent) | [guide](#cookie-004-student) | [Burp · Postman · curl](#cookie-004-exploit) | [comparison](#cookie-004-safe) | [tests](#cookie-004-tests) |
| [COOKIE-005 · Hardened cookie options overridden by a later false](#cookie-005) | [expected finding](#cookie-005-agent) | [guide](#cookie-005-student) | [Burp · Postman · curl](#cookie-005-exploit) | [comparison](#cookie-005-safe) | [tests](#cookie-005-tests) |
| [COOKIE-006 · HttpOnly in the cookie name, not in the attributes](#cookie-006) | [expected finding](#cookie-006-agent) | [guide](#cookie-006-student) | [Burp · Postman · curl](#cookie-006-exploit) | [comparison](#cookie-006-safe) | [tests](#cookie-006-tests) |
| [COOKIE-007 · Hardened cookie header replaced by one without Secure](#cookie-007) | [expected finding](#cookie-007-agent) | [guide](#cookie-007-student) | [Burp · Postman · curl](#cookie-007-exploit) | [comparison](#cookie-007-safe) | [tests](#cookie-007-tests) |

## Safe cases and why they are tricky

Scanners should report none of these for CWE-1004 or CWE-614.

| Safe source | Why it is safe | Wrong reasoning it catches |
| --- | --- | --- |
| `pages/api/cookies/safe/session.js` | Every attribute present. | — |
| `pages/api/cookies/safe/environment-secure.js` | `Secure` in every production build, absent only in plain-HTTP development. | Reporting any conditional `Secure` |
| `pages/api/cookies/safe/composed-attributes.js` | Attributes joined from a constant list. No single literal shows them all. | Reading only one string literal |
| `pages/api/cookies/safe/overridden-options.js` | `{ httpOnly: false, secure: false, ...HARDENED }`: the hardened options come last and win. | Reporting any `httpOnly: false` in the options |
| `pages/api/cookies/safe/replaced-header.js` | The weak header is written first and replaced before anything is sent. | Judging each `setHeader` call alone |
| `pages/api/cookies/safe/lowercase-attributes.js` | `httponly` and `secure` in lower case. Attribute names are case-insensitive. | Case-sensitive attribute search |
| `pages/api/cookies/safe/preference.js` | A theme. It is checked and can end the request, but identifies nobody. | Treating any checked cookie as a session |
| `pages/api/cookies/safe/csrf-token.js` | A double-submit token that page script must read. | Treating any random token cookie as a session |
| `pages/api/cookies/safe/sign-out.js` | Expires the cookie with an empty value. | Reporting a header that carries no credential |
| `pages/api/cookies/safe/session-named-preference.js` | Named `session_banner`, used for a dismissed banner. | Judging by the cookie name |
| `pages/api/cookies/safe/visitor-counter.js` | A random token looked up in a map, like a session, but it only counts anonymous page views. | Treating any server-side lookup as sign-in |

The vulnerable twins catch the opposite errors: COOKIE-003 judging by name, COOKIE-004 judging the call instead of each cookie, COOKIE-005 trusting a hardened constant, COOKIE-006 searching the text for `HttpOnly`, COOKIE-007 trusting the first header.

Shared code: `lib/sessions.cjs` (opaque tokens for synthetic users, in memory) and `lib/cookie-header.cjs` (serializer). Not covered: `cookies()` of the App Router, cookie libraries, session lifetime and fixation.

---

<a id="cookie-001"></a>
## COOKIE-001 · Session cookie without HttpOnly

<a id="cookie-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/cookies/unsafe/script-readable.js` |
| Safe control | `pages/api/cookies/safe/session.js` |
| Other safe cases | `pages/api/cookies/safe/composed-attributes.js`, `pages/api/cookies/safe/preference.js`, `pages/api/cookies/safe/csrf-token.js`, `pages/api/cookies/safe/visitor-counter.js`, `pages/api/cookies/safe/sign-out.js` |
| Route | `POST` and `GET /api/cookies/unsafe/script-readable` vs `/api/cookies/safe/session` |
| Sink | `Set-Cookie` for `lab_sid_readable` without `HttpOnly` |
| Flow | session token → Set-Cookie without HttpOnly → document.cookie |
| Tests | `tests/unit/cookies.test.mjs`, `tests/api/lab.api.test.mjs`, `tests/browser/cookies.browser.test.mjs` |

**Expected finding:** SAST reports CWE-1004: `lab_sid_readable` identifies the caller and is sent without `HttpOnly`.

[Student guide](#cookie-001-student) · [Exploit lab](#cookie-001-exploit) · [Vuln vs protected](#cookie-001-safe) · [Tests](#cookie-001-tests)

<a id="cookie-001-student"></a>
### Student guide

```js
res.setHeader('Set-Cookie', `lab_sid_readable=${token}; Path=/; Secure; SameSite=Lax`);
```

Page script, including script injected through any XSS flaw, reads the session token from `document.cookie`. `POST` signs in and sets the cookie. `GET` reads the same cookie to identify the caller, which is what makes it a session cookie.

<a id="cookie-001-exploit"></a>
### Exploit lab

Sign in with `alice` / `alice-lab-only` on both routes and compare the response headers.

**Burp Suite**: send the two `POST` requests below to Repeater and compare `Set-Cookie` in the responses.

**Postman**: `POST` the same JSON body to both routes and open the response's **Headers** tab.

**curl**

```bash
curl -si -X POST http://127.0.0.1:3000/api/cookies/unsafe/script-readable -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_readable='
# no HttpOnly attribute

curl -si -X POST http://127.0.0.1:3000/api/cookies/safe/session -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_safe='
# HttpOnly present
```

**Observation that proves exploitation:** `document.cookie` on the lab origin shows `lab_sid_readable=…` after the unsafe sign-in and nothing after the safe one.

<a id="cookie-001-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Source | `pages/api/cookies/unsafe/script-readable.js` | `pages/api/cookies/safe/session.js` |
| Cookie | `lab_sid_readable` | `lab_sid_safe` |
| `HttpOnly` | missing from the sent header | present in the sent header |

**Why the control works:** Every attribute present. The sign-in and the lookup are the same on both sides. The control is scoped to this flaw.

Other safe cases: `pages/api/cookies/safe/composed-attributes.js` (Attributes joined from a constant list. No single literal shows them all.); `pages/api/cookies/safe/preference.js` (A theme. It is checked and can end the request, but identifies nobody.); `pages/api/cookies/safe/csrf-token.js` (A double-submit token that page script must read.); `pages/api/cookies/safe/visitor-counter.js` (A random token looked up in a map, like a session, but it only counts anonymous page views.); `pages/api/cookies/safe/sign-out.js` (Expires the cookie with an empty value.)

<a id="cookie-001-tests"></a>
### Automated tests

- `tests/unit/cookies.test.mjs`: the cookie identifies the caller, the attribute is missing here and present on the control; the tricky safe cases.
- `tests/api/lab.api.test.mjs`: the same pair over HTTP against the production build.
- `tests/browser/cookies.browser.test.mjs`: page script reads this token and cannot read the control's.

---

<a id="cookie-002"></a>
## COOKIE-002 · Session cookie without Secure

<a id="cookie-002-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/cookies/unsafe/plain-transport.js` |
| Safe control | `pages/api/cookies/safe/session.js` |
| Other safe cases | `pages/api/cookies/safe/environment-secure.js`, `pages/api/cookies/safe/composed-attributes.js`, `pages/api/cookies/safe/sign-out.js` |
| Route | `POST` and `GET /api/cookies/unsafe/plain-transport` vs `/api/cookies/safe/session` |
| Sink | `Set-Cookie` for `lab_sid_plain` without `Secure` |
| Flow | session token → Set-Cookie without Secure → plain HTTP request |
| Tests | `tests/unit/cookies.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-614: `lab_sid_plain` identifies the caller and is sent without `Secure`.

[Student guide](#cookie-002-student) · [Exploit lab](#cookie-002-exploit) · [Vuln vs protected](#cookie-002-safe) · [Tests](#cookie-002-tests)

<a id="cookie-002-student"></a>
### Student guide

```js
res.setHeader('Set-Cookie', `lab_sid_plain=${token}; Path=/; HttpOnly; SameSite=Lax`);
```

A browser also sends the session token with an unencrypted request to this host, where the network can read it. `POST` signs in and sets the cookie. `GET` reads the same cookie to identify the caller, which is what makes it a session cookie.

<a id="cookie-002-exploit"></a>
### Exploit lab

Sign in with `alice` / `alice-lab-only` on both routes and compare the response headers.

**Burp Suite**: send the two `POST` requests below to Repeater and compare `Set-Cookie` in the responses.

**Postman**: `POST` the same JSON body to both routes and open the response's **Headers** tab.

**curl**

```bash
curl -si -X POST http://127.0.0.1:3000/api/cookies/unsafe/plain-transport -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_plain='
# no Secure attribute

curl -si -X POST http://127.0.0.1:3000/api/cookies/safe/session -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_safe='
# Secure present
```

**Observation that proves exploitation:** the unsafe `Set-Cookie` header has no `Secure` attribute, so nothing limits the cookie to HTTPS. The lab runs on loopback HTTP, so the evidence is the header.

<a id="cookie-002-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Source | `pages/api/cookies/unsafe/plain-transport.js` | `pages/api/cookies/safe/session.js` |
| Cookie | `lab_sid_plain` | `lab_sid_safe` |
| `Secure` | missing from the sent header | present in the sent header |

**Why the control works:** Every attribute present. The sign-in and the lookup are the same on both sides. The control is scoped to this flaw.

Other safe cases: `pages/api/cookies/safe/environment-secure.js` (`Secure` in every production build, absent only in plain-HTTP development.); `pages/api/cookies/safe/composed-attributes.js` (Attributes joined from a constant list. No single literal shows them all.); `pages/api/cookies/safe/sign-out.js` (Expires the cookie with an empty value.)

<a id="cookie-002-tests"></a>
### Automated tests

- `tests/unit/cookies.test.mjs`: the cookie identifies the caller, the attribute is missing here and present on the control; the tricky safe cases.
- `tests/api/lab.api.test.mjs`: the same pair over HTTP against the production build.

---

<a id="cookie-003"></a>
## COOKIE-003 · Session cookie with a misleading name, without HttpOnly

<a id="cookie-003-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/cookies/unsafe/misleading-name.js` |
| Safe control | `pages/api/cookies/safe/session.js` |
| Other safe cases | `pages/api/cookies/safe/session-named-preference.js`, `pages/api/cookies/safe/preference.js`, `pages/api/cookies/safe/csrf-token.js`, `pages/api/cookies/safe/visitor-counter.js` |
| Route | `POST` and `GET /api/cookies/unsafe/misleading-name` vs `/api/cookies/safe/session` |
| Sink | `Set-Cookie` for `ui_prefs` without `HttpOnly` |
| Flow | session token → ui_prefs cookie without HttpOnly → document.cookie |
| Tests | `tests/unit/cookies.test.mjs`, `tests/api/lab.api.test.mjs`, `tests/browser/cookies.browser.test.mjs` |

**Expected finding:** SAST reports CWE-1004: `ui_prefs` identifies the caller and is sent without `HttpOnly`.

[Student guide](#cookie-003-student) · [Exploit lab](#cookie-003-exploit) · [Vuln vs protected](#cookie-003-safe) · [Tests](#cookie-003-tests)

<a id="cookie-003-student"></a>
### Student guide

```js
res.setHeader('Set-Cookie', `ui_prefs=${token}; Path=/; Secure; SameSite=Lax`);
```

The name suggests a preference, but `findSession(req.cookies.ui_prefs)` identifies the caller. Use decides, not the name. `POST` signs in and sets the cookie. `GET` reads the same cookie to identify the caller, which is what makes it a session cookie.

<a id="cookie-003-exploit"></a>
### Exploit lab

Sign in with `alice` / `alice-lab-only` on both routes and compare the response headers.

**Burp Suite**: send the two `POST` requests below to Repeater and compare `Set-Cookie` in the responses.

**Postman**: `POST` the same JSON body to both routes and open the response's **Headers** tab.

**curl**

```bash
curl -si -X POST http://127.0.0.1:3000/api/cookies/unsafe/misleading-name -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: ui_prefs='
# no HttpOnly attribute

curl -si -X POST http://127.0.0.1:3000/api/cookies/safe/session -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_safe='
# HttpOnly present
```

**Observation that proves exploitation:** `document.cookie` on the lab origin shows `ui_prefs=…` after the unsafe sign-in and nothing after the safe one.

<a id="cookie-003-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Source | `pages/api/cookies/unsafe/misleading-name.js` | `pages/api/cookies/safe/session.js` |
| Cookie | `ui_prefs` | `lab_sid_safe` |
| `HttpOnly` | missing from the sent header | present in the sent header |

**Why the control works:** Every attribute present. The sign-in and the lookup are the same on both sides. The control is scoped to this flaw.

Other safe cases: `pages/api/cookies/safe/session-named-preference.js` (Named `session_banner`, used for a dismissed banner.); `pages/api/cookies/safe/preference.js` (A theme. It is checked and can end the request, but identifies nobody.); `pages/api/cookies/safe/csrf-token.js` (A double-submit token that page script must read.); `pages/api/cookies/safe/visitor-counter.js` (A random token looked up in a map, like a session, but it only counts anonymous page views.)

<a id="cookie-003-tests"></a>
### Automated tests

- `tests/unit/cookies.test.mjs`: the cookie identifies the caller, the attribute is missing here and present on the control; the tricky safe cases.
- `tests/api/lab.api.test.mjs`: the same pair over HTTP against the production build.
- `tests/browser/cookies.browser.test.mjs`: page script reads this token and cannot read the control's.

---

<a id="cookie-004"></a>
## COOKIE-004 · Session cookie without Secure among several cookies

<a id="cookie-004-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/cookies/unsafe/several-cookies.js` |
| Safe control | `pages/api/cookies/safe/session.js` |
| Other safe cases | `pages/api/cookies/safe/environment-secure.js` |
| Route | `POST` and `GET /api/cookies/unsafe/several-cookies` vs `/api/cookies/safe/session` |
| Sink | `Set-Cookie` for `lab_sid_multi` without `Secure` |
| Flow | session token → one entry of a Set-Cookie array without Secure |
| Tests | `tests/unit/cookies.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-614: `lab_sid_multi` identifies the caller and is sent without `Secure`.

[Student guide](#cookie-004-student) · [Exploit lab](#cookie-004-exploit) · [Vuln vs protected](#cookie-004-safe) · [Tests](#cookie-004-tests)

<a id="cookie-004-student"></a>
### Student guide

```js
res.setHeader('Set-Cookie', ['lab_theme=dark; …', `lab_sid_multi=${token}; Path=/; HttpOnly; SameSite=Lax`]);
```

One response sets two cookies. The theme cookie needs no flags. The session cookie beside it lacks `Secure`. `POST` signs in and sets the cookie. `GET` reads the same cookie to identify the caller, which is what makes it a session cookie.

<a id="cookie-004-exploit"></a>
### Exploit lab

Sign in with `alice` / `alice-lab-only` on both routes and compare the response headers.

**Burp Suite**: send the two `POST` requests below to Repeater and compare `Set-Cookie` in the responses.

**Postman**: `POST` the same JSON body to both routes and open the response's **Headers** tab.

**curl**

```bash
curl -si -X POST http://127.0.0.1:3000/api/cookies/unsafe/several-cookies -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_multi='
# no Secure attribute

curl -si -X POST http://127.0.0.1:3000/api/cookies/safe/session -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_safe='
# Secure present
```

**Observation that proves exploitation:** the unsafe `Set-Cookie` header has no `Secure` attribute, so nothing limits the cookie to HTTPS. The lab runs on loopback HTTP, so the evidence is the header.

<a id="cookie-004-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Source | `pages/api/cookies/unsafe/several-cookies.js` | `pages/api/cookies/safe/session.js` |
| Cookie | `lab_sid_multi` | `lab_sid_safe` |
| `Secure` | missing from the sent header | present in the sent header |

**Why the control works:** Every attribute present. The sign-in and the lookup are the same on both sides. The control is scoped to this flaw.

Other safe cases: `pages/api/cookies/safe/environment-secure.js` (`Secure` in every production build, absent only in plain-HTTP development.)

<a id="cookie-004-tests"></a>
### Automated tests

- `tests/unit/cookies.test.mjs`: the cookie identifies the caller, the attribute is missing here and present on the control; the tricky safe cases.
- `tests/api/lab.api.test.mjs`: the same pair over HTTP against the production build.

---

<a id="cookie-005"></a>
## COOKIE-005 · Hardened cookie options overridden by a later false

<a id="cookie-005-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/cookies/unsafe/overridden-options.js` |
| Safe control | `pages/api/cookies/safe/overridden-options.js` |
| Route | `POST` and `GET /api/cookies/unsafe/overridden-options` vs `/api/cookies/safe/overridden-options` |
| Sink | `Set-Cookie` for `lab_sid_order` without `HttpOnly` |
| Flow | session token → { ...hardened, httpOnly: false } → Set-Cookie without HttpOnly |
| Tests | `tests/unit/cookies.test.mjs`, `tests/api/lab.api.test.mjs`, `tests/browser/cookies.browser.test.mjs` |

**Expected finding:** SAST reports CWE-1004: `lab_sid_order` identifies the caller and is sent without `HttpOnly`.

[Student guide](#cookie-005-student) · [Exploit lab](#cookie-005-exploit) · [Vuln vs protected](#cookie-005-safe) · [Tests](#cookie-005-tests)

<a id="cookie-005-student"></a>
### Student guide

```js
cookieHeader('lab_sid_order', token, { ...HARDENED, httpOnly: false })
```

The hardened options are spread first, so the later `httpOnly: false` wins. `POST` signs in and sets the cookie. `GET` reads the same cookie to identify the caller, which is what makes it a session cookie.

<a id="cookie-005-exploit"></a>
### Exploit lab

Sign in with `alice` / `alice-lab-only` on both routes and compare the response headers.

**Burp Suite**: send the two `POST` requests below to Repeater and compare `Set-Cookie` in the responses.

**Postman**: `POST` the same JSON body to both routes and open the response's **Headers** tab.

**curl**

```bash
curl -si -X POST http://127.0.0.1:3000/api/cookies/unsafe/overridden-options -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_order='
# no HttpOnly attribute

curl -si -X POST http://127.0.0.1:3000/api/cookies/safe/overridden-options -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_order_safe='
# HttpOnly present
```

**Observation that proves exploitation:** `document.cookie` on the lab origin shows `lab_sid_order=…` after the unsafe sign-in and nothing after the safe one.

<a id="cookie-005-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Source | `pages/api/cookies/unsafe/overridden-options.js` | `pages/api/cookies/safe/overridden-options.js` |
| Cookie | `lab_sid_order` | `lab_sid_order_safe` |
| `HttpOnly` | missing from the sent header | present in the sent header |

**Why the control works:** `{ httpOnly: false, secure: false, ...HARDENED }`: the hardened options come last and win. The sign-in and the lookup are the same on both sides. The control is scoped to this flaw.

<a id="cookie-005-tests"></a>
### Automated tests

- `tests/unit/cookies.test.mjs`: the cookie identifies the caller, the attribute is missing here and present on the control; the tricky safe cases.
- `tests/api/lab.api.test.mjs`: the same pair over HTTP against the production build.
- `tests/browser/cookies.browser.test.mjs`: page script reads this token and cannot read the control's.

---

<a id="cookie-006"></a>
## COOKIE-006 · HttpOnly in the cookie name, not in the attributes

<a id="cookie-006-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/cookies/unsafe/attribute-in-name.js` |
| Safe control | `pages/api/cookies/safe/lowercase-attributes.js` |
| Route | `POST` and `GET /api/cookies/unsafe/attribute-in-name` vs `/api/cookies/safe/lowercase-attributes` |
| Sink | `Set-Cookie` for `lab_HttpOnly_sid` without `HttpOnly` |
| Flow | session token → lab_HttpOnly_sid cookie without the attribute → document.cookie |
| Tests | `tests/unit/cookies.test.mjs`, `tests/api/lab.api.test.mjs`, `tests/browser/cookies.browser.test.mjs` |

**Expected finding:** SAST reports CWE-1004: `lab_HttpOnly_sid` identifies the caller and is sent without `HttpOnly`.

[Student guide](#cookie-006-student) · [Exploit lab](#cookie-006-exploit) · [Vuln vs protected](#cookie-006-safe) · [Tests](#cookie-006-tests)

<a id="cookie-006-student"></a>
### Student guide

```js
res.setHeader('Set-Cookie', `lab_HttpOnly_sid=${token}; Path=/; Secure; SameSite=Lax`);
```

The word `HttpOnly` is in the cookie name. No attribute of that name is present. `POST` signs in and sets the cookie. `GET` reads the same cookie to identify the caller, which is what makes it a session cookie.

<a id="cookie-006-exploit"></a>
### Exploit lab

Sign in with `alice` / `alice-lab-only` on both routes and compare the response headers.

**Burp Suite**: send the two `POST` requests below to Repeater and compare `Set-Cookie` in the responses.

**Postman**: `POST` the same JSON body to both routes and open the response's **Headers** tab.

**curl**

```bash
curl -si -X POST http://127.0.0.1:3000/api/cookies/unsafe/attribute-in-name -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_HttpOnly_sid='
# no HttpOnly attribute

curl -si -X POST http://127.0.0.1:3000/api/cookies/safe/lowercase-attributes -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_lower='
# HttpOnly present
```

**Observation that proves exploitation:** `document.cookie` on the lab origin shows `lab_HttpOnly_sid=…` after the unsafe sign-in and nothing after the safe one.

<a id="cookie-006-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Source | `pages/api/cookies/unsafe/attribute-in-name.js` | `pages/api/cookies/safe/lowercase-attributes.js` |
| Cookie | `lab_HttpOnly_sid` | `lab_sid_lower` |
| `HttpOnly` | missing from the sent header | present in the sent header |

**Why the control works:** `httponly` and `secure` in lower case. Attribute names are case-insensitive. The sign-in and the lookup are the same on both sides. The control is scoped to this flaw.

<a id="cookie-006-tests"></a>
### Automated tests

- `tests/unit/cookies.test.mjs`: the cookie identifies the caller, the attribute is missing here and present on the control; the tricky safe cases.
- `tests/api/lab.api.test.mjs`: the same pair over HTTP against the production build.
- `tests/browser/cookies.browser.test.mjs`: page script reads this token and cannot read the control's.

---

<a id="cookie-007"></a>
## COOKIE-007 · Hardened cookie header replaced by one without Secure

<a id="cookie-007-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/cookies/unsafe/replaced-header.js` |
| Safe control | `pages/api/cookies/safe/replaced-header.js` |
| Route | `POST` and `GET /api/cookies/unsafe/replaced-header` vs `/api/cookies/safe/replaced-header` |
| Sink | `Set-Cookie` for `lab_sid_replaced` without `Secure` |
| Flow | session token → second setHeader replaces the first → Set-Cookie without Secure |
| Tests | `tests/unit/cookies.test.mjs`, `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports CWE-614: `lab_sid_replaced` identifies the caller and is sent without `Secure`.

[Student guide](#cookie-007-student) · [Exploit lab](#cookie-007-exploit) · [Vuln vs protected](#cookie-007-safe) · [Tests](#cookie-007-tests)

<a id="cookie-007-student"></a>
### Student guide

```js
res.setHeader('Set-Cookie', hardened);
res.setHeader('Set-Cookie', withoutSecure); // replaces it
```

`setHeader` replaces an earlier value. The hardened header is written first and never sent. `POST` signs in and sets the cookie. `GET` reads the same cookie to identify the caller, which is what makes it a session cookie.

<a id="cookie-007-exploit"></a>
### Exploit lab

Sign in with `alice` / `alice-lab-only` on both routes and compare the response headers.

**Burp Suite**: send the two `POST` requests below to Repeater and compare `Set-Cookie` in the responses.

**Postman**: `POST` the same JSON body to both routes and open the response's **Headers** tab.

**curl**

```bash
curl -si -X POST http://127.0.0.1:3000/api/cookies/unsafe/replaced-header -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_replaced='
# no Secure attribute

curl -si -X POST http://127.0.0.1:3000/api/cookies/safe/replaced-header -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice-lab-only"}' | grep -i '^set-cookie: lab_sid_final='
# Secure present
```

**Observation that proves exploitation:** the unsafe `Set-Cookie` header has no `Secure` attribute, so nothing limits the cookie to HTTPS. The lab runs on loopback HTTP, so the evidence is the header.

<a id="cookie-007-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Source | `pages/api/cookies/unsafe/replaced-header.js` | `pages/api/cookies/safe/replaced-header.js` |
| Cookie | `lab_sid_replaced` | `lab_sid_final` |
| `Secure` | missing from the sent header | present in the sent header |

**Why the control works:** The weak header is written first and replaced before anything is sent. The sign-in and the lookup are the same on both sides. The control is scoped to this flaw.

<a id="cookie-007-tests"></a>
### Automated tests

- `tests/unit/cookies.test.mjs`: the cookie identifies the caller, the attribute is missing here and present on the control; the tricky safe cases.
- `tests/api/lab.api.test.mjs`: the same pair over HTTP against the production build.
