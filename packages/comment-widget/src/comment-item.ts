import type { CommentVo } from '@halo-dev/api-client';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import baseStyles from './styles/base';
import './comment-replies';
import './user-avatar';
import './base-comment-item';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { ofetch } from 'ofetch';
import { getPolicyInstance } from './avatar/avatar-policy';
import type { CommentReplies } from './comment-replies';
import { LS_UPVOTED_COMMENTS_KEY } from './constant';
import { baseUrlContext, configMapDataContext } from './context';
import type { ConfigMapData } from './types';

export class CommentItem extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @property({ type: Object })
  comment: CommentVo | undefined;

  @consume({ context: configMapDataContext })
  @state()
  configMapData: ConfigMapData | undefined;

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

    if (this.configMapData?.basic.withReplies) {
      this.showReplies = true;
      this.showReplyForm = false;
    }

    this.upvoteCount = this.comment?.stats.upvote || 0;
  }

  checkUpvotedStatus() {
    const upvotedComments = JSON.parse(
      localStorage.getItem(LS_UPVOTED_COMMENTS_KEY) || '[]'
    );

    if (upvotedComments.includes(this.comment?.metadata.name)) {
      this.upvoted = true;
    }
  }

  async handleUpvote() {
    const upvotedComments = JSON.parse(
      localStorage.getItem(LS_UPVOTED_COMMENTS_KEY) || '[]'
    );

    if (upvotedComments.includes(this.comment?.metadata.name)) {
      return;
    }

    const voteRequest = {
      name: this.comment?.metadata.name,
      plural: 'comments',
      group: 'content.halo.run',
    };

    await ofetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/trackers/upvote`, {
      method: 'POST',
      body: voteRequest,
    });

    upvotedComments.push(this.comment?.metadata.name);
    localStorage.setItem(
      LS_UPVOTED_COMMENTS_KEY,
      JSON.stringify(upvotedComments)
    );

    this.upvoteCount += 1;
    this.upvoted = true;
    this.checkUpvotedStatus();
  }

  handleShowReplies() {
    this.showReplies = !this.showReplies;

    if (!this.configMapData?.basic.withReplies) {
      this.showReplyForm = !this.showReplyForm;
    }
  }

  onReplyCreated() {
    this.commentRepliesRef.value?.fetchReplies();
    this.showReplies = true;
  }

  handleToggleReplyForm() {
    this.showReplyForm = !this.showReplyForm;
  }

  override render() {
    return html`<base-comment-item
      .userAvatar="${handleCommentAvatar(this.comment)}"
      .userDisplayName="${this.comment?.owner.displayName}"
      .content="${this.comment?.spec.content || ''}"
      .creationTime="${this.comment?.spec.creationTime}"
      .approved=${this.comment?.spec.approved}
      .userWebsite=${this.comment?.spec.owner.annotations?.website}
      .ua=${this.comment?.spec.userAgent}
    >
      <button slot="action" class="icon-button group -ml-2" type="button" @click="${this.handleUpvote}" aria-label=${msg('Upvote')}>
        <div class="icon-button-icon">
        ${
          this.upvoted
            ? html`<i slot="icon" class="i-mingcute-heart-fill size-4 text-red-500" aria-hidden="true"></i>`
            : html`<i slot="icon" class="i-mingcute-heart-line size-4" aria-hidden="true"></i>`
        }
        </div>
        <span class="icon-button-text">${`${this.upvoteCount || 0}`}</span>
      </button>

      ${
        this.configMapData?.basic.withReplies &&
        this.comment?.status?.visibleReplyCount === 0
          ? ''
          : html`
          <button slot="action" class="icon-button group" type="button" @click="${this.handleShowReplies}" aria-label=${msg('Show replies')}>
            <div class="icon-button-icon ">
              <i slot="icon" class="i-tabler:message-circle size-4" aria-hidden="true"></i>
            </div>
            <span class="icon-button-text">${this.comment?.status?.visibleReplyCount || 0}</span>
          </button>`
      }
      ${
        this.configMapData?.basic.withReplies
          ? html`
          <button slot="action" class="icon-button group" type="button" @click="${this.handleToggleReplyForm}" aria-label=${this.showReplyForm ? msg('Cancel reply') : msg('Add reply')}>
            <div class="icon-button-icon ">
              <i slot="icon" class="i-tabler:message-circle-plus size-4" aria-hidden="true"></i>
            </div>
            <span class="icon-button-text">${this.showReplyForm ? msg('Cancel reply') : msg('Add reply')}</span>
          </button>`
          : ''
      }

      <div slot="footer">
        ${
          this.showReplyForm
            ? html`<div class="mt-2">
              <reply-form
                @reload=${this.onReplyCreated}
                .comment=${this.comment}
              ></reply-form>
            </div>`
            : ''
        }
        ${
          this.showReplies
            ? html`<comment-replies
              ${ref(this.commentRepliesRef)}
              .comment="${this.comment}"
              .showReplyForm=${this.showReplyForm}
            ></comment-replies>`
            : ``
        }
      </div>
    </base-comment-item>`;
  }

  static override styles = [
    ...baseStyles,
    css`
      @unocss-placeholder;
    `,
  ];
}

customElements.get('comment-item') ||
  customElements.define('comment-item', CommentItem);

function handleCommentAvatar(
  comment: CommentVo | undefined
): string | undefined {
  const avatarPolicy = getPolicyInstance();
  if (avatarPolicy === undefined) {
    return comment?.owner.avatar;
  }
  return avatarPolicy.applyCommentPolicy(comment);
}

declare global {
  interface HTMLElementTagNameMap {
    'comment-item': CommentItem;
  }
}
