import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rslib/core';

const PLUGIN_NAME = 'PluginCommentWidget';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      autoExternal: false,
    },
  ],
  output: {
    target: 'web',
    minify: true,
    cleanDistPath: true,
    filename: {
      js: (pathData) => {
        if (pathData.chunk.name === 'index') {
          return 'comment-widget.js';
        }
        return '[name].[contenthash:8].js';
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
