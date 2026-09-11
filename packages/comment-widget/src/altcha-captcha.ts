import { msg } from '@lit/localize';
import type { AltchaWidgetElement } from 'altcha';
import altchaStyles from 'altcha/altcha.css?inline';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { getLocale } from './locale';
import baseStyles from './styles/base';

export class AltchaCaptcha extends LitElement {
  @property() challengeUrl = '';
  @property({ reflect: true }) display: 'standard' | 'floating' = 'floating';
  @property({ type: Boolean }) hideLogo = false;
  @property({ type: Boolean }) hideFooter = false;

  get interactionRequired() {
    return this.display === 'standard' && !this.token;
  }

  private standardReady?: Promise<AltchaWidgetElement | undefined>;
  private resolveManual?: (token: string) => void;
  private manualTimeout?: ReturnType<typeof setTimeout>;
  @state() private ready = false;
  @state() private failed = false;
  private pending?: Promise<string>;
  private controller?: AbortController;
  private token = '';
  private expiresAt = 0;
  private generation = 0;

  override connectedCallback() {
    super.connectedCallback();
    void this.updateComplete.then(() => {
      if (this.display === 'standard') {
        void this.loadStandardWidget();
      }
    });
  }

  private loadStandardWidget() {
    this.standardReady ??= this.configureWidget().catch(() => {
      this.failed = true;
      this.standardReady = undefined;
      return undefined;
    });
    return this.standardReady;
  }

  private async waitForManualToken(): Promise<string> {
    const widget = await this.loadStandardWidget();
    if (!widget || !this.isConnected) {
      return '';
    }
    if (widget.getState() === 'verified') {
      return this.token;
    }
    this.pending ??= new Promise<string>((resolve) => {
      this.resolveManual = resolve;
    });
    return this.pending;
  }

  private handleStateChange(
    event: CustomEvent<{ state: string; payload?: string }>
  ) {
    if (this.display !== 'standard') {
      return;
    }
    const { state, payload } = event.detail;
    clearTimeout(this.manualTimeout);
    if (state === 'verifying') {
      this.failed = false;
      this.manualTimeout = setTimeout(() => {
        this.reset();
        this.failed = true;
      }, 60000);
    }
    this.token = state === 'verified' ? payload || '' : '';
    if (state === 'verified' || state === 'error') {
      this.resolveManual?.(this.token);
      this.resolveManual = undefined;
      this.pending = undefined;
    }
  }

  waitForToken(): Promise<string> {
    if (!this.isConnected) {
      return Promise.resolve('');
    }
    if (this.display === 'standard') {
      return this.waitForManualToken();
    }
    if (this.token && Date.now() < this.expiresAt) {
      return Promise.resolve(this.token);
    }
    if (this.pending) {
      return this.pending;
    }
    this.pending = this.verify();
    return this.pending;
  }

  private async verify(): Promise<string> {
    const generation = ++this.generation;
    this.failed = false;
    this.token = '';
    const controller = new AbortController();
    this.controller = controller;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cancelled = new Promise<string>((resolve) => {
      controller.signal.addEventListener('abort', () => resolve(''), {
        once: true,
      });
      timeout = setTimeout(() => controller.abort(), 60000);
    });
    try {
      const payload = await Promise.race([this.solve(controller), cancelled]);
      if (generation !== this.generation || !this.isConnected) {
        return '';
      }
      if (!payload) {
        this.failed = true;
        return '';
      }
      this.token = payload;
      return payload;
    } catch {
      if (generation === this.generation) {
        this.failed = true;
      }
      return '';
    } finally {
      clearTimeout(timeout);
      if (generation === this.generation) {
        this.pending = undefined;
      }
    }
  }

  private async loadLanguage(): Promise<string> {
    // Language packs register themselves after the ALTCHA runtime has loaded.
    try {
      switch (getLocale()) {
        case 'zh-CN':
          await import('altcha/i18n/zh-cn');
          return 'zh-cn';
        case 'zh-TW':
          await import('altcha/i18n/zh-tw');
          return 'zh-tw';
        case 'es':
          await import('altcha/i18n/es-es');
          return 'es-es';
        default:
          return 'en';
      }
    } catch {
      // Translation download failures must not prevent verification.
      return 'en';
    }
  }

  private async configureWidget(controller?: AbortController) {
    this.ready = false;
    await import('altcha');
    const language = await this.loadLanguage();
    await this.updateComplete;
    if (controller?.signal.aborted || !this.isConnected) {
      return undefined;
    }
    const widget =
      this.renderRoot.querySelector<AltchaWidgetElement>('altcha-widget');
    if (!widget || !this.challengeUrl) {
      return undefined;
    }
    widget.reset();
    await widget.configure({
      challenge: this.challengeUrl,
      language,
      auto: 'off',
      display: this.display,
      hideLogo: this.hideLogo,
      hideFooter: this.hideFooter,
      // The widget cannot find the form across this component's shadow root.
      floatingAnchor:
        this.parentElement?.querySelector<HTMLButtonElement>(
          'button[type="submit"]'
        ) ?? undefined,
      type: 'switch',
      workers: 2,
      // Keep network cancellation tied to the same bounded verification attempt.
      fetch: (input, init) => {
        if (!controller) {
          this.controller = new AbortController();
        }
        return fetch(input, {
          ...init,
          signal: controller?.signal ?? this.controller?.signal ?? init?.signal,
        });
      },
    });
    this.ready = true;
    return widget;
  }

  private async solve(controller: AbortController): Promise<string> {
    const widget = await this.configureWidget(controller);
    if (!widget || controller.signal.aborted) {
      return '';
    }
    widget.show();
    const result = await widget.verify({ controller });
    if (controller.signal.aborted || !result?.payload) {
      return '';
    }
    const expiresAt = result.challenge?.parameters.expiresAt;
    if (!expiresAt) {
      return '';
    }
    this.expiresAt = expiresAt * 1000 - 5000;
    return result.payload;
  }

  reset() {
    this.generation++;
    clearTimeout(this.manualTimeout);
    this.controller?.abort();
    this.resolveManual?.('');
    this.resolveManual = undefined;
    this.pending = undefined;
    this.token = '';
    this.expiresAt = 0;
    this.failed = false;
    const widget =
      this.renderRoot.querySelector<AltchaWidgetElement>('altcha-widget');
    widget?.reset?.();
    if (this.display === 'floating') {
      widget?.hide?.();
    }
  }

  override disconnectedCallback() {
    this.reset();
    this.ready = false;
    this.standardReady = undefined;
    super.disconnectedCallback();
  }

  static override styles = [
    ...baseStyles,
    // ALTCHA renders in light DOM, inside this component's shadow root.
    unsafeCSS(altchaStyles.replaceAll(':root', ':host')),
    css`:host { display: block; max-width: 100%; flex-shrink: 0; } :host([display="standard"]) { width: 320px; } @unocss-placeholder;`,
  ];

  override render() {
    return html`
      <altcha-widget ?hidden=${!this.ready} @statechange=${this.handleStateChange} auto="off" display=${this.display} type="switch"></altcha-widget>
      ${when(
        this.failed,
        () => html`
        <button type="button" class="text-xs text-text-2 underline"
          @click=${() => this.waitForToken()}>
          ${msg('Verification unavailable. Click to retry.')}
        </button>
      `
      )}
    `;
  }
}

if (!customElements.get('comment-altcha-captcha')) {
  customElements.define('comment-altcha-captcha', AltchaCaptcha);
}
