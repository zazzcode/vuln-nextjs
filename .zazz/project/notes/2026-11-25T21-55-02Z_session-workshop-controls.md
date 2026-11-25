# Session: inputs that reach three workshop controls

Date-time: 2026-11-25T21:55:02Z (16:55:02, UTC-5).

## Starting point

The handoff for the second MongoDB batch read as unfinished. Every step in it had already reached `main` (`82f0bbb`) and CI was green there. The matrix was run again before anything was changed, and all nine checks passed.

## What was found

- All 64 routes of the second batch were read against the source. Every label agrees with the answer key, and every technique in the batch plan has a vulnerable route and a safe one.
- Three safe controls had tests that could not fail. The payload never reached the key the control reads:

| Control | It does not read | What the old test showed |
| --- | --- | --- |
| `loans/bundle` | `where` | no change |
| `loans/linked` | `from`, `mine`, `theirs` | status 400 |
| `people/others` | `teams` | the default listing |

## The evidence

Each control was broken in the way its protection could regress. `bundle` lost its fixed borrower and its `$in`. `linked` lost the projection on its `people` join. `others` lost its fixed `board` exclusion. With all three broken, the old cases passed 150 of 150.

## The change (`5abe5f7`)

- `tests/workshop-cases.mjs`: each of the three cases sends one more input that carries the key the control reads and still has its effect on the vulnerable route. With the same three controls broken, the new cases fail on exactly those three protected tests.
- `docs/vulnerabilities/workshop.md`: those inputs in the answer key, and a technique-coverage matrix checked against the catalog (64 routes, 30 sources, 34 controls).
- The exploit labs of MONGO-033, 039, 042 and 051 show the same inputs.
- The guides that described only the first MongoDB batch were completed: `docs/architecture.md`, `docs/adding-scenarios.md`, the module page of the first batch, and `QUICK-START.md`. The home page and the navigation now link to the second batch.

No route source, catalog entry, manifest or dependency changed.

## Verified

On the changed tree: lint, 526 unit tests, `scenario:check`, `audit:check`, the build, 196 API tests, 19 browser tests, and the React2Shell build and probe. Every curl command in the 30 exploit labs was run against a live server (84 commands), and each response matched its documentation.

## Lessons

- A control is tested only by an input that reaches its query. A status 400 is not a result.
- Prove that a new test can fail. The first input written for `loans/bundle` did not fail the broken control: it carried no `state`, so the update changed nothing.
- A check script needs its own check. Two helper scripts in this session reported a clean result while checking nothing.
- Relay is not measurement. The server facts in the [project-state note](2026-11-25T21-55-02Z_project-state.md) were measured again before they were recorded.
- A handoff kept outside the repository, with no mark that it was out of date, sent a fresh session back over finished work. Dated notes in the repository are the fix.

## Open

- The "safe by server refusal" labels cite the refusal of operator objects. A BSON regular expression inside `$in` is evaluated as a pattern, but it cannot arrive in the JSON bodies those routes accept. One sentence in the disputable-label record of `workshop.md` would make that scope explicit.
