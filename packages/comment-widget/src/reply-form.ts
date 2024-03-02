import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CommentVo, ReplyRequest, ReplyVo, User } from '@halo-dev/api-client';
import './base-form';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { BaseForm } from './base-form';
import { consume } from '@lit/context';
import { allowAnonymousCommentsContext, baseUrlContext, currentUserContext } from './context';

@customElement('reply-form')
export class ReplyForm extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @consume({ context: currentUserContext, subscribe: true })
  @state()
  currentUser: User | undefined;

  @property({ type: Object })
  comment: CommentVo | undefined;

  @property({ type: Object })
  quoteReply: ReplyVo | undefined;

  @consume({ context: allowAnonymousCommentsContext, subscribe: true })
  @state()
  allowAnonymousComments = false;

  baseFormRef: Ref<BaseForm> = createRef<BaseForm>();

  override render() {
    return html`<base-form ${ref(this.baseFormRef)} @submit="${this.onSubmit}"></base-form>`;
  }

  async onSubmit(e: CustomEvent) {
    e.preventDefault();
    const data = e.detail;

    const { displayName, email, website, content } = data || {};

    const replyRequest: ReplyRequest = {
      raw: content,
      content: content,
      // TODO: support user input
      allowNotification: true,
    };

    if (this.quoteReply) {
      replyRequest.quoteReply = this.quoteReply.metadata.name;
    }

    if (!this.currentUser && !this.allowAnonymousComments) {
      alert('请先登录');
      return;
    }

    if (!this.currentUser && this.allowAnonymousComments) {
      if (!displayName || !email) {
        alert('请先登录或者完善信息');
        return;
      } else {
        replyRequest.owner = {
          displayName: displayName,
          email: email,
          website: website,
        };
      }
    }

    await fetch(
      `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments/${this.comment?.metadata.name}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(replyRequest),
      }
    );

    this.dispatchEvent(new CustomEvent('reload'));

    this.baseFormRef.value?.resetForm();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'reply-form': ReplyForm;
  }
}
