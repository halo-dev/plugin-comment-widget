import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import {
  allowAnonymousCommentsContext,
  baseUrlContext,
  groupContext,
  kindContext,
  nameContext,
  versionContext,
} from './context';
import { CommentRequest } from '@halo-dev/api-client';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { BaseForm } from './base-form';
import './base-form';

@customElement('comment-form')
export class CommentForm extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

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

  @consume({ context: allowAnonymousCommentsContext })
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

    const commentRequest: CommentRequest = {
      raw: data.content,
      content: data.content,
      allowNotification: false,
      subjectRef: {
        group: this.group,
        kind: this.kind,
        name: this.name,
        version: this.version,
      },
      owner: {
        displayName: data.displayName,
        email: data.email,
        website: data.website,
      },
    };

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
