# Prototype pollution scanner tests

Run these source-only regressions with a Zazzles binary that includes the `pollution` family.

```bash
ZAZZLES_SCAN=/absolute/path/to/scan node --test tests/scanner/prototype-pollution.test.mjs
```

The suite copies the text fixtures into disposable directories that use Next.js 13.4.19 Pages
Router or App Router conventions. It writes synthetic package metadata for each Lodash version
and runs the scanner offline. The checked-in files use `.ts.txt` so Next.js never loads them
as application routes.

| Fixture | Expected CWE-1321 evidence |
| --- | --- |
| Pages Router merge with Lodash 4.17.4 | One raw candidate for the request-derived source |
| Same merge with Lodash 4.17.21 | No candidate |
| Pages Router recursive merge with a literal key guard | One guarded candidate listing `__proto__`, `constructor`, and `prototype` as blocked |
| Pages Router JSON parsing | No candidate |
| App Router computed write after `Request.json()` | One raw candidate for the lookup key |

The assertions check source locations, key facts, and assessment state. They require Node.js and
the scanner binary. Package metadata is read as fixture data.

## Compare scanners

Export regular TypeScript files for the affected Pages Router project, patched Pages Router
project, and App Router project. The command prints the temporary directory. Its
`expected-scanner-findings.json` lists each source file, CWE, and expected finding status.

```bash
fixture_dir=$(node scripts/export-prototype-pollution-fixtures.mjs)
semgrep scan --config /absolute/path/to/rules.yml --json "$fixture_dir"
```

Use the same directory with another scanner to compare the results against the manifest.
A rule that analyzes only source may report both Lodash pins. Compare each pin separately so the
patched copy counts as a control. For the rest of the lab, use the [catalog scanner expectations](../expected-scanner-findings.json).
