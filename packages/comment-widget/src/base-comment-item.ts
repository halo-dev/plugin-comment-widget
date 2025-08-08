import './user-avatar';
import { msg } from '@lit/localize';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { codeToHtml } from 'shiki/bundle/full';
import baseStyles from './styles/base';
import contentStyles from './styles/content.css?inline';
import varStyles from './styles/var';
import { formatDate, timeAgo } from './utils/date';

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

  protected override firstUpdated() {
    const codeElements = this.shadowRoot?.querySelectorAll('pre>code');
    if (!codeElements?.length) return;

    Promise.all(
      Array.from(codeElements).map(async (codeblock) => {
        const lang =
          this.extractLanguageFromCodeElement(codeblock) || 'plaintext';
        const content = codeblock.textContent || '';

        try {
          const html = await codeToHtml(content, {
            lang,
            theme: 'github-dark',
          });

          if (codeblock.parentElement) {
            codeblock.parentElement.outerHTML = html;
          }
        } catch (error) {
          console.error('Failed to highlight code:', error);
        }
      })
    );
  }

  private extractLanguageFromCodeElement(codeElement: Element): string | null {
    const supportedPrefixes = ['language-', 'lang-'];

    const langClass = Array.from(codeElement.classList).find((className) =>
      supportedPrefixes.some((prefix) => className.startsWith(prefix))
    );

    if (langClass) {
      const prefix = supportedPrefixes.find((p) => langClass.startsWith(p));
      return prefix ? langClass.substring(prefix.length) : null;
    }

    return null;
  }

  override render() {
    return html`<div class="item ${this.breath ? 'item--animate-breath' : ''}">
      <div class="item__avatar">
        <user-avatar
          src="${this.userAvatar || ''}"
          alt="${this.userDisplayName || ''}"
        ></user-avatar>
      </div>
      <div class="item__main">
        <div class="item__meta">
          ${
            this.userWebsite
              ? html`<a
                class="item__author"
                target="_blank"
                href=${this.userWebsite}
              >
                ${this.userDisplayName}
              </a>`
              : html`<div class="item__author">${this.userDisplayName}</div>`
          }
          <div class="item__meta-info" title=${formatDate(this.creationTime)}>
            ${timeAgo(this.creationTime)}
          </div>
          ${
            !this.approved
              ? html`<div class="item__meta-info">${msg('Reviewing')}</div>`
              : ''
          }
        </div>

        <div class="item__content markdown-body">
          <slot name="pre-content"></slot>${unsafeHTML(this.content)}
        </div>

        <div class="item__actions">
          <slot name="action"></slot>
        </div>

        <slot name="footer"></slot>
      </div>
    </div>`;
  }

  static override styles = [
    varStyles,
    baseStyles,
    unsafeCSS(contentStyles),
    css`
      .item {
        display: flex;
        gap: 0.75em;
        padding: 1em 0;
      }

      .item__avatar {
        flex: none;
      }

      .item__main {
        flex: 1 1 auto;
        min-width: 0;
        width: 100%;
      }

      .item__meta {
        display: flex;
        align-items: center;
        gap: 0.75em;
      }

      .item__author {
        color: var(--base-color);
        font-weight: 500;
        font-size: 0.875em;
      }

      .item__meta-info {
        color: var(--base-info-color);
        font-size: 0.75em;
        line-height: 1em;
      }

      .item__content {
        margin-top: 0.5em;
      }

      .item__actions {
        margin-top: 0.5em;
        display: flex;
        align-items: center;
        gap: 0.7em;
      }

      .item--animate-breath {
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

customElements.get('base-comment-item') ||
  customElements.define('base-comment-item', BaseCommentItem);

declare global {
  interface HTMLElementTagNameMap {
    'base-comment-item': BaseCommentItem;
  }
}
