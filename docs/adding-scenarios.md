# Adding a scenario

A scenario is one deliberate flaw plus everything that makes it testable. Follow this checklist so the catalog tests keep the lab consistent.

## Add a source-only scanner fixture

1. Store fixture source as text under `tests/scanner/fixtures/`. Use a project layout the test
   can copy into a temporary directory for the offline scanner.
2. Keep fixture-only dependency pins in the test. Assert the scanner evidence expected from an
   affected operation and its patched or guarded control.
3. Add a page under `docs/vulnerabilities/` with fixture paths, expected outcomes, and the test
   command. Link the page from the vulnerability index.

The [prototype pollution fixtures](vulnerabilities/prototype-pollution.md) show this workflow
for Pages Router and App Router source. The [export command](../tests/scanner/README.md#compare-scanners)
materializes the same cases for other scanners. The checklist below applies to runtime scenarios.

## 1. Assign a stable ID

Format `<CATEGORY>-<number>`: `JS-`, `OS-`, `FS-`, `SQL-`, `XSS-`, `SCA-`, `DEMO-`. IDs never change once shipped — external tool evaluations reference them.

## 2. Implement the flaw and its safe control

- Unsafe source and safe control live in separate files under the matching area (`pages/api/…`, `pages/xss/…`), following the existing pairs.
- The safe control must accept the **identical payload** and keep it data (parameterized SQL, `execFile` argument vectors, React text nodes, exact-string allowlists). Scope it to the flaw under test; do not present it as universally secure.
- Mark the sink with a comment naming the scenario: `// XSS-001 / CWE-79: …`.
- UI pages use `components/LabLayout` and `components/ApiConsole`, and cross-link the vulnerable/safe pair.
- Input validation (methods, types, lengths) belongs on **both** sides and must not neutralize the attack payload — the exploit must still work on the unsafe side.

## 3. Register it in the catalog

Add an entry to `lib/catalog.json`:

```json
{
  "id": "XSS-003",
  "title": "…",
  "status": "active",
  "scanner": "SAST",
  "cwe": "CWE-79",
  "route": "/xss/unsafe/…",
  "source": "pages/xss/unsafe/….js",
  "flow": "source → … → sink",
  "runtime": "browser | server",
  "documentation": "docs/vulnerabilities/xss.md",
  "expectedFinding": true,
  "safeControl": "pages/xss/safe/….js",
  "test": "tests/unit/….test.mjs; tests/api/lab.api.test.mjs"
}
```

The catalog test enforces: unique IDs/routes, all referenced files exist, `expectedFinding` matches `status`, documentation mentions the ID, and referenced test files exist. Explanatory pages with no sink are `status: "demonstration"`, `cwe: null`, `scanner: "none"`, `expectedFinding: false`.

## 4. Document it

Append a section to the category document in `docs/vulnerabilities/` (or create one and link it from `docs/README.md` and `docs/vulnerabilities/index.md`). Every section includes: flaw + data flow, expected finding, safe control, **reproduction/exploit instructions with exact commands**, and tests. Use harmless markers (`zazzles-*-marker`, arithmetic) only.

## 5. Test both directions

Every scenario needs positive *and* negative assertions:

- **Unit** (`tests/unit/*.test.mjs`): import handlers directly; assert the exploitable outcome on the unsafe side and inert handling of the same payload on the safe side.
- **HTTP** (`tests/api/lab.api.test.mjs`): repeat the pair against the running server; add page routes to the status sweep.
- **Browser** (only for runtime `browser`): extend `tests/browser/xss.browser.test.mjs` — assert a marker property is set on the unsafe page and provably unset on the safe page.

The Playwright coverage is **enforced by `tests/unit/catalog.test.mjs`**: an active SAST scenario whose runtime-appropriate suite is missing from its catalog `test` references (or no longer names the scenario ID) fails the unit suite and CI. A new vuln or safe route without its matching Playwright pair cannot land green.

## 6. Dependency scenarios (SCA)

Pin the vulnerable version exactly in the target package and keep the lockfile frozen. Detection is plain `pnpm audit --prod` (expected to report the pin and exit nonzero) — document the expected advisory ID and finding path in the scenario doc. Never upgrade a pinned vulnerable dependency; retire the scenario in a dedicated change instead.

## 7. Re-snapshot the ground truth

Scenario and audit snapshots exist so the lab's expected findings cannot drift silently:

```bash
corepack pnpm scenario:update   # after any reviewed change to a scenario source
                                # (refreshes tests/expected-hashes.json AND
                                #  tests/expected-scanner-findings.json)
corepack pnpm audit:update      # after any reviewed dependency change
```

Commit the updated manifests together with the source change that justifies them. `tests/expected-scanner-findings.json` is the per-source ground truth for scanner evaluations (must-find / must-not-flag + CWE); it is generated from the catalog, never hand-edited.

## 8. Verify locally, then open a PR

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm scenario:check && corepack pnpm audit:check
corepack pnpm build && corepack pnpm start &   # then:
corepack pnpm test:api && corepack pnpm test:browser
```

CI runs the same set. Feature branches for reviewed work; the lab's own CI must stay green.
