import type {
  CommentVo,
  ReplyRequest,
  ReplyVo,
  User,
} from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import './base-form';
import type { BaseForm } from './base-form';
import {
  allowAnonymousCommentsContext,
  baseUrlContext,
  currentUserContext,
  toastContext,
} from './context';
import type { ToastManager } from './lit-toast';
import { type SubmissionEvent, submitCommentOrReply } from './utils/submission';

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

  @consume({ context: toastContext, subscribe: true })
  @state()
  toastManager: ToastManager | undefined;

  @state()
  submitting = false;

  @state()
  captcha = '';

  baseFormRef: Ref<BaseForm> = createRef<BaseForm>();

  override connectedCallback(): void {
    super.connectedCallback();

    setTimeout(() => {
      this.scrollIntoView({
        block: 'center',
        inline: 'start',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
      this.baseFormRef.value?.setFocus();
    }, 0);
  }

  override render() {
    return html` <base-form
      .submitting=${this.submitting}
      .captcha=${this.captcha}
      .hidePrivateCheckbox=${true}
      .commentName=${this.comment?.metadata.name || ''}
      .quoteReplyName=${this.quoteReply?.metadata.name || ''}
      ${ref(this.baseFormRef)}
      @submit=${(e: SubmissionEvent) => e.detail.waitUntil(this.onSubmit(e))}
    ></base-form>`;
  }

  onSubmit(e: SubmissionEvent) {
    const data = e.detail;
    const { content } = data || {};

    const replyRequest: ReplyRequest = {
      raw: content,
      content: content,
      // TODO: support user input
      allowNotification: true,
    };

    if (this.quoteReply) {
      replyRequest.quoteReply = this.quoteReply.metadata.name;
    }

    return submitCommentOrReply(e, this, {
      url: `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments/${this.comment?.metadata.name}/reply`,
      request: replyRequest,
      onSuccess: (baseForm, submittedDraft) => {
        this.dispatchEvent(
          new CustomEvent('reload', {
            detail: {
              resetForm: (form: BaseForm) => form.resetForm(submittedDraft),
            },
          })
        );
        baseForm?.resetForm(submittedDraft);
        window.dispatchEvent(new CustomEvent('halo:comment-reply:created'));
      },
    });
  }
}

customElements.get('reply-form') ||
  customElements.define('reply-form', ReplyForm);

declare global {
  interface HTMLElementTagNameMap {
    'reply-form': ReplyForm;
  }
}
