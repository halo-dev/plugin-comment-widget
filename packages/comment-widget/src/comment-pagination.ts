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

  renderPageNumbers() {
    const pageNumbers = [];
    const currentPage = this.page;
    const totalPageNumbersToShow = 3;
    let startPage: number;
    let endPage: number;

    if (this.totalPages <= totalPageNumbersToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      if (currentPage <= 3) {
        startPage = 1;
        endPage = totalPageNumbersToShow;
      } else if (currentPage + 2 >= this.totalPages) {
        startPage = this.totalPages - (totalPageNumbersToShow - 1);
        endPage = this.totalPages;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) pageNumbers.push('...');
      pageNumbers.push(this.totalPages);
    }

    return pageNumbers.map((number) => {
      if (number === '...') {
        return html`<li class="px-3.5 inline-flex items-center justify-center">
          <i class="i-tabler:dots size-4"></i>
        </li>`;
      } else {
        return html`<li>
          <button class="pagination-button px-3.5 ${this.page === number ? 'bg-gray-100' : ''}" @click=${() => this.gotoPage(number)} ?disabled=${number === this.page}>
            ${number}
          </button>
        </li>`;
      }
    });
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
      <ul class="pagination flex items-center gap-2" role="navigation">
        <li>
          <button
            rel="prev"
            type="button"
            aria-label=${msg('Previous')}
            @click=${() => this.gotoPage(this.page - 1)} ?disabled=${this.page === 1}
            class="pagination-button"
          >
            <i class="i-tabler:chevron-left size-4"></i>
            ${msg('Previous')}
          </button>
        </li>
        ${this.renderPageNumbers()}
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
            <i class="i-tabler:chevron-right size-4"></i>
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
