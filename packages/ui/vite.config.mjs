import path from 'node:path';
import { viteConfig } from '@halo-dev/ui-plugin-bundler-kit/vite';

const MANIFEST_PATH = '../../src/main/resources/plugin.yaml';
const OUT_DIR_PROD = '../../src/main/resources/ui';
const OUT_DIR_DEV = '../../build/resources/main/ui';

export default viteConfig({
  manifestPath: MANIFEST_PATH,
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('comment-'),
      },
    },
  },
  vite: ({ mode }) => {
    return {
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname, 'src'),
        },
      },
      build: {
        outDir: mode === 'production' ? OUT_DIR_PROD : OUT_DIR_DEV,
      },
    };
  },
});
