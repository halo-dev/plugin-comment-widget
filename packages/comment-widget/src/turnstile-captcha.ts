import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import baseStyles from './styles/base';
import { VerificationWait } from './utils/verification-wait';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | undefined;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  if (loading) {
    return loading;
  }
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const timeout = window.setTimeout(fail, 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      loading = undefined;
      reject(new Error('Unable to load Turnstile'));
    }
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (!window.turnstile) {
        fail();
        return;
      }
      resolve(window.turnstile);
    };
    document.head.append(script);
  });
  return loading;
}

export class TurnstileCaptcha extends LitElement {
  @property() siteKey = '';
  @state() token = '';
  @state() failed = false;
  @state() interactionRequired = false;
  @state() private theme: 'light' | 'dark' = 'light';
  private colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  private themeObserver = new MutationObserver(() => this.syncTheme());
  private widgetId?: string;
  private generation = 0;
  private verificationWait = new VerificationWait(() =>
    this.failVerification()
  );

  override connectedCallback() {
    super.connectedCallback();
    for (let element: Element | null = this; element; ) {
      this.themeObserver.observe(element, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-color-scheme'],
      });
      const root = element.getRootNode();
      element =
        element.parentElement ||
        (root instanceof ShadowRoot ? root.host : null);
    }
    this.colorScheme.addEventListener('change', this.syncTheme);
    this.syncTheme();
    void this.updateComplete.then(() => this.mount());
  }

  private syncTheme = () => {
    const schemes = getComputedStyle(this).colorScheme.split(/\s+/);
    this.theme =
      schemes.includes('dark') &&
      (!schemes.includes('light') || this.colorScheme.matches)
        ? 'dark'
        : 'light';
  };

  override updated(changes: Map<string, unknown>) {
    if (changes.has('siteKey') || changes.has('theme')) {
      void this.mount();
    }
  }

  private async mount() {
    const generation = ++this.generation;
    this.removeWidget();
    this.failed = false;
    if (!this.siteKey || !this.isConnected) {
      this.failed = true;
      return;
    }
    try {
      const api = await loadTurnstile();
      if (!this.isConnected || generation !== this.generation) {
        return;
      }
      const container =
        this.renderRoot.querySelector<HTMLElement>('.challenge');
      if (!container) {
        return;
      }
      this.widgetId = api.render(container, {
        sitekey: this.siteKey,
        theme: this.theme,
        action: 'comment',
        size: 'flexible',
        appearance: 'interaction-only',
        'response-field': false,
        'before-interactive-callback': () => {
          this.setInteractionRequired(true);
        },
        'after-interactive-callback': () => {
          this.setInteractionRequired(false);
        },
        callback: (token: string) => {
          this.setInteractionRequired(false);
          this.token = token;
          this.failed = false;
          this.verificationWait.finish(token);
        },
        'expired-callback': () => {
          this.token = '';
        },
        'error-callback': () => {
          this.failVerification();
        },
        'timeout-callback': () => {
          this.failVerification();
        },
      });
    } catch {
      if (this.isConnected && generation === this.generation) {
        this.failVerification();
      }
    }
  }

  private setInteractionRequired(required: boolean) {
    this.interactionRequired = required;
    this.verificationWait.setInteractive(required);
    this.dispatchEvent(
      new CustomEvent<boolean>('interaction-required-change', {
        detail: required,
      })
    );
  }

  private failVerification() {
    this.setInteractionRequired(false);
    this.token = '';
    this.failed = true;
    this.verificationWait.finish('');
  }

  waitForToken(): Promise<string> {
    if (this.token) {
      return Promise.resolve(this.token);
    }
    if (this.failed) {
      return Promise.resolve('');
    }
    if (!this.isConnected) {
      return Promise.resolve('');
    }
    return this.verificationWait.wait(this.interactionRequired);
  }

  reset() {
    this.setInteractionRequired(false);
    this.verificationWait.finish('');
    this.failed = false;
    this.token = '';
    if (this.widgetId !== undefined) {
      window.turnstile?.reset(this.widgetId);
    }
  }

  private removeWidget() {
    this.setInteractionRequired(false);
    this.verificationWait.finish('');
    this.token = '';
    if (this.widgetId !== undefined) {
      window.turnstile?.remove(this.widgetId);
    }
    this.widgetId = undefined;
  }

  override disconnectedCallback() {
    this.themeObserver.disconnect();
    this.colorScheme.removeEventListener('change', this.syncTheme);
    this.generation++;
    this.removeWidget();
    super.disconnectedCallback();
  }

  static override styles = [
    ...baseStyles,
    css`:host { display: block; } @unocss-placeholder;`,
  ];

  override render() {
    return html`
      <div class="challenge"></div>
      ${when(
        this.failed,
        () => html`
        <button class="mt-2 text-xs text-text-2 hover:text-text-1 underline"
          type="button" @click=${this.mount}>
          ${msg('Verification unavailable. Click to retry.')}
        </button>
      `
      )}
    `;
  }
}
if (!customElements.get('turnstile-captcha')) {
  customElements.define('turnstile-captcha', TurnstileCaptcha);
}
