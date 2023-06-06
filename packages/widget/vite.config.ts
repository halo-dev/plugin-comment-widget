import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import path from "path";
import copy from "rollup-plugin-copy-merge";

export default defineConfig({
  plugins: [
    Vue(),
    copy({
      targets: [
        {
          src: "./node_modules/@halo-dev/comment-widget/dist/emoji/all.json",
          dest: fileURLToPath(
            new URL("../../src/main/resources/static/emoji", import.meta.url)
          ),
        },
      ],
      verbose: true,
    }),
  ],
  define: {
    "process.env": process.env,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(
      new URL("../../src/main/resources/static", import.meta.url)
    ),
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["iife"],
      name: "CommentWidget",
      fileName: (format) => `comment-widget.${format}.js`,
    },
    sourcemap: false,
  },
  optimizeDeps: {
    include: ["vue"],
  },
});
