import { css, html, LitElement } from 'lit';
import './icons/icon-loading';

export class LoadingBlock extends LitElement {
  override render() {
    return html` <div class="loading-block flex items-center justify-center p-4">
      <icon-loading></icon-loading>
    </div>`;
  }

  static override styles = css`
    @unocss-placeholder;
  `;
}

customElements.get('loading-block') ||
  customElements.define('loading-block', LoadingBlock);

declare global {
  interface HTMLElementTagNameMap {
    'loading-block': LoadingBlock;
  }
}
