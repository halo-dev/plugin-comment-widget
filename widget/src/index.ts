import { createApp } from "vue";
import { Comment } from "@halo-dev/comment-widget";
import "@halo-dev/comment-widget/dist/style.css";

export function init(
  el: string,
  style: string,
  props: Record<string, unknown>
) {
  const parent = document.querySelector(el);

  if (!parent) {
    console.error("Element not found", el);
  }

  const container = document.createElement("div");
  const root = document.createElement("div");
  const styleEl = document.createElement("link");
  const shadowDOM = container.attachShadow?.({ mode: "open" }) || container;
  styleEl.setAttribute("rel", "stylesheet");
  styleEl.setAttribute("href", style);
  shadowDOM.appendChild(styleEl);
  shadowDOM.appendChild(root);
  parent?.appendChild(container);

  const app = createApp(Comment, props);
  app.mount(root);
}
