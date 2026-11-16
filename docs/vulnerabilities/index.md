# Scenario quick reference

Machine-readable source of truth: [`lib/catalog.json`](../../lib/catalog.json). Detailed write-ups with exploit instructions are linked per category. Live index: `/vulnerabilities`.

| ID | Scenario | CWE | Scanner | Unsafe source | Safe control | Details |
| --- | --- | --- | --- | --- | --- | --- |
| JS-001 | Browser eval injection | CWE-95 | SAST | `pages/vulnerable/eval-injection.js` | — | [javascript.md](javascript.md) |
| JS-002 | Server-side eval injection | CWE-95 | SAST | `pages/api/vulnerable-submit.js` | `pages/api/protected-example.js` | [javascript.md](javascript.md) |
| OS-001 | Unrestricted shell command execution | CWE-78 | SAST | `pages/api/vulnerable-exec.js` | `pages/api/secure/command.js` | [system.md](system.md) |
| FS-001 | Arbitrary file read | CWE-22 | SAST | `pages/api/vulnerable-file-read.js` | `pages/api/secure/file-read.js` | [system.md](system.md) |
| SQL-001 | SQL login bypass | CWE-89 | SAST | `pages/api/sql/unsafe/login.js` | `pages/api/sql/safe/login.js` | [sql.md](sql.md) |
| SQL-002 | SQL product search injection | CWE-89 | SAST | `pages/api/sql/unsafe/products.js` | `pages/api/sql/safe/products.js` | [sql.md](sql.md) |
| SQL-003 | SQL note write / stacked statements | CWE-89 | SAST | `pages/api/sql/unsafe/notes.js` | `pages/api/sql/safe/notes.js` | [sql.md](sql.md) |
| XSS-001 | Reflected XSS | CWE-79 | SAST | `pages/xss/unsafe/reflected.js` | `pages/xss/safe/reflected.js` | [xss.md](xss.md) |
| XSS-002 | Stored XSS | CWE-79 | SAST | `pages/xss/unsafe/stored.js` | `pages/xss/safe/stored.js` | [xss.md](xss.md) |
| SCA-001 | React2Shell (CVE-2025-66478) | CWE-502 | SCA | `targets/react2shell/package.json` | — (pinned on purpose) | [react2shell.md](react2shell.md) |
| DEMO-001 | Header reflection (no sink) | — | none | `pages/vulnerable/header-injection.js` | — | [demonstrations.md](demonstrations.md) |
| DEMO-002 | Dynamic import explanation | — | none | `pages/vulnerable/dynamic-import.js` | — | [demonstrations.md](demonstrations.md) |

Demonstrations are negative controls: scanners should **not** report them.
