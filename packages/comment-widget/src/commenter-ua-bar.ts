import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import type { UAParser } from 'ua-parser-js';
import haloLogo from './assets/halo.png';
import baseStyles from './styles/base';

const OS_ICON_MAP = {
  Windows: 'i-logos:microsoft-windows-icon',
  macOS: 'i-logos:apple',
  Linux: 'i-logos:linux-tux',
  Android: 'i-logos:android-icon',
  iOS: 'i-logos:apple',
  'Chrome OS': 'i-logos:chrome',
  Arch: 'i-logos:archlinux',
  Manjaro: 'i-logos:manjaro',
  Ubuntu: 'i-logos:ubuntu',
  Fedora: 'i-logos:fedora',
  HarmonyOS: 'i-simple-icons:harmonyos',
  OpenHarmony: 'i-simple-icons:harmonyos',
};

const BROWSER_ICON_MAP = {
  Chrome: 'i-logos:chrome',
  'Mobile Chrome': 'i-logos:chrome',
  'Chrome WebView': 'i-logos:chrome',
  Firefox: 'i-logos:firefox',
  'Mobile Firefox': 'i-logos:firefox',
  Safari: 'i-logos:safari',
  'Mobile Safari': 'i-logos:safari',
  Edge: 'i-logos:microsoft-edge',
  'Edge WebView': 'i-logos:microsoft-edge',
  'Edge WebView2': 'i-logos:microsoft-edge',
  Opera: 'i-logos:opera',
  'Huawei Browser': 'i-simple-icons:huawei text-[#D6000B]',
  'MIUI Browser': 'i-simple-icons:xiaomi text-[#FF6901]',
};

export class CommenterUABar extends LitElement {
  @property({ type: String })
  ua: string = '';

  @state()
  parser: UAParser | undefined;

  @state()
  isInitialized = false;

  getOSIcon(os?: string) {
    return OS_ICON_MAP[os as keyof typeof OS_ICON_MAP];
  }

  getBrowserIcon(browser?: string) {
    return BROWSER_ICON_MAP[browser as keyof typeof BROWSER_ICON_MAP];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.init();
  }

  async init() {
    const { UAParser } = await import('ua-parser-js');
    this.parser = new UAParser(this.ua);
    this.isInitialized = true;
  }

  protected override render() {
    if (!this.parser) {
      return this.renderSkeleton();
    }

    const os = this.parser.getOS();
    const browser = this.parser.getBrowser();

    if (!os.name && !browser.name) {
      const isHaloApp = this.ua.startsWith('Halo App/');

      return html`
      <div class="inline-flex items-center gap-1 bg-muted-3 rounded-base px-1.5 py-1">
        ${when(isHaloApp, () => html`<img src=${haloLogo} class="size-3 rounded-sm" />`)}
        <span class="text-xs text-text-3">${this.ua}</span>
      </div>
      `;
    }

    const osIcon = this.getOSIcon(os?.name);
    const browserIcon = this.getBrowserIcon(browser?.name);

    return html`
    <div class="inline-flex gap-2 items-center">
      ${when(
        os,
        () => html`<div class="inline-flex items-center gap-1 bg-muted-3 rounded-base px-1.5 py-1">
              ${when(osIcon, () => html`<i class="${osIcon} opacity-90 size-3" aria-hidden="true"></i>`)}
              <span class="text-xs text-text-2">${os.name}</span>
            </div>`
      )}
      ${when(
        browser,
        () => html`<div class="inline-flex items-center gap-1 bg-muted-3 rounded-base px-1.5 py-1">
              ${when(browserIcon, () => html`<i class="${browserIcon} opacity-90 size-3" aria-hidden="true"></i>`)}
              <span class="text-xs text-text-2">${[browser.name, browser.major].filter(Boolean).join(' ')}</span>
            </div>`
      )}
    </div>`;
  }

  private renderSkeleton() {
    return html`
      <div class="inline-flex gap-2 items-center">
        <div class="inline-flex items-center gap-1 bg-muted-3 rounded-base px-1.5 py-1">
          <div class="size-3 animate-pulse bg-muted-1 rounded-base"></div>
          <span class="w-10 h-3 animate-pulse bg-muted-1 rounded-base"></span>
        </div>
        <div class="inline-flex items-center gap-1 bg-muted-3 rounded-base px-1.5 py-1">
          <div class="size-3 animate-pulse bg-muted-1 rounded-base"></div>
          <span class="w-10 h-3 animate-pulse bg-muted-1 rounded-base"></span>
        </div>
      </div>
    `;
  }

  static override styles = [
    ...baseStyles,
    css`
      @unocss-placeholder;
    `,
  ];
}

customElements.get('commenter-ua-bar') ||
  customElements.define('commenter-ua-bar', CommenterUABar);

declare global {
  interface HTMLElementTagNameMap {
    'commenter-ua-bar': CommenterUABar;
  }
}
