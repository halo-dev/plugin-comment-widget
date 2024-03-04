import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import './icons/icon-loading';

@customElement('loading-block')
export class LoadingBlock extends LitElement {
  override render() {
    return html` <div class="loading-block">
      <icon-loading></icon-loading>
    </div>`;
  }

  static override styles = css`
    .loading-block {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1em;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'loading-block': LoadingBlock;
  }
}
