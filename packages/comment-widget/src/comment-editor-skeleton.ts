import { css, html, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

export class CommentEditorSkeleton extends LitElement {
  protected override render() {
    return html`<div
      class="border rounded-base border-solid border-muted-1"
    >
      <div class="animate-pulse p-4">
        <div class="h-4 mt-1 mb-8.75px w-20 bg-muted-1 rounded"></div>
      </div>
      <div class="py-2.5 px-3 flex gap-1 m-0 items-center">
        ${repeat(
          Array(8),
          () => html`
            <div
              role="button"
              class="size-7 flex items-center justify-center cursor-pointer"
            >
              <div class="size-5 animate-pulse bg-muted-1 rounded-base"></div>
            </div>
          `
        )}
      </div>
    </div>`;
  }

  static override styles = [
    css`
      :host {
        display: block;
        width: 100%;
      }

      @unocss-placeholder;
    `,
  ];
}

customElements.get('comment-editor-skeleton') ||
  customElements.define('comment-editor-skeleton', CommentEditorSkeleton);

declare global {
  interface HTMLElementTagNameMap {
    'comment-editor-skeleton': CommentEditorSkeleton;
  }
}
