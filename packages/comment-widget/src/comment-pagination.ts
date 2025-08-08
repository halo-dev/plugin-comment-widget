import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import baseStyles from './styles/base';
import varStyles from './styles/var';

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
        return html`<li class="pagination__dot">
          <i class="i-tabler:dots size-4"></i>
        </li>`;
      } else {
        return html`<li class="pagination__number ${this.page === number ? 'active' : ''}">
          <button @click=${() => this.gotoPage(number)} ?disabled=${number === this.page}>
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
      <ul class="pagination">
        <li class="pagination__button">
          <button @click=${() => this.gotoPage(this.page - 1)} ?disabled=${this.page === 1}>
            <i class="i-tabler:chevron-left size-4"></i>
            ${msg('Previous')}
          </button>
        </li>
        ${this.renderPageNumbers()}
        <li class="pagination__button">
          <button
            @click=${() => this.gotoPage(this.page + 1)}
            ?disabled=${this.page === this.totalPages}
          >
            ${msg('Next')}
            <i class="i-tabler:chevron-right size-4"></i>
          </button>
        </li>
      </ul>
    `;
  }

  static override styles = [
    varStyles,
    baseStyles,
    css`
      :host {
        display: flex;
        justify-content: center;
      }

      .pagination {
        display: flex;
        align-items: center;
        list-style: none;
        gap: 0.2em;
      }

      .pagination li {
        display: inline-flex;
        align-items: center;
        user-select: none;
      }

      .pagination__button button,
      .pagination__number button {
        border-radius: var(--base-border-radius);
        color: var(--base-color);
        font-size: 0.875em;
        display: inline-flex;
        align-items: center;
        font-weight: 600;
        padding: 0.4em 0.875em;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 0.15s;
        border: 1px solid transparent;
      }

      .pagination__button button {
        gap: 0.5em;
      }

      .pagination__number button {
        font-weight: normal;
      }

      .pagination__button button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .pagination__button button:hover,
      .pagination__number button:hover {
        background-color: var(--component-pagination-button-bg-color-hover);
      }

      .pagination__number.active button {
        background-color: var(--component-pagination-button-bg-color-active);
        border: 1px solid var(--component-pagination-button-border-color-active);
      }

      .pagination__dot {
        padding: 0.4em 0.875em;
      }

      @media (max-width: 768px) {
        .pagination__number:not(.active) {
          display: none;
        }
        .pagination__number.active button {
          border: none;
          background-color: inherit;
        }
        .pagination__dot {
          display: none !important;
        }
        .pagination {
          justify-content: space-between;
          width: 100%;
        }
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
