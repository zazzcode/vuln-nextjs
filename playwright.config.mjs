import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Two suites, kept separate for clarity:
  //   tests/api/     — API-only specs (request fixture, no browser launched,
  //                    runs without `playwright install`): pnpm test:api
  //   tests/browser/ — real-Chromium execution specs (needs the browser
  //                    binary): pnpm test:browser
  testDir: 'tests',
  timeout: 60000,
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: process.env.LAB_URL || 'http://127.0.0.1:3000' },
  // Requires `pnpm build` first; reuses a server that is already running.
  webServer: {
    command: 'corepack pnpm start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
