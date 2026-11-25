# Vulnerable dependencies (SCA)

This page lists the vulnerable packages that the lab installs now, and the packages that are planned. A dependency scanner must report the first list and must not report the second, because those packages are not installed.

## Installed now

[`tests/expected-audit.json`](../../tests/expected-audit.json) is the complete answer: 67 advisories (6 critical, 24 high, 30 moderate, 7 low). `pnpm audit:check` compares it with `pnpm audit --prod --json`. The table is a summary of that snapshot on 2026-11-25. One advisory can affect more than one version, so the rows add up to more than 67.

None of these versions may be upgraded or removed: each advisory is a finding a scanner must report. `pnpm audit:update` adds newly published advisories, and removes one only when it is retired by name (`pnpm audit:update --retire=<id>`).

| Package | Version | How it gets in | Advisories | Severity |
| --- | --- | --- | --- | --- |
| `next` | 13.4.19 | direct, main app | 39 | 4 critical, 14 high, 16 moderate, 5 low |
| `next` | 15.0.4 | direct, `targets/react2shell` | 42 | 5 critical, 12 high, 21 moderate, 4 low |
| `postcss` | 8.4.14 | through `next` 13.4.19 | 5 | 2 high, 3 moderate |
| `postcss` | 8.4.31 | through `next` 15.0.4 | 4 | 2 high, 2 moderate |
| `sharp` | 0.33.5 | through `next` 15.0.4 | 3 | 3 high |
| `zod` | 3.21.4 | through `next` 13.4.19 | 2 | 1 high, 1 moderate |

Only [SCA-001](react2shell.md#sca-001) is a documented scenario with a runtime test. The main app uses `zod` 4.6.7 directly, which has no advisory: a scanner that reports by package name alone is wrong. The snapshot covers production dependencies only, not development dependencies.

## Planned, not installed

Each case asks a scanner one question. The versions and advisories were checked against the npm advisory service on 2026-11-25. Every "control" version below has no advisory there. The packages belong in their own workspace package, `targets/dependencies`, with install scripts off and no server.

| Planned case | Vulnerable | Control | Advisory | Question for the scanner |
| --- | --- | --- | --- | --- |
| Direct and used | `ejs` 3.1.6 | 3.1.10 | GHSA-phwq-j96m-2c2q (critical) | Is a plain direct dependency found? |
| Direct and used | `jsonwebtoken` 8.5.1 | 9.0.2 | GHSA-8cf7-32gw-wr33 (high) | Is a library for sign-in tokens found? |
| Direct and used | `dset` 3.1.3 | 3.1.4 | GHSA-f6v4-cf5j-vf3w (high) | Is a small library found? Its source pattern is in the [prototype pollution fixtures](prototype-pollution.md). |
| Present, affected function not called | `lodash` 4.17.20 | 4.18.1 | GHSA-35jh-r3h4-6jhm (high) | Is the package reported, and is the call marked not reachable? |
| Transitive only | `mkdirp` 0.5.1, which needs `minimist` 0.0.8 | `mkdirp` 0.5.6 with `minimist` 1.2.8 | GHSA-xvch-5gv4-984h (critical) | Is a dependency of a clean package found, with its path? |
| Corrected by an override | `mkdirp` 0.5.1 with a pnpm override to `minimist` 1.2.8 | — | none after the override | Is the installed version used, and not the requested one? |
| Installed under another name | `template-engine` as an alias of `ejs` 3.1.6 | alias of 3.1.10 | GHSA-phwq-j96m-2c2q (critical) | Is the alias resolved to the real package? |
| Development only | `semver` 7.3.7 | 7.5.4 | GHSA-c2qf-rxjj-qqgw (high) | Is the dependency marked as development only? |
| Header disclosure on redirect | `node-fetch` 2.6.6 | 2.7.0 | GHSA-r683-j2x4-v87g (high) | Is a patch-level boundary (fixed in 2.6.7) right? |
| No corrected version | `node-serialize` 0.0.4 | none | GHSA-q4v7-4rhw-9hqm (critical) | Does the report say that no fix exists? |
| No corrected version, deprecated | `request` 2.88.2 | none | GHSA-p8p7-x288-28g6 (moderate) | Does the report say that no fix exists? |

Rules for this list:

- A package moves to "Installed now" only with its catalog entry, its documentation, its tests and the new audit snapshot in the same change.
- Never add a release that is malware. Vulnerable code is a scenario; malicious code is not.
- Packages with a constant flow of new advisories, such as `vm2`, `handlebars` and `axios`, are left out, because each new advisory changes the snapshot.
