import type { CommentVo } from '@halo-dev/api-client';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import baseStyles from './styles/base';
import './comment-replies';
import './user-avatar';
import './base-comment-item';
import './base-comment-item-action';
import { consume } from '@lit/context';
import { baseUrlContext, withRepliesContext } from './context';
import { LS_UPVOTED_COMMENTS_KEY } from './constant';
import varStyles from './styles/var';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { CommentReplies } from './comment-replies';

export class CommentItem extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @property({ type: Object })
  comment: CommentVo | undefined;

  @consume({ context: withRepliesContext, subscribe: true })
  @state()
  withReplies = false;

  @state()
  showReplies = false;

  @state()
  showReplyForm = false;

  @state()
  upvoted = false;

  @state()
  upvoteCount = 0;

  commentRepliesRef: Ref<CommentReplies> = createRef<CommentReplies>();

  override connectedCallback(): void {
    super.connectedCallback();
    this.checkUpvotedStatus();

    if (this.withReplies) {
      this.showReplies = true;
      this.showReplyForm = false;
    }

    this.upvoteCount = this.comment?.stats.upvote || 0;
  }

  checkUpvotedStatus() {
    const upvotedComments = JSON.parse(localStorage.getItem(LS_UPVOTED_COMMENTS_KEY) || '[]');

    if (upvotedComments.includes(this.comment?.metadata.name)) {
      this.upvoted = true;
    }
  }

  async handleUpvote() {
    const upvotedComments = JSON.parse(localStorage.getItem(LS_UPVOTED_COMMENTS_KEY) || '[]');

    if (upvotedComments.includes(this.comment?.metadata.name)) {
      return;
    }

    const voteRequest = {
      name: this.comment?.metadata.name,
      plural: 'comments',
      group: 'content.halo.run',
    };

    await fetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/trackers/upvote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteRequest),
    });

    upvotedComments.push(this.comment?.metadata.name);
    localStorage.setItem(LS_UPVOTED_COMMENTS_KEY, JSON.stringify(upvotedComments));

    this.upvoteCount += 1;
    this.upvoted = true;
    this.checkUpvotedStatus();
  }

  handleShowReplies() {
    this.showReplies = !this.showReplies;

    if (!this.withReplies) {
      this.showReplyForm = !this.showReplyForm;
    }
  }

  onReplyCreated() {
    this.commentRepliesRef.value?.fetchReplies();
    this.showReplies = true;
  }

  override render() {
    return html`<base-comment-item
      .userAvatar="${this.comment?.owner.avatar}"
      .userDisplayName="${this.comment?.owner.displayName}"
      .content="${this.comment?.spec.content || ''}"
      .creationTime="${this.comment?.spec.creationTime}"
      .approved=${this.comment?.spec.approved}
      .userWebsite=${this.comment?.spec.owner.annotations?.['website']}
    >
      <base-comment-item-action
        slot="action"
        class="item__action--upvote"
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
              <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
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

      ${this.withReplies && this.comment?.status?.visibleReplyCount === 0
        ? ''
        : html`<base-comment-item-action
            slot="action"
            .text="${(this.comment?.status?.visibleReplyCount || 0) + ''}"
            @click="${this.handleShowReplies}"
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
          </base-comment-item-action>`}
      ${this.withReplies
        ? html` <base-comment-item-action
            slot="action"
            .text=${this.showReplyForm ? '取消回复' : '加入回复'}
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
                d="M12.007 19.98A9.869 9.869 0 0 1 7.7 19L3 20l1.3-3.9C1.976 12.663 2.874 8.228 6.4 5.726c3.526-2.501 8.59-2.296 11.845.48c1.992 1.7 2.93 4.04 2.747 6.34M16 19h6m-3-3v6"
              />
            </svg>
          </base-comment-item-action>`
        : ''}

      <div slot="footer">
        ${this.showReplyForm
          ? html`<div class="item__reply-form">
              <reply-form @reload=${this.onReplyCreated} .comment=${this.comment}></reply-form>
            </div>`
          : ''}
        ${this.showReplies
          ? html`<comment-replies
              ${ref(this.commentRepliesRef)}
              .comment="${this.comment}"
              .showReplyForm=${this.showReplyForm}
            ></comment-replies>`
          : ``}
      </div>
    </base-comment-item>`;
  }

  static override styles = [
    varStyles,
    baseStyles,
    css`
      .item__action--upvote {
        margin-left: -0.5em;
      }

      .item__reply-form {
        margin-top: 0.5em;
      }
    `,
  ];
}

customElements.get('comment-item') || customElements.define('comment-item', CommentItem);

declare global {
  interface HTMLElementTagNameMap {
    'comment-item': CommentItem;
  }
}
