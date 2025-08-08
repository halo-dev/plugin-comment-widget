import './icons/icon-loading';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import en from '@emoji-mart/data/i18n/en.json';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import es from '@emoji-mart/data/i18n/es.json';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import zh from '@emoji-mart/data/i18n/zh.json';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  type Placement,
  shift,
} from '@floating-ui/dom';
import { msg } from '@lit/localize';
import type { Picker } from 'emoji-mart';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { getLocale } from './locale';
import baseStyles from './styles/base';
import varStyles from './styles/var';

const localeMap = {
  'zh-CN': zh,
  'zh-TW': zh,
  en: en,
  es: es,
};

export class EmojiButton extends LitElement {
  @state()
  emojiPickerVisible = false;

  @state()
  emojiLoading = false;

  @state()
  emojiPicker: Picker | null = null;

  emojiPickerWrapperRef: Ref<HTMLDivElement> = createRef<HTMLDivElement>();

  buttonRef: Ref<HTMLDivElement> = createRef<HTMLDivElement>();

  cleanupAutoUpdate: (() => void) | null = null;

  placement: Placement = 'bottom';

  constructor() {
    super();
    this.emojiPickerVisible = false;
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.handleClickOutside, true);
  }

  override disconnectedCallback() {
    document.removeEventListener('click', this.handleClickOutside, true);
    this.cleanupFloating();
    super.disconnectedCallback();
  }

  cleanupFloating() {
    if (this.cleanupAutoUpdate) {
      this.cleanupAutoUpdate();
      this.cleanupAutoUpdate = null;
    }
  }

  handleClickOutside(event: Event) {
    if (this.emojiPickerVisible && !event.composedPath().includes(this)) {
      this.emojiPickerVisible = false;
    }
  }

  async handleOpenEmojiPicker() {
    if (this.emojiPickerVisible) {
      this.emojiPickerVisible = false;
      this.cleanupFloating();
      return;
    }

    if (this.emojiPickerWrapperRef.value?.children.length) {
      this.emojiPickerVisible = true;
      this.setupFloating();
      return;
    }

    this.emojiLoading = true;

    const { Picker } = await import(
      /* webpackChunkName: "emoji-mart" */ 'emoji-mart'
    );

    const { default: data } = await import(
      /* webpackChunkName: "emoji-mart-data" */ '@emoji-mart/data'
    );

    const emojiPicker = new Picker({
      data,
      onEmojiSelect: ({ native }: { native: string }) => {
        this.dispatchEvent(
          new CustomEvent('emoji-select', { detail: { native } })
        );
      },
      i18n: localeMap[getLocale()],
    });

    this.emojiPickerWrapperRef.value?.appendChild(
      emojiPicker as unknown as Node
    );

    this.emojiPickerVisible = true;
    this.emojiLoading = false;
    this.setupFloating();
  }

  setupFloating() {
    if (!this.buttonRef.value || !this.emojiPickerWrapperRef.value) return;

    this.cleanupFloating();

    if (this.emojiPickerWrapperRef.value) {
      this.emojiPickerWrapperRef.value.style.zIndex = '1000';
    }

    this.cleanupAutoUpdate = autoUpdate(
      this.buttonRef.value,
      this.emojiPickerWrapperRef.value,
      () => this.updatePosition()
    );

    this.updatePosition();
  }

  async updatePosition() {
    const reference = this.buttonRef.value;
    const floating = this.emojiPickerWrapperRef.value;

    if (!reference || !floating) return;

    const { x, y } = await computePosition(reference, floating, {
      placement: this.placement,
      middleware: [
        offset({
          mainAxis: 8,
          crossAxis: 0,
          alignmentAxis: 0,
        }),
        flip(),
        shift({ padding: 8 }),
      ],
    });

    Object.assign(floating.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  override render() {
    return html`<div
      role="button"
      class="relative size-7 flex items-center justify-center cursor-pointer"
      aria-label=${msg('Select emoticon')}
      ${ref(this.buttonRef)}
    >
      ${
        this.emojiLoading
          ? html`<icon-loading></icon-loading>`
          : html`<div
            class="i-mdi-sticker-emoji size-5 text-gray-500 hover:text-gray-900"
            @click=${this.handleOpenEmojiPicker}
          ></div>`
      }
    </div>
    <div
      class="form__emoji-panel"
      ?hidden=${!this.emojiPickerVisible}
      ${ref(this.emojiPickerWrapperRef)}
    ></div>`;
  }

  static override styles = [
    varStyles,
    baseStyles,
    css`
      :host {
        display: inline-flex;
      }

      @unocss-placeholder;

      em-emoji-picker {
        --rgb-color: var(--component-emoji-picker-rgb-color);
        --rgb-accent: var(--component-emoji-picker-rgb-accent);
        --rgb-background: var(--component-emoji-picker-rgb-background);
        --rgb-input: var(--component-emoji-picker-rgb-input);
        --color-border: var(--component-emoji-picker-color-border);
        --color-border-over: var(--component-emoji-picker-color-border-over);
      }

      .form__emoji-panel {
        position: absolute;
        box-shadow: 0 0.5em 1em rgba(0, 0, 0, 0.1);
        border-radius: 0.875em;
        overflow: hidden;
        animation: fadeInUp 0.3s both;
        z-index: 1000;
      }
      


      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translate3d(0, 5%, 0);
        }

        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }
    `,
  ];
}

customElements.get('emoji-button') ||
  customElements.define('emoji-button', EmojiButton);

declare global {
  interface HTMLElementTagNameMap {
    'emoji-button': EmojiButton;
  }
}
