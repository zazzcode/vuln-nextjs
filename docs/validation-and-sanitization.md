# Defense patterns used by the protected routes

Every protected route in the lab implements one named defense pattern. This page is the cross-reference: which pattern, which routes, and why each defeats its attack class. Library choices reflect the current Next.js ecosystem mainstream.

| Pattern | Library | Routes | Defeats |
| --- | --- | --- | --- |
| Parameterized SQL | PGlite driver (`$1` bindings) | `pages/api/sql/safe/*`, `pages/api/sql/zod/*`, `pages/api/xss/comments.js` | SQL injection (SQL-001/002/003) |
| Schema validation | [Zod](https://zod.dev) | `pages/api/sql/zod/{login,products,notes}.js` | malformed/type-confused input reaching query or business logic |
| React text rendering | built-in escaping | `pages/xss/safe/*`, `pages/secure/sanitized-input.js` | XSS — markup is never parsed (XSS-001/002) |
| HTML sanitization | [DOMPurify](https://github.com/cure53/DOMPurify) via `isomorphic-dompurify` | `pages/xss/sanitized/{reflected,comments}.js` | XSS when rich text must survive (XSS-001/004) |
| Script-context escaping | `\u003c` escaping of embedded JSON | `pages/xss/safe/script-context.js` | `</script>` breakout (XSS-003) |
| Fixed executable + argument vector | `child_process.execFile`, `shell: false` | `pages/api/secure/command.js` | command injection (OS-001) |
| Exact-string allowlist | `Set` membership before any I/O | `pages/api/secure/file-read.js` | path traversal (FS-001) |
| Decide-then-fetch origin policy | `URL` normalization + origin/path check | `pages/secure/ssrf.js` | SSRF (SSRF-001) |
| Relative-path-only redirect | `/^\/[^/]/` + no scheme | `pages/secure/redirect.js` | open redirect (REDIR-001) |
| Session cookie attributes | `HttpOnly; Secure; SameSite=Lax` on the cookie that identifies the caller | `pages/api/cookies/safe/session.js` | script-readable and plain-HTTP session cookies (COOKIE-001 to COOKIE-007) |
| Typed and fixed-shape MongoDB queries | coercion, `$eq`, `$literal`, Zod, checked `ObjectId`, constant lists, escaped patterns | `pages/api/mongo/*` (listed in [mongodb.md](vulnerabilities/mongodb.md)) | MongoDB query injection (MONGO-001 to MONGO-027) |
| Whitelist + no evaluation | character whitelist, no eval | `pages/api/protected-example.js`, `pages/secure/sanitized-input.js` | code injection (JS-001/002) |

## Validation vs sanitization vs escaping

The three are frequently confused; the lab separates them deliberately:

- **Validation** (Zod, type/length checks) answers *"is this input well-formed?"* and rejects what isn't. It cannot make dangerous sinks safe — a perfectly valid SQL-injection string is well-formed — so the zod routes still use bound parameters. Validation protects *business logic*, and it appears on both vulnerable and protected routes in this lab precisely because it does not neutralize attack payloads.
- **Sanitization** (DOMPurify) answers *"can this content be made safe to interpret?"* — used only when the product requires the content to be interpreted (rich text). It is a parser-to-parser transformation with an allowlist, not a blocklist of "bad tags".
- **Escaping/encoding** (React text nodes, `\u003c`) answers *"how do I carry this data through a context without it being interpreted?"* — the default answer, because it needs no knowledge of what might be dangerous.

**The unifying principle:** every protection in this lab works by keeping untrusted data out of a *parser* (SQL parser, shell, HTML parser, JS engine, URL redirect) — either by removing the parser from the data path (`execFile`, text nodes), constraining what reaches it (parameters, allowlists, origin policy), or transforming the data so it survives the parser inertly (escaping, sanitization).

## Why the same payload on both routes matters

Each scenario's tests send the **identical payload** to the vulnerable and protected routes. That is what makes the lab usable as SAST ground truth: a scanner's finding on the vulnerable source is a true positive; the same finding on the protected source would be a false positive *for the named flaw* — the protected routes are scoped claims (e.g. parameterization defeats injection, not authorization), documented per scenario in each module's “Vuln vs protected” section.
