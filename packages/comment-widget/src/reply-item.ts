import type { CommentVo, ReplyVo } from '@halo-dev/api-client';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import baseStyles from './styles/base';
import './user-avatar';
import './base-comment-item';
import './reply-form';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { when } from 'lit/directives/when.js';
import { ofetch } from 'ofetch';
import { getPolicyInstance } from './avatar/avatar-policy';
import { LS_UPVOTED_REPLIES_KEY } from './constant';
import { baseUrlContext } from './context';

export class ReplyItem extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @property({ type: Object })
  comment: CommentVo | undefined;

  @property({ type: Object })
  reply: ReplyVo | undefined;

  @property({ type: Object })
  activeQuoteReply: ReplyVo | undefined = undefined;

  @property({ type: Array })
  replies: ReplyVo[] = [];

  @state()
  showReplyForm = false;

  @state()
  upvoted = false;

  @state()
  upvoteCount = 0;

  get quoteReply() {
    const { quoteReply: quoteReplyName } = this.reply?.spec || {};
    if (!quoteReplyName) {
      return undefined;
    }
    return this.replies.find((reply) => reply.metadata.name === quoteReplyName);
  }

  get isQuoteReplyHovered() {
    return this.activeQuoteReply?.metadata.name === this.reply?.metadata.name;
  }

  handleSetActiveQuoteReply(quoteReply?: ReplyVo) {
    this.dispatchEvent(
      new CustomEvent('set-active-quote-reply', {
        detail: { quoteReply },
        bubbles: true,
        composed: true,
      })
    );
  }

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

  handleToggleReplyForm() {
    this.showReplyForm = !this.showReplyForm;
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

    await ofetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/trackers/upvote`, {
      method: 'POST',
      body: voteRequest,
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
        .userAvatar="${handleReplyAvatar(this.reply)}"
        .userDisplayName="${this.reply?.owner.displayName}"
        .content="${this.reply?.spec.content || ''}"
        .creationTime="${this.reply?.spec.creationTime}"
        .approved=${this.reply?.spec.approved}
        .breath=${this.isQuoteReplyHovered}
        .userWebsite=${this.reply?.spec.owner.annotations?.website}
        .ua=${this.reply?.spec.userAgent}
        .private=${this.comment?.spec.hidden || this.reply?.spec.hidden}
      >
        <button slot="action" class="icon-button group -ml-2" type="button" @click="${this.handleUpvote}" aria-label=${msg('Upvote')}>
          <div class="icon-button-icon ">
          ${when(
            this.upvoted,
            () =>
              html`<i slot="icon" class="i-mingcute-heart-fill size-4 text-red-500" aria-hidden="true"></i>`,
            () =>
              html`<i slot="icon" class="i-mingcute-heart-line size-4" aria-hidden="true"></i>`
          )}
          </div>
          <span class="icon-button-text">${`${this.upvoteCount || 0}`}</span>
        </button>
        <button slot="action" class="icon-button group" type="button" @click="${this.handleToggleReplyForm}" aria-label=${this.showReplyForm ? msg('Cancel reply') : msg('Reply')}>
          <div class="icon-button-icon ">
            <i slot="icon" class="i-tabler:message-circle-plus size-4" aria-hidden="true"></i>
          </div>
          <span class="icon-button-text">${this.showReplyForm ? msg('Cancel reply') : msg('Reply')}</span>
        </button>
        ${when(
          this.showReplyForm,
          () => html`<div class="reply-form mt-2" slot="footer">
                <reply-form
                  .comment=${this.comment}
                  .quoteReply=${this.reply}
                  @reload=${() => this.dispatchEvent(new CustomEvent('reload'))}
                ></reply-form>
              </div>`
        )}
        ${when(
          this.quoteReply,
          () => html`<span
                slot="pre-content"
                @mouseenter=${() => this.handleSetActiveQuoteReply(this.quoteReply)}
                @mouseleave=${() => this.handleSetActiveQuoteReply()}
                class="quote-badge cursor-pointer inline-flex items-center gap-1 px-2 py-1.5 rounded-base bg-muted-3 text-text-2 hover:-translate-y-0.5 hover:text-text-1 hover:bg-muted-2 transition-all text-sm font-medium"
                ><i class="i-ic:round-reply" aria-hidden="true"></i><span>${this.quoteReply?.owner.displayName}</span>
              </span>
              <br slot="pre-content" />`
        )}
      </base-comment-item>
    `;
  }

  static override styles = [
    ...baseStyles,
    css`
      @unocss-placeholder;
    `,
  ];
}

customElements.get('reply-item') ||
  customElements.define('reply-item', ReplyItem);

function handleReplyAvatar(reply: ReplyVo | undefined): string | undefined {
  const avatarPolicy = getPolicyInstance();
  if (avatarPolicy === undefined) {
    return reply?.owner.avatar;
  }
  return avatarPolicy.applyReplyPolicy(reply);
}

declare global {
  interface HTMLElementTagNameMap {
    'reply-item': ReplyItem;
  }
}
