import './user-avatar';
import { msg } from '@lit/localize';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { codeToHtml } from 'shiki/bundle/full';
import baseStyles from './styles/base';
import contentStyles from './styles/content.css?inline';
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
    return html`<div class="item flex gap-3 py-4 ${this.breath ? 'animate-breath' : ''}">
      <div class="item-avatar flex-none">
        <user-avatar
          src="${this.userAvatar || ''}"
          alt="${this.userDisplayName || ''}"
          href=${this.userWebsite}
        ></user-avatar>
      </div>
      <div class="item-main flex-[1_1_auto] min-w-0 w-full">
        <div class="item-meta flex items-center gap-3">
          ${
            this.userWebsite
              ? html`<a
                class="item-author font-medium text-sm"
                target="_blank"
                href=${this.userWebsite}
                rel="noopener noreferrer"
              >
                ${this.userDisplayName}
              </a>`
              : html`<div class="item-author font-medium text-sm">${this.userDisplayName}</div>`
          }
          <div class="item-meta-info text-xs text-text-2" title=${formatDate(this.creationTime)}>
            ${timeAgo(this.creationTime)}
          </div>
          ${
            !this.approved
              ? html`<div class="item-meta-info text-xs text-text-2">${msg('Reviewing')}</div>`
              : ''
          }
        </div>

        <div class="item-content mt-2 markdown-body">
          <slot name="pre-content"></slot>${unsafeHTML(this.content)}
        </div>

        <div class="item-actions mt-2 flex items-center gap-3">
          <slot name="action"></slot>
        </div>

        <slot name="footer"></slot>
      </div>
    </div>`;
  }

  static override styles = [
    ...baseStyles,
    unsafeCSS(contentStyles),
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
