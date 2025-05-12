console.log('VITEST CONFIG LOADED FROM frontend/vitest.config.ts');

/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { mergeConfig } from 'vite';
import viteConfig from './vite.config';

const config = defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/user-event'],
        },
      },
    },
    css: false,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules/', 'e2e/', 'src/main.tsx', 'src/vite-env.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});

export default mergeConfig(viteConfig, config);
