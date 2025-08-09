import './icons/icon-loading';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import baseStyles from './styles/base';

export class UserAvatar extends LitElement {
  @property({ type: String })
  src: string | undefined;

  @property({ type: String })
  alt: string | undefined;

  @property({ type: String })
  href: string | undefined;

  @state()
  error = false;

  @state()
  loading = false;

  override async connectedCallback() {
    super.connectedCallback();
    await this.loadImage();
  }

  async loadImage() {
    if (!this.src) {
      return Promise.resolve();
    }
    this.loading = true;
    try {
      await new Promise((resolve) => {
        const img = new Image();
        img.src = this.src || '';
        img.onload = () => {
          this.error = false;
          resolve(null);
        };
        img.onerror = () => {
          this.error = true;
          resolve(null);
        };
      });
    } catch (_e) {
      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  getPlaceholderText() {
    if (!this.alt) {
      return undefined;
    }
    const words = this.alt.split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    if (words.length > 1) {
      return (
        words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase()
      );
    }
    return undefined;
  }

  override render() {
    if (this.href) {
      return html`<a class="avatar" href="${this.href}" target="_blank" rel="noopener noreferrer">
        ${this.renderAvatarContent()}
      </a>`;
    }

    return html`<div class="avatar">
      ${this.renderAvatarContent()}
    </div>`;
  }

  renderAvatarContent() {
    if (!this.src) {
      return html`<span class="avatar-placeholder text-sm font-medium text-text-1 select-none">${this.getPlaceholderText()}</span>`;
    }

    if (this.loading) {
      return html`<icon-loading></icon-loading>`;
    }

    if (this.error) {
      return html`<i class="i-tabler:alert-circle size-5"></i>`;
    }

    return html`<img class="avatar-image size-full object-cover" src="${this.src}" alt="${this.alt || ''}" loading="lazy" />`;
  }

  static override styles = [
    ...baseStyles,
    css`
      @unocss-placeholder;
    `,
  ];
}

customElements.get('user-avatar') ||
  customElements.define('user-avatar', UserAvatar);

declare global {
  interface HTMLElementTagNameMap {
    'user-avatar': UserAvatar;
  }
}
