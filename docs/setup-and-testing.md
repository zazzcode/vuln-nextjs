# Setup and testing

## Prerequisites

- Node.js `>= 22.13.0`
- pnpm `11.25.0` — the repository pins it via the `packageManager` field; corepack supplies it automatically:

```bash
corepack enable              # once, if corepack is not active
corepack pnpm --version      # → 11.25.0
```

Every command below is written as `corepack pnpm …`; substitute `pnpm` if it is already on your PATH at the pinned version.

> pnpm is isolated to this repository. It installs into a global content-addressable store and hard-links packages into this project's `node_modules`; other projects and package managers on your machine are not modified. That isolation is what makes it safe to keep deliberately vulnerable versions pinned here.

## Install

```bash
git clone https://github.com/zazzcode/vuln-nextjs.git
cd vuln-nextjs
corepack pnpm install
```

CI installs with `--frozen-lockfile`. Do not commit changes to `pnpm-lock.yaml` that upgrade the pinned vulnerable dependencies — the pins are the scenarios.

## Run the lab

Main app (Pages Router, port 3000):

```bash
corepack pnpm dev            # development
corepack pnpm build && corepack pnpm start   # production build
```

React2Shell fixture (App Router, port 3001):

```bash
corepack pnpm build:react2shell && corepack pnpm start:react2shell
```

Both bind `127.0.0.1` only. Browse the scenario index at `http://127.0.0.1:3000/vulnerabilities`.

## Tests

| Command | Requires | Proves |
| --- | --- | --- |
| `corepack pnpm test` | nothing (handlers load directly) | Vitest unit suite: SQL bypass/stacked-query exploitation and safe rejections, eval/server arithmetic, shell execution vs literal echo, allowlisted file reads, catalog/docs/path consistency |
| `corepack pnpm lint` | nothing | ESLint across pages, components, lib, tests, scripts |
| `corepack pnpm test:http` | built + started main app | End-to-end HTTP: all vulnerable/safe pairs, SSR raw vs escaped XSS markup, every page route |
| `corepack pnpm test:browser` | built main app (config auto-starts it) | Playwright/Chromium: XSS and eval payloads **execute** on unsafe pages and **do not execute** on safe pages |
| `corepack pnpm test:react2shell` | built + started fixture | Server-side execution inside the affected RSC decoder via a computed marker |
| `corepack pnpm audit:check` | install only | `pnpm audit --prod --json` output matches the committed snapshot `tests/expected-audit.json` — the SCA ground truth |
| `corepack pnpm audit:update` | install only | Re-snapshot the audit ground truth after reviewing a deliberate change |
| `corepack pnpm scenario:check` | install only | Every catalog-registered vulnerable/safe route exists and its content hash matches `tests/expected-hashes.json` — scenario sources cannot silently change |
| `corepack pnpm scenario:update` | install only | Re-snapshot the source hashes after a reviewed scenario change |
| `corepack pnpm audit:lab` | install only | Raw human-readable audit (expected nonzero exit) |

First browser-test run needs the Chromium binary:

```bash
corepack pnpm exec playwright install chromium
```

### Expect intentionally failing audits

`corepack pnpm audit --prod` reports the React2Shell advisory (and the other pinned versions) and exits nonzero — that is the SCA scenario working as designed. There is deliberately no strict assertion script; the audit itself is the detection surface for SCA tools. Never “fix” the audit by upgrading `targets/react2shell`.

## CI

`.github/workflows/ci.yml` runs the full matrix on every push and pull request: frozen install → lint → unit tests → builds → running-server HTTP probes → browser tests → React2Shell runtime probe, plus an informational (non-blocking) `pnpm audit --prod` so the intended findings stay visible. All required checks are expected green.

## Resetting state

`POST /api/lab/reset` (button on the SQL/XSS pages) drops and re-seeds every table on the in-memory PGlite instance, including recovery from stacked-query `DROP TABLE`. Each server process owns an independent database; restarting the server is also a reset.
