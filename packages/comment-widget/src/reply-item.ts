import { CommentVo, ReplyVo } from '@halo-dev/api-client';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import resetStyles from './styles/reset';
import './user-avatar';
import './base-comment-item';
import './base-comment-item-action';
import './reply-form';
import { LS_UPVOTED_REPLIES_KEY } from './constant';
import { consume } from '@lit/context';
import { baseUrlContext } from './context';

@customElement('reply-item')
export class ReplyItem extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @property({ type: Object })
  comment: CommentVo | undefined;

  @property({ type: Object })
  reply: ReplyVo | undefined;

  @state()
  showReplyForm = false;

  @state()
  upvoted = false;

  @state()
  upvoteCount = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.checkUpvotedStatus();

    this.upvoteCount = this.reply?.stats.upvote || 0;
  }

  checkUpvotedStatus() {
    const upvotedReplies = JSON.parse(
      localStorage.getItem(LS_UPVOTED_REPLIES_KEY) || '[]'
    );

    if (upvotedReplies.includes(this.reply?.metadata.name)) {
      this.upvoted = true;
    }
  }

  async handleUpvote() {
    const upvotedReplies = JSON.parse(
      localStorage.getItem(LS_UPVOTED_REPLIES_KEY) || '[]'
    );

    if (upvotedReplies.includes(this.reply?.metadata.name)) {
      return;
    }

    const voteRequest = {
      name: this.reply?.metadata.name,
      plural: 'replies',
      group: 'content.halo.run',
    };

    await fetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/trackers/upvote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteRequest),
    });

    upvotedReplies.push(this.reply?.metadata.name);
    localStorage.setItem(
      LS_UPVOTED_REPLIES_KEY,
      JSON.stringify(upvotedReplies)
    );

    this.upvoteCount += 1;
    this.upvoted = true;
    this.checkUpvotedStatus();
  }

  override render() {
    return html`
      <base-comment-item
        .userAvatar="${this.reply?.owner.avatar}"
        .userDisplayName="${this.reply?.owner.displayName}"
        .content="${this.reply?.spec.content || ''}"
        .creationTime="${this.reply?.metadata.creationTimestamp ?? undefined}"
      >
        <base-comment-item-action
          slot="action"
          class="reply-item-action-upvote"
          .text="${this.upvoteCount + ''}"
          @click="${this.handleUpvote}"
        >
          ${this.upvoted
            ? html`<svg
                slot="icon"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <g
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                >
                  <path d="M0 0h24v24H0z" />
                  <path
                    fill="red"
                    d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037.033l.034-.03a6 6 0 0 1 4.733-1.44l.246.036a6 6 0 0 1 3.364 10.008l-.18.185l-.048.041l-7.45 7.379a1 1 0 0 1-1.313.082l-.094-.082l-7.493-7.422A6 6 0 0 1 6.979 3.074z"
                  />
                </g>
              </svg>`
            : html`<svg
                slot="icon"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"
                />
              </svg>`}
        </base-comment-item-action>

        <base-comment-item-action
          slot="action"
          @click="${() => (this.showReplyForm = !this.showReplyForm)}"
        >
          <svg
            slot="icon"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
          >
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m3 20l1.3-3.9C1.976 12.663 2.874 8.228 6.4 5.726c3.526-2.501 8.59-2.296 11.845.48c3.255 2.777 3.695 7.266 1.029 10.501C16.608 19.942 11.659 20.922 7.7 19L3 20"
            />
          </svg>
        </base-comment-item-action>

        ${this.showReplyForm
          ? html`
              <div class="reply-form-wrapper" slot="footer">
                <reply-form
                  .comment=${this.comment}
                  .quoteReply=${this.reply}
                ></reply-form>
              </div>
            `
          : ``}
      </base-comment-item>
    `;
  }

  static override styles = [
    resetStyles,
    css`
      .reply-item-action-upvote {
        margin-left: -0.5rem;
      }

      .reply-form-wrapper {
        margin-top: 0.5rem;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'reply-item': ReplyItem;
  }
}
