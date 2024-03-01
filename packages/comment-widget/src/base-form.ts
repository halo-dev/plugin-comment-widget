import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import resetStyles from './styles/reset';
import { Picker } from 'emoji-mart';
import {
  allowAnonymousCommentsContext,
  currentUserContext,
  emojiDataUrlContext,
  groupContext,
  kindContext,
  nameContext,
} from './context';
import { consume } from '@lit/context';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import './icons/icon-loading';
import { User } from '@halo-dev/api-client/index';

@customElement('base-form')
export class BaseForm extends LitElement {
  @consume({ context: currentUserContext, subscribe: true })
  @state()
  currentUser: User | undefined;

  @consume({ context: allowAnonymousCommentsContext, subscribe: true })
  @state()
  allowAnonymousComments = false;

  @consume({ context: groupContext })
  @state()
  group = '';

  @consume({ context: kindContext })
  @state()
  kind = '';

  @consume({ context: nameContext })
  @state()
  name = '';

  @consume({ context: emojiDataUrlContext })
  @state()
  emojiDataUrl = '';

  @state()
  emojiLoading = false;

  @state()
  emojiPicker: Picker | null = null;

  emojiPickerWrapperRef: Ref<HTMLDivElement> = createRef<HTMLDivElement>();

  textareaRef: Ref<HTMLTextAreaElement> = createRef<HTMLTextAreaElement>();

  @state()
  emojiPickerVisible = false;

  get customAccount() {
    return JSON.parse(
      localStorage.getItem('halo-comment-custom-account') || '{}'
    );
  }

  get loginUrl() {
    const parentDomId = `#comment-${[
      this.group?.replaceAll('.', '-'),
      this.kind,
      this.name,
    ]
      .join('-')
      .replaceAll(/-+/g, '-')}`;

    return `/console/login?redirect_uri=${encodeURIComponent(
      window.location.href + parentDomId
    )}`;
  }

  handleOpenLoginPage() {
    window.location.href = this.loginUrl;
  }

  async handleOpenEmojiPicker() {
    if (this.emojiPickerVisible) {
      this.emojiPickerVisible = false;
      return;
    }

    if (this.emojiPickerWrapperRef.value?.children.length) {
      this.emojiPickerVisible = true;
      return;
    }

    this.emojiLoading = true;

    const response = await fetch(this.emojiDataUrl);
    const data = await response.json();

    const emojiPicker = new Picker({
      data,
      onEmojiSelect: ({ native }: { native: string }) => {
        if (this.textareaRef.value) {
          this.textareaRef.value.value += native;
          this.textareaRef.value.focus();
        }
      },
      theme: 'light',
    });

    // TODO: fix this ts error
    this.emojiPickerWrapperRef.value?.appendChild(
      emojiPicker as unknown as Node
    );

    this.emojiPickerVisible = true;
    this.emojiLoading = false;
  }

  renderAccountInfo() {
    return html`<div class="base-form-account-info">
      ${this.currentUser?.spec.avatar
        ? html`<img src=${this.currentUser.spec.avatar} />`
        : ''}
      <span>
        ${this.currentUser?.spec.displayName || this.currentUser?.metadata.name}
      </span>
      <button type="button" class="base-form-account-btn-logout">
        退出登录
      </button>
    </div>`;
  }

  override render() {
    return html`
      <form class="base-form" @submit="${this.onSubmit}">
        <textarea
          class="base-form-editor"
          ${ref(this.textareaRef)}
          placeholder="编写评论"
          rows="4"
          name="content"
          required
        ></textarea>

        ${!this.currentUser && this.allowAnonymousComments
          ? html`<div class="base-form-anonymous-inputs">
              <input
                name="displayName"
                value=${this.customAccount.displayName}
                type="text"
                placeholder="昵称"
                required
              />
              <input
                name="email"
                value=${this.customAccount.email}
                type="email"
                placeholder="电子邮件"
                required
              />
              <input
                name="website"
                value=${this.customAccount.website}
                type="url"
                placeholder="网站"
              />
              <a href=${this.loginUrl}> （已有该站点的账号） </a>
            </div>`
          : ''}

        <div class="base-form-footer">
          <div class="base-form-account">
            ${this.currentUser ? this.renderAccountInfo() : ''}
            ${!this.currentUser && !this.allowAnonymousComments
              ? html`<button
                  @click=${this.handleOpenLoginPage}
                  class="base-form-account-btn-login"
                  type="button"
                >
                  登录
                </button> `
              : ''}
          </div>
          <div class="base-form-actions">
            <button class="base-form-btn-emoji" type="button">
              ${this.emojiLoading
                ? html` <icon-loading></icon-loading>`
                : html` <svg
                    viewBox="0 0 24 24"
                    width="1.25rem"
                    height="1.25rem"
                    @click=${this.handleOpenEmojiPicker}
                  >
                    <path
                      fill="currentColor"
                      d="M5.5 2C3.56 2 2 3.56 2 5.5v13C2 20.44 3.56 22 5.5 22H16l6-6V5.5C22 3.56 20.44 2 18.5 2h-13m.25 2h12.5A1.75 1.75 0 0 1 20 5.75V15h-1.5c-1.94 0-3.5 1.56-3.5 3.5V20H5.75A1.75 1.75 0 0 1 4 18.25V5.75A1.75 1.75 0 0 1 5.75 4m8.69 2.77c-.16 0-.32.02-.47.06c-.94.26-1.47 1.22-1.23 2.17c.05.15.12.3.21.44l3.23-.88c0-.17-.02-.34-.06-.51c-.21-.75-.9-1.28-1.68-1.28M8.17 8.5c-.17 0-.32 0-.47.05c-.93.26-1.48 1.22-1.23 2.15c.03.16.12.3.21.46l3.23-.88c0-.17-.02-.34-.06-.5A1.72 1.72 0 0 0 8.17 8.5m8.55 2.76l-9.13 2.51a5.266 5.266 0 0 0 5.36 1.64a5.273 5.273 0 0 0 3.77-4.15Z"
                    ></path>
                  </svg>`}

              <div
                class="base-form-emoji-panel"
                style="display: ${this.emojiPickerVisible ? 'block' : 'none'}"
                ${ref(this.emojiPickerWrapperRef)}
              ></div>
            </button>
            <button type="submit" class="base-form-btn-submit">
              <svg
                viewBox="0 0 24 24"
                width="1.2em"
                height="1.2em"
                class="h-full w-full"
              >
                <path
                  fill="currentColor"
                  d="M8 7.71L18 12L8 16.29v-3.34l7.14-.95L8 11.05V7.71M12 2a10 10 0 0 1 10 10a10 10 0 0 1-10 10A10 10 0 0 1 2 12A10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8a8 8 0 0 0 8 8a8 8 0 0 0 8-8a8 8 0 0 0-8-8Z"
                ></path>
              </svg>
              提交评论
            </button>
          </div>
        </div>
      </form>
    `;
  }

  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // store account info
    localStorage.setItem(
      'halo-comment-custom-account',
      JSON.stringify({
        displayName: data.displayName,
        email: data.email,
        website: data.website,
      })
    );

    const event = new CustomEvent('submit', {
      detail: data,
    });
    this.dispatchEvent(event);
  }

  resetForm() {
    const form = this.shadowRoot?.querySelector('form');
    form?.reset();
  }

  static override styles = [
    resetStyles,
    css`
      .base-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .base-form-editor {
        height: auto;
      }

      .base-form-anonymous-inputs {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.5rem;
        align-items: center;
      }

      @media (max-width: 640px) {
        .base-form-anonymous-inputs {
          grid-template-columns: 1fr;
        }
      }

      .base-form-anonymous-inputs a {
        font-size: 0.75rem;
        line-height: 1rem;
        color: #4b5563;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
        user-select: none;
      }

      .base-form-anonymous-inputs a:hover {
        color: #111827;
      }

      input,
      textarea {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background: #fff;
        border: 0.05rem solid #bcc3ce;
        border-radius: 0.3rem;
        color: #3b4351;
        display: block;
        font-size: 0.875rem;
        height: 2.25rem;
        max-width: 100%;
        outline: 0;
        padding: 0.4rem 0.75rem;
        width: 100%;
        transition: background 0.2s, border 0.2s, box-shadow 0.2s, color 0.2s;
      }

      input:focus,
      textarea:focus {
        border-color: #5755d9;
        box-shadow: 0 0 0 0.1rem rgba(87, 85, 217, 0.2);
      }

      .base-form-account-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .base-form-account-info img {
        height: 2rem;
        width: 2rem;
        border-radius: 9999px;
      }

      .base-form-account-info span {
        font-weight: 500;
        font-size: 0.875rem;
      }

      .base-form-account-btn-logout,
      .base-form-account-btn-login {
        appearance: none;
        background: none;
        border: 1px solid #f2f4f8;
        color: #333;
        font-size: 0.75rem;
        border-radius: 4px;
        outline: none;
        padding: 0 0.75rem;
        height: 1.75rem;
        user-select: none;
      }

      .base-form-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .base-form-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .base-form-btn-emoji {
        display: inline-flex;
        color: #4b5563;
        position: relative;
      }

      .base-form-btn-emoji:hover {
        color: #333;
      }

      .base-form-emoji-panel {
        position: absolute;
        top: 2rem;
        right: 0;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
        border-radius: 0.875rem;
        overflow: hidden;
      }

      @media (max-width: 640px) {
        .base-form-emoji-panel {
          right: -7.8rem;
        }
      }

      .base-form-btn-submit {
        display: inline-flex;
        height: 2.25rem;
        flex-shrink: 0;
        user-select: none;
        appearance: none;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        border-style: none;
        padding-left: 1rem;
        padding-right: 1rem;
        text-align: center;
        vertical-align: middle;
        font-size: 0.875rem;
        line-height: 1.25rem;
        text-decoration-line: none;
        outline-width: 0px;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 0.15s;
        background-color: #0d1731;
        color: #fff;
        gap: 0.5rem;
      }

      .base-form-btn-submit:hover {
        opacity: 0.9;
      }

      .base-form-btn-submit:active {
        opacity: 0.8;
      }

      .base-form-btn-submit:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'base-form': BaseForm;
  }
}
