# Ground truth: committed snapshots

Date-time: 2026-11-25T21:55:02Z (16:55:02, UTC-5).

How the checks work is in [AGENTS.md](../../../AGENTS.md#ground-truth). This note records why they have that shape.

- Expected findings are compared against generated files that are committed: `tests/expected-audit.json`, `tests/expected-hashes.json` and `tests/expected-scanner-findings.json`. None of them is edited by hand.
- For the dependency audit, a script with one assertion per advisory was considered and rejected. `pnpm audit --prod` compared with a snapshot was preferred: the raw audit keeps the findings visible, the snapshot makes drift fail, and nothing has to be maintained by advisory ID.
- `tests/expected-scanner-findings.json` is the per-source ground truth for a scanner evaluation: for every scenario source and safe control, must-find or must-not-flag, with the CWE. `pnpm scenario:update` exports it from `lib/catalog.json`, so the catalog is the only place where a label is set.
- A change to a scenario source and the re-snapshot belong in one commit. A snapshot update with no source change is what a review rejects.

**Why it is done this way:** the vulnerable and safe routes must stay exactly as they were evaluated until a reviewed change says otherwise, and drift must fail instead of passing quietly.

**Before work reaches `main`:** the whole local matrix in [docs/setup-and-testing.md](../../../docs/setup-and-testing.md) passes, and the runtime probes run against a server started from the fresh build.

A new ground-truth need should follow the same pattern: a generated file and a comparison, not a new assertion script.
