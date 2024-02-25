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

  override render() {
    return html`<div class="comment-replies">
      <reply-form .comment=${this.comment}></reply-form>
      ${this.loading
        ? html`<loading-block></loading-block>`
        : html`
            ${repeat(
              this.replies,
              (item) => item.metadata.name,
              (item) =>
                html`<reply-item
                  .comment=${this.comment}
                  .reply="${item}"
                ></reply-item>`
            )}
          `}
    </div>`;
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
    .comment-replies {
      margin-top: 0.5rem;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'comment-replies': CommentReplies;
  }
}
