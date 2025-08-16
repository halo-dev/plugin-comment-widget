import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import type { TemplateResult } from 'lit';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import baseStyles from './styles/base';

/**
 * A simple tooltip component based on Lit and floating-ui.
 *
 * @example
 * ```html
 * <base-tooltip content="This is a tooltip">
 *   <button>Hover me</button>
 * </base-tooltip>
 * ```
 */
export class BaseTooltip extends LitElement {
  /**
   * The content to display in the tooltip.
   */
  @property({ type: String })
  content: string | TemplateResult = '';

  private tooltipEl?: HTMLElement;
  private cleanupFn?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('mouseenter', this._showTooltip);
    this.addEventListener('mouseleave', this._hideTooltip);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('mouseenter', this._showTooltip);
    this.removeEventListener('mouseleave', this._hideTooltip);

    // Clean up positioning if needed
    if (this.cleanupFn) {
      this.cleanupFn();
      this.cleanupFn = undefined;
    }
  }

  override firstUpdated(): void {
    // Get tooltip element after the component is rendered
    this.tooltipEl = this.shadowRoot?.querySelector('.tooltip') as HTMLElement;
  }

  private _showTooltip = (): void => {
    if (!this.tooltipEl) return;

    this.tooltipEl.classList.add('show');
    this._updatePosition();
  };

  private _hideTooltip = (): void => {
    if (!this.tooltipEl) return;

    this.tooltipEl.classList.remove('show');

    // Clean up positioning
    if (this.cleanupFn) {
      this.cleanupFn();
      this.cleanupFn = undefined;
    }
  };

  private _updatePosition(): void {
    if (!this.tooltipEl) return;

    const floating = this.tooltipEl;

    // Clean up previous positioning if any
    if (this.cleanupFn) {
      this.cleanupFn();
    }

    // Use autoUpdate to reposition on scroll/resize
    this.cleanupFn = autoUpdate(this, floating, async () => {
      // Calculate the position
      const middlewares = [
        offset(8), // 8px distance from trigger
        flip(), // flip to other side if needed
        shift({ padding: 5 }), // shift to keep in viewport
      ];

      // Calculate position
      const { x, y } = await computePosition(this, floating, {
        placement: 'top', // Default placement is top
        middleware: middlewares,
      });

      // Position the tooltip
      Object.assign(floating.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  override render() {
    return html`
      <slot></slot>
      <div class="tooltip">
        ${this.content}
      </div>
    `;
  }

  static override styles = [
    ...baseStyles,
    css`
      :host {
        display: inline-block;
      }

      ::slotted(*) {
        display: inline-block;
      }

      .tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.875em;
        max-width: 300px; 
        width: auto; 
        z-index: 10;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        top: 0;
        left: 0;
        white-space: normal;
        word-wrap: break-word;
      }

      .tooltip.show {
        opacity: 1;
      }
    `,
  ];
}

customElements.get('base-tooltip') ||
  customElements.define('base-tooltip', BaseTooltip);

declare global {
  interface HTMLElementTagNameMap {
    'base-tooltip': BaseTooltip;
  }
}
