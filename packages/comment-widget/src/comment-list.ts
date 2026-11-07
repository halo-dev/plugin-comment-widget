import { css, html, LitElement } from 'lit';
import './icons/icon-loading';
import type { CommentWithReplyVoList } from '@halo-dev/api-client';
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
import { when } from 'lit/directives/when.js';
import { ofetch } from 'ofetch';
import baseStyles from './styles/base';
import {
  type CommentManagedDetail,
  fetchVisibleReplyCount,
} from './utils/comment-management';
import { getInitialReplySize } from './utils/reply-pagination';

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
  comments: CommentWithReplyVoList = {
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

  @state()
  loadFailed = false;

  private requestId = 0;

  private pageChangeShouldPush = false;

  private activeReplyItem?: { closeReplyForm(): void };

  private onReplyFormOpen(event: CustomEvent<{ closeReplyForm(): void }>) {
    event.stopPropagation();
    if (this.activeReplyItem === event.detail) {
      return;
    }
    this.activeReplyItem?.closeReplyForm();
    this.activeReplyItem = event.detail;
  }

  private onCommentManaged(event: CustomEvent<CommentManagedDetail>) {
    const { action, restoreFocus, commentName } = event.detail;
    if (action === 'delete' && restoreFocus) {
      this.tabIndex = -1;
      this.focus({ preventScroll: true });
    }
    return this.fetchComments({ replyCountFor: commentName });
  }

  override disconnectedCallback(): void {
    // Invalidate in-flight requests so a late response cannot rewrite the URL.
    this.requestId++;
    this.pageChangeShouldPush = false;
    window.removeEventListener('halo:comment:created', this.onCommentCreated);
    window.removeEventListener('popstate', this.onLocationChange);
    this.activeReplyItem?.closeReplyForm();
    this.activeReplyItem = undefined;
    super.disconnectedCallback();
  }

  get shouldDisplayPagination() {
    if (this.loading) {
      return false;
    }

    return this.comments.hasNext || this.comments.hasPrevious;
  }

  async onPageChange(e: CustomEvent) {
    const data = e.detail;
    this.comments.page = data.page;
    this.pageChangeShouldPush = true;
    await this.fetchComments({ scrollIntoView: true });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.fetchComments({ page: this.readPageFromUrl() });

    // Handle halo:comment:created event, then reload the comment list
    window.addEventListener('halo:comment:created', this.onCommentCreated);
    window.addEventListener('popstate', this.onLocationChange);
  }

  private onCommentCreated = () => {
    this.fetchComments({ page: 1, scrollIntoView: true });
  };

  private onLocationChange = () => {
    this.pageChangeShouldPush = false;
    const page = this.readPageFromUrl() ?? 1;
    if (page !== this.comments.page) {
      void this.fetchComments({ page, scrollIntoView: true });
    }
  };

  private readPageFromUrl() {
    const page = Number(
      new URL(location.href).searchParams.get('comment-page')
    );
    return Number.isInteger(page) && page > 0 ? page : undefined;
  }

  private syncPageToUrl() {
    const url = new URL(location.href);
    const current = url.searchParams.get('comment-page');
    const next = this.comments.page > 1 ? String(this.comments.page) : null;
    if (current === next) {
      this.pageChangeShouldPush = false;
      return;
    }
    if (next === null) {
      url.searchParams.delete('comment-page');
    } else {
      url.searchParams.set('comment-page', next);
    }
    if (this.pageChangeShouldPush) {
      history.pushState(history.state, '', url);
    } else {
      history.replaceState(history.state, '', url);
    }
    this.pageChangeShouldPush = false;
  }

  async fetchComments(options?: {
    page?: number;
    scrollIntoView?: boolean;
    replyCountFor?: string;
  }) {
    const { page, scrollIntoView, replyCountFor } = options || {};
    const requestId = ++this.requestId;
    try {
      if (this.comments.items.length === 0) {
        this.loading = true;
      }

      if (page) {
        this.comments.page = page;
      }

      const replySize = this.configMapData?.basic.replySize ?? 10;
      const withReplySize = this.configMapData?.basic.withReplySize ?? 5;

      const data = await ofetch<CommentWithReplyVoList>(
        `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments`,
        {
          query: {
            group: this.group,
            kind: this.kind,
            name: this.name,
            page: this.comments.page,
            size: this.configMapData?.basic.size || 20,
            version: this.version,
            withReplies: this.configMapData?.basic.withReplies || false,
            replySize: getInitialReplySize(withReplySize, replySize),
          },
        }
      );

      if (requestId !== this.requestId) return;

      const lastPage = Math.max(1, data.totalPages);
      if (data.page > lastPage) {
        await this.fetchComments({ ...options, page: lastPage });
        return;
      }

      if (replyCountFor) {
        const comment = data.items.find(
          (item) => item.metadata.name === replyCountFor
        );
        if (comment) {
          const visibleReplyCount = await fetchVisibleReplyCount(
            this.baseUrl,
            replyCountFor
          );
          comment.status = { ...comment.status, visibleReplyCount };
        }
      }
      if (requestId !== this.requestId) return;
      this.loadFailed = false;
      this.comments = data;
      this.syncPageToUrl();
    } catch (_error) {
      if (requestId !== this.requestId) return;
      this.pageChangeShouldPush = false;
      this.loadFailed = true;
      console.error(_error);
      this.toastManager?.error(
        msg('Failed to load comment list, please try again later')
      );
    } finally {
      if (requestId === this.requestId) {
        this.loading = false;

        if (scrollIntoView) {
          this.scrollIntoView({
            block: 'start',
            inline: 'start',
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'instant'
              : 'smooth',
          });
        }
      }
    }
  }

  override render() {
    return html`${
      this.loading
        ? html` <loading-block></loading-block>`
        : html`
          <div class="comment-list-main mt-5">
            <h3 class="comment-stats font-medium my-3 text-sm text-text-1">
              <span role="status" aria-live="polite">${msg(html`${this.comments.total} Comments`)}</span>
            </h3>

            ${when(
              this.comments.total === 0 && !this.loadFailed,
              () =>
                html`<p class="comment-empty text-sm text-text-3 py-4">${msg('No comments yet')}</p>`
            )}

            <div class="comment-list" @reply-form-open=${this.onReplyFormOpen} @comment-managed=${this.onCommentManaged}>
              ${repeat(
                this.comments.items,
                (item) => item.metadata.name,
                (item) => html` <comment-item .comment=${item}></comment-item>`
              )}
            </div>
          </div>
        `
    }
    ${when(
      this.shouldDisplayPagination,
      () => html`<comment-pagination
            .total=${this.comments.total}
            .page=${this.comments.page}
            .size=${this.comments.size}
            @page-change=${this.onPageChange}
          ></comment-pagination>
        `
    )}
    `;
  }

  static override styles = [
    ...baseStyles,
    css`
    @unocss-placeholder;
  `,
  ];
}

customElements.get('comment-list') ||
  customElements.define('comment-list', CommentList);

declare global {
  interface HTMLElementTagNameMap {
    'comment-list': CommentList;
  }
}
