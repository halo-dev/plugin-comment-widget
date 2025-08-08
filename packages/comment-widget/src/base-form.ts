import type { User } from '@halo-dev/api-client';
import { consume } from '@lit/context';
import { debounce } from 'es-toolkit';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import {
  allowAnonymousCommentsContext,
  baseUrlContext,
  configMapDataContext,
  currentUserContext,
  groupContext,
  kindContext,
  nameContext,
  toastContext,
} from './context';
import './icons/icon-loading';
import { msg } from '@lit/localize';
import type { ToastManager } from './lit-toast';
import baseStyles from './styles/base';
import varStyles from './styles/var';
import type { ConfigMapData } from './types';
import './comment-editor';
import { ofetch } from 'ofetch';
import type { CommentEditor } from './comment-editor';

export class BaseForm extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @consume({ context: currentUserContext, subscribe: true })
  @state()
  currentUser: User | undefined;

  @consume({ context: configMapDataContext })
  @state()
  configMapData: ConfigMapData | undefined;

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

  @property({ type: String })
  @state()
  captcha = '';

  @property({ type: Boolean })
  submitting = false;

  @consume({ context: toastContext, subscribe: true })
  @state()
  toastManager: ToastManager | undefined;

  textareaRef: Ref<HTMLTextAreaElement> = createRef<HTMLTextAreaElement>();

  editorRef: Ref<CommentEditor> = createRef<CommentEditor>();

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

    return `/login?redirect_uri=${encodeURIComponent(
      window.location.pathname + parentDomId
    )}`;
  }

  get showCaptcha() {
    return (
      this.configMapData?.security.captcha.anonymousCommentCaptcha &&
      !this.currentUser &&
      this.allowAnonymousComments
    );
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has('configMapData') ||
      changedProperties.has('currentUser') ||
      changedProperties.has('allowAnonymousComments')
    ) {
      if (this.showCaptcha) {
        this.handleFetchCaptcha();
      }
    }
  }

  async handleFetchCaptcha() {
    if (!this.showCaptcha) {
      return;
    }

    try {
      const data = await ofetch(
        `/apis/api.commentwidget.halo.run/v1alpha1/captcha/-/generate`,
        {
          parseResponse: (txt) => txt,
        }
      );

      this.captcha = data;
    } catch (error) {
      console.error(error);
      this.toastManager?.error(msg('Failed to obtain verification code'));
    }
  }

  handleOpenLoginPage() {
    window.location.href = this.loginUrl;
  }

  async handleLogout() {
    if (
      window.confirm(
        msg(
          'Click OK to jump to the logout page, Please make sure the content being edited has been saved.'
        )
      )
    ) {
      try {
        window.location.href = '/logout';
      } catch (error) {
        console.error('Failed to logout', error);
      }
    }
  }

  renderAccountInfo() {
    return html`<div class="form__account-info">
      ${
        this.currentUser?.spec.avatar
          ? html`<img src=${this.currentUser.spec.avatar} />`
          : ''
      }
      <span>
        ${this.currentUser?.spec.displayName || this.currentUser?.metadata.name}
      </span>
      <button
        @click=${this.handleLogout}
        type="button"
        class="form__button--logout"
      >
        ${msg('Logout')}
      </button>
    </div>`;
  }

  onContentInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    // reset height to auto to make sure it can grow
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      const form = this.shadowRoot?.querySelector('form');
      e.preventDefault();
      form?.requestSubmit();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeydown);
  }

  override render() {
    return html`
      <form class="form" @submit="${this.onSubmit}">
        <comment-editor ${ref(this.editorRef)}></comment-editor>

        ${
          !this.currentUser && this.allowAnonymousComments
            ? html`<div class="form__anonymous-inputs">
              <input
                name="displayName"
                value=${this.customAccount.displayName}
                type="text"
                placeholder=${msg('Nicename')}
                required
              />
              <input
                name="email"
                value=${this.customAccount.email}
                type="email"
                placeholder=${msg('Email')}
                required
              />
              <input
                name="website"
                value=${this.customAccount.website}
                type="url"
                placeholder=${msg('Website')}
              />
              <a href=${this.loginUrl} rel="nofollow">${msg('(Or login)')}</a>
            </div>`
            : ''
        }

        <div class="form__footer">
          ${this.currentUser ? this.renderAccountInfo() : ''}
          ${
            !this.currentUser && !this.allowAnonymousComments
              ? html`<button
                @click=${this.handleOpenLoginPage}
                class="form__button--login"
                type="button"
              >
                ${msg('Login')}
              </button> `
              : ''
          }
          <div class="form__actions">
            ${
              this.showCaptcha && this.captcha
                ? html`
                  <div class="form__action--captcha">
                    <input
                      name="captchaCode"
                      type="text"
                      placeholder=${msg('Please enter the verification code')}
                    />
                    <img
                      @click=${this.handleFetchCaptcha}
                      src="${this.captcha}"
                      alt="captcha"
                      width="100%"
                    />
                  </div>
                `
                : ''
            }

            <button
              .disabled=${this.submitting}
              type="submit"
              class="form__button--submit"
            >
              ${
                this.submitting
                  ? html` <icon-loading></icon-loading>`
                  : html`<i class="i-mingcute-send-line size-5"></i>`
              }
              ${msg('Submit')}
            </button>
          </div>
        </div>
      </form>
    `;
  }

  private debouncedSubmit = debounce((data: Record<string, unknown>) => {
    const content = this.editorRef.value?.editor?.getHTML() || '';
    const characterCount =
      this.editorRef.value?.editor?.storage.characterCount.characters();

    if (!characterCount) {
      this.toastManager?.warn(msg('Please enter content'));
      this.editorRef.value?.setFocus();
      return;
    }

    const event = new CustomEvent('submit', {
      detail: {
        ...data,
        content,
      },
    });
    this.dispatchEvent(event);
  }, 300);

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

    this.debouncedSubmit(data);
  }

  resetForm() {
    const form = this.shadowRoot?.querySelector('form');
    form?.reset();
    this.editorRef.value?.reset();
  }

  setFocus() {
    this.textareaRef.value?.focus();
    this.editorRef.value?.setFocus();
  }

  static override styles = [
    varStyles,
    baseStyles,
    css`

      .form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1em;
      }

      .form__editor {
        height: auto;
      }

      .form__anonymous-inputs {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.5em;
        align-items: center;
      }

      @media (max-width: 640px) {
        .form__anonymous-inputs {
          grid-template-columns: 1fr;
        }
      }

      .form__anonymous-inputs a {
        font-size: 0.75em;
        line-height: 1em;
        color: darkcyan;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
        user-select: none;
      }

      .form__anonymous-inputs a:hover {
        color: var(--base-color);
      }

      input,
      textarea {
        border-radius: var(--base-border-radius);
        background: var(--component-form-input-bg-color);
        color: var(--component-form-input-color);
        border: 0.05em solid var(--component-form-input-border-color);
        font-size: 0.875em;
        display: block;
        height: 2.65em;
        max-width: 100%;
        outline: 0;
        padding: 0.4em 0.75em;
        width: 100%;
        transition: background 0.2s, border 0.2s, box-shadow 0.2s, color 0.2s;
      }

      input:focus,
      textarea:focus {
        border-color: var(--component-form-input-border-color-focus);
        box-shadow: var(--component-form-input-box-shadow-focus);
      }

      .form__account-info {
        color: var(--base-color);
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75em;
      }

      .form__account-info img {
        height: 2em;
        width: 2em;
        border-radius: 9999px;
      }

      .form__account-info span {
        font-weight: 500;
        font-size: 0.9em;
      }

      .form__button--logout,
      .form__button--login {
        border-radius: var(--base-border-radius);
        background: var(--component-form-button-login-bg-color);
        border: 1px solid var(--component-form-button-login-border-color);
        font-size: 0.75em;
        outline: none;
        padding: 0.2rem 0.75em;
        user-select: none;
      }

      .form__button--logout:hover,
      .form__button--login:hover {
        background: var(--component-form-button-login-bg-color-hover);
      }

      .form__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75em;
      }

      .form__actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75em;
        width: 100%;
        justify-content: flex-end;
      }

      .form__action--captcha {
        display: flex;
        align-items: center;
        gap: 0.3em;
        flex-direction: row-reverse;
      }

      .form__action--captcha img {
        height: 2.25em;
        width: auto;
        border-radius: var(--base-border-radius);
      }

      .form__button--submit {
        border-radius: var(--base-border-radius);
        background-color: var(--component-form-button-submit-bg-color);
        color: var(--component-form-button-submit-color);
        border: 1px solid var(--component-form-button-submit-border-color);
        font-size: 0.875em;
        display: inline-flex;
        flex-shrink: 0;
        user-select: none;
        align-items: center;
        justify-content: center;
        padding: 0.5em 1em;
        text-align: center;
        vertical-align: middle;
        text-decoration-line: none;
        outline-width: 0px;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 0.15s;
        gap: 0.5em;
      }

      .form__button--submit:hover {
        opacity: 0.8;
        border-color: var(--component-form-button-submit-border-color-hover);
      }

      .form__button--submit:active {
        opacity: 0.7;
      }

      .form__button--submit:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      @unocss-placeholder;
    `,
  ];
}

customElements.get('base-form') || customElements.define('base-form', BaseForm);

declare global {
  interface HTMLElementTagNameMap {
    'base-form': BaseForm;
  }
}
