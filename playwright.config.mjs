import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/browser',
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
