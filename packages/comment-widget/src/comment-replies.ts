import type { CommentVo, ReplyVo, ReplyVoList } from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { baseUrlContext, configMapDataContext, toastContext } from './context';
import './reply-item';
import './loading-block';
import './reply-form';
import { msg } from '@lit/localize';
import { ofetch } from 'ofetch';
import type { ToastManager } from './lit-toast';
import baseStyles from './styles/base';
import type { ConfigMapData } from './types';

export class CommentReplies extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @consume({ context: configMapDataContext })
  @state()
  configMapData: ConfigMapData | undefined;

  @property({ type: Object })
  comment: CommentVo | undefined;

  @property({ type: Boolean })
  showReplyForm = false;

  @state()
  replies: ReplyVo[] = [];

  @state()
  page = 1;

  @state()
  hasNext = false;

  @state()
  loading = false;

  @state()
  activeQuoteReply: ReplyVo | undefined = undefined;

  @consume({ context: toastContext, subscribe: true })
  @state()
  toastManager: ToastManager | undefined;

  override render() {
    return html` <div class="replies-main">
      ${
        this.replies.length
          ? html`
            <div class="replies-list mt-3">
              ${repeat(
                this.replies,
                (item) => item.metadata.name,
                (item) =>
                  html`<reply-item
                    .comment=${this.comment}
                    .reply="${item}"
                    .replies=${this.replies}
                    .activeQuoteReply=${this.activeQuoteReply}
                    @set-active-quote-reply=${this.onSetActiveQuoteReply}
                    @reload=${this.fetchReplies}
                  ></reply-item>`
              )}
            </div>
          `
          : ''
      }
      ${this.loading ? html` <loading-block></loading-block>` : ''}
      ${
        this.hasNext && !this.loading
          ? html` <div class="replies-next flex justify-center my-2">
            <button class="replies-next-button pagination-button" @click=${this.fetchNext}>${msg('Load more')}</button>
          </div>`
          : ''
      }
    </div>`;
  }

  onSetActiveQuoteReply(event: CustomEvent) {
    this.activeQuoteReply = event.detail.quoteReply;
  }

  async fetchReplies(options?: { append: boolean }) {
    try {
      this.loading = true;

      // Reload replies list
      if (!options?.append) {
        this.page = 1;
      }

      const data = await ofetch<ReplyVoList>(
        `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments/${
          this.comment?.metadata.name
        }/reply`,
        {
          query: {
            page: this.page || 1,
            size: this.configMapData?.basic.replySize || 10,
          },
        }
      );

      if (options?.append) {
        this.replies = this.replies.concat(data.items);
      } else {
        this.replies = data.items;
      }

      this.hasNext = data.hasNext;
      this.page = data.page;
    } catch (error) {
      console.error(error);
      this.toastManager?.error(
        msg('Failed to load reply list, please try again later')
      );
    } finally {
      this.loading = false;
    }
  }

  async fetchNext() {
    if (this.configMapData?.basic.withReplies) {
      // if withReplies is true, we need to reload the replies list
      await this.fetchReplies({ append: !(this.page === 1) });
      this.page++;
    } else {
      this.page++;
      await this.fetchReplies({ append: true });
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.configMapData?.basic.withReplies) {
      // TODO: Fix ts error
      // Needs @halo-dev/api-client@2.14.0
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.replies = this.comment?.replies.items;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.page = this.comment?.replies.page;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.hasNext = this.comment?.replies.hasNext;
    } else {
      this.fetchReplies();
    }
  }

  static override styles = [
    ...baseStyles,
    css`
      @unocss-placeholder;
    `,
  ];
}

customElements.get('comment-replies') ||
  customElements.define('comment-replies', CommentReplies);

declare global {
  interface HTMLElementTagNameMap {
    'comment-replies': CommentReplies;
  }
}
