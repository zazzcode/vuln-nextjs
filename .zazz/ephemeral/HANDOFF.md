# Zazzles vuln-nextjs implementation handoff

Date: 2026-11-16. This is an **unfinished work-in-progress checkpoint**, requested by Michael so another model can continue. Do not treat the current app, tests, documentation, or React2Shell runtime as fully verified.

## Repository and authorization

- Working repository: `/Users/michael/Dev/zazzcode/vuln-nextjs` (moved from `/Users/michael/Dev/vuln-nextjs` at Michael's request).
- New GitHub origin: https://github.com/zazzcode/vuln-nextjs.git
- Original upstream: https://github.com/e-tang/nextjs-vulsite.git
- Original author: Eric / e-tang (`eric` in Git history). Preserve attribution in README and UI.
- Michael created the new repository with an MIT license, copyright 2026 Michael Woytowitz. Preserve that LICENSE and the original history/credit.
- Michael explicitly authorized committing and pushing this initial setup directly to `main`. Use feature branches for later reviewed work as appropriate.
- Latest instruction: stop feature work, write this handoff, commit and push **all work so far** so another model can continue.

## Product requirements from Michael

Build and maintain our own deliberately vulnerable Next.js lab for the Zazzles in-progress SAST and SCA tools; add scenarios over time.

1. Organize vulnerability documentation with a docs index, stable scenario IDs, source locations, expected findings, safe controls, reproduction steps, and tests. Earlier wording requested a `doc` directory; later wording says `docs`. Current catalog refers to `doc/...`; choose one consistently.
2. Add server-side, in-memory Postgres via PGlite: https://github.com/electric-sql/electric-pglite . Safe and unsafe SQL operations, especially login.
3. Keep **actual React2Shell**, not a simulated custom eval flaw, in the dependency graph and running app. An audit must detect it for SCA testing. User accepts intentional vulnerable dependencies.
4. Migrate npm to pnpm, committing a pnpm lockfile.
5. Use **Vitest** for automated tests and add **CI/CD verification**. Tests must confirm both exploitable vulnerable operations and safe handling of the same payloads.
6. Keep command injection examples; add explicit XSS examples and matching safe operations for SAST accuracy. Browser tests must actually execute XSS and prove safe controls do not execute it.
7. General code/docs cleanup and Zazzles branding, while crediting upstream.

## Original review findings

Original root app uses Next.js 13.4.19 + React 18.2.0, Pages Router. It had no SQL or MongoDB integration. Its README incorrectly claimed CVE-2025-66478.

Implemented original flaws:
- `/api/vulnerable-submit`: interpolates JSON name/message into server-side eval (JS-002). Typical documented `'); ... //` form payloads were syntactically invalid for the actual object expression; `message: "' + (6 * 7) + '"` returns `42` and proves injection.
- `/api/vulnerable-exec`: unrestricted shell command passed to child_process.exec (OS-001).
- `/api/vulnerable-file-read`: unrestricted fs.readFileSync path (FS-001).
- `/vulnerable/eval-injection`: eval inside useEffect, browser-only code injection/XSS (JS-001), NOT SSR RCE.
- Header page just reflects escaped text. No actual header/command/SQL injection sink.
- Dynamic import page used a missing components directory and did not establish arbitrary server filesystem access/RCE.
- Old curl suites usually asserted request delivery, not exploitation. Old RSC script targeted an API route that did not exist.

Official React2Shell advisory: https://nextjs.org/blog/CVE-2025-66478
- Affected: App Router + RSC in affected Next.js 15/16 and certain 14.3 canaries.
- Next.js 13.x and Pages Router are NOT affected.
- Current new dedicated fixture pins Next.js 15.0.4 and React/React DOM 19.0.0.

## Work implemented in this checkpoint

### pnpm workspace / real React2Shell fixture

- Root package renamed `zazzles-vuln-lab`, version 0.2.0.
- `packageManager: pnpm@11.25.0`, Node >=22.13.0; host used Node 24.21.0.
- Root still deliberately retains original Next.js 13.4.19 / React 18.2.0.
- Added `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.npmrc` save-exact, `.gitignore`, ESLint config.
- Removed npm package-lock.json.
- `targets/react2shell`: separate workspace package `@zazzles/react2shell`, Next 15.0.4 + React 19.0.0, App Router layout/page and ordinary Server Action. Port 3001, binds 127.0.0.1.
- Root main app runs on 127.0.0.1:3000; scripts for `dev:react2shell`, build/start variants.
- `scripts/test-react2shell.mjs` sends a multipart RSC payload derived from the original tmp/tmp.js. It attempts server-side arithmetic with a NEXT_REDIRECT marker. **Not run yet; may require correction.** It checks a computed marker absent from literal request text, so reflection alone cannot pass.
- New `/vulnerable/rsc-server-action` explains and links to real separate fixture.

### SQL implementation

- Pinned `@electric-sql/pglite` 0.5.16.
- `lib/database.cjs`: server-only in-memory instance, global initialization promise across dev reloads, seeding, reset, salted scrypt password hashes.
- Synthetic users: `admin / admin-lab-only`, `alice / alice-lab-only`.
- Intentional plaintext `password_demo` column ONLY for unsafe SQL login; safe login checks scrypt hash. Document this as a lab-only comparison, not production auth.
- Products: two public products and one hidden `Internal prototype`.
- Notes table with seeded note.
- Paired routes under `pages/api/sql/{safe,unsafe}/`:
  - `login.js`: SQL-001 unsafe username/password interpolation vs safe bound username plus hash check. No real session/cookie is created; it is a demo identity check.
  - `products.js`: SQL-002 unsafe ILIKE interpolation vs parameterized query. Injection reveals hidden product.
  - `notes.js`: SQL-003 unsafe `db.exec` allows stacked SQL vs safe bound INSERT.
- `/api/lab/reset` atomically drops/re-seeds tables on same instance, including recovery after a dropped table. Unauthenticated reset is intentional lab functionality.
- `lib/http.cjs`: methods, input types/lengths, no-store, generic safe errors vs disclosed unsafe SQL errors. Type checks do not neutralize injection strings.
- `next.config.js` adds a server webpack external for PGlite's WASM assets. **Next build/runtime integration not verified.**

### UI / catalog / cleanup

- `lib/catalog.json`: 8 active entries (JS-001/002, OS-001, FS-001, SQL-001/002/003, SCA-001), plus two explanatory demonstrations. Paths, runtime, flow, expected finding, safe control where present, test references.
- Shared `LabLayout` / `ApiConsole`, Zazzles branding and upstream footer credit.
- Rewritten home plus `/vulnerabilities` index.
- `/sql/[operation]` interactive safe/unsafe login/search/write pages, normal and injection sample buttons, SQL reset.
- Existing intentional eval/exec/read flaws preserved. Simplified pages with harmless marker samples; added file-read UI.
- Header and dynamic import routes now accurately labeled demonstrations. Broken import removed.
- Corrected some misleading CSP text; **secure pages still need broader cleanup** and common layout migration if desired.
- Removed unused style module and file-read path import.
- Replaced old curl suites with new HTTP probe and compatibility shell wrappers. Originals remain in Git history.
- Simplified setup.sh to pnpm.

## Tests and verification actually performed

- Ran `node --test tests/sql.test.cjs` in temporary staging checkout using real PGlite and the actual API handlers loaded through a small VM import adapter.
- **9 tests passed**, including concurrent DB init, valid/invalid login, username/password SQL bypass vs safe rejection, private product exposure vs safe query, stacked SQL mutation vs literal safe storage, apostrophes, reset/reseed after DROP, methods/types/limits.
- Existing eval API injection verified with harmless arithmetic.
- Existing exec and file-read handler forwarding verified previously with stubs (no sensitive files/commands).
- Registry `pnpm audit --prod --json` was run and **reported React2Shell**:
  - `GHSA-9qr9-h5gf-34mp`
  - title: `Next.js is vulnerable to RCE in React flight protocol`
  - severity: critical; CWE-502
  - finding version `15.0.4`, path `targets__react2shell>next`
- Full audit JSON available locally at `/private/tmp/zazzles-audit.json` (not committed; dependency advisories change over time).
- No Next builds, app HTTP probes, browser tests, lint, React2Shell runtime probe, or CI checks completed yet.

## Known unfinished / broken pieces — start here

1. **Vitest migration is NOT implemented.** Current tests are Node test runner files `tests/sql.test.cjs` / `tests/catalog.test.cjs`. Michael explicitly requested Vitest after these were written. Prefer direct import of Next handlers through Vitest rather than retaining VM transform. Add meaningful positive and negative assertions.
2. **Documentation directory does not exist yet.** `lib/catalog.json` references missing `doc/vulnerabilities/*.md`. Consequently `tests/catalog.test.cjs` currently fails. Create index and scenario docs, architecture, adding-scenarios guide, setup/test instructions.
3. Root README, QUICK-START.md and SECURITY.md are mostly old and inaccurate (npm commands, React2Shell claims). Rewrite them, preserve attribution, clearly distinguish main Pages Router app from affected RSC fixture.
4. Package scripts reference **missing `scripts/test-sca.mjs`**. Implement a strict audit assertion for GHSA-9qr9-h5gf-34mp / next 15.0.4 in the workspace path. Raw `pnpm audit` returning nonzero is expected; network/error output must not count as a successful detection. Keep audit visibility; do not auto-fix or suppress intended CVEs.
5. **pnpm install finished downloading dependencies but exited 1** due to ignored sharp build hooks. `pnpm-workspace.yaml` currently uses `ignoredBuiltDependencies: [sharp]`; pnpm 11 appears to require `allowBuilds: { sharp: false }` instead. Fix and verify clean frozen install. Sharp isn't needed by current UI.
6. Staging installed using `--store-dir /private/tmp/zazzles-pnpm-store`. Subsequent pnpm script calls auto-triggered install because default store/config differs and failed in noninteractive mode. Don't commit this absolute path. Use a consistent store or a temporary environment override while testing. `pnpm_config_verify_deps_before_run=false` can disable automatic pre-run install for staging if necessary; inspect pnpm version semantics. Direct `node --test` was used for the successful SQL check.
7. **Explicit reflected/stored XSS and safe output counterparts not implemented yet.** Existing browser eval injection is present. Suggested routes: unsafe dangerouslySetInnerHTML using query / stored notes, safe React text rendering with identical payloads. Browser execution marker test required.
8. **Safe command execution counterpart not implemented.** Existing unsafe command endpoint is present. Suggested fixed executable with execFile, fixed argument structure, shell:false, user text passed as an argument; prove shell metacharacters remain data. Add safe file access control if useful.
9. **No GitHub Actions workflow yet.** Add frozen pnpm install, lint, Vitest, builds, HTTP/browser probes, SCA expected-vulnerability assertion. Runtime RSC probe should be verified locally before making it a required CI step.
10. `scripts/test-http.mjs` exists but hasn't run. It checks SQL vulnerable/safe pairs, resets, harmless legacy server markers, and all page HTTP statuses. Needs safe exec and browser XSS coverage added.
11. Verify SAST catalog expectations accurately. Parameterized SQL protects SQL injection only; plaintext demo creds, no session auth, mutable shared lab DB, unsafe errors, header reflection remain intentional/limited lab behaviors. Safe examples should be scoped to the flaw being tested, not called universally secure.
12. Avoid unrelated dependency upgrades: the vulnerable fixture must remain pinned and exploitable. Adding dependencies might trigger pnpm release-age/trust checks; handle intentionally and keep locks reproducible.

## Temporary development artifacts (not needed after checkpoint)

Work was prepared in `/private/tmp/zazzles-vuln-lab.pTzQWv` because the requested repository was outside the current chat's writable roots. Its source changes are being copied into the moved repository for this checkpoint, excluding `.git`, node_modules and build outputs. Staging helper scripts exist at `/private/tmp/zazzles-build-ui.py` and `/private/tmp/zazzles-build-tests.py`; generated source files in the repository are authoritative. Dependencies are staged locally, not committed. Use normal pnpm install in the real checkout once install configuration is corrected.

## Suggested continuation order

1. Read this document, inspect Git status/log, check README/license and original author attribution.
2. Fix pnpm install configuration and add Vitest, then migrate SQL tests and add command/XSS positive-negative coverage.
3. Write documentation and update catalog paths; implement SCA assertion.
4. Build and start both Next apps. Verify PGlite bundling and actual React2Shell execution marker. Fix probes rather than reporting request delivery as exploitation.
5. Add CI with the same verified commands. Confirm all required checks, document intentionally failing raw audit.
6. Commit/push follow-up work to main per Michael's initial authorization, or feature branch if he changes the workflow.
