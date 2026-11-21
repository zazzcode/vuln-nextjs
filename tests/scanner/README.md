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
| `pages-shapes`: eleven write shapes in application source, one of them in library source kept in the repository, plus two controls | Seven raw, two guarded and two review candidates. The controls have none |
| `app-shapes`: bracket-flattened keys and a `reduce` merge after `Request.json()` | Two raw candidates |
| `libraries-affected`: Lodash `set`, `defaultsDeep` and `zipObjectDeep` at 4.17.4, `dset` 3.1.3, `merge-deep` 3.0.2 | Three raw Lodash candidates. No record for `dset` and `merge-deep`, which are known gaps |
| `libraries-patched`: the same calls at Lodash 4.17.21, `dset` 3.1.4, `merge-deep` 3.0.3 | No candidate |

The [prototype pollution guide](../../docs/vulnerabilities/prototype-pollution.md) lists every
source with its payload and expected path.

The assertions check source locations, key facts, and assessment state. They require Node.js and
the scanner binary. Package metadata is read as fixture data.

## Compare scanners

Export regular TypeScript files for all seven projects. The command prints the temporary
directory. Its `expected-scanner-findings.json` lists each source file with:

- `expectedFinding`: whether the source is exploitable, for any scanner;
- `expectedPath`: what the Zazzles scanner records, `raw`, `guarded`, `review` or `absent`;
- `advisory`: the CVE, where the weakness is in an installed dependency.

A source can be exploitable without a `raw` path. `pages-shapes/pages/api/set-path-compared.ts`
is exploitable and `review`. The `dset` and `merge-deep` rows are exploitable and `absent`.

```bash
fixture_dir=$(node scripts/export-prototype-pollution-fixtures.mjs)
semgrep scan --config /absolute/path/to/rules.yml --json "$fixture_dir"
```

Use the same directory with another scanner to compare the results against the manifest.
A rule that analyzes only source may report both Lodash pins. Compare each pin separately so the
patched copy counts as a control. For the rest of the lab, use the [catalog scanner expectations](../expected-scanner-findings.json).
