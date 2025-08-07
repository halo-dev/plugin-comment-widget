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
    super.disconnectedCallback();
  }

  handleClickOutside(event: Event) {
    if (this.emojiPickerVisible && !event.composedPath().includes(this)) {
      this.emojiPickerVisible = false;
    }
  }

  async handleOpenEmojiPicker() {
    if (this.emojiPickerVisible) {
      this.emojiPickerVisible = false;
      return;
    }

    if (this.emojiPickerWrapperRef.value?.children.length) {
      this.emojiPickerVisible = true;
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
  }

  override render() {
    return html`<div
      role="button"
      class="relative size-7 flex items-center justify-center cursor-pointer"
      aria-label=${msg('Select emoticon')}
    >
      ${
        this.emojiLoading
          ? html`<icon-loading></icon-loading>`
          : html`<div
            class="i-mdi-sticker-emoji size-5 text-gray-500 hover:text-gray-900"
            @click=${this.handleOpenEmojiPicker}
          ></div>`
      }
      <div
        class="form__emoji-panel"
        ?hidden=${!this.emojiPickerVisible}
        ${ref(this.emojiPickerWrapperRef)}
      ></div>
    </div>`;
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
        top: 2em;
        right: 0;
        box-shadow: 0 0.5em 1em rgba(0, 0, 0, 0.1);
        border-radius: 0.875em;
        overflow: hidden;
        animation: fadeInUp 0.3s both;
      }

      @media (max-width: 640px) {
        .form__emoji-panel {
          right: -7.8em;
        }
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
