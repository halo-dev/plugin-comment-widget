import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { UAParser } from 'ua-parser-js';
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
};

export class CommenterUABar extends LitElement {
  @property({ type: String })
  ua: string = '';

  @state()
  parser: UAParser | undefined;

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
  }

  protected override render() {
    if (!this.parser) {
      return html``;
    }

    const osIcon = this.getOSIcon(this.parser.getOS().name);
    const browserIcon = this.getBrowserIcon(this.parser.getBrowser().name);

    return html`<div class="inline-flex gap-2 items-center">
      <div class="inline-flex items-center gap-1 bg-muted-3 rounded-md px-1.5 py-1">
        ${osIcon ? html`<i class="${osIcon} opacity-90 size-3"></i>` : ''}
        <span class="text-xs text-text-2">${this.parser.getOS().name}</span>
      </div>
      <div class="inline-flex items-center gap-1 bg-muted-3 rounded-md px-1.5 py-1">
        ${browserIcon ? html`<i class="${browserIcon} opacity-90 size-3"></i>` : ''}
        <span class="text-xs text-text-2">${this.parser.getBrowser().name}</span>
      </div>
    </div>`;
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
