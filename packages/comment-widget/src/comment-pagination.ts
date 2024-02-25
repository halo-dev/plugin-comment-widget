import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('comment-pagination')
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
    let startPage, endPage;

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
        return html`<li><span>...</span></li>`;
      } else {
        return html`<li>
          <button
            @click=${() => this.gotoPage(number)}
            ?disabled=${number === this.page}
          >
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
        <li>
          <button
            @click=${() => this.gotoPage(this.page - 1)}
            ?disabled=${this.page === 1}
          >
            上一页
          </button>
        </li>
        ${this.renderPageNumbers()}
        <li>
          <button
            @click=${() => this.gotoPage(this.page + 1)}
            ?disabled=${this.page === this.totalPages}
          >
            下一页
          </button>
        </li>
      </ul>
    `;
  }

  static override styles = css`
    :host {
      display: flex;
      justify-content: center;
    }
    .pagination {
      display: flex;
      list-style: none;
      padding: 0;
    }
    .pagination li {
      margin: 0 2px;
      cursor: pointer;
    }
    .pagination li.disabled {
      cursor: default;
      opacity: 0.5;
    }
  `;
}
declare global {
  interface HTMLElementTagNameMap {
    'comment-pagination': CommentPagination;
  }
}
