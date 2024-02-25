import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('user-avatar')
export class UserAvatar extends LitElement {
  @property({ type: String })
  src: string | undefined;

  @property({ type: String })
  alt: string | undefined;

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
    } catch (e) {
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
    if (this.src) {
      if (this.loading) {
        return html`<div class="avatar-wrapper avatar-loading">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              style="opacity: 0.25;"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              style="opacity: 0.75;"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              fill="currentColor"
            ></path>
          </svg>
        </div>`;
      }

      if (this.error) {
        return html`<div class="avatar-wrapper avatar-error">
          <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm-1-5h2v2h-2v-2Zm0-8h2v6h-2V7Z"
            />
          </svg>
        </div>`;
      }

      return html`<div class="avatar-wrapper">
        <img src="${this.src}" alt="${this.alt || ''}" loading="lazy" />
      </div>`;
    }

    return html`<div class="avatar-wrapper">
      <span class="avatar-placeholder">${this.getPlaceholderText()}</span>
    </div>`;
  }

  static override styles = css`
    .avatar-wrapper {
      height: 2rem;
      width: 2rem;
      border-radius: 9999px;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: rgb(243 244 246);
    }

    .avatar-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-loading svg {
      height: 1.15rem;
      width: 1.15rem;
      animation: spin 1s linear infinite;
    }

    .avatar-error svg {
      height: 1.15rem;
      width: 1.15rem;
      color: rgb(255 59 48);
    }

    .avatar-placeholder {
      font-weight: 500;
      color: rgb(31 41 55);
      font-size: 0.75rem;
      line-height: 1rem;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'user-avatar': UserAvatar;
  }
}
