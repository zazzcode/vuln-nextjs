# Prototype pollution (CWE-1321)

These static-analysis fixtures exercise request-to-write tracking in Next.js 13.4.19. Each
TypeScript text file is mounted in a disposable project for the scanner. The fixture layout
preserves the Pages Router and App Router conventions.

## Expected scanner findings

| Case | Source | Expected result |
| --- | --- | --- |
| Affected Lodash merge | [Pages Router merge](../../tests/scanner/fixtures/prototype-pollution/pages/api/merge.ts.txt) | Lodash 4.17.4 produces one raw prototype-write candidate. The request body supplies keys to a verified merge. |
| Patched Lodash merge | [Same Pages Router source](../../tests/scanner/fixtures/prototype-pollution/pages/api/merge.ts.txt) | Lodash 4.17.21 produces no candidate for that merge. |
| Recursive merge with key filtering | [Pages Router guard](../../tests/scanner/fixtures/prototype-pollution/pages/api/guarded.ts.txt) | One guarded candidate. The scanner lists `__proto__`, `constructor`, and `prototype` as blocked. |
| JSON parsing | [Pages Router parser](../../tests/scanner/fixtures/prototype-pollution/pages/api/parse.ts.txt) | No prototype-write candidate. |
| Nested computed assignment | [App Router handler](../../tests/scanner/fixtures/prototype-pollution/app/api/settings/route.ts.txt) | One raw candidate. The first lookup key comes from `Request.json()`. |

## How the weakness works

In the Pages Router merge, the request body supplies a settings object. A deep merge makes
lookup decisions from the object's keys. If it follows an inherited object while descending, a
later assignment can modify a shared prototype. Other objects can then observe properties they
did not define. The patched Lodash pin removes the affected merge behavior.

In the App Router fixture, `Request.json()` supplies the first computed lookup key. That lookup
selects the object that receives the later assignment. The recursive-merge control filters the
three prototype-related names at each level, before traversing or writing to the target. The
JSON parsing control only creates data for the response.

## Tests

Set `ZAZZLES_SCAN` to a scanner binary that supports the `pollution` family, then run the tests
from the repository root.

```bash
ZAZZLES_SCAN=/absolute/path/to/scan node --test tests/scanner/prototype-pollution.test.mjs
```

[Fixture layout, lockfile controls, and export for Semgrep or other scanners](../../tests/scanner/README.md).
