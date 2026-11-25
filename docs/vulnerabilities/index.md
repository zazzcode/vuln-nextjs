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
| COOKIE-001 | Session cookie without HttpOnly | CWE-1004 | SAST | [ref](cookies.md#cookie-001-agent) | `pages/api/cookies/unsafe/script-readable.js` | `pages/api/cookies/safe/session.js` |
| COOKIE-002 | Session cookie without Secure | CWE-614 | SAST | [ref](cookies.md#cookie-002-agent) | `pages/api/cookies/unsafe/plain-transport.js` | `pages/api/cookies/safe/session.js` |
| COOKIE-003 | Session cookie with a misleading name, without HttpOnly | CWE-1004 | SAST | [ref](cookies.md#cookie-003-agent) | `pages/api/cookies/unsafe/misleading-name.js` | `pages/api/cookies/safe/session.js` |
| COOKIE-004 | Session cookie without Secure among several cookies | CWE-614 | SAST | [ref](cookies.md#cookie-004-agent) | `pages/api/cookies/unsafe/several-cookies.js` | `pages/api/cookies/safe/session.js` |
| COOKIE-005 | Hardened cookie options overridden by a later false | CWE-1004 | SAST | [ref](cookies.md#cookie-005-agent) | `pages/api/cookies/unsafe/overridden-options.js` | `pages/api/cookies/safe/overridden-options.js` |
| COOKIE-006 | HttpOnly in the cookie name, not in the attributes | CWE-1004 | SAST | [ref](cookies.md#cookie-006-agent) | `pages/api/cookies/unsafe/attribute-in-name.js` | `pages/api/cookies/safe/lowercase-attributes.js` |
| COOKIE-007 | Hardened cookie header replaced by one without Secure | CWE-614 | SAST | [ref](cookies.md#cookie-007-agent) | `pages/api/cookies/unsafe/replaced-header.js` | `pages/api/cookies/safe/replaced-header.js` |
| MONGO-001 | Operator injection in a sign-in body | CWE-943 | SAST | [ref](mongodb.md#mongo-001-agent) | `pages/api/mongo/sign-in/front-desk.js` | `sign-in/kiosk.js` · `sign-in/branch.js` · `sign-in/mobile.js` |
| MONGO-002 | Type check without a return | CWE-943 | SAST | [ref](mongodb.md#mongo-002-agent) | `pages/api/mongo/sign-in/partner.js` | `sign-in/vendor.js` |
| MONGO-003 | Only top-level operator keys are removed | CWE-943 | SAST | [ref](mongodb.md#mongo-003-agent) | `pages/api/mongo/sign-in/portal.js` | `sign-in/gateway.js` |
| MONGO-004 | A different field is checked | CWE-943 | SAST | [ref](mongodb.md#mongo-004-agent) | `pages/api/mongo/sign-in/reception.js` | `sign-in/lobby.js` |
| MONGO-005 | Text read as a field path in $expr | CWE-943 | SAST | [ref](mongodb.md#mongo-005-agent) | `pages/api/mongo/sign-in/terminal.js` | `sign-in/console.js` |
| MONGO-006 | Operator injection from bracketed query parameters | CWE-943 | SAST | [ref](mongodb.md#mongo-006-agent) | `pages/api/mongo/directory/badge.js` | `directory/locker.js` · `directory/desk.js` · `articles/shelf.js` |
| MONGO-007 | ObjectId fallback to the raw value | CWE-943 | SAST | [ref](mongodb.md#mongo-007-agent) | `pages/api/mongo/articles/entry.js` | `articles/item.js` |
| MONGO-008 | $where built from request text | CWE-943 | SAST | [ref](mongodb.md#mongo-008-agent) | `pages/api/mongo/articles/browse.js` | `articles/topic.js` · `articles/budget.js` · `articles/view.js` · `articles/range.js` |
| MONGO-009 | $function body built from request text | CWE-943 | SAST | [ref](mongodb.md#mongo-009-agent) | `pages/api/mongo/articles/score.js` | `articles/rank.js` |
| MONGO-010 | A parsed JSON filter passed to find | CWE-943 | SAST | [ref](mongodb.md#mongo-010-agent) | `pages/api/mongo/articles/search.js` | `articles/match.js` |
| MONGO-011 | A fixed condition overridden by a spread | CWE-943 | SAST | [ref](mongodb.md#mongo-011-agent) | `pages/api/mongo/articles/listing.js` | `articles/catalogue.js` |
| MONGO-012 | A request filter passed to countDocuments | CWE-943 | SAST | [ref](mongodb.md#mongo-012-agent) | `pages/api/mongo/directory/tally.js` | `directory/count.js` |
| MONGO-013 | A request object selects the document to update | CWE-943 | SAST | [ref](mongodb.md#mongo-013-agent) | `pages/api/mongo/bookings/close.js` | `bookings/finish.js` |
| MONGO-014 | A spread overrides the owner in a delete | CWE-943 | SAST | [ref](mongodb.md#mongo-014-agent) | `pages/api/mongo/bookings/remove.js` | `bookings/discard.js` |
| MONGO-015 | Validation after the query | CWE-943 | SAST | [ref](mongodb.md#mongo-015-agent) | `pages/api/mongo/bookings/confirm.js` | `bookings/accept.js` |
| MONGO-016 | An aggregation pipeline from the request | CWE-943 | SAST | [ref](mongodb.md#mongo-016-agent) | `pages/api/mongo/reports/run.js` | `reports/named.js` |
| MONGO-017 | A $match stage from the request | CWE-943 | SAST | [ref](mongodb.md#mongo-017-agent) | `pages/api/mongo/reports/summary.js` | `reports/overview.js` |
| MONGO-018 | A group key named by the request | CWE-943 | SAST | [ref](mongodb.md#mongo-018-agent) | `pages/api/mongo/reports/breakdown.js` | `reports/totals.js` |
| MONGO-019 | A request object passed to $set | CWE-915 | SAST | [ref](mongodb.md#mongo-019-agent) | `pages/api/mongo/members/profile.js` | `members/details.js` · `members/settings.js` |
| MONGO-020 | Removed keys and a dotted path | CWE-915 | SAST | [ref](mongodb.md#mongo-020-agent) | `pages/api/mongo/members/preferences.js` | `members/options.js` |
| MONGO-021 | A complete update document from the request | CWE-943 | SAST | [ref](mongodb.md#mongo-021-agent) | `pages/api/mongo/members/record.js` | `members/entry.js` |
| MONGO-022 | Text read as a field path in an update pipeline | CWE-943 | SAST | [ref](mongodb.md#mongo-022-agent) | `pages/api/mongo/members/nickname.js` | `members/alias.js` |
| MONGO-023 | Request-controlled sort | CWE-943 | SAST | [ref](mongodb.md#mongo-023-agent) | `pages/api/mongo/articles/ordered.js` | `articles/sorted.js` |
| MONGO-024 | Request-controlled projection | CWE-943 | SAST | [ref](mongodb.md#mongo-024-agent) | `pages/api/mongo/directory/card.js` | `directory/contact.js` |
| MONGO-025 | Request-controlled field name | CWE-943 | SAST | [ref](mongodb.md#mongo-025-agent) | `pages/api/mongo/directory/resolve.js` | `directory/locate.js` |
| MONGO-026 | User text in $regex | CWE-943 | SAST | [ref](mongodb.md#mongo-026-agent) | `pages/api/mongo/invites/redeem.js` | `invites/claim.js` · `invites/check.js` · `invites/open.js` |
| MONGO-027 | Incomplete escape before $regex | CWE-943 | SAST | [ref](mongodb.md#mongo-027-agent) | `pages/api/mongo/invites/accept.js` | `invites/join.js` |
| SCA-001 | React2Shell (CVE-2025-66478) | CWE-502 | SCA | [ref](react2shell.md#sca-001-agent) | `targets/react2shell/package.json` | pinned on purpose |
| DEMO-001 | Header reflection (no sink) | — | none | [ref](demonstrations.md#demo-001-agent) | `pages/vulnerable/header-injection.js` | — |
| DEMO-002 | Dynamic import (no sink) | — | none | [ref](demonstrations.md#demo-002-agent) | `pages/vulnerable/dynamic-import.js` | — |

Demonstrations are negative controls: scanners should **not** report them. Defense patterns across all protected routes: [validation-and-sanitization.md](../validation-and-sanitization.md).

## Work in progress

[Workshop routes](workshop.md) is the second MongoDB batch. Its routes have no labels yet.

## Vulnerable dependencies

[Vulnerable dependencies](dependencies.md) lists the vulnerable packages that are installed and the ones that are planned.

## Offline scanner fixtures

- [Prototype pollution (CWE-1321)](prototype-pollution.md) covers affected and patched Lodash
  calls, two other advisory libraries, fifteen write shapes in application source with complete,
  incomplete and unread guards, and three controls without a write.
- [Unsafe deserialization (CWE-502)](unsafe-deserialization.md) explains the application-code
  analyzer and links to its offline fixtures.
