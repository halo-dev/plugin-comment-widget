import type { Comment, CommentRequest, User } from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import './base-form';
import { msg } from '@lit/localize';
import { FetchError, type FetchResponse } from 'ofetch';
import type { BaseForm } from './base-form';
import {
  allowAnonymousCommentsContext,
  baseUrlContext,
  currentUserContext,
  groupContext,
  kindContext,
  nameContext,
  toastContext,
  versionContext,
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

export class CommentForm extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @consume({ context: currentUserContext, subscribe: true })
  @state()
  currentUser: User | undefined;

  @consume({ context: groupContext })
  @state()
  group = '';

  @consume({ context: kindContext })
  @state()
  kind = '';

  @consume({ context: nameContext })
  @state()
  name = '';

  @consume({ context: versionContext })
  @state()
  version = 'v1alpha1';

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

  override render() {
    return html` <base-form
      .submitting=${this.submitting}
      .captcha=${this.captcha}
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

    const { displayName, email, website, content, hidden } = data || {};

    const commentRequest: CommentRequest = {
      raw: content,
      content: content,
      // TODO: support user input
      allowNotification: true,
      hidden: hidden || false,
      subjectRef: {
        group: this.group,
        kind: this.kind,
        name: this.name,
        version: this.version,
      },
    };

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
        commentRequest.owner = {
          displayName: displayName,
          email: email,
          website: website,
        };
      }
    }

    try {
      const newComment = await data.uploadSession.submit<Comment>(
        `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments`,
        commentRequest,
        data.uploadIds,
        {
          ...getCaptchaCodeHeader(data.captchaCode ?? '', data.turnstileToken),
          ...getAltchaHeader(data.altchaPayload),
        },
        this.baseUrl
      );

      this.baseFormRef.value?.handleFetchCaptcha();

      if (!isPendingReview(newComment)) {
        this.toastManager?.success(msg('Comment submitted successfully'));
      } else {
        this.toastManager?.success(
          msg('Comment submitted successfully, pending review')
        );
      }

      baseForm?.resetForm(submittedDraft);
      window.dispatchEvent(new CustomEvent('halo:comment:created'));
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

customElements.get('comment-form') ||
  customElements.define('comment-form', CommentForm);

declare global {
  interface HTMLElementTagNameMap {
    'comment-form': CommentForm;
  }
}
