import { msg } from '@lit/localize';
import { css, html, LitElement, type PropertyValues, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import mediumZoom, { type Zoom } from 'medium-zoom';
import baseStyles from './styles/base';
import contentStyles from './styles/content.css?inline';
import { cleanHtml } from './utils/html';

let imageZoom: Zoom | undefined;

export class CommentContent extends LitElement {
  @property({ type: String })
  content: string = '';

  private zoomedImage?: HTMLImageElement;

  private openImage(event: MouseEvent | KeyboardEvent) {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (event instanceof KeyboardEvent && !['Enter', ' '].includes(event.key)) {
      return;
    }
    event.preventDefault();
    if (imageZoom?.getZoomedImage()) return;

    if (!imageZoom) {
      const template = document.createElement('template');
      template.innerHTML = `<style>
        .medium-zoom-overlay { z-index: 2147483646; }
        .medium-zoom-image--opened { z-index: 2147483647; }
        .medium-zoom-image--opened:focus-visible { outline: 2px solid white; }
        @media (prefers-reduced-motion: reduce) {
          /* Keep transitionend for Medium Zoom's open/close lifecycle. */
          .medium-zoom-overlay, .medium-zoom-image--opened {
            transition-duration: 0.001ms !important;
          }
        }
      </style>`;
      imageZoom = mediumZoom({
        margin: 24,
        background: 'rgba(0, 0, 0, 0.85)',
        template,
      });
    }

    const zoom = imageZoom;
    this.zoomedImage = target;
    target.addEventListener(
      'medium-zoom:closed',
      () => {
        queueMicrotask(() => zoom.detach(target));
        this.zoomedImage = undefined;
        if (this.isConnected && this.renderRoot.contains(target)) {
          target.focus({ preventScroll: true });
        }
      },
      { once: true }
    );
    // Both the normal and srcset clones inherit this marker.
    target.setAttribute('data-halo-cw-zoom', '');
    const opened = zoom.attach(target).open({ target });
    target.removeAttribute('data-halo-cw-zoom');
    void opened.then(() => {
      // close() is ignored during the opening animation.
      if (!this.isConnected || !this.renderRoot.contains(target)) {
        void zoom.close();
        return;
      }
      const clones = Array.from(
        document.querySelectorAll<HTMLImageElement>('[data-halo-cw-zoom]')
      );
      const topmost = clones[clones.length - 1];
      for (const clone of clones) {
        clone.tabIndex = clone === topmost ? 0 : -1;
        clone.setAttribute('role', 'button');
        clone.setAttribute('aria-label', msg('Close image'));
        if (clone !== topmost) clone.setAttribute('aria-hidden', 'true');
        clone.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            void zoom.close();
          }
        });
      }
      topmost.focus({ preventScroll: true });
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.zoomedImage) void imageZoom?.close();
  }

  private applyLinkAttributes() {
    const anchors =
      this.shadowRoot?.querySelectorAll<HTMLAnchorElement>('.content a');

    anchors?.forEach((anchor) => {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer nofollow ugc';
    });
  }

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
          const { codeToHtml } = await import('./shiki-bundle');

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

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    if (_changedProperties.has('content')) {
      if (this.zoomedImage) void imageZoom?.close();
      this.applyLinkAttributes();
      this.renderRoot.querySelectorAll('.content img').forEach((image) => {
        const anchor = image.closest('a');
        if (anchor) {
          // Split the link around the image, preserving linked text on both sides.
          const range = document.createRange();
          range.selectNodeContents(anchor);
          range.setStartAfter(image);
          const trailing = anchor.cloneNode(false) as HTMLAnchorElement;
          trailing.removeAttribute('name');
          trailing.append(range.extractContents());
          anchor.after(image, trailing);
          for (const link of [anchor, trailing]) {
            if (!link.textContent?.trim() && !link.querySelector('img'))
              link.remove();
          }
        }
        image.setAttribute('tabindex', '0');
        image.setAttribute('role', 'button');
        image.setAttribute(
          'aria-label',
          image.getAttribute('alt') || msg('Zoom image')
        );
      });
    }
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
      <div class="content" @click=${this.openImage} @keydown=${this.openImage}>${unsafeHTML(cleanHtml(this.content))}</div>
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

      .content img {
        cursor: zoom-in;
      }

      .medium-zoom-image--hidden {
        visibility: hidden;
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
