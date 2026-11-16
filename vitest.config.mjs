import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.mjs'],
    // PGlite compiles WASM on first use; allow generous timeouts.
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
