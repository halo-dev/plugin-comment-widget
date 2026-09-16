import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import baseStyles from './styles/base';

export class CommentPagination extends LitElement {
  @property({ type: Number })
  total = 0;
  @property({ type: Number })
  page = 1;
  @property({ type: Number })
  size = 10;

  private close(restoreFocus = false) {
    const details = this.renderRoot.querySelector('details');
    if (details?.open) {
      details.open = false;
      if (restoreFocus) details.querySelector('summary')?.focus();
    }
  }

  private onOutsideClick = (event: Event) => {
    if (!event.composedPath().includes(this)) this.close();
  };

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.onOutsideClick);
  }

  override disconnectedCallback() {
    document.removeEventListener('click', this.onOutsideClick);
    super.disconnectedCallback();
  }

  private onToggle(event: Event) {
    if (!(event.target as HTMLDetailsElement).open) return;
    const pages =
      this.renderRoot.querySelector<HTMLElement>('.pagination-pages');
    const current = pages?.querySelector<HTMLButtonElement>(
      '[aria-current="page"]'
    );
    if (pages && current) {
      current.focus({ preventScroll: true });
      pages.scrollTop =
        current.offsetTop - (pages.clientHeight - current.offsetHeight) / 2;
    }
  }

  get totalPages() {
    return Math.ceil(this.total / this.size);
  }

  gotoPage(page: number | string) {
    if (page !== this.page) {
      this.dispatchEvent(
        new CustomEvent('page-change', {
          detail: { page },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  override render() {
    return html`
      <ul class="pagination flex items-center gap-4" role="navigation">
        <li>
          <button
            rel="prev"
            type="button"
            aria-label=${msg('Previous')}
            @click=${() => this.gotoPage(this.page - 1)} ?disabled=${this.page === 1}
            class="pagination-button"
          >
            <i class="i-tabler:chevron-left size-4" aria-hidden="true"></i>
            ${msg('Previous')}
          </button>
        </li>
        <li>
          <details @toggle=${this.onToggle} @keydown=${(
            event: KeyboardEvent
          ) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              this.close(true);
            }
          }}>
          <summary aria-label=${msg('Page')}
            class="pagination-trigger inline-flex items-center gap-1 text-sm text-text-1 rounded-base cursor-pointer">
            ${this.page} / ${this.totalPages}
            <i class="i-tabler:chevron-down size-4 text-text-3" aria-hidden="true"></i>
          </summary>
          <div
            class="pagination-pages p-1 text-sm text-text-1 bg-muted-3 border border-solid border-muted-1 rounded-base shadow-lg">
            ${Array.from({ length: this.totalPages }, (_, i) => i + 1).map(
              (page) => html`
              <button type="button" aria-current=${page === this.page ? 'page' : 'false'}
                class="block w-full px-3 py-2 rounded-base hover:bg-muted-2 whitespace-nowrap ${page === this.page ? 'bg-muted-2 font-medium' : ''}"
                @click=${() => {
                  this.close(true);
                  this.gotoPage(page);
                }}>${page} / ${this.totalPages}</button>
            `
            )}
          </div>
          </details>
        </li>
        <li>
          <button
            rel="next"
            type="button"
            aria-label=${msg('Next')}
            @click=${() => this.gotoPage(this.page + 1)}
            ?disabled=${this.page === this.totalPages}
            class="pagination-button"
          >
            ${msg('Next')}
            <i class="i-tabler:chevron-right size-4" aria-hidden="true"></i>
          </button>
        </li>
      </ul>
    `;
  }

  static override styles = [
    ...baseStyles,
    css`
      :host {
        display: flex;
        justify-content: center;
      }

      details { position: relative; }
      summary { list-style: none; }
      summary::-webkit-details-marker { display: none; }

      .pagination-pages {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
        margin-top: 4px;
        max-height: min(16em, calc(100dvh - 16px));
        overflow-y: auto;
      }

      @unocss-placeholder;
    `,
  ];
}

customElements.get('comment-pagination') ||
  customElements.define('comment-pagination', CommentPagination);

declare global {
  interface HTMLElementTagNameMap {
    'comment-pagination': CommentPagination;
  }
}
