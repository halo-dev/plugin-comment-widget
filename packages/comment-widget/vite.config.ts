import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import Icons from "unplugin-icons/vite";
import path from "path";
import copy from "rollup-plugin-copy-merge";

export default defineConfig({
  plugins: [
    Vue(),
    Icons({
      compiler: "vue3",
    }),
    copy({
      targets: [
        {
          src: "./node_modules/emoji-mart-vue-fast/data/all.json",
          dest: "./dist/emoji",
        },
      ],
      verbose: true,
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "HaloCommentWidget",
      formats: ["es", "iife"],
      fileName: (format) => `halo-comment-widget.${format}.js`,
    },
    rollupOptions: {
      external: ["vue", "vue-router"],
      output: {
        globals: {
          vue: "Vue",
          "vue-router": "VueRouter",
        },
        exports: "named",
      },
    },
  },
});
