import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './user-avatar';
import { timeAgo } from './utils/date';
import resetStyles from './styles/reset';

@customElement('base-comment-item')
export class BaseCommentItem extends LitElement {
  @property({ type: String })
  userAvatar: string | undefined;

  @property({ type: String })
  userDisplayName: string | undefined;

  @property({ type: String })
  creationTime: string | undefined;

  @property({ type: Boolean })
  breath: boolean | undefined;

  @property({ type: String })
  content = '';

  override render() {
    return html`<div
      class="base-comment-item ${this.breath ? 'animate-breath' : ''}"
    >
      <div class="base-comment-item-avatar">
        <user-avatar
          src="${this.userAvatar || ''}"
          alt="${this.userDisplayName || ''}"
        ></user-avatar>
      </div>
      <div class="base-comment-item-main">
        <div class="base-comment-item-meta">
          <div class="base-comment-item-author">${this.userDisplayName}</div>
          <div class="base-comment-item-date">
            ${timeAgo(this.creationTime)}
          </div>
        </div>

        <div class="base-comment-item-content">
          <pre><slot name="pre-content"></slot>${this.content}</pre>
        </div>

        <div class="base-comment-item-actions">
          <slot name="action"></slot>
        </div>

        <slot name="footer"></slot>
      </div>
    </div>`;
  }

  static override styles = [
    resetStyles,
    css`
      .base-comment-item {
        display: flex;
        gap: 0.75rem;
        padding: 1rem 0;
      }

      .base-comment-item-main {
        flex: 1;
      }

      .base-comment-item-meta {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .base-comment-item-author {
        font-weight: 500;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      .base-comment-item-date {
        color: rgb(107 114 128);
        font-size: 0.75rem;
        line-height: 1rem;
      }

      .base-comment-item-content {
        margin-top: 0.5rem;
      }

      .base-comment-item-content pre {
        white-space: pre-wrap;
        overflow-wrap: break-word;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: rgb(31 41 55);
      }

      .base-comment-item-actions {
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
      }

      .animate-breath {
        animation: breath 1s ease-in-out infinite;
      }

      @keyframes breath {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.02);
        }
        100% {
          transform: scale(1);
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'base-comment-item': BaseCommentItem;
  }
}
