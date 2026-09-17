import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rslib/core';

const PLUGIN_NAME = 'PluginCommentWidget';

export default defineConfig({
  lib: [
    {
      format: 'esm',
    },
  ],
  output: {
    autoExternal: false,
    target: 'web',
    minify: true,
    cleanDistPath: true,
    filename: {
      css: 'index.css',
      js: (pathData) => {
        if (pathData.chunk.name === 'index') {
          return 'comment-widget.js';
        }
        // modern-module can retain contenthash after imports change; invalidate together.
        return '[name].[fullhash:8].js';
      },
    },
    publicPath: `/plugins/${PLUGIN_NAME}/assets/static/`,
    distPath: {
      root: fileURLToPath(
        new URL('../../src/main/resources/static', import.meta.url)
      ),
    },
  },
});
