# Prototype pollution (CWE-1321)

These static-analysis fixtures exercise request-to-write tracking in Next.js 13.4.19. Each
TypeScript text file is mounted in a disposable project for the scanner. The fixture layout
preserves the Pages Router and App Router conventions. None of them is a runnable lab endpoint.

Each source has two expectations. **Exploitable** is the ground truth for any scanner: whether a
request can write to `Object.prototype` through that source. **Zazzles path** is the evidence the
Zazzles scanner records offline: `raw` (an unguarded request path to the write), `guarded`
(every prototype key is blocked), `review` (a control the scanner does not read), or no record.

## Lodash calls by version

| Case | Source | Exploitable | Zazzles path |
| --- | --- | --- | --- |
| `merge`, Lodash 4.17.4 | [Pages Router merge](../../tests/scanner/fixtures/prototype-pollution/pages/api/merge.ts.txt) | Yes | `raw`, contract `lodash-merge-v1` |
| `merge`, Lodash 4.17.21 | Same source | No | No record |
| `set`, Lodash 4.17.4 | [lodash-set](../../tests/scanner/fixtures/prototype-pollution/libraries/pages/api/lodash-set.ts.txt) | Yes | `raw`, contract `lodash-set-v1` |
| `defaultsDeep`, Lodash 4.17.4 | [lodash-defaults-deep](../../tests/scanner/fixtures/prototype-pollution/libraries/pages/api/lodash-defaults-deep.ts.txt) | Yes | `raw`, contract `lodash-merge-v1` |
| `zipObjectDeep`, Lodash 4.17.4 | [lodash-zip](../../tests/scanner/fixtures/prototype-pollution/libraries/pages/api/lodash-zip.ts.txt) | Yes | `raw`, contract `lodash-set-v1` |
| The same three calls, Lodash 4.17.21 | Same sources | No | No record |

## Other libraries

These calls reach a published advisory through an installed dependency. Source analysis has no
record for them: the scanner does not read `node_modules/` and has version contracts for Lodash
only. A dependency audit is the control that reports them.

| Case | Source | Exploitable | Zazzles path |
| --- | --- | --- | --- |
| `dset` 3.1.3, [CVE-2024-21529](https://github.com/advisories/GHSA-f6v4-cf5j-vf3w) | [dset](../../tests/scanner/fixtures/prototype-pollution/libraries/pages/api/dset.ts.txt) | Yes | No record (known gap) |
| `dset` 3.1.4 | Same source | No | No record |
| `merge-deep` 3.0.2, [CVE-2021-26707](https://github.com/advisories/GHSA-r6rj-9ch6-g264) | [merge-deep](../../tests/scanner/fixtures/prototype-pollution/libraries/pages/api/merge-deep.ts.txt) | Yes | No record (known gap) |
| `merge-deep` 3.0.3 | Same source | No | No record |

## Writes in application source

| Case | Source | Exploitable | Zazzles path |
| --- | --- | --- | --- |
| Nested computed assignment | [App Router settings](../../tests/scanner/fixtures/prototype-pollution/app/api/settings/route.ts.txt) | Yes | `raw`. The first lookup key comes from `Request.json()` |
| Recursive merge with key filtering | [Pages Router guard](../../tests/scanner/fixtures/prototype-pollution/pages/api/guarded.ts.txt) | No | `guarded`. `__proto__`, `constructor`, and `prototype` are blocked |
| Deep merge over `Object.getOwnPropertyNames`, behind a `deep` option | [deep-merge](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/deep-merge.ts.txt) | Yes | `raw` |
| Path passed as an array of parts | [set-path](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/set-path.ts.txt) | Yes | `raw` |
| Array path with a type test and a deny-list | [set-path-checked](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/set-path-checked.ts.txt) | No | `guarded` |
| Array path with a deny-list and no type test | [set-path-compared](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/set-path-compared.ts.txt) | Yes, with `[["__proto__"], "polluted"]` | `review` |
| Unflatten of dotted keys | [unflatten](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/unflatten.ts.txt) | Yes | `raw` |
| Regular-expression split walked with `reduce` | [reduce-path](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/reduce-path.ts.txt) | Yes | `raw` |
| Whole-path deny-list for all three names | [deny-path](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/deny-path.ts.txt) | No | `guarded` |
| Whole-path deny-list for `__proto__` only | [deny-path-partial](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/deny-path-partial.ts.txt) | Yes, with `constructor.prototype.polluted` | `raw`, `constructor` listed as open |
| Nested write after the slot is created when absent | [preferences](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/preferences.ts.txt) | Yes | `raw` |
| The same write behind a `Map` lookup on the key | [preferences-known](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/preferences-known.ts.txt) | No | `review` |
| Library source kept in the repository, imported by default | [vendored](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/vendored.ts.txt) and [tiny-merge](../../tests/scanner/fixtures/prototype-pollution/shapes/lib/tiny-merge.ts.txt) | Yes | `raw`. The write evidence is in the library file |
| Bracket-flattened keys after `Request.json()` | [App Router profile](../../tests/scanner/fixtures/prototype-pollution/shapes-app/app/api/profile/route.ts.txt) | Yes | `raw` |
| Merge written as a `reduce` over the keys | [App Router flags](../../tests/scanner/fixtures/prototype-pollution/shapes-app/app/api/flags/route.ts.txt) | Yes | `raw` |

## Controls without a write

| Case | Source | Zazzles path |
| --- | --- | --- |
| JSON parsing | [Pages Router parser](../../tests/scanner/fixtures/prototype-pollution/pages/api/parse.ts.txt) | No record |
| Read-only path walk | [read-path](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/read-path.ts.txt) | No record |
| One-level copy | [shallow](../../tests/scanner/fixtures/prototype-pollution/shapes/pages/api/shallow.ts.txt) | No record |

## How the weakness works

A deep merge and a set-by-path both decide where to write from keys the caller supplies. When a
key names `__proto__`, or the pair `constructor` and `prototype`, the lookup returns a shared
prototype in place of an own object, and the next assignment changes every object that inherits
from it. The fixtures vary how the key reaches the lookup: the keys of a JSON body, a dotted or
bracketed string, an array of parts, or a single computed property name.

A guard has to hold for the key as the lookup uses it. Three fixtures show where a guard falls
short. A deny-list for `__proto__` alone leaves the `constructor.prototype` route. A comparison
on array parts without a type test is passed by a nested array, which a property lookup then
converts to the same string. A branch that creates a missing slot is skipped by an inherited
one, so `if (!store[user]) store[user] = {}` protects nothing.

The `Map` lookup fixture is the opposite case. A `Map` has no entry for a prototype key, so the
handler returns before the write. A scanner that does not read that lookup can only leave the
record for review.

## Tests

Set `ZAZZLES_SCAN` to a scanner binary that supports the `pollution` family, then run the tests
from the repository root.

```bash
ZAZZLES_SCAN=/absolute/path/to/scan node --test tests/scanner/prototype-pollution.test.mjs
```

The labels above were also checked by execution: each exploitable source writes to
`Object.prototype` under its payload in Node, and each guarded source and control stays clean.

[Fixture layout, lockfile controls, and export for Semgrep or other scanners](../../tests/scanner/README.md).
