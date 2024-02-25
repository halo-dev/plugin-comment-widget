import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CommentVo, ReplyRequest, ReplyVo } from '@halo-dev/api-client';
import './base-form';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { BaseForm } from './base-form';
import { consume } from '@lit/context';
import { baseUrlContext } from './context';

@customElement('reply-form')
export class ReplyForm extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @property({ type: Object })
  comment: CommentVo | undefined;

  @property({ type: Object })
  quoteReply: ReplyVo | undefined;

  baseFormRef: Ref<BaseForm> = createRef<BaseForm>();

  override render() {
    return html`<base-form
      ${ref(this.baseFormRef)}
      @submit="${this.onSubmit}"
    ></base-form>`;
  }

  async onSubmit(e: CustomEvent) {
    e.preventDefault();
    const data = e.detail;

    const replyRequest: ReplyRequest = {
      raw: data.content,
      content: data.content,
      allowNotification: true,
      owner: {
        displayName: data.displayName,
        email: data.email,
        website: data.website,
      },
    };

    if (this.quoteReply) {
      replyRequest.quoteReply = this.quoteReply.metadata.name;
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

    this.baseFormRef.value?.resetForm();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'reply-form': ReplyForm;
  }
}
