import type { CommentRequest, User } from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import './base-form';
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
import { type SubmissionEvent, submitCommentOrReply } from './utils/submission';

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

  onSubmit(e: SubmissionEvent) {
    const data = e.detail;
    const { content, hidden } = data || {};

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

    return submitCommentOrReply(e, this, {
      url: `${this.baseUrl}/apis/api.halo.run/v1alpha1/comments`,
      request: commentRequest,
      onSuccess: (baseForm, submittedDraft) => {
        baseForm?.resetForm(submittedDraft);
        window.dispatchEvent(new CustomEvent('halo:comment:created'));
      },
    });
  }
}

customElements.get('comment-form') ||
  customElements.define('comment-form', CommentForm);

declare global {
  interface HTMLElementTagNameMap {
    'comment-form': CommentForm;
  }
}
