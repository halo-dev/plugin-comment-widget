import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import baseStyles from './styles/base';
import { commentLink } from './utils/comment-link';
import { formatDate, timeAgo } from './utils/date';

export class CommentLink extends LitElement {
  @property() commentName = '';
  @property() replyName = '';
  @property() creationTime = '';
  @state() private open = false;
  @state() private feedback = '';
  private cleanup?: () => void;

  private outside = (event: Event) => {
    if (!event.composedPath().includes(this)) this.close();
  };

  override disconnectedCallback() {
    this.close();
    super.disconnectedCallback();
  }

  private close(restoreFocus = false) {
    this.open = false;
    this.cleanup?.();
    this.cleanup = undefined;
    document.removeEventListener('click', this.outside);
    if (restoreFocus)
      this.renderRoot.querySelector<HTMLButtonElement>('.trigger')?.focus();
  }

  private async toggle() {
    if (this.open) return this.close();
    this.open = true;
    this.feedback = '';
    await this.updateComplete;
    if (!this.open || !this.isConnected) return;
    const trigger = this.renderRoot.querySelector<HTMLElement>('.trigger');
    const panel = this.renderRoot.querySelector<HTMLElement>('.panel');
    if (!trigger || !panel) return;
    this.cleanup = autoUpdate(trigger, panel, async () => {
      const { x, y } = await computePosition(trigger, panel, {
        placement: 'bottom-start',
        strategy: 'fixed',
        middleware: [offset(8), flip(), shift({ padding: 12 })],
      });
      Object.assign(panel.style, { left: `${x}px`, top: `${y}px` });
    });
    document.addEventListener('click', this.outside);
    this.selectLink();
  }

  private selectLink() {
    const input = this.renderRoot.querySelector('input');
    input?.focus();
    input?.select();
  }

  private async copy() {
    try {
      await navigator.clipboard.writeText(
        commentLink(this.commentName, this.replyName)
      );
      this.feedback = msg('Link copied');
    } catch {
      this.selectLink();
      this.feedback = msg('Select and copy the link manually');
    }
  }

  override render() {
    return html`<span @keydown=${(event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.open) {
        event.preventDefault();
        event.stopPropagation();
        this.close(true);
      }
    }}>
      <button class="trigger" type="button" aria-expanded=${this.open} aria-controls="comment-link-panel" @click=${this.toggle} title=${msg('Comment link')}>
        <time datetime=${this.creationTime} title=${formatDate(this.creationTime)}>${timeAgo(this.creationTime)}</time>
      </button>
      ${
        this.open
          ? html`<div id="comment-link-panel" class="panel bg-muted-3 text-text-1 rounded-base border border-muted-1 shadow-lg">
        <div class="date">${formatDate(this.creationTime)}</div>
        <div class="link-row">
          <input aria-label=${msg('Comment link')} readonly .value=${commentLink(this.commentName, this.replyName)} @click=${this.selectLink} />
          <button class="copy" type="button" @click=${this.copy}>${msg('Copy link')}</button>
        </div>
        <span role="status">${this.feedback}</span>
      </div>`
          : ''
      }
    </span>`;
  }

  static override styles = [
    ...baseStyles,
    css`
    :host { display: inline-flex; font-size: 0.75rem; color: var(--halo-cw-text-3-color, #475569); }
    .trigger { cursor: pointer; text-underline-offset: 3px; }
    .trigger:hover { text-decoration: underline; }
    .panel { position: fixed; z-index: 100; padding: 1em; width: min(32rem, calc(100vw - 24px)); box-sizing: border-box; font-size: 0.875rem; }
    .date { margin-bottom: 0.75em; }
    .link-row { display: flex; gap: 0.75em; align-items: center; }
    input { min-width: 0; flex: 1; border: 1px solid var(--halo-cw-muted-1-color, #cbd5e1); border-radius: var(--halo-cw-base-rounded, 0.5em); padding: 0.5em; background: var(--halo-cw-muted-3-color, #f1f5f9); }
    .copy { flex: none; cursor: pointer; }
    [role=status]:not(:empty) { display: block; margin-top: 0.5em; }
    button:focus-visible, input:focus-visible { outline: 2px solid var(--halo-cw-primary-1-color, #4ccba0); outline-offset: 2px; }
    @unocss-placeholder;
  `,
  ];
}

customElements.get('comment-link') ||
  customElements.define('comment-link', CommentLink);
