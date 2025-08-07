import { css, html, LitElement } from 'lit';
import './icons/icon-loading';
import type { CommentVoList } from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import {
  baseUrlContext,
  configMapDataContext,
  groupContext,
  kindContext,
  nameContext,
  toastContext,
  versionContext,
} from './context';
import type { ToastManager } from './lit-toast';
import type { ConfigMapData } from './types';
import './comment-pagination';
import './comment-item';
import './loading-block';

export class CommentList extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @consume({ context: groupContext })
  @state()
  group = '';

  @consume({ context: kindContext })
  @state()
  kind = '';

  @consume({ context: nameContext })
  @state()
  name = '';

  @consume({ context: versionContext })
  @state()
  version = '';

  @consume({ context: configMapDataContext })
  @state()
  configMapData: ConfigMapData | undefined;

  @consume({ context: toastContext, subscribe: true })
  @state()
  toastManager: ToastManager | undefined;

  @state()
  comments: CommentVoList = {
    page: 1,
    size: 20,
    total: 0,
    items: [],
    first: true,
    last: false,
    hasNext: false,
    hasPrevious: false,
    totalPages: 0,
  };

  @state()
  loading = false;

  get shouldDisplayPagination() {
    if (this.loading) {
      return false;
    }

    return this.comments.hasNext || this.comments.hasPrevious;
  }

  async onPageChange(e: CustomEvent) {
    const data = e.detail;
    this.comments.page = data.page;
    await this.fetchComments({ scrollIntoView: true });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.fetchComments();

    // Handle comment:reload event
    window.addEventListener('comment:reload', (e: Event) => {
      if (e instanceof CustomEvent) {
        const data = e.detail;
        this.fetchComments({
          page: data.page,
          scrollIntoView: data.scrollIntoView,
        });
      }
    });
  }

  async fetchComments(options?: { page?: number; scrollIntoView?: boolean }) {
    const { page, scrollIntoView } = options || {};
    try {
      if (this.comments.items.length === 0) {
        this.loading = true;
      }

      if (page) {
        this.comments.page = page;
      }

      const queryParams = [
        `group=${this.group}`,
        `kind=${this.kind}`,
        `name=${this.name}`,
        `page=${this.comments.page}`,
        `size=${this.configMapData?.basic.size || 20}`,
        `version=${this.version}`,
        `withReplies=${this.configMapData?.basic.withReplies || false}`,
        `replySize=${this.configMapData?.basic.replySize || 10}`,
      ];

      const response = await fetch(
        `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments?${queryParams.join(
          '&'
        )}`
      );

      if (!response.ok) {
        throw new Error(
          msg('Failed to load comment list, please try again later')
        );
      }

      this.comments = await response.json();
    } catch (error) {
      if (error instanceof Error) {
        this.toastManager?.error(error.message);
      }
    } finally {
      this.loading = false;

      if (scrollIntoView) {
        this.scrollIntoView({
          block: 'start',
          inline: 'start',
          behavior: 'smooth',
        });
      }
    }
  }

  override render() {
    return html`${
      this.loading
        ? html` <loading-block></loading-block>`
        : html`
          <div class="comment-widget__wrapper">
            <div class="comment-widget__stats">
              <span>${msg(html`${this.comments.total} Comments`)}</span>
            </div>

            <div class="comment-widget__list">
              ${repeat(
                this.comments.items,
                (item) => item.metadata.name,
                (item) => html` <comment-item .comment=${item}></comment-item>`
              )}
            </div>
          </div>
        `
    }
    ${
      this.shouldDisplayPagination
        ? html`
          <comment-pagination
            .total=${this.comments.total}
            .page=${this.comments.page}
            .size=${this.comments.size}
            @page-change=${this.onPageChange}
          ></comment-pagination>
        `
        : ''
    }`;
  }

  static override styles = css`
    .comment-widget__wrapper {
      margin-top: 1.2em;
    }

    .comment-widget__stats {
      color: var(--base-color);
      font-size: 0.875em;
      margin: 0.875em 0;
      font-weight: 500;
    }
  `;
}

customElements.get('comment-list') ||
  customElements.define('comment-list', CommentList);

declare global {
  interface HTMLElementTagNameMap {
    'comment-list': CommentList;
  }
}
