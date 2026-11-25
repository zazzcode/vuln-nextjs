# Workshop routes (second MongoDB batch, work in progress)

62 routes under `pages/api/workshop/` use the native `mongodb` driver against the in-memory server, with code in `lib/workshop/`.

**Not scenarios yet.** Some of these routes are vulnerable on purpose and some are not, but no route has a label. There are no scenario IDs, no catalog entries and no tests of either side. `tests/unit/workshop.test.mjs` shows only that each route answers ordinary input. Do not measure a scanner with these routes before an answer key is written from the source and read by a second person who has not seen it. The labelled MongoDB scenarios are in [mongodb.md](mongodb.md).

## Sign-in, codes, badges and passes

| Route | Method |
| --- | --- |
| `/api/workshop/desk/accept` | POST |
| `/api/workshop/desk/arrive` | POST |
| `/api/workshop/desk/badge-in` | POST |
| `/api/workshop/desk/begin` | POST |
| `/api/workshop/desk/checkin` | POST |
| `/api/workshop/desk/clock-in` | POST |
| `/api/workshop/desk/context` | GET |
| `/api/workshop/desk/enter` | POST |
| `/api/workshop/desk/hint` | POST |
| `/api/workshop/desk/import` | POST |
| `/api/workshop/desk/load` | POST |
| `/api/workshop/desk/open-up` | POST |
| `/api/workshop/desk/pass` | GET, POST |
| `/api/workshop/desk/permit` | GET, POST |
| `/api/workshop/desk/refresh` | POST |
| `/api/workshop/desk/renew` | POST |
| `/api/workshop/desk/scan` | POST |
| `/api/workshop/desk/shift` | POST |
| `/api/workshop/desk/start` | POST |
| `/api/workshop/desk/tap` | POST |
| `/api/workshop/desk/terminal` | GET |
| `/api/workshop/desk/unlock` | POST |
| `/api/workshop/desk/verify` | POST |
| `/api/workshop/desk/wave` | POST |

## Loans of parts

| Route | Method |
| --- | --- |
| `/api/workshop/loans/batch` | POST |
| `/api/workshop/loans/bundle` | POST |
| `/api/workshop/loans/cancel` | POST |
| `/api/workshop/loans/give-back` | POST |
| `/api/workshop/loans/hand-back` | POST |
| `/api/workshop/loans/joined` | POST |
| `/api/workshop/loans/linked` | POST |
| `/api/workshop/loans/mine` | POST |
| `/api/workshop/loans/ours` | POST |
| `/api/workshop/loans/withdraw` | POST |

## Parts list

| Route | Method |
| --- | --- |
| `/api/workshop/parts/blend` | GET |
| `/api/workshop/parts/choose` | POST |
| `/api/workshop/parts/combine` | GET |
| `/api/workshop/parts/everything` | GET |
| `/api/workshop/parts/overview` | GET |
| `/api/workshop/parts/select` | POST |

## People list and profile

| Route | Method |
| --- | --- |
| `/api/workshop/people/card` | POST |
| `/api/workshop/people/crew` | POST |
| `/api/workshop/people/finder` | GET |
| `/api/workshop/people/group` | POST |
| `/api/workshop/people/latest` | GET |
| `/api/workshop/people/others` | POST |
| `/api/workshop/people/recent` | GET |
| `/api/workshop/people/roster` | GET |
| `/api/workshop/people/teams` | POST |
| `/api/workshop/people/units` | POST |

## Reports and counts

| Route | Method |
| --- | --- |
| `/api/workshop/stats/amount` | POST |
| `/api/workshop/stats/export` | POST |
| `/api/workshop/stats/headcount` | POST |
| `/api/workshop/stats/heads` | POST |
| `/api/workshop/stats/loads` | POST |
| `/api/workshop/stats/options` | GET |
| `/api/workshop/stats/sample` | GET |
| `/api/workshop/stats/size` | GET |
| `/api/workshop/stats/snapshot` | POST |
| `/api/workshop/stats/sum` | POST |
| `/api/workshop/stats/values` | GET |
| `/api/workshop/stats/weights` | POST |
