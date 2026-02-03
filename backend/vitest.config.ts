import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/vitest.setup.ts'],
    pool: 'forks', // better-sqlite3 não funciona em worker threads
  },
});
