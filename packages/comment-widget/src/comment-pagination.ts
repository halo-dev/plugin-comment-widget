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
        <li class="inline-flex items-center gap-1 text-sm text-text-3 hover:text-text-1 transition-all">
          <select name="pagination-value" id="pagination-value" class="pagination-select appearance-none outline-none bg-transparent" @change=${(e: Event) => this.gotoPage((e.target as HTMLSelectElement).value)}>
            ${Array.from({ length: this.totalPages }, (_, i) => i + 1).map((page) => html`<option .selected=${page === this.page} value=${page}>${page} / ${this.totalPages}</option>`)}
          </select>
          <i class="i-tabler:chevron-down size-4" aria-hidden="true"></i>
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
