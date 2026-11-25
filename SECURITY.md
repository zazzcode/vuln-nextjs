# Security policy

## What this repository is

A **deliberately vulnerable** Next.js laboratory for testing SAST and SCA tools, with a documented expected-finding catalog. The vulnerabilities listed below are intentional features, shipped with tests that assert they remain exploitable and safe controls that assert identical payloads stay inert.

## Scope of intentional vulnerabilities

The authoritative list is [`lib/catalog.json`](lib/catalog.json), rendered at `/vulnerabilities` and documented per scenario in [`docs/vulnerabilities/`](docs/vulnerabilities/index.md):

- **Application flaws (SAST targets)** — eval injection (browser and server), shell command execution, arbitrary file read, SQL injection (login bypass, search disclosure, stacked statements), MongoDB query injection (operators, server-side JavaScript, filters, pipelines, updates, patterns), reflected and stored XSS, session cookie attributes. Each has a paired safe control.
- **Dependency vulnerability (SCA target)** — `targets/react2shell` pins `next@15.0.4` / React 19.0.0 for [CVE-2025-66478 / GHSA-9qr9-h5gf-34mp](https://nextjs.org/blog/CVE-2025-66478) (React flight protocol RCE, App Router only).

The **main app (Next.js 13, Pages Router) is not affected by CVE-2025-66478**; only the separate pinned fixture is, and it must stay pinned.

Two pages (`/vulnerable/header-injection`, `/vulnerable/dynamic-import`) are demonstrations with **no exploitable sink** — reports against them are scanner false positives.

## Operational constraints

- Run only on loopback (`127.0.0.1`) in isolated environments; both apps are configured to bind nothing else.
- All data is synthetic and in-memory (PGlite and a loopback `mongodb-memory-server`, no persistence, no external database service). Credentials like `admin-lab-only` exist only for the lab scenarios.
- `POST /api/lab/reset` is intentionally unauthenticated lab tooling.
- Exploit documentation uses harmless markers only (`42`, `zazzles-*-marker`, computed arithmetic).
- Never deploy, expose, or point these endpoints at real data or systems you do not own.

## Guarding the ground truth

So the lab's expected findings cannot silently drift:

- `pnpm scenario:check` — every catalog-registered route must exist and match the committed SHA-256 manifest (`tests/expected-hashes.json`).
- `pnpm audit:check` — `pnpm audit --prod --json` must match the committed snapshot (`tests/expected-audit.json`).

Both fail on drift and are re-snapshotted (`pnpm scenario:update` / `pnpm audit:update`) only after review, in the same change that justifies them. CI enforces this on every push and PR; the audit check is its own job, so a new upstream advisory never stops the tests.

## Reporting

- **Non-intentional vulnerabilities** (something exploitable that is not in the catalog, or a flaw in a *safe control*) — please open an issue or contact the maintainer privately; do not test beyond your own checkout.
- **Scanner behavior** — false positives/negatives against the catalog are useful issues; include the tool, version, and scenario ID.
- **Do not** open issues asking to upgrade the pinned vulnerable dependencies; retiring a scenario is a deliberate, documented change.
