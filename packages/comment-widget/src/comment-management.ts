import type { CommentVo, ReplyVo } from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  baseUrlContext,
  canManageCommentsContext,
  toastContext,
} from './context';
import type { ToastManager } from './lit-toast';
import baseStyles from './styles/base';
import {
  type ManagementAction,
  manageComment,
} from './utils/comment-management';

export class CommentManagement extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @consume({ context: canManageCommentsContext, subscribe: true })
  @state()
  canManage = false;

  @consume({ context: toastContext, subscribe: true })
  @state()
  toastManager: ToastManager | undefined;

  @property({ attribute: false })
  target: CommentVo | ReplyVo | undefined;

  @property()
  resource: 'comments' | 'replies' = 'comments';

  @state()
  busy = false;

  private close(restoreFocus = false) {
    const details = this.renderRoot.querySelector('details');
    if (details?.open) {
      details.open = false;
      if (restoreFocus) details.querySelector('summary')?.focus();
    }
  }

  private onOutsideClick = (event: Event) => {
    if (!event.composedPath().includes(this)) this.close();
  };

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.onOutsideClick);
  }

  override disconnectedCallback() {
    document.removeEventListener('click', this.onOutsideClick);
    super.disconnectedCallback();
  }

  private async run(action: ManagementAction) {
    if (
      !this.canManage ||
      this.busy ||
      !this.target ||
      this.target.metadata.deletionTimestamp
    )
      return;
    if (
      action === 'delete' &&
      !window.confirm(
        this.resource === 'replies'
          ? msg('Delete this reply? This cannot be undone.')
          : msg('Delete this comment and its replies? This cannot be undone.')
      )
    )
      return;
    const restoreFocus = this.matches(':focus-within');
    this.busy = true;
    try {
      await manageComment(
        this.baseUrl,
        this.resource,
        this.target.metadata.name,
        action
      );
      this.close(action !== 'delete');
      this.toastManager?.success(msg('Operation successful'));
      this.dispatchEvent(
        new CustomEvent('comment-managed', {
          bubbles: true,
          composed: true,
          detail: {
            action,
            restoreFocus,
            commentName:
              this.resource === 'replies'
                ? (this.target as ReplyVo).spec.commentName
                : undefined,
          },
        })
      );
    } catch {
      this.toastManager?.error(msg('Operation failed. Please try again.'));
    } finally {
      this.busy = false;
    }
  }

  override render() {
    if (
      !this.canManage ||
      !this.target ||
      this.target.metadata.deletionTimestamp
    )
      return html``;
    return html`<details @keydown=${(event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.close(true);
      }
    }}>
      <summary class="icon-button group">
        <span class="icon-button-icon"><i class="i-tabler:settings size-4" aria-hidden="true"></i></span>
        <span class="icon-button-text">${msg('Manage')}</span>
      </summary>
      <div class="actions bg-muted-3 text-text-1 rounded-base border border-muted-1 p-1 shadow-lg" aria-busy=${this.busy}>
        ${
          this.resource === 'comments'
            ? html`
          <button type="button" ?disabled=${this.busy} @click=${() => this.run(this.target?.spec.top ? 'unpin' : 'pin')}>
            ${this.target.spec.top ? msg('Unpin') : msg('Pin')}
          </button>
        `
            : ''
        }
        <button type="button" ?disabled=${this.busy} @click=${() => this.run(this.target?.spec.approved ? 'unapprove' : 'approve')}>
          ${this.target.spec.approved ? msg('Cancel approval') : msg('Approve')}
        </button>
        <button type="button" ?disabled=${this.busy} @click=${() => this.run(this.target?.spec.hidden ? 'unhide' : 'hide')}>
          ${this.target.spec.hidden ? msg('Unhide') : msg('Hide')}
        </button>
        <button type="button" class="text-red-500" ?disabled=${this.busy} @click=${() => this.run('delete')}>
          ${msg('Delete')}
        </button>
      </div>
    </details>`;
  }

  static override styles = [
    ...baseStyles,
    css`
      :host { display: inline-flex; }
      details { position: relative; }
      summary { list-style: none; }
      summary::-webkit-details-marker { display: none; }
      .actions { position: absolute; right: 0; top: 100%; z-index: 10; min-width: 9em; }
      button { display: block; width: 100%; text-align: start; padding: 0.5em 0.75em; font-size: 0.875em; white-space: nowrap; border-radius: var(--halo-cw-base-rounded, 0.5em); }
      button:hover, button:focus-visible { background: var(--halo-cw-muted-2-color, #e2e8f0); }
      button:disabled { opacity: 0.5; cursor: wait; }
      @unocss-placeholder;
    `,
  ];
}

customElements.get('comment-management') ||
  customElements.define('comment-management', CommentManagement);
