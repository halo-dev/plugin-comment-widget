import Comment from "@/components/Comment.vue";
import "@/styles/tailwind.css";
import "@/styles/dark.css";
import "@/styles/index.css";
import "@halo-dev/components/dist/style.css";
import type { App, Plugin } from "vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("Comment", Comment);
  },
};

export default plugin;

export { Comment };
