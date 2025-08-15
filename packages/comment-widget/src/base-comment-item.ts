import './user-avatar';
import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import baseStyles from './styles/base';
import { formatDate, timeAgo } from './utils/date';
import './commenter-ua-bar';
import { consume } from '@lit/context';
import { configMapDataContext } from './context';
import type { ConfigMapData } from './types';
import './comment-content';

export class BaseCommentItem extends LitElement {
  @property({ type: String })
  userAvatar: string | undefined;

  @property({ type: String })
  userDisplayName: string | undefined;

  @property({ type: String })
  userWebsite: string | undefined;

  @property({ type: String })
  creationTime: string | undefined;

  @property({ type: Boolean })
  approved: boolean | undefined;

  @property({ type: Boolean })
  breath: boolean | undefined;

  @property({ type: String })
  content = '';

  @property({ type: String })
  ua: string = '';

  @consume({ context: configMapDataContext })
  @state()
  configMapData: ConfigMapData | undefined;

  override render() {
    return html`<div class="item flex gap-3 py-4 ${this.breath ? 'animate-breath' : ''}">
      <div class="item-avatar flex-none">
        <user-avatar
          src="${this.userAvatar || ''}"
          alt="${this.userDisplayName || ''}"
          href=${this.userWebsite}
        ></user-avatar>
      </div>
      <div class="item-main flex-[1_1_auto] min-w-0 w-full">
        <div class="item-meta flex items-center gap-3 flex-wrap">
          ${
            this.userWebsite
              ? html`<a
                class="item-author font-medium text-sm text-text-1 hover:underline"
                target="_blank"
                href=${this.userWebsite}
                rel="noopener noreferrer"
              >
                ${this.userDisplayName}
              </a>`
              : html`<span class="item-author font-medium text-sm text-text-1">${this.userDisplayName}</span>`
          }
          
          ${this.ua && this.configMapData?.basic.showCommenterDevice ? html`<commenter-ua-bar .ua=${this.ua}></commenter-ua-bar>` : ''}

          <time class="item-meta-info text-xs text-text-3" title=${formatDate(this.creationTime)}>
            ${timeAgo(this.creationTime)}
          </time>

          ${
            !this.approved
              ? html`<div class="item-meta-info text-xs text-text-3">${msg('Reviewing')}</div>`
              : ''
          }
        </div>

        <div class="item-content mt-2.5 space-y-2.5"><slot name="pre-content"></slot><comment-content .content=${this.content}></comment-content></div>

        <div class="item-actions mt-2 flex items-center gap-3">
          <slot name="action"></slot>
        </div>

        <slot name="footer"></slot>
      </div>
    </div>`;
  }

  static override styles = [
    ...baseStyles,
    css`
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

      @unocss-placeholder;
    `,
  ];
}

customElements.get('base-comment-item') ||
  customElements.define('base-comment-item', BaseCommentItem);

declare global {
  interface HTMLElementTagNameMap {
    'base-comment-item': BaseCommentItem;
  }
}
