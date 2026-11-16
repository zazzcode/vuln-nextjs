# Architecture

## Workspace layout

The repository is a pnpm workspace with two deliberately separate Next.js applications:

| Package | Path | Router | Next.js / React | Port | Role |
| --- | --- | --- | --- | --- | --- |
| `zazzles-vuln-lab` | repository root | Pages Router | 13.4.19 / 18.2.0 | 3000 | Main lab: application-level SAST scenarios and safe controls |
| `@zazzles/react2shell` | `targets/react2shell` | App Router (RSC) | 15.0.4 / 19.0.0 | 3001 | SCA-001: real dependency vulnerability (CVE-2025-66478) |

The main app stays on Next.js 13 / Pages Router because the original upstream scenarios were written for it; migrating them is unnecessary and would churn the very source locations the SAST tools are tested against. The React2Shell fixture must stay on the affected versions — **do not upgrade `targets/react2shell` dependencies**; the vulnerability pin is the scenario.

Both apps bind `127.0.0.1` only. The lab is for local, isolated testing.

## Data layer

- SQL scenarios use [PGlite](https://github.com/electric-sql/electric-pglite) (`@electric-sql/pglite`, WASM, in-process, **no persistence**, no database service).
- `lib/database.cjs` owns one global initialization promise per server process (survives dev reloads). Each test process gets its own instance.
- Seeded synthetic data: users `admin / admin-lab-only` and `alice / alice-lab-only`, two public products, one hidden `Internal prototype`, one note, and two guestbook comments.
- The `password_demo` plaintext column exists **only** so SQL-001's unsafe login can interpolate it; the safe login verifies a salted scrypt hash instead. This is a lab-only comparison, not production authentication. No sessions or cookies are created.
- `POST /api/lab/reset` drops and re-seeds all tables on the same instance. It is intentionally unauthenticated lab tooling.

`next.config.js` marks `@electric-sql/pglite` as a server webpack external so its WASM assets load from the installed package instead of being bundled.

## Catalog-driven UI

`lib/catalog.json` is the single source of truth for scenarios: stable IDs, source and safe-control paths, routes, data flow, expected finding, and test references. `/vulnerabilities` and the home page render it directly, and `tests/unit/catalog.test.mjs` enforces that every referenced file exists and that each documentation page covers its scenario IDs.

## Test layers

| Layer | Runner | Files | Proves |
| --- | --- | --- | --- |
| Unit (API handlers, real PGlite) | Vitest | `tests/unit/*.test.mjs` | Handlers import directly — no server, no VM transform. Exploitable outcomes (bypass, stacked SQL, shell execution) and safe-control outcomes for identical payloads |
| HTTP integration | Node | `scripts/test-http.mjs` | Running production server: full request/response cycles, SSR output of unsafe vs safe XSS rendering, all page routes |
| Browser execution | Playwright | `tests/browser/xss.browser.test.mjs` | XSS/eval payloads actually execute JavaScript in a real browser on unsafe pages, and provably do not execute on safe pages |
| SCA visibility | `pnpm audit --prod` | — (informational) | The raw audit reports the intentional vulnerable pins; its nonzero exit is the scenario working, so it never gates CI |
| Runtime RSC | Node | `scripts/test-react2shell.mjs` | The React2Shell fixture executes server-side arithmetic from a crafted RSC request (marker absent from the literal request) |
| Ground-truth snapshots | Node | `scripts/check-audit.mjs`, `scripts/check-scenarios.mjs` | The audit findings and the exact content of every catalog-registered route match committed manifests (`tests/expected-audit.json`, `tests/expected-hashes.json`, `tests/expected-scanner-findings.json`); drift fails until reviewed and re-snapshotted |
| Lint | ESLint | `pnpm lint` | Style and import health across pages, components, lib, tests, scripts |

## Upstream

Expanded from Eric / e-tang's [nextjs-vulsite](https://github.com/e-tang/nextjs-vulsite). The original deliberate flaws are preserved (with corrected documentation); SQL, XSS, safe controls, tests, and the React2Shell fixture were added by the Zazzles lab.
