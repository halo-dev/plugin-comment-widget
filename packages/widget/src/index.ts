import { createApp } from "vue";
import { Comment } from "@halo-dev/comment-widget";
import "./styles/style.css";
import "@halo-dev/comment-widget/dist/style.css";
import axios from "axios";

export function init(
  el: string,
  style: string,
  props: Record<string, unknown>
) {
  const parent = document.querySelector(el) as HTMLElement;

  if (!parent) {
    console.error("Element not found", el);
  }

  const container = document.createElement("div");
  const root = document.createElement("div");
  const loadingHtml = `
  <div>
    <style>
      .loading-container {
        text-align: center;
      }

      .loading-container svg {
        width: 1.25rem; 
        height: 1.25rem; 
        display: inline; 
        margin-right: 0.5rem; 
        animation: spin 1s linear infinite;
      }
    
      .loading-container svg circle {
        opacity: 0.25;
      }

      .loading-container svg path {
        opacity: 0.75;
      }
      
      @keyframes spin {
          from {
              transform: rotate(0deg);
          }
          to {
              transform: rotate(360deg);
          }
      }
    </style>
    <div class="loading-container">
      <div role="status">
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
        </svg>
      </div>
    </div>
  </div>
  `;
  root.innerHTML = loadingHtml;
  const styleEl = document.createElement("link");
  const shadowDOM = container.attachShadow?.({ mode: "open" }) || container;
  styleEl.setAttribute("rel", "stylesheet");
  styleEl.setAttribute("href", style);
  shadowDOM.appendChild(styleEl);
  shadowDOM.appendChild(root);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && parent.childElementCount === 0) {
        parent.appendChild(container);
      }
    });
  });
  observer.observe(parent as Element);

  styleEl.addEventListener("load", function () {
    const app = createApp(Comment, {
      ...props,
      emojiData: async () => {
        const { data } = await axios.get(
          "/plugins/PluginCommentWidget/assets/static/emoji/all.json"
        );
        return data;
      },
    });
    app.mount(root);
    root.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 500,
      fill: "forwards",
    });
  });
}
