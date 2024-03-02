import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('base-comment-item-action')
export class BaseCommentItemAction extends LitElement {
  @property({ type: String })
  text = '';

  override render() {
    return html`
      <div slot="action" class="item-action">
        <div class="item-action__icon">
          <slot name="icon"></slot>
        </div>
        <span class="item-action__text"> ${this.text} </span>
      </div>
    `;
  }

  static override styles = css`
    .item-action {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      margin-right: 0.5rem;
    }

    .item-action__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 0.15s;
      padding: 0.45rem;
    }

    .item-action__icon ::slotted(svg) {
      color: var(--component-comment-item-action-color);
      width: 1rem;
      height: 1rem;
    }

    .item-action__text {
      color: var(--component-comment-item-action-color);
      user-select: none;
    }

    .item-action:hover .item-action__icon {
      background-color: var(--component-comment-item-action-bg-color-hover);
    }

    .item-action:hover .item-action__text {
      color: var(--component-comment-item-action-color-hover);
    }

    .item-action:hover .item-action__icon ::slotted(svg) {
      color: var(--component-comment-item-action-color-hover);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'base-comment-item-action': BaseCommentItemAction;
  }
}
