# Quick start

```bash
corepack enable      # once — supplies the pinned pnpm 11.25.0
pnpm install
pnpm dev             # main lab → http://127.0.0.1:3000
```

SCA fixture (separate terminal):

```bash
pnpm build:react2shell && pnpm start:react2shell   # → http://127.0.0.1:3001
```

## Try a scenario in 60 seconds

1. Open <http://127.0.0.1:3000/sql/login> — press **Load injection example**, run the **unsafe** mode (login bypassed as `admin`), then switch to **safe** (401 for the same payload).
2. Open <http://127.0.0.1:3000/xss/unsafe/reflected> — press **Load XSS sample** and **Render payload**, then run `window.__zazzlesXss` in the browser console (it says `reflected-marker`). The same payload on `/xss/safe/reflected` is inert text.
3. Open <http://127.0.0.1:3000/mongo/mongo-001>: send the same input to each MongoDB sign-in route and compare. The answers are in [`mongodb.md`](docs/vulnerabilities/mongodb.md). The first request downloads `mongod` once (about 80 MB).
4. Browse <http://127.0.0.1:3000/vulnerabilities> for the full index; per-scenario exploit commands are in [`docs/vulnerabilities/`](docs/vulnerabilities/index.md).

## Run the test suite

```bash
pnpm lint             # ESLint
pnpm test             # Vitest unit suite (real PGlite and in-memory MongoDB, direct handler imports)
pnpm scenario:check   # scenario sources match the committed hash manifest
pnpm audit:check      # pnpm audit --prod matches the committed snapshot

pnpm build && pnpm start &          # then:
pnpm test:api                      # Playwright API pairs (request fixture — no browser needed)

pnpm exec playwright install chromium   # once, only for the browser suite
pnpm test:browser                   # real browser execution / non-execution

pnpm build:react2shell && pnpm start:react2shell &   # then:
pnpm test:react2shell               # RSC runtime execution marker
```

`pnpm audit --prod` exits nonzero **by design** (the vulnerable pins are the point). `audit:check` compares against the committed ground truth instead.

## Reset the lab

`POST /api/lab/reset` (buttons on the SQL/XSS pages) re-seeds the in-memory databases. Restarting the server resets it too.

---

Details: [README](README.md) · [setup and testing](docs/setup-and-testing.md) · [scenario docs](docs/vulnerabilities/index.md)

> ⚠️ Deliberately vulnerable — isolated local use only, synthetic data only.
