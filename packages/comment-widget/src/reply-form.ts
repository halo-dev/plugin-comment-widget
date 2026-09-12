import type {
  CommentVo,
  Reply,
  ReplyRequest,
  ReplyVo,
  User,
} from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import './base-form';
import { msg } from '@lit/localize';
import { FetchError, type FetchResponse } from 'ofetch';
import type { BaseForm } from './base-form';
import {
  allowAnonymousCommentsContext,
  baseUrlContext,
  currentUserContext,
  toastContext,
} from './context';
import type { ToastManager } from './lit-toast';
import type { ProblemDetail } from './types';
import {
  type CaptchaRequiredResponse,
  getAltchaHeader,
  getCaptchaCodeHeader,
  getCaptchaMessage,
  isRequireCaptcha,
} from './utils/captcha';
import {
  isPendingReview,
  type SubmissionEvent,
  submissionErrorMessage,
} from './utils/submission';

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

  async onSubmit(e: SubmissionEvent) {
    e.preventDefault();

    this.submitting = true;

    const data = e.detail;
    const baseForm = this.baseFormRef.value;
    const submittedDraft = baseForm?.getDraftSnapshot();

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
      this.toastManager?.warn(msg('Please login first'));
      this.submitting = false;
      return;
    }

    if (!this.currentUser && this.allowAnonymousComments) {
      if (!displayName || !email) {
        this.toastManager?.warn(
          msg('Please log in or complete the information first')
        );
        this.submitting = false;
        return;
      } else {
        replyRequest.owner = {
          displayName: displayName,
          email: email,
          website: website,
        };
      }
    }

    try {
      const newReply = await data.uploadSession.submit<Reply>(
        `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments/${this.comment?.metadata.name}/reply`,
        replyRequest,
        data.uploadIds,
        {
          ...getCaptchaCodeHeader(data.captchaCode ?? '', data.turnstileToken),
          ...getAltchaHeader(data.altchaPayload),
        },
        this.baseUrl
      );

      this.baseFormRef.value?.handleFetchCaptcha();

      if (!isPendingReview(newReply)) {
        this.toastManager?.success(msg('Comment submitted successfully'));
      } else {
        this.toastManager?.success(
          msg('Comment submitted successfully, pending review')
        );
      }

      this.dispatchEvent(
        new CustomEvent('reload', {
          detail: {
            resetForm: (form: BaseForm) => form.resetForm(submittedDraft),
          },
        })
      );
      baseForm?.resetForm(submittedDraft);
      window.dispatchEvent(new CustomEvent('halo:comment-reply:created'));
    } catch (error) {
      this.reportSubmissionError(error);
    } finally {
      this.baseFormRef.value?.resetVerification();
      this.submitting = false;
    }
  }
  private reportSubmissionError(error: unknown) {
    if (error instanceof FetchError) {
      if (
        isRequireCaptcha(
          error.response as FetchResponse<CaptchaRequiredResponse>
        )
      ) {
        const response = error.data as CaptchaRequiredResponse;
        this.captcha = response.captcha ?? '';
        this.toastManager?.warn(getCaptchaMessage(response));
        return;
      }

      const problemDetail = error.data as unknown as ProblemDetail;
      this.toastManager?.error(
        [problemDetail?.title, problemDetail?.detail].join(' - ') ||
          msg('Comment failed, please try again later')
      );
      return;
    }

    this.toastManager?.error(submissionErrorMessage(error));
  }
}

customElements.get('reply-form') ||
  customElements.define('reply-form', ReplyForm);

declare global {
  interface HTMLElementTagNameMap {
    'reply-form': ReplyForm;
  }
}
