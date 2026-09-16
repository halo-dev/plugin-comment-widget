import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
} from '@floating-ui/dom';
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

  private cleanupPosition?: () => void;

  private close(restoreFocus = false) {
    this.cleanupPosition?.();
    this.cleanupPosition = undefined;
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
    this.cleanupPosition?.();
    document.removeEventListener('click', this.onOutsideClick);
    super.disconnectedCallback();
  }

  private onToggle(event: Event) {
    this.cleanupPosition?.();
    this.cleanupPosition = undefined;
    const details = event.target as HTMLDetailsElement;
    if (!details.open || !this.isConnected) return;
    const trigger = details.querySelector('summary');
    const pages = details.querySelector<HTMLElement>('.pagination-pages');
    if (!trigger || !pages) return;
    let focusCurrent = true;
    this.cleanupPosition = autoUpdate(trigger, pages, async () => {
      const { x, y } = await computePosition(trigger, pages, {
        strategy: 'fixed',
        placement: 'bottom',
        middleware: [
          offset(4),
          flip({ padding: 8 }),
          shift({ padding: 8 }),
          size({
            padding: 8,
            apply({ availableHeight }) {
              pages.style.maxHeight = `min(16em, ${Math.max(0, availableHeight)}px)`;
            },
          }),
        ],
      });
      if (!details.open || !this.isConnected) return;
      Object.assign(pages.style, { left: `${x}px`, top: `${y}px` });
      if (focusCurrent) {
        focusCurrent = false;
        const current = pages.querySelector<HTMLButtonElement>(
          '[aria-current="page"]'
        );
        if (current) this.focusPage(current);
      }
    });
  }

  private focusPage(button: HTMLButtonElement) {
    const pages = button.parentElement;
    if (!pages) return;
    pages.querySelectorAll('button').forEach((item) => {
      item.tabIndex = item === button ? 0 : -1;
    });
    button.focus({ preventScroll: true });
    pages.scrollTop =
      button.offsetTop - (pages.clientHeight - button.offsetHeight) / 2;
  }

  private onKeydown(event: KeyboardEvent) {
    const details = event.currentTarget as HTMLDetailsElement;
    if (!details.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
      return;
    }
    const buttons = Array.from(
      details.querySelectorAll<HTMLButtonElement>('.pagination-pages button')
    );
    const index = buttons.indexOf(
      this.shadowRoot?.activeElement as HTMLButtonElement
    );
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(index + 1, buttons.length - 1);
        break;
      case 'ArrowUp':
        next = Math.max(index - 1, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = buttons.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (buttons[next]) this.focusPage(buttons[next]);
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
          <details @toggle=${this.onToggle} @keydown=${this.onKeydown}
            @focusout=${(event: FocusEvent) => {
              if (
                !(event.currentTarget as HTMLElement).contains(
                  event.relatedTarget as Node | null
                )
              )
                this.close();
            }}>
          <summary aria-label=${`${msg('Page')} ${this.page} / ${this.totalPages}`}
            class="pagination-trigger inline-flex items-center gap-1 text-sm text-text-1 rounded-base cursor-pointer">
            ${this.page} / ${this.totalPages}
            <i class="i-tabler:chevron-down size-4 text-text-3" aria-hidden="true"></i>
          </summary>
          <div
            class="pagination-pages p-1 text-sm text-text-1 bg-muted-3 border border-solid border-muted-1 rounded-base shadow-lg">
            ${Array.from({ length: this.totalPages }, (_, i) => i + 1).map(
              (page) => html`
              <button type="button" tabindex=${page === this.page ? 0 : -1} aria-current=${page === this.page ? 'page' : 'false'}
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
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10;
        max-height: 16em;
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
