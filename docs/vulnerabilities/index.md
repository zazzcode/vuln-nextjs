# Scenario quick reference

Machine-readable source of truth: [`lib/catalog.json`](../../lib/catalog.json). Live index: `/vulnerabilities`. Scanner evaluation ground truth (per-source must-find / must-not-flag + CWE): [`tests/expected-scanner-findings.json`](../../tests/expected-scanner-findings.json), generated from the catalog and kept in sync by `pnpm scenario:check`.

Agents: each row links directly to the scenario's compact [expected-finding block](../README.md#anchor-contract) — `docs/vulnerabilities/<module>.md#<id>-agent` — no need to read the full module.

| ID | Scenario | CWE | Scanner | Agent ref | Unsafe source | Protected |
| --- | --- | --- | --- | --- | --- | --- |
| JS-001 | Browser eval injection | CWE-95 | SAST | [ref](javascript.md#js-001-agent) | `pages/vulnerable/eval-injection.js` | `/secure/sanitized-input` |
| JS-002 | Server-side eval injection | CWE-95 | SAST | [ref](javascript.md#js-002-agent) | `pages/api/vulnerable-submit.js` | `pages/api/protected-example.js` |
| OS-001 | Shell command execution | CWE-78 | SAST | [ref](system.md#os-001-agent) | `pages/api/vulnerable-exec.js` | `pages/api/secure/command.js` |
| FS-001 | Arbitrary file read | CWE-22 | SAST | [ref](system.md#fs-001-agent) | `pages/api/vulnerable-file-read.js` | `pages/api/secure/file-read.js` |
| SQL-001 | SQL login bypass | CWE-89 | SAST | [ref](sql.md#sql-001-agent) | `pages/api/sql/unsafe/login.js` | `safe/login.js` · `zod/login.js` |
| SQL-002 | SQL search injection | CWE-89 | SAST | [ref](sql.md#sql-002-agent) | `pages/api/sql/unsafe/products.js` | `safe/products.js` · `zod/products.js` |
| SQL-003 | SQL stacked statements | CWE-89 | SAST | [ref](sql.md#sql-003-agent) | `pages/api/sql/unsafe/notes.js` | `safe/notes.js` · `zod/notes.js` |
| XSS-001 | Reflected XSS | CWE-79 | SAST | [ref](xss.md#xss-001-agent) | `pages/xss/unsafe/reflected.js` | `safe/reflected.js` · `sanitized/reflected.js` |
| XSS-002 | Stored XSS (notes) | CWE-79 | SAST | [ref](xss.md#xss-002-agent) | `pages/xss/unsafe/stored.js` | `pages/xss/safe/stored.js` |
| XSS-003 | Script-context injection | CWE-79 | SAST | [ref](xss.md#xss-003-agent) | `pages/xss/unsafe/script-context.js` | `pages/xss/safe/script-context.js` |
| XSS-004 | Stored guestbook XSS | CWE-79 | SAST | [ref](xss.md#xss-004-agent) | `pages/xss/unsafe/comments.js` | `pages/xss/sanitized/comments.js` |
| SSRF-001 | SSRF during rendering | CWE-918 | SAST | [ref](ssr.md#ssrf-001-agent) | `pages/vulnerable/ssrf.js` | `pages/secure/ssrf.js` |
| REDIR-001 | Open redirect | CWE-601 | SAST | [ref](ssr.md#redir-001-agent) | `pages/vulnerable/redirect.js` | `pages/secure/redirect.js` |
| SCA-001 | React2Shell (CVE-2025-66478) | CWE-502 | SCA | [ref](react2shell.md#sca-001-agent) | `targets/react2shell/package.json` | pinned on purpose |
| DEMO-001 | Header reflection (no sink) | — | none | [ref](demonstrations.md#demo-001-agent) | `pages/vulnerable/header-injection.js` | — |
| DEMO-002 | Dynamic import (no sink) | — | none | [ref](demonstrations.md#demo-002-agent) | `pages/vulnerable/dynamic-import.js` | — |

Demonstrations are negative controls: scanners should **not** report them. Defense patterns across all protected routes: [validation-and-sanitization.md](../validation-and-sanitization.md).

## Offline scanner fixtures

- [Prototype pollution (CWE-1321)](prototype-pollution.md) covers affected and patched Lodash
  calls, two other advisory libraries, fifteen write shapes in application source with complete,
  incomplete and unread guards, and three controls without a write.
