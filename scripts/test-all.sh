#!/usr/bin/env bash
# Full local verification matrix — the same set CI runs.
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm lint
pnpm test
pnpm scenario:check
pnpm audit:check
pnpm build
pnpm start & SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
for i in $(seq 1 60); do curl -sf http://127.0.0.1:3000/ >/dev/null && break; sleep 1; done
pnpm test:api
pnpm test:browser
pnpm build:react2shell
pnpm start:react2shell & FIXTURE_PID=$!
trap 'kill $SERVER_PID $FIXTURE_PID 2>/dev/null || true' EXIT
for i in $(seq 1 60); do curl -sf http://127.0.0.1:3001/ >/dev/null && break; sleep 1; done
pnpm test:react2shell
