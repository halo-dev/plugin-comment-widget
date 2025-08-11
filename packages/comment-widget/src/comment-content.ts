import { css, html, LitElement, type PropertyValues, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import sanitizeHtml from 'sanitize-html';
import baseStyles from './styles/base';
import contentStyles from './styles/content.css?inline';

export class CommentContent extends LitElement {
  @property({ type: String })
  content: string = '';

  protected override firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    const codeElements = this.shadowRoot?.querySelectorAll('pre>code');
    if (!codeElements?.length) return;

    Promise.all(
      Array.from(codeElements).map(async (codeblock) => {
        const lang =
          this.extractLanguageFromCodeElement(codeblock) || 'plaintext';
        const content = codeblock.textContent || '';

        try {
          const { codeToHtml } = await import('shiki/bundle/full');

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

  protected override render() {
    return html`
      <div class="content">${unsafeHTML(
        sanitizeHtml(this.content, {
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            code: ['class'],
          },
        })
      )}</div>
    `;
  }

  static override styles = [
    ...baseStyles,
    unsafeCSS(contentStyles),
    css`
      :host {
        display: block;
        width: 100%;
      }

      @unocss-placeholder;
    `,
  ];
}

customElements.get('comment-content') ||
  customElements.define('comment-content', CommentContent);

declare global {
  interface HTMLElementTagNameMap {
    'comment-content': CommentContent;
  }
}
