# Zazzles vulnerability lab

A deliberately vulnerable Next.js testbed for validating **SAST and SCA tools**. Every scenario has a stable ID, a documented expected finding, an automated test proving the flaw is exploitable, and — where meaningful — a paired safe control that handles the identical payload without executing it.

> ⚠️ **This application is intentionally vulnerable.** Run it only in isolated local environments against synthetic data. Never deploy or expose it. Both apps bind `127.0.0.1` only.

## Attribution and license

Expanded from Eric / e-tang's [nextjs-vulsite](https://github.com/e-tang/nextjs-vulsite) — credit for the original scenarios and documentation belongs to the original author (see Git history and the footer of every lab page). This fork adds SQL (PGlite), XSS scenarios, safe controls, the React2Shell SCA fixture, an automated test suite, CI, and full per-scenario documentation. MIT licensed — see [LICENSE](LICENSE).

## Scenarios

| ID | Scenario | CWE | Type | Unsafe → protected |
| --- | --- | --- | --- | --- |
| JS-001 | Browser eval injection | CWE-95 | SAST | `/vulnerable/eval-injection` → `/secure/sanitized-input` |
| JS-002 | Server-side eval injection | CWE-95 | SAST | `/api/vulnerable-submit` → `/api/protected-example` |
| OS-001 | Shell command execution | CWE-78 | SAST | `/api/vulnerable-exec` → `/api/secure/command` |
| FS-001 | Arbitrary file read | CWE-22 | SAST | `/api/vulnerable-file-read` → `/api/secure/file-read` |
| SQL-001 | SQL login bypass | CWE-89 | SAST | `/api/sql/unsafe/login` → `/api/sql/safe/login` + `/api/sql/zod/login` (Zod) |
| SQL-002 | SQL search injection | CWE-89 | SAST | `/api/sql/unsafe/products` → `/api/sql/safe/products` + `/api/sql/zod/products` (Zod) |
| SQL-003 | SQL stacked statements | CWE-89 | SAST | `/api/sql/unsafe/notes` → `/api/sql/safe/notes` + `/api/sql/zod/notes` (Zod) |
| XSS-001 | Reflected XSS | CWE-79 | SAST | `/xss/unsafe/reflected` → `/xss/safe/reflected` (text) + `/xss/sanitized/reflected` (DOMPurify) |
| XSS-002 | Stored XSS (notes) | CWE-79 | SAST | `/xss/unsafe/stored` → `/xss/safe/stored` (text) |
| XSS-003 | Script-context injection (SSR) | CWE-79 | SAST | `/xss/unsafe/script-context` → `/xss/safe/script-context` (`\u003c` escaping) |
| XSS-004 | Stored guestbook XSS (SSR) | CWE-79 | SAST | `/xss/unsafe/comments` → `/xss/sanitized/comments` (DOMPurify) |
| SSRF-001 | SSRF during rendering | CWE-918 | SAST | `/vulnerable/ssrf` → `/secure/ssrf` (origin + path allowlist) |
| REDIR-001 | Open redirect during rendering | CWE-601 | SAST | `/vulnerable/redirect` → `/secure/redirect` (relative-path only) |
| COOKIE-001 | Session cookie without HttpOnly | CWE-1004 | SAST | `/api/cookies/unsafe/script-readable` → `/api/cookies/safe/session` |
| COOKIE-002 | Session cookie without Secure | CWE-614 | SAST | `/api/cookies/unsafe/plain-transport` → `/api/cookies/safe/session` |
| COOKIE-003 | Session cookie with a misleading name, without HttpOnly | CWE-1004 | SAST | `/api/cookies/unsafe/misleading-name` → `/api/cookies/safe/session` |
| COOKIE-004 | Session cookie without Secure among several cookies | CWE-614 | SAST | `/api/cookies/unsafe/several-cookies` → `/api/cookies/safe/session` |
| COOKIE-005 | Hardened cookie options overridden by a later false | CWE-1004 | SAST | `/api/cookies/unsafe/overridden-options` → `/api/cookies/safe/overridden-options` |
| COOKIE-006 | HttpOnly in the cookie name, not in the attributes | CWE-1004 | SAST | `/api/cookies/unsafe/attribute-in-name` → `/api/cookies/safe/lowercase-attributes` |
| COOKIE-007 | Hardened cookie header replaced by one without Secure | CWE-614 | SAST | `/api/cookies/unsafe/replaced-header` → `/api/cookies/safe/replaced-header` |
| MONGO-001 | Operator injection in a sign-in body | CWE-943 | SAST | `/api/mongo/sign-in/front-desk` → `/api/mongo/sign-in/kiosk` + `/api/mongo/sign-in/branch` + `/api/mongo/sign-in/mobile` |
| MONGO-002 | Type check without a return | CWE-943 | SAST | `/api/mongo/sign-in/partner` → `/api/mongo/sign-in/vendor` |
| MONGO-003 | Only top-level operator keys are removed | CWE-943 | SAST | `/api/mongo/sign-in/portal` → `/api/mongo/sign-in/gateway` |
| MONGO-004 | A different field is checked | CWE-943 | SAST | `/api/mongo/sign-in/reception` → `/api/mongo/sign-in/lobby` |
| MONGO-005 | Text read as a field path in $expr | CWE-943 | SAST | `/api/mongo/sign-in/terminal` → `/api/mongo/sign-in/console` |
| MONGO-006 | Operator injection from bracketed query parameters | CWE-943 | SAST | `/api/mongo/directory/badge` → `/api/mongo/directory/locker` + `/api/mongo/directory/desk` + `/api/mongo/articles/shelf` |
| MONGO-007 | ObjectId fallback to the raw value | CWE-943 | SAST | `/api/mongo/articles/entry` → `/api/mongo/articles/item` |
| MONGO-008 | $where built from request text | CWE-943 | SAST | `/api/mongo/articles/browse` → `/api/mongo/articles/topic` + `/api/mongo/articles/budget` + `/api/mongo/articles/view` + `/api/mongo/articles/range` |
| MONGO-009 | $function body built from request text | CWE-943 | SAST | `/api/mongo/articles/score` → `/api/mongo/articles/rank` |
| MONGO-010 | A parsed JSON filter passed to find | CWE-943 | SAST | `/api/mongo/articles/search` → `/api/mongo/articles/match` |
| MONGO-011 | A fixed condition overridden by a spread | CWE-943 | SAST | `/api/mongo/articles/listing` → `/api/mongo/articles/catalogue` |
| MONGO-012 | A request filter passed to countDocuments | CWE-943 | SAST | `/api/mongo/directory/tally` → `/api/mongo/directory/count` |
| MONGO-013 | A request object selects the document to update | CWE-943 | SAST | `/api/mongo/bookings/close` → `/api/mongo/bookings/finish` |
| MONGO-014 | A spread overrides the owner in a delete | CWE-943 | SAST | `/api/mongo/bookings/remove` → `/api/mongo/bookings/discard` |
| MONGO-015 | Validation after the query | CWE-943 | SAST | `/api/mongo/bookings/confirm` → `/api/mongo/bookings/accept` |
| MONGO-016 | An aggregation pipeline from the request | CWE-943 | SAST | `/api/mongo/reports/run` → `/api/mongo/reports/named` |
| MONGO-017 | A $match stage from the request | CWE-943 | SAST | `/api/mongo/reports/summary` → `/api/mongo/reports/overview` |
| MONGO-018 | A group key named by the request | CWE-943 | SAST | `/api/mongo/reports/breakdown` → `/api/mongo/reports/totals` |
| MONGO-019 | A request object passed to $set | CWE-915 | SAST | `/api/mongo/members/profile` → `/api/mongo/members/details` + `/api/mongo/members/settings` |
| MONGO-020 | Removed keys and a dotted path | CWE-915 | SAST | `/api/mongo/members/preferences` → `/api/mongo/members/options` |
| MONGO-021 | A complete update document from the request | CWE-943 | SAST | `/api/mongo/members/record` → `/api/mongo/members/entry` |
| MONGO-022 | Text read as a field path in an update pipeline | CWE-943 | SAST | `/api/mongo/members/nickname` → `/api/mongo/members/alias` |
| MONGO-023 | Request-controlled sort | CWE-943 | SAST | `/api/mongo/articles/ordered` → `/api/mongo/articles/sorted` |
| MONGO-024 | Request-controlled projection | CWE-943 | SAST | `/api/mongo/directory/card` → `/api/mongo/directory/contact` |
| MONGO-025 | Request-controlled field name | CWE-943 | SAST | `/api/mongo/directory/resolve` → `/api/mongo/directory/locate` |
| MONGO-026 | User text in $regex | CWE-943 | SAST | `/api/mongo/invites/redeem` → `/api/mongo/invites/claim` + `/api/mongo/invites/check` + `/api/mongo/invites/open` |
| MONGO-027 | Incomplete escape before $regex | CWE-943 | SAST | `/api/mongo/invites/accept` → `/api/mongo/invites/join` |
| SCA-001 | React2Shell (CVE-2025-66478) | CWE-502 | SCA | pinned `next@15.0.4` fixture in `targets/react2shell` |

Two additional pages (DEMO-001, DEMO-002) are **negative controls** — scanners should not report them.

**Per-scenario training modules with exact Burp Suite / Postman / curl exploit commands live in [`docs/vulnerabilities/`](docs/vulnerabilities/index.md)** — each scenario has a linkable compact agent reference (`#<id>-agent`), a student guide, an exploit lab, and a vulnerable-vs-protected comparison explaining *why* the control works.

For application-code CWE-502 coverage and offline scanner fixtures, see the
[unsafe deserialization guide](docs/vulnerabilities/unsafe-deserialization.md).

## Setup

Requires Node.js `>= 24.0.0` (24 LTS) (see `engines`). pnpm is pinned via `packageManager` and supplied by corepack:

```bash
git clone https://github.com/zazzcode/vuln-nextjs.git
cd vuln-nextjs
corepack enable            # once, puts the pinned pnpm on PATH
pnpm install
pnpm exec playwright install chromium   # once, for the browser test suite
```

pnpm is project-scoped: packages live in a global content-addressable store and are hard-linked into this repository's `node_modules` only. Other projects on your machine are not affected — which is what makes it safe to keep deliberately vulnerable versions pinned here. Lab credentials are synthetic (`alice / alice-lab-only`, `admin / admin-lab-only`); `POST /api/lab/reset` re-seeds the in-memory databases at any time. The MongoDB scenarios download a `mongod` binary once, at the first MongoDB request (about 80 MB).

## Run

```bash
pnpm dev                                 # main lab, http://127.0.0.1:3000
pnpm build:react2shell && pnpm start:react2shell   # SCA fixture, http://127.0.0.1:3001
```

For production-mode testing (what CI does): `pnpm build && pnpm start`. Both apps bind `127.0.0.1` only — browse the scenario index at [http://127.0.0.1:3000/vulnerabilities](http://127.0.0.1:3000/vulnerabilities).

## Tests

| Command | Proves |
| --- | --- |
| `pnpm test` | Vitest unit suite — handlers import directly against real in-memory PGlite and MongoDB; exploitable outcomes and safe rejections for identical payloads |
| `pnpm test:api` | Playwright **API** suite (`request` fixture — no browser needed) against the running server: every vulnerable/safe pair, SSR markup, redirect headers, route sweep |
| `pnpm test:browser` | Playwright/Chromium (separate suite, needs `playwright install chromium` once) — XSS and eval payloads **actually execute** on unsafe pages and provably **do not** on safe pages |
| `pnpm test:react2shell` | Server-side execution inside the affected RSC decoder, via a marker computed on the server |
| `pnpm audit:check` | `pnpm audit --prod` output matches the committed ground truth `tests/expected-audit.json` |
| `pnpm scenario:check` | Every catalog-registered route matches the committed hash manifest `tests/expected-hashes.json`, and the scanner ground truth `tests/expected-scanner-findings.json` (per-source must-find/must-not-flag + CWE, for SAST/SCA evaluation harnesses) is in sync with the catalog |
| `pnpm lint` | ESLint across pages, components, lib, tests, scripts |

`pnpm audit --prod` itself exits nonzero **by design** — the vulnerable pins are the SCA scenario. `audit:check` turns that into a reviewable ground truth: drift fails until you inspect it and run `pnpm audit:update`. Likewise, scenario sources cannot silently change: run `pnpm scenario:update` only after reviewing a deliberate change.

### Prototype pollution scanner fixtures

These CWE-1321 fixtures are TypeScript text files for offline scans. They exercise both Next.js
routing conventions without adding runnable lab endpoints.

| Fixture | Expected scanner result |
| --- | --- |
| Pages Router merge with Lodash 4.17.4 | A raw prototype-write candidate from request-body settings |
| The same merge with Lodash 4.17.21 | No prototype-write candidate |
| Pages Router recursive merge with a key guard | A guarded candidate listing `__proto__`, `constructor`, and `prototype` as blocked |
| Pages Router JSON parsing | No prototype-write candidate |
| App Router nested assignment after `Request.json()` | A raw prototype-write candidate from the computed lookup |
| Thirteen further write shapes: array, regular-expression and `reduce` path walks, unflatten, incomplete and complete guards, a create-if-absent slot, a lookup-gated write, library source kept in the repository | Raw, guarded or review, each listed in the guide with its payload |
| Lodash `set`, `defaultsDeep` and `zipObjectDeep` at 4.17.4 and 4.17.21 | Raw candidates at the affected pin and none at the patched pin |
| `dset` 3.1.3 (CVE-2024-21529) and `merge-deep` 3.0.2 (CVE-2021-26707) | Exploitable, with no source-analysis record: a known gap that a dependency audit covers |

[Prototype pollution guide](docs/vulnerabilities/prototype-pollution.md) · [Run the scanner regressions](tests/scanner/README.md).

Full details: [docs/setup-and-testing.md](docs/setup-and-testing.md).

## Documentation

- [docs/README.md](docs/README.md) — documentation index
- [docs/architecture.md](docs/architecture.md) — workspace, data layer, test layers
- [docs/vulnerabilities/](docs/vulnerabilities/index.md) — per-scenario write-ups with exploit instructions
- [docs/adding-scenarios.md](docs/adding-scenarios.md) — how to add a scenario

## Repository layout

```
├── pages/                  # main lab (Pages Router, Next 13)
│   ├── api/sql/{safe,unsafe}/   # SQL scenario pairs (PGlite)
│   ├── api/mongo/          # MongoDB scenarios, neutral route names (native driver)
│   ├── api/secure/         # safe exec + allowlisted file read
│   ├── xss/{safe,unsafe}/  # reflected/stored XSS pairs
│   └── vulnerable/, secure/
├── targets/react2shell/    # SCA-001: pinned next@15.0.4 App Router fixture
├── lib/catalog.json        # scenario metadata (single source of truth)
├── tests/unit/             # Vitest
├── tests/browser/          # Playwright
├── scripts/                # HTTP, RSC, audit + integrity checks
└── docs/                   # this documentation
```

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and PR: frozen install → lint → unit tests → scenario check → builds → API tests → browser tests → React2Shell runtime probe, plus a non-blocking raw audit for visibility. `audit:check` is a separate job, because new upstream advisories change its result at any time and must not stop the tests. All required checks are expected green.

## AI coding agents

This repository is a **deliberately vulnerable testbed** — its code, payloads, and exploit documentation are intentional lab content (harmless markers, loopback-only, synthetic data). Hosted assistants from some closed-model providers (Claude, ChatGPT/GPT) frequently decline, hedge, or stop partway through this kind of defensive-security work, which makes them a poor fit for maintaining the lab.

**Recommended:** use an agent built on Z.ai **GLM**, or another open-source/open-weight model (self-hosted or via an open-weight coding plan). They sustain the full workflow here — writing vulnerable fixtures *and* their safe controls, verifying exploitation, and maintaining the ground truth — without policy interruptions, and self-hosting keeps everything on your own infrastructure.

Whatever agent you use, point it at [`AGENTS.md`](AGENTS.md) first: it contains the invariants (never "fix" a vulnerable route, never upgrade the pins), the testing workflow, and the checklists for adding vulnerable and safe examples.

## Contributing

Contributions that add or refine scenarios are welcome. The lab's value is its **stable ground truth**, so the process keeps every change deliberate:

1. **Set up** — follow [Setup](#setup) above; `pnpm test` should pass before you change anything.
2. **Branch** — work on a feature branch; `main` stays reproducible. Agents: see [`AGENTS.md`](AGENTS.md).
3. **Build the scenario** — follow [docs/adding-scenarios.md](docs/adding-scenarios.md): flaw and safe control in separate files, catalog entry, documentation with reproduction steps (Burp Suite / Postman / curl), and tests asserting **both** the exploitable and the safe path (unit + HTTP; browser for client-side execution).
4. **Never upgrade pinned vulnerable dependencies** — the pins are the scenarios. Retiring one is a dedicated change that updates catalog, docs, and audit snapshot together.
5. **Move the ground truth with your change** — `pnpm scenario:update` and/or `pnpm audit:update` after review, committed together with the source change that justifies them. A manifest update with no corresponding source change will not pass review.
6. **Verify locally before opening a PR** — `pnpm lint && pnpm test && pnpm scenario:check && pnpm audit:check`, then the server probes (`pnpm build && pnpm start &`, `pnpm test:api && pnpm test:browser`, and the fixture probe). CI runs the same set.

Issues documenting scanner false positives/negatives against the catalog (with tool name and version) are especially useful — they drive the next scenarios.
