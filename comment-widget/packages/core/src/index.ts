import Comment from "./components/Comment.vue";
import type { App, Plugin } from "vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("Comment", Comment);
  },
};

export default plugin;

export { Comment };
