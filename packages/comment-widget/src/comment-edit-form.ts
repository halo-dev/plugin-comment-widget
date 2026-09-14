import type { CommentVo, ReplyVo } from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';
import { FetchError } from 'ofetch';
import type { CommentEditor } from './comment-editor';
import { baseUrlContext, configMapDataContext, toastContext } from './context';
import type { ToastManager } from './lit-toast';
import baseStyles from './styles/base';
import type { ConfigMapData } from './types';
import {
  fetchCommentContent,
  updateCommentContent,
} from './utils/comment-management';
import './comment-editor';
import './loading-block';
import './icons/icon-loading';

export class CommentEditForm extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @consume({ context: configMapDataContext })
  @state()
  configMapData: ConfigMapData | undefined;

  @consume({ context: toastContext, subscribe: true })
  @state()
  toastManager: ToastManager | undefined;

  @property({ attribute: false })
  target: CommentVo | ReplyVo | undefined;

  @property()
  resource: 'comments' | 'replies' = 'comments';

  @state()
  private loading = true;

  @state()
  private deleted = false;

  @state()
  private loadFailed = false;

  @state()
  private version: number | undefined;

  @state()
  private content = '';

  @state()
  private saving = false;

  @state()
  private errorMessage = '';

  private initialRaw = '';

  private editorRef: Ref<CommentEditor> = createRef<CommentEditor>();

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKeydown);
    void this.loadLatest();
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeydown);
    super.disconnectedCallback();
  }

  private onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void this.handleSave();
    }
  };

  private async loadLatest() {
    if (!this.target) {
      return;
    }
    this.loading = true;
    this.loadFailed = false;
    try {
      const latest = await fetchCommentContent(
        this.baseUrl,
        this.resource,
        this.target.metadata.name
      );
      if (latest.metadata.deletionTimestamp) {
        this.deleted = true;
        return;
      }
      this.version = latest.metadata.version ?? undefined;
      this.initialRaw = latest.spec.raw || '';
      this.content = this.initialRaw;
    } catch {
      this.loadFailed = true;
    } finally {
      this.loading = false;
    }
  }

  private onEditorUpdate(
    event: CustomEvent<{ content: string; characterCount: number }>
  ) {
    this.content = event.detail.content;
    this.errorMessage = '';
  }

  private get hasContent() {
    const body = new DOMParser().parseFromString(
      this.content,
      'text/html'
    ).body;
    return (
      !!body.textContent?.replaceAll('\u00a0', ' ').trim() ||
      Array.from(body.querySelectorAll('img[src]')).some((image) =>
        image.getAttribute('src')?.trim()
      )
    );
  }

  private get canSave() {
    return (
      !this.saving &&
      this.version !== undefined &&
      this.content !== this.initialRaw &&
      this.hasContent
    );
  }

  private async handleSave() {
    if (!this.canSave || !this.target) {
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    try {
      await updateCommentContent(
        this.baseUrl,
        this.resource,
        this.target.metadata.name,
        {
          raw: this.content,
          content: this.content,
          version: this.version as number,
        }
      );
      this.toastManager?.success(msg('Comment updated successfully'));
      this.dispatchEvent(
        new CustomEvent('comment-managed', {
          bubbles: true,
          composed: true,
          detail: {
            action: 'edit',
            restoreFocus: false,
            commentName:
              this.resource === 'replies'
                ? (this.target as ReplyVo).spec.commentName
                : undefined,
          },
        })
      );
      this.dispatchEvent(
        new CustomEvent('close', { bubbles: true, composed: true })
      );
    } catch (error) {
      this.errorMessage =
        error instanceof FetchError && error.response?.status === 409
          ? msg(
              'This comment or reply has changed. Copy your draft, then reopen the editor to load the latest version.'
            )
          : msg('Could not save. Your draft has been kept.');
      this.saving = false;
    }
  }

  private handleCancel() {
    this.dispatchEvent(
      new CustomEvent('close', { bubbles: true, composed: true })
    );
  }

  override render() {
    if (this.loading) {
      return html`<loading-block></loading-block>`;
    }
    if (this.deleted) {
      return html`<div class="edit-form-message text-sm text-text-3 py-2" role="alert">
          ${msg('This comment or reply has been deleted.')}
        </div>
        ${this.renderCancelButton()}`;
    }
    if (this.loadFailed) {
      return html`<div class="edit-form-message text-sm text-text-3 py-2" role="alert">
          ${msg('Failed to load the latest content. Please try again later.')}
        </div>
        ${this.renderCancelButton()}`;
    }
    return html`
      <comment-editor
        ${ref(this.editorRef)}
        .initialContent=${this.initialRaw}
        .disabled=${this.saving}
        .enableEmoji=${this.configMapData?.editor?.enableEmoji !== false}
        @update=${this.onEditorUpdate}
      ></comment-editor>
      ${when(
        this.errorMessage,
        () =>
          html`<p role="alert" class="text-sm text-red-500 mt-2">${this.errorMessage}</p>`
      )}
      <div class="edit-form-actions mt-2 flex justify-end items-center gap-2">
        ${this.renderCancelButton()}
        <button
          type="button"
          ?disabled=${!this.canSave}
          @click=${this.handleSave}
          class="edit-form-submit outline-none focus-visible:shadow-input h-9 text-sm inline-flex items-center justify-center gap-2 bg-primary-1 text-white px-4 rounded-base hover:opacity-80 transition-[opacity,box-shadow] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ${when(this.saving, () => html`<icon-loading></icon-loading>`)}
          ${msg('Save')}
        </button>
      </div>
    `;
  }

  private renderCancelButton() {
    return html`<button
      type="button"
      ?disabled=${this.saving}
      @click=${this.handleCancel}
      class="edit-form-cancel outline-none focus-visible:shadow-input h-9 px-3 text-sm text-text-2 hover:text-text-1 hover:bg-muted-3 rounded-base transition-[color,background-color,box-shadow] disabled:opacity-50"
    >
      ${msg('Cancel')}
    </button>`;
  }

  static override styles = [
    ...baseStyles,
    css`
      :host {
        display: block;
      }
      @unocss-placeholder;
    `,
  ];
}

customElements.get('comment-edit-form') ||
  customElements.define('comment-edit-form', CommentEditForm);

declare global {
  interface HTMLElementTagNameMap {
    'comment-edit-form': CommentEditForm;
  }
}
