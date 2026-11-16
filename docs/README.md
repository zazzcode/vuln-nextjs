# Zazzles vulnerability lab — documentation index

This directory documents every scenario in the lab: what the flaw is, where it lives, what a SAST/SCA tool is expected to report, the safe control that handles the same payload without executing it, and step-by-step reproduction (exploit) instructions.

Scenario metadata is machine-readable in [`lib/catalog.json`](../lib/catalog.json); the scenario index page at `/vulnerabilities` renders it. Tests assert that this documentation stays in sync with the catalog.

## Contents

| Document | Purpose |
| --- | --- |
| [architecture.md](architecture.md) | Workspace layout, runtime architecture, test layers |
| [setup-and-testing.md](setup-and-testing.md) | Install, run, and every test command with what it proves |
| [adding-scenarios.md](adding-scenarios.md) | Checklist for adding a new scenario |
| [vulnerabilities/index.md](vulnerabilities/index.md) | Scenario quick-reference table |

## Vulnerability scenario reference

| Document | Scenarios |
| --- | --- |
| [vulnerabilities/javascript.md](vulnerabilities/javascript.md) | JS-001 browser eval injection · JS-002 server-side eval injection |
| [vulnerabilities/system.md](vulnerabilities/system.md) | OS-001 shell command execution · FS-001 arbitrary file read |
| [vulnerabilities/sql.md](vulnerabilities/sql.md) | SQL-001 login bypass · SQL-002 search injection · SQL-003 stacked statements |
| [vulnerabilities/xss.md](vulnerabilities/xss.md) | XSS-001 reflected XSS · XSS-002 stored XSS |
| [vulnerabilities/react2shell.md](vulnerabilities/react2shell.md) | SCA-001 React2Shell (CVE-2025-66478) |
| [vulnerabilities/demonstrations.md](vulnerabilities/demonstrations.md) | DEMO-001 header reflection · DEMO-002 dynamic import explanation |

## Reading a scenario document

Every scenario follows the same structure so scanners and humans can diff expectations:

1. **Flaw and data flow** — source, sink, and the taint path between them.
2. **Expected finding** — what a SAST/SCA tool should report (CWE, location).
3. **Safe control** — the paired implementation that receives the identical payload and keeps it data.
4. **Reproduction / exploit** — exact commands (curl or browser URLs) that demonstrate execution, plus the observation that proves it.
5. **Tests** — automated checks covering both the exploitable and the safe path.

All reproduction steps are safe: they use harmless markers (`42`, `zazzles-*-marker`), synthetic data, and loopback addresses.
