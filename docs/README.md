# Zazzles vulnerability lab — training documentation

This directory is a **training course** on the lab's scenarios: what each flaw is, where it lives, what a SAST/SCA tool is expected to report, step-by-step exploitation with Burp Suite / Postman / curl, and the protected counterparts that handle the identical payload without executing it — plus *why* the protection works.

Scenario metadata is machine-readable in [`lib/catalog.json`](../lib/catalog.json); the scenario index page at `/vulnerabilities` renders it. Tests assert this documentation stays in sync with the catalog.

## Course modules

Suggested reading order — each module is self-contained:

| # | Module | Scenarios |
| --- | --- | --- |
| 1 | [javascript.md](vulnerabilities/javascript.md) | JS-001 browser eval · JS-002 server eval |
| 2 | [system.md](vulnerabilities/system.md) | OS-001 command execution · FS-001 file read |
| 3 | [sql.md](vulnerabilities/sql.md) | SQL-001 login bypass · SQL-002 search injection · SQL-003 stacked statements |
| 4 | [xss.md](vulnerabilities/xss.md) | XSS-001 reflected · XSS-002 stored (notes) · XSS-003 script-context · XSS-004 stored guestbook |
| 5 | [ssr.md](vulnerabilities/ssr.md) | SSRF-001 request forgery · REDIR-001 open redirect |
| 5b | [cookies.md](vulnerabilities/cookies.md) | COOKIE-001 to COOKIE-007 session cookie attributes, with tricky safe cases |
| 5c | [mongodb.md](vulnerabilities/mongodb.md) | MONGO-001 to MONGO-027 query injection with the native MongoDB driver, with tricky safe cases |
| 5d | [workshop.md](vulnerabilities/workshop.md) with its five family pages | MONGO-028 to MONGO-057, the second MongoDB batch under `pages/api/workshop/` with neutral names: the answer key plus per-scenario sections (sign-in, loans, parts, people, stats) |
| 6 | [react2shell.md](vulnerabilities/react2shell.md) | SCA-001 dependency vulnerability (CVE-2025-66478) |
| 6b | [dependencies.md](vulnerabilities/dependencies.md) | Vulnerable dependencies: installed now, and planned |
| 7 | [demonstrations.md](vulnerabilities/demonstrations.md) | DEMO-001/002 negative controls (no findings expected) |

Quick-reference table with agent links: [vulnerabilities/index.md](vulnerabilities/index.md).
The [prototype pollution](vulnerabilities/prototype-pollution.md) and
[unsafe deserialization](vulnerabilities/unsafe-deserialization.md) guides cover offline scanner fixtures.
Defense patterns used by every protected route: [validation-and-sanitization.md](validation-and-sanitization.md).
New to the vocabulary? Start with the [glossary](#glossary).

## Reference documents

| Document | Purpose |
| --- | --- |
| [architecture.md](architecture.md) | Workspace layout, runtime architecture, test layers |
| [setup-and-testing.md](setup-and-testing.md) | Install, run, and every test command with what it proves |
| [validation-and-sanitization.md](validation-and-sanitization.md) | The defense patterns behind the protected routes |
| [adding-scenarios.md](adding-scenarios.md) | Checklist for adding a new scenario |

<a id="anchor-contract"></a>
## How each module is structured (anchor contract)

Every module opens with a **Contents** table and every scenario has the same five linkable sections. The anchors are stable and follow one pattern, so agents and humans can deep-link without reading surrounding material:

| Section | Anchor | Audience / contents |
| --- | --- | --- |
| Scenario | `#<id>` | e.g. `#sql-001` — heading |
| Agent reference | `#<id>-agent` | **Compact block for agents/scanners**: source path(s), route, sink, flow, safe control path(s), test files, one-line expected finding. Self-contained — nothing else in the module is required |
| Student guide | `#<id>-student` | The flaw explained: mechanism, code excerpt, why it works |
| Exploit lab | `#<id>-exploit` | Reproduction with **Burp Suite, Postman, and curl** variants plus the observation that proves exploitation |
| Vuln vs protected | `#<id>-safe` | Side-by-side table of the vulnerable and protected routes — code difference, what the identical payload does on each — and **why** the control defeats the attack class |
| Tests | `#<id>-tests` | Automated coverage of both directions |

Agent URL pattern: `docs/vulnerabilities/<module>.md#<id>-agent` (IDs lowercased, e.g. `xss.md#xss-004-agent`).

All exploit steps are safe: harmless markers (`42`, `zazzles-*-marker`, computed arithmetic), synthetic data, loopback addresses only.

**Studying a scenario:** read the **Student guide**, run the **Exploit lab** with your tool of choice, send the identical payload to the protected route from the comparison table and watch the difference, then read **Vuln vs protected — and why** to internalize the property that separates them. The **Tests** section shows how the lab asserts both directions automatically on every push.

<a id="glossary"></a>
## Glossary (plain-language)

Terms used across the modules, defined once here; modules link or use them freely.

| Term | Meaning |
| --- | --- |
| SAST | *Static Application Security Testing* — a tool that reads source code and flags dangerous patterns |
| SCA | *Software Composition Analysis* — a tool that checks your dependency list against published vulnerability databases |
| CWE / CVE / GHSA | Dictionaries: weakness **types** (CWE-89 = SQL injection), publicly **disclosed vulnerabilities** (CVE numbers), and GitHub **advisory** IDs |
| source / sink / taint | The **source** is where attacker-controlled data enters; the **sink** is the dangerous operation it must not reach; the **taint path** is everything between them |
| payload | The input an attacker sends to trigger a flaw |
| marker | A harmless proof-of-execution value this lab uses (`42`, `zazzles-*-marker`) — if it appears, code ran |
| SSR | *Server-side rendering* — the server builds the finished HTML; the browser receives it ready-made |
| Pages Router / App Router | The two ways Next.js organizes an app. The main lab uses the older Pages Router; the React2Shell fixture uses the newer App Router |
| RSC / Server Action / flight protocol | App Router features: components and form-handler functions that **run on the server**, and the stream format React uses to ship their output to the browser |
| parameterized query / bound parameter | SQL sent with placeholders (`$1`) and the values traveling separately, so data can never be read as SQL code |
| stacked statements | More than one SQL statement executed in a single call |
| reflected vs stored XSS | *Reflected*: the payload comes back immediately in the same response. *Stored*: it is saved and runs for later visitors |
| innerHTML | The browser API that sets an element's content **as raw HTML** (the browser parses it) — unlike setting text, which never interprets markup |
| CSP | *Content-Security-Policy* — a response header the browser enforces, allowlisting what a page may load or execute |
| SSRF | *Server-side request forgery* — making the server fetch a URL of the attacker's choosing |
| open redirect | Sending visitors to an attacker-chosen destination through a link on your trusted site |
| scrypt | A deliberately slow, salted password-hashing function — verification is cheap for one password, expensive for mass guessing |
| allowlist vs blocklist | Permitting only known-good entries vs trying to enumerate every bad one; allowlists fail safer |
| PGlite | PostgreSQL compiled to WebAssembly, running inside the Node process — no database server, no persistence |
| operator injection | A request value that is an object such as `{ "$ne": "" }`, which a MongoDB query reads as an operator and not as a value |
| hydration | React attaching event behavior to server-rendered HTML once it reaches the browser |
| multipart body | A request-body format carrying multiple form fields (used for file uploads and Server Action posts) |
