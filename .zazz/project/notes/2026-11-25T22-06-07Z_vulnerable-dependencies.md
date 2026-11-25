# Vulnerable dependencies: what protects them

Date-time: 2026-11-25T22:06:07Z (17:06:07, UTC-5).

The SCA side of the lab is the dependency tree itself: the vulnerable packages are the findings the tools must report. The list is in [docs/vulnerabilities/dependencies.md](../../../docs/vulnerabilities/dependencies.md). The answer is `tests/expected-audit.json`: 67 advisories, 59 of them distinct, on 2026-11-25. They are `next` 13.4.19 and 15.0.4, with `postcss`, `sharp` and `zod` below them.

## What protects them

- **Exact pins.** Both `package.json` files name exact versions, and `saveExact` is on.
- **Nothing upgrades on its own.** The repository has no Dependabot or Renovate configuration, and Dependabot security updates are off.
- **The check.** `pnpm audit:check` fails CI when the audit drifts from the snapshot.
- **The update.** `pnpm audit:update` refuses to remove an advisory unless it is retired by name with `--retire=<id>`. It also refuses an audit that returned nothing.

## What was missing, and what changed

- The second invariant in [AGENTS.md](../../../AGENTS.md) named two pins, the `next` and React versions of the fixture and of the main app. It did not say that every advisory is a finding, and `postcss`, `sharp` and `zod` were not mentioned. The invariant now covers the whole snapshot.
- `pnpm audit:update` wrote whatever the audit returned. A fixed dependency, or an empty result from a registry failure, followed by a re-snapshot, would have removed findings from the answer key without a word. The update now names what it would remove and stops.

## How the guard was checked

The decision is `scripts/audit-snapshot.mjs`, tested in `tests/unit/audit-snapshot.test.mjs`. The script was also run end to end in a temporary copy, with a fake `pnpm` on the path:

| The audit returned | `pnpm audit:update` |
| --- | --- |
| One advisory missing | Refused. The snapshot is untouched and the advisory is named |
| One missing, `--retire` with a wrong ID | Refused |
| One missing, `--retire` with its ID | Allowed, and reports "Retired by name" |
| Nothing at all | Refused. All 67 are named |
| One new advisory | Allowed |

The snapshot's advisory IDs are numbers such as `1094729`. The refusal prints the ID to pass to `--retire`.

## Still open

`main` has no branch protection. CI turning red does not stop a change from landing. Requiring a pull request, and the `lab` and `audit` checks, for `main` would turn the audit check from an alarm into a gate. That is a repository setting, so it is the owner's decision.
