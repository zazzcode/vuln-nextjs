# SCA-001 · React2Shell (CVE-2025-66478, CWE-502)

This is the lab's **dependency** vulnerability scenario: the flaw is in a pinned third-party runtime, not in application code the SAST tools inspect.

| Field | Value |
| --- | --- |
| Target package | `targets/react2shell` (`@zazzles/react2shell`) |
| Pinned versions | Next.js 15.0.4, React / React DOM 19.0.0 |
| Advisory | [GHSA-9qr9-h5gf-34mp](https://github.com/advisories/GHSA-9qr9-h5gf-34mp) · [Next.js blog CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478) |
| Severity / CWE | critical · CWE-502 |
| Affected configuration | App Router + React Server Components on affected Next.js 15/16 and certain 14.3 canaries |
| **Not** affected | Pages Router; Next.js 13.x (the main lab app is intentionally unaffected) |
| Expected finding | SCA: vulnerable `next` version in the dependency graph |

The main app's page `/vulnerable/rsc-server-action` explains the scenario and links to this fixture; it deliberately contains **no** exploitable code of its own.

## Why a separate fixture

The upstream application is Next.js 13 / Pages Router, which the advisory does not affect. Simulating the flaw with a hand-written `eval` would test nothing about dependency detection. So the workspace keeps a real, minimal App Router application pinned to an affected version — `pnpm audit` and SCA tools must find it in the graph, and a runtime probe must demonstrate server-side execution.

The fixture's application code is ordinary and benign (a plain Server Action that logs a truncated message). The vulnerability is entirely in the pinned RSC runtime.

## Detection (SCA)

```bash
corepack pnpm audit --prod
```

reports the finding (expected, nonzero exit):

```
targets__react2shell > next@15.0.4
GHSA-9qr9-h5gf-34mp · critical · RCE in React flight protocol
```

The raw audit is the detection method for this scenario — its nonzero exit is the expected, intended result. To make that checkable, the lab snapshots the audit ground truth:

```bash
pnpm audit:check     # pnpm audit --prod --json must match tests/expected-audit.json
pnpm audit:update    # re-snapshot after reviewing a deliberate change
```

Any drift — a changed pin, a newly published advisory, advisory metadata updates — fails `audit:check`. Review the difference, then re-snapshot deliberately. Never “fix” a drift by upgrading `targets/react2shell`.

## Runtime exploitation

Start the fixture (build once first):

```bash
corepack pnpm build:react2shell
corepack pnpm start:react2shell     # 127.0.0.1:3001
```

Run the probe:

```bash
corepack pnpm test:react2shell
# PASS: React2Shell server-side arithmetic execution demonstrated (/zazzles-rsc-<product>)
```

`scripts/test-react2shell.mjs` posts a multipart RSC payload that makes the server-side flight decoder evaluate arithmetic and surface the result in a redirect target. The marker (`a*b` of two random numbers) is computed **on the server** and never appears literally in the request bytes, so mere reflection of input cannot pass the assertion — only decoder execution can.

## Rules for this scenario

- **Never upgrade** `targets/react2shell` dependencies; the pin is the scenario.
- Keep the fixture minimal: no auth, no data, loopback binding only.
- If the runtime probe ever becomes flaky against this Next.js version, fix the probe — not the pin.
