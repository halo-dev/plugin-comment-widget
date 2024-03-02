import { CommentVo, ReplyVo } from '@halo-dev/api-client';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { consume } from '@lit/context';
import { baseUrlContext } from './context';
import './reply-item';
import './loading-block';
import './reply-form';

@customElement('comment-replies')
export class CommentReplies extends LitElement {
  @consume({ context: baseUrlContext })
  @property({ attribute: false })
  baseUrl = '';

  @property({ type: Object })
  comment: CommentVo | undefined;

  @state()
  replies: ReplyVo[] = [];

  @state()
  loading = false;

  @state()
  activeQuoteReply: ReplyVo | undefined = undefined;

  override render() {
    return html`<div class="comment-replies-wrapper">
      <reply-form
        @reload=${this.fetchReplies}
        .comment=${this.comment}
      ></reply-form>
      ${this.loading
        ? html`<loading-block></loading-block>`
        : html`
            <div class="comment-replies">
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
          `}
    </div>`;
  }

  onSetActiveQuoteReply(event: CustomEvent) {
    this.activeQuoteReply = event.detail.quoteReply;
  }

  async fetchReplies() {
    this.loading = true;
    const response = await fetch(
      `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments/${this.comment?.metadata.name}/reply`
    );
    const data = await response.json();
    this.replies = data.items;
    this.loading = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.fetchReplies();
  }

  static override styles = css`
    .comment-replies-wrapper {
      margin-top: 0.5rem;
    }

    .comment-replies {
      margin-top: 0.875rem;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'comment-replies': CommentReplies;
  }
}
