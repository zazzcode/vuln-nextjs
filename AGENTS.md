# AGENTS.md — agent guidance for the Zazzles vulnerability lab

Start with [README.md](README.md) for what this repo is, attribution, and the scenario table; [docs/setup-and-testing.md](docs/setup-and-testing.md) for the full command matrix and what each proves. This file is only the **working guidance for agents**: how to test, and how to create vulnerable and safe examples. It intentionally does not duplicate those documents.

Deep references when needed: [docs/adding-scenarios.md](docs/adding-scenarios.md) · [docs/architecture.md](docs/architecture.md) · [docs/validation-and-sanitization.md](docs/validation-and-sanitization.md) · [docs/vulnerabilities/index.md](docs/vulnerabilities/index.md).

## Invariants (violating any of these is a bad change, however green the tests)

1. Never "fix" a vulnerable route — the flaws are the product. A test proving a flaw stopped being exploitable is a **regression**: restore it.
2. Never upgrade pinned vulnerable dependencies (`targets/react2shell` next 15.0.4 / React 19.0.0; main app Next 13.4.19 / React 18.2.0). Retiring a scenario is a dedicated change.
3. Safe controls are **scoped claims** — "this pattern defeats this flaw for identical input", never "secure in general". Validation complements parameterization; it never replaces it.
4. Safety rails stay: loopback-only, synthetic data, harmless markers (`42`, `zazzles-*-marker`), no real credentials/sensitive files.
5. Generated ground truth is never hand-edited (see [Ground truth](#ground-truth)).

## Testing guidance

**What to run, when:**

| You changed… | Minimum before commit | Why |
| --- | --- | --- |
| API handlers / lib | `pnpm test` (unit suite imports handlers directly against real PGlite — no server needed) | Exploitable outcome + safe rejection per scenario |
| API routes / pages | `pnpm build`, then against a running `pnpm start`: `pnpm test:api` (Playwright `request` fixture — no browser needed); `pnpm test:browser` for anything executing client-side | Vulnerable/protected pairs over real HTTP; real-browser execution/non-execution |
| `lib/catalog.json` or any scenario source | `pnpm scenario:check` — expect it to fail until you re-snapshot (below) | Ground truth must move with the change |
| Dependencies / lockfile | `pnpm audit:check` — expect drift until `pnpm audit:update` | Audit snapshot is the SCA scenario |
| Anything | `pnpm lint` | Style/import health |

Always, before pushing: the full matrix from [docs/setup-and-testing.md](docs/setup-and-testing.md). CI runs exactly that set and must stay green.

**Interpreting failures:**

- A vuln-side assertion failing usually means someone hardened a flaw — restore the vulnerability, don't weaken the test.
- A safe-side assertion failing means a control stopped neutralizing the identical payload — fix the control, not the test.
- `scenario:check` / `audit:check` failing after an intentional change is expected — re-snapshot and put the manifest update in the **same commit** with a justification. A manifest update with no source change is the anti-pattern reviewers reject.
- Browser "non-execution" assertions include a settle window and check marker properties (`window.__zazzlesXss`, `window.__labData`) — use `expect.poll` for execution, `waitForTimeout` + `toBeUndefined` for non-execution. Scope markup assertions to the rendered container (`#xss-output`, `.comment-body`): `__NEXT_DATA__` legitimately carries raw props.

## Ground truth

`lib/catalog.json` is the single source of truth. Generated from it (and the lockfile):

- `tests/expected-hashes.json` — SHA-256 of every registered route (`pnpm scenario:update`)
- `tests/expected-scanner-findings.json` — per-source must-find / must-not-flag + CWE for scanner evaluations (same command)
- `tests/expected-audit.json` — `pnpm audit --prod --json` snapshot (`pnpm audit:update`)

`pnpm audit --prod` exiting nonzero is correct. Only drift from the snapshot fails a check.

## Creating a vulnerability example

Expanded checklist: [docs/adding-scenarios.md](docs/adding-scenarios.md). The mechanics:

1. **ID**: `<CATEGORY>-<number>` (existing: `JS-`, `OS-`, `FS-`, `SQL-`, `XSS-`, `SSRF-`, `REDIR-`, `COOKIE-`, `SCA-`, `DEMO-`). IDs are permanent once shipped — external evaluations reference them.
2. **Files**: unsafe source and safe control in **separate files**, mirroring existing pairs (`pages/api/sql/{unsafe,safe,zod}/…`, `pages/xss/{unsafe,safe,sanitized}/…`). Mark the sink: `// <ID> / <CWE>: …`. UI uses `components/LabLayout` / `components/ApiConsole`.
3. **Catalog entry** (schema from any existing entry): `source`, `safeControl`, optional `safeControls: [...]` for library-based variants, `documentation`, `test`, `flow`, `runtime`, `cwe`, `expectedFinding: true`. No-sink explanation pages are `status: "demonstration"`, `expectedFinding: false`.
4. **Docs section** in `docs/vulnerabilities/<module>.md` following the anchor contract (`#<id>`, `#<id>-agent` compact + self-contained, `#<id>-student`, `#<id>-exploit` with **verified** Burp Suite + Postman + curl commands, `#<id>-safe` vulnerable-vs-protected table *and why*, `#<id>-tests`), plus the Contents row and `docs/vulnerabilities/index.md` entry. Never document an unverified command — run it first.
5. **Tests, both directions — required, not optional:**
   - **Playwright API test (always):** every new vulnerable route **and every safe control** gets a pair in `tests/api/lab.api.test.mjs` — one identical payload sent to both routes via the `request` fixture, asserting the exploit succeeds on the vulnerable side and stays inert on the protected side. Add new pages to the 200-sweep. No browser needed for this suite.
   - **Playwright browser test (when the vuln executes client-side / FE):** add to `tests/browser/` — marker property **set** on the unsafe page, **provably unset** on the safe page after a settle window.
   - **Unit test (when there is an API handler):** `tests/unit/<name>.test.mjs`, import the handler directly, use `request()` from `helpers.mjs`; same both-directions shape.
   A scenario without its Playwright coverage is incomplete — do not commit it. **This is enforced mechanically**: `tests/unit/catalog.test.mjs` fails (and so does CI) if an active SAST scenario's runtime-appropriate Playwright suite is missing from its catalog `test` references or no longer names the scenario ID.
6. **Re-snapshot** (`pnpm scenario:update`) in the same commit.

## Creating a safe example (protected route)

1. Choose the pattern from [docs/validation-and-sanitization.md](docs/validation-and-sanitization.md): Zod for shape, bound SQL parameters, `execFile` + argument vector with `shell: false`, exact-string allowlists, DOMPurify when rich text must survive, React text nodes otherwise, origin policy before fetching, relative-only redirects.
2. The control must accept the **identical payload** and keep it verifiably inert (echoed, stored literally, or stripped of execution) — safety must come from the pattern, not from rejecting quotes or "suspicious" input. Input checks shared with the vuln side (method/type/length) must not neutralize the exploit.
3. Register it in the scenario's `safeControl`/`safeControls` (this hashes it and exports it as must-not-flag), document it in the scenario's `-safe` section with the *why*, and add its pair to the Playwright API suite (`tests/api/lab.api.test.mjs`) — the identical payload must be asserted inert against the new control.
4. `pnpm scenario:update` afterwards.

## Gotchas (each of these has cost an hour before)

- `JSON.stringify` turns `"` into `\"` — payloads breaking out of inline `<script>` must avoid double quotes (single-quoted attribute + backtick string). See XSS-003.
- InnerHTML-inserted `<script>` elements do **not** execute; use event-handler attributes (`<img src=x onerror=…>`) as execution markers.
- Next.js normalizes `//host` `getServerSideProps` redirect destinations to same-site paths — the open-redirect exploit is the absolute-URL form.
- `dangerouslySetInnerHTML` emits verbatim in SSR; DOMPurify output is not self-closed (`<img src="x">`, not `<img src="x" />`).
- Multipart bodies for the React2Shell probe need CRLF endings and the digest's trailing `;303;` semicolon.
- pnpm 11 ignores `.npmrc` `save-exact` — pin versions in `package.json` (`saveExact: true` lives in `pnpm-workspace.yaml`).

## Definition of done (any change)

```bash
pnpm lint && pnpm test && pnpm scenario:check && pnpm audit:check
pnpm build && (pnpm start &)          # pnpm test:api && pnpm test:browser
pnpm build:react2shell && (pnpm start:react2shell &)   # pnpm test:react2shell
```

All green → commit (message explains *why*, manifests included with their justifying change) → push. `main` holds verified work; exploratory work goes on a feature branch. Preserve upstream attribution (Eric / e-tang) in docs and UI.
