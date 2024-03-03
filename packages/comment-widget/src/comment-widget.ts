import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CommentVoList, User } from '@halo-dev/api-client';
import { repeat } from 'lit/directives/repeat.js';
import baseStyles from './styles/base';
import { provide } from '@lit/context';
import {
  allowAnonymousCommentsContext,
  baseUrlContext,
  currentUserContext,
  emojiDataUrlContext,
  groupContext,
  kindContext,
  nameContext,
  versionContext,
} from './context';
import './comment-form';
import './comment-item';
import './comment-pagination';
import varStyles from './styles/var';

@customElement('comment-widget')
export class CommentWidget extends LitElement {
  @provide({ context: baseUrlContext })
  @property({ type: String })
  baseUrl = '';

  @provide({ context: kindContext })
  @property({ type: String })
  kind = '';

  @provide({ context: groupContext })
  @property({ type: String })
  group = '';

  @provide({ context: versionContext })
  @property({ type: String })
  version = '';

  @provide({ context: nameContext })
  @property({ type: String })
  name = '';

  @provide({ context: emojiDataUrlContext })
  @property({ type: String })
  emojiDataUrl = 'https://unpkg.com/@emoji-mart/data';

  @provide({ context: currentUserContext })
  @state()
  currentUser: User | undefined;

  @provide({ context: allowAnonymousCommentsContext })
  @state()
  allowAnonymousComments = false;

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

  override render() {
    return html`<div class="comment-widget">
      <comment-form @reload="${() => this.fetchComments(1)}"></comment-form>
      ${this.loading
        ? html`<loading-block></loading-block>`
        : html`
            <div class="comment-widget__wrapper">
              <div class="comment-widget__stats">
                <span>${this.comments.total} 条评论</span>
              </div>

              <div class="comment-widget__list">
                ${repeat(
                  this.comments.items,
                  (item) => item.metadata.name,
                  (item) => html`<comment-item .comment=${item}></comment-item>`
                )}
              </div>
            </div>
          `}
      ${this.shouldDisplayPagination
        ? html`
            <comment-pagination
              .total=${this.comments.total}
              .page=${this.comments.page}
              .size=${this.comments.size}
              @page-change=${this.onPageChange}
            ></comment-pagination>
          `
        : ''}
    </div>`;
  }

  async fetchGlobalInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/actuator/globalinfo`, {
        method: 'get',
        credentials: 'same-origin',
      });

      const data = await response.json();
      this.allowAnonymousComments = data.allowAnonymousComments;
    } catch (error) {
      console.error('Failed to fetch global info', error);
    }
  }

  async fetchCurrentUser() {
    const response = await fetch(`${this.baseUrl}/apis/api.console.halo.run/v1alpha1/users/-`);
    const data = await response.json();
    this.currentUser = data.user.metadata.name === 'anonymousUser' ? undefined : data.user;
  }

  async fetchComments(page?: number) {
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
        `size=${this.comments.size}`,
        `version=${this.version}`,
      ];

      const response = await fetch(
        `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments?${queryParams.join('&')}`
      );
      const data = await response.json();
      this.comments = data;
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      this.loading = false;

      this.scrollIntoView({ block: 'start', inline: 'start', behavior: 'smooth' });
    }
  }

  async onPageChange(e: CustomEvent) {
    const data = e.detail;
    this.comments.page = data.page;
    await this.fetchComments();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.fetchCurrentUser();
    this.fetchComments();
    this.fetchGlobalInfo();
  }

  static override styles = [
    varStyles,
    baseStyles,
    css`
      :host {
        width: 100%;
      }

      .comment-widget {
        width: 100%;
      }

      .comment-widget__wrapper {
        margin-top: 1.2rem;
      }

      .comment-widget__stats {
        margin: 0.875rem 0;
        font-weight: 500;
        color: initial;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'comment-widget': CommentWidget;
  }
}
