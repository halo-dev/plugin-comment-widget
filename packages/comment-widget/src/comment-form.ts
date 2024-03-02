import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import {
  allowAnonymousCommentsContext,
  baseUrlContext,
  currentUserContext,
  groupContext,
  kindContext,
  nameContext,
  versionContext,
} from './context';
import { CommentRequest, User } from '@halo-dev/api-client';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { BaseForm } from './base-form';
import './base-form';

@customElement('comment-form')
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
      alert('请先登录');
      return;
    }

    if (!this.currentUser && this.allowAnonymousComments) {
      if (!displayName || !email) {
        alert('请先登录或者完善信息');
        return;
      } else {
        commentRequest.owner = {
          displayName: displayName,
          email: email,
          website: website,
        };
      }
    }

    await fetch(`${this.baseUrl}/apis/api.halo.run/v1alpha1/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentRequest),
    });

    const event = new CustomEvent('reload');
    this.dispatchEvent(event);

    this.baseFormRef.value?.resetForm();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'comment-form': CommentForm;
  }
}
