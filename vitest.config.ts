import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import '@testing-library/jest-dom/vitest';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 40,
        functions: 25,
        branches: 40,
        statements: 40,
      },
    },
  },
});
