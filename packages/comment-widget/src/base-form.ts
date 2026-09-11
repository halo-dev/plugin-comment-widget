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
import { keyed } from 'lit/directives/keyed.js';
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

  @property({ type: String })
  commentName = '';

  @property({ type: String })
  quoteReplyName = '';

  private draftKey = '';
  private draftContent = '';
  @state() private draftHidden = false;

  protected override willUpdate() {
    const key = `halo-comment-draft:${JSON.stringify([
      new URL(this.baseUrl || '/', location.href).href,
      this.group,
      this.kind,
      this.name,
      this.commentName,
      this.quoteReplyName,
      this.currentUser?.metadata.name ?? '',
    ])}`;
    if (key === this.draftKey) {
      return;
    }
    this.draftKey = key;
    this.draftContent = '';
    this.draftHidden = false;
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    try {
      const draft = JSON.parse(localStorage.getItem(key) || 'null');
      if (typeof draft?.content === 'string') {
        this.draftContent = draft.content;
        this.draftHidden = draft.hidden === true;
        if (this.draftContent) {
          window.addEventListener('beforeunload', this.onBeforeUnload);
        }
      }
    } catch {
      // Invalid or unavailable storage must not prevent editing.
    }
  }

  private saveDraft() {
    try {
      if (this.draftContent) {
        localStorage.setItem(
          this.draftKey,
          JSON.stringify({
            content: this.draftContent,
            hidden: this.draftHidden,
          })
        );
      } else {
        localStorage.removeItem(this.draftKey);
      }
    } catch {
      // Keep editing and the unload warning available if storage is full or blocked.
    }
  }

  private onHiddenChange(event: Event) {
    this.draftHidden = (event.target as HTMLInputElement).checked;
    this.saveDraft();
  }

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

  private onBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = '';
  };

  private onEditorUpdate(
    event: CustomEvent<{ content: string; characterCount: number }>
  ) {
    this.draftContent =
      event.detail.characterCount > 0 ? event.detail.content : '';
    this.saveDraft();
    if (event.detail.characterCount > 0) {
      window.addEventListener('beforeunload', this.onBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', this.onBeforeUnload);
    }
  }

  private get privateCommentDescription() {
    return this.currentUser
      ? msg(
          'Currently logged in. After selecting the private option, comments will only be visible to yourself and the site administrator.'
        )
      : msg(
          'You are currently anonymous. After selecting the private option, the comment will only be visible to the site administrator.'
        );
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
        window.removeEventListener('beforeunload', this.onBeforeUnload);
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
        () => html`<div class="form-account-avatar avatar"><img src=${this.currentUser?.spec.avatar || ''} alt="" class="size-full object-cover" /></div>
          `
      )}
      <span class="form-account-name min-w-0 break-all text-base text-text-1 font-semibold">
        ${this.currentUser?.spec.displayName || this.currentUser?.metadata.name}
      </span>
      <button
        @click=${this.handleLogout}
        type="button"
        class="form-logout shrink-0 text-xs text-text-3 hover:text-text-1 px-3 transition-[color,border-color,opacity] py-2 rounded-base border border-muted-3 opacity-100 hover:border-muted-4 hover:opacity-70 border-solid"
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
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }

  override render() {
    return html`
      <form class="form w-full flex flex-col gap-4" @submit="${this.onSubmit}">
        ${keyed(this.draftKey, html`<comment-editor .initialContent=${this.draftContent} .enableEmoji=${this.configMapData?.editor?.enableEmoji !== false} ${ref(this.editorRef)} .placeholder=${this.configMapData?.editor?.placeholder} @update=${this.onEditorUpdate}></comment-editor>`)}

        ${when(
          !this.currentUser && this.allowAnonymousComments,
          () => html`
            <div class="form-inputs grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <input
                name="displayName"
                value=${this.customAccount.displayName}
                type="text"
                placeholder=${msg('Nicename')}
                aria-label=${msg('Nicename')}
                autocomplete="nickname"
                required
                class="input"
              />
              <input
                name="email"
                value=${this.customAccount.email}
                type="email"
                placeholder=${msg('Email')}
                aria-label=${msg('Email')}
                autocomplete="email"
                spellcheck="false"
                required
                class="input"
              />
              <input
                name="website"
                value=${this.customAccount.website}
                type="url"
                placeholder=${msg('Website')}
                aria-label=${msg('Website')}
                autocomplete="url"
                class="input"
              />
              <a href=${this.loginUrl} rel="nofollow" class="form-login-link text-text-3 hover:text-text-1 text-xs transition-colors select-none">${msg('(Or login)')}</a>
            </div>
          `
        )}

        <div class="form__footer">
          ${this.currentUser ? this.renderAccountInfo() : ''}
          ${when(
            !this.currentUser && !this.allowAnonymousComments,
            () => html`
              <a
                href=${this.loginUrl}
                rel="nofollow"
                class="form-login text-xs text-text-3 hover:text-text-1 px-3 transition-[color,border-color,opacity] py-2 rounded-base border border-muted-3 opacity-100 hover:border-muted-4 hover:opacity-70 border-solid"
              >
                ${msg('Login')}
              </a>
              `
          )}
          <div class="form-actions justify-end flex gap-3 flex-wrap items-center">
            ${when(
              !this.hidePrivateCheckbox &&
                this.configMapData?.basic.enablePrivateComment,
              () => html`<div class="flex items-center gap-2">
                      <input id="hidden" name="hidden" type="checkbox" .checked=${this.draftHidden} @change=${this.onHiddenChange} />
                      <label for="hidden" class="text-xs select-none text-text-3 hover:text-text-1 transition-colors">${msg('Private')}</label>
                      <base-tooltip content=${this.privateCommentDescription}>
                        <button type="button" aria-label=${msg('Private')} aria-describedby="private-description" class="inline-flex p-1 rounded-base hover:bg-muted-3">
                          <i class="i-mingcute:information-line size-3.5 text-text-3 block" aria-hidden="true"></i>
                        </button>
                      </base-tooltip>
                      <span id="private-description" class="sr-only">${this.privateCommentDescription}</span>
                    </div>`
            )}

            ${when(
              this.showCaptcha &&
                !this.useTurnstile &&
                !this.useAltcha &&
                this.captcha,
              () => html`
                  <div class="form-captcha gap-2 flex items-center">
                    <button type="button" class="shrink-0 rounded-base" aria-label=${msg('Refresh verification code')}
                      @click=${this.handleFetchCaptcha}
                    >
                    <img
                      src="${this.captcha}"
                      alt=""
                      class="h-10 rounded-base border border-gray-100 border-solid"
                    />
                    </button>
                    <input
                      name="captchaCode"
                      type="text"
                      placeholder=${msg('Please enter the verification code')}
                      aria-label=${msg('Please enter the verification code')}
                      autocomplete="off"
                      spellcheck="false"
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
              class="form-submit outline-none focus-visible:shadow-input h-12 text-sm inline-flex border border-primary-1 border-solid items-center justify-center gap-2 bg-primary-1 text-white px-3 rounded-base hover:opacity-80 transition-[opacity,box-shadow]"
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

  getDraftSnapshot() {
    return {
      key: this.draftKey,
      content: this.draftContent,
      hidden: this.draftHidden,
    };
  }

  resetForm(submittedDraft = this.getDraftSnapshot()) {
    try {
      const stored = JSON.parse(
        localStorage.getItem(submittedDraft.key) || 'null'
      );
      if (
        stored &&
        (stored.content !== submittedDraft.content ||
          stored.hidden !== submittedDraft.hidden)
      ) {
        return false;
      }
      localStorage.removeItem(submittedDraft.key);
    } catch {
      // A detached form cannot determine whether another editor has a newer draft.
      if (!this.isConnected) {
        return false;
      }
    }
    if (
      this.draftKey !== submittedDraft.key ||
      this.draftContent !== submittedDraft.content ||
      this.draftHidden !== submittedDraft.hidden
    ) {
      return false;
    }
    this.draftContent = '';
    this.draftHidden = false;
    this.saveDraft();
    const form = this.shadowRoot?.querySelector('form');
    form?.reset();
    this.editorRef.value?.reset();
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    return true;
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
