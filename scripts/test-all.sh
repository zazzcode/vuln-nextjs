#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm test
pnpm test:http
pnpm test:sca
pnpm test:react2shell
