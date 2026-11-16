# Zazzles vulnerability lab — training documentation

This directory is a **training course** on the lab's scenarios: what each flaw is, where it lives, what a SAST/SCA tool is expected to report, step-by-step exploitation with Burp Suite / Postman / curl, and the protected counterparts that handle the identical payload without executing it — plus *why* the protection works.

Scenario metadata is machine-readable in [`lib/catalog.json`](../lib/catalog.json); the scenario index page at `/vulnerabilities` renders it. Tests assert this documentation stays in sync with the catalog.

## Course modules

Suggested reading order — each module is self-contained:

| # | Module | Scenarios |
| --- | --- | --- |
| 1 | [javascript.md](vulnerabilities/javascript.md) | JS-001 browser eval · JS-002 server eval |
| 2 | [system.md](vulnerabilities/system.md) | OS-001 command execution · FS-001 file read |
| 3 | [sql.md](vulnerabilities/sql.md) | SQL-001 login bypass · SQL-002 search injection · SQL-003 stacked statements |
| 4 | [xss.md](vulnerabilities/xss.md) | XSS-001 reflected · XSS-002 stored (notes) · XSS-003 script-context · XSS-004 stored guestbook |
| 5 | [ssr.md](vulnerabilities/ssr.md) | SSRF-001 request forgery · REDIR-001 open redirect |
| 6 | [react2shell.md](vulnerabilities/react2shell.md) | SCA-001 dependency vulnerability (CVE-2025-66478) |
| 7 | [demonstrations.md](vulnerabilities/demonstrations.md) | DEMO-001/002 negative controls (no findings expected) |

Quick-reference table with agent links: [vulnerabilities/index.md](vulnerabilities/index.md).
Defense patterns used by every protected route: [validation-and-sanitization.md](validation-and-sanitization.md).

## Reference documents

| Document | Purpose |
| --- | --- |
| [architecture.md](architecture.md) | Workspace layout, runtime architecture, test layers |
| [setup-and-testing.md](setup-and-testing.md) | Install, run, and every test command with what it proves |
| [validation-and-sanitization.md](validation-and-sanitization.md) | The defense patterns behind the protected routes |
| [adding-scenarios.md](adding-scenarios.md) | Checklist for adding a new scenario |

<a id="anchor-contract"></a>
## How each module is structured (anchor contract)

Every module opens with a **Contents** table and every scenario has the same five linkable sections. The anchors are stable and follow one pattern, so agents and humans can deep-link without reading surrounding material:

| Section | Anchor | Audience / contents |
| --- | --- | --- |
| Scenario | `#<id>` | e.g. `#sql-001` — heading |
| Agent reference | `#<id>-agent` | **Compact block for agents/scanners**: source path(s), route, sink, flow, safe control path(s), test files, one-line expected finding. Self-contained — nothing else in the module is required |
| Student guide | `#<id>-student` | The flaw explained: mechanism, code excerpt, why it works |
| Exploit lab | `#<id>-exploit` | Reproduction with **Burp Suite, Postman, and curl** variants plus the observation that proves exploitation |
| Vuln vs protected | `#<id>-safe` | Side-by-side table of the vulnerable and protected routes — code difference, what the identical payload does on each — and **why** the control defeats the attack class |
| Tests | `#<id>-tests` | Automated coverage of both directions |

Agent URL pattern: `docs/vulnerabilities/<module>.md#<id>-agent` (IDs lowercased, e.g. `xss.md#xss-004-agent`).

All exploit steps are safe: harmless markers (`42`, `zazzles-*-marker`, computed arithmetic), synthetic data, loopback addresses only.

## Reading a scenario for the first time (students)

1. Start with the **Student guide** to understand the mechanism.
2. Run the **Exploit lab** with your preferred tool and observe the proof.
3. Run the identical payload against the protected route from the comparison table and observe the difference.
4. Read **Vuln vs protected — and why** to internalize the security property that separates them.
5. Check the **Tests** section — the lab asserts both directions automatically, in CI on every push.
