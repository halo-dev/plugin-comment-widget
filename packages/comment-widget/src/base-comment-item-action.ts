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
      color: var(--component-comment-item-action-color);
      width: 1rem;
      height: 1rem;
    }

    .base-comment-item-action-text {
      color: var(--component-comment-item-action-color);
      user-select: none;
    }

    .base-comment-item-action:hover .base-comment-item-action-icon {
      background-color: var(--component-comment-item-action-bg-color-hover);
    }

    .base-comment-item-action:hover .base-comment-item-action-text {
      color: var(--component-comment-item-action-color-hover);
    }

    .base-comment-item-action:hover .base-comment-item-action-icon ::slotted(svg) {
      color: var(--component-comment-item-action-color-hover);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'base-comment-item-action': BaseCommentItemAction;
  }
}
