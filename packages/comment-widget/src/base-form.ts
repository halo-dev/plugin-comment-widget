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
import type { ConfigMapData } from './types';
import './comment-editor';
import { when } from 'lit/directives/when.js';
import { ofetch } from 'ofetch';
import type { CommentEditor } from './comment-editor';
import { cleanHtml } from './utils/html';
import './base-tooltip';
import './turnstile-captcha';
import type { AltchaCaptcha } from './altcha-captcha';
import type { TurnstileCaptcha } from './turnstile-captcha';

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

  @state()
  private waitingForVerification = false;

  @state()
  private verificationInteractionRequired = false;

  private get showLoading() {
    if (this.submitting) {
      return true;
    }
    if (this.verificationInteractionRequired) {
      return false;
    }
    return this.waitingForVerification;
  }

  private get submitLabel() {
    if (!this.waitingForVerification) {
      return msg('Submit');
    }
    if (this.verificationInteractionRequired) {
      return msg('Please complete the verification');
    }
    return msg('Verifying…');
  }

  private handleVerificationInteraction(event: CustomEvent<boolean>) {
    this.verificationInteractionRequired = event.detail;
  }

  private get busy() {
    if (this.waitingForVerification) {
      return true;
    }
    return this.submitting;
  }

  @consume({ context: toastContext, subscribe: true })
  @state()
  toastManager: ToastManager | undefined;

  @property({ type: Boolean })
  hidePrivateCheckbox = false;

  textareaRef: Ref<HTMLTextAreaElement> = createRef<HTMLTextAreaElement>();

  editorRef: Ref<CommentEditor> = createRef<CommentEditor>();

  get customAccount() {
    return JSON.parse(
      localStorage.getItem('halo-comment-custom-account') || '{}'
    );
  }

  get parentDomId() {
    return `#comment-${[this.group?.replaceAll('.', '-'), this.kind, this.name]
      .join('-')
      .replaceAll(/-+/g, '-')}`;
  }

  get loginUrl() {
    return `/login?redirect_uri=${encodeURIComponent(
      window.location.pathname + this.parentDomId
    )}`;
  }

  @state() private altchaReady = false;
  @state() private altchaLoadFailed = false;
  private altchaLoading?: Promise<void>;

  private async loadAltchaComponent() {
    if (this.altchaReady) {
      return;
    }
    if (this.altchaLoading) {
      return this.altchaLoading;
    }
    this.altchaLoadFailed = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    this.altchaLoading = Promise.race([
      import('./altcha-captcha'),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('ALTCHA loading timed out')),
          15000
        );
      }),
    ])
      .then(() => {
        this.altchaReady = true;
      })
      .catch(() => {
        this.altchaLoadFailed = true;
      })
      .finally(() => {
        clearTimeout(timeout);
        this.altchaLoading = undefined;
      });
    return this.altchaLoading;
  }

  get useAltcha() {
    return this.configMapData?.security.captcha.type === 'ALTCHA';
  }

  get useTurnstile() {
    return this.configMapData?.security.captcha.type === 'TURNSTILE';
  }

  get showCaptcha() {
    if (this.configMapData?.captchaRequired !== true) {
      return false;
    }
    if (this.currentUser) {
      return true;
    }
    return this.allowAnonymousComments;
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (!this.showCaptcha) {
      return;
    }
    const captchaDependencies = [
      'configMapData',
      'currentUser',
      'allowAnonymousComments',
    ];
    const shouldRefreshCaptcha = captchaDependencies.some((property) =>
      changedProperties.has(property)
    );
    if (!shouldRefreshCaptcha) {
      return;
    }
    if (this.useAltcha) {
      void this.loadAltchaComponent();
      return;
    }
    this.handleFetchCaptcha();
  }

  async handleFetchCaptcha() {
    if (!this.showCaptcha || this.useTurnstile || this.useAltcha) {
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
        window.location.href = `/logout?redirect_uri=${encodeURIComponent(
          window.location.pathname + this.parentDomId
        )}`;
      } catch (error) {
        console.error('Failed to logout', error);
      }
    }
  }

  renderAccountInfo() {
    return html`<div class="form-account flex items-center gap-2">
      ${when(
        this.currentUser?.spec.avatar,
        () => html`<div class="form-account-avatar avatar"><img src=${this.currentUser?.spec.avatar || ''} class="size-full object-cover" /></div>
          `
      )}
      <span class="form-account-name text-base text-text-1 font-semibold">
        ${this.currentUser?.spec.displayName || this.currentUser?.metadata.name}
      </span>
      <button
        @click=${this.handleLogout}
        type="button"
        class="form-logout text-xs text-text-3 hover:text-text-1 px-3 transition-all py-2 rounded-base border border-muted-3 opacity-100 hover:border-muted-4 hover:opacity-70 border-solid"
        tabindex="-1"
      >
        ${msg('Logout')}
      </button>
    </div>`;
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
      <form class="form w-full flex flex-col gap-4" @submit="${this.onSubmit}">
        <comment-editor .enableEmoji=${this.configMapData?.editor?.enableEmoji !== false} ${ref(this.editorRef)} .placeholder=${this.configMapData?.editor?.placeholder}></comment-editor>

        ${when(
          !this.currentUser && this.allowAnonymousComments,
          () => html`
            <div class="form-inputs grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <input
                name="displayName"
                value=${this.customAccount.displayName}
                type="text"
                placeholder=${msg('Nicename')}
                required
                class="input"
              />
              <input
                name="email"
                value=${this.customAccount.email}
                type="email"
                placeholder=${msg('Email')}
                required
                class="input"
              />
              <input
                name="website"
                value=${this.customAccount.website}
                type="url"
                placeholder=${msg('Website')}
                class="input"
              />
              <a tabindex="-1" href=${this.loginUrl} rel="nofollow" class="form-login-link text-text-3 hover:text-text-1 text-xs transition-all select-none">${msg('(Or login)')}</a>
            </div>
          `
        )}

        <div class="form__footer">
          ${this.currentUser ? this.renderAccountInfo() : ''}
          ${when(
            !this.currentUser && !this.allowAnonymousComments,
            () => html`
              <button
                @click=${this.handleOpenLoginPage}
                class="form-login text-xs text-text-3 hover:text-text-1 px-3 transition-all py-2 rounded-base border border-muted-3 opacity-100 hover:border-muted-4 hover:opacity-70 border-solid"
                type="button"
                tabindex="-1"
              >
                ${msg('Login')}
              </button>
              `
          )}
          <div class="form-actions justify-end flex gap-3 flex-wrap items-center">
            ${when(
              !this.hidePrivateCheckbox &&
                this.configMapData?.basic.enablePrivateComment,
              () => html`<div class="flex items-center gap-2">
                      <input id="hidden" name="hidden" type="checkbox" />
                      <label for="hidden" class="text-xs select-none text-text-3 hover:text-text-1 transition-all">${msg('Private')}</label>
                      <base-tooltip content=${this.currentUser ? msg('Currently logged in. After selecting the private option, comments will only be visible to yourself and the site administrator.') : msg('You are currently anonymous. After selecting the private option, the comment will only be visible to the site administrator.')}>
                        <i class="i-mingcute:information-line size-3.5 text-text-3 block"></i>
                      </base-tooltip>
                    </div>`
            )}

            ${when(
              this.showCaptcha &&
                !this.useTurnstile &&
                !this.useAltcha &&
                this.captcha,
              () => html`
                  <div class="form-captcha gap-2 flex items-center">
                    <img
                      @click=${this.handleFetchCaptcha}
                      src="${this.captcha}"
                      alt="captcha"
                      class="h-10 rounded-base border border-gray-100 border-solid"
                    />
                    <input
                      name="captchaCode"
                      type="text"
                      placeholder=${msg('Please enter the verification code')}
                      class="input "
                    />
                  </div>
              `
            )}

            ${when(this.showCaptcha && this.useTurnstile, () => html`<turnstile-captcha @interaction-required-change=${this.handleVerificationInteraction} .siteKey=${this.configMapData?.security.captcha.turnstileSiteKey || ''}></turnstile-captcha>`)}

            ${when(
              this.showCaptcha && this.useAltcha && this.altchaReady,
              () => html`
              <comment-altcha-captcha
                .display=${this.configMapData?.security.captcha.altchaDisplay || 'floating'}
                .hideLogo=${this.configMapData?.security.captcha.altchaHideLogo === true}
                .hideFooter=${this.configMapData?.security.captcha.altchaHideFooter === true}
                .challengeUrl=${`${this.baseUrl}/apis/api.commentwidget.halo.run/v1alpha1/captcha/-/altcha`}
              ></comment-altcha-captcha>
            `
            )}

            ${when(
              this.showCaptcha && this.useAltcha && this.altchaLoadFailed,
              () => html`
              <button type="button" class="text-xs text-text-2 underline" @click=${this.loadAltchaComponent}>
                ${msg('Verification unavailable. Click to retry.')}
              </button>
            `
            )}

            <button
              .disabled=${this.busy}
              type="submit"
              class="form-submit outline-none focus:shadow-input h-12 text-sm inline-flex border border-primary-1 border-solid items-center justify-center gap-2 bg-primary-1 text-white px-3 rounded-base hover:opacity-80 transition-all"
            >
              ${when(
                this.showLoading,
                () => html`<icon-loading></icon-loading>`,
                () =>
                  html`<i class="i-mingcute-send-line size-5" aria-hidden="true"></i>`
              )}
              ${this.submitLabel}
            </button>
          </div>
        </div>
      </form>
    `;
  }

  private debouncedSubmit = debounce(async () => {
    if (this.busy) {
      return;
    }
    const characterCount =
      this.editorRef.value?.editor?.storage.characterCount.characters();

    if (!characterCount) {
      this.toastManager?.warn(msg('Please enter content'));
      this.editorRef.value?.setFocus();
      return;
    }

    let turnstileToken = '';
    let altchaPayload = '';
    if (this.showCaptcha && (this.useTurnstile || this.useAltcha)) {
      this.waitingForVerification = true;
      if (this.useAltcha) {
        await this.loadAltchaComponent();
        await this.updateComplete;
      }
      const widget = this.shadowRoot?.querySelector<
        TurnstileCaptcha | AltchaCaptcha
      >('turnstile-captcha, comment-altcha-captcha');
      this.verificationInteractionRequired =
        widget?.interactionRequired ?? false;
      this.waitingForVerification = true;
      let token = '';
      try {
        token = (await widget?.waitForToken()) ?? '';
      } finally {
        this.waitingForVerification = false;
      }
      if (!this.isConnected) {
        return;
      }
      if (!token) {
        this.toastManager?.warn(
          msg('Verification unavailable. Click to retry.')
        );
        return;
      }
      if (this.useAltcha) {
        altchaPayload = token;
      } else {
        turnstileToken = token;
      }
    }
    // Read the current draft after verification so edits made while waiting are retained.
    const form = this.shadowRoot?.querySelector('form');
    if (!form?.reportValidity()) {
      return;
    }
    if (!this.editorRef.value?.editor?.storage.characterCount.characters()) {
      this.toastManager?.warn(msg('Please enter content'));
      this.editorRef.value?.setFocus();
      return;
    }
    const content = cleanHtml(this.editorRef.value?.editor?.getHTML());
    const data = Object.fromEntries(new FormData(form).entries());
    const event = new CustomEvent('submit', {
      detail: {
        ...data,
        turnstileToken,
        altchaPayload,
        content,
        hidden: data.hidden === 'on',
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

    this.debouncedSubmit();
  }

  resetVerification() {
    this.shadowRoot
      ?.querySelector<AltchaCaptcha>('comment-altcha-captcha')
      ?.reset();
    this.shadowRoot
      ?.querySelector<TurnstileCaptcha>('turnstile-captcha')
      ?.reset();
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
    ...baseStyles,
    css`
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
