#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v node >/dev/null
command -v pnpm >/dev/null || { echo 'Install pnpm 11.25.0 (see README.md).'; exit 1; }
pnpm install --frozen-lockfile
printf '%s\n' 'Setup complete. Run pnpm dev and, in another terminal, pnpm dev:react2shell.'
