import type { Comment, CommentRequest, User } from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import './base-form';
import { msg } from '@lit/localize';
import { FetchError, type FetchResponse, ofetch } from 'ofetch';
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
  getCaptchaCodeHeader,
  isRequireCaptcha,
} from './utils/captcha';

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
      @submit="${this.onSubmit}"
    ></base-form>`;
  }

  async onSubmit(e: CustomEvent) {
    e.preventDefault();

    this.submitting = true;

    const data = e.detail;

    const { displayName, email, website, content } = data || {};

    const commentRequest: CommentRequest = {
      raw: content,
      content: content,
      // TODO: support user input
      allowNotification: true,
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
      const newComment = await ofetch<Comment>(
        `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments`,
        {
          method: 'POST',
          headers: {
            ...getCaptchaCodeHeader(data.captchaCode),
          },
          body: commentRequest,
        }
      );

      this.baseFormRef.value?.handleFetchCaptcha();

      if (newComment.spec.approved) {
        this.toastManager?.success(msg('Comment submitted successfully'));
      } else {
        this.toastManager?.success(
          msg('Comment submitted successfully, pending review')
        );
      }

      window.dispatchEvent(new CustomEvent('halo:comment:created'));

      this.baseFormRef.value?.resetForm();
    } catch (error) {
      if (error instanceof FetchError) {
        if (
          isRequireCaptcha(
            error.response as FetchResponse<CaptchaRequiredResponse>
          )
        ) {
          const { captcha, detail } =
            error.data as unknown as CaptchaRequiredResponse;
          this.captcha = captcha;
          this.toastManager?.warn(detail);
          return;
        }

        const problemDetail = error.data as unknown as ProblemDetail;
        this.toastManager?.error(
          [problemDetail?.title, problemDetail?.detail].join(' - ') ||
            msg('Comment failed, please try again later')
        );
        return;
      }
      this.toastManager?.error(msg('Comment failed, please try again later'));
    } finally {
      this.submitting = false;
    }
  }
}

customElements.get('comment-form') ||
  customElements.define('comment-form', CommentForm);

declare global {
  interface HTMLElementTagNameMap {
    'comment-form': CommentForm;
  }
}
