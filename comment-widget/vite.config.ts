import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(
      new URL("../src/main/resources/static", import.meta.url)
    ),
    lib: {
      entry: "./src/index.ts",
      formats: ["iife"],
      name: "CommentWidget",
      fileName: (format) => `comment-widget.${format}.js`,
    },
    rollupOptions: {
      output: {
        generatedCode: "es5",
      },
    },
  },
});
