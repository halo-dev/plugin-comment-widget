import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('base-comment-item-action')
export class BaseCommentItemAction extends LitElement {
  @property({ type: String })
  text = '';

  override render() {
    return html`
      <div slot="action" class="base-comment-item-action">
        <div class="base-comment-item-action-icon">
          <slot name="icon"></slot>
        </div>
        <span class="base-comment-item-action-text"> ${this.text} </span>
      </div>
    `;
  }

  static override styles = css`
    .base-comment-item-action {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      margin-right: 0.5rem;
    }

    .base-comment-item-action:hover .base-comment-item-action-icon {
      background-color: rgb(243 244 246);
    }

    .base-comment-item-action-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 0.15s;
      padding: 0.45rem;
    }

    .base-comment-item-action-icon ::slotted(svg) {
      width: 1rem;
      height: 1rem;
      color: rgb(75 85 99);
    }

    .base-comment-item-action-text {
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: rgb(75 85 99);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'base-comment-item-action': BaseCommentItemAction;
  }
}
