import UnoCSS from 'unocss/vite';
import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  experimental: {
    enableNativePlugin: true,
  },
  plugins: [
    dts() as Plugin,
    UnoCSS({
      mode: 'shadow-dom',
      configFile: './uno.config.ts',
    }),
  ],
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['es'],
      fileName: 'index',
    },
  },
});
