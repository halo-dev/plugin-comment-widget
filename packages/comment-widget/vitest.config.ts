import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vitest/config';
import widgetConfig from './vite.config.ts';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/*.test.{ts,mjs}'],
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: [
            ...(widgetConfig.resolve?.alias ?? []),
            {
              find: /^@halo-dev\/comment-widget$/,
              replacement: fileURLToPath(
                new URL('./src/index.ts', import.meta.url)
              ),
            },
          ],
        },
        plugins: [
          UnoCSS({ mode: 'shadow-dom', configFile: './uno.config.ts' }),
        ],
        test: {
          name: 'browser',
          include: ['tests/*.browser.test.js'],
          setupFiles: ['tests/browser-setup.js'],
          testTimeout: 30000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
