import type { CommentVo, ReplyVo } from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { ofetch } from 'ofetch';
import {
  baseUrlContext,
  groupContext,
  kindContext,
  nameContext,
} from './context';
import baseStyles from './styles/base';
import type { CommentTarget } from './utils/comment-link';
import './comment-item';
import './loading-block';

export class CommentDetail extends LitElement {
  @consume({ context: baseUrlContext }) @state() baseUrl = '';
  @consume({ context: groupContext }) @state() group = '';
  @consume({ context: kindContext }) @state() kind = '';
  @consume({ context: nameContext }) @state() name = '';
  @property({ attribute: false }) target!: CommentTarget;
  @state() private comment?: CommentVo;
  @state() private reply?: ReplyVo;
  @state() private loading = true;
  @state() private error = '';
  private requestId = 0;
  private activeReplyItem?: { closeReplyForm(): void };

  override connectedCallback() {
    super.connectedCallback();
    void this.load();
  }

  override disconnectedCallback() {
    ++this.requestId;
    this.activeReplyItem?.closeReplyForm();
    super.disconnectedCallback();
  }

  private async load() {
    const requestId = ++this.requestId;
    this.loading = true;
    this.error = '';
    try {
      const commentName = encodeURIComponent(this.target.commentName);
      const comment = await ofetch<CommentVo>(
        `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments/${commentName}`,
        { retry: 0 }
      );
      if (requestId !== this.requestId) return;
      const subject = comment.spec.subjectRef;
      if (
        subject.group !== this.group ||
        subject.kind !== this.kind ||
        subject.name !== this.name
      ) {
        this.error = msg('Comment not found or unavailable');
        return;
      }
      const reply = this.target.replyName
        ? await ofetch<ReplyVo>(
            `${this.baseUrl}/apis/api.commentwidget.halo.run/v1alpha1/comments/${commentName}/replies/${encodeURIComponent(this.target.replyName)}`,
            { retry: 0 }
          )
        : undefined;
      if (requestId !== this.requestId) return;
      this.comment = comment;
      this.reply = reply;
    } catch (error) {
      if (requestId !== this.requestId) return;
      this.error =
        (error as { status?: number }).status === 404
          ? msg('Comment not found or unavailable')
          : msg('Failed to load comment, please try again');
    } finally {
      if (requestId === this.requestId) {
        this.loading = false;
        await this.updateComplete;
        if (
          requestId === this.requestId &&
          this.isConnected &&
          this.comment &&
          !this.target.replyName &&
          !this.error
        ) {
          this.scrollIntoView({ block: 'start' });
        }
      }
    }
  }

  private returnToList() {
    this.dispatchEvent(
      new CustomEvent('comment-list-requested', {
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`<div class="detail mt-5" @comment-managed=${() => this.load()} @reply-form-open=${(
      event: CustomEvent<{ closeReplyForm(): void }>
    ) => {
      event.stopPropagation();
      if (this.activeReplyItem !== event.detail)
        this.activeReplyItem?.closeReplyForm();
      this.activeReplyItem = event.detail;
    }}>
      <button type="button" class="back text-sm text-primary-1" @click=${this.returnToList}>${msg('Back to comments')}</button>
      ${this.loading ? html`<loading-block></loading-block>` : this.error ? html`<p role="status" class="text-sm text-text-2 my-3">${this.error}</p>` : keyed(this.requestId, html`<comment-item .comment=${this.comment} .detail=${true} .targetReply=${this.reply}></comment-item>`)}
    </div>`;
  }

  static override styles = [
    ...baseStyles,
    css`
    :host { display: block; scroll-margin-top: 5rem; }
    .back { cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
    .back:focus-visible { outline: 2px solid var(--halo-cw-primary-1-color); outline-offset: 2px; }
    @unocss-placeholder;
  `,
  ];
}

customElements.get('comment-detail') ||
  customElements.define('comment-detail', CommentDetail);
